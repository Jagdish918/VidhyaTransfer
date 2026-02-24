import React from "react";
import { Link } from "react-router-dom";

const ProfileCard = ({ profileImageUrl, bio, name, skills, rating, username }) => {
  return (
    <div className="flex flex-col justify-between items-center font-['Montserrat'] bg-[#00000050] rounded-[25px] shadow-[10px_10px_15px_rgba(0,0,0,0.35)] text-[#b3c2cd] relative w-[300px] min-w-[300px] h-[450px] max-w-full text-center m-12 overflow-hidden md:w-[50vw] md:h-[60vh]">
      <img
        className="border border-[#fbf1a4] rounded-full p-[7px] h-[100px] w-[100px] m-4 aspect-square text-white object-cover bg-gray-800"
        src={profileImageUrl || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"}
        alt=""
        onError={(e) => { e.target.src = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png" }}
      />
      <h3 className="font-['Montserrat'] m-[10px_0]">{name}</h3>
      <h6 className="font-['Montserrat'] text-[1rem] m-[5px_0] uppercase">Rating: {rating} ⭐</h6>
      <p className="font-['Montserrat'] text-[14px] leading-[21px] truncate w-[150px] mx-auto">{bio}</p>
      <div className="flex justify-around">
        <Link to={`/profile/${username}`} className="no-underline">
          <button className="m-4 bg-transparent text-[#3bb4a1] border border-[#3bb4a1] rounded-[3px] p-[0.4rem] font-medium transition-all duration-300 hover:bg-[#ffffff27]">
            View Profile
          </button>
        </Link>
      </div>
      <div className="bg-[rgba(48,88,100,0.284)] px-[1rem] pt-[0.3rem] text-left mt-[1rem] h-[15vh] w-full overflow-y-auto">
        <h6 className="font-['Montserrat'] text-[1rem] m-[5px_0] uppercase">Skills</h6>
        <div className="m-[1rem] flex flex-wrap">
          {skills && skills.length > 0 ? (
            skills.map((skill, index) => (
              <div key={index} className="text-center bg-[#809c5c] text-white p-[0.5rem] mr-[1rem] mt-[1rem] rounded-[5px] min-w-[4rem]">
                <span className="skill">{typeof skill === 'string' ? skill : skill.name}</span>
              </div>
            ))
          ) : (
            <span className="skill" style={{ color: "var(--light-grey)" }}>No skills listed</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
