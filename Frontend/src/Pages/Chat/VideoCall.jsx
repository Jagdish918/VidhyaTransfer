// VideoCall.jsx
import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import {
    FaPhone,
    FaPhoneSlash,
    FaMicrophone,
    FaMicrophoneSlash,
    FaVideo,
    FaVideoSlash,
    FaDesktop,
    FaInfoCircle,
    FaUsers,
    FaCommentAlt,
    FaExpand,
    FaCog
} from 'react-icons/fa';

const VideoCall = ({ socket, user, partner, activeCall, incomingCall, onEndCall }) => {
    const [stream, setStream] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();
    const screenStreamRef = useRef();
    const streamRef = useRef();
    const timerRef = useRef();

    // Helper to stop all tracks in a stream
    const stopStream = (st) => {
        if (st) {
            st.getTracks().forEach(track => {
                track.stop();
                console.log(`Track ${track.kind} stopped`);
            });
        }
    };

    // Format duration
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (callAccepted) {
            timerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [callAccepted]);

    useEffect(() => {
        console.log("Initializing media stream...");
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                streamRef.current = currentStream;
                if (myVideo.current) {
                    myVideo.current.srcObject = currentStream;
                }
            })
            .catch(err => console.error("Error accessing media devices:", err));

        return () => {
            console.log("Cleaning up VideoCall component...");
            stopStream(streamRef.current);
            stopStream(screenStreamRef.current);
        }
    }, [activeCall, incomingCall]);

    // Handle Initiating Call
    useEffect(() => {
        if (activeCall && stream) {
            const peer = new Peer({ initiator: true, trickle: false, stream });

            peer.on("signal", (data) => {
                if (partner && partner.id) {
                    socket.emit("callUser", {
                        userToCall: partner.id,
                        signalData: data,
                        from: user._id,
                        name: user.name
                    });
                }
            });

            peer.on("stream", (currentStream) => {
                if (userVideo.current) {
                    userVideo.current.srcObject = currentStream;
                }
            });

            socket.on("callAccepted", (signal) => {
                setCallAccepted(true);
                peer.signal(signal);
            });

            socket.on("callEnded", () => {
                console.log("Call ended by partner");
                setCallEnded(true);
                onEndCall();
            });

            connectionRef.current = peer;
        }
    }, [activeCall, stream]);

    // Handle Incoming Call Acceptance
    const answerCall = () => {
        setCallAccepted(true);
        const peer = new Peer({ initiator: false, trickle: false, stream });

        peer.on("signal", (data) => {
            socket.emit("answerCall", { signal: data, to: incomingCall.from });
        });

        peer.on("stream", (currentStream) => {
            if (userVideo.current) {
                userVideo.current.srcObject = currentStream;
            }
        });

        peer.signal(incomingCall.signal);
        connectionRef.current = peer;
    };

    const leaveCall = () => {
        console.log("Leaving call...");
        setCallEnded(true);
        if (connectionRef.current) {
            connectionRef.current.destroy();
        }

        stopStream(streamRef.current);
        stopStream(screenStreamRef.current);

        socket.emit("endCall", { to: partner.id });
        onEndCall();
    };

    const toggleMute = () => {
        const nextMute = !isMuted;
        setIsMuted(nextMute);
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach(track => track.enabled = !nextMute);
        }
    }

    const toggleVideo = () => {
        const nextVideoOff = !isVideoOff;
        setIsVideoOff(nextVideoOff);
        if (streamRef.current) {
            streamRef.current.getVideoTracks().forEach(track => track.enabled = !nextVideoOff);
        }
    }

    const handleScreenShare = () => {
        if (!isScreenSharing) {
            navigator.mediaDevices.getDisplayMedia({ cursor: true })
                .then(screenStream => {
                    const videoTrack = screenStream.getVideoTracks()[0];

                    videoTrack.onended = () => {
                        stopScreenShare();
                    };

                    if (connectionRef.current && streamRef.current) {
                        try {
                            const oldTrack = streamRef.current.getVideoTracks()[0];
                            connectionRef.current.replaceTrack(
                                oldTrack,
                                videoTrack,
                                streamRef.current
                            );
                            oldTrack.stop();
                        } catch (e) {
                            console.error("Error replacing track", e);
                        }
                    }

                    screenStreamRef.current = screenStream;
                    if (myVideo.current) {
                        myVideo.current.srcObject = screenStream;
                    }

                    const audioTrack = streamRef.current.getAudioTracks()[0];
                    if (audioTrack) {
                        screenStream.addTrack(audioTrack);
                    }

                    setStream(screenStream);
                    streamRef.current = screenStream;
                    setIsScreenSharing(true);
                    setIsVideoOff(false);
                })
                .catch(err => console.error("Error getting screen share:", err));
        } else {
            stopScreenShare();
        }
    };

    const stopScreenShare = () => {
        console.log("Stopping screen share...");
        stopStream(screenStreamRef.current);

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(webcamStream => {
                const videoTrack = webcamStream.getVideoTracks()[0];

                if (connectionRef.current && streamRef.current) {
                    try {
                        connectionRef.current.replaceTrack(
                            streamRef.current.getVideoTracks()[0],
                            videoTrack,
                            streamRef.current
                        );
                    } catch (e) {
                        console.error("Error reverting track", e);
                    }
                }

                if (myVideo.current) {
                    myVideo.current.srcObject = webcamStream;
                }

                setStream(webcamStream);
                streamRef.current = webcamStream;
                setIsScreenSharing(false);
            })
            .catch(err => console.error("Error reverting to webcam:", err));
    };

    return (
        <div className="fixed inset-0 bg-[#202124] z-[100] flex flex-col items-center justify-center font-sans overflow-hidden">

            {/* Main Video Grid */}
            <div className="relative w-full h-full flex flex-col md:flex-row p-4 md:p-6 pb-24 md:pb-28">

                {/* Main Content Area (Partner Video) */}
                <div className="relative flex-1 bg-[#3c4043] rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center group overflow-hidden">
                    {callAccepted && !callEnded ? (
                        <video
                            playsInline
                            ref={userVideo}
                            autoPlay
                            className="w-full h-full object-cover rounded-2xl transition-all duration-700"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
                            <div className="w-40 h-40 md:w-56 md:h-56 bg-blue-600 rounded-full flex items-center justify-center relative shadow-2xl shadow-blue-500/20">
                                <img
                                    src={partner?.avatar || "https://ui-avatars.com/api/?background=random"}
                                    alt={partner?.name}
                                    className="w-full h-full rounded-full object-cover border-4 border-[#3c4043]"
                                />
                                <div className="absolute inset-0 rounded-full animate-ping bg-blue-400/20 -z-10"></div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-white text-3xl font-bold mb-2 tracking-tight">{partner?.name}</h3>
                                <p className="text-blue-200/80 text-lg font-medium">
                                    {activeCall ? 'Waiting for answer...' : 'Connecting...'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Partner Name Label */}
                    {callAccepted && (
                        <div className="absolute bottom-6 left-6 flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl text-white font-semibold text-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                            {partner?.name}
                        </div>
                    )}
                </div>

                {/* Local Video - Picture in Picture Style */}
                <div className={`
                    absolute transition-all duration-500 ease-in-out border-2 border-[#5f6368] rounded-2xl overflow-hidden shadow-xl
                    ${callAccepted ? 'bottom-28 right-8 w-48 md:w-64 h-32 md:h-44 z-50' : 'hidden'}
                `}>
                    <div className="relative w-full h-full bg-[#1e1e1e] group">
                        {stream && (
                            <video
                                playsInline
                                muted
                                ref={myVideo}
                                autoPlay
                                className={`w-full h-full object-cover transform transition-transform duration-300 ${isScreenSharing ? '' : 'scale-x-[-1]'}`}
                            />
                        )}
                        {!stream && (
                            <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                <FaVideoSlash className="text-gray-600 text-3xl" />
                            </div>
                        )}
                        <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/50 px-2 py-1 rounded-lg text-white text-[10px] font-bold tracking-wide backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            You {isScreenSharing && "(Sharing)"}
                        </div>
                        {isMuted && (
                            <div className="absolute top-3 right-3 bg-red-500/80 p-1.5 rounded-full backdrop-blur-sm">
                                <FaMicrophoneSlash className="text-white text-xs" />
                            </div>
                        )}

                        {/* Overlay Controls for Local View */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all"><FaExpand size={14} /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Premium Control Bar */}
            <div className="fixed bottom-0 left-0 right-0 h-24 md:h-28 bg-[#202124] flex items-center justify-between px-6 md:px-12 z-[110]">

                {/* Left: Meeting Info */}
                <div className="hidden lg:flex flex-col gap-1 w-1/4">
                    <div className="flex items-center gap-3 text-white">
                        <span className="text-lg font-bold tracking-tight">{formatTime(callDuration)}</span>
                        <span className="h-4 w-px bg-white/20"></span>
                        <span className="text-sm font-medium text-gray-300 truncate max-w-[150px]">{partner?.name}</span>
                    </div>
                </div>

                {/* Center: Primary Controls */}
                <div className="flex items-center gap-3 md:gap-5">
                    {/* Audio Toggle */}
                    <button
                        onClick={toggleMute}
                        className={`group relative p-3.5 md:p-4 rounded-full transition-all duration-300 ${isMuted
                            ? 'bg-[#ea4335] hover:bg-[#d93025] shadow-lg shadow-red-500/20'
                            : 'bg-[#3c4043] hover:bg-[#4a4e51]'
                            }`}
                        title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                    >
                        {isMuted ? <FaMicrophoneSlash className="text-white text-lg md:text-xl" /> : <FaMicrophone className="text-white text-lg md:text-xl" />}
                        <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-gray-800 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-gray-800">
                            {isMuted ? "Unmute" : "Mute"}
                        </span>
                    </button>

                    {/* Video Toggle */}
                    <button
                        onClick={toggleVideo}
                        className={`group relative p-3.5 md:p-4 rounded-full transition-all duration-300 ${isVideoOff
                            ? 'bg-[#ea4335] hover:bg-[#d93025] shadow-lg shadow-red-500/20'
                            : 'bg-[#3c4043] hover:bg-[#4a4e51]'
                            }`}
                        title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
                    >
                        {isVideoOff ? <FaVideoSlash className="text-white text-lg md:text-xl" /> : <FaVideo className="text-white text-lg md:text-xl" />}
                        <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-gray-800 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-gray-800">
                            {isVideoOff ? "Turn on camera" : "Turn off camera"}
                        </span>
                    </button>

                    {/* Screen Share */}
                    <button
                        onClick={handleScreenShare}
                        className={`group relative p-3.5 md:p-4 rounded-full transition-all duration-300 ${isScreenSharing
                            ? 'bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa]'
                            : 'bg-[#3c4043] hover:bg-[#4a4e51] text-white'
                            }`}
                        title="Present Screen"
                    >
                        <FaDesktop className="text-lg md:text-xl" />
                        <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-gray-800 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-gray-800">
                            {isScreenSharing ? "You are presenting" : "Present now"}
                        </span>
                    </button>

                    {/* Settings / Cog */}
                    <button className="hidden sm:flex group relative p-3.5 md:p-4 rounded-full bg-[#3c4043] hover:bg-[#4a4e51] text-white transition-all duration-300">
                        <FaCog size={20} />
                        <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-gray-800 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-gray-800">
                            More options
                        </span>
                    </button>

                    {/* End Call */}
                    <button
                        onClick={leaveCall}
                        className="group relative p-4 md:p-5 bg-[#ea4335] hover:bg-[#d93025] rounded-[24px] text-white shadow-xl shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 transition-all duration-300"
                        title="Leave Call"
                    >
                        <FaPhoneSlash className="text-xl md:text-2xl" />
                        <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-gray-800 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-gray-800">
                            Leave call
                        </span>
                    </button>
                </div>

                {/* Right: Feature Toggles */}
                <div className="hidden md:flex items-center gap-2 w-1/4 justify-end">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className={`p-3 rounded-full transition-colors ${showDetails ? 'bg-[#8ab4f8]/20 text-[#8ab4f8]' : 'text-gray-400 hover:bg-white/5'}`}
                    >
                        <FaInfoCircle size={22} />
                    </button>
                    <button className="p-3 text-gray-400 hover:bg-white/5 rounded-full transition-colors"><FaUsers size={22} /></button>
                    <button className="p-3 text-gray-400 hover:bg-white/5 rounded-full transition-colors"><FaCommentAlt size={20} /></button>
                </div>
            </div>

            {/* Meeting Details Sidebar (Slide In) */}
            <div className={`
                fixed top-0 right-0 bottom-24 w-80 bg-white shadow-2xl z-[120] transition-transform duration-500 ease-in-out p-6 rounded-l-3xl
                ${showDetails ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">Meeting Details</h2>
                    <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-light">×</button>
                </div>

                <div className="space-y-6">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Joining info</p>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-sm font-medium text-gray-800 mb-1">Meet Link</p>
                            <p className="text-xs text-blue-600 truncate break-all">https://peer-swap.com/meeting/{partner?.id || 'room'}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Participant</p>
                        <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                            <img src={partner?.avatar} className="w-12 h-12 rounded-full object-cover shadow-sm" alt="" />
                            <div>
                                <p className="font-bold text-gray-900">{partner?.name}</p>
                                <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                    In the call
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Incoming Call Overlay - High Detail */}
            {!callAccepted && incomingCall && !activeCall && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
                    <div className="bg-[#202124] border border-white/10 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl shadow-blue-500/10 animate-in fade-in zoom-in-95 duration-500">
                        <div className="p-10 flex flex-col items-center">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 rounded-full animate-ping bg-blue-500/20"></div>
                                <div className="absolute inset-[-10px] rounded-full animate-pulse bg-blue-500/10 scale-110"></div>
                                <img
                                    src={partner?.avatar || "https://ui-avatars.com/api/?background=random"}
                                    className="w-32 h-32 rounded-full object-cover border-4 border-white/10 relative"
                                    alt=""
                                />
                            </div>
                            <h3 className="text-white text-3xl font-bold mb-1 tracking-tight">{partner?.name}</h3>
                            <p className="text-gray-400 font-medium mb-10 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Incoming video call
                            </p>

                            <div className="flex gap-6 w-full">
                                <button
                                    onClick={onEndCall}
                                    className="flex-1 py-4 bg-white/5 hover:bg-red-500/20 text-white rounded-2xl border border-white/10 transition-all font-bold hover:text-red-400"
                                >
                                    Decline
                                </button>
                                <button
                                    onClick={answerCall}
                                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-500/20 transition-all font-bold hover:scale-105"
                                >
                                    Answer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoCall;
