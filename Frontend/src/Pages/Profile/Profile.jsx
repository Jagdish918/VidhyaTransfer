import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useUser } from "../../util/UserContext";
import { toast } from "react-toastify";
import axios from "axios";
import { FaGithub, FaLinkedin, FaLink, FaEdit, FaStar, FaUserPlus, FaCheck, FaExclamationTriangle } from "react-icons/fa";
import Box from "./Box";
import { storeSanitizedUserData } from "../../util/sanitizeUserData";

const Profile = () => {
  const { user, setUser } = useUser();
  const [profileUser, setProfileUser] = useState(null);
  const { id } = useParams(); // Changed from username to id as per App.jsx
  const [loading, setLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      setLoading(true);
      try {
        // If no id param, identify the current user
        if (!id) {
          // 1. Try fetching as Registered User (most common/desired)
          try {
            const { data } = await axios.get("/user/registered/getDetails");
            if (data.success) {
              setProfileUser(data.data);
              // Update context if needed, but primarily set profile data
              if (!user?.username && data.data.username) {
                setUser(data.data);
                storeSanitizedUserData(data.data);
              }
              setLoading(false);
              return;
            }
          } catch (regError) {
            // 2. If Registered fetch fails, try Unregistered User
            try {
              const { data } = await axios.get("/user/unregistered/getDetails");
              if (data.success) {
                setProfileUser(data.data);
                setLoading(false);
                return;
              }
            } catch (unregError) {
              // Both failed
              console.error("Failed to fetch user profile", unregError);
            }
          }
        } else {
          // Viewing another user's profile (by ID or username)
          try {
            const { data } = await axios.get(`/user/registered/getDetails/${id}`);
            if (data.success) {
              setProfileUser(data.data);
            }
          } catch (error) {
            console.error("User not found", error);
            setProfileUser(null);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, [id, setUser]);

  const convertDate = (dateTimeString) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const connectHandler = async () => {
    try {
      setConnectLoading(true);
      const { data } = await axios.post(`/request/create`, {
        receiverID: profileUser._id,
      });
      toast.success(data.message);
      setProfileUser((prevState) => ({
        ...prevState,
        status: "Pending",
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Error sending request");
    } finally {
      setConnectLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        User not found.
      </div>
    )
  }

  const isOwnProfile = (user && (user.username === id || user._id === id)) || (!id && user);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Sidebar (Sticky) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24 space-y-6">

              {/* Profile Header */}
              <div className="flex flex-col items-center text-center">
                <img
                  src={profileUser.picture || "/default-avatar.png"}
                  alt={profileUser.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow-sm mb-4"
                />
                <h1 className="text-2xl font-bold text-gray-900">{profileUser.name}</h1>
                <p className="text-gray-500 text-sm">@{profileUser.username || "username"}</p>

                {/* Bio */}
                {profileUser.bio && <p className="text-gray-700 mt-4 leading-relaxed">{profileUser.bio}</p>}

                {/* Edit Profile Button */}
                {isOwnProfile && (
                  <Link to="/edit_profile" className="mt-6 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none w-full justify-center">
                    <FaEdit className="mr-2 text-gray-500" />
                    Edit Profile
                  </Link>
                )}

                {/* Connect/Follow Actions for Other Users */}
                {!isOwnProfile && id && (
                  <div className="grid grid-cols-2 gap-3 w-full mt-6">
                    <button
                      onClick={profileUser.status === "Connect" ? connectHandler : undefined}
                      disabled={connectLoading || profileUser.status !== "Connect"}
                      className={`flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${profileUser.status === "Connect" ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
                    >
                      {connectLoading ? "..." : profileUser.status === "Connect" ? <><FaUserPlus className="mr-2" /> Connect</> : <><FaCheck className="mr-2" /> {profileUser.status}</>}
                    </button>
                    <Link to={`/report/${profileUser.username}`} className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      <FaExclamationTriangle className="mr-2" /> Report
                    </Link>
                  </div>
                )}
              </div>

              <hr className="border-gray-100" />

              {/* Social Handles */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Social Handles</h3>
                <div className="flex gap-4 justify-center">
                  {profileUser.githubLink && (
                    <a href={profileUser.githubLink} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors">
                      <FaGithub size={24} />
                    </a>
                  )}
                  {profileUser.linkedinLink && (
                    <a href={profileUser.linkedinLink} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-700 transition-colors">
                      <FaLinkedin size={24} />
                    </a>
                  )}
                  {profileUser.portfolioLink && (
                    <a href={profileUser.portfolioLink} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-600 transition-colors">
                      <FaLink size={24} />
                    </a>
                  )}
                  {!profileUser.githubLink && !profileUser.linkedinLink && !profileUser.portfolioLink && (
                    <p className="text-sm text-gray-400 italic">No social links added</p>
                  )}
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Details */}
              <div className="space-y-3 text-sm">
                {profileUser.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium text-gray-900">{profileUser.email}</span>
                  </div>
                )}
                {profileUser.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone</span>
                    <span className="font-medium text-gray-900">{profileUser.phone}</span>
                  </div>
                )}
                {/* Onboarding Data: Preferences */}
                {profileUser.preferences?.availability > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Availability</span>
                    <span className="font-medium text-gray-900 text-right">{profileUser.preferences.availability} hrs/week</span>
                  </div>
                )}
                {profileUser.preferences?.mode && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mode</span>
                    <span className="font-medium text-gray-900">{profileUser.preferences.mode}</span>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Right Column: Main Content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Skills Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Skills</h2>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Proficient At</h3>
                <div className="flex flex-wrap gap-2">
                  {profileUser.skillsProficientAt?.length > 0 ? (
                    profileUser.skillsProficientAt.map((skill, idx) => (
                      <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {typeof skill === 'string' ? skill : skill.name}
                        {/* Proficiency indicator could go here */}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm italic">No skills listed</span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Interested In Learning</h3>
                <div className="flex flex-wrap gap-2">
                  {profileUser.skillsToLearn?.length > 0 ? (
                    profileUser.skillsToLearn.map((skill, idx) => (
                      <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-100">
                        {typeof skill === 'string' ? skill : skill.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm italic">No interests listed</span>
                  )}
                </div>
              </div>
            </div>

            {/* Ratings & Reviews */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Ratings & Reviews</h2>
                <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                  <FaStar className="text-yellow-400 mr-1" />
                  <span className="font-bold text-gray-900">{profileUser.rating || "5.0"}</span>
                  <span className="text-gray-500 text-xs ml-1">/ 5</span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Placeholder Reviews - In real app, map over profileUser.reviews */}
                {[1, 2].map((i) => (
                  <div key={i} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 mr-2">U{i}</div>
                        <span className="font-semibold text-sm text-gray-900">User {i}</span>
                      </div>
                      <div className="flex text-yellow-400 text-xs">
                        {[...Array(5)].map((_, i) => <FaStar key={i} />)}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">Great mentor! Very helpful and patient.</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Video Section (Placeholder) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Introduction Video</h2>
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg flex items-center justify-center h-64 border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-500">
                  <span className="text-4xl block mb-2">🎥</span>
                  <p>Video introduction coming soon</p>
                </div>
              </div>
            </div>

            {/* Education */}
            {profileUser.education?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Education</h2>
                {profileUser.education.map((edu, index) => (
                  <Box
                    key={index}
                    head={edu.institution}
                    date={convertDate(edu.startDate) + " - " + convertDate(edu.endDate)}
                    spec={edu.degree}
                    desc={edu.description}
                    score={edu.score}
                  />
                ))}
              </div>
            )}

            {/* Projects */}
            {profileUser.projects?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Projects</h2>
                {profileUser.projects.map((proj, index) => (
                  <Box
                    key={index}
                    head={proj.title}
                    date={convertDate(proj.startDate) + " - " + convertDate(proj.endDate)}
                    desc={proj.description}
                    skills={proj.techStack}
                  />
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
