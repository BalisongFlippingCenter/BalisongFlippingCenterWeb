import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft, faChevronRight, faIndustry, faGlobe, faTag,
} from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram, faYoutubeSquare, faFacebookSquare, faTwitterSquare,
} from "@fortawesome/free-brands-svg-icons";
import { getMakerCatalogDetail, MakerDetail } from "../api/catalogApi";

// ── Page ──────────────────────────────────────────────────────────────────────

const MakerDetailPage = () => {
  const { makerSlug } = useParams<{ makerSlug: string }>();
  const navigate = useNavigate();

  const [maker, setMaker] = useState<MakerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!makerSlug) return;
    setIsLoading(true);
    setNotFound(false);
    getMakerCatalogDetail(makerSlug)
      .then((data) => setMaker(data))
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [makerSlug]);

  const BG = "linear-gradient(to bottom, #00080e 0%, #000a10 40%, #000305 100%)";

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="w-6 h-6 rounded-full border-2 border-blue-primary/60 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (notFound || !maker) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center gap-4 text-white" style={{ background: BG }}>
        <p className="text-white/50 text-lg font-semibold">Maker not found</p>
        <button
          type="button"
          onClick={() => navigate("/product-world")}
          className="text-blue-primary/70 text-sm hover:text-blue-primary transition-colors"
        >
          ← Back to Product World
        </button>
      </div>
    );
  }

  const socialLinks = [
    maker.instagramUrl && { href: maker.instagramUrl, icon: faInstagram, color: "#E1306C", label: "Instagram" },
    maker.youtubeUrl && { href: maker.youtubeUrl, icon: faYoutubeSquare, color: "#FF0000", label: "YouTube" },
    maker.facebookUrl && { href: maker.facebookUrl, icon: faFacebookSquare, color: "#1877F2", label: "Facebook" },
    maker.twitterUrl && { href: maker.twitterUrl, icon: faTwitterSquare, color: "#1DA1F2", label: "Twitter/X" },
  ].filter(Boolean) as { href: string; icon: typeof faInstagram; color: string; label: string }[];

  return (
    <div className="w-full min-h-screen text-white" style={{ background: BG }}>
      <div className="relative z-10 max-w-[800px] mx-auto xsm:px-4 md:px-6 lg:px-8 xsm:pt-8 xsm:pb-28 md:pt-10 md:pb-20 flex flex-col gap-8">

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate("/product-world")}
          className="self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-primary/25 text-white/70 hover:text-white hover:border-blue-primary/50 text-sm font-medium transition-all duration-150"
          style={{ background: "rgba(0,0,0,0.35)" }}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
          Product World
        </button>

        {/* ── Company header ────────────────────────────────────────────────── */}
        <div
          className="flex flex-col gap-5 p-6 rounded-2xl border border-blue-primary/25"
          style={{ background: "linear-gradient(135deg, rgba(16,129,152,0.10), rgba(16,129,152,0.02))" }}
        >
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border border-blue-primary/30 bg-black/40 flex-shrink-0 flex items-center justify-center overflow-hidden">
              {maker.logoUrl ? (
                <img src={maker.logoUrl} alt={maker.name} className="w-full h-full object-cover" />
              ) : (
                <FontAwesomeIcon icon={faIndustry} className="text-blue-primary/40 text-3xl" />
              )}
            </div>
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-primary/60">Maker</p>
              <h1 className="text-white font-extrabold text-3xl md:text-4xl leading-tight truncate">{maker.name}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                {maker.country && (
                  <span className="text-white/50 text-xs font-medium px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03]">
                    {maker.country}
                  </span>
                )}
                {maker.foundedYear && (
                  <span className="text-blue-primary/80 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-primary/30 bg-blue-primary/10">
                    Est. {maker.foundedYear}
                  </span>
                )}
              </div>
            </div>
          </div>

          {maker.knownFor && (
            <p className="text-white/55 text-sm leading-relaxed">{maker.knownFor}</p>
          )}

          {/* Links */}
          {(maker.officialSiteUrl || socialLinks.length > 0) && (
            <div className="flex items-center gap-3 flex-wrap pt-1">
              {maker.officialSiteUrl && (
                <a
                  href={maker.officialSiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-primary/30 bg-blue-primary/[0.06] text-blue-primary text-xs font-semibold hover:bg-blue-primary/[0.12] hover:border-blue-primary/50 transition-all duration-150"
                >
                  <FontAwesomeIcon icon={faGlobe} className="text-[11px]" />
                  Official Site
                </a>
              )}
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={link.label}
                  className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/40 transition-all duration-150"
                  onMouseEnter={(e) => { e.currentTarget.style.color = link.color; e.currentTarget.style.borderColor = link.color; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = ""; e.currentTarget.style.borderColor = ""; }}
                >
                  <FontAwesomeIcon icon={link.icon} className="text-sm" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* ── Knives ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, rgba(16,129,152,0.35), rgba(16,129,152,0.05))" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-primary/60 flex-shrink-0">
              Knives by {maker.name}
            </span>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, rgba(16,129,152,0.35), rgba(16,129,152,0.05))" }} />
          </div>

          {maker.knives.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">No knives listed for this maker yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {maker.knives.map((knife) => (
                <button
                  key={knife.slug}
                  type="button"
                  onClick={() => navigate(`/product-world/knife/${knife.slug}`)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150 text-left group ${
                    knife.hasActiveVersion
                      ? "border-blue-primary/25 bg-blue-primary/5 hover:border-blue-primary/45 hover:bg-blue-primary/[0.09]"
                      : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.16] hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {knife.coverPhotoUrl ? (
                      <img src={knife.coverPhotoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FontAwesomeIcon icon={faTag} className="text-white/20" />
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold truncate ${knife.hasActiveVersion ? "text-white/85" : "text-white/50"}`}>
                        {knife.name}
                      </span>
                      {!knife.hasActiveVersion && (
                        <span className="flex-shrink-0 text-[10px] font-medium uppercase tracking-wider text-gold/50 border border-gold/20 bg-gold/5 px-1.5 py-0.5 rounded-md leading-none">
                          All Discontinued
                        </span>
                      )}
                    </div>
                    {knife.bladeStyleSummary && (
                      <span className="text-white/35 text-xs truncate">{knife.bladeStyleSummary}</span>
                    )}
                  </div>
                  {knife.priceRangeSummary && (
                    <span className="text-blue-primary/70 text-xs font-medium flex-shrink-0">{knife.priceRangeSummary}</span>
                  )}
                  <FontAwesomeIcon icon={faChevronRight} className="text-[10px] text-white/15 group-hover:text-white/40 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MakerDetailPage;
