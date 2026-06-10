import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHubspot } from "@fortawesome/free-brands-svg-icons";
import {
  faHeart, faComment, faTag,
  faGlobe, faEarthAmericas,
  faImage, faArrowRightArrowLeft, faCircleDollarToSlot,
  faBullhorn, faLock,
} from "@fortawesome/free-solid-svg-icons";
import { axiosApiInstance } from "../api/axios";
import { PostDetail, mapPostDetail } from "../modals/Post";

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

type PostLayout = "generic" | "buysell" | "trade" | "tutorial" | "combo";

const POST_TYPE_TO_LAYOUT: Record<string, PostLayout> = {
  GENERIC:        "generic",
  BUY_SELL:       "buysell",
  TRADE:          "trade",
  TRICK_TUTORIAL: "tutorial",
  COMBO:          "combo",
};

const LAYOUT_BADGE: Record<PostLayout, { label: string; cls: string }> = {
  generic:  { label: "Generic",    cls: "text-white/50 border-white/20 bg-white/5" },
  buysell:  { label: "Buy / Sell", cls: "text-gold border-gold/30 bg-gold/10" },
  trade:    { label: "Trade",      cls: "text-blue-primary border-blue-primary/30 bg-blue-primary/10" },
  tutorial: { label: "Tutorial",   cls: "text-green border-green/30 bg-green/10" },
  combo:    { label: "Combo",      cls: "text-blue-primary border-blue-primary/30 bg-blue-primary/10" },
};

