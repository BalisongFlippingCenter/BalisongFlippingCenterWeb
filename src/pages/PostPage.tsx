import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { axiosApiInstance } from "../api/axios";
import { PostDetail, mapPostDetail } from "../modals/Post";
import FeedPostCard from "../components/FeedPostCard";
import CommentsSection from "../components/CommentsSection";

const PostPage = () => {
  const { postId }     = useParams<{ postId: string }>();
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const focusComments  = searchParams.get("focus") === "comments";

  const [post,             setPost]             = useState<PostDetail | null>(null);
  const [isLoading,        setIsLoading]        = useState(true);
  const [fetchError,       setFetchError]       = useState(false);
  const [liveCommentCount, setLiveCommentCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!postId) { setFetchError(true); setIsLoading(false); return; }
    setIsLoading(true);
    setFetchError(false);
    axiosApiInstance
      .get(`/posts/any/${postId}`)
      .then((res) => setPost(mapPostDetail(res.data)))
      .catch(() => setFetchError(true))
      .finally(() => setIsLoading(false));
  }, [postId]);

  const topBar = (
    <div className="flex items-center gap-3 px-4 pt-4 pb-4 border-b border-white/[0.06] flex-shrink-0">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-colors duration-200 flex-shrink-0"
      >
        <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
      </button>
      <div className="min-w-0">
        <h1 className="text-white font-bold text-xl leading-tight">Post</h1>
        {post && <p className="text-white/35 text-xs truncate">by {post.creatorDisplayName}</p>}
      </div>
    </div>
  );

  if (isLoading) return (
    <div className="w-full min-h-screen flex flex-col bg-[#080a0e]">
      {topBar}
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="w-6 h-6 rounded-full border-2 border-blue-primary border-t-transparent animate-spin" />
      </div>
    </div>
  );

  if (fetchError || !post) return (
    <div className="w-full min-h-screen flex flex-col bg-[#080a0e]">
      {topBar}
      <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-white/40 text-sm">Failed to load post.</p>
        <button type="button" onClick={() => navigate(-1)} className="text-blue-primary text-xs hover:text-blue-primary/70 transition-colors">
          Go back
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#080a0e]">
      {topBar}

      <div className="flex-1 xsm:px-0 lg:px-4 py-6 pb-24">
        <div className="w-full max-w-[600px] mx-auto flex flex-col">
          <FeedPostCard post={post} index={0} variant="page" commentCountOverride={liveCommentCount} />

          <CommentsSection
            postId={post.id}
            commentCount={post.comments}
            focusInput={focusComments}
            onTotalChange={setLiveCommentCount}
          />
        </div>
      </div>
    </div>
  );
};

export default PostPage;
