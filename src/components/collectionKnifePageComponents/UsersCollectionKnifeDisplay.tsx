import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { CollectionKnife } from "../../modals/CollectionKnife";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faStar,
  faHeart,
  faImage,
  faCrown,
  faPencil,
  faXmark,
  faCheck,
  faTrash,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import Image from "../Image";
import { axiosApiInstanceAuth } from "../../api/axios";
import { setCollection, updateCollectionKnife, removeCollectionKnife } from "../../redux/collection/collectionSlice";
import { mapCollection, mapCollectionKnife } from "../../redux/collection/collectionActions";
import { formatCurrency, formatWeight, formatLength } from "../../utils/unitConversions";

// Input components
import KnifeMakerInput from "../input/KnifeMakerInput";
import BaseKnifeModelInput from "../input/BaseKnifeModelInput";
import KnifeTypeInput from "../input/KnifeTypeInput";
import AqquiredDateInput from "../input/AqquiredDateInput";
import KnifeMSRPInput from "../input/KnifeMSRPInput";
import KnifeWeightInput from "../input/KnifeWeightInput";
import OverallKnifeLengthInput from "../input/OverallKnifeLengthInput";
import FavoriteKnifeInput from "../input/FavoriteKnifeInput";
import FavoriteFlipperInput from "../input/FavoriteFlipperInput";
import PivotSystemInput from "../input/PivotSystemInput";
import LatchTypeInput from "../input/LatchTypeInput";
import PinSystemInput from "../input/PinSystemInput";
import BladeStyleInput from "../input/BladeStyleInput";
import BladeFinishInput from "../input/BladeFinishInput";
import BladeMaterialInput from "../input/BladeMaterialInput";
import HandleConstructionInput from "../input/HandleConstructionInput";
import HandleMaterialInput from "../input/HandleMaterialInput";
import HandleFinishInput from "../input/HandleFinishInput";
import KnifeBalanceInput from "../input/KnifeBalanceInput";

// ── Helpers ──────────────────────────────────────────────────────────────────

const isFav = (val: any) => val === true || String(val) === "true";

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
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-white/30 uppercase tracking-widest font-medium">
        {label}
      </span>
      <span className="text-white/80 text-sm font-medium">
        {display ?? <span className="text-white/25 italic text-xs">—</span>}
      </span>
    </div>
  );
};

const ScoreCard = ({ label, value }: { label: string; value: number }) => (
  <div className="flex-1 bg-[#13161d] border border-white/8 rounded-xl px-3 py-3 flex flex-col items-center gap-2 min-w-0">
    <span className="text-[10px] text-white/35 uppercase tracking-widest font-medium text-center">
      {label}
    </span>
    <span className="leading-none">
      <span className="text-white font-bold text-2xl">{value}</span>
      <span className="text-white/30 text-sm font-normal">/10</span>
    </span>
    <div className="w-full h-1 bg-white/8 rounded-full overflow-hidden">
      <div
        className="h-full bg-blue-primary rounded-full transition-all duration-500"
        style={{ width: `${(value / 10) * 100}%` }}
      />
    </div>
  </div>
);

const ScoreSliderEdit = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) => {
  const pct = (value / 10) * 100;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs text-white/50 font-medium uppercase tracking-wide">
          {label}
        </label>
        <span className="text-sm font-bold text-blue-primary">
          {value}
          <span className="text-white/30 font-normal">/10</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-white/25 w-6 text-right flex-shrink-0">0</span>
        <input
          type="range"
          min={0}
          max={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full cursor-pointer appearance-none h-1.5 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-primary [&::-moz-range-thumb]:cursor-pointer"
          style={{
            background: `linear-gradient(to right, #108198 0%, #108198 ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`,
            transition: "background 0.15s ease",
          }}
        />
        <span className="text-[10px] text-white/25 w-6 flex-shrink-0">10</span>
      </div>
    </div>
  );
};

// ── Edit State ────────────────────────────────────────────────────────────────

interface EditState {
  displayName: string;
  knifeMaker: string;
  baseKnifeModel: string;
  knifeType: string;
  isFavoriteKnife: boolean;
  isFavoriteFlipper: boolean;
  aqquiredDate: string;
  knifeMSRP: string;
  overallLength: string;
  weight: string;
  pivotSystem: string;
  latchType: string;
  pinSystem: string;
  hasModularBalance: boolean;
  balanceValue: number | null;
  bladeStyle: string;
  bladeFinish: string;
  bladeMaterial: string;
  handleConstruction: string;
  handleMaterial: string;
  handleFinish: string;
  qualityScore: number;
  flippingScore: number;
  feelScore: number;
  soundScore: number;
  durabilityScore: number;
}

