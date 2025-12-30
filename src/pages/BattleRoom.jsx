import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeToBattle } from '../services/battleService';
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
        const unsubscribe = subscribeToBattle(battleId, (data) => {
            if (!data) {
                alert("Battle not found!");
                nav('/');
            } else {
                setBattle(data);
            }
        });
        return () => unsubscribe();
    }, [battleId, nav]);

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

    if (!battle) return <div className="p-10 text-center font-bold text-gray-400">Loading Arena...</div>;

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
                                if (i === MOCK_QUESTION.correct) btnClass = "bg-green-500 text-white border-green-700 shadow-xl scale-105";
                                else if (selectedOption === i) btnClass = "bg-red-500 text-white border-red-700 opacity-80";
                                else btnClass = "bg-gray-100 text-gray-400 border-gray-200 opacity-50";
                            }

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(i)}
                                    disabled={selectedOption !== null || timeLeft === 0}
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

    const CeremonyOverlay = () => (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-700">
            <div className="text-center">
                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 mb-12 drop-shadow-lg">WINNERS</h1>
                <div className="flex items-end justify-center gap-4 h-96">
                    <div className="flex flex-col items-center animate-in slide-in-from-bottom duration-1000 delay-200">
                        <div className="text-6xl mb-4">🥈</div>
                        <div className="w-32 h-48 bg-gray-300 rounded-t-xl flex items-end justify-center pb-4 shadow-lg border-t-4 border-gray-400"><div className="font-bold text-gray-700">Player 2</div></div>
                    </div>
                    <div className="flex flex-col items-center z-10 animate-in slide-in-from-bottom duration-1000">
                        <div className="text-8xl mb-4 animate-bounce">👑</div>
                        <div className="w-40 h-64 bg-yellow-400 rounded-t-xl flex items-end justify-center pb-8 shadow-xl border-t-4 border-yellow-200 relative overflow-hidden"><div className="font-bold text-yellow-900 text-xl">Player 1</div></div>
                    </div>
                    <div className="flex flex-col items-center animate-in slide-in-from-bottom duration-1000 delay-500">
                        <div className="text-6xl mb-4">🥉</div>
                        <div className="w-32 h-32 bg-orange-300 rounded-t-xl flex items-end justify-center pb-4 shadow-lg border-t-4 border-orange-400"><div className="font-bold text-orange-800">Player 3</div></div>
                    </div>
                </div>
                <button onClick={() => nav('/')} className="mt-16 px-12 py-4 bg-white text-gray-900 font-bold rounded-full text-xl hover:scale-110 transition shadow-2xl">Back to Lobby 🏠</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            <h1 className="text-2xl font-bold text-gray-400 mb-6 font-display uppercase tracking-widest text-center">Battle Arena <span className="text-gray-300">#{battle.code}</span></h1>
            <div className="max-w-7xl mx-auto h-[75vh] grid grid-cols-1 md:grid-cols-4 gap-6">
                <RenderRankings />
                <RenderGameBoard />
                <RenderStatus />
            </div>
            {showCeremony && <CeremonyOverlay />}
        </div>
    );
};

export default BattleRoom;
