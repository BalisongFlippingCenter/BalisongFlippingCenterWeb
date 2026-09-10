import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  getKnife, createKnife, updateKnife, listMakers,
  KnifeFormData, VersionFormData, VariantFormData, WhereToFindFormData, MakerSummary,
} from "../../api/adminCatalogApi";
import { addUIToast } from "../../redux/uiToast/uiToastSlice";
import { useAppDispatch } from "../../redux/hooks";
import { bladeStyle as BLADE_STYLE_OPTIONS } from "../../comboBoxData/BladeStyle";
import { bladeMaterial as BLADE_MATERIAL_OPTIONS } from "../../comboBoxData/BladeMaterial";
import { bladeFinish as BLADE_FINISH_OPTIONS } from "../../comboBoxData/BladeFinish";
import { handleMaterial as HANDLE_MATERIAL_OPTIONS } from "../../comboBoxData/HandleMaterial";
import { handleFinish as HANDLE_FINISH_OPTIONS } from "../../comboBoxData/HandleFinish";
import { handleConstruction as HANDLE_CONSTRUCTION_OPTIONS } from "../../comboBoxData/HandleConstruction";
import { pivotSystem as PIVOT_SYSTEM_OPTIONS } from "../../comboBoxData/PivotSystem";
import { latchType as LATCH_TYPE_OPTIONS } from "../../comboBoxData/LatchType";
import { pinSystem as PIN_SYSTEM_OPTIONS } from "../../comboBoxData/PinSystem";
import {
  BLADE_STYLE_LABELS, BLADE_MATERIAL_LABELS, BLADE_FINISH_LABELS,
  HANDLE_MATERIAL_LABELS, HANDLE_FINISH_LABELS, HANDLE_CONSTRUCTION_LABELS,
  PIVOT_SYSTEM_LABELS, LATCH_TYPE_LABELS, PIN_SYSTEM_LABELS, enumToLabel,
} from "../../utils/catalogEnumLabels";

const WHERE_TO_FIND_TYPES = ["official", "retailer", "secondary"];
const VARIANT_TYPES = ["trainer", "live"];

const FIELD_LABEL = "text-xs text-white/50 font-medium uppercase tracking-wide";
const FIELD_INPUT = "w-full bg-dark-neutral border border-white/10 focus:border-blue-primary rounded-lg text-white text-sm px-3 py-2 outline-none transition-colors duration-200 placeholder:text-white/25 disabled:opacity-50";

const emptyWhereToFind = (): WhereToFindFormData => ({ label: "", url: "", type: "official", note: "" });
const emptyVariant = (): VariantFormData => ({
  variantSlug: "", type: "live", label: "", msrp: "", bladeStyle: "", bladeMaterial: "", bladeFinish: "",
});
const emptyVersion = (): VersionFormData => ({
  versionSlug: "", version: "", discontinued: false, releaseYear: null, description: "",
  overallLength: "", weight: "", pivotSystem: "", latchType: "", pinSystem: "",
  hasModularBalance: false, balanceValue: "", handleConstruction: "", handleMaterial: "", handleFinish: "",
  variants: [emptyVariant()], whereToFind: [],
});
const emptyKnife = (): KnifeFormData => ({
  slug: "", name: "", maker: "", makerSlug: "", bladeStyle: "", priceRange: "",
  coverPhotoUrl: "", description: "", versions: [],
});

const mapDetailToForm = (data: any): KnifeFormData => ({
  slug: data.slug,
  name: data.name,
  maker: data.makerName ?? "",
  makerSlug: data.makerSlug,
  bladeStyle: "",
  priceRange: "",
  coverPhotoUrl: data.coverPhotoUrl ?? "",
  description: data.description ?? "",
  versions: (data.versions ?? []).map((v: any) => ({
    versionSlug: v.versionSlug,
    version: v.versionLabel,
    discontinued: !!v.discontinued,
    releaseYear: v.releaseYear ?? null,
    description: v.description ?? "",
    overallLength: v.overallLength != null ? String(v.overallLength) : "",
    weight: v.weight != null ? String(v.weight) : "",
    pivotSystem: enumToLabel(PIVOT_SYSTEM_LABELS, v.pivotSystem),
    latchType: enumToLabel(LATCH_TYPE_LABELS, v.latchType),
    pinSystem: enumToLabel(PIN_SYSTEM_LABELS, v.pinSystem),
    hasModularBalance: !!v.hasModularBalance,
    balanceValue: v.balanceValue ?? "",
    handleConstruction: enumToLabel(HANDLE_CONSTRUCTION_LABELS, v.handleConstruction),
    handleMaterial: enumToLabel(HANDLE_MATERIAL_LABELS, v.handleMaterial),
    handleFinish: enumToLabel(HANDLE_FINISH_LABELS, v.handleFinish),
    variants: (v.variants ?? []).map((variant: any) => ({
      variantSlug: variant.variantSlug,
      type: variant.type === "LIVE_BLADE" ? "live" : "trainer",
      label: variant.label,
      msrp: variant.msrp != null ? String(variant.msrp) : "",
      bladeStyle: enumToLabel(BLADE_STYLE_LABELS, variant.bladeStyle),
      bladeMaterial: enumToLabel(BLADE_MATERIAL_LABELS, variant.bladeMaterial),
      bladeFinish: enumToLabel(BLADE_FINISH_LABELS, variant.bladeFinish),
    })),
    whereToFind: (v.whereToFind ?? []).map((w: any) => ({
      label: w.label,
      url: w.url ?? "",
      type: (w.type ?? "OFFICIAL").toLowerCase(),
      note: w.note ?? "",
    })),
  })),
});

