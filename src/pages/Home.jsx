import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { subscribeToQuizzes } from '../services/quizService';
import { findBattleByCode } from '../services/battleService';

const Home = () => {
    const nav = useNavigate();
    const { user } = useUser();
    const [joinCode, setJoinCode] = useState('');
    const [freshQuizzes, setFreshQuizzes] = useState([]);

    useEffect(() => {
        // Real-time subscription for Quizzes (Limit to 4 for the UI)
        const unsubscribe = subscribeToQuizzes((all) => {
            setFreshQuizzes(all.slice(0, 4));
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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column (3) */}
            <div className="lg:col-span-3 flex flex-col gap-8">
                {/* Top Gamers Card */}
                <div className="floating-card hover:-translate-y-2 hover:scale-[1.01] hover:z-10 hover:rotate-1 bg-[var(--color-card-cyan)] dark:bg-cyan-900 rounded-3xl p-5 shadow-3d-cyan border-2 border-white/20 flex flex-col h-auto relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="flex items-center justify-between mb-6 text-white relative z-10">
                        <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-wide drop-shadow-md">
                            Top Gamers
                        </h2>
                        <span className="text-3xl drop-shadow-lg filter bg-white rounded-full p-1 border-2 border-yellow-400 group-hover:rotate-[360deg] transition-transform duration-700">🏆</span>
                    </div>
                    <div className="space-y-4 relative z-10">
                        {/* Mock Gamers */}
                        {[{ name: "Player dev_n", rank: 1, color: "yellow" }, { name: "Player dev_f", rank: 2, color: "gray" }, { name: "Player dev_x", rank: 3, color: "orange" }].map((g, i) => (
                            <div key={i} className="bg-white dark:bg-cyan-800 p-2 rounded-2xl flex items-center justify-between shadow-md border-b-4 border-gray-100 dark:border-cyan-950 transform hover:scale-105 transition-transform cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <span className={`bg-${g.color}-400 text-${g.color === 'yellow' || g.color === 'orange' ? 'white' : 'gray-600'} font-black w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-sm border-2 border-${g.color === 'yellow' || g.color === 'orange' ? g.color + '-500' : 'gray-300'}`}>#{g.rank}</span>
                                    <span className="font-bold text-sm text-gray-700 dark:text-white truncate w-24">{g.name}</span>
                                </div>
                                <span className="text-xl mr-2 filter drop-shadow hover:animate-bounce">🧶</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 bg-white/20 dark:bg-cyan-800/40 p-2 rounded-full flex items-center justify-center gap-2 shadow-inner border border-white/30 backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                        <span className="font-black text-sm text-white drop-shadow-md">Current Rank: 5 RP</span>
                        <span className="text-yellow-300 text-xl drop-shadow-md group-hover:animate-spin">⭐</span>
                    </div>
                </div>

                {/* Trending Topics Card */}
                <div className="floating-card hover:-translate-y-2 hover:scale-[1.01] hover:z-10 hover:-rotate-1 bg-[var(--color-card-orange)] dark:bg-orange-800 rounded-3xl p-5 shadow-3d-orange border-2 border-white/20 flex-grow relative overflow-hidden group">
                    <div className="absolute -left-10 bottom-10 w-40 h-40 bg-yellow-300/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
                    <h2 className="text-xl font-black text-white mb-4 uppercase tracking-wide drop-shadow-md relative z-10 flex items-center gap-2">
                        Trending Topics
                        <span className="material-symbols-rounded text-yellow-200 animate-pulse hidden group-hover:inline-block">trending_up</span>
                    </h2>
                    <div className="space-y-3 relative z-10">
                        {[
                            { name: "#Ecosystems", icon: "forest" },
                            { name: "#Algebra", icon: "calculate" },
                            { name: "#Zoology", icon: "pets" },
                            { name: "#Reactions", icon: "science" }
                        ].map((t, i) => (
                            <button key={i} className="w-full text-left bg-white/30 hover:bg-white/50 dark:bg-black/20 dark:hover:bg-black/30 p-3 rounded-2xl flex items-center gap-3 text-white font-bold transition border-2 border-transparent hover:border-white/50 shadow-sm hover:translate-x-2">
                                <span className={`material-symbols-rounded bg-white/20 p-1.5 rounded-lg group-hover:${i % 2 === 0 ? 'rotate-12' : '-rotate-12'} transition-transform`}>{t.icon}</span>
                                {t.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Middle Column (6) */}
            <div className="lg:col-span-6 flex flex-col gap-8">
                {/* Cats Playground (Join) */}
                <div className="floating-card hover:-translate-y-2 hover:scale-[1.01] hover:z-10 hover:rotate-1 bg-[var(--color-card-lime)] dark:bg-lime-900 rounded-3xl p-8 relative overflow-hidden shadow-3d-lime border-4 border-white dark:border-lime-700 min-h-[340px] flex flex-col justify-center group">
                    <div className="absolute bottom-[-30px] right-[-20px] text-[200px] opacity-90 select-none pointer-events-none drop-shadow-2xl grayscale-0 transform rotate-6 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-500 ease-out origin-bottom-right">
                        🐈
                    </div>
                    {/* Animated Dots */}
                    <div className="absolute top-10 right-20 w-8 h-8 bg-white/30 rounded-full animate-bounce delay-100 group-hover:bg-white/50 transition-colors"></div>
                    <div className="absolute top-20 right-40 w-4 h-4 bg-white/40 rounded-full animate-bounce delay-300 group-hover:bg-white/60 transition-colors"></div>
                    <div className="absolute top-40 right-10 w-12 h-12 bg-white/20 rounded-full animate-bounce delay-700 group-hover:bg-white/40 transition-colors"></div>

                    <div className="relative z-10 max-w-[75%]">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl lg:text-5xl font-black text-lime-900 dark:text-lime-100 drop-shadow-sm tracking-tight group-hover:tracking-normal transition-all duration-300">Cats Playground</h1>
                            <div className="bg-white dark:bg-lime-800 backdrop-blur rounded-xl px-2 py-1 text-2xl shadow-3d-white dark:shadow-none border-2 border-lime-200 group-hover:rotate-[20deg] transition-transform duration-300">
                                🧪
                            </div>
                        </div>
                        <p className="text-lime-900 dark:text-lime-100 font-bold text-lg mb-8 leading-relaxed drop-shadow-sm">
                            Step into the purr-fect world of Grade 7 Science & Math! Interactive learning made fun.
                        </p>
                        <form onSubmit={handleJoin} className="bg-white/80 dark:bg-black/30 backdrop-blur-md p-3 rounded-3xl flex items-center gap-3 shadow-lg max-w-md border-2 border-white/50 group-hover:border-white transition-colors duration-300">
                            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center text-2xl shadow-sm border-2 border-lime-100 group-hover:scale-110 transition-transform">
                                🐱
                            </div>
                            <input
                                type="text"
                                placeholder="Enter Join Code..."
                                value={joinCode}
                                onChange={e => setJoinCode(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 font-bold w-full text-lg outline-none"
                            />
                            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-black shadow-md border-b-4 border-green-800 hover:border-green-900 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 whitespace-nowrap hover:scale-105">
                                <span className="material-symbols-rounded font-bold">login</span>
                                JOIN
                            </button>
                        </form>
                    </div>
                </div>

                {/* Fresh Catpools */}
                <div className="flex flex-col rounded-3xl overflow-hidden shadow-3d-purple bg-white dark:bg-gray-800/80 border-2 border-purple-200 dark:border-gray-600 floating-card hover:-translate-y-2 hover:scale-[1.01] hover:z-10 hover:-rotate-1 group">
                    <div className="bg-[var(--color-card-purple)] dark:bg-purple-900 p-5 flex items-center gap-2 border-b-4 border-purple-300 dark:border-purple-950 relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        <h2 className="text-2xl font-black text-white drop-shadow-md relative z-10">Fresh Catpools</h2>
                        <span className="text-white text-2xl animate-pulse relative z-10">🐾</span>
                        <span className="ml-auto text-yellow-300 text-2xl drop-shadow-md group-hover:animate-spin relative z-10">✨</span>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-800/50 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Dynamic Catpools */}
                        {(freshQuizzes.length > 0 ? freshQuizzes : [1, 2, 3, 4]).map((quiz, i) => (
                            <div
                                key={quiz.id || i}
                                onClick={() => nav(`/battle/${quiz.id || 'mock'}`)}
                                className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border-2 border-gray-100 dark:border-gray-700 hover:border-purple-300 hover:shadow-lg transition group/item relative top-0 hover:-top-1 duration-300 cursor-pointer ${i % 2 === 0 ? 'hover:rotate-1' : 'hover:-rotate-1'}`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wide border border-blue-200">New</span>
                                    <span className="material-symbols-rounded text-yellow-400 drop-shadow-sm group-hover/item:rotate-180 transition-transform duration-500">star</span>
                                </div>
                                <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1 truncate">{quiz.title || "Doc: course1_distil.txt"}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-semibold">{quiz.description || "Reading Comprehension"}</p>
                                <div className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-mono font-bold text-center py-2 rounded-xl mb-3 select-all text-sm border border-gray-200 dark:border-gray-700 border-dashed">
                                    Code: <span className="text-purple-600 dark:text-purple-400">{quiz.battleCode || (quiz.id ? quiz.id.slice(0, 6).toUpperCase() : '617320')}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs font-bold text-yellow-600 dark:text-yellow-500">
                                    <span className="material-symbols-rounded text-sm">bolt</span>
                                    {quiz.plays || 10} plays
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column (3) */}
            <div className="lg:col-span-3 flex flex-col gap-8">
                {/* Hottest/Leaderboard Highlight */}
                <div className="floating-card hover:-translate-y-2 hover:scale-[1.01] hover:z-10 hover:rotate-1 bg-[var(--color-card-pink)] dark:bg-pink-800 rounded-3xl p-6 shadow-3d-pink border-2 border-white/20 min-h-[250px] flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <div className="absolute top-4 left-0 w-full text-center z-10">
                        <h2 className="text-white font-black text-xl uppercase tracking-wide drop-shadow-md group-hover:scale-110 transition-transform">#1 Hottest</h2>
                    </div>
                    <div className="w-36 h-36 bg-yellow-300 rounded-full border-[6px] border-white dark:border-pink-300 flex items-center justify-center shadow-2xl relative mt-4 z-10 transform group-hover:rotate-[360deg] transition-transform duration-[1s] ease-in-out">
                        <span className="text-7xl animate-bounce drop-shadow-md" style={{ animationDuration: '2s' }}>🐱</span>
                        {/* Whiskers */}
                        <div className="absolute -left-6 top-1/2 w-10 h-1.5 bg-white rounded-full rotate-12 shadow-sm"></div>
                        <div className="absolute -left-6 top-1/2 w-10 h-1.5 bg-white rounded-full -rotate-12 mt-3 shadow-sm"></div>
                        <div className="absolute -right-6 top-1/2 w-10 h-1.5 bg-white rounded-full -rotate-12 shadow-sm"></div>
                        <div className="absolute -right-6 top-1/2 w-10 h-1.5 bg-white rounded-full rotate-12 mt-3 shadow-sm"></div>
                    </div>
                    <p className="mt-4 text-white font-bold text-lg drop-shadow-sm z-10 group-hover:text-yellow-100 transition-colors">Most Played Today!</p>
                </div>

                {/* Discuss Card */}
                <div className="floating-card hover:-translate-y-2 hover:scale-[1.01] hover:z-10 hover:-rotate-1 bg-[var(--color-card-red)] dark:bg-red-900 rounded-3xl p-6 shadow-3d-red border-2 border-white/20 flex flex-col flex-grow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="flex items-center gap-2 mb-6 text-white relative z-10">
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                            <span className="material-symbols-rounded animate-pulse text-2xl group-hover:text-yellow-200">local_fire_department</span>
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-wide drop-shadow-md">Discuss</h2>
                    </div>
                    <div className="space-y-4 mb-16 relative z-10">
                        {/* Mock Discuss Items */}
                        <div onClick={() => nav('/discuss')} className="bg-white dark:bg-black/20 p-4 rounded-2xl shadow-md border-l-8 border-red-500 transform hover:translate-x-3 transition-transform cursor-pointer group/item">
                            <h4 className="font-extrabold text-gray-800 dark:text-white text-sm mb-1 group-hover/item:text-red-500 transition-colors">Headline #1</h4>
                            <p className="text-xs text-gray-600 dark:text-white/80 leading-snug font-semibold">Math Championship starts this Friday! Get your pencils ready.</p>
                        </div>
                        <div onClick={() => nav('/discuss')} className="bg-white dark:bg-black/20 p-4 rounded-2xl shadow-md border-l-8 border-orange-500 transform hover:translate-x-3 transition-transform cursor-pointer group/item">
                            <h4 className="font-extrabold text-gray-800 dark:text-white text-sm mb-1 group-hover/item:text-orange-500 transition-colors">Ranking Update</h4>
                            <p className="text-xs text-gray-600 dark:text-white/80 leading-snug font-semibold">Player_99 just hit level 50! Can you beat them?</p>
                        </div>
                    </div>
                    <div className="mt-auto w-full relative z-10">
                        <div className="absolute bottom-16 right-4 rotate-[-15deg] group-hover:rotate-0 transition-transform duration-300 hover:scale-110 cursor-pointer">
                            <span className="text-6xl drop-shadow-2xl filter brightness-110 animate-bounce">📢</span>
                        </div>
                        <button onClick={() => nav('/discuss')} className="w-full bg-white text-red-600 dark:text-red-800 font-black py-3 px-6 rounded-2xl shadow-md border-b-4 border-gray-200 dark:border-gray-700 hover:border-gray-300 active:border-b-0 active:translate-y-1 transition-all group-hover:bg-red-50">
                            Visit Hub
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
