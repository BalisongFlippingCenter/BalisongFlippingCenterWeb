import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../redux/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera } from "@fortawesome/free-solid-svg-icons";

const IS_VIDEO = /\.(mp4|mov|webm|avi|mkv)(\?|$)/i;

const UserProfileBanner = () => {
  const user = useAppSelector((state) => state.auth.user);
  const navigate = useNavigate();
  // null = detecting, true = landscape, false = portrait/square
  const [isLandscape, setIsLandscape] = useState<boolean | null>(null);

  const hasBanner = Boolean(user?.bannerImg && user.bannerImg !== "");
  const isVideo = hasBanner && IS_VIDEO.test(user!.bannerImg!);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setIsLandscape(img.naturalWidth / img.naturalHeight > 1.8);
  };

  return (
    <div
      className="w-full xsm:h-[150px] md:h-[200px] lg:h-[220px] relative overflow-hidden rounded-b-3xl bg-gradient-to-b from-[#1c1f27] to-[#111318] border-b border-white/10 hover:cursor-pointer group"
      onClick={() => navigate("/configure/profile-banner")}
    >
      {hasBanner && (
        <>
          {isVideo ? (
            /* Video banner — no orientation detection needed, always cover */
            <video
              src={user!.bannerImg!}
              className="absolute inset-0 w-full h-full object-cover animate-[fadeIn_0.25s_ease-out]"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <>
              {/* Hidden preload — fires onLoad to detect orientation before anything visible renders.
                  Same src means the browser serves the visible images from cache instantly after. */}
              {isLandscape === null && (
                <img
                  src={user!.bannerImg!}
                  onLoad={handleLoad}
                  className="absolute opacity-0 w-full h-full pointer-events-none"
                  aria-hidden="true"
                  alt=""
                />
              )}

              {/* Visible layout — only mounts once orientation is known, so there is no DOM swap */}
              {isLandscape !== null && (
                <div className="absolute inset-0 animate-[fadeIn_0.25s_ease-out]">
                  {isLandscape ? (
                    <img
                      src={user!.bannerImg!}
                      className="w-full h-full object-cover object-center"
                      alt="Profile banner"
                    />
                  ) : (
                    <>
                      {/* Blurred background — desktop only, too GPU-heavy on mobile */}
                      <img
                        src={user!.bannerImg!}
                        className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-50 xsm:hidden md:block"
                        aria-hidden="true"
                        alt=""
                      />
                      {/* Mobile: cover-crop; desktop: contain centered over blur */}
                      <img
                        src={user!.bannerImg!}
                        className="absolute inset-0 w-full h-full xsm:object-cover md:object-contain"
                        alt="Profile banner"
                      />
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </>
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
