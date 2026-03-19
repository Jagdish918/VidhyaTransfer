import React from "react";
import { Link } from "react-router-dom";
import { FaUser, FaStar, FaChevronRight } from "react-icons/fa";

const ProfileCard = ({ profileImageUrl, bio, name, skills, rating, username }) => {
  return (
    <div className="group bg-dark-card rounded-3xl shadow-card border border-dark-border overflow-hidden transition-all duration-300 hover:shadow-soft hover:-translate-y-1 flex flex-col h-full w-full max-w-[320px] mx-auto">
      {/* Upper Section with Avatar and Header */}
      <div className="p-6 pb-2 flex flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-dark-card ring-2 ring-dark-border shadow-sm group-hover:ring-cyan-500/30 transition-all duration-500">
            <img
              className="w-full h-full object-cover"
              src={profileImageUrl || "https://ui-avatars.com/api/?name=" + (name || "User") + "&background=random&size=200"}
              alt={name}
              onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=" + (name || "User") + "&background=random&size=200" }}
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-amber-500 text-dark-bg text-[10px] font-black px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
            <FaStar className="text-[8px]" /> {rating || "0.0"}
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1 leading-tight truncate w-full">{name}</h3>
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4">@{username}</p>
        
        {bio && (
          <p className="text-slate-700 text-xs leading-relaxed font-medium line-clamp-2 h-8 mb-4">
            {bio}
          </p>
        )}
      </div>

      {/* Skills Section */}
      <div className="px-6 py-4 bg-dark-bg/50 border-t border-dark-border flex-grow">
        <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.15em] mb-3">Top Skills</h4>
        <div className="flex flex-wrap gap-1.5 min-h-[50px]">
          {skills && skills.length > 0 ? (
            skills.slice(0, 3).map((skill, index) => (
              <span 
                key={index} 
                className="px-2.5 py-1 bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 rounded-lg text-[9px] font-bold uppercase tracking-wider"
              >
                {typeof skill === 'string' ? skill : skill.name}
              </span>
            ))
          ) : (
            <span className="text-slate-500 text-[9px] font-bold uppercase italic">No skills listed</span>
          )}
          {skills && skills.length > 3 && (
            <span className="px-2 py-1 bg-dark-hover text-slate-600 border border-dark-border rounded-lg text-[9px] font-bold">
              +{skills.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Footer / CTA */}
      <div className="p-4 bg-dark-card border-t border-dark-border mt-auto">
        <Link 
          to={`/profile/${username}`} 
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-dark-bg border border-dark-border rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:text-cyan-600 hover:bg-cyan-500/5 hover:border-cyan-500/30 transition-all no-underline"
        >
          View Full Profile <FaChevronRight className="text-[8px]" />
        </Link>
      </div>
    </div>
  );
};

export default ProfileCard;
