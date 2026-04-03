import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "../../util/UserContext";
import { FaWallet, FaHistory, FaCoins } from "react-icons/fa";
import { toast } from "react-toastify";

const Credits = () => {
    const { user, setUser } = useUser();
    const [loading, setLoading] = useState(false);

    const [transactions, setTransactions] = useState([]);
    const [activeTab, setActiveTab] = useState("all"); // 'all' means bought/payment, 'transfer' means p2p

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const { data } = await axios.get("/payment/history", { withCredentials: true });
                if (data.success) {
                    setTransactions(data.data);
                }
            } catch (error) {
                console.error("Error fetching transactions", error);
            }
        };

        fetchTransactions();

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        }
    }, []);

    const creditPacks = [
        { credits: 100, price: 99, label: "Starter" },
        { credits: 250, price: 199, label: "Popular", recommended: true },
        { credits: 500, price: 349, label: "Pro" },
        { credits: 1000, price: 699, label: "Expert" },
    ];

    const handlePayment = async (amount, credits) => {
        setLoading(true);
        try {
            // 1. Get Key
            const { data: { key } } = await axios.get("/payment/get-key", { withCredentials: true });

            // 2. Create Order
            const { data: order } = await axios.post("/payment/create-order", { amount, credits }); // Pass credits to store in DB

            // 3. Open Razorpay
            const options = {
                key: key,
                amount: order.amount,
                currency: "INR",
                name: "VidhyaTransfer",
                description: `Purchase ${credits} Credits`,
                image: "https://your-logo-url.com/logo.png", // Replace with actual logo URL if available
                order_id: order.id,
                handler: async function (response) {
                    try {
                        // 4. Verify Payment
                        const verifyRes = await axios.post("/payment/verify-payment", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            // credits and amount are no longer sent here, backend looks them up by order_id
                        });

                        if (verifyRes.status === 200) {
                            toast.success("Credits added successfully!");
                            // Update user context with new credits
                            setUser(prev => ({ ...prev, credits: verifyRes.data.credits }));
                            // Refresh transactions
                            const { data } = await axios.get("/payment/history", { withCredentials: true });
                            if (data.success) {
                                setTransactions(data.data);
                            }
                        }
                    } catch (error) {
                        console.error("Verification failed", error);
                        toast.error("Payment verification failed");
                    }
                },
                prefill: {
                    name: user?.name,
                    email: user?.email,
                    contact: user?.phone
                },
                theme: {
                    color: "#3B82F6"
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on("payment.failed", function (response) {
                toast.error("Payment Failed: " + response.error.description);
            });

            rzp1.open();
        } catch (error) {
            console.error("Payment Error", error);
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-dark-bg pt-6 pb-10 font-sans">
            <div className="app-container">
                <div className="flex items-end justify-between gap-6 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">Credits</h1>
                        <p className="mt-1 text-sm text-slate-600">Buy credits and track your transactions.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                    {/* Row 1: Balance */}
                    <div className="lg:col-span-4">
                        <div className="bg-dark-card border border-dark-border rounded-xl p-4 shadow-card">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-dark-border flex items-center justify-center">
                                        <span className="text-lg">💎</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-600">Current balance</p>
                                        <p className="text-2xl font-bold text-slate-900 leading-tight">{user?.credits || 0}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-600">Credits</p>
                                    <p className="text-xs text-slate-600">Available</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Packs */}
                    <div className="lg:col-span-8">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {creditPacks.map((pack, index) => (
                                <div
                                    key={index}
                                    className={`relative bg-dark-card rounded-xl p-4 border shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft min-h-[170px] ${pack.recommended ? 'border-indigo-200 ring-1 ring-inset ring-indigo-100' : 'border-dark-border'}`}
                                >
                                    {pack.recommended && (
                                        <div className="absolute top-3 right-3 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                                            Popular
                                        </div>
                                    )}
                                    <div className="flex flex-col h-full">
                                        <div className="mb-3">
                                            <h3 className="text-sm font-semibold text-slate-900">{pack.credits} credits</h3>
                                            <p className="text-xs text-slate-600">{pack.label}</p>
                                        </div>
                                        <div className="mt-auto">
                                            <div className="flex items-baseline gap-1 mb-3">
                                                <span className="text-lg font-bold text-slate-900">₹{pack.price}</span>
                                                <span className="text-xs text-slate-600">INR</span>
                                            </div>
                                            <button
                                                onClick={() => handlePayment(pack.price, pack.credits)}
                                                disabled={loading}
                                                className={`w-full h-10 rounded-lg text-sm font-semibold transition-colors ${pack.recommended
                                                    ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                                                    : 'bg-white border border-dark-border text-slate-700 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {loading ? 'Processing…' : 'Buy'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Row 3: History */}
                    <div className="lg:col-span-12">
                        <div className="bg-dark-card border border-dark-border rounded-xl shadow-card overflow-hidden">
                            <div className="px-4 py-3 border-b border-dark-border bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-slate-700">
                                    <FaHistory className="text-slate-600" />
                                    <h3 className="text-sm font-semibold">Activity Logs</h3>
                                </div>
                                <div className="flex bg-white p-1 rounded-xl border border-dark-border shadow-sm">
                                    <button
                                        onClick={() => setActiveTab("all")}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "all" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-slate-500 hover:bg-slate-50"}`}
                                    >
                                        Purchases
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("transfer")}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "transfer" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-slate-500 hover:bg-slate-50"}`}
                                    >
                                        Transfers
                                    </button>
                                </div>
                            </div>
                            <div className="max-h-[420px] overflow-auto custom-scrollbar">
                                {(() => {
                                    const filteredTransactions = transactions.filter(tx => {
                                        if (activeTab === "all") {
                                            return ["paid", "failed", "created"].includes(tx.status);
                                        }
                                        return ["transfer_sent", "transfer_received"].includes(tx.status);
                                    });

                                    if (filteredTransactions.length === 0) {
                                        return (
                                            <div className="text-center text-slate-600 py-16">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dark-border shadow-inner">
                                                    <span className="text-2xl">📋</span>
                                                </div>
                                                <p className="font-bold text-sm text-slate-900">No {activeTab === "all" ? "purchases" : "transfers"} found.</p>
                                                <p className="text-xs text-slate-500 mt-1">Your activity will appear here once you perform a transaction.</p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-slate-200">
                                                <thead className="bg-slate-50 sticky top-0 z-10">
                                                    <tr>
                                                        <th className="px-5 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                                                        {activeTab === "all" && <th className="px-5 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order ID</th>}
                                                        <th className="px-5 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type / Memo</th>
                                                        <th className="px-5 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Credits</th>
                                                        {activeTab === "all" && <th className="px-5 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount</th>}
                                                        <th className="px-5 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-slate-100">
                                                    {filteredTransactions.map((tx) => (
                                                        <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors group">
                                                            <td className="px-5 py-4 whitespace-nowrap text-xs font-bold text-slate-900">
                                                                {new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </td>
                                                            {activeTab === "all" && (
                                                                <td className="px-5 py-4 whitespace-nowrap text-xs font-mono text-slate-500 group-hover:text-indigo-600 transition-colors">
                                                                    {tx.orderId}
                                                                </td>
                                                            )}
                                                            <td className="px-5 py-4 whitespace-nowrap">
                                                                <div className="text-xs font-bold text-slate-900">{tx.description || (activeTab === "all" ? "Credit Purchase" : "Transfer")}</div>
                                                                {activeTab === "transfer" && <div className="text-[10px] text-slate-500 font-medium">{tx.paymentId}</div>}
                                                            </td>
                                                            <td className={`px-5 py-4 whitespace-nowrap text-sm font-black ${tx.credits > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                {tx.credits > 0 ? `+${tx.credits}` : tx.credits}
                                                            </td>
                                                            {activeTab === "all" && (
                                                                <td className="px-5 py-4 whitespace-nowrap text-xs font-bold text-slate-900">
                                                                    ₹{tx.amount}
                                                                </td>
                                                            )}
                                                            <td className="px-5 py-4 whitespace-nowrap">
                                                                <span className={`px-3 py-1 inline-flex text-[9px] font-bold uppercase tracking-widest rounded-full border ${tx.status === 'paid' || tx.status === 'transfer_received'
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                                    : tx.status === 'failed' || tx.status === 'transfer_sent'
                                                                        ? 'bg-rose-50 text-rose-700 border-rose-100'
                                                                        : 'bg-amber-50 text-amber-700 border-amber-100'
                                                                    }`}>
                                                                    {tx.status.replace('_', ' ')}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Credits;
