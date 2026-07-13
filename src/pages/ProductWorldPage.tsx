import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { AnimatePresence, motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass, faXmark, faSliders, faClock, faStar, faChevronRight, faBook,
  faChevronDown, faFilter,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarOutline } from "@fortawesome/free-regular-svg-icons";
import { axiosApiInstance } from "../api/axios";
import { PostDetail, mapPostDetail } from "../modals/Post";
import FeedPostCard from "../components/FeedPostCard";
import { useAppSelector } from "../redux/hooks";
import knivesData from "../data/knives.json";
import makersData from "../data/makers.json";
import { bladeStyle as bladeStyleOpts }                 from "../comboBoxData/BladeStyle";
import { bladeMaterial as bladeMaterialOpts }           from "../comboBoxData/BladeMaterial";
import { bladeFinish as bladeFinishOpts }               from "../comboBoxData/BladeFinish";
import { handleMaterial as handleMaterialOpts }         from "../comboBoxData/HandleMaterial";
import { handleConstruction as handleConstructionOpts } from "../comboBoxData/HandleConstruction";
import { handleFinish as handleFinishOpts }             from "../comboBoxData/HandleFinish";
import { pivotSystem as pivotSystemOpts }               from "../comboBoxData/PivotSystem";
import { pinSystem as pinSystemOpts }                   from "../comboBoxData/PinSystem";
import { latchType as latchTypeOpts }                   from "../comboBoxData/LatchType";

// ── Suggestion types ──────────────────────────────────────────────────────────

interface KnifeVersion { discontinued: boolean }
interface KnifeSuggestion { slug: string; name: string; maker: string; versions: KnifeVersion[] }
interface MakerSuggestion { slug: string; name: string; country: string }

const suggestionMatch = (haystack: string, q: string): boolean =>
  !!q.trim() && haystack.toLowerCase().includes(q.toLowerCase().trim());

const PAGE_SIZE  = 20;
const MAX_RECENT = 8;

const TYPE_FILTERS = [
  { value: "ALL",      label: "All Listings" },
  { value: "BUY_SELL", label: "Buy / Sell"   },
  { value: "TRADE",    label: "Trade"         },
] as const;

// ── Knife spec filter definitions (keys = API param names) ────────────────────

type SpecKey =
  | "knifeBladeStyle" | "knifeBladeMaterial" | "knifeBladeFinish"
  | "knifeHandleMaterial" | "knifeHandleConstruction" | "knifeHandleFinish"
  | "knifePivotSystem" | "knifePinSystem" | "knifeLatchType" | "knifeType";

type KnifeSpecs = Record<SpecKey, string[]>;

const EMPTY_SPECS: KnifeSpecs = {
  knifeBladeStyle: [], knifeBladeMaterial: [], knifeBladeFinish: [],
  knifeHandleMaterial: [], knifeHandleConstruction: [], knifeHandleFinish: [],
  knifePivotSystem: [], knifePinSystem: [], knifeLatchType: [],
  knifeType: [],
};

type SpecFilterDef = {
  key: SpecKey;
  label: string;
  options: readonly string[];
  optionLabels?: readonly string[];
};

const KNIFE_SPEC_FILTERS: SpecFilterDef[] = [
  { key: "knifeBladeStyle",         label: "Blade Style",         options: bladeStyleOpts },
  { key: "knifeBladeMaterial",      label: "Blade Material",      options: bladeMaterialOpts },
  { key: "knifeBladeFinish",        label: "Blade Finish",        options: bladeFinishOpts },
  { key: "knifeHandleMaterial",     label: "Handle Material",     options: handleMaterialOpts },
  { key: "knifeHandleConstruction", label: "Handle Construction", options: handleConstructionOpts },
  { key: "knifeHandleFinish",       label: "Handle Finish",       options: handleFinishOpts },
  { key: "knifePivotSystem",        label: "Pivot System",        options: pivotSystemOpts },
  { key: "knifePinSystem",          label: "Pin System",          options: pinSystemOpts },
  { key: "knifeLatchType",          label: "Latch Type",          options: latchTypeOpts },
  {
    key: "knifeType",
    label: "Knife Type",
    options: ["liveblade", "trainer", "both"],
    optionLabels: ["Live Blade", "Trainer", "Both"],
  },
];

// ── localStorage helpers ──────────────────────────────────────────────────────

const loadList = (key: string): string[] => {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; }
};
const saveList = (key: string, list: string[]) => localStorage.setItem(key, JSON.stringify(list));
const pushRecent = (term: string, key: string) => {
  if (!term.trim()) return;
  const prev = loadList(key).filter((s) => s !== term);
  saveList(key, [term, ...prev].slice(0, MAX_RECENT));
};

// ── Style constants ───────────────────────────────────────────────────────────

const CARD        = "rounded-2xl border border-white/[0.07] bg-[#060001] p-4 flex flex-col gap-3";
const CARD_SHADOW = { boxShadow: "0 4px 24px rgba(0,0,0,0.6)" };
const LABEL       = "text-[10px] font-bold uppercase tracking-widest text-white/35 mb-3 block";

// ── FilterSection ─────────────────────────────────────────────────────────────

