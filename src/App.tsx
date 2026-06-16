import { motion } from "motion/react";
import { Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import { LoginPage } from "./pages/auth/LoginPage";

import ProfilePage from "./pages/ProfilePage";
import AuthProtectedRoutes from "./routes/AuthProtectedRoutes";
import ProtectedRoutes from "./routes/ProtectedRoutes";
import TutorialCenterPage from "./pages/TutorialCenterPage";
import ProductWorldPage from "./pages/ProductWorldPage";
import RegisterPage from "./pages/auth/RegisterPage";
import HomePage from "./pages/HomePage";
import CommunityPage from "./pages/CommunityPage";
import CreatePostPage from "./pages/CreatePostPage";
import UserCollectionPage from "./pages/UserCollectionPage";
import ProfileConfigurePage from "./pages/configuration/ProfileConfigurePage";
import AboutPage from "./pages/AboutPage";
import LearnPage from "./pages/LearnPage";
import LearnTopicPage from "./pages/LearnTopicPage";
import AddNewKnifeToCollectionPage from "./pages/AddNewKnifeToCollectionPage";
import ProfileConfigurationLinksPage from "./pages/configuration/ProfileConfigurationLinksPage";
import ProfileConfigurationDisplayNamePage from "./pages/configuration/ProfileConfigurationDisplayNamePage";
import ProfileConfigurationProfileCaptionPage from "./pages/configuration/ProfileConfigurationProfileCaptionPage";
import ProfileConfigurationChangeEmailPage from "./pages/configuration/ProfileConfigurationChangeEmailPage";
import ProfileConfigurationChangePasswordPage from "./pages/configuration/ProfileConfigurationChangePasswordPage";
import ProfileConfigurationProfileImagePage from "./pages/configuration/ProfileConfigurationProfileImagePage";
import ProfileConfigurationProfileBannerPage from "./pages/configuration/ProfileConfigurationProfileBannerPage";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import { setCredentials, setToRememberLoginInfo } from "./redux/auth/authSlice";
import { loginWithRefreshToken } from "./redux/auth/authActions";
import { setCollection } from "./redux/collection/collectionSlice";
import { mapCollection } from "./redux/collection/collectionActions";
import ProfileConfigurationCollectionBannerImagePage from "./pages/configuration/ProfileConfigurationCollectionBannerImagePage";
import ProfileConfigurationCollectionKnifeCoverPage from "./pages/configuration/ProfileConfigurationCollectionKnifeCoverPage";
import CollectionKnifePage from "./pages/CollectionKnifePage";
import TestPage from "./pages/TestPage";
import RegisterVerifyPage from "./pages/auth/RegisterVerifyPage";
import PostPage from "./pages/PostPage";

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  const user = useAppSelector((state) => state.auth.user);
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  const dispatch = useAppDispatch();

  useEffect(() => {
    // get remember login state
    const toRememberLogin = localStorage.getItem("save-user-info");
    if (toRememberLogin === "true") {
      dispatch(setToRememberLoginInfo());
    }

    // attempt to restore session only if a refresh token is stored
    const storedToken = localStorage.getItem("refreshToken");
    const minLoadMs = 3000;
    const startTime = Date.now();

    if (!user && !accessToken && storedToken) {
      dispatch(loginWithRefreshToken())
        .unwrap()
        .then((res) => {
          dispatch(setCredentials({
            newUser: res.account,
            newAccessToken: res.accessToken,
          }));
          dispatch(setCollection(mapCollection(res.collection)));
        })
        .catch(() => {
          // no valid session — user stays logged out
        })
        .finally(() => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, minLoadMs - elapsed);
          setTimeout(() => setIsLoading(false), remaining);
        });
    } else {
      setTimeout(() => setIsLoading(false), minLoadMs);
    }

    // dispatch(
    //   setCredentials({
    //     newUser: {
    //       id: "99999",
    //       displayName: "Test",
    //       identifierCode: "4444",
    //       role: "USER",
    //       email: "test@gmail.com",
    //       collectionId: "1123",
    //       accountCreationDate: null,
    //       lastLogin: null,
    //     } as Profile,
    //     newAccessToken: "1234",
    //   })
    // );
  }, []);

  if (isLoading) {
    return (
      <main className="w-full h-screen flex flex-col justify-center items-center bg-[#080a0e] gap-10">
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 540 110"
          className="w-80 sm:w-96"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M 52,55 L 6,12 L 0,18 L 4,26 L 44,59 Z" fill="white" opacity="0.95"/>
          <path d="M 52,55 L 6,12 L 10,8 L 56,51 Z" fill="white" opacity="0.3"/>
          <path d="M 52,55 L 6,98 L 0,92 L 4,84 L 44,51 Z" fill="white" opacity="0.95"/>
          <path d="M 52,55 L 6,98 L 10,102 L 56,59 Z" fill="white" opacity="0.3"/>
          <path d="M 52,55 C 70,54 92,50 112,46 C 130,42 142,38 148,35 C 142,41 130,47 112,52 C 92,57 70,58 52,57 Z" fill="white" opacity="0.95"/>
          <circle cx="52" cy="55" r="4.5" fill="white"/>
          <circle cx="52" cy="55" r="2" fill="black"/>
          <text x="178" y="52" fontFamily="'Bebas Neue','Impact',sans-serif" fontSize="44" letterSpacing="4" fill="white">BALISONG</text>
          <rect x="182" y="61" width="209" height="1.5" rx="0.75" fill="white" opacity="0.75"/>
          <text x="182" y="82" fontFamily="'Barlow','Arial Narrow',sans-serif" fontSize="16" fontWeight="600" letterSpacing="6" fill="white" opacity="0.7">FLIPPING CENTER</text>
        </motion.svg>
        <div className="w-56 h-[2px] rounded-full bg-white/10 overflow-hidden relative">
          <motion.div
            className="absolute inset-y-0 w-1/3 rounded-full"
            style={{ background: "linear-gradient(to right, transparent, #108198, transparent)" }}
            animate={{ x: ["-150%", "500%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </main>
    );
  } else {
    return (
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/*Public Routes*/}
          <Route path="/" element={<HomePage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/post/:postId" element={<PostPage />} />

          <Route path="/tutorial-center" element={<TutorialCenterPage />} />
          <Route path="/product-world" element={<ProductWorldPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/learn/:topic" element={<LearnTopicPage />} />
          <Route path="/unauthorized" element={<h2>Unaothorized</h2>} />
          <Route path="/test" element={<TestPage />} />

          <Route path="/:account/:identifier" element={<ProfilePage />} />

          <Route
            path="/:account/:identifier/collection"
            element={<UserCollectionPage />}
          />

          <Route
            path="/:account/:identifier/collection/:knife"
            element={<CollectionKnifePage />}
          />

          {/*Protected Routes from Auth*/}
          <Route element={<ProtectedRoutes />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/verify/:verifiedEmail" element={<RegisterVerifyPage />} />
          </Route>

          {/*Auth Protected Routes for only users*/}
          <Route element={<AuthProtectedRoutes allowedRoles={["USER"]} />}>
            {/*Configuration routes*/}
            <Route path="/configure" element={<ProfileConfigurePage />} />

            <Route
              path="/configure/profile-banner"
              element={<ProfileConfigurationProfileBannerPage />}
            />

            <Route
              path="/configure/profile-image"
              element={<ProfileConfigurationProfileImagePage />}
            />

            <Route
              path="/configure/display_name"
              element={<ProfileConfigurationDisplayNamePage />}
            />
            <Route
              path="/configure/profile_caption"
              element={<ProfileConfigurationProfileCaptionPage />}
            />
            <Route
              path="/configure/facebook_link"
              element={<ProfileConfigurationLinksPage linkType="facebook" />}
            />
            <Route
              path="/configure/instagram_link"
              element={<ProfileConfigurationLinksPage linkType="instagram" />}
            />
            <Route
              path="/configure/twitter_link"
              element={<ProfileConfigurationLinksPage linkType="twitter" />}
            />
            <Route
              path="/configure/youtube_link"
              element={<ProfileConfigurationLinksPage linkType="youtube" />}
            />
            <Route
              path="/configure/reddit_link"
              element={<ProfileConfigurationLinksPage linkType="reddit" />}
            />
            <Route
              path="/configure/discord_link"
              element={<ProfileConfigurationLinksPage linkType="discord" />}
            />
            <Route
              path="/configure/personal_email_link"
              element={<ProfileConfigurationLinksPage linkType="email" />}
            />
            <Route
              path="/configure/personal_website_link"
              element={<ProfileConfigurationLinksPage linkType="website" />}
            />


            <Route
              path="/configure/collection-banner-image"
              element={<ProfileConfigurationCollectionBannerImagePage />}
            />

            <Route
              path="/configure/collection-knife-cover/:knifeId"
              element={<ProfileConfigurationCollectionKnifeCoverPage />}
            />

            <Route
              path="/configure/email"
              element={<ProfileConfigurationChangeEmailPage />}
            />

            <Route
              path="/configure/password"
              element={<ProfileConfigurationChangePasswordPage />}
            />


            {/*Auth Collection Routes*/}
            <Route
              path="/add-collection-knife"
              element={<AddNewKnifeToCollectionPage />}
            />
          </Route>

          {/*Auth protected routes for both admins and users*/}
          <Route
            element={<AuthProtectedRoutes allowedRoles={["USER", "ADMIN"]} />}
          >
            <Route path="/create-post" element={<CreatePostPage />} />
          </Route>

          {/*Catch all 404*/}
          <Route path="*" element={<h1>404</h1>} />
        </Route>
      </Routes>
    );
  }
};

export default App;