const SECTION_ICON: Record<PostLayout, { icon: typeof faGlobe; title: string } | null> = {
  generic:  { icon: faGlobe,         title: "Community"       },
  buysell:  { icon: faEarthAmericas, title: "Product World"   },
  trade:    { icon: faEarthAmericas, title: "Product World"   },
  tutorial: { icon: faHubspot,       title: "Tutorial Center" },
  combo:    { icon: faHubspot,       title: "Tutorial Center" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const isVideoUrl = (url: string) =>
  /\.(mp4|mov|avi|webm|mkv|m4v)(\?.*)?$/i.test(url);

const formatTagLabel = (tag: string) =>
  tag.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const diffMs    = Date.now() - d.getTime();
  const diffMins  = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays  = Math.floor(diffMs / 86_400_000);
  if (diffMins  <  1) return "Just now";
  if (diffMins  < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays  <  7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const TAG_PALETTE = [
  "bg-blue-primary/10 border-blue-primary/25 text-blue-primary",
  "bg-green/10 border-green/25 text-green",
  "bg-gold/10 border-gold/25 text-gold",
  "bg-light-blue/10 border-light-blue/25 text-light-blue",
] as const;

const tagColor = (tag: string): string => {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_PALETTE[h % TAG_PALETTE.length];
};

// ── Feed post card ────────────────────────────────────────────────────────────

const FeedPostCard = ({ post }: { post: PostDetail }) => {
  const navigate = useNavigate();
  const [descExpanded, setDescExpanded] = useState(false);
  const [descOverflows, setDescOverflows] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (descRef.current) {
      setDescOverflows(descRef.current.scrollHeight > descRef.current.clientHeight);
    }
  }, [post.description]);

  const layout      = POST_TYPE_TO_LAYOUT[post.postType] ?? "generic";
  const badge       = LAYOUT_BADGE[layout];
  const sectionIcon = SECTION_ICON[layout];
  const avatar      = post.creatorProfileImg;
  const displayName = post.creatorDisplayName || "Unknown";
  const identifier  = post.creatorIdentifierCode ? `#${post.creatorIdentifierCode}` : "";

  const displayTags: string[] =
    layout === "tutorial" || layout === "combo"
      ? [...(post.difficultyTag ? [post.difficultyTag] : []), ...post.techniqueTags]
      : post.tags;

  const goToProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.creatorDisplayName && post.creatorIdentifierCode) {
      navigate(`/${post.creatorDisplayName}/${post.creatorIdentifierCode}`);
    }
  };

  return (
    <div className="w-full bg-[#13161d] border-y border-x-0 lg:border lg:rounded-2xl border-white/10 overflow-hidden">

      {/* ── Card header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <button type="button" onClick={goToProfile} className="flex items-center gap-3 min-w-0 group">
          <div className="w-9 h-9 rounded-full bg-blue-primary/20 border border-blue-primary/30 flex-shrink-0 overflow-hidden flex items-center justify-center group-hover:border-blue-primary/60 transition-colors duration-200">
            {avatar
              ? <img src={avatar} alt="" className="w-full h-full object-cover" />
              : <span className="text-blue-primary text-sm font-bold">{displayName.charAt(0).toUpperCase()}</span>
            }
          </div>
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="text-white text-sm font-semibold leading-none group-hover:text-blue-primary transition-colors duration-200">{displayName}</span>
            {identifier && <span className="text-white/30 text-xs leading-none">{identifier}</span>}
          </div>
        </button>

        <div className="flex items-center gap-2 flex-shrink-0">
          {sectionIcon && (
            <FontAwesomeIcon icon={sectionIcon.icon} title={sectionIcon.title} className="text-white/25 text-xs" />
          )}
          {post.isAnnouncement && (
            <span className="flex items-center gap-1 text-[10px] bg-gold/20 text-gold border border-gold/30 px-1.5 py-0.5 rounded-full font-medium">
              <FontAwesomeIcon icon={faBullhorn} className="text-[8px]" />Announcement
            </span>
          )}
          {post.isPrivate && (
            <span className="flex items-center gap-1 text-[10px] bg-white/10 text-white/60 border border-white/20 px-1.5 py-0.5 rounded-full font-medium">
              <FontAwesomeIcon icon={faLock} className="text-[8px]" />Private
            </span>
          )}
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${badge.cls}`}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* ── Caption ── */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-white text-xl font-semibold leading-snug whitespace-pre-wrap">{post.caption}</p>
      </div>

      {/* ── Media ── */}
      {layout === "trade" ? (
        <div className="px-4 pb-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-white/35 font-semibold uppercase tracking-wider">Offering</p>
              <div className="aspect-square rounded-xl overflow-hidden bg-[#0d0f14] border border-white/10">
                {post.offeringKnife?.coverPhoto
                  ? <img src={post.offeringKnife.coverPhoto} alt="Offering" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-white/15"><FontAwesomeIcon icon={faImage} className="text-2xl" /></div>
                }
              </div>
              {post.offeringKnife && <p className="text-white/60 text-xs truncate">{post.offeringKnife.displayName}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-white/35 font-semibold uppercase tracking-wider">Looking For</p>
              <div className="aspect-square rounded-xl overflow-hidden bg-[#0d0f14] border border-white/10">
                {post.lookingForImageUrl
                  ? <img src={post.lookingForImageUrl} alt="Looking for" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-white/15"><FontAwesomeIcon icon={faImage} className="text-2xl" /></div>
                }
              </div>
              {post.lookingForText && <p className="text-white/60 text-xs truncate">{post.lookingForText}</p>}
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <FontAwesomeIcon icon={faArrowRightArrowLeft} className="text-blue-primary/60 text-sm" />
            <span className="text-white/30 text-xs">Trade offer</span>
          </div>
        </div>
      ) : post.mediaFiles.length > 0 ? (
        <div
          className={`pb-0 grid gap-0.5 ${
            post.mediaFiles.length === 1 ? "grid-cols-1"
            : post.mediaFiles.length === 2 ? "grid-cols-2"
            : "grid-cols-3"
          }`}
        >
          {post.mediaFiles.map((url, i) => {
            const isVid = isVideoUrl(url);
            const aspectCls = post.mediaFiles.length === 1 ? "aspect-[4/3]" : "aspect-square";
            return (
              <div key={i} className={`relative overflow-hidden bg-[#0d0f14] ${aspectCls}`}>
                {isVid
                  ? <video src={url} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                  : <img src={url} alt="" className="w-full h-full object-cover" />
                }
              </div>
            );
          })}
        </div>
      ) : null}

      {/* ── Date ── */}
      {post.creationDate && (
        <div className="px-4 pt-1 pb-0">
          <span className="text-white/25 text-[11px]">{formatDate(post.creationDate)}</span>
        </div>
      )}

      {/* ── Tags ── */}
      {displayTags.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {displayTags.map((tag) => (
            <span key={tag} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${tagColor(tag)}`}>
              <span className="opacity-50">#</span>{formatTagLabel(tag)}
            </span>
          ))}
        </div>
      )}

      {/* ── Description ── */}
      {post.description?.trim() && (
        <div className="px-4 pb-3 flex flex-col gap-1">
          <p
            ref={descRef}
            className={`text-white/50 text-xs leading-relaxed whitespace-pre-wrap transition-all duration-200 ${descExpanded ? "" : "line-clamp-3"}`}
          >
            {post.description}
          </p>
          {descOverflows && (
            <button
              type="button"
              onClick={() => setDescExpanded((p) => !p)}
              className="text-blue-primary/70 text-xs font-medium hover:text-blue-primary transition-colors duration-150 text-left"
            >
              {descExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {/* ── Buy/Sell details ── */}
      {layout === "buysell" && (
        <>
          <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-between gap-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              post.mode === "BUYING"
                ? "text-blue-primary border-blue-primary/30 bg-blue-primary/10"
                : "text-green border-green/30 bg-green/10"
            }`}>
              {post.mode === "BUYING" ? "Buying" : "Selling"}
            </span>
            {post.mode === "SELLING" && post.price && (
              <span className="text-white font-bold text-base">${parseFloat(post.price).toFixed(2)}</span>
            )}
          </div>
          <div className="px-4 pb-3 flex items-center gap-1.5 -mt-1">
            <FontAwesomeIcon icon={faCircleDollarToSlot} className="text-gold/50 text-xs" />
            <span className="text-white/25 text-xs">Marketplace listing</span>
          </div>
        </>
      )}

      {/* ── Reference knife ── */}
      {post.referenceKnife && (
        <div className="px-4 py-3 border-t border-white/[0.06] flex items-center gap-2">
          <FontAwesomeIcon icon={faTag} className="text-blue-primary text-xs flex-shrink-0" />
          <span className="text-white/60 text-xs">{post.referenceKnife.displayName}</span>
          <span className="text-white/30 text-xs">·</span>
          <span className="text-white/40 text-xs">
            {post.referenceKnife.knifeMaker}
            {post.referenceKnife.baseKnifeModel ? ` · ${post.referenceKnife.baseKnifeModel}` : ""}
          </span>
        </div>
      )}

      {/* ── Engagement counts ── */}
      <div className="px-4 py-3 border-t border-white/[0.06] flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-white/30 text-xs">
          <FontAwesomeIcon icon={faHeart} className="text-[11px]" />
          <span className="font-medium">{post.likes.toLocaleString()}</span>
          <span className="text-white/20">likes</span>
        </span>
        <span className="flex items-center gap-1.5 text-white/30 text-xs">
          <FontAwesomeIcon icon={faComment} className="text-[11px]" />
          <span className="font-medium">{post.comments.toLocaleString()}</span>
          <span className="text-white/20">comments</span>
        </span>
      </div>

    </div>
  );
};

// ── Community page ────────────────────────────────────────────────────────────

const CommunityPage = () => {
  const [posts,       setPosts]       = useState<PostDetail[]>([]);
  const [page,        setPage]        = useState(0);
  const [hasMore,     setHasMore]     = useState(true);
  const [isLoading,   setIsLoading]   = useState(false);
  const [initialDone, setInitialDone] = useState(false);
  const [fetchError,  setFetchError]  = useState(false);

  const sentinelRef  = useRef<HTMLDivElement>(null);
  const isFetching   = useRef(false);

  const fetchPosts = useCallback((pageIndex: number) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setIsLoading(true);
    setFetchError(false);
    axiosApiInstance
      .get("/posts/any", { params: { page: pageIndex, size: PAGE_SIZE } })
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
      });
  }, []);

  // Initial load
  useEffect(() => { fetchPosts(0); }, [fetchPosts]);

  // Infinite scroll — observe the sentinel div
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetching.current) {
          fetchPosts(page + 1);
        }
      },
      { rootMargin: "200px" }   // start loading 200px before the sentinel is visible
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, page, fetchPosts]);

  return (
    <div
      className="w-full min-h-screen relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 40%, #0c2d35 0%, #061a1f 50%, #030d11 100%)" }}
    >
      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 z-0 opacity-[0.18] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative z-10 w-full max-w-[600px] mx-auto xsm:px-0 lg:px-4 pt-6 pb-24 flex flex-col xsm:gap-0.5 lg:gap-5">

        {/* ── Initial loading skeleton ── */}
        {!initialDone && (
          <div className="flex justify-center py-24">
            <div className="w-6 h-6 rounded-full border-2 border-blue-primary border-t-transparent animate-spin" />
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

        {/* ── Feed ── */}
        {posts.map((post) => (
          <FeedPostCard key={post.id} post={post} />
        ))}

        {/* ── Sentinel — IntersectionObserver target ── */}
        <div ref={sentinelRef} className="w-full" />

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

      </div>
    </div>
  );
};

export default CommunityPage;

