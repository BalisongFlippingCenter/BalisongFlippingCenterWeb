import { useNavigate } from "react-router-dom";
import { CollectionKnife } from "../../modals/CollectionKnife";
import Image from "../Image";
import { useAppSelector } from "../../redux/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { formatCurrency } from "../../utils/unitConversions";

interface params {
  knife: CollectionKnife;
  isFeatured?: boolean;
  /** Override the profile owner in the nav URL — used when viewing another user's collection */
  ownerDisplayName?: string;
  ownerIdentifierCode?: string;
}

const OwnedKnifeCard = ({ knife, isFeatured = false, ownerDisplayName, ownerIdentifierCode }: params) => {
  const navigate = useNavigate();
  const user     = useAppSelector((state) => state.auth.user);
  const profileName = ownerDisplayName ?? user?.displayName;
  const profileCode = ownerIdentifierCode ?? user?.identifierCode;

  const isFavorite = knife.favoriteKnife === true || String(knife.favoriteKnife) === "true";

  return (
    // Outer wrapper holds the border — separated from overflow-hidden so it isn't clipped
    <div
      style={isFeatured ? { boxShadow: "0 0 18px 4px rgba(230,184,0,0.25), 0 8px 24px rgba(0,0,0,0.6)" } : { boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}
      className={`relative aspect-[2/3] rounded-xl cursor-pointer transition-all duration-300 ${
        isFeatured
          ? "border-2 border-gold hover:border-gold/60 p-[1px]"
          : "border border-white/8 hover:border-white/25"
      }`}
      onClick={() =>
        navigate(`/${profileName}/${profileCode}/collection/${knife.displayName}`)
      }
    >
      {/* Inner wrapper clips content */}
      <div className="relative w-full h-full rounded-[10px] overflow-hidden group">

        {/* Cover image or dark placeholder */}
        {knife.coverPhoto && knife.coverPhoto !== "" ? (
          <div className="w-full h-full">
            <Image imageId={knife.coverPhoto} />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1c1f27] to-[#0d0f14]" />
        )}

        {/* Favourite badge — top left */}
        {isFavorite && (
          <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-black/60 border border-gold/40 flex items-center justify-center backdrop-blur-sm">
            <FontAwesomeIcon icon={faStar} className="text-gold text-[9px]" />
          </div>
        )}

        {/* Score badge — top right */}
        {knife.averageScore !== null && (
          <div className={`absolute top-3 right-3 flex items-center gap-1 bg-black/60 border px-1.5 py-0.5 rounded-full font-medium backdrop-blur-sm ${
            isFeatured
              ? "text-xs text-gold border-gold/60"
              : "text-[10px] text-white/60 border-white/20"
          }`}>
            <FontAwesomeIcon icon={faStar} className={isFeatured ? "text-xs" : "text-[8px]"} />
            {knife.averageScore.toFixed(1)}
          </div>
        )}

        {/* Bottom gradient + name + maker + msrp */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 via-[35%] to-transparent px-3 pb-4 pt-20">
          <p className="text-white font-bold text-base truncate leading-tight">
            {knife.displayName}
          </p>
          <div className="flex items-end justify-between gap-2 mt-1">
            <p className="text-white/50 text-[11px] leading-snug flex-1">
              {[knife.knifeMaker, knife.baseKnifeModel].filter(Boolean).join(" · ")}
            </p>
            {formatCurrency(knife.msrp, user?.currency) && (
              <span className="text-white/50 text-xs font-medium flex-shrink-0">{formatCurrency(knife.msrp, user?.currency)}</span>
            )}
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <span className="text-white/90 text-sm font-medium px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm">
            View Details
          </span>
        </div>

      </div>
    </div>
  );
};

export default OwnedKnifeCard;
