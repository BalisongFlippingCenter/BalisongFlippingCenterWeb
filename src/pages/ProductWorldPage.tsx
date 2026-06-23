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

    <div className={CARD} style={CARD_SHADOW}>
      <span className={LABEL}>Condition</span>
      <div className="flex flex-col gap-1.5">
        {["New", "Like New", "Good", "Fair"].map((c) => (
          <label key={c} className="flex items-center gap-2.5 cursor-pointer group">
            <div className="w-4 h-4 rounded border border-white/[0.12] bg-white/[0.04] flex-shrink-0 group-hover:border-gold/30 transition-colors duration-150" />
            <span className="text-white/40 text-xs group-hover:text-white/60 transition-colors duration-150">{c}</span>
          </label>
        ))}
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
  const [query,       setQuery]       = useState("");

  const listRef    = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const isFetching = useRef(false);

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
          .filter((p: PostDetail) => p.postType === "BUY_SELL" || p.postType === "TRADE");
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
    inputRef.current?.focus();
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
        <div className="xsm:px-4 md:px-0 xsm:pt-4 xsm:pb-3 md:py-8 flex flex-col xsm:gap-2 md:gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gold/60">Marketplace & Info Hub</span>
            <h1 className="text-white font-bold xsm:text-xl md:text-2xl leading-tight">Product World</h1>
            <p className="xsm:hidden md:block text-white/35 text-sm">Browse listings or search for specific knives and makers.</p>
          </div>

          <div className="relative flex items-center group xsm:mt-0 md:mt-1">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-5 text-white/30 text-base pointer-events-none transition-colors duration-200 group-focus-within:text-gold/60"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearchSubmit(query); }}
              placeholder="Search knives, makers, models..."
              className="w-full bg-[#0d1117] border border-white/[0.08] rounded-2xl pl-12 pr-12 py-4 text-white placeholder-white/20 focus:outline-none focus:border-gold/30 focus:bg-[#0f1318] transition-all duration-200"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-4 text-white/25 hover:text-white/60 transition-colors duration-150"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            ) : (
              <div className="absolute right-4 flex items-center gap-1.5 pointer-events-none">
                <kbd className="text-white/15 text-[10px] font-medium border border-white/[0.08] rounded px-1.5 py-0.5 bg-white/[0.04]">⌘</kbd>
                <kbd className="text-white/15 text-[10px] font-medium border border-white/[0.08] rounded px-1.5 py-0.5 bg-white/[0.04]">K</kbd>
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-white/[0.06] xsm:mx-4 md:mx-0 xsm:mb-3 md:mb-6" />

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

            {/* Mobile filter strip */}
            <div className="md:hidden px-4 pb-4">
              <div className="flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {TYPE_FILTERS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleTypeChange(value)}
                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                      filterType === value
                        ? "bg-gold/15 border-gold/35 text-gold"
                        : "bg-white/[0.04] border-white/[0.08] text-white/40"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="h-px bg-white/[0.06] mt-4" />
            </div>

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
              <div ref={listRef} style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
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
