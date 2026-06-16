import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faBookOpen } from "@fortawesome/free-solid-svg-icons";
import { LEARN_TOPICS } from "../data/learnContent";

const LearnPage = () => {
  const navigate = useNavigate();

  return (
    <section className="w-full min-h-screen bg-[#080a0e] text-white flex justify-center px-4 pt-20 pb-28">
      <div className="w-full max-w-3xl flex flex-col gap-10">

        {/* Header */}
        <div className="flex flex-col gap-3">
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">Knowledge Base</p>
          <h1 className="font-black text-4xl sm:text-5xl leading-tight">
            Learn <span className="text-blue-primary">Balisong</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed max-w-2xl">
            Everything you need to know about balisong flipping — from what a butterfly knife is to how to choose your first one.
          </p>
          <p className="text-white/40 text-sm leading-relaxed max-w-2xl">
            Whether you just heard the word "balisong" for the first time or you're looking to fill in the gaps in your knowledge, this is the place to start.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.06]" />

        {/* Topic list */}
        <div className="flex flex-col gap-3">
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">Topics</p>
          <div className="flex flex-col gap-2">
            {LEARN_TOPICS.map((topic, i) => (
              <button
                key={topic.slug}
                type="button"
                onClick={() => navigate(`/learn/${topic.slug}`)}
                className="group w-full flex items-center gap-4 bg-[#13161d] hover:bg-[#1a1e28] border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 transition-all duration-200 text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-primary/10 border border-blue-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-primary text-xs font-bold">{i + 1}</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <p className="text-white font-semibold text-sm group-hover:text-blue-primary transition-colors duration-200">{topic.title}</p>
                  <p className="text-white/40 text-xs leading-relaxed truncate">{topic.subtitle}</p>
                </div>
                <FontAwesomeIcon icon={faChevronRight} className="text-white/20 text-xs flex-shrink-0 group-hover:text-blue-primary transition-colors duration-200" />
              </button>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="flex items-start gap-3 bg-blue-primary/5 border border-blue-primary/15 rounded-2xl px-5 py-4">
          <FontAwesomeIcon icon={faBookOpen} className="text-blue-primary text-sm flex-shrink-0 mt-0.5" />
          <p className="text-white/50 text-sm leading-relaxed">
            This knowledge base is built for beginners and experienced flippers alike. More topics will be added over time as the community grows.
          </p>
        </div>

      </div>
    </section>
  );
};

export default LearnPage;
