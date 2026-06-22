import { useEffect, useState } from "react";

interface params {
  setBalanceOnChange: Function;
  setHasModulatedBalanceOnChange: Function;
  parentHasModulatedBalance: boolean;
  parentBalanceValue: Number | null;
}

const KnifeBalanceInput = ({
  setBalanceOnChange,
  setHasModulatedBalanceOnChange,
  parentBalanceValue,
  parentHasModulatedBalance,
}: params) => {
  const [balance, setBalance] = useState("3");
  const [hasModulatedBalance, setHasModulatedBalance] = useState(
    parentHasModulatedBalance
  );

  const handleOnModulatedBalanceChange = () => {
    setHasModulatedBalance((prev) => !prev);

    if (!hasModulatedBalance) {
      setBalanceOnChange(null);
    } else {
      setBalanceOnChange(balance);
    }

    setHasModulatedBalanceOnChange(!hasModulatedBalance);
  };

  const handleOnChange = (value: string) => {
    setBalance(value);
    setBalanceOnChange(Number(value));
  };

  useEffect(() => {
    if (parentBalanceValue !== null && parentBalanceValue !== undefined) {
      setBalance(parentBalanceValue.toString());
    } else {
      // Notify parent of the default value so it's never null
      setBalanceOnChange(Number(balance));
    }
  }, []);

  const balanceLabels = [
    "Heavy Blade",
    "Blade Bias",
    "Mod. Blade",
    "Neutral",
    "Mod. Handle",
    "Handle Bias",
    "Heavy Handle",
  ];

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Modular balance toggle */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-white/50 font-medium uppercase tracking-wide">
          Modular Balance System?
        </label>
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          {(["Yes", "No"] as const).map((option) => {
            const isActive =
              option === "Yes" ? hasModulatedBalance : !hasModulatedBalance;
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  const wantsYes = option === "Yes";
                  if (wantsYes !== hasModulatedBalance) {
                    handleOnModulatedBalanceChange();
                  }
                }}
                className={`flex-1 py-2 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "bg-blue-primary text-white"
                    : "bg-white/5 text-white/40 hover:text-white/70"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {/* Balance slider — shown only when no modular balance */}
      {!hasModulatedBalance && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-white/50 font-medium uppercase tracking-wide">
              Balance Point
            </label>
            <span className="text-xs text-blue-primary font-medium">
              {balanceLabels[Number(balance)]}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="6"
            value={balance}
            onChange={(e) => handleOnChange(e.target.value)}
            className="w-full cursor-pointer appearance-none h-1.5 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/20 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-primary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white/20 [&::-moz-range-thumb]:cursor-pointer"
            style={{
              background: `linear-gradient(to right, #108198 0%, #108198 ${(Number(balance) / 6) * 100}%, rgba(255,255,255,0.1) ${(Number(balance) / 6) * 100}%, rgba(255,255,255,0.1) 100%)`,
              transition: "background 0.15s ease",
            }}
          />
          <div className="flex justify-between text-[10px] text-white/25 px-0.5">
            <span>Blade</span>
            <span>Neutral</span>
            <span>Handle</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnifeBalanceInput;
