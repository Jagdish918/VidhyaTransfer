import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from "axios";
import { useUser } from "../../util/UserContext";
import { FaVideo, FaSearch, FaPaperPlane, FaCalendarAlt, FaTrash, FaReply, FaTimes, FaCoins } from "react-icons/fa";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import InfiniteScroll from "react-infinite-scroll-component";
import VideoCall from "./VideoCall";
import ScheduleMeeting from "./ScheduleMeeting";

const EMOJIS = ['❤️', '😂', '😮', '😢', '👍', '🙏'];

const Chat = () => {
    const formatChatListTime = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        const today = new Date();
        const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();
        if (isYesterday) {
            return "Yesterday";
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
    };

    const { user, setUser, socket, incomingCall, setIncomingCall, wasAccepted, setWasAccepted } = useUser();
    const [chats, setChats] = useState([]);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [unreadChatIds, setUnreadChatIds] = useState(new Set());
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    // Context menu state
    const [contextMenu, setContextMenu] = useState(null); // { msgId, x, y, isMe }
    const [replyingTo, setReplyingTo] = useState(null); // message object
    const [emojiPickerFor, setEmojiPickerFor] = useState(null); // msgId
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const [typing, setTyping] = useState(false);
    const typingTimeoutRef = useRef(null);

    const messagesEndRef = useRef(null);
    const contextMenuRef = useRef(null); // Socket Initialization moved to UserContext
    const [activeCall, setActiveCall] = useState(false);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);

    // Auto-answer if arrived via notification — keep for re-render trigger only
    // The actual answer happens inside VideoCall when incomingCall is present
    // We just ensure the VideoCall renders (it does via line 327's condition)

    // Close context menu on outside click
    useEffect(() => {
        const handler = (e) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
                setContextMenu(null);
                setEmojiPickerFor(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const startCall = () => { if (!selectedChatId) return; setActiveCall(true); };
    const endCall = () => { setActiveCall(false); setIncomingCall(null); };

    // Scroll variables
    const chatContainerRef = useRef(null);

    // Keep a ref to selectedChatId so the socket listener always has the latest value
    const selectedChatIdRef = useRef(selectedChatId);
    useEffect(() => {
        selectedChatIdRef.current = selectedChatId;
    }, [selectedChatId]);

    // Socket: global listener for incoming messages (always active when socket exists)
    useEffect(() => {
        if (!socket) return;

        const handleMessageReceived = (newMessage) => {
            const msgChatId = (newMessage.chatId?._id || newMessage.chatId || "").toString();
            console.log("[Socket] Message received for chat:", msgChatId, "current chat:", selectedChatIdRef.current);

            // Add message to the messages list if this chat is currently open
            if (msgChatId === selectedChatIdRef.current) {
                setMessages(prev => [newMessage, ...prev]);
            } else {
                setUnreadChatIds(prev => {
                    const next = new Set(prev);
                    next.add(msgChatId);
                    return next;
                });
            }

            // Always update the chat list sidebar with the latest message
            setChats(prev => prev.map(c => {
                if (c._id === msgChatId) {
                    return { ...c, latestMessage: newMessage };
                }
                return c;
            }));
        };

        socket.on("message received", handleMessageReceived);

        socket.on("user status update", ({ userId, isOnline, lastSeen }) => {
            setChats(prev => prev.map(chat => {
                const updatedUsers = chat.users.map(u => {
                    if (u._id === userId) return { ...u, isOnline, lastSeen };
                    return u;
                });
                return { ...chat, users: updatedUsers };
            }));
        });

        socket.on("message seen", ({ messageId, chatId }) => {
            if (chatId === selectedChatIdRef.current) {
                setMessages(prev => prev.map(m => 
                    m._id === messageId ? { ...m, isRead: true, readAt: new Date() } : m
                ));
            }
            // Update the latest message info in the sidebar too
            setChats(prev => prev.map(c => {
                if (c._id === chatId && c.latestMessage?._id === messageId) {
                    return { ...c, latestMessage: { ...c.latestMessage, isRead: true } };
                }
                return c;
            }));
        });

        socket.on("typing", (room) => {
            if (room === selectedChatIdRef.current) setIsPartnerTyping(true);
        });

        socket.on("stop typing", (room) => {
            if (room === selectedChatIdRef.current) setIsPartnerTyping(false);
        });

        return () => {
            socket.off("message received", handleMessageReceived);
            socket.off("user status update");
            socket.off("message seen");
            socket.off("typing");
            socket.off("stop typing");
        };
    }, [socket]);

    // Socket: join chat room when a chat is selected
    useEffect(() => {
        if (!socket || !selectedChatId) return;
        socket.emit("join chat", selectedChatId);
    }, [socket, selectedChatId]);

    // Fetch Chats
    useEffect(() => {
        const fetchChats = async () => {
            setLoadingChats(true);
            try {
                const { data } = await axios.get("/chat", { withCredentials: true });
                const fetchedChats = data.data || [];
                setChats(fetchedChats);
                const newUnreadIds = new Set();
                fetchedChats.forEach(chat => {
                    const latestMsg = chat.latestMessage;
                    if (latestMsg) {
                        const senderId = latestMsg.sender?._id || latestMsg.sender;
                        if (senderId !== user._id && !latestMsg.isRead) {
                            newUnreadIds.add(chat._id);
                        }
                    }
                });
                setUnreadChatIds(newUnreadIds);
            } catch (error) {
                console.error("Error fetching chats:", error);
            } finally {
                setLoadingChats(false);
            }
        };
        fetchChats();
    }, []);

    const handleChatSelect = (chatId) => {
        if (selectedChatId === chatId) return;
        setSelectedChatId(chatId);
        setReplyingTo(null);
        setContextMenu(null);
        setMessages([]);
        setPage(1);
        setHasMore(false);

        if (unreadChatIds.has(chatId)) {
            const nextUnread = new Set(unreadChatIds);
            nextUnread.delete(chatId);
            setUnreadChatIds(nextUnread);
        }
    };

    // Fetch Messages Initial
    useEffect(() => {
        if (!selectedChatId) return;
        const fetchMessages = async () => {
            setLoadingMessages(true);
            try {
                const { data } = await axios.get(`/message/getMessages/${selectedChatId}?page=1`, { withCredentials: true });
                const fetchedMessages = data?.data?.messages || data?.data || [];
                setMessages([...fetchedMessages].reverse());
                setHasMore(data?.data?.pagination?.hasMore ?? false);
                setPage(1);

                // Mark unread messages as read
                fetchedMessages.forEach(msg => {
                    if (!msg.isRead && msg.sender._id !== user._id && socket) {
                        socket.emit("message read", { messageId: msg._id, chatId: selectedChatId });
                    }
                });
            } catch (error) {
                console.error("Error fetching messages:", error);
            } finally {
                setLoadingMessages(false);
            }
        };
        fetchMessages();
    }, [selectedChatId, socket]);

    // Handle marking incoming message as read if chat is open
    useEffect(() => {
        if (!selectedChatId || !socket || messages.length === 0) return;
        const lastMsg = messages[0]; // Messages are in reverse order (newest first)
        if (lastMsg.sender._id !== user._id && !lastMsg.isRead) {
            socket.emit("message read", { messageId: lastMsg._id, chatId: selectedChatId });
        }
    }, [messages, selectedChatId, socket]);

    // Fetch older messages
    const fetchMoreMessages = async () => {
        if (!selectedChatId || !hasMore) return;

        try {
            const nextPage = page + 1;
            const { data } = await axios.get(`/message/getMessages/${selectedChatId}?page=${nextPage}`, { withCredentials: true });

            // Getting scroll height before adding new messages
            const container = chatContainerRef.current;
            const scrollHeightBefore = container ? container.scrollHeight : 0;

            const newMessages = data?.data?.messages || [];

            if (newMessages.length > 0) {
                setMessages(prev => [...prev, ...[...newMessages].reverse()]);
                setPage(nextPage);
                setHasMore(data?.data?.pagination?.hasMore ?? false);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching older messages:", error);
        }
    };

    const activeChat = chats.find(c => c._id === selectedChatId);

    const getChatPartner = (chat) => {
        if (!chat || !chat.users) return { _id: null, name: "Unknown", avatar: "/default-avatar.png", status: "Offline" };
        const partner = chat.users.find(u => u._id !== user._id);
        return {
            _id: partner?._id,
            name: partner?.name || partner?.username || "User",
            avatar: partner?.picture || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            isOnline: partner?.isOnline,
            lastSeen: partner?.lastSeen
        };
    };

    const partner = activeChat ? getChatPartner(activeChat) : { name: "", avatar: "", status: "" };

    // ── Send Message ──────────────────────────────────────────
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedChatId) return;

        const tempId = Date.now();
        const optimisticMessage = {
            _id: tempId,
            content: messageInput,
            sender: { _id: user._id, name: user.name, picture: user.picture },
            replyTo: replyingTo || null,
            reactions: [],
            createdAt: new Date().toISOString()
        };

        setMessages(prev => [optimisticMessage, ...prev]);
        setMessageInput("");
        setReplyingTo(null);

        try {
            const { data } = await axios.post("/message/sendMessage", {
                chatId: selectedChatId,
                content: optimisticMessage.content,
                replyTo: replyingTo?._id || null
            }, { withCredentials: true });

            setMessages(prev => prev.map(msg => msg._id === tempId ? data.data : msg));
            setChats(prev => prev.map(c => c._id === selectedChatId ? { ...c, latestMessage: data.data } : c));
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => prev.filter(msg => msg._id !== tempId));
        }
    };

    const handleInputChange = (e) => {
        setMessageInput(e.target.value);
        if (!socket || !selectedChatId) return;

        if (!typing) {
            setTyping(true);
            socket.emit("typing", selectedChatId);
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stop typing", selectedChatId);
            setTyping(false);
        }, 3000);
    };

    // ── Delete Message ────────────────────────────────────────
    const handleDeleteMessage = async (msgId) => {
        setContextMenu(null);
        try {
            const { data } = await axios.delete(`/message/${msgId}`, { withCredentials: true });
            setMessages(prev => prev.map(m => m._id === msgId ? { ...m, deleted: true, content: "This message was deleted" } : m));
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    // ── React to Message ──────────────────────────────────────
    const handleReact = async (msgId, emoji) => {
        setEmojiPickerFor(null);
        setContextMenu(null);
        try {
            const { data } = await axios.patch(`/message/${msgId}/react`, { emoji }, { withCredentials: true });
            setMessages(prev => prev.map(m => m._id === msgId ? { ...m, reactions: data.data.reactions } : m));
        } catch (error) {
            console.error("Error reacting:", error);
        }
    };

    // ── Schedule Meeting ──────────────────────────────────────
    const handleScheduleMeeting = async (details) => {
        const { title, date, time, type, link } = details;
        const meetingMessage = `📅 Scheduled Meeting\n\n📌 ${title}\n🗓 ${new Date(date).toLocaleDateString()} at ${time}\n🔗 ${type === 'internal' ? 'Video Call' : link}`;
        const tempId = Date.now();
        const optimisticMessage = {
            _id: tempId,
            content: meetingMessage,
            sender: { _id: user._id, name: user.name, picture: user.picture },
            reactions: [],
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [optimisticMessage, ...prev]);
        try {
            const { data } = await axios.post("/message/sendMessage", { chatId: selectedChatId, content: meetingMessage }, { withCredentials: true });
            await axios.post("/events/schedule", { chatId: selectedChatId, title, date, time, type, link }, { withCredentials: true });
            setMessages(prev => prev.map(msg => msg._id === tempId ? data.data : msg));
            setChats(prev => prev.map(c => c._id === selectedChatId ? { ...c, latestMessage: data.data } : c));
        } catch (error) {
            console.error("Error scheduling meeting:", error);
            setMessages(prev => prev.filter(msg => msg._id !== tempId));
        }
    };

    // ── Transfer Credits ──────────────────────────────────────
    const handleTransferCredits = async () => {
        if (!selectedChatId || !partner._id) return;

        const amount = prompt(`How many credits would you like to pay to ${partner.name}?`);
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            if (amount !== null) toast.error("Please enter a valid amount");
            return;
        }

        try {
            const { data } = await axios.post("/payment/transfer-credits", {
                receiverId: partner._id,
                amount: Number(amount)
            }, { withCredentials: true });

            if (data.success) {
                toast.success(`Successfully paid ${amount} credits to ${partner.name}`);

                // Update local user state if setUser is available
                if (setUser && data.senderCredits !== undefined) {
                    setUser(prev => ({ ...prev, credits: data.senderCredits }));
                }

                // Send a message to the chat about the payment
                const paymentMessage = `💰 Sent ${amount} credits to ${partner.name}`;
                const tempId = Date.now();
                const optimisticMessage = {
                    _id: tempId,
                    content: paymentMessage,
                    sender: { _id: user._id, name: user.name, picture: user.picture },
                    reactions: [],
                    createdAt: new Date().toISOString()
                };

                setMessages(prev => [optimisticMessage, ...prev]);

                const msgRes = await axios.post("/message/sendMessage", {
                    chatId: selectedChatId,
                    content: paymentMessage
                }, { withCredentials: true });

                setMessages(prev => prev.map(msg => msg._id === tempId ? msgRes.data.data : msg));
            }
        } catch (error) {
            console.error("Error transferring credits:", error);
            toast.error(error.response?.data?.message || "Failed to transfer credits");
        }
    };

    // ── Right-click / long-press context menu ─────────────────
    const handleMessageContextMenu = (e, msg, isMe) => {
        e.preventDefault();
        setEmojiPickerFor(null);
        setContextMenu({ msgId: msg._id, msg, x: e.clientX, y: e.clientY, isMe });
    };

    if (loadingChats) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
    );

    if (chats.length === 0) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm text-center max-w-sm">
                <img src="https://cdn-icons-png.flaticon.com/512/2665/2665038.png" alt="No Chats" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h2 className="text-lg font-bold text-gray-900 mb-1">No conversations yet</h2>
                <p className="text-sm text-gray-500 mb-4">Connect with peers in the Peer Swap section to start chatting!</p>
                <a href="/peer-swap" className="inline-block px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm">Find Peers</a>
            </div>
        </div>
    );

    const chatPartnerData = activeChat ? getChatPartner(activeChat) : { _id: null, name: "Unknown", avatar: "", status: "" };
    const videoCallPartner = incomingCall
        ? { id: incomingCall.from, name: incomingCall.name, avatar: incomingCall.avatar || "https://ui-avatars.com/api/?background=random" }
        : { id: chatPartnerData._id, name: chatPartnerData.name, avatar: chatPartnerData.avatar };

    return (
        <div className="h-[calc(100vh-65px)] bg-gray-50 flex flex-col p-4 md:p-6 overflow-hidden">
            <ScheduleMeeting isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} onSchedule={handleScheduleMeeting} />

            {(activeCall || incomingCall) && (
                <VideoCall socket={socket} user={user} partner={videoCallPartner} activeCall={activeCall} incomingCall={incomingCall} onEndCall={endCall} />
            )}

            {/* ── Context Menu ── */}
            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden min-w-[180px] py-1"
                    style={{ top: Math.min(contextMenu.y, window.innerHeight - 200), left: Math.min(contextMenu.x, window.innerWidth - 210) }}
                >
                    {/* Emoji reactions row */}
                    <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100">
                        {EMOJIS.map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => handleReact(contextMenu.msgId, emoji)}
                                className="text-xl hover:scale-125 transition-transform p-0.5 rounded-lg hover:bg-gray-100"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                    {/* Reply */}
                    <button
                        onClick={() => { setReplyingTo(contextMenu.msg); setContextMenu(null); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 font-medium transition-colors"
                    >
                        <FaReply className="text-blue-500" size={13} /> Reply
                    </button>
                    {/* Delete – only for sender */}
                    {contextMenu.isMe && !contextMenu.msg.deleted && (
                        <button
                            onClick={() => handleDeleteMessage(contextMenu.msgId)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-sm text-red-500 font-medium transition-colors"
                        >
                            <FaTrash size={12} /> Delete
                        </button>
                    )}
                </div>
            )}

            <div className={`flex-1 app-container w-full mx-auto flex h-full gap-6`}>

                {/* Left Sidebar */}
                <div className={`w-full md:w-80 bg-white shadow-sm border border-gray-200 rounded-2xl flex flex-col overflow-hidden ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-3 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Chats</h2>
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                            <input type="text" placeholder="Search..." className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {chats.map(chat => {
                            const chatPartner = getChatPartner(chat);
                            const isUnread = unreadChatIds.has(chat._id) && selectedChatId !== chat._id;
                            return (
                                <div
                                    key={chat._id}
                                    onClick={() => handleChatSelect(chat._id)}
                                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 ${selectedChatId === chat._id ? 'bg-blue-50/60' : ''}`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <img src={chatPartner.avatar} alt={chatPartner.name} className="w-10 h-10 rounded-full object-cover" />
                                        {chatPartner.isOnline && (
                                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h3 className={`text-sm truncate ${isUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'} ${selectedChatId === chat._id ? 'text-blue-700' : ''}`}>
                                                {chatPartner.name}
                                            </h3>
                                            <span className="text-[10px] text-gray-400">{formatChatListTime(chat.latestMessage?.createdAt)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className={`text-xs truncate ${isUnread ? 'font-bold text-gray-900' : 'text-gray-500'} ${selectedChatId === chat._id ? 'text-blue-600' : ''}`}>
                                                {chat.latestMessage ? (
                                                    <span>{chat.latestMessage.sender === user._id ? 'You: ' : ''}{chat.latestMessage.content}</span>
                                                ) : "Start a conversation"}
                                            </p>
                                            {isUnread && (
                                                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold ml-2">1</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right – Chat Window */}
                <div className={`flex-1 bg-white shadow-sm border border-gray-200 rounded-2xl flex flex-col overflow-hidden ${!selectedChatId ? 'hidden md:flex' : 'flex'} h-full`}>
                    {!selectedChatId ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500 bg-white">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <FaPaperPlane className="text-gray-300 text-4xl transform -rotate-12 translate-x-1 translate-y-1" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Your Messages</h3>
                            <p className="max-w-xs mx-auto text-sm">Select a conversation from the list or start a new swap request to begin chatting.</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="px-4 py-3 bg-white border-b border-gray-100 flex justify-between items-center shadow-sm z-10 h-16">
                                <Link to={`/profile/${partner._id}`} className="flex items-center gap-3 no-underline hover:opacity-80 transition-opacity">
                                    <button className="md:hidden text-gray-500 mr-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedChatId(null); }}>←</button>
                                    <div className="relative">
                                        <img src={partner.avatar} alt={partner.name} className="w-8 h-8 rounded-full object-cover" />
                                        {partner.isOnline && (
                                            <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm leading-tight">{partner.name}</h3>
                                        <div className="flex items-center gap-1">
                                            {partner.isOnline ? (
                                                <>
                                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                                    <p className="text-[10px] text-green-600 font-bold">Online</p>
                                                </>
                                            ) : (
                                                <p className="text-[10px] text-gray-400 font-medium italic">Offline</p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                                <div className="flex gap-2">
                                    <button onClick={handleTransferCredits} className="px-3 py-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-2 text-xs font-semibold">
                                        <FaCoins /> Pay Credits
                                    </button>
                                    <button onClick={() => setIsScheduleOpen(true)} className="px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2 text-xs font-semibold">
                                        <FaCalendarAlt /> Schedule
                                    </button>
                                    <button onClick={startCall} className="px-3 py-1.5 text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors flex items-center gap-2 text-xs font-semibold shadow-md shadow-green-200">
                                        <FaVideo /> Video Call
                                    </button>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div
                                id="scrollableDiv"
                                className="flex-1 overflow-y-auto p-4 bg-[#f5f7fa] flex flex-col-reverse"
                                ref={chatContainerRef}
                            >
                                {loadingMessages ? (
                                    <div className="flex justify-center mt-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center text-gray-400 mt-10">
                                        <p className="text-sm">Start the conversation with {partner.name}</p>
                                        <p className="text-xs mt-1 text-gray-300">Right-click a message to react, reply or delete</p>
                                    </div>
                                ) : (
                                    <InfiniteScroll
                                        dataLength={messages.length}
                                        next={fetchMoreMessages}
                                        style={{ display: 'flex', flexDirection: 'column-reverse', gap: '6px' }}
                                        inverse={true}
                                        hasMore={hasMore}
                                        loader={<div className="flex justify-center py-2"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div></div>}
                                        scrollableTarget="scrollableDiv"
                                    >
                                        {messages.map((msg, idx) => {
                                            const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                                            const isDeleted = msg.deleted;
                                            const isPaymentMsg = !isDeleted && msg.content.startsWith('💰 Sent ') && msg.content.includes(' credits to ');
                                            
                                            // Extract the amount if it's a payment message
                                            const creditAmount = isPaymentMsg ? msg.content.match(/\d+/)?.[0] : null;

                                            return (
                                                <div
                                                    key={msg._id || idx}
                                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
                                                    onContextMenu={(e) => !isDeleted && handleMessageContextMenu(e, msg, isMe)}
                                                >
                                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                                        {/* Reply preview */}
                                                        {msg.replyTo && (
                                                            <div className={`text-[10px] mb-1 px-3 py-1.5 rounded-xl border-l-2 bg-gray-100 border-blue-400 text-gray-500 max-w-full overflow-hidden`}>
                                                                <span className="font-bold text-blue-600">{msg.replyTo?.sender?.name || "Someone"}</span>
                                                                <p className="truncate">{msg.replyTo?.content}</p>
                                                            </div>
                                                        )}

                                                        <div className="relative">
                                                            <div
                                                                className={`rounded-2xl px-4 py-2 text-sm select-none cursor-default relative overflow-hidden transition-all
                                                                    ${isDeleted ? 'bg-gray-100 text-gray-400 italic' :
                                                                    isPaymentMsg ? 'bg-gradient-to-br from-gray-400 via-gray-500 to-gray-500 text-white shadow-lg shadow-amber-500/20 border border-amber-300/50 min-w-[200px]' :
                                                                    isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none shadow-sm'}`}
                                                                style={isPaymentMsg ? { borderRadius: '20px' } : undefined}
                                                            >
                                                                {isPaymentMsg && (
                                                                    <div className="absolute -right-4 -top-4 text-white/20 transform rotate-12 scale-[2] pointer-events-none">
                                                                        <FaCoins />
                                                                    </div>
                                                                )}
                                                                
                                                                {isPaymentMsg ? (
                                                                    <div className="flex flex-col relative z-10 pt-1">
                                                                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-100 mb-1.5 drop-shadow-sm">
                                                                            Transfer Complete
                                                                        </span>
                                                                        <div className="flex items-center gap-3 mb-2">
                                                                            <div className="bg-white p-2.5 rounded-full shadow-inner">
                                                                                <FaCoins className="text-amber-500 text-lg" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-2xl font-black leading-none drop-shadow-md">{creditAmount}</p>
                                                                                <p className="text-[10px] font-bold text-amber-100 uppercase mt-0.5">Credits</p>
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-white text-xs font-semibold drop-shadow-sm border-t border-white/20 pt-1.5 mt-0.5">
                                                                            {isMe ? `Sent to ${partner.name}` : `Received from ${partner.name}`}
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                                )}
                                                                
                                                                <div className={`text-[9px] mt-1 text-right flex items-center justify-end gap-1 relative z-10 ${isDeleted ? 'text-gray-400' : isPaymentMsg ? 'text-amber-100 mt-2' : isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    {isMe && !isPaymentMsg && (
                                                                        <span className={`text-[10px] flex items-center ${msg.isRead ? 'text-cyan-300' : 'text-blue-100/70'}`}>
                                                                            {msg.isRead ? (
                                                                                <span title={`Seen at ${new Date(msg.readAt).toLocaleTimeString()}`}>✓✓ Seen</span>
                                                                            ) : '✓✓ Sent'}
                                                                        </span>
                                                                    )}
                                                                    {isMe && isPaymentMsg && (
                                                                        <span className={`text-[10px] flex items-center ${msg.isRead ? 'text-white' : 'text-amber-100/70'}`}>
                                                                            {msg.isRead ? '✓✓ Seen' : '✓✓ Sent'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Quick action buttons on hover */}
                                                            {!isDeleted && (
                                                                <div className={`absolute top-1 ${isMe ? '-left-16' : '-right-16'} hidden group-hover:flex items-center gap-1`}>
                                                                    <button
                                                                        onClick={() => setReplyingTo(msg)}
                                                                        className="p-1.5 bg-white rounded-full shadow text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                                        title="Reply"
                                                                    >
                                                                        <FaReply size={10} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setEmojiPickerFor(emojiPickerFor === msg._id ? null : msg._id); }}
                                                                        className="p-1.5 bg-white rounded-full shadow text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 transition-all text-xs"
                                                                        title="React"
                                                                    >
                                                                        😊
                                                                    </button>
                                                                    {isMe && (
                                                                        <button
                                                                            onClick={() => handleDeleteMessage(msg._id)}
                                                                            className="p-1.5 bg-white rounded-full shadow text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                                                            title="Delete"
                                                                        >
                                                                            <FaTrash size={9} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Inline emoji picker */}
                                                            {emojiPickerFor === msg._id && (
                                                                <div className={`absolute ${isMe ? 'right-0' : 'left-0'} -top-12 bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center gap-1 px-2 py-1.5 z-20`}>
                                                                    {EMOJIS.map(emoji => (
                                                                        <button
                                                                            key={emoji}
                                                                            onClick={() => handleReact(msg._id, emoji)}
                                                                            className="text-lg hover:scale-125 transition-transform p-0.5 rounded-lg hover:bg-gray-100"
                                                                        >
                                                                            {emoji}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Reactions display */}
                                                        {msg.reactions && msg.reactions.length > 0 && (
                                                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                                                {Object.entries(
                                                                    msg.reactions.reduce((acc, r) => {
                                                                        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                                                        return acc;
                                                                    }, {})
                                                                ).map(([emoji, count]) => (
                                                                    <button
                                                                        key={emoji}
                                                                        onClick={() => handleReact(msg._id, emoji)}
                                                                        className="bg-white border border-gray-200 rounded-full px-1.5 py-0.5 text-xs flex items-center gap-0.5 shadow-sm hover:bg-gray-50 transition-colors"
                                                                    >
                                                                        {emoji} <span className="text-[10px] text-gray-600">{count}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </InfiniteScroll>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Typing Indicator */}
                            {isPartnerTyping && (
                                <div className="px-6 py-1 text-[11px] text-gray-500 font-medium animate-pulse flex items-center gap-1.5 opacity-80 transition-all">
                                   <div className="flex gap-0.5">
                                       <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                       <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                       <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></span>
                                   </div>
                                   {partner.name} is typing...
                                </div>
                            )}

                            {/* Reply Banner */}
                            {replyingTo && (
                                <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Replying to {replyingTo.sender?.name || "message"}</p>
                                        <p className="text-xs text-gray-600 truncate">{replyingTo.content}</p>
                                    </div>
                                    <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                                        <FaTimes size={12} />
                                    </button>
                                </div>
                            )}

                            {/* Input Area */}
                            <div className="p-3 bg-white border-t border-gray-200">
                                <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto items-end bg-gray-50 rounded-2xl p-1.5 border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all">
                                    <input
                                        type="text"
                                        className="flex-1 bg-transparent border-none outline-none px-3 py-2 max-h-24 resize-none text-gray-700 placeholder-gray-400 text-sm"
                                        placeholder="Type your message..."
                                        value={messageInput}
                                        onChange={handleInputChange}
                                    />
                                    <button
                                        type="submit"
                                        className={`p-2.5 rounded-xl transition-all ${messageInput.trim()
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-105'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                        disabled={!messageInput.trim()}
                                    >
                                        <FaPaperPlane size={14} />
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Chat;
