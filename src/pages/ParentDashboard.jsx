import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getChildStats } from '../services/parentService';
import BentoCard from '../components/BentoCard';

const ParentDashboard = () => {
    const { user } = useUser();
    const [childStats, setChildStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            if (user) {
                const stats = await getChildStats(user.uid);
                setChildStats(stats);
            }
            setLoading(false);
        };
        loadStats();
    }, [user]);

    if (!user) return <div className="p-10 text-center">Please log in to view parent dashboard.</div>;
    if (loading) return <div className="p-10 text-center">Loading Child Progress...</div>;

    return (
        <div className="max-w-6xl mx-auto p-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 font-display">Parent Portal 🛡️</h1>
            <p className="text-gray-500 mb-8">Monitoring Report for: <span className="font-bold text-purple-600">{user.email || "Anonymous User"}</span></p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Stats Cards */}
                <div className="glass-card p-6 flex flex-col items-center justify-center border-t-4 border-indigo-500">
                    <span className="text-4xl mb-2">⭐</span>
                    <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider">Current Level</h3>
                    <p className="text-4xl font-bold text-indigo-600">{childStats?.level || 1}</p>
                </div>

                <div className="glass-card p-6 flex flex-col items-center justify-center border-t-4 border-amber-500">
                    <span className="text-4xl mb-2">🪙</span>
                    <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider">Cat Coins Earned</h3>
                    <p className="text-4xl font-bold text-amber-600">{childStats?.coins || 0}</p>
                </div>

                <div className="glass-card p-6 flex flex-col items-center justify-center border-t-4 border-pink-500">
                    <span className="text-4xl mb-2">📒</span>
                    <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider">Collection Size</h3>
                    <p className="text-4xl font-bold text-pink-600">{childStats?.emojis?.length || 1}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visual Progress */}
                <div className="glass-card p-6">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <span>📊</span> Learning Activity
                    </h3>
                    <div className="h-40 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-400 text-sm">Activity Chart coming soon...</p>
                    </div>
                </div>

                {/* Recent Unlocks */}
                <div className="glass-card p-6">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <span>🔓</span> Recent Unlocks
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                        {childStats?.emojis?.map((emoji, idx) => (
                            <div key={idx} className="text-3xl bg-white p-2 rounded-lg shadow-sm border border-gray-100" title="Unlocked">
                                {emoji}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <BentoCard
                    title="Connect New Student"
                    description="Enter a join code to link another child account."
                    icon="🔗"
                    color="bg-gray-100 hover:bg-gray-200"
                    onClick={() => alert("Multi-child linking coming in v2.0!")}
                />
            </div>
        </div>
    );
};

export default ParentDashboard;
