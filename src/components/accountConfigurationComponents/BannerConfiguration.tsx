import { useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import Image from "../Image";
import { axiosApiInstanceAuth } from "../../api/axios";
import { Profile } from "../../modals/User";
import { setNewUser } from "../../redux/auth/authSlice";
import { addUIToast } from "../../redux/uiToast/uiToastSlice";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const BannerConfiguration = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleOnChange = (e: any) => {
    setSelectedFile(e[0]);
    setIsError(false);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!selectedFile) return;

    const fn = new FormData();
    fn.append("file", selectedFile);

    setIsLoading(true);
    await axiosApiInstanceAuth
      .request({
        url: "/accounts/me/update-banner-img",
        method: "post",
        data: fn,
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        const newUser = { ...user, bannerImg: res.data } as Profile;
        dispatch(setNewUser(newUser));
        dispatch(addUIToast({ type: "success", message: "Profile banner updated!" }));
        navigate(-1);
      })
      .catch((error) => {
        console.log(error);
        setIsError(true);
        dispatch(addUIToast({ type: "error", message: "Failed to update banner. Please try again." }));
      })
      .finally(() => setIsLoading(false));
  };

  const previewSrc = selectedFile ? URL.createObjectURL(selectedFile) : null;

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">

      {/* Current banner */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-white/40 uppercase tracking-wider font-medium">Current</span>
        <div className="w-full xsm:h-[120px] sm:h-[160px] md:h-[200px] rounded-2xl overflow-hidden border border-white/10 bg-[#1c1f27] flex items-center justify-center">
          {user?.bannerImg && user.bannerImg !== "" ? (
            <Image imageId={user.bannerImg} />
          ) : (
            <FontAwesomeIcon icon={faImage} className="text-white/20 text-3xl" />
          )}
        </div>
      </div>

      {/* Upload area */}
      <div className="flex flex-col gap-3">
        <span className="text-xs text-white/40 uppercase tracking-wider font-medium">New Banner</span>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full xsm:h-[120px] sm:h-[160px] md:h-[200px] rounded-2xl border border-dashed border-white/20 bg-[#13161d] hover:border-blue-primary/50 hover:bg-[#1a1d25] transition-colors duration-200 overflow-hidden relative group"
        >
          {previewSrc ? (
            <>
              <img src={previewSrc} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <span className="text-white text-sm font-medium">Change Image</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 h-full text-white/30 group-hover:text-white/50 transition-colors duration-200">
              <FontAwesomeIcon icon={faImage} className="text-3xl" />
              <span className="text-sm font-medium">Select a banner image</span>
              <span className="text-xs text-white/20">JPEG or PNG</span>
            </div>
          )}
        </button>

        <input
          type="file"
          hidden
          ref={fileInputRef}
          accept="image/jpeg, image/png"
          onChange={(e) => handleOnChange(e.target.files)}
        />
      </div>

      {/* Error */}
      {isError && (
        <p className="text-red text-sm font-medium">Something went wrong. Please try again.</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!selectedFile || isLoading}
        className="w-full py-3 rounded-xl bg-blue-primary text-white text-sm font-semibold hover:bg-blue-primary/80 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isLoading ? "Saving..." : "Save Banner"}
      </button>

    </form>
  );
};

export default BannerConfiguration;
