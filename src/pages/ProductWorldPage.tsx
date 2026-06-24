import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass, faXmark, faSliders, faClock, faStar,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarOutline } from "@fortawesome/free-regular-svg-icons";
import { axiosApiInstance } from "../api/axios";
import { PostDetail, mapPostDetail } from "../modals/Post";
import FeedPostCard from "../components/FeedPostCard";

const PAGE_SIZE       = 20;
const LS_RECENT_KEY  = "pw_recent_searches";
const LS_SAVED_KEY   = "pw_saved_searches";
const MAX_RECENT     = 8;

const TYPE_FILTERS = [
  { value: "ALL",      label: "All Listings" },
  { value: "BUY_SELL", label: "Buy / Sell"   },
  { value: "TRADE",    label: "Trade"         },
] as const;

// ── localStorage helpers ──────────────────────────────────────────────────────

const loadList = (key: string): string[] => {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; }
};

const saveList = (key: string, list: string[]) => {
  localStorage.setItem(key, JSON.stringify(list));
};

const pushRecent = (term: string) => {
  if (!term.trim()) return;
  const prev = loadList(LS_RECENT_KEY).filter((s) => s !== term);
  saveList(LS_RECENT_KEY, [term, ...prev].slice(0, MAX_RECENT));
};

// ── Filter sidebar ────────────────────────────────────────────────────────────

const CARD = "rounded-2xl border border-white/[0.08] bg-[#0d1117] p-4 flex flex-col gap-3";
const CARD_SHADOW = { boxShadow: "0 4px 24px rgba(0,0,0,0.5)" };
const LABEL = "text-white/50 text-[10px] font-bold uppercase tracking-widest";

const FilterSidebar = ({ filterType, onTypeChange }: { filterType: string; onTypeChange: (v: string) => void }) => (
  <div className="flex flex-col gap-3">
    <div className={CARD} style={CARD_SHADOW}>
      <span className={LABEL}>Listing Type</span>
      <div className="flex flex-col gap-1.5">
        {TYPE_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onTypeChange(value)}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${
              filterType === value
                ? "bg-gold/15 border-gold/35 text-gold"
                : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06] hover:border-white/[0.12]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>

    <div className={CARD} style={CARD_SHADOW}>
      <span className={LABEL}>Price Range</span>
      <div className="flex items-center gap-2">
        <input type="number" placeholder="Min" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white/60 text-xs placeholder-white/20 focus:outline-none focus:border-gold/30 transition-colors duration-150" />
        <span className="text-white/20 text-xs flex-shrink-0">—</span>
        <input type="number" placeholder="Max" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white/60 text-xs placeholder-white/20 focus:outline-none focus:border-gold/30 transition-colors duration-150" />
      </div>
    </div>

  </div>
);

// ── Search history sidebar ────────────────────────────────────────────────────

