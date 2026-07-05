import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft, faChevronRight, faArrowUpRightFromSquare,
  faTriangleExclamation, faCircleCheck, faTag,
} from "@fortawesome/free-solid-svg-icons";
import knivesData from "../data/knives.json";
import { axiosApiInstance } from "../api/axios";
import { useAppSelector } from "../redux/hooks";
import { formatCurrency, formatWeight, formatLength } from "../utils/unitConversions";
import { PostDetail, mapPostDetail } from "../modals/Post";
import FeedPostCard from "../components/FeedPostCard";

// ── Types ─────────────────────────────────────────────────────────────────────

interface KnifeVariant {
  variantSlug: string;
  type: "trainer" | "live";
  label: string;
  msrp: string;
  bladeStyle: string;
  bladeMaterial: string;
  bladeFinish: string;
}

interface WhereToFind {
  label: string;
  url: string | null;
  type: "official" | "retailer" | "secondary";
  note: string;
}

interface KnifeVersion {
  versionSlug: string;
  version: string;
  discontinued: boolean;
  releaseYear: number;
  description: string;
  overallLength: string;
  weight: string;
  pivotSystem: string;
  latchType: string;
  pinSystem: string;
  hasModularBalance: boolean;
  balanceValue: string | null;
  handleConstruction: string;
  handleMaterial: string;
  handleFinish: string;
  variants: KnifeVariant[];
  whereToFind: WhereToFind[];
}

interface KnifeEntry {
  slug: string;
  name: string;
  maker: string;
  makerSlug: string;
  bladeStyle: string;
  priceRange: string;
  versions: KnifeVersion[];
}

// ── Spec row ──────────────────────────────────────────────────────────────────

const SpecRow = ({ label, value }: { label: string; value: string | null | undefined }) => {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.06] last:border-0">
      <span className="text-white/40 text-xs font-medium uppercase tracking-wider">{label}</span>
      <span className="text-white/80 text-sm font-medium text-right">{value}</span>
    </div>
  );
};

// ── Spec section card ─────────────────────────────────────────────────────────

const SpecCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-white/[0.08] overflow-hidden" style={{ background: "rgba(8,0,0,0.75)" }}>
    <div className="px-4 py-2.5 border-b border-white/[0.06]">
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{title}</p>
    </div>
    <div className="px-4">
      {children}
    </div>
  </div>
);

