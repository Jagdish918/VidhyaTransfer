import React from "react";
import Card from "react-bootstrap/Card";
import "./Card.css";
import { Link } from "react-router-dom";

const ProfileCard = ({ profileImageUrl, bio, name, skills, rating, username }) => {
  return (
    <div className="card-container">
      <img className="img-container" src={profileImageUrl} alt="user" />
      <h3>{name}</h3>
      <h6>Rating: {rating} ⭐</h6>
      <p style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "150px" }}>{bio}</p>
      <div className="prof-buttons">
        {/* <button className="primary">Connect</button> */}
        <Link to={`/profile/${username}`}>
          <button className="primary ghost">View Profile</button>
        </Link>
      </div>
      <div className="profskills">
        <h6>Skills</h6>
        <div className="profskill-boxes">
          {skills && skills.length > 0 ? (
            skills.map((skill, index) => (
              <div key={index} className="profskill-box">
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
