import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAppSelector } from "../../redux/hooks";
import {
  faChevronLeft,
  faStar,
  faHeart,
  faImage,
  faPlay,
  faCrown,
  faGear,
  faScissors,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import { axiosApiInstance } from "../../api/axios";
import { CollectionKnife } from "../../modals/CollectionKnife";
import Image from "../Image";
import GalleryLightbox from "./GalleryLightbox";
import { AnimatePresence } from "motion/react";
import { formatCurrency, formatWeight, formatLength } from "../../utils/unitConversions";

const isFav = (val: any) => val === true || String(val) === "true";

const scoreBarStyle = (v: number): React.CSSProperties => {
  if (v >= 8) return {
    background: "linear-gradient(to right, #86efac, #22c55e)",
    boxShadow: "0 0 6px 1px rgba(34,197,94,0.3)",
  };
  if (v >= 5) return {
    background: "linear-gradient(to right, #fde68a, #e6b800)",
    boxShadow: "0 0 6px 1px rgba(230,184,0,0.3)",
  };
  return {
    background: "linear-gradient(to right, #fca5a5, #b91c1c)",
    boxShadow: "0 0 6px 1px rgba(185,28,28,0.3)",
  };
};

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => {
  const display =
    value &&
    String(value) !== "UNKNOWN" &&
    String(value) !== "Unknown" &&
    String(value) !== "null" &&
    String(value) !== "0"
      ? String(value).replace(/_/g, " ")
      : null;
  return (
    <div className="flex flex-col gap-0.5 py-3 min-w-0">
      <span className="text-[10px] text-white/30 uppercase tracking-widest font-medium">
        {label}
      </span>
      <span className="text-white/80 text-sm font-medium break-words">
        {display ?? <span className="text-white/25 italic text-xs">—</span>}
      </span>
    </div>
  );
};

const ScoreCard = ({ label, value }: { label: string; value: number }) => (
  <div className="flex-1 bg-[#13161d] border border-white/8 rounded-xl px-3 py-3 flex flex-col items-center gap-2 min-w-0">
    <span className="text-[11px] text-white/35 uppercase tracking-widest font-medium text-center">
      {label}
    </span>
    <span className="leading-none">
      <span className="font-bold text-2xl text-white">{value}</span>
      <span className="text-white/30 text-sm font-normal">/10</span>
    </span>
    <div className="w-full h-1.5 bg-white/8 rounded-full">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${(value / 10) * 100}%`, ...scoreBarStyle(value) }}
      />
    </div>
  </div>
);

const CollectionKnifeDisplay = () => {
  const { account, identifier, knife } = useParams();
  const navigate = useNavigate();
  const viewerCurrency        = useAppSelector((state) => state.auth.user?.currency);
  const viewerMeasurementUnit = useAppSelector((state) => state.auth.user?.measurementUnit);

  const [collectionKnife, setCollectionKnife] = useState<CollectionKnife | null>(null);
  const [featuredKnifeId, setFeaturedKnifeId] = useState<string | null>(null);
  const [pageState, setPageState] = useState<"loading" | "error" | "success">("loading");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!account || !identifier || !knife) {
      setPageState("error");
      return;
    }
    axiosApiInstance
      .get(`/collection/any/handle`, { params: { displayName: account, identifierCode: identifier } })
      .then((res) => {
        const knives: CollectionKnife[] = res.data?.collection?.collectedKnives ?? [];
        const found = knives.find((k) => k.displayName === knife) ?? null;
        setFeaturedKnifeId(res.data?.collection?.featuredKnifeId ?? null);
        setCollectionKnife(found);
        setPageState(found ? "success" : "error");
      })
      .catch(() => setPageState("error"));
  }, [account, identifier, knife]);

  if (pageState === "loading") {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (pageState === "error" || !collectionKnife) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-white/40 text-sm">Knife not found.</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors duration-200 text-sm font-medium"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
          Go back
        </button>
      </div>
    );
  }

  const k = collectionKnife;
  const isFeatured = !!featuredKnifeId && String(k.id) === String(featuredKnifeId);

  const knifeTypeLabel: Record<string, string> = {
    liveblade: "Live Blade",
    trainer:   "Trainer",
    both:      "Live/Trainer",
  };

  const scores = [
    { label: "Quality",    value: k.qualityScore    },
    { label: "Flipping",   value: k.flippingScore   },
    { label: "Feel",       value: k.feelScore       },
    { label: "Sound",      value: k.soundScore      },
    { label: "Durability", value: k.durabilityScore },
  ];

  return (
    <section className="lg:pl-[192px] w-full min-h-screen bg-[#080a0e] pb-36">

      {/* ── Back button ── */}
      <div className="px-6 pt-6 pb-2 max-w-5xl mx-auto">
        <button
          type="button"
          onClick={() => navigate(`/${account}/${identifier}/collection`)}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors duration-200 text-sm font-medium"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
          Back to Collection
        </button>
      </div>

      <div className="px-6 flex flex-col gap-6 max-w-5xl mx-auto">

        {/* ── Hero ── */}
        <div className="flex xsm:flex-col md:flex-row gap-6 xsm:items-stretch md:items-start">

          {/* Cover photo */}
          <div className="xsm:w-full md:w-[420px] md:flex-shrink-0 xsm:aspect-[3/2] md:aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 bg-[#13161d]">
            {k.coverPhoto && k.coverPhoto !== "" ? (
              <Image imageId={k.coverPhoto} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FontAwesomeIcon icon={faImage} className="text-white/15 text-5xl" />
              </div>
            )}
          </div>

          {/* Key info */}
          <div className="flex-1 flex flex-col gap-4">

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {isFeatured && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-gold bg-gold/10 border border-gold/30 px-2.5 py-1 rounded-full">
                  <FontAwesomeIcon icon={faCrown} className="text-[10px]" />
                  Featured
                </span>
              )}
              {isFav(k.favoriteKnife) && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-gold bg-gold/10 border border-gold/25 px-2.5 py-1 rounded-full">
                  <FontAwesomeIcon icon={faStar} className="text-[10px]" />
                  Favorite Knife
                </span>
              )}
              {isFav(k.favoriteFlipper) && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-primary bg-blue-primary/10 border border-blue-primary/25 px-2.5 py-1 rounded-full">
                  <FontAwesomeIcon icon={faHeart} className="text-[10px]" />
                  Favorite Flipper
                </span>
              )}
              {k.knifeType && (
                <span className="text-xs text-white/50 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                  {knifeTypeLabel[k.knifeType.toLowerCase().replace(/_/g, "")] ?? k.knifeType}
                </span>
              )}
            </div>

            {/* Name */}
            <div>
              <h1 className="text-white font-bold text-3xl leading-tight">{k.displayName}</h1>
              <p className="text-white/45 text-base mt-1">
                {k.knifeMaker}
                {k.baseKnifeModel ? ` · ${k.baseKnifeModel}` : ""}
              </p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#13161d] border border-white/8 rounded-xl px-4 py-3">
                <DetailRow label="Acquired" value={
                  k.aqquiredDate
                    ? (() => {
                        const d = new Date(k.aqquiredDate + "T00:00:00");
                        return isNaN(d.getTime())
                          ? k.aqquiredDate
                          : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                      })()
                    : ""
                } />
              </div>
              <div className="bg-[#13161d] border border-white/8 rounded-xl px-4 py-3">
                <DetailRow label="MSRP" value={formatCurrency(k.msrp, viewerCurrency) || null} />
              </div>
              <div className="bg-[#13161d] border border-white/8 rounded-xl px-4 py-3">
                <DetailRow label="Weight" value={formatWeight(k.weight, viewerMeasurementUnit) || null} />
              </div>
              <div className="bg-[#13161d] border border-white/8 rounded-xl px-4 py-3">
                <DetailRow label="Overall Length" value={formatLength(k.overallLength, viewerMeasurementUnit) || null} />
              </div>
            </div>

            {/* Average score */}
            {k.averageScore !== null && k.averageScore !== undefined && (
              <div className="bg-[#13161d] border border-white/8 rounded-xl px-5 py-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest font-medium">
                    Average Score
                  </span>
                  <p className="leading-none mt-1">
                    <span className="text-white font-bold text-4xl">{Number(k.averageScore).toFixed(1)}</span>
                    <span className="text-white/30 text-lg font-normal">/10</span>
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full border-2 border-blue-primary/40 flex items-center justify-center">
                  <FontAwesomeIcon icon={faStar} className="text-blue-primary text-xl" />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── Balance display ── */}
        {!k.hasModularBalance && k.balanceValue !== null && k.balanceValue !== undefined && String(k.balanceValue) !== "null" && (() => {
          const balanceLabels = [
            "Heavy Blade", "Blade Bias", "Mod. Blade", "Neutral",
            "Mod. Handle", "Handle Bias", "Heavy Handle",
          ];
          const activeIdx = Number(k.balanceValue);
          const pct = (activeIdx / 6) * 100;
          return (
            <div className="bg-[#13161d] border border-white/8 rounded-2xl px-5 py-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-medium">
                  Balance Point
                </span>
                <span className="text-xs font-semibold text-blue-primary">
                  {balanceLabels[activeIdx] ?? ""}
                </span>
              </div>
              <div className="relative px-2" style={{ paddingTop: "10px", paddingBottom: "10px" }}>
                <div className="relative h-2 rounded-full bg-white/8">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{ width: `${pct}%`, background: "linear-gradient(to right, #7c3aed, #108198)" }}
                  />
                </div>
                <div
                  className="absolute w-5 h-5 rounded-full bg-blue-primary border-2 border-[#13161d]"
                  style={{
                    top: "50%",
                    transform: "translateY(-50%)",
                    left: `calc(${pct}% - ${(pct * 20 / 100).toFixed(2)}px)`,
                    boxShadow: "0 0 12px 3px rgba(16,129,152,0.65)",
                  }}
                />
              </div>
              <div className="flex justify-between px-2 -mt-2">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className={`w-px rounded-full transition-all duration-300 ${
                      i === activeIdx
                        ? "h-2.5 bg-blue-primary"
                        : i < activeIdx
                        ? "h-1.5 bg-white/30"
                        : "h-1.5 bg-white/15"
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-white/25 px-0.5 -mt-1">
                <span>Blade</span>
                <span>Neutral</span>
                <span>Handle</span>
              </div>
            </div>
          );
        })()}
        {k.hasModularBalance && (
          <div className="bg-[#13161d] border border-white/8 rounded-2xl px-5 py-4">
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Balance</span>
            <p className="text-white/80 text-sm font-medium mt-0.5">Modular Balance System</p>
          </div>
        )}

        {/* ── Score breakdown ── */}
        <div>
          <h2 className="text-white font-semibold text-sm mb-3">
            Score Breakdown
          </h2>
          <div className="flex gap-3">
            {scores.map((s) => (
              <ScoreCard key={s.label} label={s.label} value={s.value} />
            ))}
          </div>
        </div>

        {/* ── Details ── */}
        <div className="grid xsm:grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Hardware */}
          <div className="bg-[#13161d] border border-white/8 rounded-2xl px-5 pt-4 pb-4 flex flex-col">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/8">
              <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "rgba(16,129,152,0.15)" }}>
                <FontAwesomeIcon icon={faGear} className="text-blue-primary text-[10px]" />
              </div>
              <h3 className="text-white font-semibold text-sm">Hardware</h3>
            </div>
            <div className="divide-y divide-white/[0.05]">
              <DetailRow label="Pivot System" value={k.pivotSystem} />
              <DetailRow label="Pin System"   value={k.pinSystem}   />
              <DetailRow label="Latch Type"   value={k.latchType}   />
            </div>
          </div>

          {/* Blade */}
          <div className="bg-[#13161d] border border-white/8 rounded-2xl px-5 pt-4 pb-4 flex flex-col">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/8">
              <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "rgba(230,184,0,0.12)" }}>
                <FontAwesomeIcon icon={faScissors} className="text-gold text-[10px]" />
              </div>
              <h3 className="text-white font-semibold text-sm">Blade</h3>
            </div>
            <div className="divide-y divide-white/[0.05]">
              <DetailRow label="Style"    value={k.bladeStyle}    />
              <DetailRow label="Finish"   value={k.bladeFinish}   />
              <DetailRow label="Material" value={k.bladeMaterial} />
            </div>
          </div>

          {/* Handle */}
          <div className="bg-[#13161d] border border-white/8 rounded-2xl px-5 pt-4 pb-4 flex flex-col">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/8">
              <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "rgba(34,197,94,0.1)" }}>
                <FontAwesomeIcon icon={faLayerGroup} className="text-green text-[10px]" />
              </div>
              <h3 className="text-white font-semibold text-sm">Handle</h3>
            </div>
            <div className="divide-y divide-white/[0.05]">
              <DetailRow label="Construction" value={k.handleConstruction} />
              <DetailRow label="Material"     value={k.handleMaterial}     />
              <DetailRow label="Finish"       value={k.handleFinish}       />
            </div>
          </div>

        </div>

        {/* ── Gallery ── */}
        <div>
          <h2 className="text-white font-semibold text-sm mb-3">
            Gallery
          </h2>
          {k.galleryFiles && k.galleryFiles.length > 0 ? (
            <div className="grid xsm:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {k.galleryFiles.map((file, i) => {
                const isVid = /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(file.fileId);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    className="relative aspect-square rounded-lg overflow-hidden border border-white/8 bg-[#13161d] cursor-pointer group"
                  >
                    {isVid ? (
                      <video src={file.fileId} className="w-full h-full object-cover" muted playsInline />
                    ) : (
                      <img src={file.fileId} alt={`gallery ${i + 1}`} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-150" />
                    {isVid && (
                      <div className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/65 backdrop-blur-sm flex items-center justify-center">
                        <FontAwesomeIcon icon={faPlay} className="text-white text-[11px] ml-px" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#13161d] border border-dashed border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center gap-3 text-center">
              <FontAwesomeIcon icon={faImage} className="text-white/15 text-4xl" />
              <p className="text-white/25 text-sm">No gallery items yet.</p>
            </div>
          )}
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {lightboxIndex !== null && k.galleryFiles && (
            <GalleryLightbox
              items={k.galleryFiles}
              index={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
              onNavigate={setLightboxIndex}
            />
          )}
        </AnimatePresence>

      </div>
    </section>
  );
};

export default CollectionKnifeDisplay;
