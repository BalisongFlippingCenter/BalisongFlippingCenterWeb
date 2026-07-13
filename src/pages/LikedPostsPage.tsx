import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faHeart } from "@fortawesome/free-solid-svg-icons";
import { axiosApiInstanceAuth } from "../api/axios";
import { PostCover, mapPostCover } from "../modals/Post";
import ProfilePostCover from "../components/ProfilePostCover";

const PAGE_SIZE = 20;

const LikedPostsPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [posts,      setPosts]      = useState<PostCover[]>([]);
  const [page,       setPage]       = useState(0);
  const [hasMore,    setHasMore]    = useState(false);
  const [isLoading,  setIsLoading]  = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const fetchPosts = (pageIndex: number, replace = false) => {
    setIsLoading(true);
    setFetchError(false);
    axiosApiInstanceAuth
      .get(`/posts/me/liked`, { params: { page: pageIndex, size: PAGE_SIZE } })
      .then((res) => {
        const mapped: PostCover[] = (res.data?.content ?? []).map(mapPostCover);
        setPosts((prev) => replace ? mapped : [...prev, ...mapped]);
        setHasMore(pageIndex < (res.data?.totalPages ?? 1) - 1);
      })
      .catch(() => setFetchError(true))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchPosts(0, true); }, []);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPosts(next);
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#080a0e] text-white pb-24">

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 border-b border-white/[0.06] flex-shrink-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-colors duration-200 flex-shrink-0"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
        </button>
        <div className="min-w-0">
          <h1 className="text-white font-bold text-xl leading-tight">Liked Posts</h1>
          {!isLoading && !fetchError && (
            <p className="text-white/35 text-xs">{posts.length} post{posts.length !== 1 ? "s" : ""}</p>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading && posts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-blue-primary border-t-transparent animate-spin" />
        </div>
      ) : fetchError && posts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-white/40 text-sm">Failed to load liked posts.</p>
          <button
            type="button"
            onClick={() => fetchPosts(0, true)}
            className="text-blue-primary text-xs hover:text-blue-primary/70 transition-colors duration-150"
          >
            Try again
          </button>
        </div>
      ) : posts.length > 0 ? (
        <div className="flex flex-col xsm:gap-0 lg:gap-4 xsm:px-0 lg:px-6 xsm:pt-0.5 lg:pt-4">
          <div className="grid xsm:grid-cols-3 lg:grid-cols-4 xsm:gap-px lg:gap-3">
            {posts.map((post) => (
              <ProfilePostCover
                key={post.id}
                post={post}
                onOpen={(id) => navigate(`/post/${id}`, { state: { backgroundLocation: location } })}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4 pb-2">
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
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <FontAwesomeIcon icon={faHeart} className="text-white/20 text-2xl" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-white/50 text-sm font-medium">No liked posts yet.</p>
            <p className="text-white/25 text-xs">Posts you like will show up here.</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default LikedPostsPage;
