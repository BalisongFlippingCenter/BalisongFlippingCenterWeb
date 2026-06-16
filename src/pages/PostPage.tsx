import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHubspot } from "@fortawesome/free-brands-svg-icons";
import {
  faChevronLeft,
  faImage,
  faArrowRightArrowLeft,
  faHeart,
  faComment,
  faEarthAmericas,
  faBullhorn,
  faLock,
  faGlobe,
  faPenToSquare,
  faVolumeMute,
  faVolumeUp,
  faPlay,
  faExpand,
  faCompress,
} from "@fortawesome/free-solid-svg-icons";
import { axiosApiInstance } from "../api/axios";
import { PostDetail, mapPostDetail } from "../modals/Post";
import { useAppSelector } from "../redux/hooks";
import { formatCurrency } from "../utils/unitConversions";

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
  tag.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// Cycle through a palette so each tag gets a distinct, consistent colour
const DOT_PALETTE  = ["bg-blue-primary", "bg-green", "bg-gold", "bg-light-blue"] as const;
const TEXT_PALETTE = ["text-blue-primary", "text-green", "text-gold", "text-light-blue"] as const;

const tagDotColor = (tag: string): string => {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return DOT_PALETTE[h % DOT_PALETTE.length];
};

const tagTextColor = (tag: string): string => {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return TEXT_PALETTE[h % TEXT_PALETTE.length];
};

const difficultyStyle = (tag: string): { pill: string; dot: string } => {
  switch (tag.toUpperCase()) {
    case "BEGINNER":     return { pill: "bg-green/10 border-green/20 text-green",   dot: "bg-green" };
    case "INTERMEDIATE": return { pill: "bg-gold/10 border-gold/20 text-gold",      dot: "bg-gold" };
    case "ADVANCED":     return { pill: "bg-red/10 border-red/20 text-red",         dot: "bg-red" };
    case "EXPERT":       return { pill: "bg-red/15 border-red/30 text-red",         dot: "bg-red" };
    default:             return { pill: "bg-white/5 border-white/10 text-white/50", dot: "bg-white/50" };
  }
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

// ── ImageCell — per-image fullscreen state ────────────────────────────────────

const ImageCell = ({ url, aspectCls }: { url: string; aspectCls: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <div ref={containerRef} className={`media-fs-container relative overflow-hidden bg-[#0d0f14] ${aspectCls}`}>
      <img src={url} alt="" className="w-full h-full object-cover" />
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); isFullscreen ? document.exitFullscreen() : containerRef.current?.requestFullscreen(); }}
        className="absolute bottom-2 left-2 z-20 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/80 transition-colors duration-150"
      >
        <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} className="text-white/70 text-xs" />
      </button>
    </div>
  );
};

// ── VideoCell — per-video pause state ────────────────────────────────────────

interface VideoCellProps {
  url: string;
  muted: boolean;
  aspectCls: string;
  onMuteToggle: () => void;
}

