import { useEffect, useState } from "react";
import { axiosApiInstanceAuth } from "../../api/axios";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { setNewUser } from "../../redux/auth/authSlice";
import { addUIToast } from "../../redux/uiToast/uiToastSlice";
import { Profile } from "../../modals/User";
import { useNavigate } from "react-router-dom";

const MAX_LENGTH = 150;
const MAX_LINES = 8;

const ProfileCaptionConfiguration = () => {
  const [caption, setCaption] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.profileCaption) setCaption(user.profileCaption);
  }, []);

  const handleOnChange = (val: string) => {
    if (val.length > MAX_LENGTH) return;
    if (val.split("\n").length > MAX_LINES) return;
    setCaption(val);
    if (isError) setIsError(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);
    await axiosApiInstanceAuth
      .request({
        url: "/accounts/me/update-bio",
        method: "post",
        data: caption.trim(),
        headers: { "Content-Type": "text/plain" },
      })
      .then(() => {
        dispatch(setNewUser({ ...user, profileCaption: caption.trim() } as Profile));
        dispatch(addUIToast({ type: "success", message: "Profile caption updated!" }));
        navigate(-1);
      })
      .catch((err) => {
        console.log(err);
        setIsError(true);
        dispatch(addUIToast({ type: "error", message: "Failed to update caption. Please try again." }));
      })
      .finally(() => setIsLoading(false));
  };

  const isUnchanged = caption.trim() === (user?.profileCaption ?? "");
  const charsLeft = MAX_LENGTH - caption.length;

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">

      {/* Current caption */}
      <div className="bg-[#13161d] border border-white/10 rounded-xl px-4 py-3 flex flex-col gap-0.5">
        <span className="text-xs text-white/30 uppercase tracking-wider font-medium">Current</span>
        <p className="text-white/60 text-sm line-clamp-3">
          {user?.profileCaption && user.profileCaption !== "" ? user.profileCaption : <span className="text-white/25 italic">No caption set</span>}
        </p>
      </div>

      {/* Textarea */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs text-white/40 uppercase tracking-wider font-medium">
            Caption
          </label>
          <span className={`text-xs font-medium ${charsLeft < 20 ? "text-gold" : "text-white/30"}`}>
            {charsLeft} left
          </span>
        </div>
        <textarea
          value={caption}
          onChange={(e) => handleOnChange(e.target.value)}
          placeholder="Write something about yourself..."
          rows={4}
          className="w-full bg-[#1c1f27] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-primary/50 transition-colors duration-200 resize-none placeholder:text-white/25"
        />
        <p className="text-xs text-white/25">
          Shown on your public profile · Max {MAX_LENGTH} characters · Max {MAX_LINES} lines
        </p>

        {/* Formatting hints */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 flex flex-col gap-2">
          <p className="text-[11px] text-white/35 uppercase tracking-wider font-medium">Formatting</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <code className="text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded font-mono">**text**</code>
              <span className="text-xs font-bold text-white/70">bold</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded font-mono">*text*</code>
              <span className="text-xs italic text-white/70">italic</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded font-mono">#word</code>
              <span className="text-xs text-blue-primary font-medium">#hashtag</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {isError && (
        <p className="text-red text-sm font-medium">Something went wrong. Please try again.</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isUnchanged || isLoading}
        className="w-full py-3 rounded-xl bg-blue-primary text-white text-sm font-semibold hover:bg-blue-primary/80 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isLoading ? "Saving..." : "Save Caption"}
      </button>

    </form>
  );
};

export default ProfileCaptionConfiguration;
