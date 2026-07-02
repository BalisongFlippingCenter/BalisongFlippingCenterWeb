import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { axiosApiInstanceAuth } from "../api/axios";
import { setNewUser } from "../redux/auth/authSlice";
import { AppDispatch } from "../redux/store";

// Shown after first-time Google sign-in (isNewUser: true from POST /auth/google).
// Backend auto-generates a temporary display name from the Google account name.
// This page lets the user replace it before entering the app.
// Endpoint: PATCH /auth/display-name { displayName } → returns full UserDto (Profile).
// Validation mirrors backend: min 4 chars, letters/digits/_/!/. only.

const DISPLAY_NAME_RE = /^[a-zA-Z0-9_!.]+$/;

const GoogleSetupPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState("");

  const trimmed  = displayName.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < 4;
  const badChars = trimmed.length > 0 && !DISPLAY_NAME_RE.test(trimmed);
  const isValid  = trimmed.length >= 4 && trimmed.length <= 30 && DISPLAY_NAME_RE.test(trimmed);

  const inlineError = tooShort
    ? "Must be at least 4 characters"
    : badChars
    ? "Only letters, numbers, _ ! . allowed"
    : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isLoading) return;
    setIsLoading(true);
    setError("");

    try {
      const res = await axiosApiInstanceAuth.request({
        url: "/auth/display-name",
        method: "patch",
        data: { displayName: trimmed },
      });
      dispatch(setNewUser(res.data));
      navigate("/community");
    } catch (err: any) {
      setError(err?.response?.data ?? "Failed to save display name. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080a0e] flex items-center justify-center px-4">
      <div className="w-full max-w-[420px] flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-white font-bold text-2xl">One last thing</h1>
          <p className="text-white/45 text-sm leading-relaxed">
            We've given you a temporary display name from your Google account.
            Pick something you actually want — this is how the community will see you.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setError(""); }}
              placeholder="e.g. BladeMaster42"
              maxLength={30}
              autoFocus
              className={`w-full bg-[#13161d] border rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 outline-none transition-colors duration-200 ${
                inlineError ? "border-red/50" : "border-white/10 focus:border-blue-primary/50"
              }`}
            />
            <div className="flex items-center justify-between px-0.5">
              {inlineError ? (
                <p className="text-red text-xs">{inlineError}</p>
              ) : (
                <p className="text-white/25 text-xs">4–30 chars · letters, numbers, _ ! . only</p>
              )}
              <p className={`text-xs flex-shrink-0 ml-2 ${trimmed.length > 25 ? "text-gold" : "text-white/25"}`}>
                {trimmed.length}/30
              </p>
            </div>
          </div>

          {error && (
            <p className="text-red text-sm font-medium text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={!isValid || isLoading}
            className="w-full py-3 rounded-xl bg-blue-primary text-white text-sm font-semibold hover:bg-blue-primary/80 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : "Continue to Balisong Flipping Center"}
          </button>
        </form>

      </div>
    </div>
  );
};

export default GoogleSetupPage;
