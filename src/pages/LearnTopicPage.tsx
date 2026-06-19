import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faChevronDown, faVolumeXmark, faVolumeHigh, faVideo, faEarthAmericas, faTag, faPlay } from "@fortawesome/free-solid-svg-icons";
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

const CommunityStrip = ({ onLoaded }: { onLoaded: (hasPosts: boolean) => void }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    axiosApiInstance
      .get("/posts/any", { params: { page: 0, size: 6 } })
      .then((res) => {
        const mapped = (res.data?.content ?? []).map(mapPostDetail);
        setPosts(mapped);
        onLoaded(mapped.length > 0);
      })
      .catch(() => onLoaded(false))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && posts.length === 0) return null;

  const doubled = [...posts, ...posts];

  const PostCard = ({ post }: { post: PostDetail }) => {
    const thumb = post.mediaFiles[0] ?? null;
    const isVideo = thumb ? /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(thumb) : false;
    const badge = POST_TYPE_LABEL[post.postType] ?? null;
    return (
      <button
        type="button"
        onClick={() => navigate("/community")}
        className="flex-shrink-0 w-44 rounded-xl overflow-hidden relative group cursor-pointer border border-white/[0.06] hover:border-white/20 transition-colors duration-200"
      >
        <div className="w-full aspect-[3/4] bg-[#13161d] overflow-hidden">
          {thumb ? (
            isVideo ? (
              <video src={thumb} muted playsInline className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <img src={thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FontAwesomeIcon icon={faVideo} className="text-white/10 text-2xl" />
            </div>
          )}
        </div>
        {badge && (
          <div className="absolute top-2.5 left-2.5">
            <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 text-[10px] font-medium">{badge}</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-3 py-3 flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            {post.creatorProfileImg ? (
              <img src={post.creatorProfileImg} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0 border border-white/20" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-blue-primary/30 border border-blue-primary/40 flex items-center justify-center flex-shrink-0">
                <span className="text-[8px] text-blue-primary font-bold leading-none">{post.creatorDisplayName.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <p className="text-white text-xs font-medium truncate leading-snug">{post.creatorDisplayName}</p>
          </div>
          {post.caption && <p className="text-white/45 text-[10px] leading-snug line-clamp-1">{post.caption}</p>}
          {post.likes > 0 && <p className="text-white/30 text-[10px]">{post.likes} likes</p>}
        </div>
      </button>
    );
  };

  return (
    <div className="w-full rounded-2xl bg-[#0d0f14] border border-white/10 p-5 flex flex-col gap-5">
      <style>{`
        @keyframes stripScrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .strip-track {
          animation: stripScrollLeft 16s linear infinite;
        }
      `}</style>

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

      {/* Auto-scrolling strip */}
      {loading ? (
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-44 aspect-[3/4] rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div
          className="relative overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          <div
            className="strip-track flex gap-3"
            style={{ animationPlayState: paused ? "paused" : "running" }}
          >
            {doubled.map((post, i) => <PostCard key={i} post={post} />)}
          </div>
          <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#0d0f14] to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#0d0f14] to-transparent pointer-events-none z-10" />
        </div>
      )}
    </div>
  );
};

const LearnBottomSection = ({ showCards }: { showCards: boolean }) => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ members: 0, knives: 0, posts: 0 });
  const [statsFetched, setStatsFetched] = useState(false);
  const statTargets = useRef({ members: 0, knives: 0, posts: 0 });
  const [counting, setCounting] = useState(false);

  useEffect(() => {
    axiosApiInstance.get("/stats").then((res) => {
      const members = res.data.accountCount ?? 0;
      const knives  = res.data.knifeCount   ?? 0;
      const posts   = res.data.postCount    ?? 0;
      if (members > 0 || knives > 0 || posts > 0) {
        statTargets.current = { members, knives, posts };
        setStatsFetched(true);
        setCounting(true);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!counting) return;
    const duration = 1200;
    const start = performance.now();
    const targets = statTargets.current;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCounts({
        members: Math.round(targets.members * ease),
        knives:  Math.round(targets.knives  * ease),
        posts:   Math.round(targets.posts   * ease),
      });
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [counting]);

  return (
    <div className="flex flex-col gap-6">

      {/* Stats + CTA card */}
      <div className="w-full rounded-2xl border border-white/10 overflow-hidden flex flex-col" style={{ background: "linear-gradient(160deg, #108198 0%, #0d1520 35%, #13161d 100%)" }}>

        <div className="px-6 pt-8 pb-6 flex flex-col items-center gap-5">

          {/* Stats row — centered */}
          <div className="flex items-center justify-center gap-8 w-full">
            {statsFetched ? (
              <>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-white font-bold text-2xl">{counts.members.toLocaleString()}<span className="pl-px">+</span></span>
                  <span className="text-white/50 text-[11px] uppercase tracking-widest">Members</span>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div className="flex flex-col items-center gap-1">
                  <span className="text-white font-bold text-2xl">{counts.knives.toLocaleString()}<span className="pl-px">+</span></span>
                  <span className="text-white/50 text-[11px] uppercase tracking-widest">Knives</span>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div className="flex flex-col items-center gap-1">
                  <span className="text-white font-bold text-2xl">{counts.posts.toLocaleString()}<span className="pl-px">+</span></span>
                  <span className="text-white/50 text-[11px] uppercase tracking-widest">Posts</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-white/50 tracking-wide text-center">Growing community &nbsp;·&nbsp; Always free &nbsp;·&nbsp; Built for flippers</p>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.08] w-full" />

          {/* CTA — centered */}
          <div className="flex flex-col items-center gap-4 text-center w-full">
            <div className="flex flex-col gap-1">
              <p className="text-white font-semibold text-sm">Ready to dive in?</p>
              <p className="text-white/40 text-xs leading-relaxed">Join a growing community of balisong flippers sharing their knives, tricks, and passion for the hobby.</p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={() => navigate("/community")}
                className="w-full py-2.5 rounded-xl bg-white text-[#0d1520] text-xs font-semibold hover:bg-white/90 transition-colors duration-200"
              >
                Join the Community
              </button>
              <button
                type="button"
                onClick={() => navigate("/product-world")}
                className="w-full py-2 rounded-xl text-white/40 text-xs font-medium hover:text-white/60 transition-colors duration-200"
              >
                Browse Knives
              </button>
            </div>
          </div>

          {/* Section cards — inside card, only when community strip failed */}
          {showCards && (
            <>
              <div className="h-px bg-white/[0.08] w-full" />
              <p className="text-white/40 text-[11px] uppercase tracking-widest text-center">Explore the platform</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">

                <button
                  type="button"
                  onClick={() => navigate("/community")}
                  className="group flex flex-col items-center gap-3 bg-black/20 hover:bg-black/30 border border-white/10 hover:border-blue-primary/40 rounded-2xl px-4 py-5 transition-all duration-200 text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-primary/10 border border-blue-primary/25 flex items-center justify-center">
                    <FontAwesomeIcon icon={faEarthAmericas} className="text-blue-primary" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-white font-bold text-sm group-hover:text-blue-primary transition-colors duration-200">Community</p>
                    <p className="text-white/40 text-xs leading-relaxed">Posts, knives, and tricks from real flippers</p>
                  </div>
                  <FontAwesomeIcon icon={faChevronRight} className="text-white/15 text-xs mt-auto group-hover:text-blue-primary transition-colors duration-200" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/product-world")}
                  className="group flex flex-col items-center gap-3 bg-black/20 hover:bg-black/30 border border-white/10 hover:border-gold/40 rounded-2xl px-4 py-5 transition-all duration-200 text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/25 flex items-center justify-center">
                    <FontAwesomeIcon icon={faTag} className="text-gold" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-white font-bold text-sm group-hover:text-gold transition-colors duration-200">Product World</p>
                    <p className="text-white/40 text-xs leading-relaxed">Browse knives from makers and sellers</p>
                  </div>
                  <FontAwesomeIcon icon={faChevronRight} className="text-white/15 text-xs mt-auto group-hover:text-gold transition-colors duration-200" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/tutorial-center")}
                  className="group flex flex-col items-center gap-3 bg-black/20 hover:bg-black/30 border border-white/10 hover:border-green/40 rounded-2xl px-4 py-5 transition-all duration-200 text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-green/10 border border-green/25 flex items-center justify-center">
                    <FontAwesomeIcon icon={faPlay} className="text-green" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-white font-bold text-sm group-hover:text-green transition-colors duration-200">Tutorial Center</p>
                    <p className="text-white/40 text-xs leading-relaxed">Learn tricks and combos from the community</p>
                  </div>
                  <FontAwesomeIcon icon={faChevronRight} className="text-white/15 text-xs mt-auto group-hover:text-green transition-colors duration-200" />
                </button>

              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};

const LearnTopicPage = () => {
  const { topic: slug } = useParams<{ topic: string }>();
  const navigate = useNavigate();
  const [openTiers, setOpenTiers] = useState<Set<string>>(new Set());
  const [communityHasPosts, setCommunityHasPosts] = useState<boolean | null>(null);

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
        <CommunityStrip onLoaded={setCommunityHasPosts} />
        <LearnBottomSection showCards={communityHasPosts === false} />

        {/* Bottom back link */}
        <button
          type="button"
          onClick={() => navigate("/learn")}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors duration-200 text-sm w-fit"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
          All Topics
        </button>

      </div>
    </section>
  );
};

export default LearnTopicPage;
