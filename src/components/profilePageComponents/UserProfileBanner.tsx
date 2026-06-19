import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../redux/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera } from "@fortawesome/free-solid-svg-icons";

const UserProfileBanner = () => {
  const user = useAppSelector((state) => state.auth.user);
  const navigate = useNavigate();
  // null = not loaded yet, true = landscape, false = portrait/square
  const [isLandscape, setIsLandscape] = useState<boolean | null>(null);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // Treat anything wider than 1.8:1 as landscape/banner-safe
    setIsLandscape(img.naturalWidth / img.naturalHeight > 1.8);
  };

  return (
    <div
      className="w-full xsm:h-[150px] md:h-[200px] lg:h-[220px] relative overflow-hidden rounded-b-3xl bg-gradient-to-b from-[#1c1f27] to-[#111318] border-b border-white/10 hover:cursor-pointer group"
      onClick={() => navigate("/configure/profile-banner")}
    >
      {user?.bannerImg && user.bannerImg !== "" ? (
        <div className="absolute inset-0">
          {isLandscape === true ? (
            /* Landscape/banner image — fill the space, center crop */
            <img
              src={user.bannerImg}
              onLoad={handleLoad}
              className="w-full h-full object-cover object-center"
              alt="Profile banner"
            />
          ) : (
            /* Portrait/square — show full image with blurred context fill */
            <>
              <img
                src={user.bannerImg}
                onLoad={handleLoad}
                className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-50"
                aria-hidden="true"
                alt=""
              />
              <img
                src={user.bannerImg}
                className="absolute inset-0 w-full h-full object-contain"
                alt="Profile banner"
              />
            </>
          )}
        </div>
      ) : null}

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
