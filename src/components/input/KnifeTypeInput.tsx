import { useState } from "react";

interface params {
  setKnifeTypeOnChange: Function;
  parentKnifeType: string;
}

const KnifeTypeInput = ({ setKnifeTypeOnChange, parentKnifeType }: params) => {
  const [_bladeType, setBladeType] = useState(parentKnifeType);

  const handleOnChange = (value: string) => {
    setBladeType(value);
    setKnifeTypeOnChange(value);
  };

  const options = [
    { label: "Live Blade", value: "liveblade" },
    { label: "Trainer",    value: "trainer"   },
    { label: "Both",       value: "both"      },
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-white/50 font-medium uppercase tracking-wide">Knife Type</label>
      <div className="flex rounded-lg overflow-hidden border border-white/10">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleOnChange(option.value)}
            className={`flex-1 py-2 text-sm font-medium transition-colors duration-150 ${
              parentKnifeType === option.value
                ? "bg-blue-primary text-white"
                : "bg-white/5 text-white/40 hover:text-white/70"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default KnifeTypeInput;
