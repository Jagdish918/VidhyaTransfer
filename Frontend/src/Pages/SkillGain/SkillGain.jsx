import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaChalkboardTeacher, FaStar, FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";

const SkillGain = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/user/mentors", {
        params: { search: debouncedSearch }
      });
      if (data.success) {
        setMentors(data.data.users);
      }
    } catch (error) {
      console.error("Error fetching mentors", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch immediately when debouncedSearch changes
  useEffect(() => {
    fetchMentors();
  }, [debouncedSearch]);

  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-12 font-['Montserrat']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 font-['Oswald'] tracking-wide">
              Skill Gain <span className="text-[#3bb4a1]">Mentors</span>
            </h1>
            <p className="mt-2 text-gray-600">Find experts willing to teach you new skills.</p>
          </div>

          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by skill or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3bb4a1] focus:border-transparent sm:text-sm shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse h-80"></div>
            ))}
          </div>
        ) : mentors.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white/50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
              <FaChalkboardTeacher className="text-4xl text-gray-300" />
            </div>
            <h3 className="text-xl font-medium text-gray-900">No mentors found</h3>
            <p className="text-gray-500">Try adjusting your search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mentors.map((mentor) => (
              <div key={mentor._id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-100 flex flex-col">
                <div className="p-6 flex-1 flex flex-col items-center text-center">
                  <img
                    src={mentor.picture || `https://ui-avatars.com/api/?name=${mentor.name}&background=random`}
                    alt={mentor.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-[#3bb4a1]/10 mb-4"
                  />
                  <h3 className="text-lg font-bold text-gray-900">{mentor.name}</h3>
                  <p className="text-sm text-gray-500 mb-1">@{mentor.username}</p>

                  {/* Rating */}
                  <div className="flex items-center gap-1 text-amber-400 text-sm mb-4">
                    <FaStar />
                    <span className="font-semibold text-gray-700">{mentor.rating || "New"}</span>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap justify-center gap-2 mb-4 w-full">
                    {mentor.skillsProficientAt?.slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md font-medium">
                        {skill.name || skill}
                      </span>
                    ))}
                    {mentor.skillsProficientAt?.length > 3 && (
                      <span className="text-xs text-gray-400">+{mentor.skillsProficientAt.length - 3}</span>
                    )}
                  </div>
                </div>

                {/* Footer: Rate */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Rate</p>
                    <p className="text-[#3bb4a1] font-bold">{mentor.preferences?.rates?.mentorship || 0} Credits/hr</p>
                  </div>
                  <Link
                    to={`/profile/${mentor.username}`}
                    className="bg-[#013e38] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#3bb4a1] transition-colors font-bold no-underline"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillGain;
