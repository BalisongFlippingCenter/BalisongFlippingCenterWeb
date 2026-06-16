import { useRef, useState } from "react";
import { useAppSelector } from "../../redux/hooks";

interface params {
  setKnifeWeightOnChange: Function;
  parentWeight: string;
}

const KnifeWeightInput = ({ setKnifeWeightOnChange, parentWeight }: params) => {
  const measurementUnit = useAppSelector((state) => state.auth.user?.measurementUnit) ?? "imperial";
  const isMetric        = measurementUnit === "metric";

  const weightInputRef = useRef<HTMLInputElement>(null);

  // Weight is always stored in oz. Initialise display value in the user's preferred unit.
  const [weightType, setWeightType] = useState<string>(isMetric ? "g" : "oz");
  const [weight, setWeight]         = useState<string>(() => {
    if (!parentWeight || isNaN(+parentWeight) || +parentWeight <= 0) return parentWeight;
    return isMetric
      ? checkDecimalValue((+parentWeight * 28.3495).toFixed(1).toString())
      : parentWeight;
  });

  function checkDecimalValue(value: string) {
    const i = value.indexOf(".");
    if (i !== -1 && value[i + 2] === "0") return (+value).toFixed(1).toString();
    return value;
  }

  const onWeightChange = (value: string) => {
    setWeight(value);
    // Always persist in oz
    setKnifeWeightOnChange(
      weightType !== "oz"
        ? checkDecimalValue((+value / 28.3495).toFixed(2).toString())  // g → oz
        : checkDecimalValue((+value).toFixed(2).toString())             // oz → oz
    );
  };

  const onWeightTypeChange = (value: string) => {
    // Convert the current display value to the new unit
    if (weightType === "g" && value === "oz" && weight !== "")
      setWeight((prev) => checkDecimalValue((+prev / 28.3495).toFixed(2).toString()));
    if (weightType === "oz" && value === "g" && weight !== "")
      setWeight((prev) => checkDecimalValue((+prev * 28.3495).toFixed(1).toString()));
    setWeightType(value);
  };

  const handleOnBlur = () => {
    const decimals = weightType === "g" ? 1 : 2;
    setWeight((prev) => checkDecimalValue((+prev).toFixed(decimals).toString()));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-white/50 font-medium uppercase tracking-wide">Weight</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          ref={weightInputRef}
          value={weight}
          placeholder="0.0"
          onChange={(e) => onWeightChange(e.target.value)}
          onBlur={handleOnBlur}
          className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-primary/50 transition-colors duration-200 placeholder:text-white/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          {["oz", "g"].map((unit) => (
            <button
              key={unit}
              type="button"
              onClick={() => onWeightTypeChange(unit)}
              className={`px-2.5 py-2 text-xs font-medium transition-colors duration-150 ${
                weightType === unit
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

export default KnifeWeightInput;
