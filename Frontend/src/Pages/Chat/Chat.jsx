import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../../util/UserContext";
import axios from "axios";
import { FaPaperPlane, FaVideo, FaCalendarAlt, FaSearch } from "react-icons/fa";

const Chat = () => {
    const { user } = useUser();
    const [chats, setChats] = useState([]);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [unreadChatIds, setUnreadChatIds] = useState(new Set()); // Track unread chats
    const messagesEndRef = useRef(null);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const fetchChats = async () => {
            setLoadingChats(true);
            try {
                const { data } = await axios.get("http://localhost:8000/chat", { withCredentials: true });
                const fetchedChats = data.data || [];
                setChats(fetchedChats);

                // Initialize unread status
                const newUnreadIds = new Set();
                fetchedChats.forEach(chat => {
                    // If latest message exists, is NOT from me, it's considered unread initially for this session
                    if (chat.latestMessage && chat.latestMessage.sender && chat.latestMessage.sender !== user._id) {
                        newUnreadIds.add(chat._id);
                    }
                });
                setUnreadChatIds(newUnreadIds);

                if (fetchedChats.length > 0 && !selectedChatId) {
                    // Do NOT auto select the first chat. Keep selectedChatId null.
                    // Just update unread counts.
                    // const firstChatId = fetchedChats[0]._id;
                    // setSelectedChatId(firstChatId);
                }
            } catch (error) {
                console.error("Error fetching chats:", error);
            } finally {
                setLoadingChats(false);
            }
        };
        fetchChats();
    }, []); // Run once on mount

    const handleChatSelect = (chatId) => {
        setSelectedChatId(chatId);
        if (unreadChatIds.has(chatId)) {
            const nextUnread = new Set(unreadChatIds);
            nextUnread.delete(chatId);
            setUnreadChatIds(nextUnread);
        }
    };

    // Fetch Messages for Selected Chat
    useEffect(() => {
        if (!selectedChatId) return;

        const fetchMessages = async () => {
            setLoadingMessages(true);
            try {
                const { data } = await axios.get(`http://localhost:8000/message/getMessages/${selectedChatId}`, { withCredentials: true });
                setMessages(data.data || []);
            } catch (error) {
                console.error("Error fetching messages:", error);
            } finally {
                setLoadingMessages(false);
            }
        };
        fetchMessages();
    }, [selectedChatId]);

    const activeChat = chats.find(c => c._id === selectedChatId);

    // Derive active chat partner details
    const getChatPartner = (chat) => {
        if (!chat || !chat.users) return { name: "Unknown", avatar: "/default-avatar.png", status: "Offline" };
        const partner = chat.users.find(u => u._id !== user._id);
        return {
            name: partner?.name || partner?.username || "User",
            avatar: partner?.picture || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            status: "Online"
        };
    };

    const partner = activeChat ? getChatPartner(activeChat) : { name: "", avatar: "", status: "" };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedChatId) return;

        const tempId = Date.now();
        const optimisticMessage = {
            _id: tempId,
            content: messageInput,
            sender: { _id: user._id, name: user.name, picture: user.picture },
            createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setMessageInput("");

        try {
            const { data } = await axios.post("http://localhost:8000/message/sendMessage", {
                chatId: selectedChatId,
                content: optimisticMessage.content
            }, { withCredentials: true });

            setMessages(prev => prev.map(msg => msg._id === tempId ? data.data : msg));

            setChats(prev => prev.map(c =>
                c._id === selectedChatId
                    ? { ...c, latestMessage: data.data }
                    : c
            ));

        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => prev.filter(msg => msg._id !== tempId));
        }
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

    return (
        <div className="h-[calc(100vh-65px)] bg-gray-50 flex flex-col p-4 md:p-6 overflow-hidden">
            <div className="flex-1 max-w-[1400px] w-full mx-auto flex h-full gap-6">

                {/* Left Sidebar - Chat List */}
                <div className={`w-full md:w-80 bg-white shadow-sm border border-gray-200 rounded-2xl flex flex-col overflow-hidden ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-3 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Chats</h2>
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
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
                                        {chatPartner.status === "Online" && (
                                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h3 className={`text-sm truncate ${isUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'} ${selectedChatId === chat._id ? 'text-blue-700' : ''}`}>
                                                {chatPartner.name}
                                            </h3>
                                            <span className="text-[10px] text-gray-400">Now</span>
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
                            )
                        })}
                    </div>
                </div>

                {/* Right Area - Chat Window */}
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
                                <div className="flex items-center gap-3">
                                    <button className="md:hidden text-gray-500 mr-1" onClick={() => setSelectedChatId(null)}>←</button>
                                    <div className="relative">
                                        <img src={partner.avatar} alt={partner.name} className="w-8 h-8 rounded-full object-cover" />
                                        <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-white rounded-full"></div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm">{partner.name}</h3>
                                        <p className="text-[10px] text-green-500 font-medium">Online</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2 text-xs font-semibold">
                                        <FaCalendarAlt /> Schedule
                                    </button>
                                    <button className="px-3 py-1.5 text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors flex items-center gap-2 text-xs font-semibold shadow-md shadow-green-200">
                                        <FaVideo /> Video Call
                                    </button>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
                                {loadingMessages ? (
                                    <div className="flex justify-center mt-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center text-gray-400 mt-10">
                                        <p className="text-sm">Start the conversation with {partner.name}</p>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                                        return (
                                            <div key={msg._id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMe
                                                    ? 'bg-green-100 text-gray-800 rounded-tr-none'
                                                    : 'bg-blue-50 text-gray-800 rounded-tl-none'
                                                    }`}>
                                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                    <div className={`text-[9px] mt-1 text-right flex items-center justify-end gap-1 ${isMe ? 'text-green-700/60' : 'text-blue-700/60'}`}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {isMe && <span className="text-[10px]">✓✓</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-3 bg-white border-t border-gray-200">
                                <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto items-end bg-gray-50 rounded-2xl p-1.5 border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all">
                                    <input
                                        type="text"
                                        className="flex-1 bg-transparent border-none outline-none px-3 py-2 max-h-24 resize-none text-gray-700 placeholder-gray-400 text-sm"
                                        placeholder="Type your message..."
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
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