// ── Community posts feed ──────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const KnifePostFeed = ({ knifeName }: { knifeName: string }) => {
  const [posts,       setPosts]       = useState<PostDetail[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [fetchError,  setFetchError]  = useState(false);
  const [hasMore,     setHasMore]     = useState(false);
  const [initialDone, setInitialDone] = useState(false);
  const page       = useRef(0);
  const isFetching = useRef(false);

  const fetchPosts = useCallback((pageIndex: number) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setIsLoading(true);
    setFetchError(false);

    axiosApiInstance
      .get("/posts/any", { params: { page: pageIndex, size: PAGE_SIZE, search: knifeName } })
      .then((res) => {
        const mapped: PostDetail[] = (res.data?.content ?? []).map(mapPostDetail);
        if (pageIndex === 0) setPosts(mapped);
        else setPosts((prev) => [...prev, ...mapped]);
        setHasMore(pageIndex < (res.data?.totalPages ?? 1) - 1);
        page.current = pageIndex;
      })
      .catch(() => setFetchError(true))
      .finally(() => { setIsLoading(false); setInitialDone(true); isFetching.current = false; });
  }, [knifeName]);

  useEffect(() => {
    setPosts([]); setInitialDone(false); setHasMore(false);
    page.current = 0; isFetching.current = false;
    fetchPosts(0);
  }, [fetchPosts]);

  if (!initialDone) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#e6b800", borderTopColor: "transparent" }} />
      </div>
    );
  }
  if (fetchError) {
    return (
      <div className="flex flex-col items-center gap-2 py-10">
        <p className="text-white/40 text-sm">Failed to load posts.</p>
        <button type="button" onClick={() => { isFetching.current = false; fetchPosts(0); }} className="text-gold/70 text-xs hover:text-gold transition-colors">
          Try again
        </button>
      </div>
    );
  }
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <p className="text-white/40 text-sm">No community posts found for this knife yet.</p>
        <p className="text-white/20 text-xs">Be the first to post about it.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {posts.map((post, i) => (
        <FeedPostCard key={post.id} post={post} index={i} />
      ))}
      {hasMore && (
        <div className="flex justify-center pt-2 pb-4">
          <button
            type="button"
            onClick={() => fetchPosts(page.current + 1)}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm font-medium hover:text-white hover:border-white/20 hover:bg-white/5 transition-all duration-200 disabled:opacity-40"
          >
            {isLoading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const WHERE_TYPE_STYLE: Record<string, string> = {
  official:  "border-blue-primary/30 bg-blue-primary/5 hover:border-blue-primary/50 hover:bg-blue-primary/10",
  retailer:  "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]",
  secondary: "border-gold/25 bg-gold/5 hover:border-gold/40 hover:bg-gold/10",
};
const WHERE_TYPE_LABEL_STYLE: Record<string, string> = {
  official:  "text-blue-primary",
  retailer:  "text-white/60",
  secondary: "text-gold/80",
};
const WHERE_TYPE_TAG: Record<string, string> = {
  official:  "Official",
  retailer:  "Retailer",
  secondary: "Secondary Market",
};

// ── Page ──────────────────────────────────────────────────────────────────────

const KnifeDetailPage = () => {
  const { knifeSlug, version: versionParam, variant: variantParam } = useParams<{
    knifeSlug: string;
    version?: string;
    variant?: string;
  }>();
  const navigate        = useNavigate();
  const currency        = useAppSelector((state) => state.auth.user?.currency);
  const measurementUnit = useAppSelector((state) => state.auth.user?.measurementUnit);

  const knife = (knivesData as KnifeEntry[]).find((k) => k.slug === knifeSlug) ?? null;

  // Resolve active version: URL param → first in-production → first overall
  const activeVersion: KnifeVersion | null = knife
    ? (knife.versions.find((v) => v.versionSlug === versionParam)
      ?? knife.versions.find((v) => !v.discontinued)
      ?? knife.versions[0]
      ?? null)
    : null;

  // Resolve active variant: URL param → trainer → first
  const activeVariant: KnifeVariant | null = activeVersion
    ? (activeVersion.variants.find((v) => v.variantSlug === variantParam)
      ?? activeVersion.variants.find((v) => v.type === "trainer")
      ?? activeVersion.variants[0]
      ?? null)
    : null;

  const liveVariants = activeVersion?.variants.filter((v) => v.type === "live") ?? [];

  const goToVersion = (v: KnifeVersion) => {
    const defaultVariant = v.variants.find((va) => va.type === "trainer") ?? v.variants[0];
    navigate(`/product-world/knife/${knifeSlug}/${v.versionSlug}/${defaultVariant?.variantSlug ?? ""}`);
  };

  const goToVariant = (va: KnifeVariant) => {
    navigate(`/product-world/knife/${knifeSlug}/${activeVersion!.versionSlug}/${va.variantSlug}`);
  };

  if (!knife || !activeVersion || !activeVariant) {
    return (
      <div
        className="w-full min-h-screen flex flex-col items-center justify-center gap-4 text-white"
        style={{ background: "linear-gradient(to bottom, #0e0000 0%, #080000 100%)" }}
      >
        <p className="text-white/50 text-lg font-semibold">Knife not found</p>
        <button
          type="button"
          onClick={() => navigate("/product-world")}
          className="text-gold/70 text-sm hover:text-gold transition-colors"
        >
          ← Back to Product World
        </button>
      </div>
    );
  }

  const isTrainer = activeVariant.type === "trainer";

  return (
    <div
      className="w-full min-h-screen text-white"
      style={{ background: "linear-gradient(to bottom, #0e0000 0%, #0b0000 40%, #080000 100%)" }}
    >
      <div className="relative z-10 max-w-[800px] mx-auto xsm:px-4 md:px-6 lg:px-8 xsm:pt-8 xsm:pb-28 md:pt-10 md:pb-20 flex flex-col gap-8">

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate("/product-world")}
          className="self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.12] text-white/70 hover:text-white hover:border-white/20 text-sm font-medium transition-all duration-150"
          style={{ background: "rgba(0,0,0,0.35)" }}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
          Product World
        </button>

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Status banner */}
          {activeVersion.discontinued ? (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-gold/25 bg-gold/5">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-gold text-sm flex-shrink-0" />
              <div>
                <p className="text-gold text-xs font-bold uppercase tracking-wider">Discontinued — {activeVersion.version}</p>
                <p className="text-white/45 text-xs leading-relaxed mt-0.5">
                  This version is no longer in production. It may be available on the secondary market.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-green/25 bg-green/5">
              <FontAwesomeIcon icon={faCircleCheck} className="text-green text-sm flex-shrink-0" />
              <p className="text-green text-xs font-bold uppercase tracking-wider">In Production — {activeVersion.version}</p>
            </div>
          )}

          {/* Name + maker */}
          <div className="flex flex-col gap-1.5">
            <h1 className="text-white font-extrabold text-4xl md:text-5xl leading-none">{knife.name}</h1>
            <button
              type="button"
              onClick={() => navigate(`/product-world/maker/${knife.makerSlug}`)}
              className="text-gold/70 hover:text-gold text-sm font-medium transition-colors duration-200 w-fit flex items-center gap-1.5"
            >
              by {knife.maker}
              <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
            </button>
          </div>

          {/* Description */}
          <p className="text-white/50 text-sm leading-relaxed">{activeVersion.description}</p>

          {/* Meta row */}
          <div className="flex items-center gap-4 text-xs text-white/30 flex-wrap">
            <span>Released <span className="text-white/50">{activeVersion.releaseYear}</span></span>
            <span className="w-px h-3 bg-white/10" />
            <span>MSRP <span className="text-white/50">{formatCurrency(activeVariant.msrp, currency)}</span></span>
            <span className="w-px h-3 bg-white/10" />
            <span>
              <FontAwesomeIcon icon={faTag} className="mr-1 text-[10px]" />
              {knife.priceRange} on secondary market
            </span>
          </div>
        </div>

        {/* ── Version / Variant + Image placeholder ───────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-6 items-start">

          {/* Left: selectors */}
          <div className="flex flex-col gap-6 flex-1 min-w-0">

            {/* Version selector */}
            {knife.versions.length > 1 && (
              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Version</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {knife.versions.map((v) => {
                    const isActive = v.versionSlug === activeVersion.versionSlug;
                    return (
                      <button
                        key={v.versionSlug}
                        type="button"
                        onClick={() => !isActive && goToVersion(v)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-150 ${
                          isActive
                            ? "bg-white/10 border-white/25 text-white cursor-default"
                            : v.discontinued
                              ? "border-white/[0.08] text-white/35 hover:text-white/60 hover:border-white/20"
                              : "border-green/25 bg-green/5 text-green/70 hover:text-green hover:border-green/40"
                        }`}
                      >
                        {v.version}
                        {!isActive && v.discontinued && (
                          <span className="text-gold/40 text-[9px] uppercase tracking-wide font-medium">disc.</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Variant selector */}
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Variant</p>
              <div className="flex items-center gap-2">
                {activeVersion.variants.some((v) => v.type === "trainer") && (
                  <button
                    type="button"
                    onClick={() => goToVariant(activeVersion.variants.find((v) => v.type === "trainer")!)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                      isTrainer
                        ? "bg-blue-primary/20 border-blue-primary/50 text-blue-primary"
                        : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                    }`}
                  >
                    Trainer
                  </button>
                )}
                {liveVariants.length > 0 && (
                  <button
                    type="button"
                    onClick={() => goToVariant(liveVariants[0])}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                      !isTrainer
                        ? "bg-blue-primary/20 border-blue-primary/50 text-blue-primary"
                        : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                    }`}
                  >
                    Live Blade
                  </button>
                )}
              </div>
              {!isTrainer && liveVariants.length > 1 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {liveVariants.map((v) => (
                    <button
                      key={v.variantSlug}
                      type="button"
                      onClick={() => goToVariant(v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                        activeVariant.variantSlug === v.variantSlug
                          ? "bg-gold/15 border-gold/40 text-gold"
                          : "border-white/10 text-white/40 hover:text-white/60 hover:border-white/20"
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right: image placeholder */}
          <div
            className="w-full md:w-64 lg:w-72 flex-shrink-0 aspect-[4/3] rounded-2xl border border-dashed border-white/15 flex flex-col items-center justify-center gap-2"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-white/20">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>
            <p className="text-white/20 text-xs font-medium">Image coming soon</p>
          </div>

        </div>

        {/* ── Specs ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Specifications</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            <div className="rounded-2xl border border-gold/25 overflow-hidden" style={{ background: "rgba(230,184,0,0.04)" }}>
              <div className="px-4 py-2.5 border-b border-gold/15">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gold/50">Overview</p>
              </div>
              <div className="px-4">
                <SpecRow label="MSRP"           value={formatCurrency(activeVariant.msrp, currency)} />
                <SpecRow label="Overall Length" value={formatLength(activeVersion.overallLength, measurementUnit)} />
                <SpecRow label="Weight"         value={formatWeight(activeVersion.weight, measurementUnit)} />
              </div>
            </div>

            <SpecCard title="Hardware">
              <SpecRow label="Pivot System" value={activeVersion.pivotSystem} />
              <SpecRow label="Latch Type"   value={activeVersion.latchType} />
              <SpecRow label="Pin System"   value={activeVersion.pinSystem} />
              {activeVersion.hasModularBalance && (
                <SpecRow label="Balance" value={activeVersion.balanceValue ?? "Modular"} />
              )}
            </SpecCard>

            <SpecCard title="Blade">
              <SpecRow label="Style"    value={activeVariant.bladeStyle} />
              <SpecRow label="Material" value={activeVariant.bladeMaterial} />
              <SpecRow label="Finish"   value={activeVariant.bladeFinish} />
            </SpecCard>

            <SpecCard title="Handle">
              <SpecRow label="Construction" value={activeVersion.handleConstruction} />
              <SpecRow label="Material"     value={activeVersion.handleMaterial} />
              <SpecRow label="Finish"       value={activeVersion.handleFinish} />
            </SpecCard>

          </div>
          <p className="text-white/25 text-xs italic">
            Specifications reflect the standard configuration. Additional finishes and coatings may be offered on select production runs.
          </p>
        </div>

        {/* ── Where to Find ───────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Where to Find</p>
          <div className="flex flex-col gap-2">
            {activeVersion.whereToFind.map((w, i) => {
              const inner = (
                <div className={`flex items-start gap-3 p-4 rounded-2xl border transition-all duration-150 ${WHERE_TYPE_STYLE[w.type]}`}>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold ${WHERE_TYPE_LABEL_STYLE[w.type]}`}>{w.label}</span>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-white/25 border border-white/10 px-1.5 py-0.5 rounded-full">
                        {WHERE_TYPE_TAG[w.type]}
                      </span>
                    </div>
                    {w.note && <p className="text-white/35 text-xs leading-relaxed mt-0.5">{w.note}</p>}
                  </div>
                  {w.url && (
                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-white/20 text-xs flex-shrink-0 mt-1" />
                  )}
                </div>
              );

              return w.url ? (
                <a key={i} href={w.url} target="_blank" rel="noopener noreferrer">{inner}</a>
              ) : (
                <div key={i}>{inner}</div>
              );
            })}
          </div>
        </div>

        {/* ── Community Posts ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="h-px bg-white/[0.06]" />
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Community Posts</p>
            <p className="text-white/25 text-xs">Posts mentioning the {knife.name}</p>
          </div>
          <KnifePostFeed knifeName={knife.name} />
        </div>

      </div>
    </div>
  );
};

export default KnifeDetailPage;
