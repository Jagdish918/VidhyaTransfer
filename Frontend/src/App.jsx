import { Route, Routes, Navigate } from "react-router-dom";
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
import Utilisation from "./Pages/Utilisation/Utilisation";
import PrivateRoutes from "./util/PrivateRoutes";
import OnboardingGuard from "./util/OnboardingGuard";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  return (
    <>
      <Header />
      <ToastContainer position="top-right" />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
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
          <Route path="/utilisation" element={<Utilisation />} />
          
          {/* Profile Routes */}
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit_profile" element={<EditProfile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
};

export default App;
