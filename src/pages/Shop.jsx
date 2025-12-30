import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { getShopItems } from '../services/shopService';
import { unlockEmoji, addCoins } from '../services/userService';

const Shop = () => {
    const { user, profile } = useUser();
    const items = getShopItems();
    const [loading, setLoading] = useState(false);

    const handleBuy = async (item) => {
        if (!user || !profile) return alert("Please login first!");

        if (profile.coins < item.cost) {
            alert("Not enough coins! 🪙");
            return;
        }

        setLoading(true);
        try {
            await unlockEmoji(user.uid, item.emoji, item.cost);
            // alert(`You unlocked ${item.emoji}!`); 
            // Better to show UI feedback, but alert is fine for now
        } catch (error) {
            console.error(error);
            alert("Purchase failed.");
        } finally {
            setLoading(false);
        }
    };

    // Dev Helper
    const devAddCoins = async () => {
        if (!user) return;
        await addCoins(user.uid, 100);
    };

    if (!profile) return <div className="p-10 text-center">Loading Shop...</div>;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4 font-display">
                    Emoji Shop <span className="text-[var(--color-leo-accent)]">Store</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                    Spend your hard-earned coins on cool new companions!
                </p>

                <div className="inline-flex items-center gap-2 px-6 py-3 bg-amber-100 rounded-full border border-amber-200 shadow-sm">
                    <span className="text-2xl">🪙</span>
                    <span className="text-2xl font-bold text-amber-600">{profile.coins} Coins</span>
                </div>

                {/* Dev Button */}
                <button onClick={devAddCoins} className="block mx-auto mt-4 text-xs text-gray-400 hover:text-indigo-500 underline">
                    (Dev) +100 Coins
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {items.map(item => {
                    const isOwned = profile.emojis?.includes(item.emoji);
                    const canAfford = profile.coins >= item.cost;

                    return (
                        <div key={item.id} className={`glass-card p-6 flex flex-col items-center relative overflow-hidden transition-all duration-300 ${isOwned ? 'opacity-70 grayscale-0' : ''}`}>
                            {isOwned && (
                                <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                    OWNED
                                </div>
                            )}

                            <div className="text-6xl mb-4 transform hover:scale-110 transition-transform duration-300">
                                {item.emoji}
                            </div>

                            <h3 className="font-bold text-gray-800 mb-2">{item.name}</h3>

                            {!isOwned ? (
                                <button
                                    onClick={() => handleBuy(item)}
                                    disabled={!canAfford || loading}
                                    className={`w-full py-2 rounded-xl font-bold text-sm transition-all ${canAfford
                                            ? 'bg-[var(--color-leo-primary)] text-white hover:shadow-lg hover:-translate-y-0.5'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {loading ? '...' : `Buy ${item.cost} 🪙`}
                                </button>
                            ) : (
                                <button disabled className="w-full py-2 bg-green-50 text-green-600 font-bold rounded-xl text-sm border border-green-200">
                                    Unlocked
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Shop;
