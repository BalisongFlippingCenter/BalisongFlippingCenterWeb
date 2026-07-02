import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faShield, faLock } from "@fortawesome/free-solid-svg-icons";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { axiosApiInstanceAuth } from "../../api/axios";
import { setNewUser } from "../../redux/auth/authSlice";
import { Profile } from "../../modals/User";
import OtpInput from "../../components/OtpInput";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ProfileConfigurationChangeEmailPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user     = useAppSelector((state) => state.auth.user);

  const [step,      setStep]      = useState<"request" | "confirm">("request");
  const [newEmail,  setNewEmail]  = useState("");
  const [code,      setCode]      = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);
  const [resent,    setResent]    = useState(false);

  const clearError   = () => { if (error) setError(""); };
  const trimmedEmail = newEmail.trim();
  const emailValid   = EMAIL_RE.test(trimmedEmail) && trimmedEmail !== (user?.email ?? "");
  const canRequest   = emailValid && !isLoading;
  const canConfirm   = code.length === 6 && !isLoading;

  const handleRequest = async (isResend = false) => {
    setIsLoading(true);
    setError("");
    setResent(false);
    try {
      await axiosApiInstanceAuth.post("/accounts/me/request-email-change");
      if (isResend) {
        setCode("");
        setResent(true);
        setTimeout(() => setResent(false), 4000);
      } else {
        setStep("confirm");
      }
    } catch (err: any) {
      setError(err.response?.data ?? "Failed to send code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canConfirm) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await axiosApiInstanceAuth.post("/accounts/me/confirm-email-change", {
        code,
        newEmail: trimmedEmail,
      });
      dispatch(setNewUser({ ...user, email: res.data?.email ?? trimmedEmail } as Profile));
      setSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data;
      if (err.response?.status === 400) {
        setError(typeof msg === "string" ? msg : "Invalid or expired code.");
      } else if (err.response?.status === 409) {
        setError("That email is already in use.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <section className="w-full min-h-screen flex justify-center pb-28 pt-6 px-4 lg:pl-[192px] bg-[#080a0e]">
        <div className="w-full max-w-[480px] md:max-w-[640px] flex flex-col items-center justify-center gap-6 mt-24 text-center">
          <div className="w-14 h-14 rounded-full bg-green/10 border border-green/30 flex items-center justify-center">
            <FontAwesomeIcon icon={faLock} className="text-green text-lg" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-white font-bold text-xl">Email updated</h2>
            <p className="text-white/45 text-sm leading-relaxed">
              Your email has been changed to <span className="text-white/70 font-medium">{trimmedEmail}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-xl bg-blue-primary text-white text-sm font-semibold hover:bg-blue-primary/80 transition-colors duration-200"
          >
            Done
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full min-h-screen flex justify-center pb-28 pt-6 px-4 lg:pl-[192px] bg-[#080a0e]">
      <div className="w-full max-w-[480px] md:max-w-[640px] flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => step === "confirm" ? (setStep("request"), setCode(""), setError("")) : navigate(-1)}
            className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-colors duration-200"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
          </button>
          <h1 className="text-white font-bold text-xl">Change Email</h1>
        </div>

        {step === "request" ? (
          <>
            {/* Security banner */}
            <div className="flex gap-3 bg-gold/5 border border-gold/25 rounded-xl px-4 py-3.5">
              <FontAwesomeIcon icon={faShield} className="text-gold text-sm mt-0.5 flex-shrink-0" />
              <div className="flex flex-col gap-0.5">
                <p className="text-gold text-xs font-semibold">Email verification required</p>
                <p className="text-white/50 text-xs leading-relaxed">
                  A 6-digit code will be sent to your current email to verify this change.
                </p>
              </div>
            </div>

            {/* Current email */}
            <div className="bg-[#13161d] border border-white/10 rounded-xl px-4 py-3 flex flex-col gap-0.5">
              <span className="text-xs text-white/30 uppercase tracking-wider font-medium">Current Email</span>
              <p className="text-white/60 text-sm truncate">{user?.email ?? "—"}</p>
            </div>

            {/* New email input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40 uppercase tracking-wider font-medium">New Email</label>
              <input
                type="email"
                autoFocus
                value={newEmail}
                onChange={(e) => { setNewEmail(e.target.value); clearError(); }}
                placeholder="you@example.com"
                className="w-full bg-[#1c1f27] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-primary/50 transition-colors duration-200 placeholder:text-white/25"
              />
            </div>

            {error && <p className="text-red text-sm font-medium">{error}</p>}

            <button
              type="button"
              onClick={() => handleRequest()}
              disabled={!canRequest}
              className="w-full py-3 rounded-xl bg-blue-primary text-white text-sm font-semibold hover:bg-blue-primary/80 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending..." : "Change Email"}
            </button>
          </>
        ) : (
          <form onSubmit={handleConfirm} className="flex flex-col items-center gap-8 pt-6">

            {/* Title */}
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="text-white font-bold text-2xl">Code Verification</h2>
              <p className="text-white/40 text-sm">A 6-digit code has been sent to</p>
              <p className="text-white font-semibold text-base">{user?.email}</p>
            </div>

            {/* OTP boxes */}
            <OtpInput value={code} onChange={(val) => { setCode(val); clearError(); }} />

            {/* Spam hint */}
            <p className="text-white/25 text-xs text-center leading-relaxed">
              Don't see it? Check your spam folder for an email from{" "}
              <span className="text-white/40">support.balisongflippingcenter@gmail.com</span>
            </p>

            {error && <p className="text-red text-sm font-medium text-center">{error}</p>}

            <div className="flex flex-col gap-3 w-full">
              <button
                type="submit"
                disabled={!canConfirm}
                className="w-full py-3 rounded-xl bg-blue-primary text-white text-sm font-semibold hover:bg-blue-primary/80 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faLock} className="text-xs" />
                {isLoading ? "Updating..." : "Verify"}
              </button>

              <button
                type="button"
                onClick={() => handleRequest(true)}
                disabled={isLoading}
                className="w-full py-3 rounded-xl border border-white/10 text-sm font-semibold transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-white/40 hover:text-white/70 hover:border-white/20"
              >
                {resent ? "Code resent — check your inbox" : "Didn't receive a code? Resend"}
              </button>
            </div>

          </form>
        )}
      </div>
    </section>
  );
};

export default ProfileConfigurationChangeEmailPage;