const VideoCell = ({ url, muted, aspectCls, onMuteToggle }: VideoCellProps) => {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <div ref={containerRef} className={`media-fs-container relative overflow-hidden bg-[#0d0f14] ${aspectCls}`}>
      <video
        ref={videoRef}
        key={url}
        src={url}
        muted={muted}
        autoPlay
        playsInline
        loop
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        className="w-full h-full object-cover"
      />
      {/* click-to-pause overlay */}
      <div
        className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          const v = videoRef.current;
          if (!v) return;
          v.paused ? v.play().catch(() => {}) : v.pause();
        }}
      >
        {paused && (
          <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <FontAwesomeIcon icon={faPlay} className="text-white text-base pl-0.5" />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onMuteToggle(); }}
        className="absolute bottom-2 right-2 z-20 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/80 transition-colors duration-150"
      >
        <FontAwesomeIcon icon={muted ? faVolumeMute : faVolumeUp} className="text-white/70 text-xs" />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); isFullscreen ? document.exitFullscreen() : containerRef.current?.requestFullscreen(); }}
        className="absolute bottom-2 left-2 z-20 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/80 transition-colors duration-150"
      >
        <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} className="text-white/70 text-xs" />
      </button>
    </div>
  );
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
  const [muted,            setMuted]            = useState(true);
  const [selectedMediaIdx, setSelectedMediaIdx] = useState(0);

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
              <div className="flex flex-col items-start gap-0.5 min-w-0">
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-white text-sm font-semibold leading-none group-hover:text-blue-primary transition-colors duration-200">{displayName}</span>
                  {identifier && <span className="text-white/30 text-[11px] leading-none">{identifier}</span>}
                </div>
                {post.creationDate && (
                  <span className="text-white/35 text-[11px] leading-none pt-0.5">{formatDate(post.creationDate)}</span>
                )}
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
          {post.caption?.trim() && (
            <div className="px-4 pt-3 pb-2">
              <p className="text-white text-xl font-semibold leading-snug whitespace-pre-wrap">{post.caption}</p>
            </div>
          )}

          {/* ── Media ── */}
          {layout === "trade" ? (() => {
            const lookingForImg = post.lookingForImageUrl ?? post.mediaFiles[0] ?? null;
            return (
              <div className="px-4 pb-3">
                <div className="grid grid-cols-[1fr_32px_1fr] gap-y-1.5">
                  {/* Row 1 — labels */}
                  <p className="text-[10px] text-white/35 font-semibold uppercase tracking-widest">Offering</p>
                  <div />
                  <p className="text-[10px] text-white/35 font-semibold uppercase tracking-widest">Looking For</p>

                  {/* Row 2 — images with icon centered in gap */}
                  <div
                    className="flex flex-col aspect-square rounded-2xl overflow-hidden bg-[#0d0f14] border border-white/10 cursor-pointer"
                    onClick={() => {
                      if (post.offeringKnife && post.creatorDisplayName && post.creatorIdentifierCode) {
                        navigate(`/${post.creatorDisplayName}/${post.creatorIdentifierCode}/collection/${post.offeringKnife.displayName}`);
                      }
                    }}
                  >
                    {post.offeringKnife && (
                      <div className="px-2.5 py-1.5 bg-black/80 flex-shrink-0">
                        <p className="text-white text-xs font-semibold truncate leading-tight">
                          {post.offeringKnife.knifeMaker}{post.offeringKnife.baseKnifeModel ? ` · ${post.offeringKnife.baseKnifeModel}` : ""}
                        </p>
                      </div>
                    )}
                    <div className="flex-1 min-h-0">
                      {post.offeringKnife?.coverPhoto
                        ? <img src={post.offeringKnife.coverPhoto} alt="Offering" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-white/15"><FontAwesomeIcon icon={faImage} className="text-2xl" /></div>
                      }
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-[#0d0f14] border border-white/10 flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={faArrowRightArrowLeft} className="text-blue-primary/60 text-[9px]" />
                    </div>
                  </div>
                  <div className="flex flex-col aspect-square rounded-2xl overflow-hidden bg-[#0d0f14] border border-white/10">
                    {post.lookingForText && (
                      <div className="px-2.5 py-1.5 bg-black/80 flex-shrink-0">
                        <p className="text-white text-xs font-semibold truncate leading-tight">{post.lookingForText}</p>
                      </div>
                    )}
                    <div className="flex-1 min-h-0">
                      {lookingForImg
                        ? <img src={lookingForImg} alt="Looking for" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-white/15"><FontAwesomeIcon icon={faImage} className="text-2xl" /></div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            );
          })() : post.mediaFiles.length > 0 ? (
            layout === "buysell" ? (
              /* Buy/sell: hero + thumbnail strip */
              <div className="flex flex-col gap-0">
                {/* Hero */}
                {(() => {
                  const heroUrl = post.mediaFiles[selectedMediaIdx] ?? post.mediaFiles[0];
                  const isVid = isVideoUrl(heroUrl);
                  return isVid ? (
                    <VideoCell
                      key={selectedMediaIdx}
                      url={heroUrl}
                      muted={muted}
                      aspectCls="aspect-video"
                      onMuteToggle={() => setMuted(m => !m)}
                    />
                  ) : (
                    <div className="relative overflow-hidden bg-[#0d0f14] aspect-video">
                      <img src={heroUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  );
                })()}
                {/* Thumbnail strip — only when > 1 file */}
                {post.mediaFiles.length > 1 && (
                  <div className="flex gap-1.5 px-4 pt-3 pb-1 overflow-x-auto border-t border-white/5 mt-0">
                    {post.mediaFiles.map((url, i) => {
                      const isVid = isVideoUrl(url);
                      const active = i === selectedMediaIdx;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedMediaIdx(i)}
                          className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-[#0d0f14] border-2 transition-all duration-150 ${
                            active ? "border-blue-primary opacity-100" : "border-white/10 opacity-60 hover:opacity-90 hover:border-white/25"
                          }`}
                        >
                          {isVid ? (
                            <video src={url} muted playsInline className="w-full h-full object-cover" />
                          ) : (
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Standard media grid — full-width, no horizontal padding */
              <div className={`pb-0 grid gap-0.5 ${
                post.mediaFiles.length === 1 ? "grid-cols-1"
                : post.mediaFiles.length === 2 ? "grid-cols-2"
                : "grid-cols-3"
              }`}>
                {post.mediaFiles.map((url, i) => {
                  const isVid = isVideoUrl(url);
                  const aspectCls = post.mediaFiles.length === 1 ? "aspect-[4/5]" : "aspect-square";
                  if (isVid) {
                    return (
                      <VideoCell
                        key={i}
                        url={url}
                        muted={muted}
                        aspectCls={aspectCls}
                        onMuteToggle={() => setMuted(m => !m)}
                      />
                    );
                  }
                  return <ImageCell key={i} url={url} aspectCls={aspectCls} />;
                })}
              </div>
            )
          ) : null}

          {/* ── Buy/sell meta (only for buysell layout) ── */}
          {layout === "buysell" && (
            <div className="px-4 pt-3 pb-0 flex flex-col gap-1.5">
              {/* Badge + label row */}
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  post.mode === "BUYING"
                    ? "text-blue-primary border-blue-primary/30 bg-blue-primary/10"
                    : "text-green border-green/30 bg-green/10"
                }`}>
                  {post.mode === "BUYING" ? "Buying" : "Selling"}
                </span>
                <span className="text-white/25 text-[11px]">{post.mode === "BUYING" ? "Marketplace inquiry" : "Marketplace listing"}</span>
              </div>
              {/* Price hero */}
              {post.mode === "SELLING" && post.price && (
                <p className="text-white font-bold text-3xl tracking-tight">
                  {formatCurrency(post.price, currency)}
                </p>
              )}

            </div>
          )}

          {/* ── Offering knife card (buy/sell) ── */}
          {layout === "buysell" && post.offeringKnife && (
            <div className="px-4 pt-3 pb-1">
              <div
                className="flex items-center gap-0 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden cursor-pointer hover:border-white/20 transition-colors duration-150"
                onClick={() => navigate(`/${post.creatorDisplayName}/${post.creatorIdentifierCode}/collection/${post.offeringKnife!.displayName}`)}
              >
                {post.offeringKnife.coverPhoto ? (
                  <img
                    src={post.offeringKnife.coverPhoto}
                    alt={post.offeringKnife.displayName}
                    className="w-28 h-28 object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-28 h-28 bg-[#0d0f14] flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={faImage} className="text-white/15 text-2xl" />
                  </div>
                )}
                <div className="flex flex-col gap-1.5 px-4 min-w-0">
                  <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Listed Knife</span>
                  <p className="text-white font-semibold text-base truncate">{post.offeringKnife.displayName}</p>
                  <p className="text-white/50 text-xs truncate">
                    {post.offeringKnife.knifeMaker}
                    {post.offeringKnife.baseKnifeModel ? ` · ${post.offeringKnife.baseKnifeModel}` : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Tags ── */}
          {displayTags.length > 0 && (
            <div className="px-4 pt-2 pb-2 flex flex-nowrap gap-x-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {layout === "tutorial" || layout === "combo" ? (
                <>
                  {post.difficultyTag && (() => {
                    const s = difficultyStyle(post.difficultyTag);
                    return (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold ${s.pill}`}>
                        {formatTagLabel(post.difficultyTag)}
                      </span>
                    );
                  })()}
                  {post.techniqueTags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/50">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tagDotColor(tag)}`} />
                      {formatTagLabel(tag)}
                    </span>
                  ))}
                </>
              ) : (
                post.tags.map((tag) => (
                  <span key={tag} className={`inline-flex items-center text-[11px] font-medium ${tagTextColor(tag)}`}>
                    <span className="mr-0.5">#</span>{formatTagLabel(tag)}
                  </span>
                ))
              )}
            </div>
          )}

          {/* ── Description ── */}
          {post.description?.trim() && (
            <div className="px-4 pt-3 pb-3 flex flex-col gap-1">
              <p
                ref={descRef}
                className={`text-white/60 text-sm leading-relaxed whitespace-pre-wrap transition-all duration-200 ${descExpanded ? "" : "line-clamp-3"}`}
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

          {/* ── Reference knife card (generic/tutorial/combo only) ── */}
          {post.referenceKnife && layout !== "buysell" && layout !== "trade" && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                {post.referenceKnife.coverPhoto ? (
                  <img
                    src={post.referenceKnife.coverPhoto}
                    alt={post.referenceKnife.displayName}
                    className="w-16 h-16 object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-[#0d0f14] flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={faImage} className="text-white/15 text-lg" />
                  </div>
                )}
                <div className="flex flex-col gap-1 py-2 min-w-0 pr-3">
                  <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Referenced Knife</span>
                  <p className="text-white font-semibold text-sm truncate">{post.referenceKnife.displayName}</p>
                  <p className="text-white/50 text-xs truncate">
                    {post.referenceKnife.knifeMaker}
                    {post.referenceKnife.baseKnifeModel ? ` · ${post.referenceKnife.baseKnifeModel}` : ""}
                  </p>
                </div>
              </div>
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
