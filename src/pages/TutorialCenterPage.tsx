import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass, faXmark, faClock, faStar,
} from "@fortawesome/free-solid-svg-icons";
import { axiosApiInstance } from "../api/axios";
import { PostDetail, mapPostDetail } from "../modals/Post";
import FeedPostCard from "../components/FeedPostCard";

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE      = 20;
const LS_RECENT_KEY  = "tc_recent_searches";
const LS_SAVED_KEY   = "tc_saved_searches";
const MAX_RECENT     = 8;

const TYPE_FILTERS = [
  { value: "ALL",             label: "All"      },
  { value: "COMBO",           label: "Combo"    },
  { value: "TRICK_TUTORIAL",  label: "Tutorial" },
] as const;

const DIFFICULTY_FILTERS = [
  { value: "ALL",          label: "All"          },
  { value: "BEGINNER",     label: "Beginner"     },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED",     label: "Advanced"     },
] as const;

const DIFFICULTY_CHIP: Record<string, string> = {
  BEGINNER:     "bg-green/15 border-green/35 text-green",
  INTERMEDIATE: "bg-gold/15 border-gold/35 text-gold",
  ADVANCED:     "bg-red/15 border-red/35 text-red",
};

// ── localStorage helpers ──────────────────────────────────────────────────────

const loadList = (key: string): string[] => {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; }
};
const saveList = (key: string, list: string[]) =>
  localStorage.setItem(key, JSON.stringify(list));

const pushRecent = (term: string) => {
  const prev = loadList(LS_RECENT_KEY).filter((s) => s !== term);
  saveList(LS_RECENT_KEY, [term, ...prev].slice(0, MAX_RECENT));
};

// ── Sidebar card constants ────────────────────────────────────────────────────

const CARD_BG    = "bg-[#0d0d14] border border-white/[0.08]";
const CARD_STYLE = { boxShadow: "0 4px 24px rgba(0,0,0,0.5)" };
const LABEL      = "text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3 block";

// ── Recent search sidebar (desktop left) ─────────────────────────────────────

const RecentSearchSidebar = ({ onSelect }: { onSelect: (term: string) => void }) => {
  const recent = loadList(LS_RECENT_KEY);

  if (recent.length === 0) {
    return (
      <p className="text-white/20 text-xs leading-relaxed">
        Your recent trick searches will appear here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 -mx-1">
      {recent.map((term) => (
        <button
          key={term}
          type="button"
          onClick={() => onSelect(term)}
          className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.05] transition-colors duration-100 text-left group"
        >
          <FontAwesomeIcon icon={faClock} className="text-white/20 text-[10px] flex-shrink-0 group-hover:text-teal/50 transition-colors duration-100" />
          <span className="text-white/50 text-xs truncate group-hover:text-white/75 transition-colors duration-100">{term}</span>
        </button>
      ))}
    </div>
  );
};

// ── Filter sidebar (desktop right) ───────────────────────────────────────────

interface FilterSidebarProps {
  filterType: string;
  filterDifficulty: string;
  onTypeChange: (v: string) => void;
  onDifficultyChange: (v: string) => void;
}

