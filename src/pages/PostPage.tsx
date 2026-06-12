import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHubspot } from "@fortawesome/free-brands-svg-icons";
import {
  faChevronLeft,
  faImage,
  faArrowRightArrowLeft,
  faCircleDollarToSlot,
  faHeart,
  faComment,
  faTag,
  faEarthAmericas,
  faBullhorn,
  faLock,
  faGlobe,
  faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";
import { axiosApiInstance } from "../api/axios";
import { PostDetail, mapPostDetail } from "../modals/Post";
import { useAppSelector } from "../redux/hooks";

// ── Layout / badge constants ──────────────────────────────────────────────────

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

// Cycle through a palette so each tag gets a distinct, consistent colour
const TAG_PALETTE = [
  "bg-blue-primary/10 border-blue-primary/25 text-blue-primary",
  "bg-green/10 border-green/25 text-green",
  "bg-gold/10 border-gold/25 text-gold",
  "bg-light-blue/10 border-light-blue/25 text-light-blue",
] as const;

const tagColor = (tag: string): string => {
  // simple hash so the same tag always maps to the same colour
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_PALETTE[h % TAG_PALETTE.length];
};

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

// ── Page ──────────────────────────────────────────────────────────────────────

const PostPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate   = useNavigate();
  const user       = useAppSelector((state) => state.auth.user);
  const currency   = user?.currency;

  const [post,       setPost]       = useState<PostDetail | null>(null);
  const [isLoading,  setIsLoading]  = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [descExpanded,  setDescExpanded]  = useState(false);
  const [descOverflows, setDescOverflows] = useState(false);

  const descRef = useRef<HTMLParagraphElement>(null);

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

  useEffect(() => {
    if (descRef.current) {
      setDescOverflows(descRef.current.scrollHeight > descRef.current.clientHeight);
    }
  }, [post?.description]);

  const currencySymbol = currency === "EUR" ? "€" : "$";

  // ── Ownership — compare logged-in user ID against post's accountId ────────
  const isOwner = !!user && !!post && String(user.id) === String(post.accountId);

  // ── Top bar ───────────────────────────────────────────────────────────────

  const TopBar = ({ subtitle }: { subtitle?: string }) => (
    <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-4 border-b border-white/[0.06] flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-colors duration-200 flex-shrink-0"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
        </button>
        <div className="min-w-0">
          <h1 className="text-white font-bold text-xl leading-tight">Post</h1>
          {subtitle && <p className="text-white/35 text-xs truncate">{subtitle}</p>}
        </div>
      </div>

      {/* Owner edit hook — visible only to post owner; actions wired when backend is ready */}
      {isOwner && (
        <button
          type="button"
          title="Edit post"
          className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:border-white/20 transition-colors duration-200 flex-shrink-0"
        >
          <FontAwesomeIcon icon={faPenToSquare} className="text-xs" />
        </button>
      )}
    </div>
  );

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) return (
    <div className="w-full min-h-screen flex flex-col bg-[#080a0e]">
      <TopBar />
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="w-6 h-6 rounded-full border-2 border-blue-primary border-t-transparent animate-spin" />
      </div>
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────────────────

  if (fetchError || !post) return (
    <div className="w-full min-h-screen flex flex-col bg-[#080a0e]">
      <TopBar />
      <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-white/40 text-sm">Failed to load post.</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-blue-primary text-xs hover:text-blue-primary/70 transition-colors"
        >
          Go back
        </button>
      </div>
    </div>
  );

  // ── Derived values ────────────────────────────────────────────────────────

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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#080a0e]">

      <TopBar subtitle={`by ${displayName}`} />

      <div className="flex-1 xsm:px-0 lg:px-4 py-6 pb-24 flex flex-col gap-4">
        <div className="w-full max-w-[600px] mx-auto bg-[#13161d] border-y border-x-0 lg:border lg:rounded-2xl border-white/10 overflow-hidden">

          {/* ── Card header ── */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">

            {/* Creator info — clicking navigates to their profile */}
            <button
              type="button"
              onClick={() => post.creatorDisplayName && navigate(`/${post.creatorDisplayName}/${post.creatorIdentifierCode}`)}
              className="flex items-center gap-3 min-w-0 group"
            >
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

            {/* Right: section icon + flags + type badge */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {sectionIcon && (
                <FontAwesomeIcon
                  icon={sectionIcon.icon}
                  title={sectionIcon.title}
                  className="text-white/25 text-xs"
                />
              )}
              {post.isAnnouncement && (
                <span className="flex items-center gap-1 text-[10px] bg-gold/20 text-gold border border-gold/30 px-1.5 py-0.5 rounded-full font-medium">
                  <FontAwesomeIcon icon={faBullhorn} className="text-[8px]" />
                  Announcement
                </span>
              )}
              {post.isPrivate && (
                <span className="flex items-center gap-1 text-[10px] bg-white/10 text-white/60 border border-white/20 px-1.5 py-0.5 rounded-full font-medium">
                  <FontAwesomeIcon icon={faLock} className="text-[8px]" />
                  Private
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
            /* Trade — side-by-side offering / looking for */
            <div className="px-4 pb-3">
              <div className="grid grid-cols-2 gap-2 ">
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] text-white/35 font-semibold uppercase tracking-wider">Offering</p>
                  <div className="aspect-square rounded-xl overflow-hidden bg-[#0d0f14] border border-white/10">
                    {post.offeringKnife?.coverPhoto
                      ? <img src={post.offeringKnife.coverPhoto} alt="Offering" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-white/15"><FontAwesomeIcon icon={faImage} className="text-2xl" /></div>
                    }
                  </div>
                  {post.offeringKnife && (
                    <p className="text-white/60 text-xs truncate">{post.offeringKnife.displayName}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] text-white/35 font-semibold uppercase tracking-wider">Looking For</p>
                  <div className="aspect-square rounded-xl overflow-hidden bg-[#0d0f14] border border-white/10">
                    {post.lookingForImageUrl
                      ? <img src={post.lookingForImageUrl} alt="Looking for" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-white/15"><FontAwesomeIcon icon={faImage} className="text-2xl" /></div>
                    }
                  </div>
                  {post.lookingForText && (
                    <p className="text-white/60 text-xs truncate">{post.lookingForText}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <FontAwesomeIcon icon={faArrowRightArrowLeft} className="text-blue-primary/60 text-sm" />
                <span className="text-white/30 text-xs">Trade offer</span>
              </div>
            </div>
          ) : post.mediaFiles.length > 0 ? (
            /* Standard media grid — full-width, no horizontal padding */
            <div className={`pb-0 grid gap-0.5 ${
              post.mediaFiles.length === 1 ? "grid-cols-1"
              : post.mediaFiles.length === 2 ? "grid-cols-2"
              : "grid-cols-3"
            }`}>
              {post.mediaFiles.map((url, i) => {
                const isVid = isVideoUrl(url);
                // single image: 4:3 landscape; multi: square
                const aspectCls = post.mediaFiles.length === 1 ? "aspect-[4/3]" : "aspect-square";
                return (
                  <div key={i} className={`relative overflow-hidden bg-[#0d0f14] ${aspectCls}`}>
                    {isVid
                      ? <video src={url} controls className="w-full h-full object-cover" playsInline />
                      : <img src={url} alt="" className="w-full h-full object-cover" />
                    }
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* ── Posted date ── */}
          {post.creationDate && (
            <div className="px-4 pt-2 pb-0">
              <span className="text-white/25 text-[11px]">{formatDate(post.creationDate)}</span>
            </div>
          )}

          {/* ── Tags ── */}
          {displayTags.length > 0 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {displayTags.map((tag) => (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${tagColor(tag)}`}
                >
                  <span className="opacity-50">#</span>
                  {formatTagLabel(tag)}
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
                  <span className="text-white font-bold text-base">
                    {currencySymbol}{parseFloat(post.price).toFixed(2)}
                  </span>
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

          {/* ── Engagement counts (read-only) ── */}
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
      </div>
    </div>
  );
};

export default PostPage;
