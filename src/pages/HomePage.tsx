/** 
 * Home Page Component, Parent Component
 * URL: /
 * 
*/

import HomePageIntroductorySectionComponent from "../components/homePageComponents/HomePageIntroductorySectionComponent";
import HomePageCommunitySectionComponent from "../components/homePageComponents/HomePageCommunitySectionComponent";
import HomePageProductWorldSectionComponent from "../components/homePageComponents/HomePageProductWorldSectionComponent";
import HomePageTutorialCenterSectionComponent from "../components/homePageComponents/HomePageTutorialCenterSectionComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookOpen, faChevronRight, faInfo } from "@fortawesome/free-solid-svg-icons";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { useNavigate } from "react-router-dom";

const DISCORD_URL = "https://discord.gg/k6JPnkbBC";


const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center">

      {/*Hero — full bleed, outside max-width constraint*/}
      <div className="w-full">
        <HomePageIntroductorySectionComponent />
      </div>

      {/*Set max width so content doesn't stretch too much on wide screens*/}
      <div className="max-w-[1775px] w-full">
        
        {/*Community Info Section*/}
        <HomePageCommunitySectionComponent />

        {/*Product World Info Section*/}
        <HomePageProductWorldSectionComponent />

        {/*Tutorial Center Info Section*/}
        <div style={{ marginTop: '-80px', zIndex: 2, position: 'relative' }}>
          <HomePageTutorialCenterSectionComponent />
        </div>

        {/* Closing CTA Section */}
        <section className="w-full px-6 py-24 flex flex-col items-center gap-10 text-center" style={{ backgroundColor: '#0a0c10', position: 'relative', zIndex: 1 }}>

          {/* Heading */}
          <div className="flex flex-col gap-3 max-w-lg">
            <h2 className="text-white font-black text-3xl sm:text-4xl leading-tight">
              What's your next step?
            </h2>
            <p className="text-white/50 text-base leading-relaxed">
              Whether you're ready to join, want to connect with the community, or are just starting to explore — there's a place for you here.
            </p>
          </div>

          {/* Three action cards */}
          <div className="grid xsm:grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">

            {/* Discord */}
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-3 bg-[#13161d] hover:bg-[#1a1e28] border border-white/10 hover:border-[#5865F2]/40 rounded-2xl px-5 py-6 transition-all duration-200"
            >
              <div className="w-11 h-11 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/25 flex items-center justify-center">
                <FontAwesomeIcon icon={faDiscord} className="text-[#5865F2] text-lg" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-white font-bold text-sm group-hover:text-[#5865F2] transition-colors duration-200">Join our Discord</p>
                <p className="text-white/40 text-xs leading-relaxed">Connect with the community in real time</p>
              </div>
              <FontAwesomeIcon icon={faChevronRight} className="text-white/15 text-xs mt-auto group-hover:text-[#5865F2] transition-colors duration-200" />
            </a>

            {/* Learn */}
            <button
              type="button"
              onClick={() => navigate("/learn")}
              className="group flex flex-col items-center gap-3 bg-[#13161d] hover:bg-[#1a1e28] border border-white/10 hover:border-blue-primary/40 rounded-2xl px-5 py-6 transition-all duration-200"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-primary/10 border border-blue-primary/25 flex items-center justify-center">
                <FontAwesomeIcon icon={faBookOpen} className="text-blue-primary text-lg" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-white font-bold text-sm group-hover:text-blue-primary transition-colors duration-200">Learn the Basics</p>
                <p className="text-white/40 text-xs leading-relaxed">New to balisongs? Start with the fundamentals</p>
              </div>
              <FontAwesomeIcon icon={faChevronRight} className="text-white/15 text-xs mt-auto group-hover:text-blue-primary transition-colors duration-200" />
            </button>

            {/* About */}
            <button
              type="button"
              onClick={() => navigate("/about")}
              className="group flex flex-col items-center gap-3 bg-[#13161d] hover:bg-[#1a1e28] border border-white/10 hover:border-white/25 rounded-2xl px-5 py-6 transition-all duration-200"
            >
              <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <FontAwesomeIcon icon={faInfo} className="text-white/50 text-lg" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-white font-bold text-sm group-hover:text-white/80 transition-colors duration-200">About the Project</p>
                <p className="text-white/40 text-xs leading-relaxed">Learn what Balisong Flipping Center is all about</p>
              </div>
              <FontAwesomeIcon icon={faChevronRight} className="text-white/15 text-xs mt-auto group-hover:text-white/40 transition-colors duration-200" />
            </button>

          </div>
        </section>

      </div>
    </div>
    // <>
    //   <section className="md:h-screen xsm:h-auto text-lg font-semibold pt-[48px] lg:pl-[192px] flex flex-col relative bg-shadow-green-offset">
    //     <div className="w-full md:h-1/2 xsm:h-auto flex md:flex-row xsm:flex-col-reverse">
    //       <div className="md:w-1/2 xsm:w-full flex justify-center items-center xsm:p-3 sm:p-7">
    //         <div className="flex flex-col items-center justify-center gap-4 xsm:h-screen sm:h-auto pb-[128px] md:pt-20 xsm:pt-0 sm:pt-0">
    //           <h4 className="text-4xl font-bold">Welcome!</h4>

    //           <p className="text-2xl xsm:text-xl/8 text-center mt-6">
    //             Welcome to the Balisong Flipping Center! The central hub for
    //             balisong related content and the home of knife enthusiest,
    //             flippers, modders and more. Scroll to learn more, or make an
    //             account today to jump right into the balisong community.
    //           </p>

    //           {user && accessToken && accessToken !== "" ? (
    //             <button
    //               type="button"
    //               className="p-4 rounded bg-black text-xl border"
    //             >
    //               To Profile
    //             </button>
    //           ) : (
    //             <>
    //               <button
    //                 type="button"
    //                 onClick={() => navigate("/register")}
    //                 className="p-2 mt-4 rounded bg-black hover:border hover:border-white border border-shadow-green text-xl"
    //               >
    //                 Register Now
    //               </button>

    //               <div className="flex gap-2 items-center">
    //                 <p>Already have an account?</p>
    //                 <button
    //                   type="button"
    //                   onClick={() => navigate("/login")}
    //                   className="underline hover:text-blue"
    //                 >
    //                   Login Here
    //                 </button>
    //               </div>
    //             </>
    //           )}
    //         </div>
    //       </div>

    //       <div className="md:w-1/2 xsm:w-full xsm:collapse sm:visible md:p-10 xsm:p-0 flex items-center justify-center">
    //         <HomePageCaurosel />
    //       </div>
    //     </div>

    //     <div className="w-full flex xsm:flex-col md:flex-row md:h-1/2 xsm:h-auto gap-1">
    //       {/*Community Page Info Display*/}
    //       <div className="md:w-1/3 xsm:w-full p-4 flex flex-col gap-6 items-center justify-center bg-black">
    //         <h3 className="mt-6 font-bold text-3xl underline text-center">
    //           Check out the Community
    //         </h3>

    //         <p className="text-center text-xl">
    //           The hub for balisong enthusiest alike to share their knives,
    //           update their collections, make posts and support the community.
    //         </p>

    //         <button
    //           onClick={() => navigate("/community")}
    //           className="bg-shadow-green-offset p-3 rounded mt-2 hover:border border border-black hover:border-white text-2xl font-bold"
    //         >
    //           Community
    //           <FontAwesomeIcon icon={faGlobe} className="ml-2" />
    //         </button>
    //       </div>

    //       {/*Tutorial Center Info Display*/}
    //       <div className="md:w-1/3 xsm:w-full p-4 flex flex-col gap-6 items-center justify-center bg-black">
    //         <h3 className="mt-6 font-bold text-3xl underline text-center">
    //           Check out the Tutorial Center
    //         </h3>

    //         <p className="text-center text-xl">
    //           For new comers and professionals. Check out the basics, learn new
    //           tricks, or find inspiration from some of the best in the world.
    //         </p>

    //         <button
    //           onClick={() => navigate("/tutorial-center")}
    //           className="bg-shadow-green-offset p-3 rounded mt-2 hover:border border border-black hover:border-white text-2xl font-bold"
    //         >
    //           Tutorial Center
    //           <FontAwesomeIcon icon={faHubspot} className="ml-2" />
    //         </button>
    //       </div>

    //       {/*Product World Info Display*/}
    //       <div className="md:w-1/3 xsm:w-full p-4 flex flex-col gap-6 items-center justify-center bg-black">
    //         <h3 className="mt-6 font-bold text-3xl underline text-center">
    //           Check out the Product World
    //         </h3>

    //         <p className="text-center text-xl">
    //           The informational hub for modders, knife makers, products and
    //           more. Check out the newest in the industry, or information on past
    //           products.
    //         </p>

    //         <button
    //           onClick={() => navigate("/product-world")}
    //           className="bg-shadow-green-offset p-3 rounded mt-2 hover:border border border-black hover:border-white text-2xl font-bold"
    //         >
    //           Product World
    //           <FontAwesomeIcon icon={faEarthAmericas} className="ml-2" />
    //         </button>
    //       </div>
    //     </div>
    //   </section>

    //   <section className="w-full h-40 bg-shadow flex justify-center items-center text-5xl">
    //     <h3>Footer Placeholder</h3>
    //   </section>
    // </>
  );
};

export default HomePage;
