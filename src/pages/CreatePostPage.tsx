import { ChangeEvent, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHubspot } from "@fortawesome/free-brands-svg-icons";
import {
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faImage,
  faXmark,
  faVideo,
  faPen,
  faArrowRightArrowLeft,
  faHeart,
  faComment,
  faBoxOpen,
  faEarthAmericas,
  faCrown,
  faGlobe,
  faTag,
  faBolt,
} from "@fortawesome/free-solid-svg-icons";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { addUIToast } from "../redux/uiToast/uiToastSlice";
import { axiosApiInstanceAuth } from "../api/axios";
import { CollectionKnife } from "../modals/CollectionKnife";
import { Profile } from "../modals/User";

type PostLayout = "generic" | "buysell" | "trade" | "tutorial" | "combo";
type FileMetadata = { description: string; knifeId: string | null };

const LAYOUTS: { key: PostLayout; label: string; description: string }[] = [
  { key: "generic",  label: "Generic",   description: "Share anything — photos, clips, or a mix. No specific format required." },
  { key: "buysell",  label: "Buy / Sell", description: "Listing a knife you want to sell, or looking to buy one from the community." },
  { key: "trade",    label: "Trade",      description: "Offering one of your knives in exchange for something else." },
  { key: "tutorial", label: "Trick Tutorial", description: "Breaking down a specific trick step by step with a single instructional video." },
  { key: "combo",    label: "Combo",      description: "Showcasing a combination of tricks. One video, no breakdown required." },
];

const VIDEO_ONLY_LAYOUTS: PostLayout[] = ["tutorial", "combo"];
const SINGLE_FILE_LAYOUTS: PostLayout[] = ["tutorial", "combo"];
const MAX_FILES = 10;
const MAX_TAGS = 5;

const MAX_IMAGE_SIZE_MB    = 15;
const MAX_VIDEO_SIZE_MB    = 150;
const MAX_VIDEO_DURATION_S = 120;

const getVideoDuration = (file: File): Promise<number> =>
  new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => { URL.revokeObjectURL(video.src); resolve(video.duration); };
    video.onerror = () => reject();
    video.src = URL.createObjectURL(file);
  });

// ─── Backend field mappings ────────────────────────────────────────────────
const POST_TYPE_MAP: Record<PostLayout, string> = {
  generic:  "GENERIC",
  buysell:  "BUY_SELL",
  trade:    "TRADE",
  tutorial: "TRICK_TUTORIAL",
  combo:    "COMBO",
};

const GENERIC_TAG_MAP: Record<string, string> = {
  "Buy/Sell":   "BUY_SELL",
  "Trade":      "TRADE",
  "Flipping":   "FLIPPING",
  "Show-Off":   "SHOW_OFF",
  "Mod-Work":   "MOD_WORK",
  "Help":       "HELP",
  "Discussion": "DISCUSSION",
  "Hot-Topic":  "HOT_TOPIC",
};

const DIFFICULTY_TAG_MAP: Record<string, string> = {
  "Beginner":     "BEGINNER",
  "Intermediate": "INTERMEDIATE",
  "Advanced":     "ADVANCED",
  "Expert":       "EXPERT",
};

const TECHNIQUE_TAG_MAP: Record<string, string> = {
  "Aerial":    "AERIAL",
  "Transfer":  "TRANSFER",
  "Fan":       "FAN",
  "Rollover":  "ROLLOVER",
  "Twirl":     "TWIRL",
  "Chaplin":   "CHAPLIN",
  "Combo":     "COMBO",
  "Ladder":    "LADDER",
  "Tech":      "TECH",
};

const GENERIC_TAGS: string[] = [
  "Buy/Sell", "Trade", "Flipping", "Show-Off", "Mod-Work", "Help", "Discussion", "Hot-Topic",
];

const TRICK_TAGS: { group: string; tags: string[] }[] = [
  {
    group: "Difficulty",
    tags: ["Beginner", "Intermediate", "Advanced", "Expert"],
  },
  {
    group: "Technique",
    tags: ["Aerial", "Transfer", "Fan", "Rollover", "Twirl", "Chaplin", "Combo", "Ladder", "Tech"],
  },
];

// Per-group limits for trick-based post types
const TUTORIAL_GROUP_LIMITS: Record<string, number> = { Difficulty: 1, Technique: 2 };
const COMBO_GROUP_LIMITS: Record<string, number> = { Difficulty: 1, Technique: 5 };

const getTrickTagGroup = (tag: string): string =>
  TRICK_TAGS.find(({ tags }) => tags.includes(tag))?.group ?? "";

// ─── Layout badge config ───────────────────────────────────────────────────
const LAYOUT_BADGE: Record<PostLayout, { label: string; cls: string }> = {
  generic:  { label: "Generic",   cls: "text-white/50 border-white/20 bg-white/5" },
  buysell:  { label: "Buy / Sell", cls: "text-gold border-gold/30 bg-gold/10" },
  trade:    { label: "Trade",      cls: "text-blue-primary border-blue-primary/30 bg-blue-primary/10" },
  tutorial: { label: "Tutorial",  cls: "text-green border-green/30 bg-green/10" },
  combo:    { label: "Combo",      cls: "text-blue-primary border-blue-primary/30 bg-blue-primary/10" },
};

// ─── Layout card config ────────────────────────────────────────────────────
const LAYOUT_CARD: Record<PostLayout, { icon: typeof faGlobe; color: string; activeBorder: string; bg: string; iconBg: string; ringBg: string }> = {
  generic:  { icon: faGlobe,              color: "text-white/80",     activeBorder: "border-white/30",          bg: "bg-white/[0.05]",       iconBg: "bg-white/15",          ringBg: "bg-white/20"          },
  buysell:  { icon: faTag,                color: "text-gold",         activeBorder: "border-gold/50",           bg: "bg-gold/[0.08]",        iconBg: "bg-gold/20",           ringBg: "bg-gold/25"           },
  trade:    { icon: faArrowRightArrowLeft, color: "text-blue-primary", activeBorder: "border-blue-primary/50",   bg: "bg-blue-primary/[0.09]",iconBg: "bg-blue-primary/20",   ringBg: "bg-blue-primary/25"   },
  tutorial: { icon: faVideo,              color: "text-green",        activeBorder: "border-green/50",          bg: "bg-green/[0.08]",       iconBg: "bg-green/20",          ringBg: "bg-green/25"          },
  combo:    { icon: faBolt,               color: "text-teal",         activeBorder: "border-teal/50",           bg: "bg-teal/[0.08]",        iconBg: "bg-teal/20",           ringBg: "bg-teal/25"           },
};

// ─── Page theme config (drives page-level color shifts) ───────────────────
const LAYOUT_THEME: Record<PostLayout, { tint: string; btnBg: string; btnShadow: string }> = {
  generic:  { tint: "rgba(255,255,255,0.0)",  btnBg: "linear-gradient(135deg,#108198,#0a6475)", btnShadow: "0 4px 28px rgba(16,129,152,0.40)"  },
  buysell:  { tint: "rgba(230,184,0,0.20)",   btnBg: "linear-gradient(135deg,#e6b800,#b38a00)", btnShadow: "0 4px 28px rgba(230,184,0,0.40)"   },
  trade:    { tint: "rgba(16,129,152,0.20)",  btnBg: "linear-gradient(135deg,#108198,#0a6475)", btnShadow: "0 4px 28px rgba(16,129,152,0.40)"  },
  tutorial: { tint: "rgba(34,197,94,0.20)",   btnBg: "linear-gradient(135deg,#22c55e,#16a34a)", btnShadow: "0 4px 28px rgba(34,197,94,0.40)"   },
  combo:    { tint: "rgba(13,148,136,0.20)",  btnBg: "linear-gradient(135deg,#0d9488,#0a7569)", btnShadow: "0 4px 28px rgba(13,148,136,0.40)"  },
};

