import React from "react";
import { Link } from "react-router-dom";
import { FaUser, FaStar, FaChevronRight } from "react-icons/fa";

const ProfileCard = ({ profileImageUrl, bio, name, skills, rating, username }) => {
  return (
    <div className="group bg-dark-card rounded-2xl shadow-sm border border-dark-border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full w-full">
      {/* Upper Section with Avatar and Header */}
      <div className="p-4 pb-1 flex flex-col items-center text-center">
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-4 border-dark-card ring-2 ring-dark-border shadow-sm group-hover:ring-cyan-500/30 transition-all duration-500">
            <img
              className="w-full h-full object-cover"
              src={profileImageUrl || "https://ui-avatars.com/api/?name=" + (name || "User") + "&background=random&size=200"}
              alt={name}
              onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=" + (name || "User") + "&background=random&size=200" }}
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-dark-bg text-[9px] font-black px-1.5 py-0.5 rounded-lg shadow-lg flex items-center gap-1">
            <FaStar className="text-[7px]" /> {rating || "4.5"}
          </div>
        </div>

        <h3 className="text-base font-bold text-slate-900 mb-0.5 leading-tight truncate w-full">{name}</h3>
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">@{username}</p>

        {bio && (
          <p className="text-slate-600 text-[11px] leading-relaxed font-medium line-clamp-2 h-8 mb-3">
            {bio}
          </p>
        )}
      </div>

      {/* Skills Section */}
      <div className="px-5 py-3 bg-dark-bg/40 border-t border-dark-border flex-grow">
        <h4 className="text-[8px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2.5">Key Skills</h4>
        <div className="flex flex-wrap gap-1.5 min-h-[40px]">
          {skills && skills.length > 0 ? (
            skills.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-white border border-dark-border text-slate-700 rounded-md text-[9px] font-bold uppercase tracking-tight"
              >
                {typeof skill === 'string' ? skill : skill.name}
              </span>
            ))
          ) : (
            <span className="text-slate-400 text-[9px] font-bold uppercase italic">No skills listed</span>
          )}
        </div>
      </div>

      {/* Footer / CTA */}
      <div className="p-3 bg-dark-card border-t border-dark-border mt-auto">
        <Link
          to={`/profile/${username}`}
          className="flex items-center justify-center gap-2 w-full py-2 bg-dark-bg border border-dark-border rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-cyan-600 hover:bg-cyan-500/5 hover:border-cyan-500/30 transition-all no-underline"
        >
          View Profile <FaChevronRight className="text-[7px]" />
        </Link>
      </div>
    </div>
  );
};

export default ProfileCard;
