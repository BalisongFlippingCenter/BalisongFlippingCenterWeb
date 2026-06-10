import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../redux/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faCamera, faCheck, faUpload } from "@fortawesome/free-solid-svg-icons";
import { axiosApiInstanceAuth } from "../../api/axios";
import { updateCollectionKnife } from "../../redux/collection/collectionSlice";
import { mapCollectionKnife } from "../../redux/collection/collectionActions";
import Image from "../Image";

interface params {
  knifeId: string;
  currentCoverPhoto: string | null;
  displayName: string;
  galleryImages?: string[];
}

const CollectionKnifeCoverConfiguration = ({
  knifeId,
  currentCoverPhoto,
  displayName,
  galleryImages = [],
}: params) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Two mutually exclusive selection modes
  const [selectedFile, setSelectedFile]             = useState<File | null>(null);
  const [selectedGalleryImg, setSelectedGalleryImg] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError]     = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const hasCurrent    = !!currentCoverPhoto && currentCoverPhoto !== "";
  const previewSrc    = selectedFile ? URL.createObjectURL(selectedFile) : null;
  const hasSelection  = !!selectedFile || !!selectedGalleryImg;

  const handleFileChange = (files: FileList | null) => {
    if (!files?.[0]) return;
    setSelectedFile(files[0]);
    setSelectedGalleryImg(null); // clear gallery selection
    setIsError(false);
  };

  const handleGallerySelect = (url: string) => {
    setSelectedGalleryImg((prev) => (prev === url ? null : url)); // toggle
    setSelectedFile(null); // clear file selection
    setIsError(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSelection) return;

    setIsLoading(true);
    setIsError(false);

    try {
      const fd = new FormData();
      if (selectedFile) {
        fd.append("file", selectedFile);
      } else if (selectedGalleryImg) {
        fd.append("existingUrl", selectedGalleryImg);
      }

      const res = await axiosApiInstanceAuth.request({
        url: `/collection/me/update-knife/${knifeId}/cover-photo`,
        method: "post",
        data: fd,
        headers: { "Content-Type": "multipart/form-data" },
      });

      dispatch(updateCollectionKnife(mapCollectionKnife(res.data)));
      navigate(-1);
    } catch (err) {
      console.error(err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">

      {/* ── Current cover ── */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-white/40 uppercase tracking-wider font-medium">Current</span>
        <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-[#1c1f27] flex items-center justify-center">
          {hasCurrent ? (
            <Image imageId={currentCoverPhoto} />
          ) : (
            <div className="flex flex-col items-center gap-2 text-white/20">
              <FontAwesomeIcon icon={faImage} className="text-3xl" />
              <span className="text-xs">No cover photo</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Pick from Gallery ── */}
      <div className="flex flex-col gap-3">
        <span className="text-xs text-white/40 uppercase tracking-wider font-medium">
          Pick from Gallery
        </span>

        {galleryImages.length === 0 ? (
          <div className="w-full rounded-2xl border border-dashed border-white/10 bg-[#13161d] px-6 py-10 flex flex-col items-center justify-center gap-3 text-center">
            <FontAwesomeIcon icon={faImage} className="text-white/15 text-3xl" />
            <div>
              <p className="text-white/30 text-sm font-medium">No gallery photos yet</p>
              <p className="text-white/20 text-xs mt-1">
                Upload photos to this knife's gallery to select from here.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {galleryImages.map((url, i) => {
              const isSelected = selectedGalleryImg === url;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleGallerySelect(url)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                    isSelected
                      ? "border-blue-primary shadow-[0_0_12px_2px_rgba(16,129,152,0.4)]"
                      : "border-transparent hover:border-white/20"
                  }`}
                >
                  <img src={url} className="w-full h-full object-cover" alt={`gallery ${i}`} />
                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-primary/20 flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-blue-primary flex items-center justify-center">
                        <FontAwesomeIcon icon={faCheck} className="text-white text-xs" />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Upload new photo ── */}
      <div className="flex flex-col gap-3">
        <span className="text-xs text-white/40 uppercase tracking-wider font-medium">
          Upload New Photo
        </span>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`w-full aspect-[4/3] rounded-2xl border border-dashed bg-[#13161d] hover:bg-[#1a1d25] transition-colors duration-200 overflow-hidden relative group ${
            selectedFile
              ? "border-blue-primary/50"
              : "border-white/20 hover:border-blue-primary/50"
          }`}
        >
          {previewSrc ? (
            <>
              <img src={previewSrc} className="w-full h-full object-cover" alt="preview" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faUpload} className="text-white text-sm" />
                <span className="text-white text-sm font-medium">Change Selection</span>
              </div>
              {/* Selected indicator */}
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-primary flex items-center justify-center">
                <FontAwesomeIcon icon={faCheck} className="text-white text-[10px]" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 h-full text-white/30 group-hover:text-white/50 transition-colors duration-200">
              <FontAwesomeIcon icon={faCamera} className="text-3xl" />
              <span className="text-sm font-medium">Select a photo to upload</span>
              <span className="text-xs text-white/20">JPEG or PNG</span>
            </div>
          )}
        </button>

        <input
          type="file"
          hidden
          ref={fileInputRef}
          accept="image/jpeg, image/png"
          onChange={(e) => handleFileChange(e.target.files)}
        />
      </div>

      {/* ── Error ── */}
      {isError && (
        <p className="text-red text-sm font-medium">Something went wrong. Please try again.</p>
      )}

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={!hasSelection || isLoading}
        className="w-full py-3 rounded-xl bg-blue-primary text-white text-sm font-semibold hover:bg-blue-primary/80 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isLoading ? "Saving…" : `Save Cover Photo for ${displayName}`}
      </button>

    </form>
  );
};

export default CollectionKnifeCoverConfiguration;
