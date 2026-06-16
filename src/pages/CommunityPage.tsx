import { useEffect, useRef, useState, useCallback } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHubspot } from "@fortawesome/free-brands-svg-icons";
import {
  faHeart, faComment,
  faGlobe, faEarthAmericas,
  faImage, faArrowRightArrowLeft,
  faBullhorn, faLock, faChevronLeft, faChevronRight,
  faVolumeMute, faVolumeUp, faPlay, faExpand, faCompress,
} from "@fortawesome/free-solid-svg-icons";
import { axiosApiInstance } from "../api/axios";
import { PostDetail, mapPostDetail } from "../modals/Post";
import { useAppSelector } from "../redux/hooks";
import { formatCurrency } from "../utils/unitConversions";

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
  tag.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

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

// ── Feed post card ────────────────────────────────────────────────────────────

const FeedPostCard = ({ post, index }: { post: PostDetail; index: number }) => {
  const navigate = useNavigate();
  const viewerCurrency = useAppSelector((state) => state.auth.user?.currency);
  const [descExpanded,  setDescExpanded]  = useState(false);
  const [descOverflows, setDescOverflows] = useState(false);
  const [mediaIndex,    setMediaIndex]    = useState(0);
  const [muted,         setMuted]         = useState(true);
  const [videoPaused,   setVideoPaused]   = useState(false);

  const descRef    = useRef<HTMLParagraphElement>(null);
  const cardRef    = useRef<HTMLDivElement>(null);
  const videoRef   = useRef<HTMLVideoElement>(null);
  const inViewRef  = useRef(false);
  const touchStartX       = useRef<number | null>(null);
  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    if (descRef.current) {
      setDescOverflows(descRef.current.scrollHeight > descRef.current.clientHeight);
    }
  }, [post.description]);

  // Autoplay video when card scrolls into view, pause when out
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
        const video = videoRef.current;
        if (!video) return;
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  // Play new video when carousel index changes (if card is in view)
  useEffect(() => {
    const timer = setTimeout(() => {
      const video = videoRef.current;
      if (video && inViewRef.current) video.play().catch(() => {});
    }, 50);
    return () => clearTimeout(timer);
  }, [mediaIndex]);

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

  const mediaFiles = post.mediaFiles;
  const currentUrl = mediaFiles[mediaIndex] ?? "";
  const isVid      = !!currentUrl && isVideoUrl(currentUrl);

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    videoRef.current?.pause();
    setMediaIndex(i => (i - 1 + mediaFiles.length) % mediaFiles.length);
  };

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    videoRef.current?.pause();
    setMediaIndex(i => (i + 1) % mediaFiles.length);
  };

  const goTo = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    videoRef.current?.pause();
    setMediaIndex(idx);
  };

  return (
    <div ref={cardRef} className={`w-full border-y border-x-0 lg:border lg:rounded-2xl border-white/10 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.5)] ${index % 2 === 0 ? "bg-[#13161d]" : "bg-[#080a0e]"}`}>

      {/* ── Card header ── */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
        <button type="button" onClick={goToProfile} className="flex items-center gap-3 min-w-0 group">
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
      {post.caption?.trim() && (
        <div className="px-4 pt-4 pb-3">
          <p className="text-white text-xl font-semibold leading-snug whitespace-pre-wrap">{post.caption}</p>
        </div>
      )}

      {/* ── Media ── */}
      {layout === "trade" ? (() => {
        const lookingForImg = post.lookingForImageUrl ?? post.mediaFiles[0] ?? null;
        return (
          <div className="px-4 pb-3">
            {/* 3-col grid: [offering] [↔ icon] [looking for]
                Labels in row 1, images in row 2 (icon aligns with this row), names in row 3 */}
            <div className="grid grid-cols-[1fr_32px_1fr] gap-y-1.5">
              {/* Row 1 — labels */}
              <p className="text-[10px] text-white/35 font-semibold uppercase tracking-widest">Offering</p>
              <div />
              <p className="text-[10px] text-white/35 font-semibold uppercase tracking-widest">Looking For</p>

              {/* Row 2 — images with icon centered in gap */}
              <div
                className="flex flex-col aspect-square rounded-2xl overflow-hidden bg-[#0d0f14] border border-white/10 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
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
                <div className="aspect-square">
                  {lookingForImg
                    ? <img src={lookingForImg} alt="Looking for" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-white/15"><FontAwesomeIcon icon={faImage} className="text-2xl" /></div>
                  }
                </div>
              </div>
            </div>
          </div>
        );
      })() : mediaFiles.length > 0 ? (
        <div
          ref={mediaContainerRef}
          className="media-fs-container relative aspect-[4/5] overflow-hidden bg-[#0d0f14]"
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const delta = e.changedTouches[0].clientX - touchStartX.current;
            touchStartX.current = null;
            if (Math.abs(delta) < 40) return;
            if (delta < 0) goNext(e as any);
            else goPrev(e as any);
          }}
        >

          {/* Current media */}
          {isVid ? (
            <>
              <video
                key={currentUrl}
                ref={videoRef}
                src={currentUrl}
                muted={muted}
                playsInline
                loop
                className="w-full h-full object-cover"
                onPlay={() => setVideoPaused(false)}
                onPause={() => setVideoPaused(true)}
              />
              {/* Click-to-pause overlay */}
              <div
                className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  const v = videoRef.current;
                  if (!v) return;
                  v.paused ? v.play().catch(() => {}) : v.pause();
                }}
              >
                {videoPaused && (
                  <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <FontAwesomeIcon icon={faPlay} className="text-white text-base pl-0.5" />
                  </div>
                )}
              </div>
            </>
          ) : (
            <img src={currentUrl} alt="" className="w-full h-full object-cover" />
          )}

          {/* Nav arrows + counter + dots */}
          {mediaFiles.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition-colors duration-150"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition-colors duration-150"
              >
                <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
              </button>

              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white/80 text-[11px] font-medium px-2 py-0.5 rounded-full">
                {mediaIndex + 1} / {mediaFiles.length}
              </div>

              {mediaFiles.length <= 6 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 items-center">
                  {mediaFiles.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => goTo(i, e)}
                      className={`h-1.5 rounded-full transition-all duration-200 ${
                        i === mediaIndex ? "w-3 bg-white" : "w-1.5 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Mute toggle */}
          {isVid && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMuted(m => !m); }}
              className="absolute bottom-2 right-2 z-20 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/80 transition-colors duration-150"
            >
              <FontAwesomeIcon icon={muted ? faVolumeMute : faVolumeUp} className="text-white/70 text-xs" />
            </button>
          )}

          {/* Fullscreen */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              isFullscreen ? document.exitFullscreen() : mediaContainerRef.current?.requestFullscreen();
            }}
            className="absolute bottom-2 left-2 z-20 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/80 transition-colors duration-150"
          >
            <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} className="text-white/70 text-xs" />
          </button>

        </div>
      ) : null}

      {/* ── Buy/sell meta (only for buysell layout) ── */}
      {layout === "buysell" && (
        <div className="px-4 pt-4 pb-1 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              post.mode === "BUYING"
                ? "text-blue-primary border-blue-primary/30 bg-blue-primary/10"
                : "text-green border-green/30 bg-green/10"
            }`}>
              {post.mode === "BUYING" ? "Buying" : "Selling"}
            </span>
            <span className="text-white/20 text-[11px]">·</span>
            <span className="text-white/25 text-[11px]">{post.mode === "BUYING" ? "Marketplace inquiry" : "Marketplace listing"}</span>
          </div>
          {post.mode === "SELLING" && post.price && (
            <p className="text-white font-bold text-3xl tracking-tight">{formatCurrency(post.price, viewerCurrency)}</p>
          )}

        </div>
      )}

      {/* ── Offering knife card (buy/sell) ── */}
      {layout === "buysell" && post.offeringKnife && (
        <div className="px-4 pt-3 pb-2">
          <div
            className="flex items-center gap-0 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden cursor-pointer hover:border-white/20 transition-colors duration-150"
            onClick={(e) => {
              e.stopPropagation();
              if (post.offeringKnife && post.creatorDisplayName && post.creatorIdentifierCode) {
                navigate(`/${post.creatorDisplayName}/${post.creatorIdentifierCode}/collection/${post.offeringKnife.displayName}`);
              }
            }}
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
        <div className="px-4 pt-3 pb-3 flex flex-nowrap gap-x-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
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
        <div className="px-4 pt-3 pb-4 flex flex-col gap-1">
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
        <div className="px-4 pb-4">
          <div
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden cursor-pointer hover:border-white/20 transition-colors duration-150"
            onClick={(e) => {
              e.stopPropagation();
              if (post.referenceKnife && post.creatorDisplayName && post.creatorIdentifierCode) {
                navigate(`/${post.creatorDisplayName}/${post.creatorIdentifierCode}/collection/${post.referenceKnife.displayName}`);
              }
            }}
          >
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

  const listRef    = useRef<HTMLDivElement>(null);
  const isFetching = useRef(false);

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

  useEffect(() => { fetchPosts(0); }, [fetchPosts]);

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
      <div className="relative z-10 w-full max-w-[600px] mx-auto xsm:px-0 lg:px-4 pt-0 pb-24">

        {/* ── Initial loading ── */}
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
                transform: `translateY(${virtualItem.start}px)`,
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

      </div>
    </div>
  );
};

export default CommunityPage;