interface FilterSectionProps {
  label: string;
  options: readonly string[];
  optionLabels?: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
  defaultOpen?: boolean;
}

const FilterSection = ({ label, options, optionLabels, selected, onToggle, defaultOpen = false }: FilterSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/[0.05] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-white/65 text-xs font-medium">{label}</span>
          {selected.length > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30 leading-none">
              {selected.length}
            </span>
          )}
        </div>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-white/25 text-[9px] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-3 flex flex-wrap gap-1.5">
              {options.map((apiVal, i) => {
                const display = optionLabels?.[i] ?? apiVal;
                const active  = selected.includes(apiVal);
                return (
                  <button
                    key={apiVal}
                    type="button"
                    onClick={() => onToggle(apiVal)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all duration-150 ${
                      active
                        ? "bg-gold/15 border-gold/40 text-gold"
                        : "bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/65 hover:border-white/[0.14] hover:bg-white/[0.05]"
                    }`}
                  >
                    {display}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Spec groups — shared between sidebar and mobile sheet ─────────────────────

const SpecGroups = ({
  specsFilter, onSpecToggle,
}: { specsFilter: KnifeSpecs; onSpecToggle: (key: SpecKey, v: string) => void }) => (
  <div className="flex flex-col">
    {KNIFE_SPEC_FILTERS.map(({ key, label, options, optionLabels }) => (
      <FilterSection
        key={key}
        label={label}
        options={options}
        optionLabels={optionLabels}
        selected={specsFilter[key]}
        onToggle={(v) => onSpecToggle(key, v)}
      />
    ))}
  </div>
);

// ── FilterSidebar (desktop) ───────────────────────────────────────────────────

interface FilterSidebarProps {
  filterType: string;
  onTypeChange: (v: string) => void;
  specsFilter: KnifeSpecs;
  onSpecToggle: (key: SpecKey, value: string) => void;
  priceMin: string;
  priceMax: string;
  onPriceMinChange: (v: string) => void;
  onPriceMaxChange: (v: string) => void;
  onPriceBlur: () => void;
  totalActiveFilters: number;
  onClearAll: () => void;
}

const FilterSidebar = ({
  filterType, onTypeChange,
  specsFilter, onSpecToggle,
  priceMin, priceMax, onPriceMinChange, onPriceMaxChange, onPriceBlur,
  totalActiveFilters, onClearAll,
}: FilterSidebarProps) => (
  <div className="flex flex-col gap-3">
    {totalActiveFilters > 0 && (
      <div className="flex items-center justify-between px-0.5">
        <span className="text-gold/70 text-[11px] font-medium">
          {totalActiveFilters} filter{totalActiveFilters !== 1 ? "s" : ""} active
        </span>
        <button type="button" onClick={onClearAll} className="text-white/30 text-[11px] hover:text-white/60 transition-colors duration-150">
          Clear all
        </button>
      </div>
    )}

    {/* Listing type */}
    <div className={CARD} style={CARD_SHADOW}>
      <span className={LABEL}>Listing Type</span>
      <div className="flex flex-col gap-1">
        {TYPE_FILTERS.map(({ value, label }) => {
          const isActive = filterType === value;
          const dot = value === "BUY_SELL" ? "bg-gold" : value === "TRADE" ? "bg-blue-primary" : null;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onTypeChange(value)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all duration-150 ${
                isActive
                  ? "bg-gold/10 border-gold/35 text-gold"
                  : "text-white/50 hover:text-white/75 hover:bg-white/[0.04] border-transparent"
              }`}
            >
              {dot && <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot} ${isActive ? "opacity-100" : "opacity-40"}`} />}
              {label}
            </button>
          );
        })}
      </div>
    </div>

    {/* Price range */}
    <div className={CARD} style={CARD_SHADOW}>
      <span className={LABEL}>Price Range</span>
      <div className="flex items-center gap-2">
        <input
          type="number" placeholder="Min" value={priceMin}
          onChange={(e) => onPriceMinChange(e.target.value)} onBlur={onPriceBlur}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white/60 text-xs placeholder-white/20 focus:outline-none focus:border-gold/30 transition-colors duration-150"
        />
        <span className="text-white/20 text-xs flex-shrink-0">—</span>
        <input
          type="number" placeholder="Max" value={priceMax}
          onChange={(e) => onPriceMaxChange(e.target.value)} onBlur={onPriceBlur}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white/60 text-xs placeholder-white/20 focus:outline-none focus:border-gold/30 transition-colors duration-150"
        />
      </div>
    </div>

    {/* Knife specs */}
    <div className={CARD} style={CARD_SHADOW}>
      <span className={LABEL}>Knife Specs</span>
      <SpecGroups specsFilter={specsFilter} onSpecToggle={onSpecToggle} />
    </div>
  </div>
);

// ── MobileFilterSheet ─────────────────────────────────────────────────────────

const MobileFilterSheet = ({
  isOpen, onClose,
  filterType, onTypeChange,
  specsFilter, onSpecToggle,
  priceMin, priceMax, onPriceMinChange, onPriceMaxChange, onPriceBlur,
  totalActiveFilters, onClearAll,
}: FilterSidebarProps & { isOpen: boolean; onClose: () => void }) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 280, mass: 0.9 }}
            className="fixed bottom-0 left-0 right-0 z-[90] flex flex-col rounded-t-3xl overflow-hidden"
            style={{ background: "#0d1117", maxHeight: "88vh", border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.07] flex-shrink-0">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faFilter} className="text-gold/60 text-sm" />
                <span className="text-white font-semibold text-[15px]">Filters</span>
                {totalActiveFilters > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30 leading-none">
                    {totalActiveFilters}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {totalActiveFilters > 0 && (
                  <button type="button" onClick={onClearAll} className="text-white/35 text-xs hover:text-white/60 transition-colors">
                    Clear all
                  </button>
                )}
                <button
                  type="button" onClick={onClose}
                  className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.09] flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-xs" />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>

              {/* Listing type — included in sheet so it's all in one place */}
              <div className={CARD} style={CARD_SHADOW}>
                <span className={LABEL}>Listing Type</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {TYPE_FILTERS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onTypeChange(value)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                        filterType === value
                          ? "bg-gold/15 border-gold/35 text-gold"
                          : "bg-white/[0.03] border-white/[0.06] text-white/40"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div className={CARD} style={CARD_SHADOW}>
                <span className={LABEL}>Price Range</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number" placeholder="Min" value={priceMin}
                    onChange={(e) => onPriceMinChange(e.target.value)} onBlur={onPriceBlur}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white/60 text-sm placeholder-white/20 focus:outline-none focus:border-gold/30 transition-colors duration-150"
                  />
                  <span className="text-white/20 text-xs flex-shrink-0">—</span>
                  <input
                    type="number" placeholder="Max" value={priceMax}
                    onChange={(e) => onPriceMaxChange(e.target.value)} onBlur={onPriceBlur}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white/60 text-sm placeholder-white/20 focus:outline-none focus:border-gold/30 transition-colors duration-150"
                  />
                </div>
              </div>

              {/* Knife specs */}
              <div className={CARD} style={CARD_SHADOW}>
                <span className={LABEL}>Knife Specs</span>
                <SpecGroups specsFilter={specsFilter} onSpecToggle={onSpecToggle} />
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-4 pb-6 pt-3 border-t border-white/[0.07]">
              <button
                type="button" onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-gold/15 border border-gold/35 text-gold text-sm font-semibold hover:bg-gold/20 transition-all duration-150"
              >
                Done
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

// ── Search history sidebar ────────────────────────────────────────────────────

const SearchSidebar = ({
  onSelect, lsRecentKey, lsSavedKey,
}: { onSelect: (term: string) => void; lsRecentKey: string; lsSavedKey: string }) => {
  const [recent, setRecent] = useState<string[]>(() => loadList(lsRecentKey));
  const [saved,  setSaved]  = useState<string[]>(() => loadList(lsSavedKey));

  const removeRecent  = (t: string) => { const n = recent.filter((s) => s !== t); saveList(lsRecentKey, n); setRecent(n); };
  const clearRecent   = () => { saveList(lsRecentKey, []); setRecent([]); };
  const toggleSaved   = (t: string) => { const n = saved.includes(t) ? saved.filter((s) => s !== t) : [t, ...saved]; saveList(lsSavedKey, n); setSaved(n); };
  const removeSaved   = (t: string) => { const n = saved.filter((s) => s !== t); saveList(lsSavedKey, n); setSaved(n); };

  useEffect(() => { setRecent(loadList(lsRecentKey)); setSaved(loadList(lsSavedKey)); }, []);

  const isEmpty = recent.length === 0 && saved.length === 0;

  return (
    <div className="flex flex-col gap-3">
      {saved.length > 0 && (
        <div className={CARD} style={CARD_SHADOW}>
          <span className={LABEL}>Saved Searches</span>
          <div className="flex flex-col gap-1">
            {saved.map((term) => (
              <div key={term} className="flex items-center gap-2 group">
                <button type="button" onClick={() => onSelect(term)} className="flex-1 flex items-center gap-2 min-w-0 py-1 text-left">
                  <FontAwesomeIcon icon={faStar} className="text-gold/60 text-[10px] flex-shrink-0" />
                  <span className="text-white/60 text-xs truncate group-hover:text-white/90 transition-colors duration-150">{term}</span>
                </button>
                <button type="button" onClick={() => removeSaved(term)} className="opacity-0 group-hover:opacity-100 text-white/25 hover:text-white/60 transition-all duration-150 flex-shrink-0">
                  <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className={CARD} style={CARD_SHADOW}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faClock} className="text-white/25 text-[10px]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">Recent</span>
          </div>
          {recent.length > 0 && (
            <button type="button" onClick={clearRecent} className="text-white/25 text-[10px] hover:text-white/50 transition-colors duration-150">Clear all</button>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="text-white/20 text-xs">{isEmpty ? "Your searches will appear here." : "No recent searches."}</p>
        ) : (
          <div className="flex flex-col gap-1">
            {recent.slice(0, 3).map((term) => (
              <div key={term} className="flex items-center gap-2 group">
                <button type="button" onClick={() => onSelect(term)} className="flex-1 flex items-center gap-2 min-w-0 py-1 text-left">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="text-white/20 text-[10px] flex-shrink-0" />
                  <span className="text-white/50 text-xs truncate group-hover:text-white/80 transition-colors duration-150">{term}</span>
                </button>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-150 flex-shrink-0">
                  <button type="button" onClick={() => toggleSaved(term)} className="text-white/25 hover:text-gold/70 transition-colors duration-150">
                    <FontAwesomeIcon icon={saved.includes(term) ? faStar : faStarOutline} className="text-[10px]" />
                  </button>
                  <button type="button" onClick={() => removeRecent(term)} className="text-white/25 hover:text-white/60 transition-colors duration-150">
                    <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {isEmpty && (
        <p className="text-white/20 text-[11px] text-center px-2 leading-relaxed">
          Search for a knife or maker to get started.
        </p>
      )}
    </div>
  );
};

// ── Compact post card (mobile 2-col grid) ─────────────────────────────────────

const compactBadge = (post: PostDetail): { label: string; cls: string } => {
  if (post.postType === "TRADE") return { label: "Trade",   cls: "text-blue-primary border-blue-primary/50 bg-black/70" };
  if (post.mode === "BUYING")    return { label: "Buying",  cls: "text-[#5bc8f5] border-[#5bc8f5]/40 bg-black/70" };
  return                                { label: "Selling", cls: "text-gold border-gold/50 bg-black/70" };
};

const knifeLabel = (post: PostDetail): string | null => {
  const k = post.offeringKnife;
  if (!k) return null;
  if (k.knifeMaker && k.baseKnifeModel) return `${k.knifeMaker} ${k.baseKnifeModel}`;
  if (k.knifeMaker) return k.knifeMaker;
  if (k.baseKnifeModel) return k.baseKnifeModel;
  return k.displayName || null;
};

const CompactPostCard = ({ post }: { post: PostDetail }) => {
  const navigate  = useNavigate();
  const badge     = compactBadge(post);
  const mediaFile = post.mediaFiles[0];
  const isVid     = mediaFile?.isVideo ?? false;
  const hasMedia  = !!mediaFile;
  const knife     = knifeLabel(post);
  const coverImg  = post.postType === "TRADE" ? (post.offeringKnife?.coverPhoto ?? mediaFile?.url) : mediaFile?.url;

  return (
    <button
      type="button"
      onClick={() => navigate(`/post/${post.id}`)}
      className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#0d0f14] border border-white/[0.07] w-full text-left"
    >
      {hasMedia ? (
        isVid
          ? <video src={coverImg ?? ""} className="w-full h-full object-cover" muted playsInline preload="metadata" onLoadedMetadata={(e) => { e.currentTarget.currentTime = 0.001; }} />
          : <img src={coverImg ?? ""} alt="" className="w-full h-full object-cover" />
      ) : post.offeringKnife?.coverPhoto ? (
        <img src={post.offeringKnife.coverPhoto} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-white/10 text-2xl" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <span className={`absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full border backdrop-blur-sm ${badge.cls}`}>{badge.label}</span>

      <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5 pt-4 flex flex-col gap-0.5">
        {knife ? (
          <p className="text-white text-[11px] font-semibold leading-snug line-clamp-2">{knife}</p>
        ) : post.caption?.trim() ? (
          <p className="text-white text-[11px] font-semibold leading-snug line-clamp-2">{post.caption}</p>
        ) : null}
        {post.postType === "BUY_SELL" && post.mode !== "BUYING" && (
          <p className="text-gold text-[11px] font-bold leading-tight">{post.price ? `$${post.price}` : "Offers welcome"}</p>
        )}
        {post.postType === "TRADE" && <p className="text-blue-primary text-[10px] leading-tight">Looking to trade</p>}
        <p className="text-white/30 text-[9px] leading-none mt-0.5">{post.creatorDisplayName}</p>
      </div>
    </button>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const ProductWorldPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const user        = useAppSelector((state) => state.auth.user);
  const uid         = user?.identifierCode ?? "guest";
  const lsRecentKey = `pw_recent_searches_${uid}`;
  const lsSavedKey  = `pw_saved_searches_${uid}`;

  const filterType    = searchParams.get("type") ?? "ALL";
  const filterTypeRef = useRef(filterType);

  // Feed state
  const [posts,       setPosts]       = useState<PostDetail[]>([]);
  const [hasMore,     setHasMore]     = useState(true);
  const [isLoading,   setIsLoading]   = useState(false);
  const [initialDone, setInitialDone] = useState(false);
  const [fetchError,  setFetchError]  = useState(false);
  const [query,       setQuery]       = useState("");
  const [searchOpen,  setSearchOpen]  = useState(false);

  // Filter state
  const [specsFilter,       setSpecsFilter]       = useState<KnifeSpecs>({ ...EMPTY_SPECS });
  const [priceMin,          setPriceMin]          = useState("");
  const [priceMax,          setPriceMax]          = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Refs always in sync for fetchPosts
  const specsRef             = useRef(specsFilter);
  const priceRef             = useRef({ min: priceMin, max: priceMax });
  const lastAppliedPriceRef  = useRef({ min: "", max: "" });
  specsRef.current = specsFilter;
  priceRef.current = { min: priceMin, max: priceMax };

  const totalActiveFilters =
    Object.values(specsFilter).reduce((sum, arr) => sum + arr.length, 0) +
    (priceMin || priceMax ? 1 : 0);

  const listRef       = useRef<HTMLDivElement>(null);
  const inputRef      = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const isFetching    = useRef(false);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);

  const fetchPosts = useCallback((pageIndex: number) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setIsLoading(true);
    setFetchError(false);

    const params: Record<string, unknown> = { page: pageIndex, size: PAGE_SIZE };
    if (filterTypeRef.current !== "ALL") params.postType = filterTypeRef.current;
    if (priceRef.current.min) params.priceMin = priceRef.current.min;
    if (priceRef.current.max) params.priceMax = priceRef.current.max;
    KNIFE_SPEC_FILTERS.forEach(({ key }) => {
      const vals = specsRef.current[key];
      if (vals.length > 0) params[key] = vals.join(",");
    });

    axiosApiInstance
      .get("/posts/any", { params })
      .then((res) => {
        const mapped: PostDetail[] = (res.data?.content ?? [])
          .map(mapPostDetail)
          .filter((p: PostDetail) => {
            if (p.postType !== "BUY_SELL" && p.postType !== "TRADE") return false;
            if (p.postType === "TRADE" && !p.offeringKnife) return false;
            if (p.postType === "BUY_SELL" && p.mode !== "BUYING" && !p.offeringKnife) return false;
            return true;
          });
        if (pageIndex === 0) setPosts(mapped);
        else setPosts((prev) => [...prev, ...mapped]);
        setHasMore(pageIndex < (res.data?.totalPages ?? 1) - 1);
        setInitialDone(true);
      })
      .catch(() => { setFetchError(true); setInitialDone(true); })
      .finally(() => { setIsLoading(false); isFetching.current = false; });
  }, []);

  useEffect(() => { fetchPosts(0); }, [fetchPosts]);

  const resetFeed = useCallback(() => {
    setPosts([]); setInitialDone(false); setHasMore(true); isFetching.current = false;
  }, []);

  const handleTypeChange = useCallback((v: string) => {
    filterTypeRef.current = v;
    setSearchParams(v === "ALL" ? {} : { type: v }, { replace: true });
    resetFeed();
    fetchPosts(0);
  }, [fetchPosts, setSearchParams, resetFeed]);

  const handleSpecToggle = useCallback((key: SpecKey, value: string) => {
    const current = specsRef.current[key];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    specsRef.current = { ...specsRef.current, [key]: next };
    setSpecsFilter((prev) => ({ ...prev, [key]: next }));
    resetFeed();
    fetchPosts(0);
  }, [fetchPosts, resetFeed]);

  const handlePriceApply = useCallback(() => {
    lastAppliedPriceRef.current = { min: priceRef.current.min, max: priceRef.current.max };
    resetFeed();
    fetchPosts(0);
  }, [fetchPosts, resetFeed]);

  const handlePriceBlur = useCallback(() => {
    const cur  = priceRef.current;
    const last = lastAppliedPriceRef.current;
    if (cur.min !== last.min || cur.max !== last.max) handlePriceApply();
  }, [handlePriceApply]);

  const handleClearAll = useCallback(() => {
    specsRef.current            = { ...EMPTY_SPECS };
    priceRef.current            = { min: "", max: "" };
    lastAppliedPriceRef.current = { min: "", max: "" };
    setSpecsFilter({ ...EMPTY_SPECS });
    setPriceMin("");
    setPriceMax("");
    resetFeed();
    fetchPosts(0);
  }, [fetchPosts, resetFeed]);

  // Close search dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSearchSubmit = useCallback((term: string) => {
    const t = term.trim();
    if (!t) return;
    pushRecent(t, lsRecentKey);
    setSavedSearches(loadList(lsSavedKey));
    setQuery(""); setSearchOpen(false);
    navigate(`/product-world/search?q=${encodeURIComponent(t)}`);
  }, [navigate, lsRecentKey, lsSavedKey]);

  const handleSelectSearch = (term: string) => { setQuery(term); setSearchOpen(false); handleSearchSubmit(term); };

  const virtualizer = useWindowVirtualizer({
    count: hasMore ? posts.length + 1 : posts.length,
    estimateSize: () => 520,
    overscan: 3,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  const virtualItems = virtualizer.getVirtualItems();

  useEffect(() => {
    const last = virtualItems[virtualItems.length - 1];
    if (!last) return;
    if (last.index >= posts.length - 1 && hasMore && !isLoading && !isFetching.current && initialDone) {
      fetchPosts(Math.ceil(posts.length / PAGE_SIZE));
    }
  }, [virtualItems, posts.length, hasMore, isLoading, initialDone, fetchPosts]);

  const filterProps: FilterSidebarProps = {
    filterType, onTypeChange: handleTypeChange,
    specsFilter, onSpecToggle: handleSpecToggle,
    priceMin, priceMax, onPriceMinChange: setPriceMin, onPriceMaxChange: setPriceMax,
    onPriceBlur: handlePriceBlur,
    totalActiveFilters, onClearAll: handleClearAll,
  };

  return (
    <section
      className="min-h-screen w-full relative"
      style={{ background: "linear-gradient(to bottom, #0e0000 0%, #0b0000 40%, #080000 100%)" }}
    >
      <MobileFilterSheet isOpen={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} {...filterProps} />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto md:px-6 pt-0 pb-24">

        {/* ── Hero search ── */}
        <div className="xsm:px-4 md:px-0 xsm:pt-5 xsm:pb-2 md:py-8 flex flex-col xsm:gap-3 md:gap-3">
          <div className="flex flex-col xsm:gap-0 md:gap-0.5">
            <span className="xsm:hidden md:block text-[10px] font-bold uppercase tracking-widest text-gold/60">Marketplace & Info Hub</span>
            <h1 className="text-white font-bold xsm:text-xl md:text-2xl leading-tight">Product World</h1>
            <p className="xsm:hidden md:block text-white/35 text-sm">Browse listings or search for specific knives and makers.</p>
          </div>

          {/* Search bar */}
          <div ref={searchWrapRef} className="relative xsm:mt-1 md:mt-1">
            <div className={`relative flex items-center transition-all duration-200 ${searchOpen ? "ring-2 ring-gold/30 rounded-2xl" : ""}`}>
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className={`absolute left-5 text-base pointer-events-none transition-colors duration-200 ${searchOpen || query ? "text-gold/70" : "text-white/30"}`}
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { handleSearchSubmit(query); setSearchOpen(false); }
                  if (e.key === "Escape") { setSearchOpen(false); inputRef.current?.blur(); }
                }}
                placeholder="Search knives, makers, models..."
                className={`w-full border xsm:py-3.5 md:py-4 pl-12 pr-12 xsm:text-sm md:text-sm text-white placeholder-white/30 focus:outline-none transition-all duration-200 ${
                  searchOpen
                    ? "bg-[#1a0a0a] border-gold/50 rounded-t-2xl rounded-b-none"
                    : "bg-[#120606] border-gold/20 rounded-2xl hover:border-gold/35"
                }`}
                style={{ boxShadow: searchOpen ? "0 0 0 3px rgba(230,184,0,0.08)" : "0 2px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(230,184,0,0.04)" }}
              />
              {query && (
                <button type="button" onMouseDown={(e) => { e.preventDefault(); setQuery(""); }} className="absolute right-4 text-white/30 hover:text-white/70 transition-colors duration-150">
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              )}
            </div>

            {/* Search dropdown */}
            {searchOpen && (() => {
              const recent = loadList(lsRecentKey);
              const saved  = loadList(lsSavedKey);
              const q = query.trim();
              const knifeMatches = q ? (knivesData as KnifeSuggestion[]).filter((k) => suggestionMatch(k.name, q) || suggestionMatch(k.maker, q)).slice(0, 4) : [];
              const makerMatches = q ? (makersData as MakerSuggestion[]).filter((m) => suggestionMatch(m.name, q) || suggestionMatch(m.country, q)).slice(0, 3) : [];
              const filteredHistory = q ? [...new Set([...saved, ...recent])].filter((s) => s.toLowerCase().includes(q.toLowerCase())) : [];
              const showSaved   = !q && saved.length > 0;
              const showRecent  = !q && recent.length > 0;
              const showHistory = q && filteredHistory.length > 0;
              const showBlank   = !q && recent.length === 0 && saved.length === 0;
              return (
                <div className="absolute left-0 right-0 z-50 bg-[#1a0a0a] border border-gold/50 border-t-0 rounded-b-2xl overflow-hidden"
                  style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.7), 0 0 0 3px rgba(230,184,0,0.08)" }}>
                  {showBlank && <div className="px-5 py-4 text-white/25 text-xs">Start typing to search knives, makers, or models</div>}
                  {knifeMatches.length > 0 && (
                    <div className="pt-3 pb-1">
                      <p className="px-5 text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Knife Pages</p>
                      {knifeMatches.map((k) => {
                        const hasActive = k.versions.some((v) => !v.discontinued);
                        return (
                          <button key={k.slug} type="button" onMouseDown={() => { setSearchOpen(false); navigate(`/product-world/knife/${k.slug}`); }}
                            className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.04] transition-colors duration-100 text-left group">
                            <FontAwesomeIcon icon={faBook} className="text-gold/40 text-[10px] flex-shrink-0" />
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-white/80 text-sm truncate font-medium">{k.name}</span>
                              <span className="text-white/35 text-xs truncate">{k.maker}</span>
                            </div>
                            {hasActive && <span className="text-[9px] font-semibold text-green/70 border border-green/25 bg-green/5 px-1.5 py-0.5 rounded-full flex-shrink-0">In Production</span>}
                            <FontAwesomeIcon icon={faChevronRight} className="text-[10px] text-white/15 group-hover:text-white/40 flex-shrink-0 transition-colors" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {makerMatches.length > 0 && (
                    <div className="pt-3 pb-1">
                      <p className="px-5 text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Maker Pages</p>
                      {makerMatches.map((m) => (
                        <button key={m.slug} type="button" onMouseDown={() => { setSearchOpen(false); navigate(`/product-world/maker/${m.slug}`); }}
                          className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.04] transition-colors duration-100 text-left group">
                          <FontAwesomeIcon icon={faBook} className="text-blue-primary/50 text-[10px] flex-shrink-0" />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-white/80 text-sm truncate font-medium">{m.name}</span>
                            <span className="text-white/35 text-xs truncate">{m.country}</span>
                          </div>
                          <FontAwesomeIcon icon={faChevronRight} className="text-[10px] text-white/15 group-hover:text-white/40 flex-shrink-0 transition-colors" />
                        </button>
                      ))}
                    </div>
                  )}
                  {showSaved && (
                    <div className="pt-3 pb-1">
                      <p className="px-5 text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Saved</p>
                      {saved.map((term) => (
                        <button key={term} type="button" onMouseDown={() => handleSelectSearch(term)}
                          className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.04] transition-colors duration-100 text-left">
                          <FontAwesomeIcon icon={faStar} className="text-gold/50 text-[10px] flex-shrink-0" />
                          <span className="text-white/70 text-sm truncate">{term}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {showRecent && (
                    <div className="pt-3 pb-2">
                      <p className="px-5 text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Recent</p>
                      {recent.map((term) => (
                        <button key={term} type="button" onMouseDown={() => handleSelectSearch(term)}
                          className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.04] transition-colors duration-100 text-left">
                          <FontAwesomeIcon icon={faClock} className="text-white/20 text-[10px] flex-shrink-0" />
                          <span className="text-white/60 text-sm truncate">{term}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {showHistory && (
                    <div className="pt-3 pb-2">
                      <p className="px-5 text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Recent Searches</p>
                      {filteredHistory.map((term) => (
                        <button key={term} type="button" onMouseDown={() => handleSelectSearch(term)}
                          className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.04] transition-colors duration-100 text-left">
                          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-white/20 text-[10px] flex-shrink-0" />
                          <span className="text-white/70 text-sm truncate">{term}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {q && (
                    <button type="button" onMouseDown={() => handleSearchSubmit(query)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 border-t border-white/[0.06] hover:bg-white/[0.04] transition-colors duration-100 text-left group">
                      <FontAwesomeIcon icon={faMagnifyingGlass} className="text-gold/40 text-[10px] flex-shrink-0 group-hover:text-gold/70 transition-colors" />
                      <span className="text-white/45 text-sm group-hover:text-white/70 transition-colors duration-100">
                        Search for <span className="text-gold/70 font-medium group-hover:text-gold">"{q}"</span>
                      </span>
                      <FontAwesomeIcon icon={faChevronRight} className="text-[10px] text-white/15 ml-auto flex-shrink-0 group-hover:text-white/35 transition-colors" />
                    </button>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Mobile quick-filter chips + Filters button */}
          <div className="md:hidden flex items-center gap-0 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto flex-1 pr-3" style={{ scrollbarWidth: "none" }}>
              {TYPE_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleTypeChange(value)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                    filterType === value
                      ? "bg-gold/15 border-gold/35 text-gold"
                      : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/60"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex-shrink-0 flex items-center pl-2">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className={`flex items-center gap-1.5 text-xs border rounded-full px-2.5 py-1.5 transition-all duration-150 ${
                  totalActiveFilters > 0
                    ? "text-gold border-gold/30 bg-gold/[0.07]"
                    : "text-white/30 border-white/[0.08] hover:text-white/60"
                }`}
              >
                <FontAwesomeIcon icon={faSliders} className="text-[10px]" />
                {totalActiveFilters > 0 ? totalActiveFilters : "Filters"}
              </button>
            </div>
          </div>

        </div>

        {/* Desktop divider */}
        <div className="xsm:hidden md:block h-px bg-white/[0.06] md:mb-6" />


        {/* ── 3-column layout ── */}
        <div className="grid xsm:grid-cols-1 md:grid-cols-[1fr_580px] lg:grid-cols-[1fr_600px_1fr] gap-6 items-start">

          {/* Left sidebar — filters; search history only shown on md (not lg) */}
          <aside className="xsm:hidden md:block lg:max-w-[260px] lg:ml-auto sticky top-[72px] -mt-[1px] self-start w-full">
            {/* Search history — md only (on lg it lives in the right sidebar) */}
            <div className="md:block lg:hidden">
              <div className="flex items-center gap-2 mb-3">
                <FontAwesomeIcon icon={faClock} className="text-white/30 text-xs" />
                <span className="text-white/40 text-[11px] font-semibold uppercase tracking-widest">Search History</span>
              </div>
              <SearchSidebar key={savedSearches.join(",")} onSelect={handleSelectSearch} lsRecentKey={lsRecentKey} lsSavedKey={lsSavedKey} />
              <div className="h-5" />
            </div>

            <div className="flex items-center gap-2 mb-3">
              <FontAwesomeIcon icon={faSliders} className="text-white/30 text-xs" />
              <span className="text-white/40 text-[11px] font-semibold uppercase tracking-widest">Filters</span>
            </div>
            <FilterSidebar {...filterProps} />
          </aside>

          {/* Main feed */}
          <div className="min-w-0 w-full">
            {!initialDone ? (
              <div className="flex justify-center py-24">
                <div className="w-6 h-6 rounded-full border-2 border-gold/60 border-t-transparent animate-spin" />
              </div>
            ) : fetchError && posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <p className="text-white/40 text-sm">Failed to load posts.</p>
                <button type="button" onClick={() => { setInitialDone(false); setHasMore(true); isFetching.current = false; fetchPosts(0); }} className="text-gold/70 text-xs hover:text-gold transition-colors duration-150">Try again</button>
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <p className="text-white/40 text-sm">No marketplace posts found.</p>
                {totalActiveFilters > 0 && (
                  <button type="button" onClick={handleClearAll} className="text-gold/70 text-xs hover:text-gold transition-colors duration-150">Clear filters</button>
                )}
              </div>
            ) : (
              <>
                {/* Section divider */}
                <div className="flex items-center gap-3 mb-3 xsm:px-4 md:px-0">
                  <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, rgba(230,184,0,0.25), rgba(230,184,0,0.05))" }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gold/45 flex-shrink-0">Listings</span>
                  <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, rgba(230,184,0,0.25), rgba(230,184,0,0.05))" }} />
                </div>

                {/* Mobile — 2-col compact grid */}
                <div className="md:hidden px-3 grid grid-cols-2 gap-3">
                  {posts.map((post) => <CompactPostCard key={post.id} post={post} />)}
                  {isLoading && (
                    <div className="col-span-2 flex justify-center py-6">
                      <div className="w-5 h-5 rounded-full border-2 border-gold/60 border-t-transparent animate-spin" />
                    </div>
                  )}
                  {hasMore && !isLoading && initialDone && (
                    <button type="button" className="col-span-2 py-4 text-gold/60 text-xs hover:text-gold transition-colors"
                      onClick={() => { isFetching.current = false; fetchPosts(Math.ceil(posts.length / PAGE_SIZE)); }}>
                      Load more
                    </button>
                  )}
                </div>

                {/* Desktop — virtualised full cards */}
                <div ref={listRef} className="xsm:hidden md:block" style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
                  {virtualItems.map((item) => {
                    const isLoader = item.index >= posts.length;
                    const post = posts[item.index];
                    const topBorder = !isLoader
                      ? post.postType === "BUY_SELL"
                        ? "2px solid rgba(230,184,0,0.35)"
                        : "2px solid rgba(16,129,152,0.4)"
                      : undefined;
                    return (
                      <div key={item.key} data-index={item.index} ref={virtualizer.measureElement}
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${item.start - virtualizer.options.scrollMargin}px)` }}>
                        {isLoader ? (
                          <div className="flex justify-center py-8">
                            {isLoading
                              ? <div className="w-5 h-5 rounded-full border-2 border-gold/60 border-t-transparent animate-spin" />
                              : fetchError ? <button type="button" onClick={() => { isFetching.current = false; fetchPosts(Math.ceil(posts.length / PAGE_SIZE)); }} className="text-gold/70 text-xs hover:text-gold transition-colors">Retry</button> : null}
                          </div>
                        ) : (
                          <div className="pb-3 rounded-2xl overflow-hidden" style={{ borderTop: topBorder }}>
                            <FeedPostCard post={post} index={item.index} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Right sidebar — search history (lg only) + buying guide */}
          <aside className="xsm:hidden lg:block lg:max-w-[260px] sticky top-[72px] -mt-[1px] self-start w-full">
            {/* Search history — lg only */}
            <div className="flex items-center gap-2 mb-3">
              <FontAwesomeIcon icon={faClock} className="text-white/30 text-xs" />
              <span className="text-white/40 text-[11px] font-semibold uppercase tracking-widest">Search History</span>
            </div>
            <SearchSidebar key={`right-${savedSearches.join(",")}`} onSelect={handleSelectSearch} lsRecentKey={lsRecentKey} lsSavedKey={lsSavedKey} />

            <div className="h-5" />

            {/* Buying guide */}
            <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0d1117]" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
              <div className="h-12 relative flex items-center px-4 gap-2.5 bg-gradient-to-r from-gold/15 via-gold/5 to-transparent">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(ellipse at 0% 50%, rgba(230,184,0,0.5) 0%, transparent 60%)" }} />
                <span className="relative text-base leading-none">🔪</span>
                <span className="relative text-white/50 text-[10px] font-bold uppercase tracking-widest">Buying Guide</span>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-white font-semibold text-sm">Looking to buy your first balisong?</h3>
                  <p className="text-white/40 text-xs leading-relaxed">Learn what to look for, how to set a budget, and which knives are best for beginners before you browse listings.</p>
                </div>
                <button onClick={() => navigate("/learn")} className="w-full py-2.5 rounded-xl bg-gold/10 border border-gold/25 text-gold text-xs font-semibold hover:bg-gold/20 hover:border-gold/50 transition-all duration-150">
                  Read the Buying Guide →
                </button>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </section>
  );
};

export default ProductWorldPage;
