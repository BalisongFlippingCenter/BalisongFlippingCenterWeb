import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faBan, faClock, faCommentSlash, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import {
  searchAccounts, banAccount, unbanAccount, suspendAccount, unsuspendAccount, muteAccount, unmuteAccount,
  AdminAccountSummary,
} from "../../api/adminAccountsApi";
import { addUIToast } from "../../redux/uiToast/uiToastSlice";
import { useAppDispatch } from "../../redux/hooks";

const isActive = (until: string | null) => !!until && new Date(until).getTime() > Date.now();

const fmt = (until: string | null) => (until ? new Date(until).toLocaleString() : "");

// datetime-local gives "2026-09-22T14:30" (local, no seconds/zone) — Date parses that as local time
const toIsoInstant = (datetimeLocal: string) => new Date(datetimeLocal).toISOString();

interface DurationActionProps {
  label: string;
  icon: typeof faClock;
  active: boolean;
  activeUntil: string | null;
  activeReason: string | null;
  onActivate: (reason: string, until: string) => Promise<void>;
  onLift: () => Promise<void>;
}

const DurationAction = ({ label, icon, active, activeUntil, activeReason, onActivate, onLift }: DurationActionProps) => {
  const [reason, setReason] = useState("");
  const [until, setUntil] = useState("");
  const [busy, setBusy] = useState(false);

  if (active) {
    return (
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-gold/5 border border-gold/25">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-gold text-xs font-semibold">{label} until {fmt(activeUntil)}</span>
          {activeReason && <span className="text-white/40 text-xs truncate">{activeReason}</span>}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => { setBusy(true); onLift().finally(() => setBusy(false)); }}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/25 transition-colors duration-150 disabled:opacity-40 flex-shrink-0"
        >
          Lift
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-white/[0.06] bg-dark-neutral">
      <FontAwesomeIcon icon={icon} className="text-white/25 text-xs flex-shrink-0" />
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={`${label} reason`}
        className="flex-1 min-w-0 bg-transparent text-white text-xs outline-none placeholder:text-white/25"
      />
      <input
        type="datetime-local"
        value={until}
        onChange={(e) => setUntil(e.target.value)}
        className="bg-dark-neutral-offset border border-white/10 rounded text-white/70 text-xs px-2 py-1 outline-none"
      />
      <button
        type="button"
        disabled={busy || !reason.trim() || !until}
        onClick={() => {
          setBusy(true);
          onActivate(reason.trim(), toIsoInstant(until))
            .then(() => { setReason(""); setUntil(""); })
            .finally(() => setBusy(false));
        }}
        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gold/15 border border-gold/35 text-gold hover:bg-gold/20 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
      >
        {label}
      </button>
    </div>
  );
};