const Select = ({ value, onChange, options, disabled }: { value: string; onChange: (v: string) => void; options: string[]; disabled?: boolean }) => (
  <select disabled={disabled} value={value} onChange={(e) => onChange(e.target.value)} className={FIELD_INPUT}>
    <option value="">—</option>
    {options.map((o) => <option key={o} value={o}>{o}</option>)}
  </select>
);

const AdminKnifeFormPage = () => {
  const { slug } = useParams<{ slug?: string }>();
  const isEdit = !!slug;
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [form, setForm] = useState<KnifeFormData>(emptyKnife());
  const [makers, setMakers] = useState<MakerSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const makersPromise = listMakers().then(setMakers);
    const knifePromise = isEdit && slug ? getKnife(slug).then((data) => setForm(mapDetailToForm(data))) : Promise.resolve();

    Promise.all([makersPromise, knifePromise])
      .catch(() => dispatch(addUIToast({ type: "error", message: "Failed to load form data." })))
      .finally(() => setIsLoading(false));
  }, [isEdit, slug]);

  const updateVersion = (vi: number, patch: Partial<VersionFormData>) => {
    setForm((prev) => ({
      ...prev,
      versions: prev.versions.map((v, i) => (i === vi ? { ...v, ...patch } : v)),
    }));
  };

  const addVersion = () => setForm((prev) => ({ ...prev, versions: [...prev.versions, emptyVersion()] }));
  const removeVersion = (vi: number) => setForm((prev) => ({ ...prev, versions: prev.versions.filter((_, i) => i !== vi) }));

  const updateVariant = (vi: number, ci: number, patch: Partial<VariantFormData>) => {
    updateVersion(vi, {
      variants: form.versions[vi].variants.map((c, i) => (i === ci ? { ...c, ...patch } : c)),
    });
  };
  const addVariant = (vi: number) => updateVersion(vi, { variants: [...form.versions[vi].variants, emptyVariant()] });
  const removeVariant = (vi: number, ci: number) => updateVersion(vi, { variants: form.versions[vi].variants.filter((_, i) => i !== ci) });

  const updateWhereToFind = (vi: number, wi: number, patch: Partial<WhereToFindFormData>) => {
    updateVersion(vi, {
      whereToFind: form.versions[vi].whereToFind.map((w, i) => (i === wi ? { ...w, ...patch } : w)),
    });
  };
  const addWhereToFind = (vi: number) => updateVersion(vi, { whereToFind: [...form.versions[vi].whereToFind, emptyWhereToFind()] });
  const removeWhereToFind = (vi: number, wi: number) => updateVersion(vi, { whereToFind: form.versions[vi].whereToFind.filter((_, i) => i !== wi) });

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!form.slug.trim() || !form.name.trim() || !form.makerSlug) return;

    setIsSaving(true);
    const action = isEdit ? updateKnife(slug!, form) : createKnife(form);
    action
      .then(() => {
        dispatch(addUIToast({ type: "success", message: `Knife ${isEdit ? "updated" : "created"}.` }));
        navigate("/admin/catalog");
      })
      .catch((err) => {
        const msg = err?.response?.data;
        dispatch(addUIToast({ type: "error", message: typeof msg === "string" ? msg : "Failed to save knife." }));
      })
      .finally(() => setIsSaving(false));
  };

  if (isLoading) {
    return <div className="px-8 py-8"><p className="text-white/40 text-sm">Loading...</p></div>;
  }

  return (
    <div className="px-8 py-8 max-w-4xl">
      <Link to="/admin/catalog" className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-4 transition-colors duration-150 w-fit">
        <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
        Back to Catalog
      </Link>

      <h1 className="text-white text-2xl font-bold">{isEdit ? `Edit ${form.name || "Knife"}` : "New Knife"}</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-8">
        {/* Knife-level fields */}
        <div className="flex flex-col gap-4 p-5 rounded-xl border border-white/[0.08] bg-dark-neutral-offset">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={FIELD_LABEL}>Slug</label>
              <input disabled={isEdit} required value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} className={FIELD_INPUT} placeholder="krake-raken" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={FIELD_LABEL}>Name</label>
              <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={FIELD_INPUT} placeholder="Krake Raken" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={FIELD_LABEL}>Maker</label>
              <select
                required
                value={form.makerSlug}
                onChange={(e) => setForm((p) => ({ ...p, makerSlug: e.target.value }))}
                className={FIELD_INPUT}
              >
                <option value="">Select a maker...</option>
                {makers.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={FIELD_LABEL}>Cover Photo URL</label>
              <input value={form.coverPhotoUrl} onChange={(e) => setForm((p) => ({ ...p, coverPhotoUrl: e.target.value }))} className={FIELD_INPUT} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={FIELD_LABEL}>Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={`${FIELD_INPUT} resize-none`} />
          </div>

          {makers.length === 0 && (
            <p className="text-gold text-xs">No makers exist yet — <Link to="/admin/catalog/makers/new" className="underline">create one first</Link>.</p>
          )}
        </div>

        {/* Versions */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-lg font-semibold">Versions</h2>
            <button type="button" onClick={addVersion} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-white/60 text-xs font-medium hover:text-white hover:border-white/25 transition-colors duration-150">
              <FontAwesomeIcon icon={faPlus} className="text-[10px]" /> Add Version
            </button>
          </div>

          {form.versions.length === 0 && <p className="text-white/40 text-sm">No versions yet.</p>}

          {form.versions.map((version, vi) => (
            <div key={vi} className="flex flex-col gap-4 p-5 rounded-xl border border-white/[0.08] bg-dark-neutral-offset">
              <div className="flex items-center justify-between">
                <p className="text-white/70 text-sm font-semibold">Version {vi + 1}{version.version ? `: ${version.version}` : ""}</p>
                <button type="button" onClick={() => removeVersion(vi)} className="text-white/30 hover:text-red transition-colors duration-150">
                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={FIELD_LABEL}>Version Slug</label>
                  <input required value={version.versionSlug} onChange={(e) => updateVersion(vi, { versionSlug: e.target.value })} className={FIELD_INPUT} placeholder="v3" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={FIELD_LABEL}>Version Label</label>
                  <input required value={version.version} onChange={(e) => updateVersion(vi, { version: e.target.value })} className={FIELD_INPUT} placeholder="V3" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 items-end">
                <div className="flex flex-col gap-1.5">
                  <label className={FIELD_LABEL}>Release Year</label>
                  <input type="number" value={version.releaseYear ?? ""} onChange={(e) => updateVersion(vi, { releaseYear: e.target.value === "" ? null : Number(e.target.value) })} className={FIELD_INPUT} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={FIELD_LABEL}>Overall Length</label>
                  <input value={version.overallLength} onChange={(e) => updateVersion(vi, { overallLength: e.target.value })} className={FIELD_INPUT} placeholder="10.5" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={FIELD_LABEL}>Weight</label>
                  <input value={version.weight} onChange={(e) => updateVersion(vi, { weight: e.target.value })} className={FIELD_INPUT} placeholder="4.19" />
                </div>
              </div>

              <label className="flex items-center gap-2 text-white/60 text-sm cursor-pointer w-fit">
                <input type="checkbox" checked={version.discontinued} onChange={(e) => updateVersion(vi, { discontinued: e.target.checked })} className="accent-blue-primary" />
                Discontinued
              </label>

              <div className="flex flex-col gap-1.5">
                <label className={FIELD_LABEL}>Description</label>
                <textarea rows={2} value={version.description} onChange={(e) => updateVersion(vi, { description: e.target.value })} className={`${FIELD_INPUT} resize-none`} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={FIELD_LABEL}>Pivot System</label>
                  <Select value={version.pivotSystem} onChange={(v) => updateVersion(vi, { pivotSystem: v })} options={PIVOT_SYSTEM_OPTIONS} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={FIELD_LABEL}>Latch Type</label>
                  <Select value={version.latchType} onChange={(v) => updateVersion(vi, { latchType: v })} options={LATCH_TYPE_OPTIONS} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={FIELD_LABEL}>Pin System</label>
                  <Select value={version.pinSystem} onChange={(v) => updateVersion(vi, { pinSystem: v })} options={PIN_SYSTEM_OPTIONS} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={FIELD_LABEL}>Handle Construction</label>
                  <Select value={version.handleConstruction} onChange={(v) => updateVersion(vi, { handleConstruction: v })} options={HANDLE_CONSTRUCTION_OPTIONS} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={FIELD_LABEL}>Handle Material</label>
                  <Select value={version.handleMaterial} onChange={(v) => updateVersion(vi, { handleMaterial: v })} options={HANDLE_MATERIAL_OPTIONS} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={FIELD_LABEL}>Handle Finish</label>
                  <Select value={version.handleFinish} onChange={(v) => updateVersion(vi, { handleFinish: v })} options={HANDLE_FINISH_OPTIONS} />
                </div>
              </div>

              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 text-white/60 text-sm cursor-pointer w-fit pb-2.5">
                  <input type="checkbox" checked={version.hasModularBalance} onChange={(e) => updateVersion(vi, { hasModularBalance: e.target.checked })} className="accent-blue-primary" />
                  Modular Balance
                </label>
                {version.hasModularBalance && (
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className={FIELD_LABEL}>Balance Value</label>
                    <input value={version.balanceValue} onChange={(e) => updateVersion(vi, { balanceValue: e.target.value })} className={FIELD_INPUT} />
                  </div>
                )}
              </div>

              {/* Variants */}
              <div className="flex flex-col gap-3 mt-2 pt-4 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <p className={FIELD_LABEL}>Variants</p>
                  <button type="button" onClick={() => addVariant(vi)} className="flex items-center gap-1.5 text-blue-primary text-xs font-medium hover:brightness-125 transition-[filter] duration-150">
                    <FontAwesomeIcon icon={faPlus} className="text-[10px]" /> Add Variant
                  </button>
                </div>

                {version.variants.map((variant, ci) => (
                  <div key={ci} className="flex flex-col gap-3 p-4 rounded-lg border border-white/[0.06] bg-dark-neutral">
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-xs">Variant {ci + 1}</span>
                      <button type="button" onClick={() => removeVariant(vi, ci)} className="text-white/30 hover:text-red transition-colors duration-150">
                        <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <input required value={variant.variantSlug} onChange={(e) => updateVariant(vi, ci, { variantSlug: e.target.value })} className={FIELD_INPUT} placeholder="slug" />
                      <select value={variant.type} onChange={(e) => updateVariant(vi, ci, { type: e.target.value })} className={FIELD_INPUT}>
                        {VARIANT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input required value={variant.label} onChange={(e) => updateVariant(vi, ci, { label: e.target.value })} className={FIELD_INPUT} placeholder="label" />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <input value={variant.msrp} onChange={(e) => updateVariant(vi, ci, { msrp: e.target.value })} className={FIELD_INPUT} placeholder="MSRP" />
                      <Select value={variant.bladeStyle} onChange={(v) => updateVariant(vi, ci, { bladeStyle: v })} options={BLADE_STYLE_OPTIONS} disabled={variant.type === "trainer"} />
                      <Select value={variant.bladeMaterial} onChange={(v) => updateVariant(vi, ci, { bladeMaterial: v })} options={BLADE_MATERIAL_OPTIONS} />
                      <Select value={variant.bladeFinish} onChange={(v) => updateVariant(vi, ci, { bladeFinish: v })} options={BLADE_FINISH_OPTIONS} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Where To Find */}
              <div className="flex flex-col gap-3 pt-4 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <p className={FIELD_LABEL}>Where To Find</p>
                  <button type="button" onClick={() => addWhereToFind(vi)} className="flex items-center gap-1.5 text-blue-primary text-xs font-medium hover:brightness-125 transition-[filter] duration-150">
                    <FontAwesomeIcon icon={faPlus} className="text-[10px]" /> Add Link
                  </button>
                </div>

                {version.whereToFind.map((wtf, wi) => (
                  <div key={wi} className="flex flex-col gap-3 p-4 rounded-lg border border-white/[0.06] bg-dark-neutral">
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-xs">Link {wi + 1}</span>
                      <button type="button" onClick={() => removeWhereToFind(vi, wi)} className="text-white/30 hover:text-red transition-colors duration-150">
                        <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <input required value={wtf.label} onChange={(e) => updateWhereToFind(vi, wi, { label: e.target.value })} className={FIELD_INPUT} placeholder="label" />
                      <input value={wtf.url} onChange={(e) => updateWhereToFind(vi, wi, { url: e.target.value })} className={FIELD_INPUT} placeholder="url" />
                      <select value={wtf.type} onChange={(e) => updateWhereToFind(vi, wi, { type: e.target.value })} className={FIELD_INPUT}>
                        {WHERE_TO_FIND_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <input value={wtf.note} onChange={(e) => updateWhereToFind(vi, wi, { note: e.target.value })} className={FIELD_INPUT} placeholder="note (optional)" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={isSaving || !form.slug.trim() || !form.name.trim() || !form.makerSlug}
          className="w-fit px-6 py-2.5 rounded-lg bg-blue-primary text-white text-sm font-semibold hover:brightness-110 transition-[filter] duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Create Knife"}
        </button>
      </form>
    </div>
  );
};

export default AdminKnifeFormPage;
