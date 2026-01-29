import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "../../util/UserContext";
import { FaWallet, FaHistory, FaCoins } from "react-icons/fa";
import { toast } from "react-toastify";

const Credits = () => {
    const { user, setUser } = useUser();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
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
            const { data: order } = await axios.post("/payment/create-order", { amount });

            // 3. Open Razorpay
            const options = {
                key: key,
                amount: order.amount,
                currency: "INR",
                name: "SkillSwap",
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
                            credits: credits,
                            amount: amount
                        });

                        if (verifyRes.status === 200) {
                            toast.success("Credits added successfully!");
                            // Update user context with new credits
                            setUser(prev => ({ ...prev, credits: verifyRes.data.credits }));
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
        <div className="min-h-screen bg-gray-50 pt-8 pb-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header Section */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">My Credits</h1>
                    <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
                        Manage and purchase credits to learn new skills
                    </p>
                </div>

                {/* Current Balance Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-12 max-w-md mx-auto text-center transform transition-all hover:scale-105 duration-300">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-3xl">💎</span>
                        </div>
                    </div>
                    <p className="text-gray-500 font-medium mb-2">You have</p>
                    <h2 className="text-5xl font-extrabold text-blue-600 mb-2">{user?.credits || 0}</h2>
                    <p className="text-gray-400 font-medium">credits</p>
                </div>

                {/* Credit Packs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {creditPacks.map((pack, index) => (
                        <div
                            key={index}
                            className={`relative bg-white rounded-2xl p-6 shadow-sm border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${pack.recommended ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20' : 'border-gray-100'}`}
                        >
                            {pack.recommended && (
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                    Most Popular
                                </div>
                            )}
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{pack.credits} Credits</h3>
                                <div className="flex justify-center items-baseline mb-4">
                                    <span className="text-3xl font-extrabold text-gray-900">₹{pack.price}</span>
                                </div>
                                <button
                                    onClick={() => handlePayment(pack.price, pack.credits)}
                                    disabled={loading}
                                    className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors duration-200 ${pack.recommended
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                                        : 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                                        }`}
                                >
                                    {loading ? 'Processing...' : 'Buy Now'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Transaction History (Static for now as requested user only asked for credit system, but UI shows it) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                        <FaHistory className="text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                    </div>
                    <div className="p-6">
                        <div className="text-center text-gray-500 py-8">
                            <p>No recent transactions to show.</p>
                            <p className="text-sm mt-2 opacity-60">(Transaction history will appear here once you make a purchase)</p>
                        </div>
                        {/* 
            <table className="min-w-full divide-y divide-gray-200">
                <thead>
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                </thead>
                // ... map rows
            </table> 
            */}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Credits;
