import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUserShield, FaSpinner } from 'react-icons/fa';

const Login = () => {
    const [email, setEmail] = useState('superadmin@vidhya.com');
    const [password, setPassword] = useState('password123');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setAdmin } = useAuth();

    useEffect(() => {
        // Ensure clean state when landing on login page
        const clearSession = async () => {
            try { await axios.post('/auth/logout'); } catch (e) { }
            setAdmin(null);
        };
        clearSession();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data } = await axios.post('/auth/admin/login', { email, password });

            if (data.success) {
                if (data.data.user.role === 'admin') {
                    setAdmin(data.data.user);
                    toast.success("Welcome back, Admin!");
                    navigate('/dashboard', { replace: true });
                } else {
                    toast.error("Access Denied: You do not have admin privileges.");
                    await axios.post('/auth/logout'); // Clear session
                }
            } else {
                toast.error(data.message || "Login failed");
            }
        } catch (error) {
            console.error("Login Error:", error);
            const msg = error.response?.data?.message || "Invalid credentials";
            if (msg.includes("Invalid email or password")) {
                toast.error("Incorrect Email or Password");
            } else {
                toast.error(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 bg-[url('https://images.unsplash.com/photo-1497294815431-9365093b7331?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1950&q=80')] bg-no-repeat bg-cover bg-center font-sans">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px]"></div>

            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 transform transition-all hover:scale-[1.01]">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-8 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4">
                        <FaUserShield size={120} />
                    </div>
                    <FaUserShield className="mx-auto text-5xl mb-4 relative z-10 drop-shadow-md" />
                    <h2 className="text-2xl font-bold relative z-10 tracking-wide">Admin Portal</h2>
                    <p className="opacity-90 text-sm mt-2 relative z-10 font-medium text-blue-100">Enterprise Access Control</p>
                </div>

                {/* Content */}
                <div className="p-8 pt-10 bg-white">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Admin Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none bg-gray-50/50 hover:bg-white focus:bg-white text-gray-800 placeholder-gray-400/70"
                                placeholder="Enter admin email"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none bg-gray-50/50 hover:bg-white focus:bg-white text-gray-800 placeholder-gray-400/70"
                                placeholder="Enter secure password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all transform active:scale-[0.98] flex justify-center items-center gap-3 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                        >
                            {loading ? (
                                <>
                                    <FaSpinner className="animate-spin text-lg" /> Authenticating...
                                </>
                            ) : (
                                "Sign In to Dashboard"
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-[10px] text-gray-400 border-t border-gray-100 pt-6 font-mono">
                        <p>SYSTEM ID: ADM-2024-SECURE</p>
                        <p className="mt-1">UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
