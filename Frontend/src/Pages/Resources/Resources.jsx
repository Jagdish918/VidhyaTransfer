import React from "react";
import { useUser } from "../../util/UserContext";
import "./Resources.css";

const Resources = () => {
  const { user } = useUser();

  return (
    <div className="resources-container">
      <div className="container">
        <h1 className="page-title">Resources</h1>
        <p className="page-description">
          Access learning resources, tutorials, and materials shared by the community. Find everything
          you need to master new skills.
        </p>
        <div className="coming-soon">
          <p>This feature is coming soon!</p>
        </div>
      </div>
    </div>
  );
};

export default Resources;

