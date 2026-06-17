import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faChevronDown, faVolumeXmark, faVolumeHigh, faVideo } from "@fortawesome/free-solid-svg-icons";
import { getTopicBySlug, LearnMedia, StatusListItem, TieredListItem } from "../data/learnContent";
import { axiosApiInstance } from "../api/axios";
import { PostDetail, mapPostDetail } from "../modals/Post";

const TopicMedia = ({ media }: { media: LearnMedia }) => {
  const [muted, setMuted] = useState(true);

  if (media.type === "video") {
    if (!media.src) {
      return (
        <div className="w-full aspect-video rounded-2xl bg-[#13161d] border border-white/10 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <FontAwesomeIcon icon={faVideo} className="text-white/20 text-xl" />
          </div>
          <p className="text-white/20 text-sm">Video coming soon</p>
        </div>
      );
    }

    return (
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#0d0f14]">
        <video
          src={media.src}
          autoPlay
          muted={muted}
          loop
          playsInline
          className="w-full h-full object-cover"
        />
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/80 transition-colors duration-150"
        >
          <FontAwesomeIcon
            icon={muted ? faVolumeXmark : faVolumeHigh}
            className="text-white/70 text-xs"
          />
        </button>
        {media.caption && (
          <p className="absolute bottom-3 left-3 text-white/40 text-xs">{media.caption}</p>
        )}
      </div>
    );
  }

  if (media.type === "image" && media.src) {
    return (
      <div className="w-full rounded-2xl overflow-hidden">
        <img src={media.src} alt={media.caption ?? ""} className="w-full object-cover" />
        {media.caption && (
          <p className="text-white/30 text-xs mt-2">{media.caption}</p>
        )}
      </div>
    );
  }

  return null;
};

const POST_TYPE_LABEL: Record<string, string> = {
  COMBO: "Combo",
  TRICK_TUTORIAL: "Tutorial",
  BUY_SELL: "For Sale",
  TRADE: "Trade",
};

