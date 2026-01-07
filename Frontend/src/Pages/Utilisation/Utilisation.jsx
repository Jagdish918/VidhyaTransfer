import React from "react";
import { useUser } from "../../util/UserContext";
import "./Utilisation.css";

const Utilisation = () => {
  const { user } = useUser();

  return (
    <div className="utilisation-container">
      <div className="container">
        <h1 className="page-title">Utilisation</h1>
        <p className="page-description">
          Track how you're utilizing your skills and see analytics on your learning journey. Monitor your
          progress and optimize your skill development.
        </p>
        <div className="coming-soon">
          <p>This feature is coming soon!</p>
        </div>
      </div>
    </div>
  );
};

export default Utilisation;

