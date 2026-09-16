import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { getMaker, createMaker, updateMaker, MakerFormData } from "../../api/adminCatalogApi";
import { addUIToast } from "../../redux/uiToast/uiToastSlice";
import { useAppDispatch } from "../../redux/hooks";

const EMPTY_FORM: MakerFormData = {
  slug: "",
  name: "",
  country: "",
  knownFor: "",
  officialSiteUrl: "",
  logoUrl: "",
  foundedYear: null,
  instagramUrl: "",
  youtubeUrl: "",
  facebookUrl: "",
  twitterUrl: "",
};

const FIELD_LABEL = "text-xs text-white/50 font-medium uppercase tracking-wide";
const FIELD_INPUT = "w-full bg-dark-neutral border border-white/10 focus:border-blue-primary rounded-lg text-white text-sm px-4 py-2.5 outline-none transition-colors duration-200 placeholder:text-white/25 disabled:opacity-50";

const AdminMakerFormPage = () => {
  const { slug } = useParams<{ slug?: string }>();
  const isEdit = !!slug;
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [form, setForm] = useState<MakerFormData>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEdit || !slug) return;
    getMaker(slug)
      .then((data: any) => {
        setForm({
          slug: data.slug ?? "",
          name: data.name ?? "",
          country: data.country ?? "",
          knownFor: data.knownFor ?? "",
          officialSiteUrl: data.officialSiteUrl ?? "",
          logoUrl: data.logoUrl ?? "",
          foundedYear: data.foundedYear ?? null,
          instagramUrl: data.instagramUrl ?? "",
          youtubeUrl: data.youtubeUrl ?? "",
          facebookUrl: data.facebookUrl ?? "",
          twitterUrl: data.twitterUrl ?? "",
        });
      })
      .catch(() => dispatch(addUIToast({ type: "error", message: "Failed to load maker." })))
      .finally(() => setIsLoading(false));
  }, [isEdit, slug]);

  const setField = (field: keyof MakerFormData, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!form.slug.trim() || !form.name.trim()) return;

    setIsSaving(true);
    const action = isEdit ? updateMaker(slug!, form) : createMaker(form);
    action
      .then(() => {
        dispatch(addUIToast({ type: "success", message: `Maker ${isEdit ? "updated" : "created"}.` }));
        navigate("/admin/catalog");
      })
      .catch((err) => {
        const msg = err?.response?.data ?? "Failed to save maker.";
        dispatch(addUIToast({ type: "error", message: typeof msg === "string" ? msg : "Failed to save maker." }));
      })
      .finally(() => setIsSaving(false));
  };

  if (isLoading) {
    return <div className="px-8 py-8"><p className="text-white/40 text-sm">Loading...</p></div>;
  }

  return (
    <div className="px-8 py-8 max-w-2xl">
      <Link to="/admin/catalog" className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-4 transition-colors duration-150 w-fit">
        <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
        Back to Catalog
      </Link>

      <h1 className="text-white text-2xl font-bold">{isEdit ? `Edit ${form.name || "Maker"}` : "New Maker"}</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_LABEL}>Slug</label>
            <input
              disabled={isEdit}
              required
              value={form.slug}
              onChange={(e) => setField("slug", e.target.value)}
              placeholder="squid-industries"
              className={FIELD_INPUT}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_LABEL}>Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Squid Industries"
              className={FIELD_INPUT}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_LABEL}>Country</label>
            <input
              value={form.country ?? ""}
              onChange={(e) => setField("country", e.target.value)}
              className={FIELD_INPUT}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_LABEL}>Founded Year</label>
            <input
              type="number"
              value={form.foundedYear ?? ""}
              onChange={(e) => setField("foundedYear", e.target.value === "" ? null : Number(e.target.value))}
              className={FIELD_INPUT}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={FIELD_LABEL}>Known For</label>
          <textarea
            rows={3}
            value={form.knownFor ?? ""}
            onChange={(e) => setField("knownFor", e.target.value)}
            className={`${FIELD_INPUT} resize-none`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_LABEL}>Logo URL</label>
            <input
              value={form.logoUrl ?? ""}
              onChange={(e) => setField("logoUrl", e.target.value)}
              className={FIELD_INPUT}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_LABEL}>Official Site URL</label>
            <input
              value={form.officialSiteUrl ?? ""}
              onChange={(e) => setField("officialSiteUrl", e.target.value)}
              className={FIELD_INPUT}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_LABEL}>Instagram URL</label>
            <input value={form.instagramUrl ?? ""} onChange={(e) => setField("instagramUrl", e.target.value)} className={FIELD_INPUT} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_LABEL}>YouTube URL</label>
            <input value={form.youtubeUrl ?? ""} onChange={(e) => setField("youtubeUrl", e.target.value)} className={FIELD_INPUT} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_LABEL}>Facebook URL</label>
            <input value={form.facebookUrl ?? ""} onChange={(e) => setField("facebookUrl", e.target.value)} className={FIELD_INPUT} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_LABEL}>Twitter/X URL</label>
            <input value={form.twitterUrl ?? ""} onChange={(e) => setField("twitterUrl", e.target.value)} className={FIELD_INPUT} />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving || !form.slug.trim() || !form.name.trim()}
          className="w-fit px-6 py-2.5 rounded-lg bg-blue-primary text-white text-sm font-semibold hover:brightness-110 transition-[filter] duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Create Maker"}
        </button>
      </form>
    </div>
  );
};

export default AdminMakerFormPage;
