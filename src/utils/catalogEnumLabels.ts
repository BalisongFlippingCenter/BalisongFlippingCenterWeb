// The catalog read API (GET /catalog/any/knives/:slug etc.) returns raw backend
// enum names (e.g. "SPEAR_POINT", "G_10_TITANIUM"), but the admin form's <select>
// dropdowns use the same display strings as the personal-collection combo boxes
// (e.g. "Spear Point", "G-10/Titanium"). These maps convert enum name -> display
// string for prefilling an edit form -- without this, an untouched field would
// show blank on edit and silently submit as empty (deleting the existing value)
// rather than preserving it.

export const BLADE_STYLE_LABELS: Record<string, string> = {
  TANTO: "Tanto",
  BOWIE: "Bowie",
  KUKRI: "Kukri",
  JAPANESE_TANTO: "Japanese Tanto",
  SPEAR_POINT: "Spear Point",
  WEEHAWK: "Weehawk",
  AMERICAN_TANTO: "American Tanto",
  HORSE_SHOE: "Horse Shoe",
  CLIP_POINT: "Clip Point",
  DROP_POINT: "Drop Point",
  WHARNCLIFFE: "Wharncliffe",
  SHEEPSFOOT: "Sheepsfoot",
  DAGGER: "Dagger",
  OTHER: "Other",
  UNKNOWN: "Unknown",
};

export const BLADE_MATERIAL_LABELS: Record<string, string> = {
  ALUMINIUM: "Aluminium",
  STAINLESS_STEEL: "Stainless Steel",
  TITANIUM: "Titanium",
  D2: "D2",
  S35VN: "s35vn",
  S32VN: "s32vn",
  ALUMINIUM_6061: "6061 Aluminium",
  HARDENED_STEEL: "Hardened Steel",
  PLASTIC: "Plastic",
  ALUMINIUM_7075: "7075 Aluminium",
  M390: "M390",
  ELMAX: "Elmax",
  STEEL_154CM: "154CM",
  STEEL_14C28N: "14C28N",
  MAGNACUT: "MagnaCut",
  DAMASCUS: "Damascus",
  AUS_10: "AUS-10",
  AEB_L: "AEB-L",
  STEEL_12C27: "12C27",
  STEEL_440C: "440C",
  OTHER: "Other",
  UNKNOWN: "Unknown",
};

export const BLADE_FINISH_LABELS: Record<string, string> = {
  SATIN: "Satin",
  STONE_WASH: "Stonewash",
  DUALTONE: "Dualtone",
  ACID_WASH: "Acidwash",
  DLC: "DLC",
  PLAIN: "Plain",
  POLISHED: "Polished",
  MIRROR_POLISHED: "Mirror Polished",
  BLACK_WASH: "Black Wash",
  BEAD_BLASTED: "Bead Blasted",
  PVD: "PVD",
  OTHER: "Other",
  UNKNOWN: "Unknown",
};

export const HANDLE_MATERIAL_LABELS: Record<string, string> = {
  TITANIUM: "Titanium",
  ALUMINIUM: "Aluminium",
  STAINLESS_STEEL: "Stainless Steel",
  ALUMINIUM_6061: "6061 Aluminium",
  ALUMINIUM_7075: "7075 Aluminium",
  G_10: "G-10",
  G_10_TITANIUM: "G-10/Titanium",
  G_10_ALUMINIUM: "G-10/Aluminium",
  CARBON_FIBER: "Carbon Fiber",
  PLASTIC: "Plastic",
  BRASS: "Brass",
  COPPER: "Copper",
  OTHER: "Other",
  UNKNOWN: "Unknown",
};

export const HANDLE_FINISH_LABELS: Record<string, string> = {
  PLAIN: "Plain",
  STONE_WASH: "Stonewash",
  BEAD_BLASTED: "Beadblasted",
  ZIR_BLASTED: "Zirblasted",
  SATIN: "Satin",
  POLISHED: "Polish",
  MIRROR_POLISHED: "Mirror Polish",
  BLACK_WASH: "Blackwash",
  ACID_WASHED: "Acidwash",
  ANODIZED: "Anodized",
  OTHER: "Other",
  UNKNOWN: "Unknown",
};

export const HANDLE_CONSTRUCTION_LABELS: Record<string, string> = {
  CHANNEL: "Chanel",
  SANDWHICH: "Sandwhich",
  CHANWHICH: "Chanwhich",
  OTHER: "Other",
  UNKNOWN: "Unknown",
};

export const PIVOT_SYSTEM_LABELS: Record<string, string> = {
  BUSHINGS: "Bushings",
  WASHERS: "Washers",
  BEARINGS: "Bearings",
  OTHER: "Other",
  UNKNOWN: "Unknown",
};

export const LATCH_TYPE_LABELS: Record<string, string> = {
  LATCHLESS: "No Latch",
  SPRING_LATCH: "Spring Latch",
  SWING_LATCH: "Swing Latch",
  OTHER: "Other",
  UNKNOWN: "Unknown",
};

export const PIN_SYSTEM_LABELS: Record<string, string> = {
  ZEN_PINS: "Zen Pins",
  TANG_PINS: "Tang Pins",
  PINSLESS: "Pinless",
  HIDDEN_ZEN_PINS: "Hidden Zen Pins",
  OTHER: "Other",
  UNKNOWN: "Unknown",
};

export const enumToLabel = (map: Record<string, string>, value: string | null | undefined): string =>
  value ? (map[value] ?? "") : "";