const initEditState = (k: CollectionKnife): EditState => ({
  displayName:        k.displayName       ?? "",
  knifeMaker:         k.knifeMaker        ?? "",
  baseKnifeModel:     k.baseKnifeModel    ?? "",
  knifeType:          k.knifeType?.toLowerCase().replace(/_/g, "") ?? "liveblade",
  isFavoriteKnife:    isFav(k.favoriteKnife),
  isFavoriteFlipper:  isFav(k.favoriteFlipper),
  aqquiredDate:       k.aqquiredDate      ?? "",
  knifeMSRP:          k.msrp              ? String(k.msrp) : "",
  overallLength:      k.overallLength     ? String(k.overallLength) : "",
  weight:             k.weight            ? String(k.weight) : "",
  pivotSystem:        k.pivotSystem       ?? "Unknown",
  latchType:          k.latchType         ?? "Unknown",
  pinSystem:          k.pinSystem         ?? "Unknown",
  hasModularBalance:  k.hasModularBalance ?? false,
  balanceValue:       k.balanceValue !== null && k.balanceValue !== undefined
                        ? Number(k.balanceValue)
                        : null,
  bladeStyle:         k.bladeStyle         ?? "Unknown",
  bladeFinish:        k.bladeFinish        ?? "Unknown",
  bladeMaterial:      k.bladeMaterial      ?? "Unknown",
  handleConstruction: k.handleConstruction ?? "Unknown",
  handleMaterial:     k.handleMaterial     ?? "Unknown",
  handleFinish:       k.handleFinish       ?? "Unknown",
  qualityScore:       k.qualityScore       ?? 5,
  flippingScore:      k.flippingScore      ?? 5,
  feelScore:          k.feelScore          ?? 5,
  soundScore:         k.soundScore         ?? 5,
  durabilityScore:    k.durabilityScore    ?? 5,
});

// ── Main Component ────────────────────────────────────────────────────────────

