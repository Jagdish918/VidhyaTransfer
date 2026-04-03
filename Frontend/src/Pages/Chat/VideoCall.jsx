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
    FaCog,
    FaHandPaper,
    FaRegDotCircle,
    FaCircle,
    FaSmile
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const VideoCall = ({ socket, user, partner, activeCall, incomingCall, onEndCall }) => {
    const [stream, setStream] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [handRaised, setHandRaised] = useState(false);
    const [partnerHandRaised, setPartnerHandRaised] = useState(false);
    const [reactions, setReactions] = useState([]); // Array of { id, emoji, x, y }
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recordedChunks, setRecordedChunks] = useState([]);

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
    }, []); // Only init once on mount

    // Handle Socket Listeners for the Call Session
    useEffect(() => {
        if (!socket) return;

        const handleCallAccepted = (signal) => {
            console.log("[VideoCall] Call Accepted");
            setCallAccepted(true);
            if (connectionRef.current) {
                connectionRef.current.signal(signal);
            }
        };

        const handleCallEnded = () => {
            console.log("[VideoCall] Call ended by partner");
            setCallEnded(true);
            onEndCall();
        };

        const handleHandRaise = ({ raised }) => {
            setPartnerHandRaised(raised);
            if (raised) toast.info(`${partner.name} raised their hand`);
        };

        const handleReaction = ({ emoji }) => {
            const id = Date.now() + Math.random();
            setReactions(prev => [...prev.slice(-10), { id, emoji, x: 20 + Math.random() * 60 }]);
            setTimeout(() => {
                setReactions(prev => prev.filter(r => r.id !== id));
            }, 3000);
        };

        socket.on("callAccepted", handleCallAccepted);
        socket.on("callEnded", handleCallEnded);
        socket.on("partnerHandRaised", handleHandRaise);
        socket.on("partnerReaction", handleReaction);

        return () => {
            socket.off("callAccepted", handleCallAccepted);
            socket.off("callEnded", handleCallEnded);
            socket.off("partnerHandRaised", handleHandRaise);
            socket.off("partnerReaction", handleReaction);
        };
    }, [socket, partner, onEndCall]);

    // Handle Initiating Call
    useEffect(() => {
        if (activeCall && stream && !connectionRef.current) {
            console.log("[VideoCall] Initiating call to:", partner.id);
            const peer = new Peer({ 
                initiator: true, 
                trickle: false, 
                stream,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                        { urls: 'stun:stun3.l.google.com:19302' },
                        { urls: 'stun:stun4.l.google.com:19302' },
                        { urls: 'stun:stun.services.mozilla.com' }
                    ]
                }
            });

            peer.on("signal", (data) => {
                socket.emit("callUser", {
                    userToCall: partner.id,
                    signalData: data,
                    from: user._id,
                    name: user.name,
                    avatar: user.picture
                });
            });

            peer.on("stream", (currentStream) => {
                if (userVideo.current) {
                    userVideo.current.srcObject = currentStream;
                }
            });

            connectionRef.current = peer;
        }
    }, [activeCall, stream, partner, socket, user]);

    // Handle Incoming Call Acceptance
    const answerCall = () => {
        if (!stream || !incomingCall) return;
        console.log("[VideoCall] Answering call from:", incomingCall.from);
        setCallAccepted(true);
        const peer = new Peer({ 
            initiator: false, 
            trickle: false, 
            stream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stun4.l.google.com:19302' },
                    { urls: 'stun:stun.services.mozilla.com' }
                ]
            }
        });

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

    // Auto-answer only when explicitly accepted (e.g., from global notification)
    // The VideoCall component renders on both activeCall and incomingCall,
    // but should only auto-connect for receivers when they've clicked Answer

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

    const toggleHandRaise = () => {
        const nextState = !handRaised;
        setHandRaised(nextState);
        socket.emit("raiseHand", { to: partner.id, raised: nextState });
    };

    const sendReaction = (emoji) => {
        socket.emit("sendReaction", { to: partner.id, emoji });
        const id = Date.now() + Math.random();
        setReactions(prev => [...prev.slice(-10), { id, emoji, x: 20 + Math.random() * 60 }]);
        setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== id));
        }, 3000);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const startRecording = () => {
        if (!streamRef.current || !userVideo.current?.srcObject) {
            toast.error("No stream found to record");
            return;
        }

        const chunks = [];
        // Combine audio and video streams if possible, or just video
        const combinedStream = new MediaStream([
            ...streamRef.current.getTracks(),
            ...(userVideo.current.srcObject.getTracks())
        ]);

        const recorder = new MediaRecorder(combinedStream);
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `meeting_record_${Date.now()}.webm`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Recording saved successfully");
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
        toast.info("Recording started");
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setIsRecording(false);
            setMediaRecorder(null);
        }
    };

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
                <div className="relative flex-1 bg-[#3c4043] rounded-2xl flex items-center justify-center group overflow-hidden shadow-2xl">
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
                                    src={partner?.avatar || "https://ui-avatars.com/api/?name=" + (partner?.name || "U") + "&background=random&size=200"}
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
                            {partnerHandRaised && (
                                <span className="bg-amber-500 text-white p-1 rounded-md animate-bounce">
                                    <FaHandPaper size={12} />
                                </span>
                            )}
                        </div>
                    )}

                    {/* Floating Reactions Layer */}
                    <AnimatePresence>
                        {reactions.map(r => (
                            <motion.div
                                key={r.id}
                                initial={{ y: '100vh', opacity: 0, x: `${r.x}vw` }}
                                animate={{ y: '-10vh', opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 3, ease: 'easeOut' }}
                                className="absolute pointer-events-none text-4xl z-[150]"
                            >
                                {r.emoji}
                            </motion.div>
                        ))}
                    </AnimatePresence>
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
                            <button onClick={toggleFullscreen} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all"><FaExpand size={14} /></button>
                            {handRaised && (
                                <div className="p-2 bg-amber-500 rounded-full text-white shadow-lg animate-pulse">
                                    <FaHandPaper size={14} />
                                </div>
                            )}
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

                    {/* Hand Raise */}
                    <button
                        onClick={toggleHandRaise}
                        className={`group relative p-3.5 md:p-4 rounded-full transition-all duration-300 ${handRaised
                            ? 'bg-amber-400 text-amber-900'
                            : 'bg-[#3c4043] hover:bg-[#4a4e51] text-white'
                            }`}
                        title="Raise Hand"
                    >
                        <FaHandPaper className="text-lg md:text-xl" />
                        <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-gray-800 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-gray-800">
                            {handRaised ? "Lower Hand" : "Raise Hand"}
                        </span>
                    </button>

                    {/* Recording Toggle */}
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`group relative p-3.5 md:p-4 rounded-full transition-all duration-300 ${isRecording
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'bg-[#3c4043] hover:bg-[#4a4e51] text-white'
                            }`}
                        title={isRecording ? "Stop Recording" : "Start Recording"}
                    >
                        {isRecording ? <FaCircle className="text-xs" /> : <FaRegDotCircle className="text-xl" />}
                        <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-gray-800 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-gray-800">
                            {isRecording ? "Stop Recording" : "Record Call"}
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

                    {/* Reactions - Quick Emoji Bar */}
                    <div className="hidden lg:flex items-center bg-[#3c4043] rounded-full px-2 py-1 gap-1 border border-white/5">
                        {['👍', '🔥', '❤️', '👏', '😂'].map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => sendReaction(emoji)}
                                className="hover:bg-white/10 p-2 rounded-full transition-colors text-lg"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>

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
                        onClick={() => { setShowDetails(!showDetails); setShowParticipants(false); }}
                        className={`p-3 rounded-full transition-colors ${showDetails ? 'bg-[#8ab4f8]/20 text-[#8ab4f8]' : 'text-gray-400 hover:bg-white/5'}`}
                        title="Meeting Details"
                    >
                        <FaInfoCircle size={22} />
                    </button>
                    <button 
                        onClick={() => { setShowParticipants(!showParticipants); setShowDetails(false); }}
                        className={`p-3 rounded-full transition-colors ${showParticipants ? 'bg-[#8ab4f8]/20 text-[#8ab4f8]' : 'text-gray-400 hover:bg-white/5'}`}
                        title="Participants"
                    >
                        <FaUsers size={22} />
                    </button>
                    <button className="p-3 text-gray-400 hover:bg-white/5 rounded-full transition-colors" title="Chat"><FaCommentAlt size={20} /></button>
                </div>
            </div>

            {/* Participants Sidebar (Slide In) */}
            <div className={`
                fixed top-0 right-0 bottom-24 w-80 bg-white shadow-2xl z-[120] transition-transform duration-500 ease-in-out p-6 rounded-l-3xl
                ${showParticipants ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">Participants</h2>
                    <button onClick={() => setShowParticipants(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-light">×</button>
                </div>

                <div className="space-y-4">
                    {/* Partner */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                            <img src={partner?.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                            <p className="font-bold text-gray-900 text-sm">{partner?.name}</p>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <FaMicrophone size={12} />
                            <FaVideo size={12} />
                        </div>
                    </div>
                    {/* You */}
                    <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-3">
                            <img src={user?.picture} className="w-10 h-10 rounded-full object-cover" alt="" />
                            <p className="font-bold text-blue-900 text-sm">You (Host)</p>
                        </div>
                        <div className="flex items-center gap-2 text-blue-400">
                            {isMuted ? <FaMicrophoneSlash size={12} className="text-red-400" /> : <FaMicrophone size={12} />}
                            {isVideoOff ? <FaVideoSlash size={12} className="text-red-400" /> : <FaVideo size={12} />}
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
                                    src={partner?.avatar || "https://ui-avatars.com/api/?name=" + (partner?.name || "U") + "&background=random&size=200"}
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
