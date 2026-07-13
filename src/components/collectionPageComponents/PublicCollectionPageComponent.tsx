import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosApiInstance } from "../../api/axios";
import { CollectionKnife } from "../../modals/CollectionKnife";
import { CollectionTimelinePostModal } from "../../modals/Post";
import OwnedKnifeCard from "./OwnedKnifeCard";
import CollectionPost from "./CollectionPost";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faStar } from "@fortawesome/free-solid-svg-icons";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PublicCollectionData {
  accountId: string;
  displayName: string;
  identifierCode: string;
  profileImg: string | null;
  collection: {
    id: string;
    bannerImage: string | null;
    featuredKnifeId: string | null;
    collectedKnives: CollectionKnife[];
  };
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  displayName: string;
  identifierCode: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

const PublicCollectionPageComponent = ({ displayName, identifierCode }: Props) => {
  const navigate = useNavigate();

  const [data, setData]         = useState<PublicCollectionData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [posts, setPosts]       = useState<CollectionTimelinePostModal[]>([]);

  // ── Fetch collection ────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(false);
    axiosApiInstance
      .get(`/collection/any/handle`, { params: { displayName, identifierCode } })
      .then((res) => {
        setData(res.data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [displayName, identifierCode]);

  // ── Fetch activity posts once collection id is known ────────────────────────
  useEffect(() => {
    if (!data?.collection?.id) return;
    axiosApiInstance
      .get(`/collection/any/${data.collection.id}/get-posts`)
      .then((res) => setPosts(res.data ?? []))
      .catch(() => {});
  }, [data?.collection?.id]);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <section className="w-full flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-blue-primary border-t-transparent animate-spin" />
      </section>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <section className="w-full flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-white font-semibold">Collection not found</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-5 py-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 text-sm transition-all duration-200"
        >
          Go back
        </button>
      </section>
    );
  }

  const { collection } = data;
  const knives         = collection.collectedKnives ?? [];
  const featuredKnife  = collection.featuredKnifeId
    ? (knives.find((k) => String(k.id) === String(collection.featuredKnifeId)) ?? null)
    : null;

  // Stats
  const totalValue = knives.reduce((sum, k) => {
    const parsed = parseFloat(String(k.msrp ?? "").replace(/[^0-9.]/g, ""));
    return isNaN(parsed) ? sum : sum + parsed;
  }, 0);

  const scoredKnives = knives.filter((k) => k.averageScore !== null);
  const avgScore =
    scoredKnives.length > 0
      ? scoredKnives.reduce((sum, k) => sum + (k.averageScore ?? 0), 0) / scoredKnives.length
      : null;

  const statsItems = [
    { value: knives.length.toString(),                              label: "Num. Knives" },
    { value: totalValue > 0 ? `$${totalValue.toFixed(0)}` : "—",  label: "Est. Value" },
    { value: avgScore !== null ? avgScore.toFixed(1) : "—",        label: "Avg Score" },
  ];

  return (
    <section className="w-full flex flex-col pb-24">

      {/* ── Collection header ── */}
      <div className="w-full px-6 pt-6 pb-5 border-b border-white/10 flex flex-col gap-4">

        {/* Owner identity — links back to their profile */}
        <div
          className="flex items-center gap-4 cursor-pointer w-fit group"
          onClick={() => navigate(`/${data.displayName}/${data.identifierCode}`)}
        >
          <div className="xsm:w-12 xsm:h-12 md:w-14 md:h-14 rounded-full overflow-hidden border border-white/15 flex-shrink-0">
            {data.profileImg ? (
              <img src={data.profileImg} alt={data.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center">
                <FontAwesomeIcon icon={faUser} className="text-white/30 text-base" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold xsm:text-base md:text-lg leading-none group-hover:text-white/80 transition-colors duration-200">
                {data.displayName}
              </span>
              <span className="text-[11px] text-white/30 font-medium bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-full leading-none">
                #{data.identifierCode}
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

      {/* ── Knives grid + activity sidebar ── */}
      <section className="w-full flex xsm:flex-col md:flex-row">

        {/* Knives grid */}
        <div className="flex-1 min-w-0 flex flex-col px-6 pt-5 xsm:pb-4 md:pb-8">

          {/* Featured knife spotlight */}
          {featuredKnife && (
            <div
              className="w-full mb-5 rounded-2xl overflow-hidden border border-gold/30 bg-gradient-to-r from-gold/8 to-transparent cursor-pointer hover:border-gold/50 transition-all duration-200 group"
              style={{ boxShadow: "0 0 24px 2px rgba(230,184,0,0.08)" }}
              onClick={() =>
                navigate(`/${data.displayName}/${data.identifierCode}/collection/${featuredKnife.displayName}`)
              }
            >
              <div className="flex items-stretch">
                <div className="xsm:w-44 xsm:h-44 md:w-64 md:h-56 flex-shrink-0 overflow-hidden">
                  {featuredKnife.coverPhoto && featuredKnife.coverPhoto !== "" ? (
                    <img src={featuredKnife.coverPhoto} alt={featuredKnife.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1c1f27] to-[#0d0f14]" />
                  )}
                </div>
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
                  {featuredKnife.averageScore !== null && (
                    <span className="flex items-center gap-1 text-xs text-gold bg-gold/10 border border-gold/25 px-2.5 py-1 rounded-full font-medium w-fit">
                      <FontAwesomeIcon icon={faStar} className="text-[10px]" />
                      {featuredKnife.averageScore.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Section header */}
          <div className="mb-3">
            <h3 className="text-white/50 text-xs font-semibold uppercase tracking-widest">Knives</h3>
          </div>

          {/* Grid — no "Add Knife" card */}
          {knives.length > 0 ? (
            <div className="grid xsm:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {knives.map((knife, i) => (
                <OwnedKnifeCard
                  key={i}
                  knife={knife}
                  isFeatured={String(knife.id) === String(collection.featuredKnifeId)}
                  ownerDisplayName={data.displayName}
                  ownerIdentifierCode={data.identifierCode}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <p className="text-white/30 text-sm font-medium">No knives yet.</p>
            </div>
          )}

        </div>

        {/* Activity sidebar */}
        <div className="xsm:w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col xsm:border-t md:border-t-0 md:border-l border-white/10 text-white">
          <div className="px-5 py-4 border-b border-white/10">
            <h3 className="text-white font-semibold text-base">Activity</h3>
            <p className="text-white/30 text-xs mt-0.5">Collection timeline</p>
          </div>
          <div className="flex flex-col gap-2 p-3 overflow-y-auto">
            {posts.length > 0 ? (
              posts.map((post) => (
                <CollectionPost post={post} key={post.id} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center xsm:pt-6 xsm:pb-24 md:py-12 gap-1">
                <p className="text-white/30 text-sm font-medium">No activity yet.</p>
                <p className="text-white/20 text-xs">Actions on this collection appear here.</p>
              </div>
            )}
          </div>
        </div>

      </section>
    </section>
  );
};

export default PublicCollectionPageComponent;
