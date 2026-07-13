import { useEffect, useRef, useState, useCallback } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-solid-svg-icons";
import { axiosApiInstance } from "../api/axios";
import { PostDetail, mapPostDetail } from "../modals/Post";
import { useAppSelector } from "../redux/hooks";
import FeedPostCard from "../components/FeedPostCard";
import FeedPostCardSkeleton from "../components/skeletons/FeedPostCardSkeleton";

const PAGE_SIZE = 20;

// ── Sidebar constants ─────────────────────────────────────────────────────────

const POST_TYPE_FILTERS = [
  { value: "ALL",           label: "All"       },
  { value: "COMBO",         label: "Combo"     },
  { value: "TRICK_TUTORIAL",label: "Tutorial"  },
  { value: "GENERIC",       label: "Generic"   },
  { value: "BUY_SELL",      label: "Buy / Sell"},
  { value: "TRADE",         label: "Trade"     },
] as const;

interface SidebarProps {
  filterType: string;
  onTypeChange: (v: string) => void;
}

const CommunitySidebar = ({ filterType, onTypeChange }: SidebarProps) => {
  const navigate = useNavigate();
  const user     = useAppSelector((state) => state.auth.user);

  const anyFilterActive = filterType !== "ALL";

  const cardStyle = SIDEBAR_CARD_STYLE;
  const cardBg = SIDEBAR_CARD_BG;

  return (
    <div className="flex flex-col gap-3">

      {/* Auth card / mini profile card */}
      {user ? (
        <div className={`rounded-2xl overflow-hidden ${cardBg}`} style={cardStyle}>
          {/* Banner strip — no overflow-hidden so avatar sibling can overlap freely */}
          <div className="h-16 bg-gradient-to-br from-[#0e3548] via-[#0a2535] to-[#061a25] relative flex-shrink-0 rounded-t-2xl">
            <div className="absolute inset-0 opacity-30"
              style={{ backgroundImage: "radial-gradient(ellipse at 30% 50%, rgba(16,129,152,0.4) 0%, transparent 70%)" }}
            />
          </div>

          {/* Avatar — overlaps banner; relative z-10 so it paints above the positioned banner */}
          <div className="relative z-10 flex flex-col items-center -mt-9 px-5 pb-5">
            {user.profileImg ? (
              <img
                src={user.profileImg}
                alt=""
                className="w-[72px] h-[72px] rounded-full object-cover ring-2 ring-blue-primary/50 border-[3px] border-[#0d1117]"
              />
            ) : (
              <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-blue-primary/30 to-blue-primary/10 ring-2 ring-blue-primary/50 border-[3px] border-[#0d1117] flex items-center justify-center">
                <span className="text-blue-primary font-bold text-2xl">{user.displayName?.charAt(0).toUpperCase() ?? "?"}</span>
              </div>
            )}
            <div className="flex flex-col items-center gap-0.5 mt-3 min-w-0 w-full">
              <span className="text-white font-semibold text-sm truncate max-w-full text-center">{user.displayName}</span>
              <span className="text-blue-primary/70 text-[11px]">#{user.identifierCode}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex bg-[#040f14] border-t border-white/[0.06]">
            {([
              { label: "Posts",     value: user?.postCount      ?? 0 },
              { label: "Followers", value: user?.followerCount  ?? 0 },
              { label: "Following", value: user?.followingCount ?? 0 },
            ]).map(({ label, value }) => (
              <div key={label} className="flex-1 flex flex-col items-center py-3.5 border-r border-white/[0.06] last:border-r-0">
                <span className="text-white font-bold text-base leading-none">{value.toLocaleString()}</span>
                <span className="text-white/40 text-[9px] uppercase tracking-wider mt-1">{label}</span>
              </div>
            ))}
          </div>

          {/* View profile */}
          <div className="px-4 py-3 border-t border-white/[0.06]">
            <button
              onClick={() => navigate(`/${user.displayName}/${user.identifierCode}`)}
              className="w-full py-2 rounded-xl bg-blue-primary/15 hover:bg-blue-primary/25 border border-blue-primary/30 hover:border-blue-primary/60 text-blue-primary text-xs font-semibold transition-all duration-150"
            >
              View Profile →
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`rounded-2xl overflow-hidden ${cardBg}`}
          style={cardStyle}
        >
          {/* Banner strip */}
          <div className="h-16 bg-gradient-to-br from-[#0e3548] via-[#0a2535] to-[#061a25] relative flex-shrink-0">
            <div className="absolute inset-0 opacity-30"
              style={{ backgroundImage: "radial-gradient(ellipse at 30% 50%, rgba(16,129,152,0.4) 0%, transparent 70%)" }}
            />
            {/* Lock/person icon placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <span className="text-white/20 text-lg">?</span>
              </div>
            </div>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-white font-semibold text-sm">Join the Community</h3>
              <p className="text-white/40 text-xs leading-relaxed">Create an account to post, follow flippers, and build your knife collection.</p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate("/register")}
                className="w-full py-2.5 rounded-xl bg-blue-primary text-white text-xs font-semibold hover:bg-blue-primary/80 transition-colors duration-150"
              >
                Create Account
              </button>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-2.5 rounded-xl bg-blue-primary/10 border border-blue-primary/25 text-blue-primary text-xs font-medium hover:bg-blue-primary/20 hover:border-blue-primary/40 transition-all duration-150"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={`rounded-2xl p-4 flex flex-col gap-4 ${cardBg}`} style={cardStyle}>
        <div className="flex items-center justify-between">
          <span className="text-white/70 text-xs font-bold uppercase tracking-widest">Filters</span>
          {anyFilterActive && (
            <button
              onClick={() => onTypeChange("ALL")}
              className="text-[10px] text-blue-primary/70 hover:text-blue-primary transition-colors duration-150 font-medium"
            >
              Reset
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-white/40 text-[10px] uppercase tracking-widest font-medium">Post Type</span>
          <div className="grid grid-cols-3 gap-1.5">
            {POST_TYPE_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onTypeChange(value)}
                className={`py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-150 truncate px-1 ${
                  filterType === value
                    ? "bg-blue-primary border-blue-primary text-white shadow-[0_0_12px_rgba(16,129,152,0.4)]"
                    : "bg-white/[0.04] border-white/[0.08] text-white/45 hover:text-white hover:bg-white/[0.07] hover:border-blue-primary/35"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Learn card — hidden on lg (shown in left sidebar instead) */}
      <div className="lg:hidden h-px bg-white/10 mt-3 mb-1" />
      <div className={`lg:hidden rounded-2xl overflow-hidden ${cardBg}`} style={cardStyle}>
        <div className="h-12 bg-gradient-to-r from-blue-primary/20 via-blue-primary/10 to-transparent relative flex items-center px-4 gap-2.5">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(ellipse at 0% 50%, rgba(16,129,152,0.6) 0%, transparent 60%)" }} />
          <span className="relative text-base leading-none">📖</span>
          <span className="relative text-white/50 text-[10px] font-bold uppercase tracking-widest">Learn</span>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-white font-semibold text-sm">New to balisongs?</h3>
            <p className="text-white/40 text-xs leading-relaxed">Learn about terminology, balisong anatomy, how to get started, and what makes balisong flipping special.</p>
          </div>
          <button
            onClick={() => navigate("/learn")}
            className="w-full py-2.5 rounded-xl bg-blue-primary/10 border border-blue-primary/25 text-blue-primary text-xs font-semibold hover:bg-blue-primary/20 hover:border-blue-primary/50 transition-all duration-150"
          >
            Start Learning →
          </button>
        </div>
      </div>

    </div>
  );
};

// ── Shared sidebar constants ──────────────────────────────────────────────────
const SIDEBAR_CARD_STYLE = { boxShadow: "0 4px 24px rgba(0,0,0,0.5)" };
const SIDEBAR_CARD_BG = "bg-[#0d1117] border border-white/[0.08]";

// ── Community page ────────────────────────────────────────────────────────────

const CreatePostPrompt = ({ posts: _ }: { posts: PostDetail[] }) => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  if (user) {
    return (
      <button
        type="button"
        onClick={() => navigate("/create-post")}
        className="w-full flex items-center gap-3 bg-gradient-to-r from-[#0d1a1f] to-[#0a1518] border border-white/[0.12] hover:border-white/[0.22] rounded-2xl px-4 py-3.5 transition-colors duration-200 group"
      >
        {user.profileImg ? (
          <img src={user.profileImg} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-white/15" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-blue-primary/20 border border-blue-primary/30 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-primary text-sm font-bold leading-none">
              {user.displayName?.charAt(0).toUpperCase() ?? "?"}
            </span>
          </div>
        )}
        <span className="text-white/30 text-sm group-hover:text-white/50 transition-colors duration-200 text-left flex-1">
          What are you flipping today?
        </span>
        <FontAwesomeIcon icon={faImage} className="text-white/20 text-sm flex-shrink-0 group-hover:text-white/40 transition-colors duration-200" />
      </button>
    );
  }

  return (
    <div className="w-full flex items-center gap-3 bg-gradient-to-r from-[#0d1a1f] to-[#0a1518] border border-white/[0.12] rounded-2xl px-4 py-3.5">
      <p className="text-white/35 text-sm flex-1">Share your flips with the community.</p>
      <button
        type="button"
        onClick={() => navigate("/login")}
        className="flex-shrink-0 px-4 py-1.5 rounded-xl bg-blue-primary text-white text-xs font-semibold hover:bg-blue-primary/80 transition-colors duration-150"
      >
        Sign In
      </button>
    </div>
  );
};

const CommunityPage = () => {
  const navigate = useNavigate();
  const [posts,       setPosts]       = useState<PostDetail[]>([]);
  const [page,        setPage]        = useState(0);
  const [hasMore,     setHasMore]     = useState(true);
  const [isLoading,   setIsLoading]   = useState(false);
  const [initialDone, setInitialDone] = useState(false);
  const [fetchError,  setFetchError]  = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const filterType = searchParams.get("type") ?? "ALL";

  const listRef       = useRef<HTMLDivElement>(null);
  const isFetching    = useRef(false);
  const filterTypeRef = useRef(filterType);

  const fetchPosts = useCallback((pageIndex: number, onComplete?: () => void) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setIsLoading(true);
    setFetchError(false);
    const params: Record<string, unknown> = { page: pageIndex, size: PAGE_SIZE };
    if (filterTypeRef.current !== "ALL") params.postType = filterTypeRef.current;
    axiosApiInstance
      .get("/posts/any", { params })
      .then((res) => {
        const mapped: PostDetail[] = (res.data?.content ?? []).map(mapPostDetail);
        setPosts((prev) => pageIndex === 0 ? mapped : [...prev, ...mapped]);
        setHasMore(!res.data?.last);
        setPage(pageIndex);
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

  // Pull-to-refresh
  const pullStartY   = useRef<number | null>(null);
  const pullYRef     = useRef(0);
  const [pullY, setPullY]           = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRefreshingRef = useRef(false);
  const PULL_THRESHOLD = 72;

  useEffect(() => {
    const prevBody = document.body.style.overscrollBehaviorY;
    const prevHtml = document.documentElement.style.overscrollBehaviorY;
    document.body.style.overscrollBehaviorY = "contain";
    document.documentElement.style.overscrollBehaviorY = "contain";
    return () => {
      document.body.style.overscrollBehaviorY = prevBody;
      document.documentElement.style.overscrollBehaviorY = prevHtml;
    };
  }, []);

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (window.scrollY === 0 && !isRefreshingRef.current && !isFetching.current) {
        pullStartY.current = e.touches[0].clientY;
      }
    };
    const onMove = (e: TouchEvent) => {
      if (pullStartY.current === null) return;
      const delta = e.touches[0].clientY - pullStartY.current;
      if (delta <= 0) { pullStartY.current = null; pullYRef.current = 0; setPullY(0); return; }
      // Prevent Chrome's native pull-to-refresh from firing
      e.preventDefault();
      const val = Math.min(delta * 0.45, PULL_THRESHOLD + 20);
      pullYRef.current = val;
      setPullY(val);
    };
    const onEnd = () => {
      if (pullYRef.current >= PULL_THRESHOLD && !isRefreshingRef.current && !isFetching.current) {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        pullYRef.current = 0;
        setPullY(0);
        pullStartY.current = null;
        fetchPosts(0, () => { setIsRefreshing(false); isRefreshingRef.current = false; });
      } else {
        pullYRef.current = 0;
        setPullY(0);
        pullStartY.current = null;
      }
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    // Must be non-passive to allow e.preventDefault() which blocks native pull-to-refresh
    document.addEventListener("touchmove",  onMove,  { passive: false });
    document.addEventListener("touchend",   onEnd);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove",  onMove);
      document.removeEventListener("touchend",   onEnd);
    };
  }, [fetchPosts]);

  const handleTypeChange = useCallback((v: string) => {
    filterTypeRef.current = v;
    setSearchParams(v === "ALL" ? {} : { type: v }, { replace: true });
    setPosts([]);
    setInitialDone(false);
    setHasMore(true);
    isFetching.current = false;
    fetchPosts(0);
  }, [fetchPosts, setSearchParams]);

  // Virtual list — only renders posts near the viewport
  const virtualizer = useWindowVirtualizer({
    count: posts.length,
    estimateSize: () => 550,
    overscan: 3,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  const virtualItems    = virtualizer.getVirtualItems();
  const lastVirtualItem = virtualItems[virtualItems.length - 1];

  // Infinite scroll — trigger when the last rendered item approaches the end of loaded posts
  useEffect(() => {
    if (!lastVirtualItem) return;
    if (lastVirtualItem.index >= posts.length - 1 && hasMore && !isFetching.current) {
      fetchPosts(page + 1);
    }
  }, [lastVirtualItem?.index, posts.length, hasMore, fetchPosts, page]);

  return (
    <div
      className="w-full min-h-screen relative overflow-clip"
      style={{ background: "radial-gradient(ellipse at 50% 40%, #0c2d35 0%, #061a1f 50%, #030d11 100%)" }}
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
          <div className={`w-8 h-8 rounded-full border-2 bg-[#0d1a1f] shadow-xl flex items-center justify-center ${
            isRefreshing || pullY >= PULL_THRESHOLD
              ? "border-blue-primary border-t-transparent animate-spin"
              : "border-white/20"
          }`} />
        </div>
      )}
      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 z-0 opacity-[0.18] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative z-10 w-full max-w-[1600px] mx-auto xsm:px-0 md:px-4 pt-0 pb-24">
        <div className="flex items-start md:gap-6">

          {/* ── Left sidebar — lg only, fills space to center the feed ── */}
          <aside className="xsm:hidden lg:block flex-1 min-w-0 sticky top-[72px] pt-6 mt-[60px]">
            <div className={`rounded-2xl overflow-hidden ${SIDEBAR_CARD_BG}`} style={SIDEBAR_CARD_STYLE}>
                <div className="h-12 bg-gradient-to-r from-blue-primary/20 via-blue-primary/10 to-transparent relative flex items-center px-4 gap-2.5">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(ellipse at 0% 50%, rgba(16,129,152,0.6) 0%, transparent 60%)" }} />
                  <span className="relative text-base leading-none">📖</span>
                  <span className="relative text-white/50 text-[10px] font-bold uppercase tracking-widest">Learn</span>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-white font-semibold text-sm">New to balisongs?</h3>
                    <p className="text-white/40 text-xs leading-relaxed">Learn about terminology, balisong anatomy, how to get started, and what makes balisong flipping special.</p>
                  </div>
                  <button
                    onClick={() => navigate("/learn")}
                    className="w-full py-2.5 rounded-xl bg-blue-primary/10 border border-blue-primary/25 text-blue-primary text-xs font-semibold hover:bg-blue-primary/20 hover:border-blue-primary/50 transition-all duration-150"
                  >
                    Start Learning →
                  </button>
                </div>
            </div>
          </aside>

          {/* ── Feed column ── */}
          <div className="xsm:w-full md:w-[600px] lg:w-[600px] flex-shrink-0 min-w-0">

            {/* Create post prompt */}
            <div className="xsm:px-4 md:px-0 pt-1 pb-2">
              <CreatePostPrompt posts={posts} />
            </div>
            <div className="h-px bg-white/[0.06] xsm:mx-4 md:mx-0 mb-1" />

            {/* ── Initial loading ── */}
            {!initialDone && (
              <div className="flex flex-col">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="xsm:pb-1 lg:pb-3">
                    <FeedPostCardSkeleton />
                  </div>
                ))}
              </div>
            )}

            {/* ── Error state ── */}
            {fetchError && posts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <p className="text-white/40 text-sm">Failed to load posts.</p>
                <button
                  type="button"
                  onClick={() => fetchPosts(0)}
                  className="text-blue-primary text-xs hover:text-blue-primary/70 transition-colors"
                >
                  Try again
                </button>
              </div>
            )}

            {/* ── Virtual feed ── */}
            <div
              ref={listRef}
              style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}
            >
              {virtualItems.map((virtualItem) => (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start - virtualizer.options.scrollMargin}px)`,
                  }}
                  className="xsm:pb-1 lg:pb-3"
                >
                  <FeedPostCard post={posts[virtualItem.index]} index={virtualItem.index} />
                </div>
              ))}
            </div>

            {/* ── Loading more spinner ── */}
            {isLoading && initialDone && (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 rounded-full border-2 border-blue-primary border-t-transparent animate-spin" />
              </div>
            )}

            {/* ── End of feed ── */}
            {!hasMore && posts.length > 0 && (
              <p className="text-center text-white/20 text-xs py-4">You're all caught up</p>
            )}

          </div>{/* end feed column */}

          {/* ── Right sidebar — md+, fills remaining space ── */}
          {/* mt offset matches create-post prompt height so card top aligns with first post */}
          <aside className="xsm:hidden md:block flex-1 min-w-0 md:max-w-[360px] lg:max-w-none sticky top-[72px] pt-6 mt-[60px]">
            <CommunitySidebar
              filterType={filterType}
              onTypeChange={handleTypeChange}
            />
          </aside>

        </div>{/* end flex row */}
      </div>
    </div>
  );
};

export default CommunityPage;

