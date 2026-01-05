import React, { useState } from 'react';

const GuestJoinModal = ({ onJoin, onCancel, isSyncing }) => {
    const [nickname, setNickname] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState('😎');

    const emojis = ['😎', '🚀', '🐱', '🦖', '🤖', '👽', '🦄', '🐯'];

    const handleSubmit = (e) => {
        e.preventDefault(); // <--- CRITICAL: Prevents page reload
        if (!nickname.trim()) return alert("Please enter a name!");

        console.log("Submitting Guest:", nickname, selectedEmoji); // Debug log
        onJoin(nickname.trim(), selectedEmoji);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-[3rem] shadow-3d-purple border-4 border-white dark:border-gray-700 overflow-hidden relative animate-in zoom-in duration-300">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Join Battle</h2>
                            <p className="text-gray-500 dark:text-gray-400 font-bold">Pick your identity for this arena!</p>
                        </div>
                        <button
                            onClick={onCancel}
                            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <span className="material-symbols-rounded">close</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Nickname Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-indigo-500 uppercase tracking-widest ml-2">Choose Nickname</label>
                            <input
                                type="text"
                                placeholder="Enter your name..."
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                maxLength={15}
                                autoFocus
                                className="w-full bg-gray-50 dark:bg-gray-900 border-4 border-gray-100 dark:border-gray-700 rounded-2xl px-6 py-4 text-xl font-black text-gray-800 dark:text-white focus:border-indigo-400 outline-none transition-all shadow-inner"
                            />
                        </div>

                        {/* Emoji Picker */}
                        <div className="space-y-3">
                            <label className="text-xs font-black text-purple-500 uppercase tracking-widest ml-2">Select Avatar</label>
                            <div className="grid grid-cols-4 gap-3">
                                {emojis.map(emoji => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => setSelectedEmoji(emoji)}
                                        className={`h-16 flex items-center justify-center text-3xl rounded-2xl transition-all duration-300 ${selectedEmoji === emoji
                                            ? 'bg-indigo-600 shadow-lg scale-110 -rotate-3 text-white'
                                            : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 grayscale hover:grayscale-0'
                                            }`}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <button
                            type="submit"
                            disabled={isSyncing}
                            className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xl font-black rounded-3xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {isSyncing ? (
                                <>
                                    <span className="material-symbols-rounded animate-spin">sync</span>
                                    <span>Entering...</span>
                                </>
                            ) : (
                                <>
                                    <span>Enter Arena</span>
                                    <span className="material-symbols-rounded group-hover:translate-x-1 transition-transform">rocket_launch</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default GuestJoinModal;
