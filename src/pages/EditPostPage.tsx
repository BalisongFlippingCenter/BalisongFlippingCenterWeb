import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft, faChevronDown, faCrown, faImage,
} from "@fortawesome/free-solid-svg-icons";
import { axiosApiInstance, axiosApiInstanceAuth } from "../api/axios";
import { PostDetail, mapPostDetail } from "../modals/Post";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { addUIToast } from "../redux/uiToast/uiToastSlice";

const EditPostPage = () => {
  const { postId }       = useParams<{ postId: string }>();
  const navigate         = useNavigate();
  const dispatch         = useAppDispatch();
  const collectionKnives = useAppSelector((s) => s.collection.collectionKnives);
  const collectionData   = useAppSelector((s) => s.collection.collection);

  const [post,            setPost]            = useState<PostDetail | null>(null);
  const [isLoading,       setIsLoading]       = useState(true);
  const [fetchError,      setFetchError]      = useState(false);

  // Edit fields
  const [caption,         setCaption]         = useState("");
  const [description,     setDescription]     = useState("");
  const [knifeId,         setKnifeId]         = useState<string | null>(null);
  const [fileDescs,       setFileDescs]       = useState<string[]>([]);
  const [fileKnifeIds,    setFileKnifeIds]    = useState<(string | null)[]>([]);
  const [activeFile,      setActiveFile]      = useState(0);
  const [knifePickerOpen, setKnifePickerOpen] = useState(false);

  const [isSaving,  setIsSaving]  = useState(false);
  const [saveError, setSaveError] = useState("");

  const captionRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!captionRef.current) return;
    captionRef.current.style.height = "auto";
    captionRef.current.style.height = captionRef.current.scrollHeight + "px";
  }, [caption]);

  useEffect(() => {
    if (!postId) { setFetchError(true); setIsLoading(false); return; }
    axiosApiInstance
      .get(`/posts/any/${postId}`)
      .then((res) => {
        const p = mapPostDetail(res.data);
        setPost(p);
        setCaption(p.caption ?? "");
        setDescription(p.description ?? "");
        setKnifeId(p.referenceKnife?.id ?? null);
        setFileDescs(p.mediaFiles.map((m) => m.description ?? ""));
        setFileKnifeIds(p.mediaFiles.map((m) =>
          m.referenceKnifeId !== null ? String(m.referenceKnifeId) : null
        ));
      })
      .catch(() => setFetchError(true))
      .finally(() => setIsLoading(false));
  }, [postId]);

  const isGeneric = post?.postType === "GENERIC";

  const activeKnifeId = isGeneric ? fileKnifeIds[activeFile] : knifeId;
  const activeKnife   = activeKnifeId
    ? (collectionKnives.find((k) => String(k.id) === activeKnifeId) ?? null)
    : null;

  const setActiveKnifeId = (id: string | null) => {
    if (isGeneric) {
      const next = [...fileKnifeIds];
      next[activeFile] = id;
      setFileKnifeIds(next);
    } else {
      setKnifeId(id);
    }
  };

  const handleSave = async () => {
    if (!post) return;
    setIsSaving(true);
    setSaveError("");
    try {
      const payload: Record<string, any> = { caption };
      if (isGeneric) {
        payload.fileMetadata = JSON.stringify(
          post.mediaFiles.map((_, i) => ({
            description:      fileDescs[i]?.trim() || null,
            referenceKnifeId: fileKnifeIds[i] ?? null,
          }))
        );
      } else {
        payload.description      = description.trim() || null;
        payload.referenceKnifeId = knifeId ?? null;
      }
      await axiosApiInstanceAuth.patch(`/posts/${post.id}`, payload);
      dispatch(addUIToast({ type: "success", message: "Post updated!" }));
      navigate(-1);
    } catch {
      setSaveError("Failed to save. Please try again.");
      setIsSaving(false);
    }
  };

  // ── Loading / error ─────────────────────────────────────────────────────────

  const topBar = (
    <div className="flex items-center gap-3 px-4 pt-4 pb-4 border-b border-white/[0.06] flex-shrink-0">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-colors duration-200 flex-shrink-0"
      >
        <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
      </button>
      <div className="min-w-0">
        <h1 className="text-white font-bold text-xl leading-tight">Edit Post</h1>
        {post && <p className="text-white/35 text-xs truncate">#{postId}</p>}
      </div>
    </div>
  );

  if (isLoading) return (
    <div className="w-full min-h-screen flex flex-col bg-[#080a0e]">
      {topBar}
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="w-6 h-6 rounded-full border-2 border-blue-primary border-t-transparent animate-spin" />
      </div>
    </div>
  );

  if (fetchError || !post) return (
    <div className="w-full min-h-screen flex flex-col bg-[#080a0e]">
      {topBar}
      <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-white/40 text-sm">Failed to load post.</p>
        <button type="button" onClick={() => navigate(-1)} className="text-blue-primary text-xs hover:text-blue-primary/70 transition-colors">
          Go back
        </button>
      </div>
    </div>
  );

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#080a0e]">
      {topBar}

      <div className="flex-1 xsm:px-4 lg:px-8 py-6 xsm:pb-48 md:pb-24">
        <div className="w-full max-w-[600px] mx-auto flex flex-col gap-4">

          {/* Caption */}
          <div className="bg-[#13161d] border border-white/10 rounded-2xl overflow-hidden px-5 py-4">
            <p className="text-white/35 text-[11px] uppercase tracking-wider font-medium mb-3">Caption</p>
            <textarea
              ref={captionRef}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={1}
              placeholder="Add a caption…"
              className="w-full resize-none focus:outline-none leading-relaxed overflow-hidden appearance-none"
              style={{ background: "transparent", color: "rgba(255,255,255,0.9)", fontSize: "1rem", lineHeight: "1.6" }}
            />
          </div>

          {/* Per-file (Generic) or single description */}
          {isGeneric && post.mediaFiles.length > 0 ? (
            <div className="bg-[#13161d] border border-white/10 rounded-2xl">
              <div className="px-4 pt-4 pb-2 border-b border-white/[0.06] rounded-t-2xl">
                <p className="text-white/50 text-[11px] uppercase tracking-wider font-medium">Per-Image Details</p>
              </div>

              {/* Thumbnail tabs */}
              {post.mediaFiles.length > 1 && (
                <div className="flex gap-2 px-4 pt-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                  {post.mediaFiles.map((m, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setActiveFile(i); setKnifePickerOpen(false); }}
                      className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all duration-150 ${
                        i === activeFile ? "border-blue-primary" : "border-white/10 opacity-50 hover:opacity-80"
                      }`}
                    >
                      {m.isVideo
                        ? <video src={m.url} muted playsInline className="w-full h-full object-cover" />
                        : <img src={m.url} alt="" className="w-full h-full object-cover" />
                      }
                    </button>
                  ))}
                </div>
              )}

              <div className="px-4 py-4 flex flex-col gap-4">
                {/* Description for active file */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-white/30 uppercase tracking-wider font-medium">
                    Description{post.mediaFiles.length > 1 ? ` — Image ${activeFile + 1}` : ""}
                  </label>
                  <textarea
                    key={activeFile}
                    value={fileDescs[activeFile] ?? ""}
                    onChange={(e) => {
                      const next = [...fileDescs];
                      next[activeFile] = e.target.value;
                      setFileDescs(next);
                    }}
                    rows={3}
                    placeholder="Add a description for this image…"
                    className="w-full bg-[#0e1016] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 resize-none focus:outline-none focus:border-blue-primary/40 transition-colors duration-200"
                  />
                </div>

                {/* Knife picker for active file */}
                <KnifePicker
                  label={post.mediaFiles.length > 1 ? `Reference Knife — Image ${activeFile + 1}` : "Reference Knife"}
                  activeKnife={activeKnife}
                  knives={collectionKnives}
                  featuredKnifeId={collectionData?.featuredKnifeId}
                  pickerOpen={knifePickerOpen}
                  onTogglePicker={() => setKnifePickerOpen((p) => !p)}
                  onSelect={(id) => { setActiveKnifeId(id); setKnifePickerOpen(false); }}
                  onRemove={() => setActiveKnifeId(null)}
                />
              </div>
            </div>
          ) : (
            <div className="bg-[#13161d] border border-white/10 rounded-2xl">
              <div className="px-4 pt-4 pb-2 border-b border-white/[0.06] rounded-t-2xl">
                <p className="text-white/50 text-[11px] uppercase tracking-wider font-medium">Description</p>
              </div>
              <div className="px-4 py-4 flex flex-col gap-4">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Add a description…"
                  className="w-full bg-[#0e1016] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 resize-none focus:outline-none focus:border-blue-primary/40 transition-colors duration-200"
                />

                <KnifePicker
                  label="Reference Knife"
                  activeKnife={activeKnife}
                  knives={collectionKnives}
                  featuredKnifeId={collectionData?.featuredKnifeId}
                  pickerOpen={knifePickerOpen}
                  onTogglePicker={() => setKnifePickerOpen((p) => !p)}
                  onSelect={(id) => { setKnifeId(id); setKnifePickerOpen(false); }}
                  onRemove={() => setKnifeId(null)}
                />
              </div>
            </div>
          )}

          {saveError && (
            <p className="text-red text-xs px-1">{saveError}</p>
          )}
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-24 left-0 right-0 z-[60] bg-[#080a0e]/90 backdrop-blur-md border-t border-white/[0.06] px-4 py-4 flex gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          disabled={isSaving}
          className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/5 transition-colors duration-200 disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 py-3 rounded-xl bg-blue-primary text-white text-sm font-semibold hover:bg-blue-primary/80 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving
            ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            : "Save Changes"
          }
        </button>
      </div>
    </div>
  );
};

// ── Knife picker sub-component ────────────────────────────────────────────────

const KnifePicker = ({
  label, activeKnife, knives, featuredKnifeId, pickerOpen, onTogglePicker, onSelect, onRemove,
}: {
  label: string;
  activeKnife: any;
  knives: any[];
  featuredKnifeId?: string | null;
  pickerOpen: boolean;
  onTogglePicker: () => void;
  onSelect: (id: string) => void;
  onRemove: () => void;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] text-white/30 uppercase tracking-wider font-medium">{label}</label>

    {activeKnife && (
      <div className="flex items-center gap-3 bg-[#0e1016] border border-white/10 rounded-xl overflow-hidden pr-3">
        <div className="w-12 h-12 flex-shrink-0 overflow-hidden">
          {activeKnife.coverPhoto
            ? <img src={activeKnife.coverPhoto} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-[#13161d] flex items-center justify-center">
                <FontAwesomeIcon icon={faImage} className="text-white/15 text-sm" />
              </div>
          }
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <p className="text-white text-sm font-medium truncate">{activeKnife.displayName}</p>
          <p className="text-white/40 text-xs truncate">
            {activeKnife.knifeMaker}{activeKnife.baseKnifeModel ? ` · ${activeKnife.baseKnifeModel}` : ""}
          </p>
        </div>
        <button type="button" onClick={onRemove} className="text-white/30 hover:text-white/70 text-xs transition-colors flex-shrink-0">
          Remove
        </button>
      </div>
    )}

    <div className="relative">
      <button
        type="button"
        onClick={onTogglePicker}
        disabled={knives.length === 0}
        className="w-full flex items-center justify-between bg-[#0e1016] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/40 hover:text-white/70 hover:border-white/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span>{knives.length === 0 ? "No knives in collection" : activeKnife ? "Change knife…" : "Select a knife…"}</span>
        <FontAwesomeIcon icon={faChevronDown} className={`text-xs transition-transform duration-200 ${pickerOpen ? "rotate-180" : ""}`} />
      </button>

      {pickerOpen && knives.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#13161d] border border-white/10 rounded-xl overflow-hidden z-20 shadow-xl max-h-52 overflow-y-auto">
          {knives.map((knife) => {
            const isFeatured = !!featuredKnifeId && String(knife.id) === String(featuredKnifeId);
            const isSelected = String(knife.id) === (activeKnife ? String(activeKnife.id) : null);
            return (
              <button
                key={knife.id}
                type="button"
                onClick={() => onSelect(String(knife.id))}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-white/[0.04] last:border-0 transition-colors duration-150 ${
                  isSelected ? "bg-blue-primary/10" : isFeatured ? "hover:bg-gold/10" : "hover:bg-white/5"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border ${isFeatured ? "border-gold/40" : isSelected ? "border-blue-primary/40" : "border-white/10"}`}>
                  {knife.coverPhoto
                    ? <img src={knife.coverPhoto} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-[#1c1f27] to-[#0d0f14]" />
                  }
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    {isFeatured && <FontAwesomeIcon icon={faCrown} className="text-gold text-[9px] flex-shrink-0" />}
                    <span className={`text-sm font-medium truncate ${isFeatured ? "text-gold" : isSelected ? "text-blue-primary" : "text-white"}`}>
                      {knife.displayName}
                    </span>
                  </div>
                  <span className="text-white/40 text-xs truncate">
                    {knife.knifeMaker}{knife.baseKnifeModel ? ` · ${knife.baseKnifeModel}` : ""}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  </div>
);

export default EditPostPage;