// ─── Post Preview Overlay ──────────────────────────────────────────────────
interface PostPreviewOverlayProps {
  layout: PostLayout;
  caption: string;
  description: string;
  tags: string[];
  selectedFiles: File[];
  tradeSoughtFile: File | null;
  tradeOfferingKnife: CollectionKnife | null;
  lookingFor: string;
  price: string;
  buySellTag: "Buying" | "Selling" | null;
  currency: string;
  taggedKnife: CollectionKnife | null;
  sellingKnife: CollectionKnife | null;
  fileMetadata: FileMetadata[];
  collectionKnives: CollectionKnife[];
  user: Profile | null;
  isLoading: boolean;
  error: string;
  onEdit: () => void;
  onConfirm: () => void;
}

// ── Tag helpers — same logic as CommunityPage / PostPage ─────────────────────
const DOT_PALETTE_PREVIEW  = ["bg-blue-primary", "bg-green", "bg-gold", "bg-light-blue"] as const;
const TEXT_PALETTE_PREVIEW = ["text-blue-primary", "text-green", "text-gold", "text-light-blue"] as const;

const _tagHash = (tag: string) => {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return h;
};
const tagDotColorPreview  = (tag: string) => DOT_PALETTE_PREVIEW[_tagHash(tag) % DOT_PALETTE_PREVIEW.length];
const tagTextColorPreview = (tag: string) => TEXT_PALETTE_PREVIEW[_tagHash(tag) % TEXT_PALETTE_PREVIEW.length];

const formatTagLabelPreview = (tag: string) =>
  tag.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const difficultyStylePreview = (tag: string): { pill: string } => {
  switch (tag.toUpperCase()) {
    case "BEGINNER":     return { pill: "bg-green/10 border-green/20 text-green" };
    case "INTERMEDIATE": return { pill: "bg-gold/10 border-gold/20 text-gold" };
    case "ADVANCED":     return { pill: "bg-red/10 border-red/20 text-red" };
    case "EXPERT":       return { pill: "bg-red/15 border-red/30 text-red" };
    default:             return { pill: "bg-white/5 border-white/10 text-white/50" };
  }
};

