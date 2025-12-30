import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { getAllQuizzes, subscribeToQuizzes } from '../services/quizService';
import { getHotTopics } from '../services/discussService';
import { findBattleByCode, ensureBattleForQuiz } from '../services/battleService';

// Mock Data (Gamers & Trending Tags still mock for now as requested or low priority)
const TOP_GAMERS = [
    { rank: 1, name: "Player dev_n", rp: "🏆" },
    { rank: 2, name: "Player dev_f", rp: "🥈" },
    { rank: 3, name: "Player dev_f", rp: "🥉" },
    { rank: 4, name: "5 RP", rp: "⭐" },
];

const TRENDING_TOPICS = [
    { name: "#Ecosystems", icon: "🌲" },
    { name: "#Algebra", icon: "📐" },
    { name: "#Zoology", icon: "🦁" },
    { name: "#Reactions", icon: "🧪" }
];

const Home = () => {
    const nav = useNavigate();
    const { user } = useUser();
    const [joinCode, setJoinCode] = useState('');
    const [freshQuizzes, setFreshQuizzes] = useState([]);
    const [hotTopics, setHotTopics] = useState([]);

    useEffect(() => {
        // Real-time subscription for Quizzes
        const unsubscribe = subscribeToQuizzes((all) => {
            setFreshQuizzes(all.slice(0, 2));
        });

        // Fetch Hot Topics
        getHotTopics().then(topics => {
            // Transform for display if needed or just set
            setHotTopics(topics.map(t => ({
                tag: t.title,
                text: `${t.commentCount} comments • ${t.authorName}`
            })));
        });

        return () => unsubscribe();
    }, []);

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!joinCode) return;

        const existing = await findBattleByCode(joinCode);
        if (existing) {
            nav(`/battle/${existing.id}`);
        } else {
            alert("Battle not found! Please check the code. 🐾");
        }
    };

    const handleStartCatpool = async (quiz) => {
        if (!user) {
            alert("Please login to host a battle! 🐱");
            return;
        }

        try {
            const battle = await ensureBattleForQuiz(quiz, user);
            nav(`/battle/${battle.id}`);
        } catch (error) {
            console.error(error);
            alert("Failed to start battle.");
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto p-4 space-y-6">

            {/* ROW 2: Top Gamers (1) | Playground (2) | Hottest (1) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-auto md:h-[400px]">

                {/* COL 1: Top Gamers */}
                <div className="glass-panel p-6 rounded-[2rem] bg-cyan-400/90 border-transparent text-white flex flex-col relative overflow-hidden">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        Top Gamers 🏆
                    </h2>
                    <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {TOP_GAMERS.map((gamer, idx) => (
                            <div key={idx} className="bg-white text-gray-800 p-3 rounded-full flex justify-between items-center shadow-sm hover:scale-[1.02] transition-transform">
                                <span className="font-bold text-sm">#{gamer.rank} {gamer.name}</span>
                                <span className="text-xl">{gamer.rp}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COL 2-3: Cats Playground (Main Action) */}
                <div className="md:col-span-2 bg-[#d4e456] rounded-[2rem] p-8 relative overflow-hidden flex flex-col justify-center shadow-lg group">
                    {/* Decor */}
                    <div className="absolute top-4 right-4 bg-white/40 px-3 py-1 rounded-full text-xs font-bold text-green-900 flex items-center gap-1">
                        🧪 📓
                    </div>

                    <div className="z-10 relative">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-[#3a4d22] mb-4 font-display">
                            Cats Playground
                        </h1>
                        <p className="text-[#516b32] font-medium mb-10 max-w-sm">
                            Step into the purr-fect world of Grade 7 Science & Math!
                        </p>

                        <form onSubmit={handleJoin} className="flex gap-3 max-w-lg">
                            <div className="flex-1 bg-white rounded-full flex items-center px-4 py-2 shadow-sm border-2 border-transparent focus-within:border-green-600 transition-colors">
                                <span className="text-xl mr-2">🐱</span>
                                <input
                                    type="text"
                                    placeholder="Enter Join Code..."
                                    value={joinCode}
                                    onChange={e => setJoinCode(e.target.value)}
                                    className="w-full outline-none text-gray-700 font-bold bg-transparent placeholder:text-gray-400"
                                />
                            </div>
                            <button type="submit" className="bg-[#2d5f1e] text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-[#234b17] transition-all flex items-center gap-2">
                                🫧 Join Now
                            </button>
                        </form>
                    </div>

                    {/* Cat Illustration Decor */}
                    <div className="absolute bottom-0 right-0 w-48 h-48 opacity-90 translate-y-4 group-hover:translate-y-2 transition-transform duration-500">
                        {/* Placeholder for Cat SVG/Img */}
                        <img src="https://cdn-icons-png.flaticon.com/512/616/616430.png" alt="Cat" className="w-full h-full object-contain" />
                    </div>
                </div>

                {/* COL 4: Hottest Catpools */}
                <div className="glass-panel p-6 rounded-[2rem] bg-pink-400/90 border-transparent text-white flex flex-col items-center text-center relative overflow-hidden">
                    <h2 className="text-xl font-bold mb-6 w-full text-left">#1 Hottest Catpools</h2>

                    <div className="flex-1 flex items-center justify-center relative">
                        {/* Circle Avatar */}
                        <div className="w-32 h-32 bg-yellow-300 rounded-full flex items-center justify-center shadow-inner border-4 border-pink-300/50 relative">
                            <span className="text-6xl animate-bounce">😸</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ROW 3: Trending (1) | Fresh (2 split) | Discuss (1) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                {/* COL 1: Trending Topics */}
                <div className="glass-panel p-6 rounded-[2rem] bg-amber-400/90 border-transparent text-white h-auto">
                    <h2 className="text-2xl font-bold mb-6">Trending Topics</h2>
                    <div className="space-y-3">
                        {TRENDING_TOPICS.map((topic, i) => (
                            <div key={i} className="bg-white/20 hover:bg-white/30 p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors backdrop-blur-sm">
                                <span className="text-xl">{topic.icon}</span>
                                <span className="font-bold">{topic.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COL 2-3: Fresh Catpools */}
                <div className="md:col-span-2 glass-panel p-6 rounded-[2rem] bg-purple-500/90 border-transparent text-white flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2">Fresh Catpools 🐾</h2>
                        <span className="text-2xl">✨</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                        {freshQuizzes.length > 0 ? freshQuizzes.map((quiz, i) => (
                            <div key={quiz.id || i} className="bg-white rounded-xl p-4 text-gray-800 shadow-sm flex flex-col h-full relative group hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => handleStartCatpool(quiz)}>
                                <span className="absolute top-3 right-3 text-yellow-500">⭐</span>
                                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded w-fit mb-2">NEW</span>
                                <h3 className="font-bold text-sm mb-1 line-clamp-1">{quiz.title || "Untitled Quiz"}</h3>
                                <p className="text-xs text-gray-400 mb-4 line-clamp-2">{quiz.description || "No desc"}</p>

                                <div className="mt-auto pt-2 border-t border-gray-100 flex flex-col gap-2">
                                    <div className="bg-red-50 text-red-700 text-xs font-bold text-center py-1 rounded">
                                        Code: {quiz.battleCode || (quiz.id ? quiz.id.slice(0, 6).toUpperCase() : '------')}
                                    </div>
                                    <span className="text-[10px] text-gray-400">⚡ {quiz.plays || 0} plays</span>
                                </div>
                            </div>
                        )) : (
                            // MOCK IF EMPTY
                            [1, 2].map((_, i) => (
                                <div key={i} className="bg-white rounded-xl p-4 text-gray-800 shadow-sm flex flex-col h-full relative group hover:-translate-y-1 transition-transform">
                                    <span className="absolute top-3 right-3 text-yellow-500">⭐</span>
                                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded w-fit mb-2">NEW</span>
                                    <h3 className="font-bold text-sm mb-1">Doc: course1_distil.txt</h3>
                                    <p className="text-xs text-gray-400 mb-4">Generated from upload...</p>

                                    <div className="mt-auto pt-2 border-t border-gray-100 flex flex-col gap-2">
                                        <div className="bg-red-50 text-red-700 text-xs font-bold text-center py-1 rounded">
                                            Code: {217025 + i}
                                        </div>
                                        <span className="text-[10px] text-gray-400">⚡ 10 plays</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* COL 4: Discuss */}
                <div onClick={() => nav('/discuss')} className="glass-panel p-6 rounded-[2rem] bg-[#ff4500]/90 border-transparent text-white cursor-pointer hover:bg-[#ff571a] transition-colors">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">🔥 Discuss</h2>
                    <div className="space-y-4">
                        {hotTopics.length > 0 ? hotTopics.map((topic, i) => (
                            <div key={i} className="bg-white/20 p-4 rounded-xl backdrop-blur-md">
                                <h3 className="font-bold text-sm mb-1">{topic.tag}</h3>
                                <p className="text-xs opacity-90">{topic.text}</p>
                            </div>
                        )) : (
                            <div className="text-sm opacity-80 text-center">No hot topics yet. Start chatting!</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Home;
