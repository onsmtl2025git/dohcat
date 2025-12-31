import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeToBattle, findBattleByCode, ensureBattleForQuiz } from '../services/battleService';
import { findQuizByBattleCode } from '../services/quizService';
import { useUser } from '../context/UserContext';
import confetti from 'canvas-confetti';

// Mock Question for Demo if battle has none yet
const MOCK_QUESTION = {
    text: "What is the primary function of the Mitochondria?",
    options: ["Energy Production", "Protein Synthesis", "Cell Division", "Waste Removal"],
    correct: 0,
    stats: [45, 10, 5, 2] // Mock answer distribution
};

const BattleRoom = () => {
    const { battleId } = useParams();
    const { user } = useUser();
    const [battle, setBattle] = useState(null);
    const nav = useNavigate();

    // Game State (Local for Animation)
    const [timeLeft, setTimeLeft] = useState(10);
    const [selectedOption, setSelectedOption] = useState(null);
    const [showCeremony, setShowCeremony] = useState(false);

    useEffect(() => {
        if (!battleId) return;

        let unsub = () => { };

        const init = async () => {
            // 1. Try subscribing as a direct Firestore ID
            unsub = subscribeToBattle(battleId, async (data) => {
                if (data) {
                    setBattle(data);
                } else {
                    // 2. If ID not found, check if it's a valid 6-digit code format
                    if (/^\d{6}$/.test(battleId)) {
                        // A. Check if Battle ALREADY exists for this code
                        const existingBattle = await findBattleByCode(battleId);

                        if (existingBattle) {
                            nav(`/battle/${existingBattle.id}`, { replace: true });
                            return;
                        }

                        // B. If NO Battle, checking if it's a valid Quiz Code to START one?
                        const relatedQuiz = await findQuizByBattleCode(battleId);

                        if (relatedQuiz && user) { // Must be logged in to host/start? Or anon?
                            // Auto-create/Start the battle as the first joiner (Host)
                            const newBattle = await ensureBattleForQuiz(relatedQuiz, user);
                            nav(`/battle/${newBattle.id}`, { replace: true });
                        } else {
                            // C. Truly Invalid Code
                            // alert("Battle Code not found or invalid!");
                            // nav('/');
                            // Or stay on "Waiting" screen if we want to be passive
                        }
                    }
                }
            });
        };

        init();
        return () => unsub();
    }, [battleId, nav, user]); // Added user dependency to ensure we have profile for hosting

    // Timer Logic
    useEffect(() => {
        if (battle?.status === 'active' && timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft, battle?.status]);

    const handleStart = () => {
        setBattle(prev => ({ ...prev, status: 'active' }));
        setTimeLeft(10);
    };

    const handleAnswer = (idx) => {
        setSelectedOption(idx);
    };

    const triggerCeremony = () => {
        setShowCeremony(true);
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
    };

    if (!battle) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
                <div className="glass-card p-8 bg-white text-center max-w-md w-full animate-pulse">
                    <div className="text-6xl mb-4">⏳</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Waiting for Host...</h2>
                    <p className="text-gray-500 mb-6">The battle haven't started yet.</p>
                    <div className="bg-gray-100 px-6 py-3 rounded-xl font-mono text-2xl font-bold tracking-widest text-indigo-600 border border-gray-200">
                        {battleId}
                    </div>
                </div>
            </div>
        );
    }

    const isHost = user?.uid === battle.hostId;
    const sortedPlayers = [...(battle.players || [])].sort((a, b) => b.score - a.score);

    // --- RENDER HELPERS ---

    const RenderRankings = () => (
        <div className="flex flex-col gap-4 h-full">
            <div className="glass-panel p-4 flex-1 bg-blue-500/90 text-white overflow-hidden">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">🏆 Top Gamers</h3>
                <div className="space-y-2 overflow-y-auto max-h-[40vh]">
                    {sortedPlayers.map((p, i) => (
                        <div key={p.uid} className="flex items-center gap-2 bg-white/10 p-2 rounded-lg">
                            <span className="font-black text-yellow-300 w-6">#{i + 1}</span>
                            <span className="text-xl">{p.emoji}</span>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold truncate">{p.uid.slice(0, 6)}...</div>
                                <div className="text-xs opacity-80">{p.score} pts</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="glass-panel p-4 h-48 bg-gray-900/90 text-white flex flex-col justify-end">
                <div className="flex justify-between items-end h-32 gap-2">
                    {MOCK_QUESTION.stats.map((count, i) => {
                        const max = Math.max(...MOCK_QUESTION.stats);
                        const h = (count / max) * 100;
                        return (
                            <div key={i} className="flex-1 flex flex-col justify-end items-center group">
                                <div className="text-xs font-bold mb-1 opacity-0 group-hover:opacity-100 transition">{count}</div>
                                <div
                                    className={`w-full rounded-t-lg transition-all duration-500 ${selectedOption === i ? 'bg-yellow-400' : 'bg-indigo-500'}`}
                                    style={{ height: `${h}%` }}
                                ></div>
                            </div>
                        )
                    })}
                </div>
                <div className="text-center text-xs font-bold text-gray-500 mt-2">Live Responses</div>
            </div>
        </div>
    );

    const RenderGameBoard = () => (
        <div className="md:col-span-2 h-full flex flex-col">
            {battle.status === 'lobby' ? (
                <div className="flex-1 glass-card flex flex-col items-center justify-center text-center p-8 bg-[var(--color-leo-secondary)]/10">
                    <div className="text-8xl mb-6 bounce-slow">🐱</div>
                    <h2 className="text-4xl font-bold text-gray-800 mb-2">Waiting for Host...</h2>
                    <div className="text-2xl font-mono bg-white px-6 py-2 rounded-xl border border-gray-200 shadow-inner mb-8 tracking-[0.5em]">
                        {battle.code}
                    </div>
                    {isHost && (
                        <button onClick={handleStart} className="mt-8 px-8 py-4 bg-[var(--color-leo-accent)] text-white text-xl font-bold rounded-2xl shadow-lg hover:scale-105 transition animate-pulse">
                            Start Battle ⚔️
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex flex-col animate-in fade-in zoom-in duration-500">
                    <div className="glass-panel p-8 mb-4 bg-white min-h-[200px] flex items-center justify-center text-center relative overflow-hidden">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 relative z-10">{MOCK_QUESTION.text}</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4 flex-1">
                        {MOCK_QUESTION.options.map((opt, i) => {
                            let btnClass = "bg-white hover:bg-gray-50 border-gray-200 text-gray-700";

                            if (selectedOption === i) btnClass = "bg-blue-500 text-white border-blue-700 scale-[0.98]";

                            if (timeLeft === 0) {
                                if (i === MOCK_QUESTION.correct) {
                                    // Always Green for Correct
                                    btnClass = "bg-green-500 text-white border-green-700 shadow-xl scale-105";
                                } else {
                                    // Always Red for Incorrect
                                    btnClass = "bg-red-400 text-white border-red-600 opacity-90";

                                    // Highlight user's wrong choice
                                    if (selectedOption === i) {
                                        btnClass = "bg-red-600 text-white border-red-800 scale-100 ring-4 ring-red-200";
                                    }
                                }
                            }

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(i)}
                                    disabled={timeLeft === 0}
                                    className={`p-6 rounded-2xl text-lg font-bold shadow-sm border-b-4 transition-all transform active:scale-95 ${btnClass}`}
                                >
                                    {opt}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );

    const RenderStatus = () => (
        <div className="flex flex-col gap-4 h-full">
            <div className="glass-panel p-6 flex flex-col items-center justify-center bg-white aspect-square relative">
                {battle.status === 'active' ? (
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                            <circle cx="64" cy="64" r="56" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                            <circle cx="64" cy="64" r="56" stroke={timeLeft < 4 ? '#ef4444' : '#3b82f6'} strokeWidth="8" fill="none" strokeDasharray="351" strokeDashoffset={351 - (351 * timeLeft / 10)} className="transition-all duration-1000 ease-linear" />
                        </svg>
                        <div className="text-4xl font-black text-gray-800">{timeLeft}</div>
                    </div>
                ) : <div className="text-gray-300 font-bold text-xl uppercase tracking-widest">Ready</div>}
            </div>
            {isHost && battle.status === 'active' && (
                <div className="mt-auto">
                    <button onClick={triggerCeremony} className="w-full py-4 bg-gray-800 text-white font-bold rounded-2xl hover:bg-black transition">End Game 🏁</button>
                </div>
            )}
        </div>
    );

    const RenderCeremony = () => (
        <div className="md:col-span-2 h-full glass-card bg-white flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700 p-8 relative overflow-hidden shadow-2xl border-4 border-yellow-200">
            <div className="absolute inset-0 bg-gradient-to-b from-yellow-50 to-white opacity-50"></div>
            <div className="text-center z-10 w-full">
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-8 drop-shadow-sm">VICTORY!</h1>
                <div className="flex items-end justify-center gap-2 md:gap-6 h-64 mb-8">
                    {/* 2nd Place */}
                    <div className="flex flex-col items-center animate-in slide-in-from-bottom duration-1000 delay-200">
                        <div className="text-4xl md:text-5xl mb-2">🥈</div>
                        <div className="w-20 md:w-24 h-32 bg-gray-200 rounded-t-2xl flex items-end justify-center pb-4 shadow-inner border-t-4 border-gray-300">
                            <div className="font-bold text-gray-500 text-xs md:text-sm truncate max-w-full px-1">{sortedPlayers[1]?.uid.slice(0, 6) || '-'}</div>
                        </div>
                    </div>
                    {/* 1st Place */}
                    <div className="flex flex-col items-center z-10 animate-in slide-in-from-bottom duration-1000 -mx-2 mb-2">
                        <div className="text-6xl md:text-7xl mb-2 animate-bounce">👑</div>
                        <div className="w-24 md:w-32 h-48 bg-yellow-300 rounded-t-2xl flex items-end justify-center pb-6 shadow-lg border-t-8 border-yellow-400 relative overflow-hidden">
                            <div className="absolute top-0 w-full h-full bg-gradient-to-b from-yellow-200 to-transparent opacity-50"></div>
                            <div className="font-black text-yellow-800 text-sm md:text-lg truncate max-w-full px-2">{sortedPlayers[0]?.uid.slice(0, 6) || '-'}</div>
                        </div>
                    </div>
                    {/* 3rd Place */}
                    <div className="flex flex-col items-center animate-in slide-in-from-bottom duration-1000 delay-500">
                        <div className="text-4xl md:text-5xl mb-2">🥉</div>
                        <div className="w-20 md:w-24 h-24 bg-orange-200 rounded-t-2xl flex items-end justify-center pb-3 shadow-inner border-t-4 border-orange-300">
                            <div className="font-bold text-orange-700 text-xs md:text-sm truncate max-w-full px-1">{sortedPlayers[2]?.uid.slice(0, 6) || '-'}</div>
                        </div>
                    </div>
                </div>
                <button onClick={() => nav('/')} className="px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:scale-105 transition shadow-xl border-2 border-gray-800 text-sm md:text-base">
                    Return to Lobby 🏠
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            <h1 className="text-2xl font-bold text-gray-400 mb-6 font-display uppercase tracking-widest text-center">Battle Arena <span className="text-gray-300">#{battle.code}</span></h1>
            <div className="max-w-7xl mx-auto h-[75vh] grid grid-cols-1 md:grid-cols-4 gap-6">
                <RenderRankings />
                {showCeremony ? <RenderCeremony /> : <RenderGameBoard />}
                <RenderStatus />
            </div>
        </div>
    );
};

export default BattleRoom;
