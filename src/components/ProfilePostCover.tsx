import { PostCover } from "../modals/Post";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart, faComment, faLock, faBullhorn, faPlay,
  faGlobe, faEarthAmericas, faImages,
} from "@fortawesome/free-solid-svg-icons";
import { faHubspot } from "@fortawesome/free-brands-svg-icons";

// ── Post type badge ───────────────────────────────────────────────────────────
const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  GENERIC:        { label: "Generic",    cls: "text-white/80 border-white/30" },
  BUY_SELL:       { label: "Buy / Sell", cls: "text-gold border-gold/50" },
  TRADE:          { label: "Trade",      cls: "text-blue-primary border-blue-primary/50" },
  TRICK_TUTORIAL: { label: "Tutorial",   cls: "text-green border-green/50" },
  COMBO:          { label: "Combo",      cls: "text-blue-primary border-blue-primary/50" },
};

// ── Route destination icon — matches the header nav icons for each section ────
// GENERIC → Community (faGlobe), BUY_SELL / TRADE → Product World (faEarthAmericas),
// TRICK_TUTORIAL / COMBO → Tutorial Center (faHubspot)
const ROUTE_ICON: Record<string, { icon: typeof faGlobe; title: string; cls: string }> = {
  GENERIC:        { icon: faGlobe,          title: "Community",      cls: "text-white/40" },
  BUY_SELL:       { icon: faEarthAmericas,  title: "Product World",  cls: "text-gold/50" },
  TRADE:          { icon: faEarthAmericas,  title: "Product World",  cls: "text-gold/50" },
  TRICK_TUTORIAL: { icon: faHubspot,        title: "Tutorial Center", cls: "text-green/50" },
  COMBO:          { icon: faHubspot,        title: "Tutorial Center", cls: "text-green/50" },
};

const isVideoUrl = (url: string) =>
  /\.(mp4|mov|avi|webm|mkv|m4v)(\?.*)?$/i.test(url);

// ── Component ─────────────────────────────────────────────────────────────────

interface params {
  post: PostCover;
  onOpen: (id: string) => void;
}

const ProfilePostCover = ({ post, onOpen }: params) => {
  const isS3     = post.coverFile?.startsWith("http://") || post.coverFile?.startsWith("https://");
  const coverSrc = isS3 ? post.coverFile! : null;
  const isVideo  = coverSrc ? isVideoUrl(coverSrc) : false;

  const typeBadge  = post.identifier ? (TYPE_BADGE[post.identifier]  ?? null) : null;
  const routeIcon  = post.identifier ? (ROUTE_ICON[post.identifier]  ?? null) : null;
  const multiMedia = post.mediaCount > 1;

  return (
    <div
      className="relative aspect-[4/5] xsm:rounded-none lg:rounded-xl overflow-hidden group cursor-pointer border border-white/8 hover:border-white/20 transition-all duration-300"
      onClick={() => post.id && onOpen(post.id)}
    >

      {/* Cover media */}
      {coverSrc ? (
        isVideo ? (
          <video
            src={coverSrc}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <img src={coverSrc} alt={post.caption ?? ""} className="w-full h-full object-cover" />
        )
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#1c1f27] to-[#0d0f14]" />
      )}

      {/* Video play badge — top right when no multi-media, top left when multi-media also present */}
      {isVideo && (
        <div className={`absolute top-2 w-6 h-6 rounded-full bg-black/65 backdrop-blur-sm flex items-center justify-center ${multiMedia ? "left-2" : "right-2"}`}>
          <FontAwesomeIcon icon={faPlay} className="text-white text-[8px] ml-px" />
        </div>
      )}

      {/* Multiple media badge — always shown when more than 1 file */}
      {multiMedia && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5">
          <FontAwesomeIcon icon={faImages} className="text-white/70 text-[9px]" />
          <span className="text-white/70 text-[10px] font-semibold leading-none">{post.mediaCount}</span>
        </div>
      )}

      {/* Announcement / private badges — top left */}
      {(post.isAnnouncement || post.isPrivate) && (
        <div className="absolute top-2 left-2 flex gap-1">
          {post.isAnnouncement && (
            <span className="flex items-center gap-1 text-[10px] bg-black/60 text-gold border border-gold/40 px-1.5 py-0.5 rounded-full font-medium backdrop-blur-sm">
              <FontAwesomeIcon icon={faBullhorn} className="text-[8px]" />
            </span>
          )}
          {post.isPrivate && (
            <span className="flex items-center gap-1 text-[10px] bg-black/60 text-white/60 border border-white/20 px-1.5 py-0.5 rounded-full font-medium backdrop-blur-sm">
              <FontAwesomeIcon icon={faLock} className="text-[8px]" />
            </span>
          )}
        </div>
      )}

      {/* Hover darkening */}
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      {/* ── Bottom bar: type badge · route icon · like + comment ── */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent pt-8 pb-3 px-3 flex items-end justify-between gap-1.5">

        {/* Post type badge */}
        {typeBadge ? (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border bg-black/50 backdrop-blur-sm flex-shrink-0 ${typeBadge.cls}`}>
            {typeBadge.label}
          </span>
        ) : <span />}

        {/* Right side: route icon + like + comment */}
        <div className="flex items-center gap-2.5 flex-shrink-0">

          {/* Route destination icon */}
          {routeIcon && (
            <FontAwesomeIcon
              icon={routeIcon.icon}
              title={routeIcon.title}
              className={`text-[11px] ${routeIcon.cls}`}
            />
          )}

          {/* Divider */}
          {routeIcon && <span className="w-px h-3 bg-white/15 flex-shrink-0" />}

          <span className="flex items-center gap-1 text-white/75 text-[10px] font-semibold">
            <FontAwesomeIcon icon={faHeart} className="text-[9px]" />
            {post.likes.toLocaleString()}
          </span>
          <span className="flex items-center gap-1 text-white/75 text-[10px] font-semibold">
            <FontAwesomeIcon icon={faComment} className="text-[9px]" />
            {post.comments.toLocaleString()}
          </span>

        </div>
      </div>

    </div>
  );
};

export default ProfilePostCover;
