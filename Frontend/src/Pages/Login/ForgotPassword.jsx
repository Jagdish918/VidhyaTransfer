import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await axios.post("/auth/forgot-password", { email });
            if (data.success) {
                toast.success("Password reset email sent!");
                setSent(true);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to send email");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[90vh] bg-dark-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                    Reset your password
                </h2>
                <p className="mt-2 text-center text-xs font-bold uppercase tracking-widest text-slate-600">
                    Enter your email address to receive a reset link.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in">
                <div className="bg-dark-card py-10 px-6 shadow-card sm:rounded-3xl sm:px-10 border border-dark-border">
                    {sent ? (
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6 shadow-sm">
                                <svg className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl leading-8 font-bold text-slate-900 tracking-tight">Check your email</h3>
                            <p className="mt-3 text-sm text-slate-600 font-medium">
                                We sent a password reset link to <strong className="text-slate-800">{email}</strong>
                            </p>
                            <div className="mt-8">
                                <Link to="/login" className="text-xs font-bold uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors">
                                    Back to Login
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
                                    Email address
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="appearance-none block w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl shadow-sm text-slate-800 placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 sm:text-sm transition-all"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-cyan-500/20 text-xs font-bold uppercase tracking-widest text-dark-bg bg-cyan-500 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-dark-bg transition-all hover:-translate-y-0.5 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {loading ? "Sending..." : "Send Reset Link"}
                                </button>
                            </div>

                            <div className="text-center pt-2">
                                <Link to="/login" className="text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-cyan-400 transition-colors">
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
