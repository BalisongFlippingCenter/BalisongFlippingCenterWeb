import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../redux/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera } from "@fortawesome/free-solid-svg-icons";

const IS_VIDEO = /\.(mp4|mov|webm|avi|mkv)(\?|$)/i;

const UserProfileBanner = () => {
  const user = useAppSelector((state) => state.auth.user);
  const navigate = useNavigate();

  const hasBanner = Boolean(user?.bannerImg && user.bannerImg !== "");
  const isVideo = hasBanner && IS_VIDEO.test(user!.bannerImg!);

  return (
    <div
      className="w-full xsm:h-[150px] md:h-[200px] lg:h-[220px] relative overflow-hidden rounded-b-3xl bg-gradient-to-b from-[#1c1f27] to-[#111318] border-b border-white/10 hover:cursor-pointer group"
      onClick={() => navigate("/configure/profile-banner")}
    >
      {hasBanner && (
        isVideo ? (
          <video
            src={user!.bannerImg!}
            className="absolute inset-0 w-full h-full object-cover animate-[fadeIn_0.25s_ease-out]"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img
            src={user!.bannerImg!}
            className="absolute inset-0 w-full h-full object-cover animate-[fadeIn_0.25s_ease-out]"
            alt="Profile banner"
          />
        )
      )}

      {/* Edit overlay */}
      <div className="absolute inset-0 flex items-end justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="w-9 h-9 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white/70">
          <FontAwesomeIcon icon={faCamera} className="text-sm" />
        </div>
      </div>
    </div>
  );
};

export default UserProfileBanner;
