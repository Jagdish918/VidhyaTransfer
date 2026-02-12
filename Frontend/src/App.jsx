import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import Footer from "./Components/Footer/Footer";
import Login from "./Pages/Login/Login";
import Header from "./Components/Navbar/Navbar";
import LandingPage from "./Pages/LandingPage/LandingPage";
import AboutUs from "./Pages/AboutUs/AboutUs";
import NotFound from "./Pages/NotFound/NotFound";
import PersonalInfo from "./Pages/Onboarding/PersonalInfo";
import SkillProfile from "./Pages/Onboarding/SkillProfile";
import Preferences from "./Pages/Onboarding/Preferences";
import Feed from "./Pages/Feed/Feed";
import Profile from "./Pages/Profile/Profile";
import EditProfile from "./Pages/EditProfile/EditProfile";
import Settings from "./Pages/Settings/Settings";
import PeerSwap from "./Pages/PeerSwap/PeerSwap";
import SkillGain from "./Pages/SkillGain/SkillGain";
import Resources from "./Pages/Resources/Resources";
import Utilization from "./Pages/Utilization/Utilization";
import Chat from "./Pages/Chat/Chat";
import Notifications from "./Pages/Notifications/Notifications";
import Credits from "./Pages/Credits/Credits";
import PrivateRoutes from "./util/PrivateRoutes";
import OnboardingGuard from "./util/OnboardingGuard";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ForgotPassword from "./Pages/Login/ForgotPassword";
import ResetPassword from "./Pages/Login/ResetPassword";

const App = () => {
  const location = useLocation();

  return (
    <>
      <Header />
      <ToastContainer position="top-right" />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/about_us" element={<AboutUs />} />

        {/* Onboarding Routes */}
        <Route element={<PrivateRoutes />}>
          <Route path="/onboarding/personal-info" element={<PersonalInfo />} />
          <Route path="/onboarding/skills" element={<SkillProfile />} />
          <Route path="/onboarding/preferences" element={<Preferences />} />

          {/* Feed Route - Protected and checks onboarding */}
          <Route
            path="/feed"
            element={
              <OnboardingGuard>
                <Feed />
              </OnboardingGuard>
            }
          />

          {/* Navigation Pages */}
          <Route path="/peer-swap" element={<PeerSwap />} />
          <Route path="/skill-gain" element={<SkillGain />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/utilisation" element={<Utilization />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/credits" element={<Credits />} />

          {/* Profile Routes */}
          {/* Profile Routes - allow both :id and :username implicitly by using just :id and handling in component */}
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit_profile" element={<EditProfile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      {location.pathname !== '/chat' && <Footer />}
    </>
  );
};

export default App;
