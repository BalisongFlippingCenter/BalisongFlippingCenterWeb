import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft, faChevronRight, faMagnifyingGlass, faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { axiosApiInstance } from "../api/axios";
import { PostDetail, mapPostDetail } from "../modals/Post";
import FeedPostCard from "../components/FeedPostCard";
import knivesData from "../data/knives.json";
import makersData from "../data/makers.json";

// ── Types ─────────────────────────────────────────────────────────────────────

interface KnifeVersion { versionSlug: string; version: string; discontinued: boolean; releaseYear: number }
interface KnifeEntry  { slug: string; maker: string; name: string; bladeStyle: string; priceRange: string; versions: KnifeVersion[] }
interface MakerEntry  { slug: string; name: string; country: string; knownFor: string }

// ── Filters ───────────────────────────────────────────────────────────────────

const LISTING_FILTERS = [
  { value: "ALL",      label: "All"       },
  { value: "BUY_SELL", label: "Buy / Sell" },
  { value: "TRADE",    label: "Trade"      },
] as const;

const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
      active
        ? "bg-gold/15 border-gold/40 text-gold"
        : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
    }`}
  >
    {label}
  </button>
);

// ── Token match ───────────────────────────────────────────────────────────────

const tokenMatch = (haystack: string, query: string): boolean => {
  const h = haystack.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return false;
  if (h.includes(q)) return true;
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.length > 1 && tokens.every((t) => h.includes(t));
};

// ── Knife results ─────────────────────────────────────────────────────────────

const KnifeResults = ({ query, onNavigate }: { query: string; onNavigate: (path: string) => void }) => {
  const matches = (knivesData as KnifeEntry[])
    .filter((k) => tokenMatch(k.name, query) || tokenMatch(k.maker, query) || tokenMatch(k.bladeStyle, query));
  if (matches.length === 0) return null;
  return (
    <div className="mb-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Knife Pages</p>
      <div className="flex flex-col gap-2">
        {matches.map((k) => {
          const hasActiveVersion = k.versions.some((v) => !v.discontinued);
          const versionCount = k.versions.length;
          return (
            <button
              key={k.slug}
              type="button"
              onClick={() => onNavigate(`/product-world/knife/${k.slug}`)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150 text-left group ${
                hasActiveVersion
                  ? "border-green/25 bg-green/5 hover:border-green/40 hover:bg-green/[0.08]"
                  : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.16] hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-semibold truncate ${hasActiveVersion ? "text-white/80" : "text-white/50"}`}>{k.name}</span>
                  {versionCount > 1 && (
                    <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-white/40 border border-white/15 bg-white/5 px-1.5 py-0.5 rounded-md leading-none">
                      {versionCount} versions
                    </span>
                  )}
                  {!hasActiveVersion && (
                    <span className="flex-shrink-0 text-[10px] font-medium uppercase tracking-wider text-gold/50 border border-gold/20 bg-gold/5 px-1.5 py-0.5 rounded-md leading-none">
                      All Discontinued
                    </span>
                  )}
                </div>
                <span className="text-white/35 text-xs truncate">{k.maker} · {k.bladeStyle}</span>
              </div>
              {k.priceRange && (
                <span className="text-gold/60 text-xs font-medium flex-shrink-0">{k.priceRange}</span>
              )}
              <FontAwesomeIcon icon={faChevronRight} className="text-[10px] text-white/15 group-hover:text-white/40 transition-colors flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── Maker results ─────────────────────────────────────────────────────────────