const SearchSidebar = ({
  onSelect,
}: {
  onSelect: (term: string) => void;
}) => {
  const [recent, setRecent] = useState<string[]>(() => loadList(LS_RECENT_KEY));
  const [saved,  setSaved]  = useState<string[]>(() => loadList(LS_SAVED_KEY));

  const refresh = () => {
    setRecent(loadList(LS_RECENT_KEY));
    setSaved(loadList(LS_SAVED_KEY));
  };

  const removeRecent = (term: string) => {
    const next = recent.filter((s) => s !== term);
    saveList(LS_RECENT_KEY, next);
    setRecent(next);
  };

  const clearRecent = () => {
    saveList(LS_RECENT_KEY, []);
    setRecent([]);
  };

  const toggleSaved = (term: string) => {
    const isSaved = saved.includes(term);
    const next = isSaved ? saved.filter((s) => s !== term) : [term, ...saved];
    saveList(LS_SAVED_KEY, next);
    setSaved(next);
  };

  const removeSaved = (term: string) => {
    const next = saved.filter((s) => s !== term);
    saveList(LS_SAVED_KEY, next);
    setSaved(next);
  };

  // Re-read localStorage whenever the component becomes visible
  useEffect(() => { refresh(); }, []);

  const isEmpty = recent.length === 0 && saved.length === 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Saved searches */}
      {saved.length > 0 && (
        <div className={CARD} style={CARD_SHADOW}>
          <div className="flex items-center justify-between">
            <span className={LABEL}>Saved Searches</span>
          </div>
          <div className="flex flex-col gap-1">
            {saved.map((term) => (
              <div key={term} className="flex items-center gap-2 group">
                <button
                  type="button"
                  onClick={() => onSelect(term)}
                  className="flex-1 flex items-center gap-2 min-w-0 py-1 text-left"
                >
                  <FontAwesomeIcon icon={faStar} className="text-gold/60 text-[10px] flex-shrink-0" />
                  <span className="text-white/60 text-xs truncate group-hover:text-white/90 transition-colors duration-150">{term}</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeSaved(term)}
                  className="opacity-0 group-hover:opacity-100 text-white/25 hover:text-white/60 transition-all duration-150 flex-shrink-0"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent searches */}
      <div className={CARD} style={CARD_SHADOW}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faClock} className="text-white/25 text-[10px]" />
            <span className={LABEL}>Recent</span>
          </div>
          {recent.length > 0 && (
            <button
              type="button"
              onClick={clearRecent}
              className="text-white/25 text-[10px] hover:text-white/50 transition-colors duration-150"
            >
              Clear all
            </button>
          )}
        </div>

        {isEmpty && recent.length === 0 ? (
          <p className="text-white/20 text-xs leading-relaxed">
            Your searches will appear here.
          </p>
        ) : recent.length === 0 ? (
          <p className="text-white/20 text-xs">No recent searches.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {recent.map((term) => (
              <div key={term} className="flex items-center gap-2 group">
                <button
                  type="button"
                  onClick={() => onSelect(term)}
                  className="flex-1 flex items-center gap-2 min-w-0 py-1 text-left"
                >
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="text-white/20 text-[10px] flex-shrink-0" />
                  <span className="text-white/50 text-xs truncate group-hover:text-white/80 transition-colors duration-150">{term}</span>
                </button>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-150 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleSaved(term)}
                    title={saved.includes(term) ? "Unsave" : "Save"}
                    className="text-white/25 hover:text-gold/70 transition-colors duration-150"
                  >
                    <FontAwesomeIcon icon={saved.includes(term) ? faStar : faStarOutline} className="text-[10px]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRecent(term)}
                    className="text-white/25 hover:text-white/60 transition-colors duration-150"
                  >
                    <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isEmpty && (
        <p className="text-white/20 text-[11px] text-center px-2 leading-relaxed">
          Search for a knife or maker to get started.
        </p>
      )}
    </div>
  );
};

// ── Compact post card (mobile 2-col grid) ────────────────────────────────────

const isVideoUrl = (url: string) => /\.(mp4|mov|avi|webm|mkv|m4v)(\?.*)?$/i.test(url);

const compactBadge = (post: PostDetail): { label: string; cls: string } => {
  if (post.postType === "TRADE")  return { label: "Trade",   cls: "text-blue-primary border-blue-primary/50 bg-black/70" };
  if (post.mode === "BUYING")     return { label: "Buying",  cls: "text-[#5bc8f5] border-[#5bc8f5]/40 bg-black/70" };
  return                                 { label: "Selling", cls: "text-gold border-gold/50 bg-black/70" };
};

const knifeLabel = (post: PostDetail): string | null => {
  const k = post.offeringKnife;
  if (!k) return null;
  if (k.displayName) return k.displayName;
  if (k.knifeMaker && k.baseKnifeModel) return `${k.knifeMaker} ${k.baseKnifeModel}`;
  return k.knifeMaker || k.baseKnifeModel || null;
};

const CompactPostCard = ({ post }: { post: PostDetail }) => {
  const badge    = compactBadge(post);
  const media    = post.mediaFiles[0] ?? "";
  const isVid    = !!media && isVideoUrl(media);
  const hasMedia = !!media;
  const knife    = knifeLabel(post);

  const coverImg = post.postType === "TRADE"
    ? (post.offeringKnife?.coverPhoto ?? media)
    : media;

  return (
    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#0d0f14] border border-white/[0.07]">
      {/* Thumbnail */}
      {hasMedia ? (
        isVid
          ? <video src={coverImg} className="w-full h-full object-cover" muted playsInline preload="metadata" onLoadedMetadata={(e) => { e.currentTarget.currentTime = 0.001; }} />
          : <img src={coverImg} alt="" className="w-full h-full object-cover" />
      ) : post.offeringKnife?.coverPhoto ? (
        <img src={post.offeringKnife.coverPhoto} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-white/10 text-2xl" />
        </div>
      )}

      {/* Gradient overlay — heavier at bottom for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      {/* Badge — top left */}
      <span className={`absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full border backdrop-blur-sm ${badge.cls}`}>
        {badge.label}
      </span>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5 pt-4 flex flex-col gap-0.5">
        {knife ? (
          <p className="text-white text-[11px] font-semibold leading-snug line-clamp-2">{knife}</p>
        ) : post.caption?.trim() ? (
          <p className="text-white text-[11px] font-semibold leading-snug line-clamp-2">{post.caption}</p>
        ) : null}
        {post.postType === "BUY_SELL" && post.mode !== "BUYING" && (
          <p className="text-gold text-[11px] font-bold leading-tight">
            {post.price ? `$${post.price}` : "Offers welcome"}
          </p>
        )}
        {post.postType === "TRADE" && (
          <p className="text-blue-primary text-[10px] leading-tight">Looking to trade</p>
        )}
        <p className="text-white/30 text-[9px] leading-none mt-0.5">{post.creatorDisplayName}</p>
      </div>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const ProductWorldPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate      = useNavigate();
  const filterType    = searchParams.get("type") ?? "ALL";
  const filterTypeRef = useRef(filterType);

  const [posts,       setPosts]       = useState<PostDetail[]>([]);
  const [hasMore,     setHasMore]     = useState(true);
  const [isLoading,   setIsLoading]   = useState(false);
  const [initialDone, setInitialDone] = useState(false);
  const [fetchError,  setFetchError]  = useState(false);
  const [query,        setQuery]       = useState("");
  const [searchOpen,   setSearchOpen]  = useState(false);

  const listRef      = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const isFetching   = useRef(false);

  // Track saved state at page level so SearchSidebar star icons stay in sync
  const [savedSearches, setSavedSearches] = useState<string[]>(() => loadList(LS_SAVED_KEY));

  const fetchPosts = useCallback((pageIndex: number) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setIsLoading(true);
    setFetchError(false);

    const params: Record<string, unknown> = { page: pageIndex, size: PAGE_SIZE };
    if (filterTypeRef.current !== "ALL") params.postType = filterTypeRef.current;

    axiosApiInstance
      .get("/posts/any", { params })
      .then((res) => {
        const mapped: PostDetail[] = (res.data?.content ?? [])
          .map(mapPostDetail)
          .filter((p: PostDetail) => {
            if (p.postType !== "BUY_SELL" && p.postType !== "TRADE") return false;
            // Hide selling/trade posts with no knife attached (knife was removed from collection)
            if (p.postType === "TRADE" && !p.offeringKnife) return false;
            if (p.postType === "BUY_SELL" && p.mode !== "BUYING" && !p.offeringKnife) return false;
            return true;
          });
        if (pageIndex === 0) setPosts(mapped);
        else setPosts((prev) => [...prev, ...mapped]);
        setHasMore(pageIndex < (res.data?.totalPages ?? 1) - 1);
        setInitialDone(true);
      })
      .catch(() => { setFetchError(true); setInitialDone(true); })
      .finally(() => { setIsLoading(false); isFetching.current = false; });
  }, []);

  useEffect(() => { fetchPosts(0); }, [fetchPosts]);

  const handleTypeChange = useCallback((v: string) => {
    filterTypeRef.current = v;
    setSearchParams(v === "ALL" ? {} : { type: v }, { replace: true });
    setPosts([]);
    setInitialDone(false);
    setHasMore(true);
    isFetching.current = false;
    fetchPosts(0);
  }, [fetchPosts, setSearchParams]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearchSubmit = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    pushRecent(trimmed);
    setSavedSearches(loadList(LS_SAVED_KEY));
    setQuery(trimmed);
    // TODO: trigger filtered fetch when backend supports query param
  }, []);

  const handleSelectSearch = (term: string) => {
    setQuery(term);
    setSearchOpen(false);
    handleSearchSubmit(term);
  };

  const virtualizer = useWindowVirtualizer({
    count: hasMore ? posts.length + 1 : posts.length,
    estimateSize: () => 520,
    overscan: 3,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  const virtualItems = virtualizer.getVirtualItems();

  useEffect(() => {
    const last = virtualItems[virtualItems.length - 1];
    if (!last) return;
    if (last.index >= posts.length - 1 && hasMore && !isLoading && !isFetching.current && initialDone) {
      fetchPosts(Math.ceil(posts.length / PAGE_SIZE));
    }
  }, [virtualItems, posts.length, hasMore, isLoading, initialDone, fetchPosts]);

  return (
    <section
      className="min-h-screen w-full relative overflow-clip"
      style={{ background: "linear-gradient(to bottom, #0e0000 0%, #0b0000 40%, #080000 100%)" }}
    >

      <div className="relative z-10 w-full max-w-[1400px] mx-auto md:px-6 pt-0 pb-24">

        {/* ── Hero search ── */}
        <div className="xsm:px-4 md:px-0 xsm:pt-6 xsm:pb-0 md:py-8 flex flex-col xsm:gap-2 md:gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gold/60">Marketplace & Info Hub</span>
            <h1 className="text-white font-bold xsm:text-2xl md:text-2xl leading-tight">Product World</h1>
            <p className="xsm:hidden md:block text-white/35 text-sm">Browse listings or search for specific knives and makers.</p>
          </div>

          {/* Search bar */}
          <div ref={searchWrapRef} className="relative xsm:mt-1 md:mt-1">
            {/* Input row */}
            <div className={`relative flex items-center transition-all duration-200 ${searchOpen ? "ring-2 ring-gold/30 rounded-2xl" : ""}`}>
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className={`absolute left-5 text-base pointer-events-none transition-colors duration-200 ${searchOpen || query ? "text-gold/70" : "text-white/30"}`}
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { handleSearchSubmit(query); setSearchOpen(false); }
                  if (e.key === "Escape") { setSearchOpen(false); inputRef.current?.blur(); }
                }}
                placeholder="Search knives, makers, models..."
                className={`w-full border xsm:py-5 md:py-4 pl-12 pr-12 xsm:text-base md:text-sm text-white placeholder-white/30 focus:outline-none transition-all duration-200 ${
                  searchOpen
                    ? "bg-[#1a0a0a] border-gold/50 rounded-t-2xl rounded-b-none"
                    : "bg-[#120606] border-gold/20 rounded-2xl hover:border-gold/35"
                }`}
                style={{ boxShadow: searchOpen ? "0 0 0 3px rgba(230,184,0,0.08)" : "0 2px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(230,184,0,0.04)" }}
              />
              {query ? (
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); setQuery(""); }}
                  className="absolute right-4 text-white/30 hover:text-white/70 transition-colors duration-150"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              ) : (
                <div className="absolute right-4 xsm:hidden md:flex items-center gap-1.5 pointer-events-none">
                  <kbd className="text-white/15 text-[10px] font-medium border border-white/[0.08] rounded px-1.5 py-0.5 bg-white/[0.04]">⌘</kbd>
                  <kbd className="text-white/15 text-[10px] font-medium border border-white/[0.08] rounded px-1.5 py-0.5 bg-white/[0.04]">K</kbd>
                </div>
              )}
            </div>

            {/* Dropdown */}
            {searchOpen && (() => {
              const recent  = loadList(LS_RECENT_KEY);
              const saved   = loadList(LS_SAVED_KEY);
              const filtered = query.trim()
                ? [...new Set([...saved, ...recent])].filter((s) => s.toLowerCase().includes(query.toLowerCase()))
                : [];
              const showRecent  = !query.trim() && recent.length > 0;
              const showSaved   = !query.trim() && saved.length > 0;
              const showResults = query.trim() && filtered.length > 0;
              const showEmpty   = query.trim() && filtered.length === 0;
              const showBlank   = !query.trim() && recent.length === 0 && saved.length === 0;

              return (
                <div
                  className="absolute left-0 right-0 z-50 bg-[#1a0a0a] border border-gold/50 border-t-0 rounded-b-2xl overflow-hidden"
                  style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.7), 0 0 0 3px rgba(230,184,0,0.08)" }}
                >
                  {showBlank && (
                    <div className="px-5 py-4 text-white/25 text-xs">Start typing to search knives, makers, or models</div>
                  )}

                  {showSaved && (
                    <div className="pt-3 pb-1">
                      <p className="px-5 text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Saved</p>
                      {saved.map((term) => (
                        <button key={term} type="button" onMouseDown={() => handleSelectSearch(term)}
                          className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.04] transition-colors duration-100 text-left">
                          <FontAwesomeIcon icon={faStar} className="text-gold/50 text-[10px] flex-shrink-0" />
                          <span className="text-white/70 text-sm truncate">{term}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {showRecent && (
                    <div className="pt-3 pb-2">
                      <p className="px-5 text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Recent</p>
                      {recent.map((term) => (
                        <button key={term} type="button" onMouseDown={() => handleSelectSearch(term)}
                          className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.04] transition-colors duration-100 text-left">
                          <FontAwesomeIcon icon={faClock} className="text-white/20 text-[10px] flex-shrink-0" />
                          <span className="text-white/60 text-sm truncate">{term}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {showResults && (
                    <div className="pt-3 pb-2">
                      <p className="px-5 text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Suggestions</p>
                      {filtered.map((term) => (
                        <button key={term} type="button" onMouseDown={() => handleSelectSearch(term)}
                          className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.04] transition-colors duration-100 text-left">
                          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-white/20 text-[10px] flex-shrink-0" />
                          <span className="text-white/70 text-sm truncate">{term}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {showEmpty && (
                    <div className="px-5 py-4 text-white/25 text-xs">No saved or recent searches match "{query}"</div>
                  )}

                  {/* Footer hint */}
                  {query.trim() && (
                    <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-white/25 text-xs">Press <kbd className="border border-white/10 rounded px-1 py-0.5 bg-white/[0.04] text-white/30">Enter</kbd> to search</span>
                      <button type="button" onMouseDown={() => { handleSearchSubmit(query); setSearchOpen(false); }}
                        className="text-gold/60 text-xs font-semibold hover:text-gold transition-colors duration-150">
                        Search →
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Mobile quick-filter chips — below search, feel like browse shortcuts */}
          <div className="md:hidden flex items-center gap-2 overflow-x-auto py-1.5" style={{ scrollbarWidth: "none" }}>
            {TYPE_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleTypeChange(value)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-150 ${
                  filterType === value
                    ? "bg-gold/15 border-gold/35 text-gold"
                    : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop divider */}
        <div className="xsm:hidden md:block h-px bg-white/[0.06] md:mb-6" />

        {/* Mobile listing info row */}
        {initialDone && (
          <div className="md:hidden flex items-center justify-between xsm:px-3 xsm:pt-2 xsm:pb-1.5">
            <span className="text-white/30 text-xs">
              {TYPE_FILTERS.find((f) => f.value === filterType)?.label ?? "All Listings"}
            </span>
            <button type="button" className="flex items-center gap-1.5 text-white/30 text-xs hover:text-white/60 transition-colors duration-150 border border-white/[0.08] rounded-full px-2.5 py-1">
              Recent
              <span className="text-white/20">↕</span>
            </button>
          </div>
        )}

        {/* ── 3-column layout — feed always centered ── */}
        <div className="grid xsm:grid-cols-1 md:grid-cols-[240px_600px] lg:grid-cols-[1fr_600px_1fr] gap-6 items-start">

          {/* Left sidebar — search history + filters */}
          <aside className="xsm:hidden md:block lg:max-w-[260px] lg:ml-auto sticky top-[78px] pt-1 w-full">
            {/* Search history */}
            <div className="flex items-center gap-2 mb-3">
              <FontAwesomeIcon icon={faClock} className="text-white/30 text-xs" />
              <span className="text-white/40 text-[11px] font-semibold uppercase tracking-widest">Search History</span>
            </div>
            <SearchSidebar
              key={savedSearches.join(",")}
              onSelect={handleSelectSearch}
            />

            {/* Filters */}
            <div className="flex items-center gap-2 mt-5 mb-3">
              <FontAwesomeIcon icon={faSliders} className="text-white/30 text-xs" />
              <span className="text-white/40 text-[11px] font-semibold uppercase tracking-widest">Filters</span>
            </div>
            <FilterSidebar filterType={filterType} onTypeChange={handleTypeChange} />
          </aside>

          {/* Main feed */}
          <div className="min-w-0 w-full">

            {!initialDone ? (
              <div className="flex justify-center py-24">
                <div className="w-6 h-6 rounded-full border-2 border-gold/60 border-t-transparent animate-spin" />
              </div>
            ) : fetchError && posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <p className="text-white/40 text-sm">Failed to load posts.</p>
                <button
                  type="button"
                  onClick={() => { setInitialDone(false); setHasMore(true); isFetching.current = false; fetchPosts(0); }}
                  className="text-gold/70 text-xs hover:text-gold transition-colors duration-150"
                >
                  Try again
                </button>
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24">
                <p className="text-white/40 text-sm">No marketplace posts yet.</p>
              </div>
            ) : (
              <>
                {/* Mobile — 2-col compact grid */}
                <div className="md:hidden px-3 grid grid-cols-2 gap-3">
                  {posts.map((post) => (
                    <CompactPostCard key={post.id} post={post} />
                  ))}
                  {isLoading && (
                    <div className="col-span-2 flex justify-center py-6">
                      <div className="w-5 h-5 rounded-full border-2 border-gold/60 border-t-transparent animate-spin" />
                    </div>
                  )}
                  {hasMore && !isLoading && initialDone && (
                    <button
                      type="button"
                      className="col-span-2 py-4 text-gold/60 text-xs hover:text-gold transition-colors"
                      onClick={() => { isFetching.current = false; fetchPosts(Math.ceil(posts.length / PAGE_SIZE)); }}
                    >
                      Load more
                    </button>
                  )}
                </div>

                {/* Desktop — virtualised full cards */}
                <div ref={listRef} className="xsm:hidden md:block" style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
                  {virtualItems.map((item) => {
                    const isLoader = item.index >= posts.length;
                    return (
                      <div
                        key={item.key}
                        data-index={item.index}
                        ref={virtualizer.measureElement}
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${item.start - virtualizer.options.scrollMargin}px)` }}
                      >
                        {isLoader ? (
                          <div className="flex justify-center py-8">
                            {isLoading
                              ? <div className="w-5 h-5 rounded-full border-2 border-gold/60 border-t-transparent animate-spin" />
                              : fetchError
                                ? <button type="button" onClick={() => { isFetching.current = false; fetchPosts(Math.ceil(posts.length / PAGE_SIZE)); }} className="text-gold/70 text-xs hover:text-gold transition-colors">Retry</button>
                                : null
                            }
                          </div>
                        ) : (
                          <div className="pb-3">
                            <FeedPostCard post={posts[item.index]} index={item.index} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Right sidebar — buying guide CTA */}
          <aside className="xsm:hidden lg:block lg:max-w-[260px] sticky top-[78px] pt-1 w-full">
            <div
              className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0d1117]"
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}
            >
              {/* Header band */}
              <div className="h-12 relative flex items-center px-4 gap-2.5 bg-gradient-to-r from-gold/15 via-gold/5 to-transparent">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(ellipse at 0% 50%, rgba(230,184,0,0.5) 0%, transparent 60%)" }} />
                <span className="relative text-base leading-none">🔪</span>
                <span className="relative text-white/50 text-[10px] font-bold uppercase tracking-widest">Buying Guide</span>
              </div>
              {/* Body */}
              <div className="p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-white font-semibold text-sm">Looking to buy your first balisong?</h3>
                  <p className="text-white/40 text-xs leading-relaxed">Learn what to look for, how to set a budget, and which knives are best for beginners before you browse listings.</p>
                </div>
                <button
                  onClick={() => navigate("/learn")}
                  className="w-full py-2.5 rounded-xl bg-gold/10 border border-gold/25 text-gold text-xs font-semibold hover:bg-gold/20 hover:border-gold/50 transition-all duration-150"
                >
                  Read the Buying Guide →
                </button>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </section>
  );
};

export default ProductWorldPage;
