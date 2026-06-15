import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faIndustry,
  faEarthAmericas,
  faFlask,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: faBookOpen,
    title: "Knife Pages",
    description:
      "Browse a growing catalog of balisong models from makers around the world. Every page is a deep dive into the knife you want to know.",
    bullets: [
      "Search and filter by maker, style, or spec",
      "Full spec sheets — blade, handle, pivot, latch, and more",
      "Photos and community ratings for each model",
      "Compare specs across different knives",
    ],
  },
  {
    icon: faIndustry,
    title: "Maker Pages",
    description:
      "Explore dedicated profiles for active and historic balisong makers. From garage shops to established brands — they're all here.",
    bullets: [
      "Dedicated profile pages per maker",
      "Full product lineups past and present",
      "Maker history, background, and background info",
      "Direct links to each maker's knife pages",
    ],
  },
];

const HomePageProductWorldSectionComponent = () => {
  const navigate = useNavigate();

  return (
    <section
      className="min-h-screen w-full text-white flex items-center relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 50% 40%, #3d0000 0%, #1a0000 50%, #0d0000 100%)',
        borderRadius: '0 0 50% 50% / 0 0 80px 80px',
        boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
        marginTop: '-80px',
        zIndex: 3,
        position: 'relative',
      }}
    >
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 xsm:pt-44 md:pt-40 pb-24">

        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <FontAwesomeIcon icon={faEarthAmericas} className="text-red text-sm" />
          <span className="uppercase tracking-widest text-base font-semibold text-red">
            Product World
          </span>
        </div>

        {/* Heading */}
        <h2 className="text-center font-bold xsm:text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight">
          Know Your <span className="text-red">Blades</span>
        </h2>

        {/* Subheading */}
        <p className="text-center text-white/60 xsm:text-base md:text-lg max-w-2xl mx-auto mt-5 leading-relaxed">
          The Product World is your reference hub for everything balisongs. Search dedicated pages
          for specific knives and makers, explore specs, and build your knowledge of the craft.
        </p>

        {/* Feature Cards */}
        <div className="grid xsm:grid-cols-1 md:grid-cols-2 gap-5 mt-14">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-shadow-red border border-white/15 rounded-xl p-6 flex flex-col gap-3 hover:border-red/40 transition-all duration-300 shadow-[0_4px_32px_rgba(0,0,0,0.6)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red/10 border border-red/20 flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={feature.icon} className="text-red" />
                </div>
                <h3 className="font-bold text-base sm:text-lg">{feature.title}</h3>
              </div>
              <p className="text-white/55 text-sm leading-relaxed">{feature.description}</p>

              {/* Hover-reveal bullet points */}
              <ul className="max-h-0 overflow-hidden group-hover:max-h-[200px] transition-all duration-500 ease-in-out flex flex-col gap-1.5 border-t border-white/0 group-hover:border-white/10 group-hover:pt-3 group-hover:mt-1">
                {feature.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-sm text-white/70">
                    <span className="text-red mt-1 text-xs">▸</span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* More coming soon strip */}
        <div className="mt-5 bg-shadow-red/70 border border-dashed border-red/25 rounded-xl px-6 py-5 flex items-center justify-center gap-3 text-white/50">
          <FontAwesomeIcon icon={faFlask} className="text-red/60 text-sm" />
          <span className="text-sm tracking-wide uppercase font-medium">More features coming soon</span>
        </div>

        {/* CTA */}
        <div className="flex justify-center mt-14">
          <button
            type="button"
            onClick={() => navigate("/product-world")}
            className="px-8 py-3 bg-red text-white font-semibold text-base rounded hover:brightness-110 transition-[filter] duration-300"
          >
            Explore Product World
          </button>
        </div>

      </div>
    </section>
  );
};


export default HomePageProductWorldSectionComponent;
