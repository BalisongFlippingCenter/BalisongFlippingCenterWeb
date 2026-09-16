import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { importCatalog } from "../../api/adminCatalogApi";
import { addUIToast } from "../../redux/uiToast/uiToastSlice";
import { useAppDispatch } from "../../redux/hooks";

const PLACEHOLDER = `{
  "makers": [
    { "slug": "squid-industries", "name": "Squid Industries", "country": "USA" }
  ],
  "knives": [
    { "slug": "...", "name": "...", "makerSlug": "squid-industries", "versions": [] }
  ]
}`;

const AdminCatalogImportPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    setError(null);
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      setError("That's not valid JSON.");
      return;
    }

    setIsSubmitting(true);
    importCatalog(payload)
      .then(() => {
        dispatch(addUIToast({ type: "success", message: "Catalog import complete." }));
        navigate("/admin/catalog");
      })
      .catch((err) => {
        const msg = err?.response?.data;
        setError(typeof msg === "string" ? msg : "Import failed. Check the console/logs for details.");
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div className="px-8 py-8 max-w-3xl">
      <Link to="/admin/catalog" className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-4 transition-colors duration-150 w-fit">
        <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
        Back to Catalog
      </Link>

      <h1 className="text-white text-2xl font-bold">Bulk Import</h1>
      <p className="text-white/40 text-sm mt-1">
        Paste JSON in the same shape as the seed files (<code className="text-white/60">makers</code> and/or{" "}
        <code className="text-white/60">knives</code> arrays). Upserts by slug — safe to re-run after fixing a mistake.
      </p>

      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={20}
        spellCheck={false}
        className="mt-5 w-full bg-dark-neutral border border-white/10 focus:border-blue-primary rounded-lg text-white text-sm font-mono px-4 py-3 outline-none transition-colors duration-200 placeholder:text-white/20 resize-y"
      />

      {error && <p className="text-red text-sm mt-3">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || !raw.trim()}
        className="mt-4 px-6 py-2.5 rounded-lg bg-blue-primary text-white text-sm font-semibold hover:brightness-110 transition-[filter] duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Importing..." : "Import"}
      </button>
    </div>
  );
};

export default AdminCatalogImportPage;
