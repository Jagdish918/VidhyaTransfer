import React from "react";
import { useUser } from "../../util/UserContext";
import { FaBookOpen } from "react-icons/fa";

const Resources = () => {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-12 font-['Montserrat']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 font-['Oswald'] tracking-wide uppercase">
            Start <span className="text-[#3bb4a1]">Learning</span>
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl mx-auto text-lg">
            Access learning resources, tutorials, and materials shared by the community. Find everything
            you need to master new skills.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-300 max-w-4xl mx-auto shadow-sm">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaBookOpen className="text-4xl text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h3>
          <p className="text-gray-500 text-lg">This feature is currently under development.</p>
        </div>
      </div>
    </div>
  );
};

export default Resources;

