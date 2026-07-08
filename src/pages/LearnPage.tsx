import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faBookOpen,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import { LEARN_TOPICS, LearnTopic } from "../data/learnContent";
import { axiosApiInstance } from "../api/axios";
import { PostDetail, mapPostDetail } from "../modals/Post";

const TopicCard = ({ topic, onClick }: { topic: LearnTopic; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="group w-full flex items-center gap-4 bg-[#13161d] hover:bg-[#1a1e28] border border-white/10 hover:border-blue-primary/30 rounded-2xl px-5 py-5 transition-all duration-200 text-left"
  >
    <div className="flex flex-col gap-1 min-w-0 flex-1">
      <p className="text-white font-semibold text-sm group-hover:text-blue-primary transition-colors duration-200 leading-snug">
        {topic.title}
      </p>
      <p className="text-white/40 text-xs leading-relaxed line-clamp-2">{topic.subtitle}</p>
    </div>

    <FontAwesomeIcon
      icon={faChevronRight}
      className="text-white/20 text-xs flex-shrink-0 group-hover:text-blue-primary transition-colors duration-200"
    />
  </button>
);

const CommunityCarousel = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    axiosApiInstance
      .get("/posts/any", { params: { page: 0, size: 6 } })
      .then((res) => setPosts((res.data?.content ?? []).map(mapPostDetail)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[160px] rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) return null;

  const doubled = [...posts, ...posts];

  const PostCard = ({ post, horizontal }: { post: PostDetail; horizontal: boolean }) => {
    const thumb = post.mediaFiles[0] ?? null;
    const isVideo = thumb?.isVideo ?? false;
    return (
      <button
        type="button"
        onClick={() => navigate("/community")}
        className={`relative flex-shrink-0 rounded-2xl overflow-hidden border border-white/[0.06] hover:border-white/20 transition-colors duration-200 group ${
          horizontal ? "w-44 h-full" : "h-[160px] w-full"
        }`}
      >
        <div className="absolute inset-0 bg-[#13161d]">
          {thumb ? (
            isVideo ? (
              <video src={thumb.url} muted playsInline className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <img src={thumb.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FontAwesomeIcon icon={faVideo} className="text-white/10 text-2xl" />
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-3 py-3 flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            {post.creatorProfileImg ? (
              <img src={post.creatorProfileImg} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0 border border-white/20" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-blue-primary/30 border border-blue-primary/40 flex items-center justify-center flex-shrink-0">
                <span className="text-[8px] text-blue-primary font-bold leading-none">
                  {post.creatorDisplayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <p className="text-white text-xs font-semibold truncate">{post.creatorDisplayName}</p>
          </div>
          {post.caption && (
            <p className="text-white/55 text-[11px] leading-snug line-clamp-1">{post.caption}</p>
          )}
        </div>
      </button>
    );
  };

  return (
    <>
      <style>{`
        @keyframes carouselScrollUp {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes carouselScrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .carousel-track-v {
          animation: carouselScrollUp 18s linear infinite;
        }
        .carousel-track-h {
          animation: carouselScrollLeft 12s linear infinite;
        }
        @media (max-width: 949px) {
          .carousel-track-h {
            animation-duration: 7s;
          }
        }
      `}</style>

      {/* Vertical — md and above */}
      <div
        className="hidden md:block relative overflow-hidden rounded-2xl"
        style={{ height: 400 }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="carousel-track-v flex flex-col gap-2.5"
          style={{ animationPlayState: paused ? "paused" : "running" }}
        >
          {doubled.map((post, i) => <PostCard key={i} post={post} horizontal={false} />)}
        </div>
        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#080a0e] to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#080a0e] to-transparent pointer-events-none z-10" />
      </div>

      {/* Horizontal — below md */}
      <div
        className="block md:hidden relative overflow-hidden rounded-2xl"
        style={{ height: 220 }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="carousel-track-h flex flex-row gap-2.5 h-full"
          style={{ animationPlayState: paused ? "paused" : "running" }}
        >
          {doubled.map((post, i) => <PostCard key={i} post={post} horizontal={true} />)}
        </div>
        <div className="absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-[#080a0e] to-transparent pointer-events-none z-10" />
        <div className="absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-[#080a0e] to-transparent pointer-events-none z-10" />
      </div>
    </>
  );
};

const LearnPage = () => {
  const navigate = useNavigate();

  return (
    <section className="w-full min-h-screen bg-[#080a0e] text-white">
      <div className="w-full max-w-5xl mx-auto px-4 pt-20 pb-28">

        {/* Header */}
        <div className="flex flex-col gap-3 mb-10 max-w-2xl">
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">Balisong 101</p>
          <h1 className="font-black text-4xl sm:text-5xl leading-tight">
            A Guide To <span className="text-blue-primary">Balisongs</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            The definitive resource for anyone getting started with balisong flipping. Learn the hardware, the terminology, and what to look for in your first knife.
          </p>
          <p className="text-white/40 text-sm leading-relaxed">
            Written for beginners — useful for everyone. These guides cover the fundamentals every flipper should know, whether you've never seen a balisong or you're just filling in the gaps.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.06] mb-10" />

        {/* Main content */}
        <div className="flex flex-col md:flex-row gap-8 items-start">

          {/* Topics — primary */}
          <div className="flex-1 min-w-0 flex flex-col gap-2.5">
            <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-1">Topics</p>
            {LEARN_TOPICS.map((topic) => (
              <TopicCard
                key={topic.slug}
                topic={topic}
                onClick={() => navigate(`/learn/${topic.slug}`)}
              />
            ))}
          </div>

          {/* Sidebar — secondary */}
          <div className="w-full md:w-72 flex-shrink-0 flex flex-col gap-3 md:sticky md:top-24">
            <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">From the Community</p>

            <CommunityCarousel />

            <div className="flex items-start gap-3 bg-blue-primary/5 border border-blue-primary/15 rounded-2xl px-4 py-4">
              <FontAwesomeIcon icon={faBookOpen} className="text-blue-primary text-xs flex-shrink-0 mt-0.5" />
              <p className="text-white/40 text-xs leading-relaxed">
                This knowledge base is built for beginners and experienced flippers alike. More topics will be added over time as the community grows.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default LearnPage;