const FilterSidebar = ({ filterType, filterDifficulty, onTypeChange, onDifficultyChange }: FilterSidebarProps) => (
  <div className="flex flex-col gap-3">
    {/* Post Type */}
    <div className={`rounded-2xl p-4 ${CARD_BG}`} style={CARD_STYLE}>
      <span className={LABEL}>Post Type</span>
      <div className="flex flex-col gap-1.5">
        {TYPE_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onTypeChange(value)}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
              filterType === value
                ? "bg-teal/10 border border-teal/40 text-[#5eead4]"
                : "text-white/40 hover:text-white/70 hover:bg-white/[0.04] border border-transparent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>

    {/* Difficulty */}
    <div className={`rounded-2xl p-4 ${CARD_BG}`} style={CARD_STYLE}>
      <span className={LABEL}>Difficulty</span>
      <div className="flex flex-col gap-1.5">
        {DIFFICULTY_FILTERS.map(({ value, label }) => {
          const isActive = filterDifficulty === value;
          const chipCls  = value !== "ALL" ? DIFFICULTY_CHIP[value] : "";
          return (
            <button
              key={value}
              type="button"
              onClick={() => onDifficultyChange(value)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 border ${
                isActive && value === "ALL"
                  ? "bg-teal/10 border-teal/40 text-[#5eead4]"
                  : isActive
                  ? `${chipCls} border-opacity-60`
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.04] border-transparent"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────

const TutorialCenterPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filterType       = searchParams.get("type")       ?? "ALL";
  const filterDifficulty = searchParams.get("difficulty") ?? "ALL";
  const filterTypeRef       = useRef(filterType);
  const filterDifficultyRef = useRef(filterDifficulty);

  const [posts,       setPosts]       = useState<PostDetail[]>([]);
  const [hasMore,     setHasMore]     = useState(true);
  const [isLoading,   setIsLoading]   = useState(false);
  const [initialDone, setInitialDone] = useState(false);
  const [fetchError,  setFetchError]  = useState(false);

  const [query,       setQuery]       = useState("");
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [, setSavedSearches] = useState<string[]>(() => loadList(LS_SAVED_KEY));

  const listRef      = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const isFetching   = useRef(false);
  const page         = useRef(0);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchPosts = useCallback((pageIndex: number, onComplete?: () => void) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setIsLoading(true);
    setFetchError(false);

    const params: Record<string, unknown> = { page: pageIndex, size: PAGE_SIZE };
    if (filterTypeRef.current !== "ALL") params.postType = filterTypeRef.current;
    // TODO: pass difficulty param once backend supports it
    // if (filterDifficultyRef.current !== "ALL") params.difficulty = filterDifficultyRef.current;

    axiosApiInstance
      .get("/posts/any", { params })
      .then((res) => {
        let mapped: PostDetail[] = (res.data?.content ?? [])
          .map(mapPostDetail)
          .filter((p: PostDetail) => p.postType === "COMBO" || p.postType === "TRICK_TUTORIAL");

        // Client-side difficulty filter until backend supports it
        if (filterDifficultyRef.current !== "ALL") {
          mapped = mapped.filter(
            (p) => p.difficultyTag?.toUpperCase() === filterDifficultyRef.current
          );
        }

        if (pageIndex === 0) setPosts(mapped);
        else setPosts((prev) => [...prev, ...mapped]);
        setHasMore(pageIndex < (res.data?.totalPages ?? 1) - 1);
        page.current = pageIndex;
      })
      .catch(() => setFetchError(true))
      .finally(() => {
        setIsLoading(false);
        setInitialDone(true);
        isFetching.current = false;
        onComplete?.();
      });
  }, []);

  useEffect(() => { fetchPosts(0); }, [fetchPosts]);

  // ── Filter handlers ───────────────────────────────────────────────────────

  const handleTypeChange = useCallback((v: string) => {
    filterTypeRef.current = v;
    const next: Record<string, string> = {};
    if (v !== "ALL") next.type = v;
    if (filterDifficultyRef.current !== "ALL") next.difficulty = filterDifficultyRef.current;
    setSearchParams(next, { replace: true });
    setPosts([]); setInitialDone(false); setHasMore(true); isFetching.current = false;
    fetchPosts(0);
  }, [fetchPosts, setSearchParams]);

  const handleDifficultyChange = useCallback((v: string) => {
    filterDifficultyRef.current = v;
    const next: Record<string, string> = {};
    if (filterTypeRef.current !== "ALL") next.type = filterTypeRef.current;
    if (v !== "ALL") next.difficulty = v;
    setSearchParams(next, { replace: true });
    setPosts([]); setInitialDone(false); setHasMore(true); isFetching.current = false;
    fetchPosts(0);
  }, [fetchPosts, setSearchParams]);

  // ── Search handlers ───────────────────────────────────────────────────────

  const handleSearchSubmit = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    pushRecent(trimmed);
    setSavedSearches(loadList(LS_SAVED_KEY));
    setQuery(trimmed);
    setSearchOpen(false);
    // TODO: navigate to /tutorial-center/search?q=trimmed when that page exists
  }, []);

  const handleSelectSearch = (term: string) => {
    setQuery(term);
    setSearchOpen(false);
    handleSearchSubmit(term);
  };

  const handleStarSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const saved = loadList(LS_SAVED_KEY);
    const next  = saved.includes(term) ? saved.filter((s) => s !== term) : [term, ...saved];
    saveList(LS_SAVED_KEY, next);
    setSavedSearches(next);
  };

  // Click outside closes dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node))
        setSearchOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Pull-to-refresh ───────────────────────────────────────────────────────

  const pullStartY       = useRef<number | null>(null);
  const pullYRef         = useRef(0);
  const [pullY, setPullY]           = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRefreshingRef = useRef(false);
  const PULL_THRESHOLD  = 72;

  useEffect(() => {
    const prev = document.body.style.overscrollBehaviorY;
    document.body.style.overscrollBehaviorY = "contain";
    return () => { document.body.style.overscrollBehaviorY = prev; };
  }, []);

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (window.scrollY === 0 && !isRefreshingRef.current && !isFetching.current)
        pullStartY.current = e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => {
      if (pullStartY.current === null) return;
      const delta = e.touches[0].clientY - pullStartY.current;
      if (delta <= 0) { pullStartY.current = null; pullYRef.current = 0; setPullY(0); return; }
      e.preventDefault();
      const val = Math.min(delta * 0.45, PULL_THRESHOLD + 20);
      pullYRef.current = val; setPullY(val);
    };
    const onEnd = () => {
      if (pullYRef.current >= PULL_THRESHOLD && !isRefreshingRef.current && !isFetching.current) {
        isRefreshingRef.current = true; setIsRefreshing(true);
        pullYRef.current = 0; setPullY(0); pullStartY.current = null;
        fetchPosts(0, () => { setIsRefreshing(false); isRefreshingRef.current = false; });
      } else { pullYRef.current = 0; setPullY(0); pullStartY.current = null; }
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove",  onMove,  { passive: false });
    document.addEventListener("touchend",   onEnd);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove",  onMove);
      document.removeEventListener("touchend",   onEnd);
    };
  }, [fetchPosts]);

  // ── Virtualizer ───────────────────────────────────────────────────────────

  const virtualizer  = useWindowVirtualizer({
    count: posts.length,
    estimateSize: () => 550,
    overscan: 3,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });
  const virtualItems    = virtualizer.getVirtualItems();
  const lastVirtualItem = virtualItems[virtualItems.length - 1];

  useEffect(() => {
    if (!lastVirtualItem) return;
    if (lastVirtualItem.index >= posts.length - 1 && hasMore && !isFetching.current)
      fetchPosts(page.current + 1);
  }, [lastVirtualItem?.index, posts.length, hasMore, fetchPosts]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="w-full min-h-screen relative overflow-clip"
      style={{ background: "radial-gradient(ellipse at 50% 40%, #0d6b65 0%, #074440 50%, #021a18 100%)" }}
    >
      {/* Pull-to-refresh indicator */}
      {(pullY > 8 || isRefreshing) && (
        <div
          className="fixed left-1/2 z-50 pointer-events-none"
          style={{
            top: isRefreshing ? 68 : 56 + Math.max(0, pullY - 20),
            transform: "translateX(-50%)",
            transition: pullY === 0 ? "top 0.25s ease, opacity 0.25s ease" : "none",
            opacity: isRefreshing ? 1 : Math.min((pullY - 8) / 28, 1),
          }}
        >
          <div className={`w-8 h-8 rounded-full border-2 bg-[#021a18] shadow-xl flex items-center justify-center ${
            isRefreshing || pullY >= PULL_THRESHOLD
              ? "border-t-transparent animate-spin"
              : "border-white/20"
          }`} style={{ borderColor: isRefreshing || pullY >= PULL_THRESHOLD ? "#0d9488" : undefined }} />
        </div>
      )}

      {/* Maze pattern overlay */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M%200%2030%20L%2050%2030%20L%2050%200%20M%2030%2080%20L%2030%2050%20L%2080%2050' stroke='white' stroke-opacity='.03' stroke-width='10' fill='none' stroke-linecap='square'/%3E%3C/svg%3E")`,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10 w-full max-w-[1600px] mx-auto xsm:px-0 md:px-4 pt-0 pb-24">

        {/* ── Page header + search bar ── */}
        <div className="xsm:px-4 md:px-0 xsm:pt-6 md:pt-8 xsm:pb-0 md:pb-2 md:max-w-[1100px] md:mx-auto lg:max-w-none">
          <p className="text-teal/70 text-[10px] font-bold uppercase tracking-widest mb-1">Tricks & Tutorials</p>
          <h1 className="text-white font-bold xsm:text-2xl md:text-3xl mb-4">Tutorial Center</h1>

          {/* Search bar */}
          <div ref={searchWrapRef} className="relative xsm:mb-2 md:mb-0">
            <div className={`relative flex items-center transition-all duration-200 ${searchOpen ? "ring-2 ring-[#0d9488]/30 rounded-2xl" : ""}`}>
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className={`absolute left-5 text-base pointer-events-none transition-colors duration-200 ${searchOpen || query ? "text-[#5eead4]/80" : "text-white/30"}`}
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { handleSearchSubmit(query); }
                  if (e.key === "Escape") { setSearchOpen(false); inputRef.current?.blur(); }
                }}
                placeholder="Search tricks, tutorials, combos..."
                className={`w-full border xsm:py-5 md:py-4 pl-12 pr-12 xsm:text-base md:text-sm text-white placeholder-white/30 focus:outline-none transition-all duration-200 ${
                  searchOpen
                    ? "bg-[#031f1e] border-[#0d9488]/50 rounded-t-2xl rounded-b-none"
                    : "bg-[#021612] border-[#0d9488]/20 rounded-2xl hover:border-[#0d9488]/35"
                }`}
                style={{ boxShadow: searchOpen ? "0 0 0 3px rgba(13,148,136,0.08)" : "0 2px 24px rgba(0,0,0,0.5)" }}
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
              const recent   = loadList(LS_RECENT_KEY);
              const saved    = loadList(LS_SAVED_KEY);
              const filtered = query.trim()
                ? [...new Set([...saved, ...recent])].filter((s) => s.toLowerCase().includes(query.toLowerCase()))
                : [];
              const showSaved   = !query.trim() && saved.length > 0;
              const showRecent  = !query.trim() && recent.length > 0;
              const showResults = query.trim() && filtered.length > 0;
              const showEmpty   = query.trim() && filtered.length === 0;
              const showBlank   = !query.trim() && recent.length === 0 && saved.length === 0;

              return (
                <div
                  className="absolute left-0 right-0 z-50 bg-[#031f1e] border border-[#0d9488]/50 border-t-0 rounded-b-2xl overflow-hidden"
                  style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.7), 0 0 0 3px rgba(13,148,136,0.08)" }}
                >
                  {showBlank && (
                    <div className="px-5 py-4 text-white/25 text-xs">Search for specific tricks, combos, or tutorial styles</div>
                  )}
                  {showSaved && (
                    <div className="pt-3 pb-1">
                      <p className="px-5 text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Saved</p>
                      {saved.map((term) => (
                        <button key={term} type="button" onMouseDown={() => handleSelectSearch(term)}
                          className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.04] transition-colors duration-100 text-left">
                          <FontAwesomeIcon icon={faStar} className="text-[#5eead4]/50 text-[10px] flex-shrink-0" />
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
                          <button
                            type="button"
                            onMouseDown={(e) => handleStarSearch(term, e)}
                            className="ml-auto text-white/15 hover:text-[#5eead4]/60 transition-colors duration-100 flex-shrink-0"
                          >
                            <FontAwesomeIcon icon={faStar} className="text-[10px]" />
                          </button>
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
                  {query.trim() && (
                    <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-white/25 text-xs">Press <kbd className="border border-white/10 rounded px-1 py-0.5 bg-white/[0.04] text-white/30">Enter</kbd> to search</span>
                      <button type="button" onMouseDown={() => handleSearchSubmit(query)}
                        className="text-[#5eead4]/70 text-xs font-semibold hover:text-[#5eead4] transition-colors duration-150">
                        Search →
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Mobile-only filter chips */}
          <div className="md:hidden flex flex-col gap-2 xsm:py-2">
            {/* Type chips */}
            <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {TYPE_FILTERS.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => handleTypeChange(value)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-150 ${
                    filterType === value
                      ? "bg-[#0d9488]/20 border-[#0d9488]/40 text-[#5eead4]"
                      : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/60"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {/* Difficulty chips */}
            <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {DIFFICULTY_FILTERS.map(({ value, label }) => {
                const isActive = filterDifficulty === value;
                const chipCls  = value !== "ALL" ? DIFFICULTY_CHIP[value] : "";
                return (
                  <button key={value} type="button" onClick={() => handleDifficultyChange(value)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-150 ${
                      isActive && value === "ALL"
                        ? "bg-[#0d9488]/20 border-[#0d9488]/40 text-[#5eead4]"
                        : isActive
                        ? chipCls
                        : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/60"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Desktop divider ── */}
        <div className="xsm:hidden md:block h-px bg-white/[0.06] md:mb-0" />

        {/* ── Layout ── */}
        <div className="flex items-start justify-center md:gap-6 overflow-x-hidden md:pt-2">

          {/* Left sidebar — recent searches (lg only) */}
          <aside className="xsm:hidden lg:block lg:w-[240px] flex-shrink-0 sticky top-[72px]" style={{ marginTop: "-80px" }}>
            <div className={`rounded-2xl p-4 ${CARD_BG}`} style={CARD_STYLE}>
              <span className={LABEL}>Recent Searches</span>
              <RecentSearchSidebar onSelect={handleSelectSearch} />
            </div>
          </aside>

          {/* ── Feed column ── */}
          <div className="xsm:w-full md:w-[600px] flex-shrink-0 min-w-0">

            {!initialDone ? (
              <div className="flex justify-center py-24">
                <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#0d9488", borderTopColor: "transparent" }} />
              </div>
            ) : fetchError && posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <p className="text-white/40 text-sm">Failed to load posts.</p>
                <button type="button"
                  onClick={() => { setInitialDone(false); setHasMore(true); isFetching.current = false; fetchPosts(0); }}
                  className="text-[#5eead4]/70 text-xs hover:text-[#5eead4] transition-colors duration-150"
                >
                  Try again
                </button>
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-2">
                <p className="text-white/40 text-sm">No posts yet.</p>
                <p className="text-white/20 text-xs">Be the first to share a combo or tutorial!</p>
              </div>
            ) : (
              <div
                ref={listRef}
                style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}
              >
                {virtualItems.map((vItem) => {
                  const post = posts[vItem.index];
                  return (
                    <div
                      key={vItem.key}
                      data-index={vItem.index}
                      ref={virtualizer.measureElement}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${vItem.start - virtualizer.options.scrollMargin}px)`,
                      }}
                      className="xsm:px-4 md:px-0 pb-3"
                    >
                      <FeedPostCard post={post} index={vItem.index} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Loading more */}
            {isLoading && initialDone && (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#0d9488", borderTopColor: "transparent" }} />
              </div>
            )}

            {/* End of feed */}
            {initialDone && !hasMore && posts.length > 0 && (
              <div className="flex flex-col items-center py-10 gap-2">
                <div className="w-8 h-px bg-white/[0.08]" />
                <p className="text-white/20 text-xs">You've seen it all</p>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="xsm:hidden md:block md:w-[240px] lg:w-[260px] flex-shrink-0 sticky top-[72px] flex flex-col gap-3" style={{ marginTop: "-80px" }}>
            {/* Recent searches — md only (moves to left at lg) */}
            <div className={`lg:hidden rounded-2xl p-4 ${CARD_BG}`} style={CARD_STYLE}>
              <span className={LABEL}>Recent Searches</span>
              <RecentSearchSidebar onSelect={handleSelectSearch} />
            </div>
            {/* Filters — always visible on desktop */}
            <FilterSidebar
              filterType={filterType}
              filterDifficulty={filterDifficulty}
              onTypeChange={handleTypeChange}
              onDifficultyChange={handleDifficultyChange}
            />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default TutorialCenterPage;
