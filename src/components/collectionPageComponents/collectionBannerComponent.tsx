import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../redux/hooks";
import Image from "../Image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera } from "@fortawesome/free-solid-svg-icons";

const CollectionBannerComponent = () => {
  const collectionData = useAppSelector((state) => state.collection.collection);
  const navigate       = useNavigate();

  return (
    <div className="w-full xsm:h-[136px] md:h-56 lg:h-64 relative overflow-hidden rounded-b-3xl bg-gradient-to-b from-[#1c1f27] to-[#111318] border-b border-white/10">
      {collectionData?.bannerImg && collectionData.bannerImg !== "" ? (
        <div
          className="w-full h-full hover:cursor-pointer"
          onClick={() => navigate("/configure/collection-banner-image")}
        >
          <Image imageId={collectionData.bannerImg} />
        </div>
      ) : (
        <div
          className="w-full h-full relative hover:cursor-pointer"
          onClick={() => navigate("/configure/collection-banner-image")}
        >
          <button
            type="button"
            className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
          >
            <FontAwesomeIcon icon={faCamera} className="text-sm" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CollectionBannerComponent;
