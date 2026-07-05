import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faFlag, faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { axiosApiInstanceAuth } from "../api/axios";
import { useAppSelector } from "../redux/hooks";

export type ReportTargetType = "POST" | "COMMENT" | "PROFILE";

interface ReportModalProps {
  isOpen:     boolean;
  onClose:    () => void;
  targetType: ReportTargetType;
  targetId:   string | number;
}

interface ReasonOption {
  value: string;
  label: string;
  description: string;
}

const POST_REASONS: ReasonOption[] = [
  { value: "SPAM",                 label: "Spam or misleading",           description: "Repetitive, irrelevant, or deceptive content" },
  { value: "ILLEGAL_LISTING",      label: "Illegal or prohibited listing", description: "Listing that may violate laws in certain jurisdictions" },
  { value: "INAPPROPRIATE_CONTENT",label: "Inappropriate content",        description: "Content that violates community standards" },
  { value: "HARASSMENT",           label: "Harassment or hate speech",    description: "Targeted harassment or discriminatory content" },
  { value: "MISINFORMATION",       label: "Misinformation",               description: "False or misleading information" },
  { value: "OTHER",                label: "Other",                        description: "Something else not listed above" },
];

const COMMENT_REASONS: ReasonOption[] = [
  { value: "SPAM",                  label: "Spam or misleading",        description: "Repetitive, irrelevant, or deceptive content" },
  { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate content",     description: "Content that violates community standards" },
  { value: "HARASSMENT",            label: "Harassment or hate speech", description: "Targeted harassment or discriminatory content" },
  { value: "OTHER",                 label: "Other",                     description: "Something else not listed above" },
];

const PROFILE_REASONS: ReasonOption[] = [
  { value: "INAPPROPRIATE_IMAGE", label: "Inappropriate image",       description: "Profile or banner image that violates community standards" },
  { value: "INAPPROPRIATE_NAME",  label: "Inappropriate display name", description: "Display name that is offensive or impersonates someone" },
  { value: "INAPPROPRIATE_BIO",   label: "Inappropriate bio",         description: "Bio or caption that violates community standards" },
  { value: "HARASSMENT",          label: "Harassment or hate speech", description: "Profile used to harass or target others" },
  { value: "OTHER",               label: "Other",                     description: "Something else not listed above" },
];

const REASON_MAP: Record<ReportTargetType, ReasonOption[]> = {
  POST:    POST_REASONS,
  COMMENT: COMMENT_REASONS,
  PROFILE: PROFILE_REASONS,
};

const TARGET_LABEL: Record<ReportTargetType, string> = {
  POST:    "post",
  COMMENT: "comment",
  PROFILE: "profile",
};

const ReportModal = ({ isOpen, onClose, targetType, targetId }: ReportModalProps) => {
  const user = useAppSelector((state) => state.auth.user);

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [note,           setNote]           = useState("");
  const [submitting,     setSubmitting]     = useState(false);
  const [submitted,      setSubmitted]      = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  const reasons = REASON_MAP[targetType];

  const reset = () => {
    setSelectedReason(null);
    setNote("");
    setSubmitting(false);
    setSubmitted(false);
    setError(null);
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setSubmitting(true);
    setError(null);
    try {
      await axiosApiInstanceAuth.post("/reports", {
        targetType,
        targetId: String(targetId),
        reason:   selectedReason,
        ...(note.trim() ? { additionalNote: note.trim() } : {}),
      });
      setSubmitted(true);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setError("You've already reported this. Our team will review it.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Sheet — slides up on mobile, centered on desktop */}
          <motion.div
            key="sheet"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0,      opacity: 1 }}
            exit={{ y: "100%",    opacity: 0 }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:inset-0 md:flex md:items-center md:justify-center md:pointer-events-none"
          >
            <div
              className="w-full md:w-[480px] md:pointer-events-auto rounded-t-3xl md:rounded-2xl border border-white/[0.08] overflow-hidden"
              style={{ background: "#13161d", boxShadow: "0 -8px 48px rgba(0,0,0,0.7)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar — mobile only */}
              <div className="md:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/15" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red/10 border border-red/20 flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={faFlag} className="text-red text-xs" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">Report {TARGET_LABEL[targetType]}</p>
                    <p className="text-white/35 text-xs">Help us keep the community safe</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-white/30 hover:text-white/70 transition-colors duration-150 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-4 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">

                {submitted ? (
                  /* Success state */
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <div className="w-14 h-14 rounded-full bg-green/10 border border-green/25 flex items-center justify-center">
                      <FontAwesomeIcon icon={faCircleCheck} className="text-green text-xl" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-white font-semibold">Report submitted</p>
                      <p className="text-white/40 text-sm leading-relaxed">
                        Thanks for helping keep the community safe. We'll review this {TARGET_LABEL[targetType]}.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="mt-2 px-6 py-2 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:text-white hover:border-white/20 transition-all duration-150"
                    >
                      Done
                    </button>
                  </div>
                ) : !user ? (
                  /* Not logged in */
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <p className="text-white/50 text-sm">You need to be logged in to report content.</p>
                  </div>
                ) : (
                  <>
                    {/* Reason list */}
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Reason</p>
                      {reasons.map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setSelectedReason(r.value)}
                          className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150 ${
                            selectedReason === r.value
                              ? "border-red/40 bg-red/5"
                              : "border-white/[0.07] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all duration-150 ${
                            selectedReason === r.value ? "border-red bg-red" : "border-white/20"
                          }`}>
                            {selectedReason === r.value && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className={`text-sm font-medium transition-colors ${selectedReason === r.value ? "text-white" : "text-white/60"}`}>
                              {r.label}
                            </span>
                            <span className="text-white/30 text-xs leading-relaxed">{r.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Optional note */}
                    {selectedReason && (
                      <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Additional context <span className="text-white/20 normal-case font-normal tracking-normal">(optional)</span></p>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          maxLength={500}
                          rows={3}
                          placeholder="Any additional details that might help our review..."
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white/70 text-sm placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors duration-150 resize-none"
                        />
                        <p className="text-white/20 text-[11px] text-right">{note.length} / 500</p>
                      </div>
                    )}

                    {/* Error */}
                    {error && (
                      <p className="text-red text-xs text-center">{error}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-1 pb-2">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 text-sm font-medium hover:text-white hover:border-white/20 transition-all duration-150"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!selectedReason || submitting}
                        className="flex-1 py-3 rounded-xl bg-red/80 border border-red/50 text-white text-sm font-semibold hover:bg-red transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {submitting ? "Submitting..." : "Submit Report"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReportModal;
