import { useEffect, useRef, useState } from "react";
import { PostCover, mapPostCover } from "../modals/Post";
import { axiosApiInstance } from "../api/axios";
import ProfilePostCover from "./ProfilePostCover";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faTableCells } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

const FILTER_OPTIONS = ["All", "Sell/Trade", "Flipping", "Show-Off", "Collection", "Mod-Work"] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

type SortOption = "newest" | "oldest" | "likes" | "comments";

const SORT_LABELS: Record<SortOption, string> = {
  newest:   "Newest",
  oldest:   "Oldest",
  likes:    "Most Liked",
  comments: "Most Commented",
};

const PAGE_SIZE = 20;

interface Props {
  accountId: string;
}

const PublicProfilePostsComponent = ({ accountId }: Props) => {
  const [activeFilter, setActiveFilter] = useState<FilterOption>("All");
  const [sortBy, setSortBy]             = useState<SortOption>("newest");
  const [filterOpen, setFilterOpen]     = useState(false);
  const [sortOpen, setSortOpen]         = useState(false);
  const [posts, setPosts]               = useState<PostCover[]>([]);
  const [page, setPage]                 = useState(0);
  const [hasMore, setHasMore]           = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [fetchError, setFetchError]     = useState(false);

  const navigate  = useNavigate();
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef   = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
      if (sortRef.current   && !sortRef.current.contains(e.target as Node))   setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchPosts = (pageIndex: number, replace = false) => {
    if (!accountId) return;
    setIsLoading(true);
    setFetchError(false);
    axiosApiInstance
      .get(`/posts/any`, { params: { accountId, page: pageIndex, size: PAGE_SIZE } })
      .then((res) => {
        const mapped: PostCover[] = (res.data?.content ?? []).map(mapPostCover);
        setPosts((prev) => replace ? mapped : [...prev, ...mapped]);
        setHasMore(pageIndex < (res.data?.totalPages ?? 1) - 1);
      })
      .catch(() => setFetchError(true))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { if (accountId) fetchPosts(0, true); }, [accountId]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPosts(next);
  };

  // Filter
  const filtered =
    activeFilter === "All"
      ? posts
      : posts.filter((p) => p.identifier === activeFilter);

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "likes")    return b.likes    - a.likes;
    if (sortBy === "comments") return b.comments - a.comments;
    return 0;
  });

  return (
    <div className="w-full flex flex-col text-white">

      {/* ── Filter + Sort bar ── */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-6 py-4 border-t border-white/10 xsm:gap-1 md:gap-3">

        {/* Filter dropdown */}
        <div ref={filterRef} className="relative justify-self-start">
          <button
            type="button"
            onClick={() => { setFilterOpen((p) => !p); setSortOpen(false); }}
            className="flex items-center gap-1.5 xsm:px-2 xsm:py-1 xsm:text-xs md:px-3 md:py-1.5 md:text-sm rounded-lg font-medium border bg-blue-primary border-blue-primary text-white transition-all duration-150 whitespace-nowrap"
          >
            {activeFilter}
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`text-xs transition-transform duration-200 ${filterOpen ? "rotate-180" : ""}`}
            />
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
                      activeFilter === opt
                        ? "text-white bg-white/5"
                        : "text-white/55 hover:text-white"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Center — dividers + count */}
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
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`text-xs transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`}
            />
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
                      sortBy === opt
                        ? "text-white bg-white/5"
                        : "text-white/55 hover:text-white"
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

      {/* ── Posts grid / states ── */}
      {isLoading && posts.length === 0 ? (
        <div className="w-full flex justify-center py-24">
          <div className="w-6 h-6 rounded-full border-2 border-blue-primary border-t-transparent animate-spin" />
        </div>
      ) : fetchError && posts.length === 0 ? (
        <div className="w-full flex flex-col items-center justify-center py-24 gap-3">
          <p className="text-white/40 text-sm">Failed to load posts.</p>
          <button
            type="button"
            onClick={() => fetchPosts(0, true)}
            className="text-blue-primary text-xs hover:text-blue-primary/70 transition-colors duration-150"
          >
            Try again
          </button>
        </div>
      ) : sorted.length > 0 ? (
        <div className="flex flex-col gap-4 px-6 pt-2 pb-8">
          <div className="grid xsm:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {sorted.map((post) => (
              <ProfilePostCover post={post} key={post.id} onOpen={(id) => navigate(`/post/${id}`)} />
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
                {isLoading
                  ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-transparent animate-spin" /> Loading...</>
                  : "Load More"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <FontAwesomeIcon icon={faTableCells} className="text-white/20 text-2xl" />
          </div>
          <p className="text-white/50 text-sm font-medium">
            {activeFilter === "All" ? "No posts yet." : `No ${activeFilter} posts yet.`}
          </p>
        </div>
      )}

    </div>
  );
};

export default PublicProfilePostsComponent;
