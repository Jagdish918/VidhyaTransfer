import React from "react";
import { useNavigate } from "react-router-dom";
import "./Settings.css";

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="settings-container">
      <div className="settings-card">
        <h1>Settings</h1>
        <p>Settings page coming soon...</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    </div>
  );
};

export default Settings;

