import VideoTestComponent from "../components/test/VideoTestComponent";
import { usePageMeta } from "../hooks/usePageMeta";

const TestPage = () => {
  usePageMeta({ noindex: true });
  return (
    <section className="pt-[64px] lg:pl-[192px] flex flex-col items-center">
      <h1>Test</h1>

      <VideoTestComponent />
    </section>
  );
};

export default TestPage;