const PostPreviewOverlay = ({
  layout, caption, description, tags, selectedFiles,
  tradeSoughtFile, tradeOfferingKnife, lookingFor, price, buySellTag,
  currency, taggedKnife, sellingKnife, fileMetadata, collectionKnives,
  user, isLoading, error, onEdit, onConfirm,
}: PostPreviewOverlayProps) => {
  const badge = LAYOUT_BADGE[layout];
  const displayName    = user?.displayName ?? "You";
  const identifier     = user?.identifierCode ? `#${user.identifierCode}` : "";
  const avatar         = user?.profileImg ?? null;
  const currencySymbol = currency === "EUR" ? "€" : "$";

  const [descExpanded,    setDescExpanded]    = useState(false);
  const [descOverflows,   setDescOverflows]   = useState(false);
  const [selectedMediaIdx, setSelectedMediaIdx] = useState(0);
  const descRef = useRef<HTMLParagraphElement>(null);

  const isPerFilePrev = fileMetadata.length > 0 && (layout === "generic" || (layout === "buysell" && buySellTag === "Selling"));
  const activeDescription = isPerFilePrev ? (fileMetadata[selectedMediaIdx]?.description ?? "") : description;
  const activeKnife = isPerFilePrev
    ? (collectionKnives.find(k => k.id === fileMetadata[selectedMediaIdx]?.knifeId) ?? null)
    : taggedKnife;

  useEffect(() => {
    setDescExpanded(false);
    setDescOverflows(false);
  }, [selectedMediaIdx]);

  useEffect(() => {
    if (descRef.current) {
      setDescOverflows(descRef.current.scrollHeight > descRef.current.clientHeight);
    }
  }, [activeDescription]);

  const mediaFiles = layout === "trade" ? [] : selectedFiles;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#080a0e]">

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 pt-14 pb-4 border-b border-white/[0.06] flex-shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-colors duration-200"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
        </button>
        <div>
          <h1 className="text-white font-bold text-xl leading-tight">Post Preview</h1>
          <p className="text-white/35 text-xs">Review before posting</p>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <div className="px-4 pt-6 pb-32 flex flex-col gap-4">

        {/* Post card */}
        <div className="w-full max-w-[600px] mx-auto bg-[#13161d] border border-white/10 rounded-2xl overflow-hidden">

          {/* Card header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-blue-primary/20 border border-blue-primary/30 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {avatar
                  ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                  : <span className="text-blue-primary text-sm font-bold">{displayName.charAt(0).toUpperCase()}</span>
                }
              </div>
              <div className="flex flex-col items-start gap-0 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-white text-sm font-semibold leading-none">{displayName}</span>
                  {identifier && <span className="text-white/30 text-xs leading-none">{identifier}</span>}
                </div>
                <span className="text-white/30 text-[11px] pt-0.5">Just now</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {layout === "generic" && <FontAwesomeIcon icon={faGlobe} className="text-white/25 text-xs" />}
              {(layout === "buysell" || layout === "trade") && <FontAwesomeIcon icon={faEarthAmericas} className="text-white/25 text-xs" />}
              {(layout === "tutorial" || layout === "combo") && <FontAwesomeIcon icon={faHubspot} className="text-white/25 text-xs" />}
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${badge.cls}`}>
                {badge.label}
              </span>
            </div>
          </div>

          {/* Caption */}
          {caption.trim() && (
            <div className="px-4 pt-3 pb-2">
              <p className="text-white text-xl font-semibold leading-snug whitespace-pre-wrap">{caption}</p>
            </div>
          )}

          {/* ── Media ── */}
          {layout === "trade" ? (
            /* Trade — 3-column grid matching community/post page */
            <div className="px-4 pb-3">
              <div className="grid grid-cols-[1fr_32px_1fr] gap-y-1.5">
                <p className="text-[10px] text-white/35 font-semibold uppercase tracking-widest">Offering</p>
                <div />
                <p className="text-[10px] text-white/35 font-semibold uppercase tracking-widest">Looking For</p>

                <div className="flex flex-col aspect-square rounded-2xl overflow-hidden bg-[#0d0f14] border border-white/10">
                  {tradeOfferingKnife && (
                    <div className="px-2.5 py-1.5 bg-black/80 flex-shrink-0">
                      <p className="text-white text-xs font-semibold truncate leading-tight">
                        {tradeOfferingKnife.knifeMaker}{tradeOfferingKnife.baseKnifeModel ? ` · ${tradeOfferingKnife.baseKnifeModel}` : ""}
                      </p>
                    </div>
                  )}
                  <div className="flex-1 min-h-0">
                    {tradeOfferingKnife?.coverPhoto
                      ? <img src={tradeOfferingKnife.coverPhoto} alt="Offering" className="w-full h-full object-cover" />
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
                  {lookingFor && (
                    <div className="px-2.5 py-1.5 bg-black/80 flex-shrink-0">
                      <p className="text-white text-xs font-semibold truncate leading-tight">{lookingFor}</p>
                    </div>
                  )}
                  <div className="flex-1 min-h-0">
                    {tradeSoughtFile
                      ? <img src={URL.createObjectURL(tradeSoughtFile)} alt="Looking for" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-white/15"><FontAwesomeIcon icon={faImage} className="text-2xl" /></div>
                    }
                  </div>
                </div>
              </div>
            </div>
          ) : mediaFiles.length > 0 ? (
            layout === "buysell" ? (
              /* Buy/sell — hero + thumbnail strip */
              <div className="flex flex-col gap-0">
                {(() => {
                  const heroFile = mediaFiles[selectedMediaIdx] ?? mediaFiles[0];
                  const heroUrl  = URL.createObjectURL(heroFile);
                  const isVid    = heroFile.type.startsWith("video/");
                  return isVid
                    ? <video key={selectedMediaIdx} src={heroUrl} muted autoPlay playsInline loop className="w-full aspect-video object-cover" />
                    : <div className="relative overflow-hidden bg-[#0d0f14] aspect-video"><img src={heroUrl} alt="" className="w-full h-full object-cover" /></div>;
                })()}
                {mediaFiles.length > 1 && (
                  <div className="flex gap-1.5 px-4 pt-3 pb-1 overflow-x-auto border-t border-white/5">
                    {mediaFiles.map((file, i) => {
                      const url   = URL.createObjectURL(file);
                      const isVid = file.type.startsWith("video/");
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
                          {isVid
                            ? <video src={url} muted playsInline className="w-full h-full object-cover" />
                            : <img src={url} alt="" className="w-full h-full object-cover" />
                          }
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Standard media — carousel matching feed */
              <div className="relative aspect-[4/5] overflow-hidden bg-[#0d0f14]">
                {(() => {
                  const file = mediaFiles[selectedMediaIdx] ?? mediaFiles[0];
                  const url  = URL.createObjectURL(file);
                  return file.type.startsWith("video/")
                    ? <video key={selectedMediaIdx} src={url} muted autoPlay playsInline loop className="w-full h-full object-cover" />
                    : <img key={selectedMediaIdx} src={url} alt="" className="w-full h-full object-cover" />;
                })()}
                {mediaFiles.length > 1 && (
                  <>
                    <button type="button" onClick={() => setSelectedMediaIdx(i => (i - 1 + mediaFiles.length) % mediaFiles.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white">
                      <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                    </button>
                    <button type="button" onClick={() => setSelectedMediaIdx(i => (i + 1) % mediaFiles.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white">
                      <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                    </button>
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white/80 text-[11px] font-medium px-2 py-0.5 rounded-full">
                      {selectedMediaIdx + 1} / {mediaFiles.length}
                    </div>
                    {mediaFiles.length <= 6 && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 items-center">
                        {mediaFiles.map((_, i) => (
                          <button key={i} type="button" onClick={() => setSelectedMediaIdx(i)}
                            className={`h-1.5 rounded-full transition-all duration-200 ${i === selectedMediaIdx ? "w-3 bg-white" : "w-1.5 bg-white/40"}`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          ) : null}

          {/* ── Buy/sell meta ── */}
          {layout === "buysell" && (
            <div className="px-4 pt-3 pb-0 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  buySellTag === "Buying"
                    ? "text-blue-primary border-blue-primary/30 bg-blue-primary/10"
                    : "text-green border-green/30 bg-green/10"
                }`}>
                  {buySellTag}
                </span>
                <span className="text-white/20 text-[11px]">·</span>
                <span className="text-white/25 text-[11px]">
                  {buySellTag === "Buying" ? "Marketplace inquiry" : "Marketplace listing"}
                </span>
              </div>
              {buySellTag === "Selling" && price.trim() && (
                <p className="text-white font-bold text-3xl tracking-tight">
                  {currencySymbol}{parseFloat(price).toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* ── Offering knife card (buysell selling) ── */}
          {layout === "buysell" && buySellTag === "Selling" && sellingKnife && (
            <div className="px-4 pt-3 pb-1">
              <div className="flex items-center gap-0 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                {sellingKnife.coverPhoto ? (
                  <img src={sellingKnife.coverPhoto} alt={sellingKnife.displayName} className="w-28 h-28 object-cover flex-shrink-0" />
                ) : (
                  <div className="w-28 h-28 bg-[#0d0f14] flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={faImage} className="text-white/15 text-2xl" />
                  </div>
                )}
                <div className="flex flex-col gap-1.5 px-4 min-w-0">
                  <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Listed Knife</span>
                  <p className="text-white font-semibold text-base truncate">{sellingKnife.displayName}</p>
                  <p className="text-white/50 text-xs truncate">
                    {sellingKnife.knifeMaker}{sellingKnife.baseKnifeModel ? ` · ${sellingKnife.baseKnifeModel}` : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Tags ── */}
          {tags.length > 0 && (
            <div className="px-4 pt-2 pb-2 flex flex-nowrap gap-x-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {layout === "tutorial" || layout === "combo" ? (
                <>
                  {(() => {
                    const diffTag = tags.find((t) => getTrickTagGroup(t) === "Difficulty");
                    if (!diffTag) return null;
                    const s = difficultyStylePreview(diffTag);
                    return (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold flex-shrink-0 ${s.pill}`}>
                        {formatTagLabelPreview(diffTag)}
                      </span>
                    );
                  })()}
                  {tags.filter((t) => getTrickTagGroup(t) === "Technique").map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/50 flex-shrink-0">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tagDotColorPreview(tag)}`} />
                      {formatTagLabelPreview(tag)}
                    </span>
                  ))}
                </>
              ) : (
                tags.map((tag) => (
                  <span key={tag} className={`inline-flex items-center text-[11px] font-medium flex-shrink-0 ${tagTextColorPreview(tag)}`}>
                    <span className="mr-0.5">#</span>{formatTagLabelPreview(tag)}
                  </span>
                ))
              )}
            </div>
          )}

          {/* ── Description ── */}
          {activeDescription.trim() && (
            <div className="px-4 pt-3 pb-3 flex flex-col gap-1">
              <p
                ref={descRef}
                className={`text-white/60 text-sm leading-relaxed whitespace-pre-wrap transition-all duration-200 ${descExpanded ? "" : "line-clamp-3"}`}
              >
                {activeDescription}
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

          {/* ── Reference knife card ── */}
          {activeKnife && layout !== "trade" && (
            <div className="px-4 pt-1 pb-4">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                {activeKnife.coverPhoto ? (
                  <img src={activeKnife.coverPhoto} alt={activeKnife.displayName} className="w-16 h-16 object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 bg-[#0d0f14] flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={faImage} className="text-white/15 text-lg" />
                  </div>
                )}
                <div className="flex flex-col gap-1 py-2 min-w-0 pr-3">
                  <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Referenced Knife</span>
                  <p className="text-white font-semibold text-sm truncate">{activeKnife.displayName}</p>
                  <p className="text-white/50 text-xs truncate">
                    {activeKnife.knifeMaker}{activeKnife.baseKnifeModel ? ` · ${activeKnife.baseKnifeModel}` : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Engagement counts ── */}
          <div className="px-4 py-3 border-t border-white/[0.06] flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-white/30 text-xs">
              <FontAwesomeIcon icon={faHeart} className="text-[11px]" />
              <span className="font-medium">0</span>
              <span className="text-white/20">likes</span>
            </span>
            <span className="flex items-center gap-1.5 text-white/30 text-xs">
              <FontAwesomeIcon icon={faComment} className="text-[11px]" />
              <span className="font-medium">0</span>
              <span className="text-white/20">comments</span>
            </span>
          </div>

        </div>

        {error && <p className="text-red text-sm font-medium text-center">{error}</p>}

        </div>
      </div>

      {/* Bottom action bar */}
      <div className="px-4 pt-4 pb-[max(2rem,env(safe-area-inset-bottom,2rem))] border-t border-white/[0.06] flex gap-3 flex-shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/5 transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <FontAwesomeIcon icon={faPen} className="text-xs" />
          Edit
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-[2] py-3 rounded-xl bg-blue-primary text-white text-sm font-semibold hover:bg-blue-primary/80 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? "Posting..." : "Confirm & Post"}
        </button>
      </div>

    </div>
  );
};

// ─── Create Post Page ──────────────────────────────────────────────────────
const CreatePostPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const collectionKnives = useAppSelector((state) => state.collection.collectionKnives);
  const collectionData   = useAppSelector((state) => state.collection.collection);

  const [layout, setLayout] = useState<PostLayout>("generic");
  const [caption, setCaption] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [buySellTag, setBuySellTag] = useState<"Buying" | "Selling" | null>(null);
  const [tradeOfferingKnifeId, setTradeOfferingKnifeId] = useState<string | null>(null);
  const [tradeOfferingPickerOpen, setTradeOfferingPickerOpen] = useState(false);
  const [sellingKnifeId, setSellingKnifeId] = useState<string | null>(null);
  const [sellingPickerOpen, setSellingPickerOpen] = useState(false);
  const [lookingFor, setLookingFor] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [tradeSoughtFile, setTradeSoughtFile] = useState<File | null>(null);
  const [mediaError, setMediaError] = useState("");
  const [taggedKnifeId, setTaggedKnifeId] = useState<string | null>(null);
  const [knifePickerOpen, setKnifePickerOpen] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileMetadata, setFileMetadata] = useState<FileMetadata[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [fileKnifePickerOpen, setFileKnifePickerOpen] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const tradeSoughtRef = useRef<HTMLInputElement>(null);

  const isVideoOnly = VIDEO_ONLY_LAYOUTS.includes(layout);
  const isBuyingMode = layout === "buysell" && buySellTag === "Buying";
  const isSingleFile = SINGLE_FILE_LAYOUTS.includes(layout) || isBuyingMode;
  const isImageOnly = isBuyingMode;
  const mediaMax = isBuyingMode ? 1 : MAX_FILES;
  const currency = user?.currency ?? "USD";
  const currencySymbol = currency === "EUR" ? "€" : "$"; // used in price input prefix
  const taggedKnife = collectionKnives.find((k) => k.id === taggedKnifeId) ?? null;

  const isPerFileMetadata = layout === "generic" || (layout === "buysell" && buySellTag === "Selling");
  const tradeBlocked = layout === "trade" && collectionKnives.length === 0;
  const sellBlocked = layout === "buysell" && buySellTag === "Selling" && collectionKnives.length === 0;

  // tutorial requires a difficulty tag; combo does not
  const hasDifficultyTag = layout === "tutorial"
    ? tags.some((t) => getTrickTagGroup(t) === "Difficulty")
    : true;

  const canSubmit =
    !tradeBlocked &&
    !sellBlocked &&
    hasDifficultyTag &&
    (layout === "generic" || layout === "combo" || caption.trim() !== "") &&
    (layout === "trade"
      ? tradeSoughtFile !== null && tradeOfferingKnifeId !== null
      : selectedFiles.length > 0) &&
    (layout !== "buysell" || (buySellTag !== null && (buySellTag !== "Selling" || (price.trim() !== "" && sellingKnifeId !== null))));

  // --- layout change ---
  const handleLayoutChange = (key: PostLayout) => {
    setLayout(key);
    setSelectedFiles([]);
    setTradeSoughtFile(null);
    setBuySellTag(null);
    setSelectedFiles([]);
    setTradeOfferingKnifeId(null);
    setSellingKnifeId(null);
    setSellingPickerOpen(false);
    setTradeOfferingPickerOpen(false);
    setLookingFor("");
    setTags([]);
    setError("");
    setFileMetadata([]);
    setActiveFileIndex(0);
    setFileKnifePickerOpen(false);
  };

  // --- tags ---
  const toggleTrickTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags((prev) => prev.filter((t) => t !== tag));
      return;
    }
    const groupLimits = layout === "tutorial" ? TUTORIAL_GROUP_LIMITS : layout === "combo" ? COMBO_GROUP_LIMITS : null;
    if (groupLimits) {
      const group = getTrickTagGroup(tag);
      const limit = groupLimits[group] ?? 1;
      const groupCount = tags.filter((t) => getTrickTagGroup(t) === group).length;
      if (groupCount >= limit) return;
    } else if (tags.length >= MAX_TAGS) {
      return;
    }
    setTags((prev) => [...prev, tag]);
  };

  // --- file handling ---
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    if (!incoming.length) return;
    if (fileRef.current) fileRef.current.value = "";

    setMediaError("");
    const rejected: string[] = [];
    const valid: File[] = [];

    for (const file of incoming) {
      const isVideo = file.type.startsWith("video/");
      const sizeMB  = file.size / (1024 * 1024);

      if (!isVideo && sizeMB > MAX_IMAGE_SIZE_MB) {
        rejected.push(`"${file.name}" exceeds the ${MAX_IMAGE_SIZE_MB} MB image limit.`);
        continue;
      }
      if (isVideo && sizeMB > MAX_VIDEO_SIZE_MB) {
        rejected.push(`"${file.name}" exceeds the ${MAX_VIDEO_SIZE_MB} MB video limit.`);
        continue;
      }
      if (isVideo) {
        try {
          const dur = await getVideoDuration(file);
          if (dur > MAX_VIDEO_DURATION_S) {
            rejected.push(`"${file.name}" is ${Math.round(dur)}s — videos must be ${MAX_VIDEO_DURATION_S}s or shorter.`);
            continue;
          }
        } catch {
          rejected.push(`"${file.name}" could not be read.`);
          continue;
        }
      }
      valid.push(file);
    }

    if (rejected.length > 0) setMediaError(rejected[0]);

    if (isSingleFile) {
      if (valid.length > 0) setSelectedFiles([valid[0]]);
      return;
    }

    const merged = [...selectedFiles];
    for (const file of valid) {
      if (merged.length >= mediaMax) break;
      const isDupe = merged.some((f) => f.name === file.name && f.size === file.size);
      if (!isDupe) merged.push(file);
    }

    const totalMB = merged.reduce((sum, f) => sum + f.size / (1024 * 1024), 0);
    if (totalMB > 500) {
      setMediaError("Total upload size cannot exceed 500 MB.");
      return;
    }

    const nextMeta = [...fileMetadata];
    while (nextMeta.length < merged.length) nextMeta.push({ description: "", knifeId: null });
    setFileMetadata(nextMeta.slice(0, merged.length));
    setSelectedFiles(merged);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFileMetadata((prev) => prev.filter((_, i) => i !== index));
    setActiveFileIndex((prev) => (prev >= index && prev > 0 ? prev - 1 : prev));
  };

  // --- submit ---
  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsLoading(true);
    setError("");

    const fd = new FormData();

    // Common fields
    fd.append("postType", POST_TYPE_MAP[layout]);
    fd.append("caption", caption.trim());
    if (!isPerFileMetadata && description.trim()) fd.append("description", description.trim());

    if (layout === "generic") {
      selectedFiles.forEach((f) => fd.append("mediaFiles", f));
      tags.forEach((t) => fd.append("tags", GENERIC_TAG_MAP[t] ?? t));
      fd.append("fileMetadata", JSON.stringify(
        fileMetadata.map(m => ({ description: m.description.trim() || null, referenceKnifeId: m.knifeId || null }))
      ));
    }

    if (layout === "buysell") {
      fd.append("mode", buySellTag === "Buying" ? "BUYING" : "SELLING");
      selectedFiles.forEach((f) => fd.append("mediaFiles", f));
      if (buySellTag === "Selling") {
        if (sellingKnifeId) fd.append("offeringKnifeId", sellingKnifeId);
        if (price.trim()) {
          const priceUsd = currency === "EUR"
            ? (parseFloat(price) / 0.92).toFixed(2)
            : parseFloat(price).toFixed(2);
          fd.append("price", priceUsd);
        }
        fd.append("fileMetadata", JSON.stringify(
          fileMetadata.map(m => ({ description: m.description.trim() || null, referenceKnifeId: m.knifeId || null }))
        ));
      }
    }

    if (layout === "trade") {
      if (tradeOfferingKnifeId) fd.append("offeringKnifeId", tradeOfferingKnifeId);
      fd.append("lookingForText", lookingFor.trim());
      if (tradeSoughtFile) fd.append("mediaFiles", tradeSoughtFile);
    }

    if (layout === "tutorial" || layout === "combo") {
      selectedFiles.forEach((f) => fd.append("mediaFiles", f));
      const difficultyTag = tags.find((t) => getTrickTagGroup(t) === "Difficulty");
      if (difficultyTag) fd.append("difficultyTag", DIFFICULTY_TAG_MAP[difficultyTag] ?? difficultyTag.toUpperCase());
      tags
        .filter((t) => getTrickTagGroup(t) === "Technique")
        .forEach((t) => fd.append("techniqueTags", TECHNIQUE_TAG_MAP[t] ?? t.toUpperCase()));
      if (taggedKnifeId) fd.append("referenceKnifeId", taggedKnifeId);
    }

    await axiosApiInstanceAuth
      .request({ url: "/posts/create", method: "post", data: fd })
      .then(() => {
        dispatch(addUIToast({ type: "success", message: "Post published!" }));
        navigate(-1);
      })
      .catch((err) => {
        console.log(err);
        setError("Something went wrong. Please try again.");
        dispatch(addUIToast({ type: "error", message: "Failed to publish post. Please try again." }));
      })
      .finally(() => setIsLoading(false));
  };

  const theme = LAYOUT_THEME[layout];

  const activeMeta = fileMetadata[activeFileIndex] ?? { description: "", knifeId: null };
  const updateActiveMeta = (updates: Partial<FileMetadata>) =>
    setFileMetadata(prev => prev.map((m, i) => i === activeFileIndex ? { ...m, ...updates } : m));
  const activeFileKnife = isPerFileMetadata
    ? (collectionKnives.find(k => k.id === activeMeta.knifeId) ?? null)
    : null;
  const activeFileKnifeIsFeatured = !!collectionData?.featuredKnifeId && !!activeFileKnife && String(activeFileKnife.id) === String(collectionData.featuredKnifeId);

  return (
    <section
      className="w-full min-h-screen flex justify-center px-4 pt-14 pb-28 transition-[background] duration-700"
      style={{ background: `linear-gradient(to bottom, ${theme.tint} 0%, ${theme.tint.replace(/[\d.]+\)$/, "0.10)")} 22%, ${theme.tint.replace(/[\d.]+\)$/, "0.02)")} 45%, rgba(0,0,0,0) 60%), #030405` }}
    >
      <div className="w-full max-w-[600px] flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-colors duration-200"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
          </button>
          <h1 className="text-white font-bold text-xl">Create Post</h1>
        </div>

        {/* Layout selector */}
        <div className="flex flex-col gap-2.5">
          <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Post Type</p>

          {/* 2-col grid — last card spans full width */}
          <div className="grid grid-cols-2 gap-2">
            {LAYOUTS.map(({ key, label }, i) => {
              const isActive = layout === key;
              const cfg = LAYOUT_CARD[key];
              const isLast = i === LAYOUTS.length - 1;
              const isOdd = LAYOUTS.length % 2 !== 0;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleLayoutChange(key)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-2xl border text-left transition-all duration-200 ${
                    isLast && isOdd ? "col-span-2" : ""
                  } ${
                    isActive
                      ? `${cfg.activeBorder} ${cfg.bg}`
                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                    isActive ? cfg.iconBg : "bg-white/[0.07]"
                  }`}>
                    <FontAwesomeIcon
                      icon={cfg.icon}
                      className={`text-sm transition-colors duration-200 ${isActive ? cfg.color : "text-white/30"}`}
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className={`text-sm font-semibold leading-tight transition-colors duration-200 ${isActive ? cfg.color : "text-white/60"}`}>
                      {label}
                    </span>
                    <span className="text-[11px] text-white/25 leading-snug line-clamp-1">{LAYOUTS.find(l => l.key === key)?.description}</span>
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        {/* Caption */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">
              {layout === "tutorial" ? "Trick Name" : layout === "combo" ? "Combo Name" : "Caption"}
              {(layout === "generic" || layout === "combo") && <span className="text-white/25 normal-case tracking-normal font-normal ml-1">— optional</span>}
            </p>
            <span className={`text-xs font-medium ${caption.length > 235 ? "text-gold" : "text-white/30"}`}>
              {255 - caption.length} left
            </span>
          </div>
          <textarea
            value={caption}
            onChange={(e) => { if (e.target.value.length <= 255) setCaption(e.target.value); }}
            placeholder={layout === "tutorial" ? "Enter the trick name..." : layout === "combo" ? "Enter the combo name..." : "Write a caption..."}
            rows={3}
            className="w-full bg-[#13161d] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-primary/50 transition-colors duration-200 resize-none placeholder:text-white/25"
          />
        </div>

        {/* Buy/Sell — type toggle (before media so user picks first) */}
        {layout === "buysell" && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">
              I am <span className="text-red text-[10px] normal-case font-semibold ml-0.5">required</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(["Buying", "Selling"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => { setBuySellTag(option); setSelectedFiles([]); setSellingKnifeId(null); setSellingPickerOpen(false); setFileMetadata([]); setActiveFileIndex(0); setFileKnifePickerOpen(false); }}
                  className={`py-3 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                    buySellTag === option
                      ? "bg-blue-primary/10 border-blue-primary/40 text-blue-primary"
                      : "bg-[#13161d] border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Buy/Sell — knife being sold */}
        {layout === "buysell" && buySellTag === "Selling" && !sellBlocked && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">
              Knife for Sale <span className="text-red text-[10px] normal-case font-semibold ml-0.5">required</span>
            </p>
            {(() => {
              const sellingKnife = collectionKnives.find((k) => k.id === sellingKnifeId) ?? null;
              return sellingKnife ? (() => {
                const isFeatured = !!collectionData?.featuredKnifeId && String(sellingKnife.id) === String(collectionData.featuredKnifeId);
                return (
                  <div
                    style={isFeatured ? { boxShadow: "0 0 14px 2px rgba(230,184,0,0.15)" } : undefined}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${isFeatured ? "bg-gold/8 border border-gold/30" : "bg-[#13161d] border border-blue-primary/30"}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border ${isFeatured ? "border-gold/40" : "border-white/10"}`}>
                        {sellingKnife.coverPhoto && sellingKnife.coverPhoto !== "" ? (
                          <img src={sellingKnife.coverPhoto} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#1c1f27] to-[#0d0f14]" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isFeatured && <FontAwesomeIcon icon={faCrown} className="text-gold text-[10px]" />}
                          <p className="text-white text-sm font-medium truncate">{sellingKnife.displayName}</p>
                        </div>
                        <p className="text-white/40 text-xs truncate">{sellingKnife.knifeMaker}{sellingKnife.baseKnifeModel ? ` · ${sellingKnife.baseKnifeModel}` : ""}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setSellingKnifeId(null)} className="text-white/30 hover:text-white/70 transition-colors duration-200 flex-shrink-0 ml-3">
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                );
              })() : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSellingPickerOpen((p) => !p)}
                    className="w-full flex items-center justify-between bg-[#13161d] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/40 hover:text-white/70 hover:border-white/20 transition-all duration-200"
                  >
                    <span>Select the knife you're selling</span>
                    <FontAwesomeIcon icon={faChevronDown} className={`text-xs transition-transform duration-200 ${sellingPickerOpen ? "rotate-180" : ""}`} />
                  </button>
                  {sellingPickerOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#13161d] border border-white/10 rounded-xl overflow-hidden z-20 shadow-xl max-h-56 overflow-y-auto">
                      {collectionKnives.map((knife) => {
                        const isFeatured = !!collectionData?.featuredKnifeId && String(knife.id) === String(collectionData.featuredKnifeId);
                        return (
                          <button
                            key={knife.id}
                            type="button"
                            onClick={() => { setSellingKnifeId(knife.id); setSellingPickerOpen(false); }}
                            style={isFeatured ? { boxShadow: "inset 0 0 12px 0px rgba(230,184,0,0.08)" } : undefined}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors duration-150 text-left border-b border-white/[0.04] last:border-0 ${isFeatured ? "hover:bg-gold/10" : "hover:bg-white/5"}`}
                          >
                            <div className={`w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border ${isFeatured ? "border-gold/40" : "border-white/10"}`}>
                              {knife.coverPhoto && knife.coverPhoto !== "" ? (
                                <img src={knife.coverPhoto} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#1c1f27] to-[#0d0f14]" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                {isFeatured && <FontAwesomeIcon icon={faCrown} className="text-gold text-[9px] flex-shrink-0" />}
                                <span className={`text-sm font-medium truncate ${isFeatured ? "text-gold" : "text-white"}`}>{knife.displayName}</span>
                              </div>
                              <span className="text-white/40 text-xs truncate">{knife.knifeMaker}{knife.baseKnifeModel ? ` · ${knife.baseKnifeModel}` : ""}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Tags — generic predefined */}
        {layout === "generic" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">
                Tags <span className="normal-case text-white/25 font-normal">— optional</span>
              </p>
              <span className="text-xs text-white/30">{tags.length} / {MAX_TAGS}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {GENERIC_TAGS.map((tag) => {
                const selected = tags.includes(tag);
                const disabled = !selected && tags.length >= MAX_TAGS;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTrickTag(tag)}
                    disabled={disabled}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 ${
                      selected
                        ? "bg-blue-primary/15 border-blue-primary/40 text-blue-primary"
                        : "bg-transparent border-white/10 text-white/40 hover:text-white/70 hover:border-white/25"
                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    {selected && <span className="mr-1 text-blue-primary/60">#</span>}{tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tags — tutorial / combo predefined */}
        {(layout === "tutorial" || layout === "combo") && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">
                Tags <span className="normal-case text-white/25 font-normal">— optional</span>
              </p>
              </div>

            {TRICK_TAGS.map(({ group, tags: options }) => {
              const activeLimits = layout === "tutorial" ? TUTORIAL_GROUP_LIMITS : COMBO_GROUP_LIMITS;
              const groupLimit = activeLimits[group] ?? 1;
              const groupCount = tags.filter((t) => getTrickTagGroup(t) === group).length;
              return (
                <div key={group} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-white/30 font-semibold uppercase tracking-wider">{group}</p>
                    <span className="text-[11px] text-white/25">{groupCount} / {groupLimit}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {options.map((tag) => {
                      const selected = tags.includes(tag);
                      const disabled = !selected && groupCount >= groupLimit;
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTrickTag(tag)}
                          disabled={disabled}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 ${
                            selected
                              ? "bg-blue-primary/15 border-blue-primary/40 text-blue-primary"
                              : "bg-transparent border-white/10 text-white/40 hover:text-white/70 hover:border-white/25"
                          } disabled:opacity-30 disabled:cursor-not-allowed`}
                        >
                          {selected && <span className="mr-1 text-blue-primary/60">#</span>}{tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Media upload */}
        {layout === "trade" ? (
          tradeBlocked ? (
            <div className="flex flex-col items-center gap-4 py-8 px-6 bg-[#13161d] border border-white/10 rounded-2xl text-center">
              <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                <FontAwesomeIcon icon={faBoxOpen} className="text-gold text-lg" />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-white font-semibold text-sm">No knives in your collection</p>
                <p className="text-white/45 text-xs leading-relaxed max-w-xs">
                  Trade posts require you to offer one of your own knives.{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/add-collection-knife")}
                    className="text-blue-primary hover:text-blue-primary/70 underline underline-offset-2 transition-colors duration-150"
                  >
                    Add a knife to your collection
                  </button>
                  {" "}first, then come back to create a trade post.
                </p>
              </div>
            </div>
          ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Photos</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Your Knife — displays cover photo of selected collection knife */}
              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] text-white/35 font-semibold uppercase tracking-wider">Your Knife</p>
                <div className="relative aspect-square rounded-xl overflow-hidden bg-[#13161d] border border-white/10">
                  {(() => {
                    const offeringKnife = collectionKnives.find((k) => k.id === tradeOfferingKnifeId);
                    return offeringKnife?.coverPhoto ? (
                      <img src={offeringKnife.coverPhoto} alt={offeringKnife.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/20 px-3">
                        <FontAwesomeIcon icon={faImage} className="text-2xl" />
                        <span className="text-[11px] font-medium text-center leading-relaxed">Select a knife below to display its photo</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Looking For — manual image upload */}
              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] text-white/35 font-semibold uppercase tracking-wider">Looking For</p>
                <div className="relative aspect-square rounded-xl overflow-hidden bg-[#13161d] border border-dashed border-white/15 hover:border-blue-primary/40 hover:bg-blue-primary/5 transition-all duration-200">
                  {tradeSoughtFile ? (
                    <>
                      <img src={URL.createObjectURL(tradeSoughtFile)} alt="Looking for" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setTradeSoughtFile(null)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                      >
                        <FontAwesomeIcon icon={faXmark} className="text-[11px]" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => tradeSoughtRef.current?.click()}
                      className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/25 hover:text-white/45 transition-colors duration-200"
                    >
                      <FontAwesomeIcon icon={faImage} className="text-2xl" />
                      <span className="text-[11px] font-medium px-2 text-center">The knife you want in return</span>
                    </button>
                  )}
                </div>
                <input
                  ref={tradeSoughtRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      if (f.size / (1024 * 1024) > MAX_IMAGE_SIZE_MB) {
                        setMediaError(`"${f.name}" exceeds the ${MAX_IMAGE_SIZE_MB} MB image limit.`);
                      } else {
                        setMediaError("");
                        setTradeSoughtFile(f);
                      }
                    }
                    e.target.value = "";
                  }}
                />
              </div>
            </div>

            {/* Trade text / picker fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Offering — knife picker */}
              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] text-white/35 font-semibold uppercase tracking-wider">Offering</p>
                {(() => {
                  const offeringKnife = collectionKnives.find((k) => k.id === tradeOfferingKnifeId) ?? null;
                  return offeringKnife ? (() => {
                    const isFeatured = !!collectionData?.featuredKnifeId && String(offeringKnife.id) === String(collectionData.featuredKnifeId);
                    return (
                      <div
                        style={isFeatured ? { boxShadow: "0 0 14px 2px rgba(230,184,0,0.15)" } : undefined}
                        className={`flex items-center justify-between rounded-xl px-3 py-2.5 gap-2 ${isFeatured ? "bg-gold/8 border border-gold/30" : "bg-[#13161d] border border-blue-primary/30"}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-8 h-8 rounded-md overflow-hidden flex-shrink-0 border ${isFeatured ? "border-gold/40" : "border-white/10"}`}>
                            {offeringKnife.coverPhoto && offeringKnife.coverPhoto !== "" ? (
                              <img src={offeringKnife.coverPhoto} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[#1c1f27] to-[#0d0f14]" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1">
                              {isFeatured && <FontAwesomeIcon icon={faCrown} className="text-gold text-[9px] flex-shrink-0" />}
                              <span className={`text-xs font-medium truncate ${isFeatured ? "text-gold" : "text-white"}`}>{offeringKnife.displayName}</span>
                            </div>
                            <span className="text-white/40 text-[11px] truncate">{offeringKnife.knifeMaker}{offeringKnife.baseKnifeModel ? ` · ${offeringKnife.baseKnifeModel}` : ""}</span>
                          </div>
                        </div>
                        <button type="button" onClick={() => setTradeOfferingKnifeId(null)} className="text-white/30 hover:text-white/70 transition-colors flex-shrink-0">
                          <FontAwesomeIcon icon={faXmark} className="text-xs" />
                        </button>
                      </div>
                    );
                  })() : (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setTradeOfferingPickerOpen((p) => !p)}
                        disabled={collectionKnives.length === 0}
                        className="w-full min-w-0 flex items-center justify-between bg-[#13161d] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white/40 hover:text-white/70 hover:border-white/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span className="truncate min-w-0">{collectionKnives.length === 0 ? "No knives in collection" : "Select a knife"}</span>
                        <FontAwesomeIcon icon={faChevronDown} className={`text-[10px] flex-shrink-0 transition-transform duration-200 ${tradeOfferingPickerOpen ? "rotate-180" : ""}`} />
                      </button>
                      {tradeOfferingPickerOpen && collectionKnives.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#13161d] border border-white/10 rounded-xl overflow-hidden z-20 shadow-xl max-h-40 overflow-y-auto">
                          {collectionKnives.map((knife) => {
                            const isFeatured = !!collectionData?.featuredKnifeId && String(knife.id) === String(collectionData.featuredKnifeId);
                            return (
                              <button
                                key={knife.id}
                                type="button"
                                onClick={() => { setTradeOfferingKnifeId(knife.id); setTradeOfferingPickerOpen(false); }}
                                style={isFeatured ? { boxShadow: "inset 0 0 12px 0px rgba(230,184,0,0.08)" } : undefined}
                                className={`w-full flex items-center gap-2 px-3 py-2.5 transition-colors duration-150 text-left border-b border-white/[0.04] last:border-0 ${isFeatured ? "hover:bg-gold/10" : "hover:bg-white/5"}`}
                              >
                                <div className={`w-8 h-8 rounded-md overflow-hidden flex-shrink-0 border ${isFeatured ? "border-gold/40" : "border-white/10"}`}>
                                  {knife.coverPhoto && knife.coverPhoto !== "" ? (
                                    <img src={knife.coverPhoto} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-[#1c1f27] to-[#0d0f14]" />
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-1">
                                    {isFeatured && <FontAwesomeIcon icon={faCrown} className="text-gold text-[9px] flex-shrink-0" />}
                                    <span className={`text-xs font-medium truncate ${isFeatured ? "text-gold" : "text-white"}`}>{knife.displayName}</span>
                                  </div>
                                  <span className="text-white/40 text-[11px] truncate">{knife.knifeMaker}{knife.baseKnifeModel ? ` · ${knife.baseKnifeModel}` : ""}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Looking For — free text */}
              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] text-white/35 font-semibold uppercase tracking-wider">Looking For</p>
                <input
                  type="text"
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                  placeholder="e.g. BRS Alpha Beast"
                  className="w-full bg-[#13161d] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-primary/50 transition-colors duration-200 placeholder:text-white/20"
                />
              </div>
            </div>
          </div>
          )
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">
                {isVideoOnly ? "Video" : "Media"}
              </p>
              <span className="text-xs text-white/30">
                {selectedFiles.length} / {mediaMax}
              </span>
            </div>

            {/* Buy/Sell locked state — no tag selected yet */}
            {layout === "buysell" && !buySellTag ? (
              <div className="w-full h-24 rounded-xl border border-dashed border-white/10 bg-[#13161d] flex items-center justify-center">
                <p className="text-white/25 text-xs font-medium">Select Buying or Selling above to upload media</p>
              </div>
            ) : null}

            {/* Sell blocked — no knives in collection */}
            {sellBlocked && (
              <div className="flex flex-col items-center gap-4 py-8 px-6 bg-[#13161d] border border-white/10 rounded-2xl text-center">
                <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faBoxOpen} className="text-gold text-lg" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-white font-semibold text-sm">No knives in your collection</p>
                  <p className="text-white/45 text-xs leading-relaxed max-w-xs">
                    To list a knife for sale you need one in your collection first.{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/add-collection-knife")}
                      className="text-blue-primary hover:text-blue-primary/70 underline underline-offset-2 transition-colors duration-150"
                    >
                      Add a knife to your collection
                    </button>
                    {" "}before creating a selling post.
                  </p>
                </div>
              </div>
            )}

            {/* Thumbnails + upload — hidden until buysell tag is chosen */}
            {!(layout === "buysell" && !buySellTag) && selectedFiles.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {selectedFiles.map((file, i) => {
                  const url = URL.createObjectURL(file);
                  const isVideo = file.type.startsWith("video/");
                  const isActive = isPerFileMetadata && i === activeFileIndex;
                  const meta = fileMetadata[i];
                  const hasContent = isPerFileMetadata && meta && (meta.description.trim() || meta.knifeId);
                  return (
                    <motion.div
                      key={i}
                      animate={{ scale: isActive ? 1.06 : 1 }}
                      transition={{ type: "spring", stiffness: 480, damping: 16 }}
                      style={{ zIndex: isActive ? 1 : 0, position: "relative" }}
                      onClick={isPerFileMetadata ? () => { setActiveFileIndex(i); setFileKnifePickerOpen(false); } : undefined}
                      className={`aspect-square rounded-xl overflow-hidden bg-[#13161d] border-2 transition-colors duration-150 ${
                        isPerFileMetadata
                          ? isActive
                            ? "border-blue-primary cursor-pointer"
                            : "border-white/10 hover:border-white/25 cursor-pointer"
                          : "border-white/10"
                      }`}
                    >
                      {isVideo ? (
                        <video src={url} muted playsInline className="w-full h-full object-cover" />
                      ) : (
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                      >
                        <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                      </button>
                      {hasContent && (
                        <span className="absolute bottom-1 left-1 w-2 h-2 rounded-full bg-blue-primary border border-black" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Upload zone */}
            {!(layout === "buysell" && !buySellTag) && selectedFiles.length < mediaMax && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-28 rounded-xl border border-dashed border-white/15 bg-[#13161d] hover:border-blue-primary/40 hover:bg-blue-primary/5 transition-all duration-200 flex flex-col items-center justify-center gap-2 text-white/30 hover:text-white/50"
              >
                <FontAwesomeIcon icon={isVideoOnly ? faVideo : faImage} className="text-xl" />
                <span className="text-xs font-medium">
                  {isVideoOnly
                    ? "Click to upload a video"
                    : isSingleFile
                    ? "Click to upload an image"
                    : selectedFiles.length > 0
                    ? "Add more"
                    : "Click to upload images or videos"}
                </span>
                {isVideoOnly && <span className="text-[11px] text-white/20">Video files only</span>}
                {isImageOnly && <span className="text-[11px] text-white/20">Image files only</span>}
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              multiple={!isSingleFile}
              accept={isVideoOnly ? "video/*" : isImageOnly ? "image/*" : "image/*,video/*"}
              className="hidden"
              onChange={handleFileChange}
            />
            {mediaError && (
              <p className="text-red text-xs font-medium mt-1">{mediaError}</p>
            )}
          </div>
        )}

        {/* Per-file metadata editor — generic and buysell-selling */}
        {isPerFileMetadata && selectedFiles.length > 0 && (
          <>
            <div className="flex flex-col gap-3 bg-[#0e1016] rounded-2xl p-4 border border-white/[0.06]">
              {selectedFiles.length > 1 && (
                <p className="text-[11px] text-white/30 font-semibold uppercase tracking-widest">
                  File {activeFileIndex + 1} of {selectedFiles.length}
                </p>
              )}

              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] text-white/35 font-semibold uppercase tracking-wider">
                  Description <span className="normal-case font-normal text-white/20">— optional</span>
                </p>
                <textarea
                  value={activeMeta.description}
                  onChange={(e) => updateActiveMeta({ description: e.target.value })}
                  placeholder={selectedFiles.length > 1 ? `Add a description for file ${activeFileIndex + 1}...` : "Add a description..."}
                  rows={3}
                  className="w-full bg-[#13161d] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-primary/50 transition-colors duration-200 resize-none placeholder:text-white/25"
                />
              </div>

              {layout === "generic" && (
              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] text-white/35 font-semibold uppercase tracking-wider">
                  Reference a Knife <span className="normal-case font-normal text-white/20">— optional</span>
                </p>
                {activeFileKnife ? (
                  <div
                    style={activeFileKnifeIsFeatured ? { boxShadow: "0 0 14px 2px rgba(230,184,0,0.15)" } : undefined}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${activeFileKnifeIsFeatured ? "bg-gold/8 border border-gold/30" : "bg-[#13161d] border border-blue-primary/30"}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border ${activeFileKnifeIsFeatured ? "border-gold/40" : "border-white/10"}`}>
                        {activeFileKnife.coverPhoto && activeFileKnife.coverPhoto !== ""
                          ? <img src={activeFileKnife.coverPhoto} className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-gradient-to-br from-[#1c1f27] to-[#0d0f14]" />
                        }
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          {activeFileKnifeIsFeatured && <FontAwesomeIcon icon={faCrown} className="text-gold text-[10px]" />}
                          <p className="text-white text-sm font-medium truncate">{activeFileKnife.displayName}</p>
                        </div>
                        <p className="text-white/40 text-xs truncate">{activeFileKnife.knifeMaker}{activeFileKnife.baseKnifeModel ? ` · ${activeFileKnife.baseKnifeModel}` : ""}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => updateActiveMeta({ knifeId: null })} className="text-white/30 hover:text-white/70 transition-colors duration-200 flex-shrink-0 ml-3">
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setFileKnifePickerOpen(p => !p)}
                      disabled={collectionKnives.length === 0}
                      className="w-full flex items-center justify-between bg-[#13161d] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/40 hover:text-white/70 hover:border-white/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>{collectionKnives.length === 0 ? "No knives in collection" : "Select a knife from your collection"}</span>
                      <FontAwesomeIcon icon={faChevronDown} className={`text-xs transition-transform duration-200 ${fileKnifePickerOpen ? "rotate-180" : ""}`} />
                    </button>
                    {fileKnifePickerOpen && collectionKnives.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#13161d] border border-white/10 rounded-xl overflow-hidden z-20 shadow-xl max-h-56 overflow-y-auto">
                        {collectionKnives.map((knife) => {
                          const isFeatured = !!collectionData?.featuredKnifeId && String(knife.id) === String(collectionData.featuredKnifeId);
                          return (
                            <button
                              key={knife.id}
                              type="button"
                              onClick={() => { updateActiveMeta({ knifeId: knife.id }); setFileKnifePickerOpen(false); }}
                              style={isFeatured ? { boxShadow: "inset 0 0 12px 0px rgba(230,184,0,0.08)" } : undefined}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors duration-150 text-left border-b border-white/[0.04] last:border-0 ${isFeatured ? "hover:bg-gold/10" : "hover:bg-white/5"}`}
                            >
                              <div className={`w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border ${isFeatured ? "border-gold/40" : "border-white/10"}`}>
                                {knife.coverPhoto && knife.coverPhoto !== ""
                                  ? <img src={knife.coverPhoto} className="w-full h-full object-cover" />
                                  : <div className="w-full h-full bg-gradient-to-br from-[#1c1f27] to-[#0d0f14]" />
                                }
                              </div>
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {isFeatured && <FontAwesomeIcon icon={faCrown} className="text-gold text-[9px] flex-shrink-0" />}
                                  <span className={`text-sm font-medium truncate ${isFeatured ? "text-gold" : "text-white"}`}>{knife.displayName}</span>
                                </div>
                                <span className="text-white/40 text-xs truncate">{knife.knifeMaker}{knife.baseKnifeModel ? ` · ${knife.baseKnifeModel}` : ""}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
              )}
            </div>
          </>
        )}

        {/* Description — single-file layouts (tutorial, combo, buysell-buying) */}
        {!isPerFileMetadata && layout !== "trade" && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Description <span className="normal-case text-white/25 font-normal">— optional</span></p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more detail to your post..."
              rows={4}
              className="w-full bg-[#13161d] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-primary/50 transition-colors duration-200 resize-none placeholder:text-white/25"
            />
          </div>
        )}

        {/* Buy/Sell — price (Selling only) */}
        {layout === "buysell" && buySellTag === "Selling" && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Price</p>
            <div className="flex items-center bg-[#13161d] border border-white/10 rounded-xl overflow-hidden focus-within:border-blue-primary/50 transition-colors duration-200">
              <span className="px-4 py-3 text-sm text-white/40 border-r border-white/10 font-medium select-none">
                {currencySymbol}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onBlur={() => {
                  const num = parseFloat(price);
                  if (!isNaN(num)) setPrice(num.toFixed(2));
                }}
                placeholder="0.00"
                className="flex-1 bg-transparent px-4 py-3 text-white text-sm outline-none placeholder:text-white/25"
              />
            </div>
          </div>
        )}

        {/* Knife reference — tutorial and combo only */}
        {(layout === "tutorial" || layout === "combo") && <div className="flex flex-col gap-1.5">
          <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">
            Reference Your Knife <span className="normal-case text-white/25 font-normal">— optional</span>
          </p>

          {taggedKnife ? (() => {
            const taggedIsFeatured = !!collectionData?.featuredKnifeId && String(taggedKnife.id) === String(collectionData.featuredKnifeId);
            return (
              <div
                style={taggedIsFeatured ? { boxShadow: "0 0 14px 2px rgba(230,184,0,0.15)" } : undefined}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
                  taggedIsFeatured
                    ? "bg-gold/8 border border-gold/30"
                    : "bg-[#13161d] border border-blue-primary/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Cover photo thumbnail */}
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 border border-white/10">
                    {taggedKnife.coverPhoto && taggedKnife.coverPhoto !== "" ? (
                      <img src={taggedKnife.coverPhoto} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1c1f27] to-[#0d0f14]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      {taggedIsFeatured && <FontAwesomeIcon icon={faCrown} className="text-gold text-[10px]" />}
                      <p className="text-white text-sm font-medium">{taggedKnife.displayName}</p>
                    </div>
                    <p className="text-white/40 text-xs">{taggedKnife.knifeMaker}{taggedKnife.baseKnifeModel ? ` · ${taggedKnife.baseKnifeModel}` : ""}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTaggedKnifeId(null)}
                  className="text-white/30 hover:text-white/70 transition-colors duration-200 pl-2"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            );
          })() : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setKnifePickerOpen((p) => !p)}
                disabled={collectionKnives.length === 0}
                className="w-full flex items-center justify-between bg-[#13161d] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/40 hover:text-white/70 hover:border-white/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>{collectionKnives.length === 0 ? "No knives in collection" : "Select a knife from your collection"}</span>
                <FontAwesomeIcon icon={faChevronDown} className={`text-xs transition-transform duration-200 ${knifePickerOpen ? "rotate-180" : ""}`} />
              </button>

              {knifePickerOpen && collectionKnives.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#13161d] border border-white/10 rounded-xl overflow-hidden z-20 shadow-xl max-h-56 overflow-y-auto">
                  {collectionKnives.map((knife) => {
                    const isFeatured = !!collectionData?.featuredKnifeId && String(knife.id) === String(collectionData.featuredKnifeId);
                    return (
                      <button
                        key={knife.id}
                        type="button"
                        onClick={() => {
                          setTaggedKnifeId(knife.id);
                          setKnifePickerOpen(false);
                        }}
                        style={isFeatured ? { boxShadow: "inset 0 0 12px 0px rgba(230,184,0,0.08)" } : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors duration-150 text-left border-b border-white/[0.04] last:border-0 ${
                          isFeatured ? "hover:bg-gold/10" : "hover:bg-white/5"
                        }`}
                      >
                        {/* Cover photo thumbnail */}
                        <div className={`w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border ${isFeatured ? "border-gold/40" : "border-white/10"}`}>
                          {knife.coverPhoto && knife.coverPhoto !== "" ? (
                            <img src={knife.coverPhoto} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#1c1f27] to-[#0d0f14]" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            {isFeatured && <FontAwesomeIcon icon={faCrown} className="text-gold text-[9px] flex-shrink-0" />}
                            <span className={`text-sm font-medium truncate ${isFeatured ? "text-gold" : "text-white"}`}>{knife.displayName}</span>
                          </div>
                          <span className="text-white/40 text-xs truncate">{knife.knifeMaker}{knife.baseKnifeModel ? ` · ${knife.baseKnifeModel}` : ""}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>}

        {/* Error */}
        {error && <p className="text-red text-sm font-medium">{error}</p>}

        {/* Submit */}
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          disabled={!canSubmit || isLoading}
          className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: theme.btnBg, boxShadow: theme.btnShadow }}
        >
          Preview Post
        </button>

      </div>

      {/* Post preview overlay */}
      {showPreview && (
        <PostPreviewOverlay
          layout={layout}
          caption={caption}
          description={description}
          tags={tags}
          selectedFiles={selectedFiles}
          tradeSoughtFile={tradeSoughtFile}
          tradeOfferingKnife={collectionKnives.find((k) => k.id === tradeOfferingKnifeId) ?? null}
          lookingFor={lookingFor}
          price={price}
          buySellTag={buySellTag}
          currency={currency}
          taggedKnife={taggedKnife}
          sellingKnife={collectionKnives.find((k) => k.id === sellingKnifeId) ?? null}
          fileMetadata={fileMetadata}
          collectionKnives={collectionKnives}
          user={user}
          isLoading={isLoading}
          error={error}
          onEdit={() => { setShowPreview(false); setError(""); }}
          onConfirm={handleSubmit}
        />
      )}

    </section>
  );
};

export default CreatePostPage;
