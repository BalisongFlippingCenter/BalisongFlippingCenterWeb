import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CollectionKnifeDTO } from "../../modals/CollectionKnife";
import GalleryInputSelectedFilesFileCoverDisplay from "./GalleryInputSelectedFilesFileCoverDisplay";
import { useAppSelector } from "../../redux/hooks";
import { formatCurrency, formatWeight, formatLength } from "../../utils/unitConversions";

interface params {
  galleryFiles: Array<File> | null;
  newKnifeObj: CollectionKnifeDTO | null;
  setStepManually: Function;
}

const NewCollectionKnifeSummary = ({
  galleryFiles,
  newKnifeObj,
  setStepManually,
}: params) => {
  const currency        = useAppSelector((state) => state.auth.user?.currency) ?? "USD";
  const measurementUnit = useAppSelector((state) => state.auth.user?.measurementUnit) ?? "imperial";
  const getBalancePoint = () => {
    console.log(newKnifeObj?.balanceValue);
    switch (newKnifeObj?.balanceValue?.toString()) {
      case "0":
        return "Heavy Blade Bias";
      case "1":
        return "Blade Bias";
      case "2":
        return "Moderate Blade Bias";
      case "3":
        return "Nuetral";
      case "4":
        return "Moderate Handle Bias";
      case "5":
        return "Handle Bias";
      case "6":
        return "Heavy Handle Bias";
      default:
        return "---";
    }
  };

  const SummaryField = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">{label}</span>
      <span className="text-sm text-white font-medium">{value || "—"}</span>
    </div>
  );

  return (
    <section className="w-full flex flex-col items-center pt-6">
      {/* Header */}
      <div className="w-full max-w-[900px] lg:max-w-[1100px] px-4 flex items-center justify-between py-2">
        <h3 className="text-white font-bold text-xl">Summary</h3>
        <p className="text-white/40 text-xs">Review before submitting</p>
      </div>

      <div className="w-full max-w-[900px] lg:max-w-[1100px] flex flex-col gap-4 px-4 pb-28">
        {/* Knife info card */}
        <div className="bg-[#13161d] border border-white/10 rounded-2xl overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div>
              <h4 className="text-white font-bold text-base">{newKnifeObj?.displayName}</h4>
              <p className="text-white/40 text-xs mt-0.5">{newKnifeObj?.knifeMaker} · {newKnifeObj?.baseKnifeModel}</p>
            </div>
            <button
              type="button"
              onClick={() => setStepManually("1")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-white/40 text-xs hover:text-white hover:border-white/20 transition-colors duration-200"
            >
              <FontAwesomeIcon icon={faPenToSquare} className="text-[10px]" />
              <span>Edit</span>
            </button>
          </div>

          <div className="p-5 flex flex-row gap-5">
            {/* Cover photo */}
            {newKnifeObj?.coverPhoto && (
              <div className="xsm:w-28 sm:w-36 md:w-40 lg:w-48 flex-shrink-0">
                <img
                  src={URL.createObjectURL(newKnifeObj.coverPhoto)}
                  className="w-full aspect-[3/4] object-cover rounded-xl"
                />
              </div>
            )}

            {/* Details */}
            <div className="flex-1 flex flex-col gap-4">
              {/* Basic */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <SummaryField label="Knife Type" value={newKnifeObj?.knifeType || ""} />
                <SummaryField label="Date Acquired" value={newKnifeObj?.aqquiredDate || ""} />
                <SummaryField label="MSRP" value={formatCurrency(newKnifeObj?.msrp, currency) || "—"} />
                <SummaryField label="Overall Length" value={formatLength(newKnifeObj?.overallLength, measurementUnit) || "—"} />
                <SummaryField label="Weight" value={formatWeight(newKnifeObj?.weight, measurementUnit) || "—"} />
                <SummaryField label="Balance" value={newKnifeObj?.hasModularBalance ? "Modular" : getBalancePoint()} />
              </div>

              <div className="h-px bg-white/5" />

              {/* Hardware */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <SummaryField label="Pivot System" value={newKnifeObj?.pivotSystem || ""} />
                <SummaryField label="Latch Type" value={newKnifeObj?.latchType || ""} />
                <SummaryField label="Pin System" value={newKnifeObj?.pinSystem || ""} />
              </div>

              <div className="h-px bg-white/5" />

              {/* Blade */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <SummaryField label="Blade Style" value={newKnifeObj?.bladeStyle || ""} />
                <SummaryField label="Blade Finish" value={newKnifeObj?.bladeFinish || ""} />
                <SummaryField label="Blade Material" value={newKnifeObj?.bladeMaterial || ""} />
              </div>

              <div className="h-px bg-white/5" />

              {/* Handles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <SummaryField label="Handle Construction" value={newKnifeObj?.handleConstruction || ""} />
                <SummaryField label="Handle Material" value={newKnifeObj?.handleMaterial || ""} />
                <SummaryField label="Handle Finish" value={newKnifeObj?.handleFinish || ""} />
              </div>

              {/* Favorites */}
              <div className="flex gap-3">
                {newKnifeObj?.isFavoriteKnife && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold font-medium">★ Favorite Knife</span>
                )}
                {newKnifeObj?.isFavoriteFlipper && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-primary/10 border border-blue-primary/30 text-blue-primary font-medium">♦ Favorite Flipper</span>
                )}
              </div>
            </div>
          </div>

          {/* Rankings */}
          {newKnifeObj?.averageScore != null && (
            <div className="px-5 pb-5 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Rankings</span>
                <span className="text-lg font-bold text-white">
                  {Number(newKnifeObj.averageScore).toFixed(1)}
                  <span className="text-sm text-white/30 font-normal">/10</span>
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: "Quality", value: newKnifeObj.qualityScore },
                  { label: "Flipping", value: newKnifeObj.flippingScore },
                  { label: "Feel", value: newKnifeObj.feelScore },
                  { label: "Sound", value: newKnifeObj.soundScore },
                  { label: "Durability", value: newKnifeObj.durabilityScore },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col items-center gap-1 bg-white/5 rounded-xl py-3">
                    <span className="text-lg font-bold text-blue-primary">{value}</span>
                    <span className="text-[10px] text-white/30 uppercase tracking-wider">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Gallery files */}
        {galleryFiles && galleryFiles.length > 0 && (
          <div className="bg-[#13161d] border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Gallery</h4>
              <button
                type="button"
                onClick={() => setStepManually("2")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-white/40 text-xs hover:text-white hover:border-white/20 transition-colors duration-200"
              >
                <FontAwesomeIcon icon={faPenToSquare} className="text-[10px]" />
                <span>Edit</span>
              </button>
            </div>
            <div className="grid grid-cols-5 gap-1 p-3">
              {galleryFiles.map((file, i) => (
                <div key={i} className="aspect-square">
                  <GalleryInputSelectedFilesFileCoverDisplay file={file} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={() => setStepManually("4")}
          className="w-full py-3 rounded-xl bg-blue-primary text-white text-sm font-semibold hover:bg-blue-primary/80 transition-colors duration-200"
        >
          Submit Knife →
        </button>
      </div>
    </section>
  );
};

export default NewCollectionKnifeSummary;
