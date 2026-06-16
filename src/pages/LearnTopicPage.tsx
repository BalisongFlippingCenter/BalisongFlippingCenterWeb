import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { LEARN_TOPICS, getTopicBySlug } from "../data/learnContent";

const LearnTopicPage = () => {
  const { topic: slug } = useParams<{ topic: string }>();
  const navigate = useNavigate();

  const topic = getTopicBySlug(slug ?? "");
  const currentIndex = LEARN_TOPICS.findIndex((t) => t.slug === slug);
  const prevTopic = currentIndex > 0 ? LEARN_TOPICS[currentIndex - 1] : null;
  const nextTopic = currentIndex < LEARN_TOPICS.length - 1 ? LEARN_TOPICS[currentIndex + 1] : null;

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
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">
            {currentIndex + 1} of {LEARN_TOPICS.length}
          </p>
          <h1 className="font-black text-4xl sm:text-5xl leading-tight">{topic.title}</h1>
          <p className="text-white/50 text-lg leading-relaxed max-w-2xl">{topic.subtitle}</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.06]" />

        {/* Content */}
        <div className="flex flex-col gap-8">
          {topic.sections.map((section, i) => (
            <div key={i} className="flex flex-col gap-3">
              {section.heading && (
                <h2 className="text-white font-bold text-xl">{section.heading}</h2>
              )}
              {section.type === "paragraph" ? (
                <p className="text-white/60 text-base leading-relaxed">{section.body as string}</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {(section.body as string[]).map((item, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-primary flex-shrink-0 mt-2" />
                      <span className="text-white/60 text-base leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.06]" />

        {/* Prev / Next navigation */}
        <div className="grid grid-cols-2 gap-3">
          {prevTopic ? (
            <button
              type="button"
              onClick={() => navigate(`/learn/${prevTopic.slug}`)}
              className="group flex flex-col gap-1 bg-[#13161d] hover:bg-[#1a1e28] border border-white/10 hover:border-white/20 rounded-2xl px-4 py-4 text-left transition-all duration-200"
            >
              <div className="flex items-center gap-1.5 text-white/30 text-xs">
                <FontAwesomeIcon icon={faChevronLeft} className="text-[10px]" />
                Previous
              </div>
              <p className="text-white text-sm font-semibold group-hover:text-blue-primary transition-colors duration-200 leading-snug">{prevTopic.title}</p>
            </button>
          ) : <div />}

          {nextTopic ? (
            <button
              type="button"
              onClick={() => navigate(`/learn/${nextTopic.slug}`)}
              className="group flex flex-col gap-1 bg-[#13161d] hover:bg-[#1a1e28] border border-white/10 hover:border-white/20 rounded-2xl px-4 py-4 text-right transition-all duration-200 col-start-2"
            >
              <div className="flex items-center gap-1.5 justify-end text-white/30 text-xs">
                Next
                <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
              </div>
              <p className="text-white text-sm font-semibold group-hover:text-blue-primary transition-colors duration-200 leading-snug">{nextTopic.title}</p>
            </button>
          ) : <div />}
        </div>

      </div>
    </section>
  );
};

export default LearnTopicPage;
