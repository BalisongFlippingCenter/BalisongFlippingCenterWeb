import { useState } from "react";
import { useAppSelector } from "../../redux/hooks";

const USD_TO_EUR = 0.92;

interface params {
  setKnifeMSRPOnChange: Function;
  parentMSRP: string;
}

const KnifeMSRPInput = ({ setKnifeMSRPOnChange, parentMSRP }: params) => {
  const currency = useAppSelector((state) => state.auth.user?.currency) ?? "USD";
  const isEUR    = currency === "EUR";

  // Initialise display value: if EUR, convert the incoming USD amount
  const [msrp, setMsrp] = useState<string>(() => {
    if (!parentMSRP || isNaN(+parentMSRP) || +parentMSRP <= 0) return parentMSRP;
    return isEUR ? (+parentMSRP * USD_TO_EUR).toFixed(2) : parentMSRP;
  });

  const msrpOnChange = (value: string) => {
    setMsrp(value);
    // Always persist in USD
    const usd = isEUR
      ? (+value / USD_TO_EUR).toFixed(2)
      : (+value).toFixed(2);
    setKnifeMSRPOnChange(usd);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-white/50 font-medium uppercase tracking-wide">
        MSRP <span className="normal-case tracking-normal text-white/25">({currency})</span>
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none">
          {isEUR ? "€" : "$"}
        </span>
        <input
          type="number"
          value={msrp}
          placeholder="0.00"
          onChange={(e) => msrpOnChange(e.target.value)}
          onBlur={() => setMsrp((prev) => (+prev).toFixed(2).toString())}
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-2 text-white text-sm outline-none focus:border-blue-primary/50 transition-colors duration-200 placeholder:text-white/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
    </div>
  );
};

export default KnifeMSRPInput;
