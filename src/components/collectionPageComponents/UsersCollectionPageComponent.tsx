import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../redux/hooks";
import Image from "../Image";
import CollectionOwnedKnivesDisplay from "./CollectionOwnedKnivesDisplay";
import CollectionPostsDisplay from "./CollectionPostsDisplay";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { formatCurrency } from "../../utils/unitConversions";

const UsersCollectionPageComponent = () => {
  const ownedKnives  = useAppSelector((state) => state.collection.collectionKnives);
  const user         = useAppSelector((state) => state.auth.user);
  const navigate     = useNavigate();

  const knifeCount = ownedKnives?.length ?? 0;

  // Est. total value — parse numeric part of msrp strings, skip blanks / non-numeric
  const totalValue = (ownedKnives ?? []).reduce((sum, k) => {
    const parsed = parseFloat(String(k.msrp ?? "").replace(/[^0-9.]/g, ""));
    return isNaN(parsed) ? sum : sum + parsed;
  }, 0);

  // Avg score — only knives that have been scored
  const scoredKnives = (ownedKnives ?? []).filter((k) => k.averageScore !== null);
  const avgScore =
    scoredKnives.length > 0
      ? scoredKnives.reduce((sum, k) => sum + (k.averageScore ?? 0), 0) / scoredKnives.length
      : null;

  const statsItems = [
    { value: knifeCount.toString(),                                                                        label: "Knives"    },
    { value: totalValue > 0 ? (formatCurrency(totalValue, user?.currency) || "—") : "—", label: "Est. Value" },
    { value: avgScore !== null ? avgScore.toFixed(1) : "—",                                                label: "Avg Score" },
  ];

  return (
    <section className="w-full flex flex-col pb-24">

      {/* Collection header */}
      <div className="w-full px-6 pt-6 pb-5 border-b border-white/10 flex flex-col gap-4">

        {/* Owner identity */}
        <div
          className="flex items-center gap-4 cursor-pointer w-fit group"
          onClick={() => navigate(`/${user?.displayName}/${user?.identifierCode}`)}
        >
          <div className="xsm:w-12 xsm:h-12 md:w-14 md:h-14 rounded-full overflow-hidden border border-white/15 flex-shrink-0">
            {user?.profileImg && user.profileImg !== "" ? (
              <Image imageId={user.profileImg} />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center">
                <FontAwesomeIcon icon={faUser} className="text-white/30 text-base" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold xsm:text-base md:text-lg leading-none group-hover:text-white/80 transition-colors duration-200">
                {user?.displayName}
              </span>
              <span className="text-[11px] text-white/30 font-medium bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-full leading-none">
                #{user?.identifierCode}
              </span>
            </div>
            <span className="text-white/30 text-xs">Collection</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {statsItems.map((stat) => (
            <div
              key={stat.label}
              className="bg-[#13161d] border border-white/8 rounded-2xl px-5 py-4 flex flex-col gap-1.5"
            >
              <span className="text-[10px] text-white/30 uppercase tracking-widest font-medium">{stat.label}</span>
              <span className="text-white font-bold xsm:text-2xl md:text-3xl leading-none">{stat.value}</span>
            </div>
          ))}
        </div>

      </div>

      {/* Knives grid + activity sidebar */}
      <section className="w-full flex xsm:flex-col md:flex-row">
        <CollectionOwnedKnivesDisplay />
        <CollectionPostsDisplay />
      </section>

    </section>
  );
};

export default UsersCollectionPageComponent;
