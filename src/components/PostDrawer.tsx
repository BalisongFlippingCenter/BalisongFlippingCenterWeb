import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { axiosApiInstance } from "../api/axios";
import { PostDetail, mapPostDetail } from "../modals/Post";
import FeedPostCard from "./FeedPostCard";
import CommentsSection from "./CommentsSection";

interface PostDrawerProps {
  postId: string;
  post?: PostDetail;
  focusComments?: boolean;
}

const PostDrawer = ({ postId, post: initialPost, focusComments }: PostDrawerProps) => {
  const navigate = useNavigate();

  const [post,             setPost]             = useState<PostDetail | null>(initialPost ?? null);
  const [loading,          setLoading]          = useState(!initialPost);
  const [fetchError,       setFetchError]       = useState(false);
  const [liveCommentCount, setLiveCommentCount] = useState<number | undefined>(undefined);

  // Lock body scroll while drawer is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Fetch only if post wasn't passed in (e.g. profile grid tap, direct URL)
  useEffect(() => {
    if (initialPost || !postId) return;
    setLoading(true);
    axiosApiInstance
      .get(`/posts/any/${postId}`)
      .then((res) => setPost(mapPostDetail(res.data)))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [postId, initialPost]);

  const close = () => navigate(-1);

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 32, stiffness: 280 }}
      className="fixed inset-0 z-[60] bg-[#080a0e] flex flex-col overflow-hidden"
    >
      {/* Top bar — desktop only, mobile uses native back gesture */}
      <div className="xsm:hidden md:flex items-center justify-between gap-3 px-4 pt-4 pb-4 border-b border-white/[0.06] flex-shrink-0 bg-[#080a0e]">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={close}
            className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-colors duration-200 flex-shrink-0"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
          </button>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-xl leading-tight">Post</h1>
            {post && <p className="text-white/35 text-xs truncate">by {post.creatorDisplayName}</p>}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 rounded-full border-2 border-blue-primary border-t-transparent animate-spin" />
          </div>
        ) : fetchError || !post ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-white/40 text-sm">Failed to load post.</p>
            <button type="button" onClick={close} className="text-blue-primary text-xs hover:text-blue-primary/70 transition-colors">
              Go back
            </button>
          </div>
        ) : (
          <div className="xsm:px-0 lg:px-4 xsm:pt-0 md:pt-6 pb-24">
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
        )}
      </div>
    </motion.div>
  );
};

export default PostDrawer;