const UsersCollectionKnifeDisplay = () => {
  const [collectionKnife, setCollectionKnife] = useState<CollectionKnife | null>(null);
  const [pageState, setPageState]             = useState<"loading" | "error" | "success">("loading");
  const [featuredLoading, setFeaturedLoading] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [isSaving, setIsSaving]   = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting]               = useState(false);

  const { knife } = useParams();
  const navigate  = useNavigate();
  const dispatch  = useAppDispatch();
  const user             = useAppSelector((state) => state.auth.user);
  const collectionKnives = useAppSelector((state) => state.collection.collectionKnives);
  const collectionData   = useAppSelector((state) => state.collection.collection);

  useEffect(() => {
    const found = collectionKnives.find((k) => k.displayName === knife) ?? null;
    setCollectionKnife(found);
    setPageState(found ? "success" : "error");
  }, []);

  const isFeatured =
    !!collectionKnife &&
    !!collectionData?.featuredKnifeId &&
    String(collectionKnife.id) === String(collectionData.featuredKnifeId);

  // Live average score preview during editing
  const previewAverage = useMemo(() => {
    if (!editState) return null;
    return (
      (editState.qualityScore +
        editState.flippingScore +
        editState.feelScore +
        editState.soundScore +
        editState.durabilityScore) /
      5
    );
  }, [
    editState?.qualityScore,
    editState?.flippingScore,
    editState?.feelScore,
    editState?.soundScore,
    editState?.durabilityScore,
  ]);

  // Duplicate name check (exclude the current knife itself)
  const isDuplicateName = useMemo(() => {
    if (!editState || !collectionKnife) return false;
    return collectionKnives.some(
      (kn) =>
        String(kn.id) !== String(collectionKnife.id) &&
        kn.displayName === editState.displayName
    );
  }, [editState?.displayName, collectionKnives, collectionKnife]);

  const setField = <K extends keyof EditState>(key: K, value: EditState[K]) =>
    setEditState((prev) => (prev ? { ...prev, [key]: value } : prev));

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleEnterEdit = () => {
    if (!collectionKnife) return;
    setEditState(initEditState(collectionKnife));
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditState(null);
    setSaveError(null);
    setShowDeleteConfirm(false);
  };

  const handleSave = async () => {
    if (!editState || !collectionKnife?.id || isSaving || isDuplicateName) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await axiosApiInstanceAuth.put(
        `/collection/me/update-knife/${collectionKnife.id}`,
        editState
      );
      const mapped = mapCollectionKnife(res.data);
      dispatch(updateCollectionKnife(mapped));
      setCollectionKnife(mapped);
      setIsEditing(false);
      setEditState(null);
      // If display name changed, update the URL
      if (mapped.displayName !== collectionKnife.displayName) {
        navigate(
          `/${user?.displayName}/${user?.identifierCode}/collection/${mapped.displayName}`,
          { replace: true }
        );
      }
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setSaveError("That display name is already taken.");
      } else {
        setSaveError("Failed to save. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!collectionKnife?.id || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await axiosApiInstanceAuth.delete(`/collection/me/remove-knife/${collectionKnife.id}`);
      dispatch(removeCollectionKnife(String(collectionKnife.id)));
      navigate(`/${user?.displayName}/${user?.identifierCode}/collection`, { replace: true });
    } catch (err: any) {
      setDeleteError(
        err?.response?.status === 409
          ? "This knife doesn't belong to your collection."
          : "Something went wrong. Please try again."
      );
      setIsDeleting(false);
    }
  };

  const handleToggleFeatured = async () => {
    if (!collectionKnife?.id || featuredLoading) return;
    setFeaturedLoading(true);
    const url = isFeatured
      ? "/collection/me/clear-featured-knife"
      : `/collection/me/set-featured-knife/${collectionKnife.id}`;
    await axiosApiInstanceAuth
      .request({ url, method: "post" })
      .then((res) => dispatch(setCollection(mapCollection(res.data))))
      .finally(() => setFeaturedLoading(false));
  };

  // ── Loading / Error ────────────────────────────────────────────────────────

  const k = collectionKnife;

  if (pageState === "loading") {
    return (
      <div className="w-full h-screen flex items-center justify-center text-white/40">
        Loading…
      </div>
    );
  }

  if (pageState === "error" || !k) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-white/40">
        Knife not found.
      </div>
    );
  }

  const knifeTypeLabel: Record<string, string> = {
    liveblade: "Live Blade",
    trainer:   "Trainer",
    both:      "Both",
  };

  // ── VIEW MODE ──────────────────────────────────────────────────────────────

  if (!isEditing) {
    const scores = [
      { label: "Quality",    value: k.qualityScore    },
      { label: "Flipping",   value: k.flippingScore   },
      { label: "Feel",       value: k.feelScore       },
      { label: "Sound",      value: k.soundScore      },
      { label: "Durability", value: k.durabilityScore },
    ];

    return (
      <section className="lg:pl-[192px] w-full min-h-screen bg-[#080a0e] pb-36">

        {/* ── Back + Edit button ── */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              navigate(`/${user?.displayName}/${user?.identifierCode}/collection`)
            }
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors duration-200 text-sm font-medium"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
            Back to Collection
          </button>
          <button
            type="button"
            onClick={handleEnterEdit}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
          >
            <FontAwesomeIcon icon={faPencil} className="text-xs" />
            Edit
          </button>
        </div>

        <div className="px-6 flex flex-col gap-6">

          {/* ── Hero ── */}
          <div className="flex xsm:flex-col md:flex-row gap-6 items-start">

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

              {/* Quick stats grid */}
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
                  <DetailRow
                    label="MSRP"
                    value={formatCurrency(k.msrp, user?.currency) || null}
                  />
                </div>
                <div className="bg-[#13161d] border border-white/8 rounded-xl px-4 py-3">
                  <DetailRow
                    label="Weight"
                    value={formatWeight(k.weight, user?.measurementUnit) || null}
                  />
                </div>
                <div className="bg-[#13161d] border border-white/8 rounded-xl px-4 py-3">
                  <DetailRow
                    label="Overall Length"
                    value={formatLength(k.overallLength, user?.measurementUnit) || null}
                  />
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

              {/* Set / remove featured */}
              <button
                type="button"
                onClick={handleToggleFeatured}
                disabled={featuredLoading}
                className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                  isFeatured
                    ? "bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20"
                    : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80"
                }`}
              >
                <FontAwesomeIcon icon={faCrown} className="text-xs" />
                {featuredLoading
                  ? "Saving..."
                  : isFeatured
                  ? "Remove as Featured"
                  : "Set as Featured"}
              </button>

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
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/30 uppercase tracking-widest font-medium">
                    Balance Point
                  </span>
                  <span className="text-xs font-semibold text-blue-primary">
                    {balanceLabels[activeIdx] ?? ""}
                  </span>
                </div>

                {/* Track + thumb */}
                <div className="relative px-2" style={{ paddingTop: "10px", paddingBottom: "10px" }}>
                  {/* Track background */}
                  <div className="relative h-2 rounded-full bg-white/8">
                    {/* Gradient fill */}
                    <div
                      className="absolute left-0 top-0 h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: "linear-gradient(to right, #7c3aed, #108198)",
                      }}
                    />
                  </div>
                  {/* Thumb */}
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

                {/* Tick marks at each of the 7 positions */}
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

                {/* Anchor labels */}
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
            <h2 className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">
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
            <div className="bg-[#13161d] border border-white/8 rounded-2xl p-5 flex flex-col gap-4">
              <h3 className="text-white font-semibold text-sm border-b border-white/8 pb-2">
                Hardware
              </h3>
              <DetailRow label="Pivot System" value={k.pivotSystem} />
              <DetailRow label="Pin System"   value={k.pinSystem}   />
              <DetailRow label="Latch Type"   value={k.latchType}   />
            </div>

            {/* Blade */}
            <div className="bg-[#13161d] border border-white/8 rounded-2xl p-5 flex flex-col gap-4">
              <h3 className="text-white font-semibold text-sm border-b border-white/8 pb-2">
                Blade
              </h3>
              <DetailRow label="Blade Style"    value={k.bladeStyle}    />
              <DetailRow label="Blade Finish"   value={k.bladeFinish}   />
              <DetailRow label="Blade Material" value={k.bladeMaterial} />
            </div>

            {/* Handle */}
            <div className="bg-[#13161d] border border-white/8 rounded-2xl p-5 flex flex-col gap-4">
              <h3 className="text-white font-semibold text-sm border-b border-white/8 pb-2">
                Handle
              </h3>
              <DetailRow label="Construction" value={k.handleConstruction} />
              <DetailRow label="Material"     value={k.handleMaterial}     />
              <DetailRow label="Finish"       value={k.handleFinish}       />
            </div>

          </div>

          {/* ── Gallery ── */}
          <div>
            <h2 className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">
              Gallery
            </h2>
            {k.galleryFiles && k.galleryFiles.length > 0 ? (
              <div className="grid xsm:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {k.galleryFiles.map((file, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg overflow-hidden border border-white/8 bg-[#13161d]"
                  >
                    <img src={file.fileId} alt={`gallery ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#13161d] border border-dashed border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center gap-3 text-center">
                <FontAwesomeIcon icon={faImage} className="text-white/15 text-4xl" />
                <p className="text-white/25 text-sm">No gallery items yet.</p>
              </div>
            )}
          </div>

        </div>
      </section>
    );
  }

  // ── EDIT MODE ──────────────────────────────────────────────────────────────

  if (!editState) return null;

  return (
    <section className="lg:pl-[192px] w-full min-h-screen bg-[#080a0e] pb-36">

      {/* ── Edit controls bar ── */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleCancelEdit}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors duration-200 text-sm font-medium"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
          Back to Collection
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCancelEdit}
            disabled={isSaving}
            className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 disabled:opacity-40"
          >
            <FontAwesomeIcon icon={faXmark} className="text-xs" />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isDuplicateName || !editState.displayName.trim()}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-blue-primary text-white hover:bg-blue-primary/80 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon icon={faCheck} className="text-xs" />
            {isSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* ── Editing label ── */}
      <div className="px-6 pb-4">
        <span className="text-xs text-blue-primary font-medium uppercase tracking-widest">
          Editing — {k.displayName}
        </span>
      </div>

      <div className="px-6 flex flex-col gap-5">

        {/* ── Cover photo — click to navigate to cover config ── */}
        <div className="flex xsm:flex-col md:flex-row gap-4 items-start">
          <button
            type="button"
            onClick={() => navigate(`/configure/collection-knife-cover/${k.id}`)}
            className="xsm:w-full md:w-48 md:flex-shrink-0 xsm:aspect-[3/2] md:aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 bg-[#13161d] relative group cursor-pointer"
          >
            {k.coverPhoto && k.coverPhoto !== "" ? (
              <Image imageId={k.coverPhoto} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FontAwesomeIcon icon={faImage} className="text-white/15 text-4xl" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
              <FontAwesomeIcon icon={faImage} className="text-white text-2xl" />
              <span className="text-white text-xs font-semibold">Change Cover Photo</span>
            </div>
          </button>

          {/* Favorites + knife type (quick toggles) */}
          <div className="flex-1 flex flex-col gap-3">
            <KnifeTypeInput
              parentKnifeType={editState.knifeType}
              setKnifeTypeOnChange={(v: string) => setField("knifeType", v)}
            />
            <FavoriteKnifeInput
              parentIsFavoriteKnife={editState.isFavoriteKnife}
              setIsFavoriteKnifeOnChange={() =>
                setField("isFavoriteKnife", !editState.isFavoriteKnife)
              }
            />
            <FavoriteFlipperInput
              parentIsFavoriteFlipper={editState.isFavoriteFlipper}
              setIsFavoriteFlipperOnChange={() =>
                setField("isFavoriteFlipper", !editState.isFavoriteFlipper)
              }
            />
          </div>
        </div>

        {/* ── Identity ── */}
        <div className="bg-[#13161d] border border-white/8 rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="text-white font-semibold text-sm border-b border-white/8 pb-2">
            Identity
          </h3>

          {/* Display Name — custom to handle duplicate exclusion for current knife */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <label className="text-xs text-white/50 font-medium uppercase tracking-wide">
                Display Name
              </label>
              {isDuplicateName && (
                <span className="text-xs text-red font-medium">Name already in use</span>
              )}
            </div>
            <input
              type="text"
              value={editState.displayName}
              onChange={(e) => setField("displayName", e.target.value)}
              placeholder="e.g. My Benchmade 51"
              className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-white text-sm outline-none transition-colors duration-200 placeholder:text-white/20 ${
                isDuplicateName
                  ? "border-red/50 focus:border-red/70"
                  : "border-white/10 focus:border-blue-primary/50"
              }`}
            />
          </div>

          <div className="grid xsm:grid-cols-1 sm:grid-cols-2 gap-4">
            <KnifeMakerInput
              parentKnifeMaker={editState.knifeMaker}
              setKnifeMakerOnChange={(v: string) => setField("knifeMaker", v)}
            />
            <BaseKnifeModelInput
              parentBaseKnifeModel={editState.baseKnifeModel}
              setBaseKnifeModelOnChange={(v: string) => setField("baseKnifeModel", v)}
            />
          </div>
        </div>

        {/* ── Details ── */}
        <div className="bg-[#13161d] border border-white/8 rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="text-white font-semibold text-sm border-b border-white/8 pb-2">
            Details
          </h3>
          <div className="grid xsm:grid-cols-1 sm:grid-cols-2 gap-4">
            <AqquiredDateInput
              parentAqquiredDate={editState.aqquiredDate}
              setAqquiredDateOnChange={(v: string) => setField("aqquiredDate", v)}
            />
            <KnifeMSRPInput
              parentMSRP={editState.knifeMSRP}
              setKnifeMSRPOnChange={(v: string) => setField("knifeMSRP", v)}
            />
            <KnifeWeightInput
              parentWeight={editState.weight}
              setKnifeWeightOnChange={(v: string) => setField("weight", v)}
            />
            <OverallKnifeLengthInput
              parentKnifeLength={editState.overallLength}
              setOverallLengthOnChange={(v: string) => setField("overallLength", v)}
            />
          </div>
        </div>

        {/* ── Scores ── */}
        <div className="bg-[#13161d] border border-white/8 rounded-2xl p-5 flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-white/8 pb-2">
            <h3 className="text-white font-semibold text-sm">Scores</h3>
            {previewAverage !== null && (
              <span className="text-sm font-bold text-blue-primary">
                {previewAverage.toFixed(1)}
                <span className="text-white/30 font-normal text-xs"> avg</span>
              </span>
            )}
          </div>
          <ScoreSliderEdit
            label="Quality"
            value={editState.qualityScore}
            onChange={(v) => setField("qualityScore", v)}
          />
          <ScoreSliderEdit
            label="Flipping"
            value={editState.flippingScore}
            onChange={(v) => setField("flippingScore", v)}
          />
          <ScoreSliderEdit
            label="Feel"
            value={editState.feelScore}
            onChange={(v) => setField("feelScore", v)}
          />
          <ScoreSliderEdit
            label="Sound"
            value={editState.soundScore}
            onChange={(v) => setField("soundScore", v)}
          />
          <ScoreSliderEdit
            label="Durability"
            value={editState.durabilityScore}
            onChange={(v) => setField("durabilityScore", v)}
          />
        </div>

        {/* ── Hardware specs ── */}
        <div className="bg-[#13161d] border border-white/8 rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="text-white font-semibold text-sm border-b border-white/8 pb-2">
            Hardware
          </h3>
          <div className="grid xsm:grid-cols-1 sm:grid-cols-3 gap-4">
            <PivotSystemInput
              parentPivotSystem={editState.pivotSystem}
              setPivotSystemOnChange={(v: string) => setField("pivotSystem", v)}
            />
            <LatchTypeInput
              parentLatchType={editState.latchType}
              setLatchTypeOnChange={(v: string) => setField("latchType", v)}
            />
            <PinSystemInput
              parentPinSystem={editState.pinSystem}
              setPinSystemOnChange={(v: string) => setField("pinSystem", v)}
            />
          </div>
          <KnifeBalanceInput
            parentBalanceValue={editState.balanceValue}
            parentHasModulatedBalance={editState.hasModularBalance}
            setBalanceOnChange={(v: any) =>
              setField("balanceValue", v !== null ? Number(v) : null)
            }
            setHasModulatedBalanceOnChange={(v: boolean) =>
              setField("hasModularBalance", v)
            }
          />
        </div>

        {/* ── Blade specs ── */}
        <div className="bg-[#13161d] border border-white/8 rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="text-white font-semibold text-sm border-b border-white/8 pb-2">
            Blade
          </h3>
          <div className="grid xsm:grid-cols-1 sm:grid-cols-3 gap-4">
            <BladeStyleInput
              parentBladeStyle={editState.bladeStyle}
              setBladeStyleOnChange={(v: string) => setField("bladeStyle", v)}
            />
            <BladeFinishInput
              parentBladeFinish={editState.bladeFinish}
              setBladeFinishOnChange={(v: string) => setField("bladeFinish", v)}
            />
            <BladeMaterialInput
              parentBladeMaterial={editState.bladeMaterial}
              setBladeMaterialOnChange={(v: string) => setField("bladeMaterial", v)}
            />
          </div>
        </div>

        {/* ── Handle specs ── */}
        <div className="bg-[#13161d] border border-white/8 rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="text-white font-semibold text-sm border-b border-white/8 pb-2">
            Handle
          </h3>
          <div className="grid xsm:grid-cols-1 sm:grid-cols-3 gap-4">
            <HandleConstructionInput
              parentHandleConstruction={editState.handleConstruction}
              setHandleConstructionOnChange={(v: string) => setField("handleConstruction", v)}
            />
            <HandleMaterialInput
              parentHandleMaterial={editState.handleMaterial}
              setHandleMaterialOnChange={(v: string) => setField("handleMaterial", v)}
            />
            <HandleFinishInput
              parentHandleFinish={editState.handleFinish}
              setHandleFinishOnChange={(v: string) => setField("handleFinish", v)}
            />
          </div>
        </div>

        {/* ── Save error ── */}
        {saveError && (
          <div className="bg-red/10 border border-red/30 rounded-xl px-4 py-3 text-red text-sm font-medium">
            {saveError}
          </div>
        )}

        {/* ── Danger zone ── */}
        <div className="border-t border-white/5 pt-5">
          <h2 className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-3">
            Danger Zone
          </h2>
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border border-red/25 text-red/60 bg-red/5 hover:bg-red/10 hover:border-red/40 hover:text-red/80 transition-all duration-200"
            >
              <FontAwesomeIcon icon={faTrash} className="text-xs" />
              Remove from Collection
            </button>
          ) : (
            <div className="bg-red/5 border border-red/20 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <FontAwesomeIcon icon={faTriangleExclamation} className="text-red/70 text-base mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white/80 text-sm font-semibold">
                    Remove "{k.displayName}" from your collection?
                  </p>
                  <p className="text-white/40 text-xs mt-1">
                    This will permanently delete this knife and all its data. This cannot be undone.
                  </p>
                </div>
              </div>
              {deleteError && (
                <p className="text-red text-xs font-medium -mb-1">{deleteError}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red/15 border border-red/30 text-red hover:bg-red/25 hover:border-red/50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                  {isDeleting ? "Removing…" : "Yes, Remove"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom save bar ── */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancelEdit}
            disabled={isSaving}
            className="flex-1 py-3 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isDuplicateName || !editState.displayName.trim()}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-blue-primary text-white hover:bg-blue-primary/80 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={faCheck} className="text-xs" />
            {isSaving ? "Saving…" : "Save Changes"}
          </button>
        </div>

      </div>
    </section>
  );
};

export default UsersCollectionKnifeDisplay;
