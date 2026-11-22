import { Link } from "react-router-dom";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

const BARE_PATH_PATTERN = /(?<=^|\s|(?<!\])\()\/[\w-]+(?:\/[\w-]+)*\/?/gm;
const LINK_CLASS = "text-latch underline hover:text-latch/80";
const ALLOWED_ELEMENTS = ["p", "br", "strong", "em", "ul", "ol", "li", "a", "table", "thead", "tbody", "tr", "th", "td"];

const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+.-]*:/i;

const linkBarePaths = (content: string) => content.replace(BARE_PATH_PATTERN, (path) => `[${path}](${path})`);

const toSitePath = (href: string) => (href.startsWith("/") ? href : `/${href}`);

const components: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  ul: ({ children }) => <ul className="mb-2 last:mb-0 list-disc pl-5 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 last:mb-0 list-decimal pl-5 space-y-0.5">{children}</ol>,
  a: ({ href = "", children }) =>
    ABSOLUTE_URL_PATTERN.test(href) ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
        {children}
      </a>
    ) : (
      <Link to={toSitePath(href)} className={LINK_CLASS}>
        {children}
      </Link>
    ),
  table: ({ children }) => (
    <div className="mb-2 last:mb-0 overflow-x-auto">
      <table className="text-sm border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border border-white/15 px-2 py-1 text-left font-semibold text-white">{children}</th>,
  td: ({ children }) => <td className="border border-white/15 px-2 py-1 align-top">{children}</td>,
};

const LatchMarkdown = ({ content }: { content: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm, remarkBreaks]}
    allowedElements={ALLOWED_ELEMENTS}
    unwrapDisallowed
    components={components}
  >
    {linkBarePaths(content)}
  </ReactMarkdown>
);

export default LatchMarkdown;
