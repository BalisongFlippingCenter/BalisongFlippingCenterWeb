import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { axiosApiInstance } from "../api/axios";
import { PostDetail, mapPostDetail } from "../modals/Post";
import FeedPostCard from "./FeedPostCard";
import CommentsSection from "./CommentsSection";
import FeedPostCardSkeleton from "./skeletons/FeedPostCardSkeleton";

interface PostDrawerProps {
  postId: string;
  post?: PostDetail;
  focusComments?: boolean;
  sourcePath?: string;
}

const BG = {
  productWorld:    "linear-gradient(to bottom, #0e0000 0%, #0b0000 40%, #080000 100%)",
  tutorialCenter:  "radial-gradient(ellipse at 50% 40%, #0d6b65 0%, #074440 50%, #021a18 100%)",
  community:       "radial-gradient(ellipse at 50% 40%, #0c2d35 0%, #061a1f 50%, #030d11 100%)",
  default:         "#080a0e",
};

const PostDrawer = ({ postId, post: initialPost, focusComments, sourcePath }: PostDrawerProps) => {
  const navigate = useNavigate();

  const pageBg = sourcePath?.startsWith("/product-world")
    ? BG.productWorld
    : sourcePath?.startsWith("/tutorial-center")
    ? BG.tutorialCenter
    : sourcePath?.startsWith("/community")
    ? BG.community
    : BG.default;

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
      className="fixed inset-0 z-[60] flex flex-col overflow-hidden"
      style={{ background: pageBg }}
    >
      {/* Top bar — desktop only, mobile uses native back gesture */}
      <div className="hidden md:flex items-center gap-3 px-4 pt-4 pb-4 border-b border-white/[0.06] flex-shrink-0">
        <button
          type="button"
          onClick={close}
          className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-colors duration-200 flex-shrink-0"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
        </button>
        {post ? (
          <button
            type="button"
            onClick={() => navigate(`/${post.creatorDisplayName}/${post.creatorIdentifierCode}`)}
            className="flex items-center gap-2.5 min-w-0 group"
          >
            <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center bg-blue-primary/20 border border-blue-primary/30 group-hover:border-blue-primary/60 transition-colors duration-200">
              {post.creatorProfileImg
                ? <img src={post.creatorProfileImg} alt="" className="w-full h-full object-cover" />
                : <span className="text-blue-primary text-sm font-bold leading-none">{post.creatorDisplayName.charAt(0).toUpperCase()}</span>
              }
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-white text-[15px] font-semibold leading-tight group-hover:text-blue-primary transition-colors duration-200 truncate">
                {post.creatorDisplayName}
              </span>
              {post.creatorIdentifierCode && (
                <span className="text-white/30 text-xs leading-none">#{post.creatorIdentifierCode}</span>
              )}
            </div>
          </button>
        ) : (
          <h1 className="text-white font-bold text-xl leading-tight">Post</h1>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="xsm:px-0 lg:px-4 xsm:pt-0 md:pt-6 pb-24">
            <div className="w-full max-w-[600px] mx-auto flex flex-col">
              <FeedPostCardSkeleton variant="page" />
              <div className="animate-pulse">
                <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.05]">
                  <div className="w-8 h-8 rounded-full bg-white/[0.07] flex-shrink-0" />
                  <div className="flex-1 h-10 rounded-2xl bg-white/[0.06]" />
                </div>
                {[0, 1].map((i) => (
                  <div key={i} className="flex gap-3 px-4 py-4 border-b border-white/[0.04]">
                    <div className="w-8 h-8 rounded-full bg-white/[0.07] flex-shrink-0" />
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="h-3 w-24 rounded-full bg-white/[0.08]" />
                      <div className="h-3 w-full rounded-full bg-white/[0.06]" />
                      <div className="h-3 w-3/4 rounded-full bg-white/[0.06]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
