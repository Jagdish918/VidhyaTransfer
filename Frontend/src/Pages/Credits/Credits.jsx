import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "../../util/UserContext";
import { FaWallet, FaHistory, FaCoins } from "react-icons/fa";
import { toast } from "react-toastify";

const Credits = () => {
    const { user, setUser } = useUser();
    const [loading, setLoading] = useState(false);

    const [transactions, setTransactions] = useState([]);

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
        <div className="min-h-screen bg-[#fafafa] pt-12 pb-16 font-['Montserrat']">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header Section */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">My Credits</h1>
                    <p className="mt-3 max-w-2xl mx-auto text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                        Manage and purchase credits to learn new skills
                    </p>
                </div>

                {/* Current Balance Card */}
                <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 p-10 mb-16 max-w-md mx-auto text-center transform transition-all hover:scale-[1.02] duration-300">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-[#fafafa] rounded-full flex items-center justify-center shadow-inner">
                            <span className="text-4xl">💎</span>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">You have</p>
                    <h2 className="text-6xl font-black text-[#013e38] mb-2">{user?.credits || 0}</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">credits</p>
                </div>

                {/* Credit Packs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {creditPacks.map((pack, index) => (
                        <div
                            key={index}
                            className={`relative bg-white rounded-[2rem] p-8 shadow-sm border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${pack.recommended ? 'border-[#3bb4a1] ring-2 ring-[#3bb4a1] ring-opacity-20 transform scale-105 z-10' : 'border-gray-50'}`}
                        >
                            {pack.recommended && (
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#3bb4a1] text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md">
                                    Most Popular
                                </div>
                            )}
                            <div className="text-center">
                                <h3 className="text-lg font-black text-gray-900 mb-2">{pack.credits} Credits</h3>
                                <div className="flex justify-center items-baseline mb-6">
                                    <span className="text-4xl font-black text-[#013e38]">₹{pack.price}</span>
                                </div>
                                <button
                                    onClick={() => handlePayment(pack.price, pack.credits)}
                                    disabled={loading}
                                    className={`w-full py-4 px-4 rounded-[1.2rem] text-[10px] uppercase font-black tracking-widest transition-all duration-200 ${pack.recommended
                                        ? 'bg-[#013e38] text-white hover:bg-[#3bb4a1] shadow-lg'
                                        : 'bg-[#fafafa] border border-gray-200 text-[#013e38] hover:bg-white shadow-sm hover:shadow-md'
                                        }`}
                                >
                                    {loading ? 'Processing...' : 'Buy Now'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Transaction History */}
                <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-50 bg-[#fafafa] flex items-center gap-3">
                        <FaHistory className="text-gray-400" />
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-[#013e38]">Recent Transactions</h3>
                    </div>
                    <div className="p-0">
                        {transactions.length === 0 ? (
                            <div className="text-center text-gray-400 py-12">
                                <p className="font-bold text-sm">No recent transactions to show.</p>
                                <p className="text-[10px] mt-3 uppercase tracking-widest font-black opacity-60">(Transaction history will appear here once you make a purchase)</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto p-4">
                                <table className="min-w-full divide-y divide-gray-100">
                                    <thead className="bg-[#fafafa] rounded-[1rem] overflow-hidden">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest rounded-tl-[1rem] rounded-bl-[1rem]">Date</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Credits</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest rounded-tr-[1rem] rounded-br-[1rem]">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-50">
                                        {transactions.map((tx) => (
                                            <tr key={tx._id} className="hover:bg-[#fafafa] transition-colors">
                                                <td className="px-6 py-5 whitespace-nowrap text-[11px] font-bold text-gray-500">
                                                    {new Date(tx.createdAt).toLocaleDateString()}{" "}
                                                    <span className="text-[10px] text-gray-400 ml-1">{new Date(tx.createdAt).toLocaleTimeString()}</span>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-[11px] font-mono font-bold text-gray-400">
                                                    {tx.orderId}
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-[11px] font-black text-[#3bb4a1]">
                                                    +{tx.credits}
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-[11px] font-black text-[#013e38]">
                                                    ₹{tx.amount}
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <span className={`px-3 py-1 inline-flex text-[9px] uppercase tracking-widest font-black rounded-[0.8rem] ${tx.status === 'paid' ? 'bg-green-50 text-green-600' :
                                                        tx.status === 'failed' ? 'bg-red-50 text-red-600' :
                                                            'bg-yellow-50 text-yellow-600'
                                                        }`}>
                                                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Credits;
