import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { setNewUser } from "../../redux/auth/authSlice";
import { Profile } from "../../modals/User";
import { axiosApiInstanceAuth } from "../../api/axios";
import { faChevronRight, faTriangleExclamation, faXmark, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { logout } from "../../redux/auth/authActions";
import { clearCollection } from "../../redux/collection/collectionSlice";

interface SettingsRowProps {
  label: string;
  value?: string;
  onClick: () => void;
  danger?: boolean;
}

const SettingsRow = ({ label, value, onClick, danger = false }: SettingsRowProps) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-colors duration-150 text-left"
  >
    <span className={`text-sm font-medium ${danger ? "text-red" : "text-white"}`}>{label}</span>
    <div className="flex items-center gap-2">
      {value && <span className="text-xs text-white/30 max-w-[160px] truncate">{value}</span>}
      {!danger && <FontAwesomeIcon icon={faChevronRight} className="text-white/20 text-xs" />}
    </div>
  </button>
);

const SectionHeader = ({ title }: { title: string }) => (
  <div className="px-1 pt-5 pb-1.5">
    <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">{title}</span>
  </div>
);

const SettingsCard = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[#13161d] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
    {children}
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="w-full flex items-center justify-between px-4 py-3.5">
    <span className="text-sm font-medium text-white">{label}</span>
    <span className="text-xs text-white/30">{value}</span>
  </div>
);

interface ToggleRowProps<T extends string> {
  label: string;
  options: { value: T; display: string }[];
  current: T | null | undefined;
  defaultValue: T;
  userField: keyof Profile;
}

