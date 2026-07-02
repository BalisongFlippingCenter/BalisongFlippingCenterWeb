import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faLock, faEye, faEyeSlash, faCheck } from "@fortawesome/free-solid-svg-icons";
import { axiosApiInstance } from "../../api/axios";
import OtpInput from "../../components/OtpInput";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "email" | "verify" | "password";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  const [step,            setStep]            = useState<Step>("email");
  const [email,           setEmail]           = useState("");
  const [code,            setCode]            = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [newPwFocused,    setNewPwFocused]    = useState(false);
  const [isLoading,       setIsLoading]       = useState(false);
  const [error,           setError]           = useState("");
  const [resent,          setResent]          = useState(false);
  const [success,         setSuccess]         = useState(false);

  const trimmedEmail   = email.trim();
  const emailValid     = EMAIL_RE.test(trimmedEmail);
  const hasMinLength   = newPassword.length >= 7;
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== "";
  const canReset       = hasMinLength && passwordsMatch && !isLoading;

  const clearError = () => { if (error) setError(""); };

  const goBack = () => {
    clearError();
    if (step === "password") { setStep("verify"); }
    else if (step === "verify") { setStep("email"); setCode(""); }
    else { navigate("/login"); }
  };

  const handleSendCode = async (isResend = false) => {
    setIsLoading(true);
    setError("");
    setResent(false);
    try {
      await axiosApiInstance.post("/auth/forgot-password", { email: trimmedEmail });
      if (isResend) {
        setCode("");
        setResent(true);
        setTimeout(() => setResent(false), 4000);
      } else {
        setStep("verify");
      }
    } catch (err: any) {
      const msg = err.response?.data;
      if (err.response?.status === 404) {
        setError("No account found with that email address.");
      } else {
        setError(typeof msg === "string" ? msg : "Failed to send code. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = () => {
    if (code.length !== 6) return;
    setError("");
    setStep("password");
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canReset) return;
    setIsLoading(true);
    setError("");
    try {
      await axiosApiInstance.post("/auth/confirm-forgot-password", {
        email: trimmedEmail,
        code,
        newPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data;
      if (err.response?.status === 400) {
        // Code was invalid — send user back to verify step
        setStep("verify");
        setCode("");
        setError(typeof msg === "string" ? msg : "Invalid or expired code. Please try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <section className="h-[calc(100vh_-_48px)] flex justify-center items-center px-4">
        <div className="w-full max-w-md flex flex-col items-center gap-6 text-center">
          <div className="w-14 h-14 rounded-full bg-green/10 border border-green/30 flex items-center justify-center">
            <FontAwesomeIcon icon={faLock} className="text-green text-lg" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-white font-bold text-xl">Password reset</h2>
            <p className="text-white/45 text-sm leading-relaxed">
              Your password has been updated. You can now sign in with your new password.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="px-6 py-2.5 rounded-xl bg-blue-primary text-white text-sm font-semibold hover:bg-blue-primary/80 transition-colors duration-200"
          >
            Back to Sign In
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="h-[calc(100vh_-_48px)] flex justify-center items-center px-4 py-12">
      <div
        className="w-full max-w-md rounded-xl border border-white/10 bg-dark-neutral-offset px-10 py-14 flex flex-col gap-6"
        style={{ boxShadow: "0 0 120px rgba(255,255,255,0.18), 0 0 40px rgba(255,255,255,0.08), 0 8px 48px rgba(0,0,0,0.8)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-colors duration-200 flex-shrink-0"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
          </button>
          <div>
            <p className="text-white/30 text-xs font-medium">
              <span className="text-blue-primary">Balisong</span> Flipping Center
            </p>
            <h2 className="text-white font-extrabold text-2xl leading-tight">
              {step === "email"    ? "Reset your password" :
               step === "verify"  ? "Code Verification"   :
                                    "New Password"}
            </h2>
          </div>
        </div>

        {/* ── Step 1: Email ── */}
        {step === "email" && (
          <div className="flex flex-col gap-5">
            <p className="text-white/45 text-sm leading-relaxed -mt-2">
              Enter the email address on your account and we'll send you a reset code.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-white/60 text-sm font-medium">Email</label>
              <input
                type="email"
                autoFocus
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                onKeyDown={(e) => e.key === "Enter" && emailValid && handleSendCode(false)}
                placeholder="you@example.com"
                className="w-full bg-dark-neutral border border-white/10 focus:border-blue-primary rounded-lg text-white text-sm px-4 py-3 outline-none transition-colors duration-200 placeholder:text-white/25"
              />
            </div>

            {error && <p className="text-red text-sm font-medium">{error}</p>}

            <button
              type="button"
              onClick={() => handleSendCode(false)}
              disabled={!emailValid || isLoading}
              className="w-full py-2.5 rounded-lg bg-blue-primary text-white font-semibold text-sm hover:brightness-110 transition-[filter] duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending..." : "Send Reset Code"}
            </button>

            <p className="text-center text-sm text-white/50">
              Remember it?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-blue-primary hover:brightness-125 transition-[filter] duration-200 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        )}

        {/* ── Step 2: Verify code ── */}
        {step === "verify" && (
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-1.5 text-center -mt-2">
              <p className="text-white/40 text-sm">A 6-digit code has been sent to</p>
              <p className="text-white font-semibold text-base">{trimmedEmail}</p>
            </div>

            <OtpInput value={code} onChange={(val) => { setCode(val); clearError(); }} />

            <p className="text-white/25 text-xs text-center leading-relaxed -mt-2">
              Don't see it? Check your spam folder for an email from{" "}
              <span className="text-white/40">support.balisongflippingcenter@gmail.com</span>
            </p>

            {error && <p className="text-red text-sm font-medium text-center">{error}</p>}

            <div className="flex flex-col gap-3 w-full">
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={code.length !== 6}
                className="w-full py-2.5 rounded-lg bg-blue-primary text-white font-semibold text-sm hover:brightness-110 transition-[filter] duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Verify
              </button>

              <button
                type="button"
                onClick={() => handleSendCode(true)}
                disabled={isLoading}
                className="w-full py-2.5 rounded-lg border border-white/10 text-white/40 text-sm font-semibold hover:text-white/70 hover:border-white/20 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {resent ? "Code resent — check your inbox" : "Didn't receive a code? Resend"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: New password ── */}
        {step === "password" && (
          <form onSubmit={handleReset} className="flex flex-col gap-5">
            <p className="text-white/45 text-sm leading-relaxed -mt-2">
              Choose a new password for your account.
            </p>

            {/* New password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-white/60 text-sm font-medium">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  autoFocus
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); clearError(); }}
                  onFocus={() => setNewPwFocused(true)}
                  onBlur={() => setNewPwFocused(false)}
                  placeholder="••••••••"
                  className="w-full bg-dark-neutral border border-white/10 focus:border-blue-primary rounded-lg text-white text-sm px-4 py-3 pr-10 outline-none transition-colors duration-200 placeholder:text-white/25"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors duration-200"
                >
                  <FontAwesomeIcon icon={showNew ? faEyeSlash : faEye} />
                </button>
              </div>
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: newPwFocused || newPassword.length > 0 ? "3rem" : "0", opacity: newPwFocused || newPassword.length > 0 ? 1 : 0 }}
              >
                <div className="flex items-center gap-1.5 pt-1">
                  <FontAwesomeIcon icon={faCheck} className={`text-[10px] transition-colors duration-200 ${hasMinLength ? "text-green" : "text-white/20"}`} />
                  <span className={`text-xs transition-colors duration-200 ${hasMinLength ? "text-green" : "text-white/30"}`}>At least 7 characters</span>
                </div>
              </div>
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-white/60 text-sm font-medium">Confirm Password</label>
                {confirmPassword.length > 0 && (
                  <span className={`text-xs font-medium transition-colors duration-200 ${passwordsMatch ? "text-green" : "text-red"}`}>
                    {passwordsMatch ? "Passwords match" : "Does not match"}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
                  placeholder="••••••••"
                  className="w-full bg-dark-neutral border border-white/10 focus:border-blue-primary rounded-lg text-white text-sm px-4 py-3 pr-10 outline-none transition-colors duration-200 placeholder:text-white/25"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors duration-200"
                >
                  <FontAwesomeIcon icon={showConfirm ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            {error && <p className="text-red text-sm font-medium">{error}</p>}

            <button
              type="submit"
              disabled={!canReset}
              className="w-full py-2.5 rounded-lg bg-blue-primary text-white font-semibold text-sm hover:brightness-110 transition-[filter] duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faLock} className="text-xs" />
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

export default ForgotPasswordPage;
