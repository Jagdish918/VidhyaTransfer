import React from "react";
import { FaBullseye, FaEye, FaUsers } from "react-icons/fa";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-sky-100 to-gray-50 font-sans">
      {/* Hero Section */}
      <div className="pt-24 px-5 pb-20 text-center max-w-[1280px] mx-auto">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-br from-teal-500 via-blue-500 to-emerald-500 bg-clip-text text-transparent mb-6 tracking-tighter">
          About Vidya Transfer
        </h1>
        <p className="text-base md:text-xl text-slate-600 leading-relaxed max-w-[800px] mx-auto">
          Reimagining peer-to-peer learning through innovative technology and community-driven knowledge sharing.
        </p>
      </div>

      {/* Main Content Section */}
      <div className="px-5 pb-24 max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left Side - Mission and Vision Cards */}
          <div className="flex flex-col gap-8">
            {/* Mission Card */}
            <div className="bg-white/70 backdrop-blur-md rounded-3xl p-10 border border-white/80 shadow-lg relative transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-br from-blue-500 to-blue-600">
                <FaBullseye className="text-2xl text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Our Mission</h2>
              <p className="text-base text-slate-600 leading-relaxed m-0">
                To democratize learning by creating a platform where anyone can share their knowledge and learn from others.
                We believe that everyone has something valuable to teach and something meaningful to learn, breaking down
                traditional barriers to education.
              </p>
            </div>

            {/* Vision Card */}
            <div className="bg-white/70 backdrop-blur-md rounded-3xl p-10 border border-white/80 shadow-lg relative transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-br from-amber-500 to-amber-600">
                <FaEye className="text-2xl text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Our Vision</h2>
              <p className="text-base text-slate-600 leading-relaxed m-0">
                To build a global community where knowledge is accessible, learning is collaborative, and every interaction
                creates value for both teachers and students. We envision a future where skills are shared freely and
                communities grow stronger through collective wisdom.
              </p>
            </div>
          </div>

          {/* Right Side - Community Visual */}
          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white/80 shadow-lg flex flex-col gap-6">
            <div className="w-full rounded-2xl overflow-hidden bg-slate-100">
              <img
                src="https://media.licdn.com/dms/image/v2/D4D12AQF8Zym1URlUdw/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1675779883789?e=2147483647&v=beta&t=Sdl1tnLrAV89A5FJHCK95ruH4oA8kWjvL7YfPLRFDH4"
                alt="Community"
                className="w-full h-auto block"
              />
            </div>
            <div className="flex items-center gap-3 px-5 py-4 bg-white rounded-xl shadow-sm">
              <FaUsers className="text-xl text-blue-500" />
              <span className="text-base font-semibold text-slate-800">10,000+ Community Members</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