function ToggleRow<T extends string>({ label, options, current, defaultValue, userField }: ToggleRowProps<T>) {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const [saving, setSaving] = useState(false);

  const active = current ?? defaultValue;

  const handleSelect = async (val: T) => {
    if (val === active || saving) return;
    setSaving(true);
    const payload = {
      measurementUnit: user?.measurementUnit ?? "imperial",
      currency: user?.currency ?? "USD",
      [userField]: val,
    };
    await axiosApiInstanceAuth
      .request({ url: "accounts/me/update-preferences", method: "post", data: payload })
      .then(() => {
        dispatch(setNewUser({ ...user, [userField]: val } as Profile));
      })
      .catch((err) => console.log(err))
      .finally(() => setSaving(false));
  };

  return (
    <div className="w-full flex items-center justify-between px-4 py-3.5">
      <span className="text-sm font-medium text-white">{label}</span>
      <div className="flex items-center gap-1 bg-[#0d0f14] border border-white/10 rounded-lg p-1">
        {options.map(({ value, display }) => {
          const isActive = active === value;
          return (
            <button
              key={value}
              type="button"
              disabled={saving}
              onClick={() => handleSelect(value)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-blue-primary text-white"
                  : "text-white/40 hover:text-white/70"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {display}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type DangerAction = "hide" | "reset" | "delete";

interface DangerConfig {
  title: string;
  description: string;
  consequence: string;
  confirmLabel: string;
  apiUrl: string;
}

const DANGER_CONFIGS: Record<DangerAction, DangerConfig> = {
  hide: {
    title: "Hide Account",
    description: "Your profile will become invisible to other users. Your posts and collection will not be publicly accessible.",
    consequence: "You can unhide your account at any time from settings.",
    confirmLabel: "Hide Account",
    apiUrl: "accounts/me/hide-account",
  },
  reset: {
    title: "Reset Account",
    description: "This will permanently erase your collection, all your posts, and reset your profile settings to default.",
    consequence: "This action cannot be undone. Your account will remain but all content will be lost.",
    confirmLabel: "Reset Account",
    apiUrl: "accounts/me/reset-account",
  },
  delete: {
    title: "Delete Account",
    description: "Your account and all associated data — posts, collection, profile — will be permanently and irreversibly removed.",
    consequence: "This action cannot be undone. You will be logged out immediately.",
    confirmLabel: "Permanently Delete",
    apiUrl: "accounts/me",
  },
};

interface DangerModalProps {
  action: DangerAction;
  onClose: () => void;
}

const DangerModal = ({ action, onClose }: DangerModalProps) => {
  const config = DANGER_CONFIGS[action];
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const handleConfirm = async () => {
    if (!password.trim() || isLoading) return;
    setIsLoading(true);
    setIsError(false);
    setErrMsg("");

    await axiosApiInstanceAuth
      .request({
        url: config.apiUrl,
        method: action === "delete" ? "delete" : "post",
        data: { password: password.trim() },
      })
      .then(() => {
        if (action === "delete" || action === "reset") {
          dispatch(clearCollection());
          dispatch(logout());
        } else {
          dispatch(setNewUser({ ...user } as Profile));
          onClose();
        }
      })
      .catch((err) => {
        setIsError(true);
        if (err.response?.status === 401) {
          setErrMsg("Incorrect password. Please try again.");
        } else {
          setErrMsg("Something went wrong. Please try again.");
        }
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal card */}
      <div className="relative w-full max-w-md bg-[#0d0f14] border border-red/30 rounded-2xl overflow-hidden shadow-2xl">

        {/* Red top accent bar */}
        <div className="h-1 w-full bg-red" />

        <div className="p-6 flex flex-col gap-5">

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red/10 border border-red/20 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faTriangleExclamation} className="text-red text-sm" />
              </div>
              <h2 className="text-white font-bold text-lg leading-tight">{config.title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white/30 hover:text-white/70 transition-colors duration-200 mt-0.5"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <p className="text-white/70 text-sm leading-relaxed">{config.description}</p>
            <p className={`text-xs leading-relaxed ${action === "hide" ? "text-white/40" : "text-red/70"}`}>
              {config.consequence}
            </p>
          </div>

          {/* Password input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/40 uppercase tracking-wider font-medium">
              Confirm with your password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (isError) { setIsError(false); setErrMsg(""); } }}
                placeholder="••••••••"
                className="w-full bg-[#1c1f27] border border-white/10 rounded-xl px-4 py-3 pr-10 text-white text-sm outline-none focus:border-red/40 transition-colors duration-200 placeholder:text-white/25"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors duration-200"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            {isError && <p className="text-red text-xs font-medium">{errMsg}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:bg-white/5 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!password.trim() || isLoading}
              className="flex-1 py-2.5 rounded-xl bg-red text-white text-sm font-semibold hover:opacity-90 transition-opacity duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? "Processing..." : config.confirmLabel}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

const ProfileConfigurePage = () => {
  const user = useAppSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [dangerModal, setDangerModal] = useState<DangerAction | null>(null);
  const [socialExpanded, setSocialExpanded] = useState(false);

  const socialLinks = [
    { label: "Facebook", value: user?.facebookLink, route: "/configure/facebook_link" },
    { label: "Instagram", value: user?.instagramLink, route: "/configure/instagram_link" },
    { label: "Twitter / X", value: user?.twitterLink, route: "/configure/twitter_link" },
    { label: "YouTube", value: user?.youtubeLink, route: "/configure/youtube_link" },
    { label: "Reddit", value: user?.redditLink, route: "/configure/reddit_link" },
    { label: "Discord", value: user?.discordLink, route: "/configure/discord_link" },
    { label: "Personal Email", value: user?.personalEmailLink, route: "/configure/personal_email_link" },
    { label: "Personal Website", value: user?.personalWebsiteLink, route: "/configure/personal_website_link" },
  ];
  const linkedCount = socialLinks.filter((l) => l.value).length;

  return (
    <section className="w-full flex justify-center pb-28 pt-14 px-4">
      <div className="w-full max-w-[640px] flex flex-col">

        <h1 className="text-white font-bold text-2xl mb-2">Settings</h1>

        {/* Profile */}
        <SectionHeader title="Profile" />
        <SettingsCard>
          <SettingsRow
            label="Profile Image"
            value={user?.profileImg ? "Set" : "Not set"}
            onClick={() => navigate("/configure/profile-image")}
          />
          <SettingsRow
            label="Profile Banner"
            value={user?.bannerImg ? "Set" : "Not set"}
            onClick={() => navigate("/configure/profile-banner")}
          />
          <SettingsRow
            label="Display Name"
            value={user?.displayName || undefined}
            onClick={() => navigate("/configure/display_name")}
          />
          <SettingsRow
            label="Profile Caption"
            onClick={() => navigate("/configure/profile_caption")}
          />
        </SettingsCard>

        {/* Social Links — collapsible */}
        <SectionHeader title="Social Links" />
        <SettingsCard>
          {/* Accordion header */}
          <button
            type="button"
            onClick={() => setSocialExpanded((p) => !p)}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-colors duration-150 text-left"
          >
            <span className="text-sm font-medium text-white">Manage Social Links</span>
            <div className="flex items-center gap-2">
              {linkedCount > 0 && (
                <span className="text-xs text-white/30">{linkedCount} linked</span>
              )}
              <FontAwesomeIcon
                icon={faChevronRight}
                className={`text-white/20 text-xs transition-transform duration-200 ${socialExpanded ? "rotate-90" : ""}`}
              />
            </div>
          </button>

          {/* Expandable rows */}
          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: socialExpanded ? `${socialLinks.length * 52}px` : "0" }}
          >
            <div className="border-t border-white/[0.06]">
              {socialLinks.map(({ label, value, route }) => (
                <SettingsRow
                  key={label}
                  label={label}
                  value={value || undefined}
                  onClick={() => navigate(route)}
                />
              ))}
            </div>
          </div>
        </SettingsCard>

        {/* Collection */}
        <SectionHeader title="Collection" />
        <SettingsCard>
          <SettingsRow
            label="Collection Banner Image"
            onClick={() => navigate("/configure/collection-banner-image")}
          />
        </SettingsCard>

        {/* App Settings */}
        <SectionHeader title="App Settings" />
        <SettingsCard>
          <ToggleRow
            label="Measurement Units"
            options={[
              { value: "imperial", display: "Imperial" },
              { value: "metric", display: "Metric" },
            ]}
            current={user?.measurementUnit}
            defaultValue="imperial"
            userField="measurementUnit"
          />
          <ToggleRow
            label="Currency"
            options={[
              { value: "USD", display: "USD" },
              { value: "EUR", display: "EUR" },
            ]}
            current={user?.currency}
            defaultValue="USD"
            userField="currency"
          />
        </SettingsCard>

        {/* Account */}
        <SectionHeader title="Account" />
        <SettingsCard>
          <SettingsRow
            label="Change Email"
            value={user?.email || undefined}
            onClick={() => navigate("/configure/email")}
          />
          <SettingsRow
            label="Change Password"
            onClick={() => navigate("/configure/password")}
          />
        </SettingsCard>

        {/* About */}
        <SectionHeader title="About" />
        <SettingsCard>
          <InfoRow label="Version" value="1.0.0" />
          <SettingsRow
            label="Contact Us"
            onClick={() => navigate("/about")}
          />
          <SettingsRow
            label="Terms of Service"
            onClick={() => navigate("/terms")}
          />
          <SettingsRow
            label="Privacy Policy"
            onClick={() => navigate("/privacy")}
          />
        </SettingsCard>

        {/* Danger Zone */}
        <SectionHeader title="Danger Zone" />
        <SettingsCard>
          <SettingsRow
            label="Hide Account"
            onClick={() => setDangerModal("hide")}
            danger
          />
          <SettingsRow
            label="Reset Account"
            onClick={() => setDangerModal("reset")}
            danger
          />
          <SettingsRow
            label="Delete Account"
            onClick={() => setDangerModal("delete")}
            danger
          />
        </SettingsCard>

      </div>

      {/* Danger confirmation modal */}
      {dangerModal && (
        <DangerModal
          action={dangerModal}
          onClose={() => setDangerModal(null)}
        />
      )}

    </section>
  );
};

export default ProfileConfigurePage;
