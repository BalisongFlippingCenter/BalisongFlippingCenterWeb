import {
  faChevronDown,
  faChevronUp,
  faCircleArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import KnifeMSRPInput from "../input/KnifeMSRPInput";
import OverallKnifeLengthInput from "../input/OverallKnifeLengthInput";
import KnifeWeightInput from "../input/KnifeWeightInput";
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
import NewKnifeDisplayNameInput from "../input/NewKnifeDisplayNameInput";
import KnifeMakerInput from "../input/KnifeMakerInput";
import BaseKnifeModelInput from "../input/BaseKnifeModelInput";
import KnifeTypeInput from "../input/KnifeTypeInput";
import CollectionKnifeCoverPhotoInput from "../input/CollectionKnifeCoverPhotoInput";
import AqquiredDateInput from "../input/AqquiredDateInput";
import FavoriteKnifeInput from "../input/FavoriteKnifeInput";
import FavoriteFlipperInput from "../input/FavoriteFlipperInput";
import { CollectionKnifeDTO } from "../../modals/CollectionKnife";
import { useAppSelector } from "../../redux/hooks";

interface params {
  setNewKnifeObjOnSubmit: Function;
  setFormNotReadyOnChange: Function;
  setStepManually: Function;
  collectionKnifeObj: CollectionKnifeDTO | null;
}

const ScoreSlider = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (e: any) => void;
}) => {
  const pct = (value / 10) * 100;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs text-white/50 font-medium uppercase tracking-wide">{label}</label>
        <span className="text-sm font-bold text-blue-primary">
          {value}<span className="text-white/30 font-normal">/10</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-white/25 w-6 text-right flex-shrink-0">0</span>
        <input
          type="range"
          min={0}
          max={10}
          value={value}
          onChange={onChange}
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

const NewCollectionKnifeForm = ({
  setNewKnifeObjOnSubmit,
  collectionKnifeObj,
  setStepManually,
  setFormNotReadyOnChange,
}: params) => {
  // states
  // form state values required info
  const [displayName, setDisplayName] = useState("");
  const [knifeMaker, setKNifeMaker] = useState("");
  const [baseKnifeModel, setBaseKnifeModel] = useState("");

  const [knifeType, setKnifeType] = useState("liveblade");

  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);

  const [selectedDate, setSelectedDate] = useState("");

  const [isFavoriteKnife, setIsFavoriteKnife] = useState(false);
  const [isFavoriteFlipper, setIsFavoriteFlipper] = useState(false);

  // form state values knife info
  const [knifeMSRP, setKnifeMSRP] = useState("");
  const [overallLength, setOverallLength] = useState("");
  const [knifeWeight, setKnifeWeight] = useState("");
  const [pivotSystem, setPivotSystem] = useState("Unknown");
  const [latchType, setLatchType] = useState("Unknown");
  const [pinSystem, setPinSystem] = useState("Unknown");
  const [balance, setBalance] = useState<Number | null>(null);
  const [hasModualtedBalance, setHasModulatedBalance] = useState(false);

  const [bladeStyle, setBladeStyle] = useState("Unknown");
  const [bladeFinish, setBladeFinish] = useState("Unknown");
  const [bladeMaterial, setBladeMaterial] = useState("Unknown");

  const [handleConstruction, setHandleConstruction] = useState("Unknown");
  const [handleMaterial, setHandleMaterial] = useState("Unknown");
  const [handleFinish, setHandleFinish] = useState("Unknown");

  // form state values rankings
  const [averageScore, setAverageScore] = useState<Number | null>(null);

  const [qualityScore, setQualityScore] = useState(5);
  const [flippingScore, setFlippingScore] = useState(5);
  const [feelScore, setFeelScore] = useState(5);
  const [soundScore, setSoundScore] = useState(5);
  const [durabilityScore, setDurabilityScore] = useState(5);

  // form state values mod work

  // additional state values
  const [displayAdditionalKnifeInfo, toggleDisplayAdditionalKnifeInfo] =
    useState(false);
  const [displayRankingsInfo, toggleDisplayRankingsInfo] = useState(false);
  const [displayModWork, toggleDisplayModWork] = useState(false);

  // collection data
  const collectedKnives = useAppSelector(
    (state) => state.collection.collectionKnives
  );

  const fillForm = () => {
    if (collectionKnifeObj !== null) {
      setDisplayName(collectionKnifeObj.displayName);
      setKNifeMaker(collectionKnifeObj.knifeMaker);
      setBaseKnifeModel(collectionKnifeObj.baseKnifeModel);
      setKnifeType(collectionKnifeObj.knifeType);
      setSelectedDate(collectionKnifeObj.aqquiredDate);
      setIsFavoriteKnife(collectionKnifeObj.isFavoriteKnife);
      setIsFavoriteFlipper(collectionKnifeObj.isFavoriteFlipper);
      setSelectedCoverFile(collectionKnifeObj.coverPhoto);

      setKnifeMSRP(collectionKnifeObj.msrp);
      setOverallLength(collectionKnifeObj.overallLength);
      setKnifeWeight(collectionKnifeObj.weight);
      setPivotSystem(collectionKnifeObj.pivotSystem);
      setLatchType(collectionKnifeObj.latchType);
      setPinSystem(collectionKnifeObj.pinSystem);
      setHasModulatedBalance(collectionKnifeObj.hasModularBalance);
      setBalance(collectionKnifeObj.balanceValue);

      setBladeStyle(collectionKnifeObj.bladeStyle);
      setBladeFinish(collectionKnifeObj.bladeFinish);
      setBladeMaterial(collectionKnifeObj.bladeMaterial);

      setHandleConstruction(collectionKnifeObj.handleConstruction);
      setHandleMaterial(collectionKnifeObj.handleMaterial);
      setHandleFinish(collectionKnifeObj.handleFinish);

      setAverageScore(collectionKnifeObj.averageScore);
      setQualityScore(collectionKnifeObj.qualityScore);
      setFlippingScore(collectionKnifeObj.flippingScore);
      setFeelScore(collectionKnifeObj.feelScore);
      setDurabilityScore(collectionKnifeObj.durabilityScore);
      setSoundScore(collectionKnifeObj.soundScore);
    }
  };

  const updateParent = () => {
    const obj = {
      displayName: displayName,
      knifeMaker: knifeMaker,
      baseKnifeModel: baseKnifeModel,
      knifeType: knifeType,
      coverPhoto: selectedCoverFile,
      aqquiredDate: selectedDate,

      isFavoriteFlipper: isFavoriteFlipper,
      isFavoriteKnife: isFavoriteKnife,

      msrp: knifeMSRP,
      overallLength: overallLength,
      weight: knifeWeight,
      pivotSystem: pivotSystem,
      latchType: latchType,
      pinSystem: pinSystem,
      hasModularBalance: hasModualtedBalance,
      balanceValue: balance,

      bladeStyle: bladeStyle,
      bladeFinish: bladeFinish,
      bladeMaterial: bladeMaterial,

      handleConstruction: handleConstruction,
      handleMaterial: handleMaterial,
      handleFinish: handleFinish,

      averageScore: averageScore,
      qualityScore: qualityScore,
      flippingScore: flippingScore,
      feelScore: feelScore,
      soundScore: soundScore,
      durabilityScore: durabilityScore,
    } as CollectionKnifeDTO;

    console.log("new knife obj: ", obj);
    setNewKnifeObjOnSubmit(obj);
  };

  const displayNameIsDuplicate = () => {
    return collectedKnives.find((knife) => knife.displayName === displayName);
  };

  // on form submit
  const handleFormSubmit = (e: any) => {
    if (e) e.preventDefault();

    if (displayNameIsDuplicate()) return;

    updateParent();
  };

  // on change functions
  const setDisplayNameOnChange = (input: string) => {
    setDisplayName(input);

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  const setKnifeMakerOnChange = (input: string) => {
    setKNifeMaker(input);

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  const setBaseKnifeModelOnChange = (input: string) => {
    setBaseKnifeModel(input);

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  const setKnifeTypeOnchange = (input: string) => {
    setKnifeType(input);

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  const setCoverFileOnChange = (input: File | null) => {
    setSelectedCoverFile(input);

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  const setAqquiredDateOnChange = (input: string) => {
    setSelectedDate(input);

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  const setIsFavoriteKnifeOnChange = () => {
    setIsFavoriteKnife((prev) => !prev);

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  const setIsFavoriteFlipperOnChange = () => {
    setIsFavoriteFlipper((prev) => !prev);

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  const qualityScaleOnChange = (e: any) => {
    setQualityScore(e.target.value);

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }

    if (averageScore == null) {
      setAverageScore(0);
    }
  };

  const flippingScaleOnChange = (e: any) => {
    setFlippingScore(e.target.value);

    if (averageScore == null) {
      setAverageScore(0);
    }

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  const feelScaleOnChange = (e: any) => {
    setFeelScore(e.target.value);

    if (averageScore == null) {
      setAverageScore(0);
    }

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  const soundScaleOnChange = (e: any) => {
    setSoundScore(e.target.value);

    if (averageScore == null) {
      setAverageScore(0);
    }

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  const durabilityScaleOnChange = (e: any) => {
    setDurabilityScore(e.target.value);

    if (averageScore == null) {
      setAverageScore(0);
    }

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  const setKnifeMSRPOnChange = (input: string) => {
    setKnifeMSRP(input);

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  const setOverallLengthOnChange = (input: string) => {
    setOverallLength(input);

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  const setKnifeWeightOnChange = (input: string) => {
    setKnifeWeight(input);

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  const setPivotSystemOnChange = (input: string) => {
    setPivotSystem(input);

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  const setLatchTypeOnChange = (input: string) => {
    setLatchType(input);

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  const setPinSystemOnChange = (input: string) => {
    setPinSystem(input);

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  const setHasModulatedBalanceOnChange = (input: boolean) => {
    setHasModulatedBalance(input);

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  const setBalanceOnChange = (input: number) => {
    setBalance(input);

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
    console.log("called");
  };

  const setBladeStyleOnChange = (input: string) => {
    setBladeStyle(input);

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  const setBladeFinishOnChange = (input: string) => {
    setBladeFinish(input);

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  const setBladeMaterialOnChange = (input: string) => {
    setBladeMaterial(input);

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  const setHandleConstructionOnChange = (input: string) => {
    setHandleConstruction(input);

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  const setHandleMaterialOnChange = (input: string) => {
    setHandleMaterial(input);

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  const setHandleFinishOnChange = (input: string) => {
    setHandleFinish(input);

    if (collectionKnifeObj !== null) {
      setFormNotReadyOnChange();
    }
  };

  useEffect(() => {
    if (averageScore != null)
      setAverageScore(
        (+qualityScore +
          +flippingScore +
          +feelScore +
          +soundScore +
          +durabilityScore) /
          5
      );
  }, [qualityScore, flippingScore, feelScore, soundScore, durabilityScore]);

  // on mount
  useEffect(() => {
    fillForm();
  }, []);

  const isFormValid =
    displayName !== "" &&
    !displayNameIsDuplicate() &&
    knifeMaker !== "" &&
    baseKnifeModel !== "" &&
    selectedCoverFile !== null &&
    selectedDate !== "";

  return (
    <section className="max-w-[900px] w-full h-full flex flex-col pt-6 px-4 items-center">
      {/* Page header */}
      <div className="lg:w-5/6 md:w-[92%] xsm:w-full flex items-center justify-between px-4 py-5">
        <div>
          <h2 className="text-white font-bold xsm:text-xl md:text-2xl">Add New Knife</h2>
          <p className="text-white/40 text-sm mt-0.5">Fill in the details for your new knife</p>
        </div>

        {collectionKnifeObj === null ? (
          <button type="button" disabled className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white/20 text-sm font-medium cursor-not-allowed">
            <span>Gallery</span>
            <FontAwesomeIcon icon={faCircleArrowRight} className="text-xs" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStepManually("2")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-primary/40 text-blue-primary text-sm font-medium hover:bg-blue-primary/10 transition-colors duration-200"
          >
            <span>Gallery</span>
            <FontAwesomeIcon icon={faCircleArrowRight} className="text-xs" />
          </button>
        )}
      </div>

      <form
        className="lg:w-5/6 md:w-[92%] xsm:w-full flex flex-col gap-4 xsm:px-4 md:px-0 pb-28"
        onSubmit={handleFormSubmit}
      >
        {/* ── Required Info Card ── */}
        <div className="bg-[#13161d] border border-white/10 rounded-2xl p-5 flex flex-col gap-5">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Required Info</h3>

          {/* Cover photo + name/maker fields side by side */}
          <div className="flex xsm:flex-col md:flex-row gap-5">
            {/* Left: text fields */}
            <div className="flex-1 flex flex-col gap-4">
              <NewKnifeDisplayNameInput
                setDisplayNameOnChange={setDisplayNameOnChange}
                parentDisplayName={displayName}
              />
              <KnifeMakerInput
                setKnifeMakerOnChange={setKnifeMakerOnChange}
                parentKnifeMaker={knifeMaker}
              />
              <BaseKnifeModelInput
                setBaseKnifeModelOnChange={setBaseKnifeModelOnChange}
                parentBaseKnifeModel={baseKnifeModel}
              />
              <KnifeTypeInput
                setKnifeTypeOnChange={setKnifeTypeOnchange}
                parentKnifeType={knifeType}
              />
            </div>

            {/* Right: cover photo */}
            <div className="xsm:w-full md:w-56 lg:w-64 flex-shrink-0">
              <CollectionKnifeCoverPhotoInput
                setCoverFileOnChange={setCoverFileOnChange}
                parentCoverFile={selectedCoverFile}
              />
            </div>
          </div>

          {/* Date + favorites row */}
          <div className="flex xsm:flex-col md:flex-row gap-3 md:items-end">
            <div className="xsm:w-full md:w-48 flex-shrink-0">
              <AqquiredDateInput
                setAqquiredDateOnChange={setAqquiredDateOnChange}
                parentAqquiredDate={selectedDate}
              />
            </div>
            <div className="flex flex-1 gap-3">
              <div className="flex-1">
                <FavoriteKnifeInput
                  setIsFavoriteKnifeOnChange={setIsFavoriteKnifeOnChange}
                  parentIsFavoriteKnife={isFavoriteKnife}
                />
              </div>
              <div className="flex-1">
                <FavoriteFlipperInput
                  setIsFavoriteFlipperOnChange={setIsFavoriteFlipperOnChange}
                  parentIsFavoriteFlipper={isFavoriteFlipper}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Additional Knife Info (accordion) ── */}
        <div className="bg-[#13161d] border border-white/10 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleDisplayAdditionalKnifeInfo((prev) => !prev)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors duration-200"
          >
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Additional Knife Info</h3>
            <FontAwesomeIcon
              icon={displayAdditionalKnifeInfo ? faChevronUp : faChevronDown}
              className="text-white/30 text-xs"
            />
          </button>

          {displayAdditionalKnifeInfo && (
            <div className="px-5 pb-5 flex flex-col gap-6 border-t border-white/10 pt-5">
              {/* Specs */}
              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-semibold text-white/35 uppercase tracking-wider">Specs</h4>
                <div className="grid xsm:grid-cols-1 sm:grid-cols-3 gap-3">
                  <KnifeMSRPInput
                    setKnifeMSRPOnChange={setKnifeMSRPOnChange}
                    parentMSRP={knifeMSRP}
                  />
                  <OverallKnifeLengthInput
                    setOverallLengthOnChange={setOverallLengthOnChange}
                    parentKnifeLength={overallLength}
                  />
                  <KnifeWeightInput
                    setKnifeWeightOnChange={setKnifeWeightOnChange}
                    parentWeight={knifeWeight}
                  />
                </div>
                <div className="grid xsm:grid-cols-1 sm:grid-cols-3 gap-3">
                  <PivotSystemInput
                    setPivotSystemOnChange={setPivotSystemOnChange}
                    parentPivotSystem={pivotSystem}
                  />
                  <LatchTypeInput
                    setLatchTypeOnChange={setLatchTypeOnChange}
                    parentLatchType={latchType}
                  />
                  <PinSystemInput
                    setPinSystemOnChange={setPinSystemOnChange}
                    parentPinSystem={pinSystem}
                  />
                </div>
                <KnifeBalanceInput
                  setBalanceOnChange={setBalanceOnChange}
                  setHasModulatedBalanceOnChange={setHasModulatedBalanceOnChange}
                  parentBalanceValue={balance}
                  parentHasModulatedBalance={hasModualtedBalance}
                />
              </div>

              <div className="h-px bg-white/5" />

              {/* Blade */}
              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-semibold text-white/35 uppercase tracking-wider">Blade</h4>
                <div className="grid xsm:grid-cols-1 sm:grid-cols-3 gap-3">
                  <BladeStyleInput
                    setBladeStyleOnChange={setBladeStyleOnChange}
                    parentBladeStyle={bladeStyle}
                  />
                  <BladeFinishInput
                    setBladeFinishOnChange={setBladeFinishOnChange}
                    parentBladeFinish={bladeFinish}
                  />
                  <BladeMaterialInput
                    setBladeMaterialOnChange={setBladeMaterialOnChange}
                    parentBladeMaterial={bladeMaterial}
                  />
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Handles */}
              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-semibold text-white/35 uppercase tracking-wider">Handles</h4>
                <div className="grid xsm:grid-cols-1 sm:grid-cols-3 gap-3">
                  <HandleConstructionInput
                    setHandleConstructionOnChange={setHandleConstructionOnChange}
                    parentHandleConstruction={handleConstruction}
                  />
                  <HandleMaterialInput
                    setHandleMaterialOnChange={setHandleMaterialOnChange}
                    parentHandleMaterial={handleMaterial}
                  />
                  <HandleFinishInput
                    setHandleFinishOnChange={setHandleFinishOnChange}
                    parentHandleFinish={handleFinish}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Rankings (accordion) ── */}
        <div className="bg-[#13161d] border border-white/10 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleDisplayRankingsInfo((prev) => !prev)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors duration-200"
          >
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Rankings</h3>
            <FontAwesomeIcon
              icon={displayRankingsInfo ? faChevronUp : faChevronDown}
              className="text-white/30 text-xs"
            />
          </button>

          {displayRankingsInfo && (
            <div className="px-5 pb-5 flex flex-col gap-5 border-t border-white/10 pt-5">
              {/* Overall score display */}
              <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-sm font-medium text-white/50">Overall Score</span>
                <span className="text-2xl font-bold text-white">
                  {averageScore == null ? "—" : Number(averageScore).toFixed(1)}
                  <span className="text-sm text-white/30 font-normal">/10</span>
                </span>
              </div>

              <ScoreSlider label="Quality" value={qualityScore} onChange={qualityScaleOnChange} />
              <ScoreSlider label="Flipping" value={flippingScore} onChange={flippingScaleOnChange} />
              <ScoreSlider label="Feel" value={feelScore} onChange={feelScaleOnChange} />
              <ScoreSlider label="Sound" value={soundScore} onChange={soundScaleOnChange} />
              <ScoreSlider label="Durability" value={durabilityScore} onChange={durabilityScaleOnChange} />
            </div>
          )}
        </div>

        {/* ── Mod Work (accordion) ── */}
        <div className="bg-[#13161d] border border-white/10 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleDisplayModWork((prev) => !prev)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors duration-200"
          >
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Mod Work</h3>
            <FontAwesomeIcon
              icon={displayModWork ? faChevronUp : faChevronDown}
              className="text-white/30 text-xs"
            />
          </button>

          {displayModWork && (
            <div className="px-5 pb-5 border-t border-white/10 pt-5">
              <p className="text-sm text-white/30 text-center py-4">Mod work tracking coming soon.</p>
            </div>
          )}
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={!isFormValid}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors duration-200 ${
            isFormValid
              ? "bg-blue-primary text-white hover:bg-blue-primary/80"
              : "bg-white/5 text-white/20 border border-white/10 cursor-not-allowed"
          }`}
        >
          {isFormValid ? "Continue to Gallery →" : "Fill in required fields to continue"}
        </button>
      </form>
    </section>
  );
};

export default NewCollectionKnifeForm;
