import { useEffect, useRef, useState } from "react";
import { PostCover, mapPostCover } from "../modals/Post";
import { axiosApiInstanceAuth } from "../api/axios";
import ProfilePostCover from "./ProfilePostCover";
import { useAppSelector } from "../redux/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faTableCells, faPlus, faHeart } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

const FILTER_OPTIONS = ["All", "Sell/Trade", "Flipping", "Show-Off", "Collection", "Mod-Work"] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

type SortOption = "newest" | "oldest" | "likes" | "comments";
type Tab = "posts" | "liked";

const SORT_LABELS: Record<SortOption, string> = {
  newest:   "Newest",
  oldest:   "Oldest",
  likes:    "Most Liked",
  comments: "Most Commented",
};

const PAGE_SIZE = 20;

const UserProfilePostsComponent = () => {
  const [activeTab, setActiveTab]     = useState<Tab>("posts");

  // Posts tab state
  const [activeFilter, setActiveFilter] = useState<FilterOption>("All");
  const [sortBy, setSortBy]             = useState<SortOption>("newest");
  const [filterOpen, setFilterOpen]     = useState(false);
  const [sortOpen, setSortOpen]         = useState(false);
  const [posts, setPosts]               = useState<PostCover[]>([]);
  const [page, setPage]                 = useState(0);
  const [hasMore, setHasMore]           = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [fetchError, setFetchError]     = useState(false);

  // Liked tab state
  const [likedPosts,   setLikedPosts]   = useState<PostCover[]>([]);
  const [likedPage,    setLikedPage]    = useState(0);
  const [likedHasMore, setLikedHasMore] = useState(false);
  const [likedLoading, setLikedLoading] = useState(false);
  const [likedError,   setLikedError]   = useState(false);
  const likedFetched = useRef(false);

  const user       = useAppSelector((state) => state.auth.user);
  const navigate   = useNavigate();
  const location   = useLocation();
  const filterRef  = useRef<HTMLDivElement>(null);
  const sortRef    = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
      if (sortRef.current   && !sortRef.current.contains(e.target as Node))   setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch own posts
  const fetchPosts = (pageIndex: number, replace = false) => {
    if (!user?.id) return;
    setIsLoading(true);
    setFetchError(false);
    axiosApiInstanceAuth
      .get(`/posts/any`, { params: { accountId: user.id, page: pageIndex, size: PAGE_SIZE } })
      .then((res) => {
        const mapped: PostCover[] = (res.data?.content ?? []).map(mapPostCover);
        setPosts((prev) => replace ? mapped : [...prev, ...mapped]);
        setHasMore(pageIndex < (res.data?.totalPages ?? 1) - 1);
      })
      .catch(() => setFetchError(true))
      .finally(() => setIsLoading(false));
  };

  // Fetch liked posts
  const fetchLiked = (pageIndex: number, replace = false) => {
    setLikedLoading(true);
    setLikedError(false);
    axiosApiInstanceAuth
      .get(`/posts/me/liked`, { params: { page: pageIndex, size: PAGE_SIZE } })
      .then((res) => {
        const mapped: PostCover[] = (res.data?.content ?? []).map(mapPostCover);
        setLikedPosts((prev) => replace ? mapped : [...prev, ...mapped]);
        setLikedHasMore(pageIndex < (res.data?.totalPages ?? 1) - 1);
      })
      .catch(() => setLikedError(true))
      .finally(() => setLikedLoading(false));
  };

  useEffect(() => { fetchPosts(0, true); }, [user?.id]);

  // Fetch liked posts on first tab switch
  useEffect(() => {
    if (activeTab === "liked" && !likedFetched.current) {
      likedFetched.current = true;
      fetchLiked(0, true);
    }
  }, [activeTab]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPosts(next);
  };

  const handleLikedLoadMore = () => {
    const next = likedPage + 1;
    setLikedPage(next);
    fetchLiked(next);
  };

  // Filter + sort (posts tab only)
  const filtered = activeFilter === "All" ? posts : posts.filter((p) => p.identifier === activeFilter);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "likes")    return b.likes    - a.likes;
    if (sortBy === "comments") return b.comments - a.comments;
    return 0;
  });

  return (
    <div className="w-full flex flex-col text-white">

      {/* ── Tabs ── */}
      <div className="flex border-t border-white/10 relative">
        {/* Track */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.06]" />

        <button
          type="button"
          onClick={() => setActiveTab("posts")}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all duration-200 relative ${
            activeTab === "posts" ? "text-blue-primary" : "text-white/35 hover:text-white/55"
          }`}
        >
          <FontAwesomeIcon icon={faTableCells} className="text-xs" />
          Posts
          {activeTab === "posts" && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-primary"
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("liked")}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all duration-200 relative ${
            activeTab === "liked" ? "text-blue-primary" : "text-white/35 hover:text-white/55"
          }`}
        >
          <FontAwesomeIcon icon={faHeart} className="text-xs" />
          Liked
          {activeTab === "liked" && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-primary"
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          )}
        </button>
      </div>

      {activeTab === "posts" ? (
        <>
          {/* ── Filter + Sort bar ── */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center px-6 py-4 border-b border-white/[0.06] xsm:gap-1 md:gap-3">

            {/* Filter dropdown */}
            <div ref={filterRef} className="relative justify-self-start">
              <button
                type="button"
                onClick={() => { setFilterOpen((p) => !p); setSortOpen(false); }}
                className="flex items-center gap-1.5 xsm:px-2 xsm:py-1 xsm:text-xs md:px-3 md:py-1.5 md:text-sm rounded-lg font-medium border bg-blue-primary border-blue-primary text-white transition-all duration-150 whitespace-nowrap"
              >
                {activeFilter}
                <FontAwesomeIcon icon={faChevronDown} className={`text-xs transition-transform duration-200 ${filterOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {filterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute left-0 top-full mt-1 w-40 rounded-xl border border-white/10 bg-dark-neutral-offset overflow-y-auto z-20 max-h-64"
                    style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.8)" }}
                  >
                    {FILTER_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { setActiveFilter(opt); setFilterOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 hover:bg-white/5 ${
                          activeFilter === opt ? "text-white bg-white/5" : "text-white/55 hover:text-white"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Center — count */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3">
                <div className="w-20 h-px bg-white/10" />
                <div className="w-px h-5 bg-white/10 flex-shrink-0" />
              </div>
              <div className="flex flex-col items-center gap-0.5 flex-shrink-0 px-2">
                <span className="text-white font-bold text-lg leading-none">{sorted.length}</span>
                <span className="text-white/30 text-[10px] uppercase tracking-widest leading-none">
                  {activeFilter === "All" ? "Posts" : activeFilter}
                </span>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <div className="w-px h-5 bg-white/10 flex-shrink-0" />
                <div className="w-20 h-px bg-white/10" />
              </div>
            </div>

            {/* Sort dropdown */}
            <div ref={sortRef} className="relative justify-self-end">
              <button
                type="button"
                onClick={() => { setSortOpen((p) => !p); setFilterOpen(false); }}
                className="flex items-center gap-1.5 xsm:px-2 xsm:py-1 xsm:text-xs md:px-3 md:py-1.5 md:text-sm text-white/50 hover:text-white bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-150 whitespace-nowrap rounded-lg"
              >
                {SORT_LABELS[sortBy]}
                <FontAwesomeIcon icon={faChevronDown} className={`text-xs transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-white/10 bg-dark-neutral-offset overflow-hidden z-20"
                    style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.8)" }}
                  >
                    {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { setSortBy(opt); setSortOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-white/5 ${
                          sortBy === opt ? "text-white bg-white/5" : "text-white/55 hover:text-white"
                        }`}
                      >
                        {SORT_LABELS[opt]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Posts grid */}
          {isLoading && posts.length === 0 ? (
            <div className="grid xsm:grid-cols-3 lg:grid-cols-4 xsm:gap-px lg:gap-3 xsm:px-0 lg:px-6 animate-pulse">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="aspect-square bg-white/[0.06] xsm:rounded-none lg:rounded-xl" />
              ))}
            </div>
          ) : fetchError && posts.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center py-24 gap-3">
              <p className="text-white/40 text-sm">Failed to load posts.</p>
              <button type="button" onClick={() => fetchPosts(0, true)} className="text-blue-primary text-xs hover:text-blue-primary/70 transition-colors duration-150">
                Try again
              </button>
            </div>
          ) : sorted.length > 0 ? (
            <div className="flex flex-col xsm:gap-0 lg:gap-4 xsm:px-0 lg:px-6 xsm:pt-0.5 lg:pt-2 pb-8">
              <div className="grid xsm:grid-cols-3 lg:grid-cols-4 xsm:gap-px lg:gap-3">
                {sorted.map((post) => (
                  <ProfilePostCover post={post} key={post.id} onOpen={(id) => navigate(`/post/${id}`, { state: { backgroundLocation: location } })} />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="px-6 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm font-medium hover:text-white hover:border-white/20 hover:bg-white/5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-transparent animate-spin" /> Loading...</> : "Load More"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <FontAwesomeIcon icon={faTableCells} className="text-white/20 text-2xl" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-white/50 text-sm font-medium">
                  {activeFilter === "All" ? "No posts yet." : `No ${activeFilter} posts yet.`}
                </p>
                {activeFilter === "All" && <p className="text-white/25 text-xs">Share your first flip with the community.</p>}
              </div>
              {activeFilter === "All" && (
                <button
                  type="button"
                  onClick={() => navigate("/create-post")}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/50 hover:text-white text-sm transition-all duration-200"
                >
                  <FontAwesomeIcon icon={faPlus} className="text-xs" />
                  Create a post
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        /* ── Liked tab ── */
        <>
          {likedLoading && likedPosts.length === 0 ? (
            <div className="grid xsm:grid-cols-3 lg:grid-cols-4 xsm:gap-px lg:gap-3 xsm:px-0 lg:px-6 animate-pulse">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="aspect-square bg-white/[0.06] xsm:rounded-none lg:rounded-xl" />
              ))}
            </div>
          ) : likedError && likedPosts.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center py-24 gap-3">
              <p className="text-white/40 text-sm">Failed to load liked posts.</p>
              <button type="button" onClick={() => fetchLiked(0, true)} className="text-blue-primary text-xs hover:text-blue-primary/70 transition-colors duration-150">
                Try again
              </button>
            </div>
          ) : likedPosts.length > 0 ? (
            <div className="flex flex-col xsm:gap-0 lg:gap-4 xsm:px-0 lg:px-6 xsm:pt-0.5 lg:pt-2 pb-8">
              <div className="grid xsm:grid-cols-3 lg:grid-cols-4 xsm:gap-px lg:gap-3">
                {likedPosts.map((post) => (
                  <ProfilePostCover post={post} key={post.id} onOpen={(id) => navigate(`/post/${id}`, { state: { backgroundLocation: location } })} />
                ))}
              </div>
              {likedHasMore && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleLikedLoadMore}
                    disabled={likedLoading}
                    className="px-6 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm font-medium hover:text-white hover:border-white/20 hover:bg-white/5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {likedLoading ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-transparent animate-spin" /> Loading...</> : "Load More"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <FontAwesomeIcon icon={faHeart} className="text-white/20 text-2xl" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-white/50 text-sm font-medium">No liked posts yet.</p>
                <p className="text-white/25 text-xs">Posts you like will show up here.</p>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default UserProfilePostsComponent;
