import { useRef, useState } from "react";
import { useAppSelector } from "../../redux/hooks";

interface params {
  setOverallLengthOnChange: Function;
  parentKnifeLength: string;
}

const OverallKnifeLengthInput = ({ setOverallLengthOnChange, parentKnifeLength }: params) => {
  const measurementUnit = useAppSelector((state) => state.auth.user?.measurementUnit) ?? "imperial";
  const isMetric        = measurementUnit === "metric";

  const lengthInputRef = useRef<HTMLInputElement>(null);

  // Length is always stored in inches. Initialise display value in the user's preferred unit.
  const [measureType, setMeasureType] = useState<string>(isMetric ? "cm" : "In");
  const [length, setLength]           = useState<string>(() => {
    if (!parentKnifeLength || isNaN(+parentKnifeLength) || +parentKnifeLength <= 0)
      return parentKnifeLength;
    return isMetric
      ? (+parentKnifeLength * 2.54).toFixed(1).toString()
      : parentKnifeLength;
  });

  const overallLengthOnChange = (value: string) => {
    setLength(value);
    // Always persist in inches
    setOverallLengthOnChange(
      measureType !== "In"
        ? (+value / 2.54).toFixed(1).toString()   // cm → inches
        : (+value).toFixed(1).toString()            // inches → inches
    );
  };

  const onMeasureTypeChange = (value: string) => {
    // Convert the current display value to the new unit
    if (measureType === "cm" && value === "In" && length !== "")
      setLength((prev) => (+prev / 2.54).toFixed(1).toString());
    if (measureType === "In" && value === "cm" && length !== "")
      setLength((prev) => (+prev * 2.54).toFixed(1).toString());
    setMeasureType(value);
  };

  const handleOnBlur = () => {
    setLength((prev) => (+prev).toFixed(1).toString());
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-white/50 font-medium uppercase tracking-wide">Overall Length</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          ref={lengthInputRef}
          value={length}
          placeholder="0.0"
          onChange={(e) => overallLengthOnChange(e.target.value)}
          onBlur={handleOnBlur}
          className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-primary/50 transition-colors duration-200 placeholder:text-white/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          {["In", "cm"].map((unit) => (
            <button
              key={unit}
              type="button"
              onClick={() => onMeasureTypeChange(unit)}
              className={`px-2.5 py-2 text-xs font-medium transition-colors duration-150 ${
                measureType === unit
                  ? "bg-blue-primary text-white"
                  : "bg-white/5 text-white/40 hover:text-white/70"
              }`}
            >
              {unit}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OverallKnifeLengthInput;