const AccountRow = ({ account, onChange }: { account: AdminAccountSummary; onChange: (updated: AdminAccountSummary) => void }) => {
  const dispatch = useAppDispatch();
  const [expanded, setExpanded] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banBusy, setBanBusy] = useState(false);

  const suspended = isActive(account.suspendedUntil);
  const muted = isActive(account.mutedUntil);

  const handle = (promise: Promise<AdminAccountSummary>, successMsg: string) =>
    promise
      .then((updated) => {
        onChange(updated);
        dispatch(addUIToast({ type: "success", message: successMsg }));
      })
      .catch((err: any) => {
        const msg = typeof err.response?.data === "string" ? err.response.data : "Action failed.";
        dispatch(addUIToast({ type: "error", message: msg }));
      });

  return (
    <div className="rounded-xl border border-white/[0.08] bg-dark-neutral-offset overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors duration-150 text-left"
      >
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white text-sm font-semibold">{account.displayName}#{account.identifierCode}</span>
            <span className="text-white/30 text-xs">{account.role}</span>
            {account.banned && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border bg-red/10 text-red border-red/25">Banned</span>
            )}
            {suspended && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border bg-gold/10 text-gold border-gold/25">Suspended</span>
            )}
            {muted && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border bg-blue-primary/10 text-blue-primary border-blue-primary/25">Muted</span>
            )}
          </div>
          <span className="text-white/40 text-xs truncate">{account.email}</span>
        </div>
        <FontAwesomeIcon icon={faChevronDown} className={`text-white/20 text-xs flex-shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="flex flex-col gap-3 px-5 pb-5 pt-1 border-t border-white/[0.06]">

          {/* Ban — permanent, no expiry */}
          {account.banned ? (
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-red/5 border border-red/25">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-red text-xs font-semibold">Banned</span>
                {account.banReason && <span className="text-white/40 text-xs truncate">{account.banReason}</span>}
              </div>
              <button
                type="button"
                disabled={banBusy}
                onClick={() => { setBanBusy(true); handle(unbanAccount(account.id), "Account unbanned.").finally(() => setBanBusy(false)); }}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/25 transition-colors duration-150 disabled:opacity-40 flex-shrink-0"
              >
                Unban
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-white/[0.06] bg-dark-neutral">
              <FontAwesomeIcon icon={faBan} className="text-white/25 text-xs flex-shrink-0" />
              <input
                type="text"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Ban reason"
                className="flex-1 min-w-0 bg-transparent text-white text-xs outline-none placeholder:text-white/25"
              />
              <button
                type="button"
                disabled={banBusy || !banReason.trim()}
                onClick={() => {
                  setBanBusy(true);
                  handle(banAccount(account.id, banReason.trim()), "Account banned.")
                    .then(() => setBanReason(""))
                    .finally(() => setBanBusy(false));
                }}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red/15 border border-red/35 text-red hover:bg-red/20 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                Ban
              </button>
            </div>
          )}

          {/* Suspend — temporary login lockout */}
          <DurationAction
            label="Suspend"
            icon={faClock}
            active={suspended}
            activeUntil={account.suspendedUntil}
            activeReason={account.suspendReason}
            onActivate={(reason, until) => handle(suspendAccount(account.id, reason, until), "Account suspended.")}
            onLift={() => handle(unsuspendAccount(account.id), "Suspension lifted.")}
          />

          {/* Mute — can still log in/browse, blocked from posting/commenting */}
          <DurationAction
            label="Mute"
            icon={faCommentSlash}
            active={muted}
            activeUntil={account.mutedUntil}
            activeReason={account.muteReason}
            onActivate={(reason, until) => handle(muteAccount(account.id, reason, until), "Account muted.")}
            onLift={() => handle(unmuteAccount(account.id), "Account unmuted.")}
          />
        </div>
      )}
    </div>
  );
};

const AdminAccountsPage = () => {
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminAccountSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    searchAccounts(query.trim())
      .then((res) => { setResults(res); setSearched(true); })
      .catch(() => dispatch(addUIToast({ type: "error", message: "Search failed." })))
      .finally(() => setIsLoading(false));
  };

  const handleChange = (updated: AdminAccountSummary) => {
    setResults((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  return (
    <div className="px-8 py-8 max-w-3xl">
      <h1 className="text-white text-2xl font-bold">Accounts</h1>
      <p className="text-white/40 text-sm mt-1">Search accounts to ban, suspend, or mute.</p>

      <form onSubmit={handleSearch} className="mt-6 flex gap-2">
        <div className="relative flex-1">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 text-xs" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email, display name, or identifier code"
            className="w-full bg-dark-neutral-offset border border-white/[0.08] focus:border-blue-primary rounded-lg text-white text-sm pl-9 pr-3 py-2.5 outline-none transition-colors duration-150 placeholder:text-white/25"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="px-5 py-2.5 rounded-lg bg-blue-primary text-white text-sm font-semibold hover:brightness-110 transition-[filter] duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-3">
        {searched && results.length === 0 && (
          <p className="text-white/40 text-sm">No accounts match that search.</p>
        )}
        {results.map((account) => (
          <AccountRow key={account.id} account={account} onChange={handleChange} />
        ))}
      </div>
    </div>
  );
};

export default AdminAccountsPage;