const CommunityStrip = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosApiInstance
      .get("/posts/any", { params: { page: 0, size: 5 } })
      .then((res) => setPosts((res.data?.content ?? []).map(mapPostDetail)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <div className="w-full rounded-2xl bg-[#0d0f14] border border-white/10 p-5 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-2 h-2 flex-shrink-0">
            <span className="absolute w-2 h-2 rounded-full bg-blue-primary opacity-60 animate-ping" />
            <span className="relative w-2 h-2 rounded-full bg-blue-primary" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">From the Community</p>
            <p className="text-white/40 text-xs">See what flippers are sharing</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/community")}
          className="flex items-center gap-1.5 text-blue-primary text-xs hover:text-blue-primary/70 transition-colors duration-200 flex-shrink-0"
        >
          View all
          <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
        </button>
      </div>

      {/* Strip */}
      <div
        className="flex gap-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-44 aspect-[3/4] rounded-xl bg-white/5 animate-pulse" />
            ))
          : posts.map((post) => {
              const thumb = post.mediaFiles[0] ?? null;
              const isVideo = thumb ? /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(thumb) : false;
              const badge = POST_TYPE_LABEL[post.postType] ?? null;
              return (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => navigate("/community")}
                  className="flex-shrink-0 w-44 rounded-xl overflow-hidden relative group cursor-pointer border border-white/[0.06] hover:border-white/20 transition-colors duration-200"
                >
                  {/* Thumbnail */}
                  <div className="w-full aspect-[3/4] bg-[#13161d] overflow-hidden">
                    {thumb ? (
                      isVideo ? (
                        <video
                          src={thumb}
                          muted
                          playsInline
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <img
                          src={thumb}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faVideo} className="text-white/10 text-2xl" />
                      </div>
                    )}
                  </div>

                  {/* Post type badge */}
                  {badge && (
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 text-[10px] font-medium">
                        {badge}
                      </span>
                    </div>
                  )}

                  {/* Bottom overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-3 py-3 flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      {post.creatorProfileImg ? (
                        <img
                          src={post.creatorProfileImg}
                          alt=""
                          className="w-5 h-5 rounded-full object-cover flex-shrink-0 border border-white/20"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-blue-primary/30 border border-blue-primary/40 flex items-center justify-center flex-shrink-0">
                          <span className="text-[8px] text-blue-primary font-bold leading-none">
                            {post.creatorDisplayName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <p className="text-white text-xs font-medium truncate leading-snug">{post.creatorDisplayName}</p>
                    </div>
                    {post.caption && (
                      <p className="text-white/45 text-[10px] leading-snug line-clamp-1">{post.caption}</p>
                    )}
                    {post.likes > 0 && (
                      <p className="text-white/30 text-[10px]">{post.likes} likes</p>
                    )}
                  </div>
                </button>
              );
            })}
      </div>
    </div>
  );
};

const CTA_CONFIG = {
  community: {
    title: "Ready to dive in?",
    description: "Join a growing community of balisong flippers sharing their knives, tricks, and passion for the hobby.",
    primary: { label: "Join the Community", href: "/community" },
    secondary: { label: "Browse Knives", href: "/product-world" },
  },
  "product-world": {
    title: "Ready to find your knife?",
    description: "Browse knives from makers and community sellers. Whether you're looking for your first trainer or upgrading to a live blade.",
    primary: { label: "Browse the Product World", href: "/product-world" },
    secondary: { label: "Join the Community", href: "/community" },
  },
};

const AppCTACard = ({ variant = "community" }: { variant?: "community" | "product-world" }) => {
  const navigate = useNavigate();
  const config = CTA_CONFIG[variant];
  return (
    <div className="w-full rounded-2xl bg-[#13161d] border border-white/10 px-6 py-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-white font-semibold text-sm">{config.title}</p>
        <p className="text-white/40 text-xs leading-relaxed">{config.description}</p>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => navigate(config.primary.href)}
          className="flex-1 py-2.5 rounded-xl bg-blue-primary text-white text-xs font-semibold hover:bg-blue-primary/80 transition-colors duration-200"
        >
          {config.primary.label}
        </button>
        <button
          type="button"
          onClick={() => navigate(config.secondary.href)}
          className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-semibold hover:bg-white/10 transition-colors duration-200"
        >
          {config.secondary.label}
        </button>
      </div>
    </div>
  );
};

const LearnTopicPage = () => {
  const { topic: slug } = useParams<{ topic: string }>();
  const navigate = useNavigate();
  const [openTiers, setOpenTiers] = useState<Set<string>>(new Set());

  const toggleTier = (key: string) =>
    setOpenTiers((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const topic = getTopicBySlug(slug ?? "");

  if (!topic) {
    return (
      <section className="w-full min-h-screen bg-[#080a0e] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <p className="text-white/40 text-sm">Topic not found.</p>
          <button
            type="button"
            onClick={() => navigate("/learn")}
            className="text-blue-primary text-sm hover:text-blue-primary/70 transition-colors"
          >
            Back to Learn
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full min-h-screen bg-[#080a0e] text-white flex justify-center px-4 pt-20 pb-28">
      <div className="w-full max-w-3xl flex flex-col gap-10">

        {/* Back link */}
        <button
          type="button"
          onClick={() => navigate("/learn")}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors duration-200 text-sm w-fit"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
          All Topics
        </button>

        {/* Header */}
        <div className="flex flex-col gap-3">
          <h1 className="font-black text-4xl sm:text-5xl leading-tight">{topic.title}</h1>
          <p className="text-white/50 text-lg leading-relaxed max-w-2xl">{topic.subtitle}</p>
        </div>

        {/* Media */}
        {topic.media && <TopicMedia media={topic.media} />}

        {/* Divider */}
        <div className="h-px bg-white/[0.06]" />

        {/* Content */}
        <div className="flex flex-col gap-8">
          {topic.sections.map((section, i) => (
            <div key={i} className="flex flex-col gap-3">
              {section.heading && (
                <h2 className="text-white font-bold text-xl">{section.heading}</h2>
              )}
              {section.media && <TopicMedia media={section.media} />}
              {section.type === "paragraph" && (
                <div className="flex flex-col gap-3">
                  <p className="text-white/60 text-base leading-relaxed">{section.body as string}</p>
                  {section.links && (
                    <div className="flex flex-wrap gap-2">
                      {section.links.map((link, k) => (
                        <a
                          key={k}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-blue-primary text-xs font-medium hover:bg-white/[0.08] hover:border-white/[0.14] transition-colors duration-150"
                        >
                          {link.label}
                          <FontAwesomeIcon icon={faChevronRight} className="text-[9px] opacity-60" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {section.type === "list" && (
                <ul className="flex flex-col gap-2">
                  {(section.body as string[]).map((item, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-primary flex-shrink-0 mt-2" />
                      <span className="text-white/60 text-base leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {section.type === "status-list" && (
                <ul className="flex flex-col gap-2">
                  {(section.body as StatusListItem[]).map((item, j) => (
                    <li key={j} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 whitespace-nowrap border ${
                        item.status === "legal"
                          ? "bg-green/10 text-green border-green/20"
                          : item.status === "restricted"
                          ? "bg-gold/10 text-gold border-gold/20"
                          : "bg-red/10 text-red border-red/20"
                      }`}>
                        {item.status === "legal" ? "Legal" : item.status === "restricted" ? "Restricted" : "Illegal"}
                      </span>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-white text-sm font-medium">{item.name}</span>
                        <span className="text-white/50 text-sm leading-relaxed">{item.note}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {section.type === "tiered-list" && (
                <div className="flex flex-col gap-2">
                  {(section.body as TieredListItem[]).map((tier, j) => {
                    const key = `${i}-${j}`;
                    const open = openTiers.has(key);
                    return (
                      <div key={j} className="rounded-xl border border-white/[0.07] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleTier(key)}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors duration-150"
                        >
                          <div className="flex items-baseline gap-2 flex-wrap text-left">
                            <span className="text-white font-semibold text-sm">{tier.range}</span>
                            <span className="text-white/45 text-xs">— {tier.description}</span>
                          </div>
                          <FontAwesomeIcon
                            icon={faChevronDown}
                            className={`text-white/30 text-xs flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                          />
                        </button>
                        {open && tier.knives.length > 0 && (
                          <div className="flex flex-col gap-1.5 px-4 pb-4">
                            {tier.knives.map((knife, k) => (
                              <div key={k} className="flex flex-col gap-1 bg-white/[0.02] border border-white/[0.05] rounded-lg px-3 py-2.5">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                  <span className="text-white text-sm font-semibold">{knife.make} {knife.model}</span>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-white/40 text-xs">{knife.material}</span>
                                    <span className="text-white/25 text-xs">·</span>
                                    <span className="text-white/40 text-xs">{knife.msrp}</span>
                                    <span className="text-white/25 text-xs">·</span>
                                    <a
                                      href={knife.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-primary text-xs font-medium hover:text-blue-primary/70 transition-colors duration-150"
                                    >
                                      Find it →
                                    </a>
                                  </div>
                                </div>
                                <p className="text-white/45 text-xs leading-snug">{knife.description}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {section.type === "callout" && (
                <div className={`rounded-xl px-4 py-4 border flex flex-col gap-3 ${
                  section.variant === "warning"
                    ? "bg-gold/[0.06] border-gold/20"
                    : "bg-blue-primary/[0.06] border-blue-primary/20"
                }`}>
                  <p className={`text-sm leading-relaxed ${
                    section.variant === "warning" ? "text-gold/80" : "text-blue-primary/80"
                  }`}>
                    {section.body as string}
                  </p>
                  {section.links && (
                    <div className={`flex items-center gap-4 pt-3 border-t ${
                      section.variant === "warning" ? "border-gold/15" : "border-blue-primary/15"
                    }`}>
                      {section.links.map((link, k) => (
                        <a
                          key={k}
                          href={link.href}
                          className="text-xs font-semibold text-blue-primary underline underline-offset-2 hover:text-blue-primary/70 transition-colors duration-150"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.06]" />

        {/* App tie-in */}
        {topic.showCommunityFeed && <CommunityStrip />}
        {(!topic.showCommunityFeed || topic.ctaVariant) && (
          <AppCTACard variant={topic.ctaVariant ?? "community"} />
        )}

      </div>
    </section>
  );
};

export default LearnTopicPage;
