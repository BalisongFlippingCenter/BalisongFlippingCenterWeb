import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../redux/hooks";
import { CollectionKnife } from "../../modals/CollectionKnife";
import OwnedKnifeCard from "./OwnedKnifeCard";
import Image from "../Image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faStar } from "@fortawesome/free-solid-svg-icons";

const CollectionOwnedKnivesDisplay = () => {
  const ownedKnives: Array<CollectionKnife> = useAppSelector(
    (state) => state.collection.collectionKnives
  );
  const collectionData = useAppSelector((state) => state.collection.collection);
  const user           = useAppSelector((state) => state.auth.user);
  const navigate       = useNavigate();

  const featuredKnifeId = collectionData?.featuredKnifeId ?? null;
  const featuredKnife   = featuredKnifeId
    ? (ownedKnives?.find((k) => String(k.id) === String(featuredKnifeId)) ?? null)
    : null;

  return (
    <div className="flex-1 min-w-0 flex flex-col px-6 pt-5 xsm:pb-4 md:pb-8">

      {/* ── Featured knife spotlight ── */}
      {featuredKnife && (
        <div
          className="w-full mb-5 rounded-2xl overflow-hidden border border-gold/30 bg-gradient-to-r from-gold/8 to-transparent cursor-pointer hover:border-gold/50 transition-all duration-200 group"
          style={{ boxShadow: "0 0 24px 2px rgba(230,184,0,0.08)" }}
          onClick={() =>
            navigate(
              `/${user?.displayName}/${user?.identifierCode}/collection/${featuredKnife.displayName}`
            )
          }
        >
          <div className="flex items-stretch">

            {/* Cover image */}
            <div className="xsm:w-36 md:w-56 flex-shrink-0 overflow-hidden self-stretch">
              {featuredKnife.coverPhoto && featuredKnife.coverPhoto !== "" ? (
                <Image imageId={featuredKnife.coverPhoto} />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1c1f27] to-[#0d0f14]" />
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col justify-center px-5 py-4 gap-2 min-w-0">
              <span className="text-gold text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <FontAwesomeIcon icon={faStar} className="text-[9px]" />
                Featured Knife
              </span>
              <h3 className="text-white font-bold xsm:text-xl md:text-2xl leading-tight">
                {featuredKnife.displayName}
              </h3>
              <p className="text-white/50 text-sm">
                {featuredKnife.knifeMaker}
                {featuredKnife.baseKnifeModel ? ` · ${featuredKnife.baseKnifeModel}` : ""}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {featuredKnife.averageScore !== null && (
                  <span className="flex items-center gap-1 text-xs text-gold bg-gold/10 border border-gold/25 px-2.5 py-1 rounded-full font-medium">
                    <FontAwesomeIcon icon={faStar} className="text-[10px]" />
                    {featuredKnife.averageScore.toFixed(1)}
                  </span>
                )}
                {featuredKnife.knifeType && (
                  <span className="text-xs text-white/40 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                    {{ liveblade: "Live Blade", trainer: "Trainer", both: "Live/Trainer" }[featuredKnife.knifeType.toLowerCase().replace(/_/g, "")] ?? featuredKnife.knifeType}
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Section header ── */}
      <div className="mb-3">
        <h3 className="text-white/50 text-xs font-semibold uppercase tracking-widest">Knives</h3>
      </div>

      {/* ── Grid ── */}
      <div className="grid xsm:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3">

        {/* Add knife card */}
        <button
          type="button"
          onClick={() => navigate("/add-collection-knife")}
          className="aspect-[2/3] rounded-xl border border-dashed border-white/20 hover:border-white/40 bg-white/[0.03] hover:bg-white/[0.06] flex flex-col items-center justify-center gap-2 transition-all duration-200 group"
        >
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-200">
            <FontAwesomeIcon icon={faPlus} className="text-white/40 group-hover:text-white/70 text-sm" />
          </div>
          <span className="text-white/40 text-xs group-hover:text-white/60 transition-colors duration-200">
            Add Knife
          </span>
        </button>

        {ownedKnives?.map((knife, i) => (
          <OwnedKnifeCard knife={knife} isFeatured={String(knife.id) === String(featuredKnifeId)} key={i} />
        ))}

      </div>
    </div>
  );
};

export default CollectionOwnedKnivesDisplay;
