import React from "react";
import { useUser } from "../../util/UserContext";
import "./SkillGain.css";

const SkillGain = () => {
  const { user } = useUser();

  return (
    <div className="skill-gain-container">
      <div className="container">
        <h1 className="page-title">Skill Gain</h1>
        <p className="page-description">
          Discover new skills to learn and find mentors who can help you grow. Track your learning progress
          and achieve your goals.
        </p>
        <div className="coming-soon">
          <p>This feature is coming soon!</p>
        </div>
      </div>
    </div>
  );
};

export default SkillGain;

