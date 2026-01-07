import React from "react";
import { useUser } from "../../util/UserContext";
import "./PeerSwap.css";

const PeerSwap = () => {
  const { user } = useUser();

  return (
    <div className="peer-swap-container">
      <div className="container">
        <h1 className="page-title">Peer Swap</h1>
        <p className="page-description">
          Connect with peers to exchange skills and knowledge. Find someone who wants to learn what you know,
          and learn what they know in return.
        </p>
        <div className="coming-soon">
          <p>This feature is coming soon!</p>
        </div>
      </div>
    </div>
  );
};

export default PeerSwap;