const MakerResults = ({ query, onNavigate }: { query: string; onNavigate: (path: string) => void }) => {
  const matches = (makersData as MakerEntry[]).filter(
    (m) => tokenMatch(m.name, query) || tokenMatch(m.knownFor, query) || tokenMatch(m.country, query)
  );
  if (matches.length === 0) return null;
  return (
    <div className="mb-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Maker Pages</p>
      <div className="flex flex-col gap-2">
        {matches.map((m) => (
          <button
            key={m.slug}
            type="button"
            onClick={() => onNavigate(`/product-world/maker/${m.slug}`)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-white/[0.16] hover:bg-white/[0.06] transition-all duration-150 text-left group"
          >
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-white/80 text-sm font-semibold truncate">{m.name}</span>
              <span className="text-white/35 text-xs truncate">{m.country}{m.knownFor ? ` · ${m.knownFor}` : ""}</span>
            </div>
            <FontAwesomeIcon icon={faChevronRight} className="text-[10px] text-white/15 group-hover:text-white/40 transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Community post feed ───────────────────────────────────────────────────────

const PAGE_SIZE = 15;

const SearchPostFeed = ({ query, listingType }: { query: string; listingType: string }) => {
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

    const params: Record<string, string | number> = { page: pageIndex, size: PAGE_SIZE, search: query };
    if (listingType !== "ALL") params.postType = listingType;

    axiosApiInstance
      .get("/posts/any", { params })
      .then((res) => {
        const mapped: PostDetail[] = (res.data?.content ?? [])
          .map(mapPostDetail)
          .filter((p: PostDetail) => p.postType === "BUY_SELL" || p.postType === "TRADE");
        if (pageIndex === 0) setPosts(mapped);
        else setPosts((prev) => [...prev, ...mapped]);
        setHasMore(pageIndex < (res.data?.totalPages ?? 1) - 1);
        page.current = pageIndex;
      })
      .catch(() => setFetchError(true))
      .finally(() => { setIsLoading(false); setInitialDone(true); isFetching.current = false; });
  }, [query, listingType]);

  useEffect(() => {
    setPosts([]); setInitialDone(false); setHasMore(false);
    page.current = 0; isFetching.current = false;
    fetchPosts(0);
  }, [fetchPosts]);

  if (!initialDone) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#e6b800", borderTopColor: "transparent" }} />
      </div>
    );
  }
  if (fetchError) {
    return (
      <div className="flex flex-col items-center gap-2 py-12">
        <p className="text-white/40 text-sm">Failed to load posts.</p>
        <button type="button" onClick={() => { isFetching.current = false; fetchPosts(0); }} className="text-gold/70 text-xs hover:text-gold transition-colors">Try again</button>
      </div>
    );
  }
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <p className="text-white/40 text-sm">No listings found for "{query}".</p>
        <p className="text-white/20 text-xs">Try adjusting your filters or search term.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {posts.map((post, i) => (
        <div key={post.id}>
          <FeedPostCard post={post} index={i} />
        </div>
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

// ── Page ──────────────────────────────────────────────────────────────────────

const ProductWorldSearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const query       = searchParams.get("q") ?? "";
  const listingType = searchParams.get("type") ?? "ALL";

  const [inputValue, setInputValue] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setInputValue(query); }, [query]);

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const next: Record<string, string> = { q: trimmed };
    if (listingType !== "ALL") next.type = listingType;
    setSearchParams(next, { replace: true });
  };

  const setFilter = (value: string) => {
    const next: Record<string, string> = { q: query };
    if (value !== "ALL") next.type = value;
    setSearchParams(next, { replace: true });
  };

  return (
    <div
      className="w-full min-h-screen text-white relative"
      style={{ background: "linear-gradient(to bottom, #0e0000 0%, #0b0000 40%, #080000 100%)" }}
    >
      <div className="relative z-10 max-w-[760px] mx-auto md:px-6 lg:px-8 xsm:pt-8 xsm:pb-28 md:pt-8 md:pb-16 flex flex-col min-h-screen">

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate("/product-world")}
          className="self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.12] text-white/70 hover:text-white hover:border-white/20 text-sm font-medium mb-5 xsm:mx-4 md:mx-0 transition-all duration-150"
          style={{ background: "rgba(0,0,0,0.35)" }}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
          Product World
        </button>

        {/* Search bar */}
        <div className="xsm:px-4 md:px-0 mb-4">
          <div className="relative flex items-center">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-4 text-gold/50 text-sm pointer-events-none"
            />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              placeholder="Search knives, makers, models..."
              className="w-full border border-gold/30 rounded-2xl py-4 pl-11 pr-11 text-sm text-white placeholder-white/30 focus:outline-none focus:border-gold/55 transition-all duration-200"
              style={{ background: "rgba(14,0,0,0.85)", boxShadow: "0 4px 28px rgba(0,0,0,0.55)" }}
            />
            {inputValue ? (
              <button
                type="button"
                onClick={() => { setInputValue(""); inputRef.current?.focus(); }}
                className="absolute right-11 text-white/25 hover:text-white/60 transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="text-sm" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleSubmit}
              className="absolute right-4 text-gold/40 hover:text-gold transition-colors"
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
            </button>
          </div>
        </div>

        {/* Card */}
        <div
          className="flex-1 md:rounded-2xl border-y md:border border-white/[0.07] flex flex-col gap-7 xsm:p-4 md:p-6"
          style={{ background: "rgba(8,0,0,0.88)" }}
        >
          {/* Header */}
          <div>
            <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-0.5">Results for</p>
            <h1 className="text-white font-bold text-2xl md:text-3xl leading-tight break-words">"{query}"</h1>
          </div>

          {/* Knife page matches */}
          {query && <KnifeResults query={query} onNavigate={navigate} />}

          {/* Maker page matches */}
          {query && <MakerResults query={query} onNavigate={navigate} />}

          <div className="h-px bg-white/[0.06]" />

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/25">Listing</span>
            <div className="flex gap-1.5">
              {LISTING_FILTERS.map(({ value, label }) => (
                <FilterChip
                  key={value}
                  label={label}
                  active={listingType === value}
                  onClick={() => setFilter(value)}
                />
              ))}
            </div>
          </div>

          {/* Community listings */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Community Listings</p>
            {query ? (
              <SearchPostFeed query={query} listingType={listingType} />
            ) : (
              <p className="text-white/25 text-sm">Enter a search term to find listings.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductWorldSearchPage;
