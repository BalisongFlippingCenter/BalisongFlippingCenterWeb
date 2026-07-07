import { useEffect, useRef, useState } from "react";
import GalleryInputSelectedFilesFileCoverDisplay from "./GalleryInputSelectedFilesFileCoverDisplay";

const MAX_FILES            = 10;
const MAX_IMAGE_SIZE_MB    = 15;
const MAX_VIDEO_SIZE_MB    = 150;
const MAX_VIDEO_DURATION_S = 120;
const MAX_TOTAL_SIZE_MB    = 500;

const getVideoDuration = (file: File): Promise<number> =>
  new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => { URL.revokeObjectURL(video.src); resolve(video.duration); };
    video.onerror = () => reject();
    video.src = URL.createObjectURL(file);
  });

interface params {
  updateGalleryFiles: Function;
  setStepManually: Function;
  galleryFiles: Array<File> | null;
}

const GalleryInput = ({ updateGalleryFiles, setStepManually, galleryFiles }: params) => {
  const filesInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>(galleryFiles ?? []);
  const [currentIndex,  setCurrentIndex]  = useState(0);
  const [error,         setError]         = useState("");

  const handleOnChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!incoming.length) return;

    setError("");
    const rejected: string[] = [];
    const valid: File[] = [];

    for (const file of incoming) {
      if (selectedFiles.length + valid.length >= MAX_FILES) break;

      const isVideo = file.type.startsWith("video/");
      const isDupe  = selectedFiles.some((f) => f.name === file.name && f.size === file.size);
      if (isDupe) continue;

      const sizeMB = file.size / (1024 * 1024);

      if (!isVideo && sizeMB > MAX_IMAGE_SIZE_MB) {
        rejected.push(`"${file.name}" exceeds the ${MAX_IMAGE_SIZE_MB} MB image limit.`);
        continue;
      }
      if (isVideo && sizeMB > MAX_VIDEO_SIZE_MB) {
        rejected.push(`"${file.name}" exceeds the ${MAX_VIDEO_SIZE_MB} MB video limit.`);
        continue;
      }
      if (isVideo) {
        try {
          const dur = await getVideoDuration(file);
          if (dur > MAX_VIDEO_DURATION_S) {
            rejected.push(`"${file.name}" is ${Math.round(dur)}s — videos must be ${MAX_VIDEO_DURATION_S}s or shorter.`);
            continue;
          }
        } catch {
          rejected.push(`"${file.name}" could not be read.`);
          continue;
        }
      }
      valid.push(file);
    }

    const merged = [...selectedFiles, ...valid];

    // Total size guard
    const totalMB = merged.reduce((sum, f) => sum + f.size / (1024 * 1024), 0);
    if (totalMB > MAX_TOTAL_SIZE_MB) {
      setError(`Total upload size cannot exceed ${MAX_TOTAL_SIZE_MB} MB.`);
      return;
    }

    if (rejected.length > 0) setError(rejected[0]);
    setSelectedFiles(merged);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (currentIndex >= next.length && currentIndex > 0) setCurrentIndex(next.length - 1);
      return next;
    });
    setError("");
  };

  useEffect(() => {
    updateGalleryFiles(selectedFiles.length > 0 ? selectedFiles : null);
  }, [selectedFiles]);

  return (
    <section className="w-full flex flex-col pt-6 pb-28 px-4 items-center">

      <div className="w-full max-w-[900px] lg:min-w-[1050px] lg:max-w-[1400px] flex xsm:flex-col md:flex-row overflow-hidden rounded-2xl border border-white/10 xsm:h-[760px] sm:h-[900px] md:h-[clamp(480px,75vh,800px)]">
        <input
          type="file"
          ref={filesInputRef}
          onChange={handleOnChange}
          hidden
          multiple
          accept="image/*,video/*"
        />

        {/* Main preview */}
        {selectedFiles.length > 0 ? (
          <div className="md:w-1/2 xsm:w-full md:h-full xsm:h-[45%] bg-black flex items-center justify-center">
            {selectedFiles[currentIndex].type.startsWith("video/") ? (
              <video
                src={URL.createObjectURL(selectedFiles[currentIndex])}
                className="w-full h-full object-contain"
                autoPlay muted loop
              />
            ) : (
              <img
                src={URL.createObjectURL(selectedFiles[currentIndex])}
                className="w-full h-full object-contain"
              />
            )}
          </div>
        ) : (
          <div className="md:w-1/2 xsm:w-full md:h-full xsm:h-[45%] bg-black flex flex-col items-center justify-center gap-3">
            <svg className="w-12 h-12 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-white/25 text-sm">No files selected</p>
          </div>
        )}

        {/* Right panel */}
        <div className="flex flex-col xsm:h-[55%] md:h-full xsm:w-full md:w-1/2 bg-[#0e1016]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => filesInputRef.current?.click()}
                  disabled={selectedFiles.length >= MAX_FILES}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-primary/10 border border-blue-primary/30 rounded-lg text-blue-primary text-sm font-medium hover:bg-blue-primary/20 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>+ Add Files</span>
                </button>
                <span className="text-xs text-white/30">{selectedFiles.length}/{MAX_FILES}</span>
              </div>
              {error && <p className="text-red text-[11px] font-medium max-w-[220px] leading-snug">{error}</p>}
            </div>
            <button
              type="button"
              onClick={() => setStepManually("3")}
              className={`text-sm font-medium transition-colors duration-200 ${
                selectedFiles.length > 0
                  ? "text-blue-primary hover:text-blue-primary/70"
                  : "text-white/30 hover:text-white/50 underline"
              }`}
            >
              {selectedFiles.length > 0 ? "Next Step →" : "Skip →"}
            </button>
          </div>

          {selectedFiles.length > 0 ? (
            <div className="flex flex-wrap overflow-y-auto flex-1 content-start p-2 gap-1">
              {selectedFiles.map((file, i) => (
                <div key={i} className="w-[19%] aspect-square">
                  <GalleryInputSelectedFilesFileCoverDisplay
                    file={file}
                    index={i}
                    removeFile={removeFile}
                    changeCurrentIndex={setCurrentIndex}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <p className="text-xs text-white/20 text-center px-8">
                Choose up to {MAX_FILES} images or videos to fill the gallery
              </p>
              <p className="text-[11px] text-white/15 text-center px-8">
                Images up to {MAX_IMAGE_SIZE_MB} MB · Videos up to {MAX_VIDEO_SIZE_MB} MB / {MAX_VIDEO_DURATION_S}s · {MAX_TOTAL_SIZE_MB} MB total
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default GalleryInput;
