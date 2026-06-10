import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../redux/hooks";
import Image from "../Image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera } from "@fortawesome/free-solid-svg-icons";

const UserProfileBanner = () => {
  const user = useAppSelector((state) => state.auth.user);
  const navigate = useNavigate();

  return (
    <div
      className="w-full xsm:h-[130px] md:h-40 lg:h-48 relative overflow-hidden rounded-b-3xl bg-gradient-to-b from-[#1c1f27] to-[#111318] border-b border-white/10 hover:cursor-pointer group"
      onClick={() => navigate("/configure/profile-banner")}
    >
      {user?.bannerImg && user.bannerImg !== "" ? (
        <div className="w-full h-full">
          <Image imageId={user.bannerImg} />
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
