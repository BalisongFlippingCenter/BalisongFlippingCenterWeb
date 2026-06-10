import { useEffect, useState } from "react";
import { axiosApiInstanceAuth } from "../../api/axios";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { clearCollection } from "../../redux/collection/collectionSlice";
import { logout } from "../../redux/auth/authActions";
import { setNewUser } from "../../redux/auth/authSlice";
import { Profile } from "../../modals/User";
import { useNavigate } from "react-router-dom";

const DisplayNameConfiguration = () => {
  const [newDisplayName, setNewDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.displayName) setNewDisplayName(user.displayName);
  }, []);

  const handleOnChange = (val: string) => {
    setNewDisplayName(val);
    if (isError) {
      setIsError(false);
      setErrMsg("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = newDisplayName.trim();

    if (trimmed.length < 4) {
      setIsError(true);
      setErrMsg("Display name must be at least 4 characters long.");
      return;
    }

    if (trimmed === user?.displayName) return;

    setIsLoading(true);
    await axiosApiInstanceAuth
      .request({
        url: "/accounts/me/change-display-name",
        method: "post",
        data: trimmed,
        headers: { "Content-Type": "text/plain" },
      })
      .then((res) => {
        console.log("Display name update response:", res.data);
        // backend may return full user object or just the new display name string
        const updatedName = typeof res.data === "object" ? res.data.displayName : res.data;
        const updatedCode = typeof res.data === "object" ? res.data.identifierCode : user?.identifierCode;
        dispatch(setNewUser({ ...user, displayName: updatedName, identifierCode: updatedCode } as Profile));
        navigate(`/${updatedName}/${updatedCode}`, { replace: true });
      })
      .catch((err) => {
        console.log("Display name update error:", err);
        setIsError(true);
        setErrMsg(err.response?.data?.message ?? "Failed to update display name. Please try again.");
        if (err.response?.status === 401) {
          dispatch(clearCollection());
          dispatch(logout());
        }
      })
      .finally(() => setIsLoading(false));
  };

  const isUnchanged = newDisplayName.trim() === user?.displayName;

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">

      {/* Current handle */}
      <div className="bg-[#13161d] border border-white/10 rounded-xl px-4 py-3 flex flex-col gap-0.5">
        <span className="text-xs text-white/30 uppercase tracking-wider font-medium">Current</span>
        <div className="flex items-baseline gap-2">
          <span className="text-white font-semibold text-base">{user?.displayName}</span>
          <span className="text-white/30 text-sm font-medium">#{user?.identifierCode}</span>
        </div>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs text-white/40 uppercase tracking-wider font-medium">
            Display Name
          </label>
          <span className={`text-xs font-medium ${newDisplayName.length < 4 ? "text-red/60" : "text-white/30"}`}>
            {newDisplayName.length} / 4 min
          </span>
        </div>
        <input
          type="text"
          value={newDisplayName}
          onChange={(e) => handleOnChange(e.target.value)}
          placeholder="Enter display name"
          className="w-full bg-[#1c1f27] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-primary/50 transition-colors duration-200"
        />
        <p className="text-xs text-white/25">
          Letters, numbers and ! . _ allowed · Minimum 4 characters
        </p>
      </div>

      {/* Live preview */}
      {newDisplayName.trim().length > 0 && !isUnchanged && (
        <div className="bg-[#13161d] border border-white/10 rounded-xl px-4 py-3 flex flex-col gap-0.5">
          <span className="text-xs text-white/30 uppercase tracking-wider font-medium">Preview</span>
          <div className="flex items-baseline gap-2">
            <span className={`font-semibold text-base ${newDisplayName.trim().length >= 4 ? "text-white" : "text-white/40"}`}>
              {newDisplayName.trim() || "—"}
            </span>
            <span className="text-white/20 text-sm font-medium">#????</span>
          </div>
        </div>
      )}

      {/* Identifier code warning */}
      <div className="flex gap-2.5 bg-gold/5 border border-gold/20 rounded-xl px-4 py-3">
        <span className="text-gold text-sm mt-0.5">⚠</span>
        <p className="text-xs text-white/50 leading-relaxed">
          Changing your display name will generate a <span className="text-white/70 font-medium">new identifier code</span>. Your profile URL and handle <span className="text-white/70 font-medium">#XXXX</span> will change.
        </p>
      </div>

      {/* Error */}
      {isError && (
        <p className="text-red text-sm font-medium">{errMsg}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isUnchanged || newDisplayName.trim().length < 4 || isLoading}
        className="w-full py-3 rounded-xl bg-blue-primary text-white text-sm font-semibold hover:bg-blue-primary/80 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isLoading ? "Saving..." : "Save Display Name"}
      </button>

    </form>
  );
};

export default DisplayNameConfiguration;
