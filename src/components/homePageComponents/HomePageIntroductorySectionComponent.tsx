import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAppSelector } from "../../redux/hooks";
import { faArrowDown, faBolt } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import myVideo from "../../assets/HomePageVideo.mp4";

const STAT_TARGETS = { members: 500, knives: 1200, posts: 3000 };
const COUNT_DURATION = 1800;

const HomePageIntroductorySectionComponent = () => {
  const [videoVisible, setVideoVisible] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [counts, setCounts] = useState({ members: 0, knives: 0, posts: 0 });

  const user = useAppSelector((state) => state.auth.user);
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);

    const videoTimer   = setTimeout(() => setVideoVisible(true),  400);
    const overlayTimer = setTimeout(() => setOverlayVisible(true), 600);
    const cardTimer    = setTimeout(() => setCardVisible(true),    2300);
    const statsTimer   = setTimeout(() => setStatsVisible(true),   3000);

    return () => {
      clearTimeout(videoTimer);
      clearTimeout(overlayTimer);
      clearTimeout(cardTimer);
      clearTimeout(statsTimer);
    };
  }, []);

  useEffect(() => {
    if (!statsVisible) return;

    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / COUNT_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setCounts({
        members: Math.floor(eased * STAT_TARGETS.members),
        knives:  Math.floor(eased * STAT_TARGETS.knives),
        posts:   Math.floor(eased * STAT_TARGETS.posts),
      });

      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [statsVisible]);

  return (
    <section className="relative w-full h-svh text-white overflow-hidden flex flex-col bg-dark-neutral">

      {/* Full-bleed video background */}
      <video
        src={myVideo}
        muted
        autoPlay
        loop
        playsInline
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-all duration-[1200ms] ease-in-out ${
          videoVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"
        }`}
      />

      {/* Top/bottom gradient overlay */}
      <div
        className={`absolute inset-0 z-10 bg-[linear-gradient(180deg,_rgba(10,12,16,0.88)_0%,_rgba(10,12,16,0.35)_45%,_rgba(10,12,16,0.35)_55%,_rgba(10,12,16,0.88)_100%)] transition-opacity duration-[500ms] ease-in-out ${
          overlayVisible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Left/right vignette */}
      <div
        className={`absolute inset-0 z-10 bg-[linear-gradient(90deg,_rgba(10,12,16,0.60)_0%,_transparent_25%,_transparent_75%,_rgba(10,12,16,0.60)_100%)] transition-opacity duration-[500ms] ease-in-out ${
          overlayVisible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Hero content */}
      <div
        className={`relative z-20 flex-1 flex flex-col items-center justify-center xsm:px-3 sm:px-6 text-center xsm:pb-10 sm:pb-20 short:sm:pt-6 short:sm:pb-6 transition-all duration-[2000ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
          cardVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Glass card */}
        <div
          className="flex flex-col items-center bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl xsm:px-4 sm:px-8 md:px-12 lg:px-16 xsm:py-6 sm:py-8 md:py-10 lg:py-12 short:md:py-6 short:md:px-8 xsm:w-full lg:w-auto"
          style={{ borderTopWidth: '2px', borderTopColor: '#108198' }}
        >

          {/* Badge */}
          <div className="flex items-center gap-2 border border-blue-primary text-blue-primary xsm:text-xs sm:text-sm md:text-base font-semibold xsm:tracking-normal sm:tracking-widest uppercase xsm:px-3 sm:px-5 py-2 rounded-full mb-5 sm:mb-7">
            <FontAwesomeIcon icon={faBolt} size="xs" />
            <span>Now Live — Join the Community</span>
          </div>

          {/* Heading — wraps on mobile, nowrap on desktop */}
          <h1 className="xsm:text-3xl sm:text-4xl md:text-5xl lg:text-7xl short:md:text-3xl short:lg:text-4xl font-bold tracking-tight mb-4 sm:mb-5 md:whitespace-nowrap">
            Balisong Flipping Center
          </h1>

          <p className="xsm:text-sm sm:text-lg md:text-2xl lg:text-3xl short:md:text-base short:lg:text-lg font-light tracking-[0.15em] sm:tracking-[0.25em] text-blue-primary xsm:mb-4 sm:mb-7 uppercase">
            Flip. Collect. Connect.
          </p>

          {/* Descriptor — short version on xsm, full version on sm+ */}
          <p className="xsm:block sm:hidden text-sm text-white/75 font-bold mb-6 leading-relaxed text-center">
            Your home for balisong flipping. Learn tricks, catalog your collection, and connect with the community.
          </p>

          <p className="xsm:hidden sm:block sm:text-base md:text-lg lg:text-2xl short:md:text-sm short:lg:text-base text-white/75 font-bold max-w-2xl mb-8 sm:mb-10 leading-relaxed">
            Whether you're a seasoned flipper or just discovering the hobby, the Balisong Flipping Center has everything you need.
            Catalog and show off your knife collection, stay up to date on the latest from top makers, learn new tricks,
            and connect with a community that shares your passion for the art of the flip.
          </p>

          {user && accessToken && accessToken !== "" ? (
            <button
              type="button"
              onClick={() => navigate("/community")}
              className="px-8 py-3 bg-blue-primary text-white font-semibold text-lg rounded hover:brightness-110 transition duration-300"
            >
              Go to Community
            </button>
          ) : (
            <div className="flex xsm:flex-col sm:flex-row items-center xsm:gap-3 sm:gap-6 xsm:w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="xsm:w-full sm:w-auto px-8 py-3 bg-blue-primary text-white font-semibold text-lg rounded hover:brightness-110 transition-[filter] duration-300 animate-gentle-bounce"
              >
                Get Started
              </button>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="xsm:w-full sm:w-auto px-8 py-3 border border-white/60 text-white font-semibold text-lg rounded hover:border-blue-primary hover:text-blue-primary hover:font-bold hover:bg-blue-primary/10 hover:-translate-y-1 transition-all duration-300"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Stats strip */}
          <div
            className={`flex items-center xsm:gap-4 sm:gap-8 lg:gap-12 xsm:mt-6 sm:mt-10 short:mt-4 xsm:pt-5 sm:pt-8 short:pt-4 short:pb-2 border-t border-white/10 w-full justify-center transition-opacity duration-[800ms] ease-in-out ${
              statsVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-white font-bold xsm:text-2xl sm:text-3xl md:text-4xl lg:text-4xl short:md:text-2xl">
                {counts.members.toLocaleString()}<span className="pl-[2px]">+</span>
              </span>
              <span className="uppercase xsm:tracking-normal sm:tracking-widest xsm:text-xs sm:text-sm md:text-base short:md:text-xs text-white/60">Members</span>
            </div>
            <div className="w-px xsm:h-8 md:h-10 short:md:h-6 bg-white/20" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-white font-bold xsm:text-2xl sm:text-3xl md:text-4xl lg:text-4xl short:md:text-2xl">
                {counts.knives.toLocaleString()}<span className="pl-[2px]">+</span>
              </span>
              <span className="uppercase xsm:tracking-normal sm:tracking-widest xsm:text-xs sm:text-sm md:text-base short:md:text-xs text-white/60">Knives</span>
            </div>
            <div className="w-px xsm:h-8 md:h-10 short:md:h-6 bg-white/20" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-white font-bold xsm:text-2xl sm:text-3xl md:text-4xl lg:text-4xl short:md:text-2xl">
                {counts.posts.toLocaleString()}<span className="pl-[2px]">+</span>
              </span>
              <span className="uppercase xsm:tracking-normal sm:tracking-widest xsm:text-xs sm:text-sm md:text-base short:md:text-xs text-white/60">Posts</span>
            </div>
          </div>

        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className={`relative z-20 flex flex-col items-center gap-2 xsm:pb-8 sm:pb-20 short:sm:pb-4 transition-all duration-[1200ms] ease-in-out ${
          cardVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="xsm:text-xs sm:text-base tracking-widest uppercase text-white">Scroll to explore</p>
        <FontAwesomeIcon icon={faArrowDown} size="lg" className="animate-bounce text-white" />
      </div>

    </section>
  );
};

export default HomePageIntroductorySectionComponent;
