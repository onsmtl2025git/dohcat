import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeToBattle, findBattleByCode, ensureBattleForQuiz, updateBattle, joinBattle, submitAnswer, resetBattle, finalizeBattleRewards, updatePlayerHeartbeat } from '../services/battleService';
import { findQuizByBattleCode, findQuizById } from '../services/quizService';
import { useUser } from '../context/UserContext';
import confetti from 'canvas-confetti';
import GuestJoinModal from '../components/GuestJoinModal';
import { db, rtdb } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { setPlayerOnline, removePlayerOnline } from '../services/presenceService';
import { doc, getDoc } from 'firebase/firestore';

const BattleRoom = () => {
    const { battleId } = useParams();
    const { user: authUser, profile: userProfile, loading: authLoading } = useUser();
    const [battle, setBattle] = useState(null);
    const [quiz, setQuiz] = useState(null);
    const [nextQuestionTimer, setNextQuestionTimer] = useState(null);
    const lastQuestionRef = useRef(-1);
    const quizFetchingRef = useRef(false);
    const nav = useNavigate();

    // Loading State
    const [loading, setLoading] = useState(true);

    // Game State (Local for Animation)
    const [timeLeft, setTimeLeft] = useState(10);
    const [selectedOption, setSelectedOption] = useState(null);
    const [showCeremony, setShowCeremony] = useState(false);

    // Profile Customization State (Lobby Only)
    const [customName, setCustomName] = useState('');
    const [customEmoji, setCustomEmoji] = useState('🐱');
    const [hasJoinedLocally, setHasJoinedLocally] = useState(false);
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [activePlayers, setActivePlayers] = useState([]);

    // Derived State
    const isHost = authUser?.uid === battle?.hostId;

    // THE ACTIVE IDENTITY: Flattened for consistent UI behavior
    const activeUser = userProfile ? { ...userProfile } : (authUser ? {
        uid: authUser.uid,
        username: authUser.displayName || (authUser.isAnonymous ? 'Guest Explorer' : (authUser.email?.split('@')[0] || 'Member')),
        emoji: authUser.photoURL || '👤',
        isAnonymous: authUser.isAnonymous,
        level: 1
    } : null);

    // THE LEADERBOARD: Driven by the RTDB Presence Sidecar
    const sortedPlayers = [...activePlayers].sort((a, b) => b.score - a.score);

    useEffect(() => {
        if (!battleId) return;
        setLoading(true);
        let unsub = () => { };

        let loadingTimer = setTimeout(() => {
            setLoading(current => {
                if (current) console.warn("BattleRoom Loading Timeout: Forcing stop.");
                return false;
            });
        }, 4000);

        const init = async () => {
            try {
                unsub = subscribeToBattle(battleId, async (data) => {
                    clearTimeout(loadingTimer);
                    if (data) {
                        setBattle(data);
                        if (!quiz && data.quizId && !quizFetchingRef.current) {
                            quizFetchingRef.current = true;
                            const currentQuiz = await findQuizById(data.quizId);
                            setQuiz(currentQuiz);
                            quizFetchingRef.current = false;
                        }
                        if (data.status === 'finished') setShowCeremony(true);
                        setLoading(false);
                    } else {
                        const profileToHost = userProfile || authUser;

                        if (/^\d{6}$/.test(battleId)) {
                            const existingBattle = await findBattleByCode(battleId);
                            if (existingBattle) {
                                nav(`/battle/${existingBattle.id}`, { replace: true });
                                return;
                            }

                            if (!authUser) {
                                setLoading(false);
                                return;
                            }

                            const relatedQuiz = await findQuizByBattleCode(battleId);
                            if (relatedQuiz) {
                                const newBattle = await ensureBattleForQuiz(relatedQuiz, profileToHost);
                                nav(`/battle/${newBattle.id}`, { replace: true });
                                return;
                            }
                        }

                        if (battleId.length > 10) {
                            const q = await findQuizById(battleId);
                            if (q) {
                                if (!authUser) {
                                    setLoading(false);
                                    return;
                                }

                                if (q.isPublic === false && q.authorId !== authUser.uid) {
                                    setLoading(false);
                                    setBattle(null);
                                    return;
                                }
                                const newBattle = await ensureBattleForQuiz(q, profileToHost);
                                nav(`/battle/${newBattle.id}`, { replace: true });
                                return;
                            }
                        }

                        setLoading(false);
                    }
                });
            } catch (error) {
                console.error("BattleRoom init error:", error);
                setLoading(false);
            }
        };

        if (!authLoading) {
            init();
        }

        return () => {
            unsub();
            clearTimeout(loadingTimer);
        };
    }, [battleId, nav, authUser?.uid, authLoading]);

    // RTDB PRESENCE LISTENER: Handles the live leaderboard and native disconnections
    useEffect(() => {
        if (!battleId) return;
        const onlineRef = ref(rtdb, `battles/${battleId}/online`);

        const unsubRTDB = onValue(onlineRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setActivePlayers(Object.values(data));
            } else {
                setActivePlayers([]);
            }
        });

        return () => unsubRTDB();
    }, [battleId]);

    // GUEST PERSISTENCE: Restore session if refreshed (Guests)
    useEffect(() => {
        if (activeUser?.isAnonymous && !hasJoinedLocally && battle) {
            const savedGuest = localStorage.getItem(`guest_auth_${battleId}`);
            if (savedGuest) {
                try {
                    const { name, emoji, uid } = JSON.parse(savedGuest);
                    if (uid === authUser?.uid) {
                        setCustomName(name);
                        setCustomEmoji(emoji);

                        const existingPlayerInFirestore = battle.players?.find(p => p.uid === uid);
                        const isAlreadyOnlineInRTDB = activePlayers.some(p => p.uid === uid);

                        if (existingPlayerInFirestore) {
                            setHasJoinedLocally(true);
                            if (!isAlreadyOnlineInRTDB) {
                                // Restore Presence Sidecar Node
                                setPlayerOnline(battleId, {
                                    uid,
                                    username: name,
                                    emoji: emoji,
                                    isGuest: true,
                                    score: existingPlayerInFirestore.score || 0
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.error("Failed to restore guest session:", e);
                }
            }
        }
    }, [activeUser?.isAnonymous, battleId, !!battle, authUser?.uid, activePlayers.length === 0]);

    // MEMBER PERSISTENCE: Restore session if refreshed (Registered Users)
    useEffect(() => {
        const recoverRegisteredMember = async () => {
            if (activeUser && !activeUser.isAnonymous && !hasJoinedLocally && battle) {
                // LOCK: Wait for profile to be truly ready (has username) 
                // If context is slow, we can do a tactical fetch here
                let finalProfile = userProfile;
                if (!finalProfile?.username) {
                    try {
                        const snap = await getDoc(doc(db, "users", authUser.uid));
                        if (snap.exists()) finalProfile = snap.data();
                    } catch (e) {
                        console.error("Tactical profile fetch failed:", e);
                    }
                }

                const existingPlayer = battle.players?.find(p => p.uid === activeUser.uid);
                if (existingPlayer && finalProfile?.username) {
                    setHasJoinedLocally(true);
                    const isAlreadyOnline = activePlayers.some(p => p.uid === activeUser.uid);
                    if (!isAlreadyOnline) {
                        setPlayerOnline(battleId, {
                            uid: activeUser.uid,
                            username: finalProfile.username,
                            emoji: finalProfile.emoji || finalProfile.emojis?.[0] || '🐱',
                            isGuest: false,
                            score: existingPlayer.score || 0
                        });
                    }
                }
            }
        };
        recoverRegisteredMember();
    }, [activeUser?.isAnonymous, !!battle, activePlayers.length === 0, userProfile?.username, authUser?.uid]);

    // Main Game Timer - Ticks only when no countdown is active
    useEffect(() => {
        if (battle?.status === 'active' && timeLeft > 0 && nextQuestionTimer === null) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft, battle?.status, nextQuestionTimer]);

    useEffect(() => {
        let countdown;
        const currentIdx = battle?.currentQuestionIndex || 0;
        if (battle?.status === 'active' && timeLeft === 0 && nextQuestionTimer === null && lastQuestionRef.current !== currentIdx) {
            lastQuestionRef.current = currentIdx;
            let count = 3;
            setNextQuestionTimer(count);

            countdown = setInterval(() => {
                count -= 1;
                if (count <= 0) {
                    clearInterval(countdown);
                    setNextQuestionTimer(null);
                    // Only Host pushes the state update to Firestore
                    if (authUser?.uid === battle.hostId) {
                        handleNext();
                    }
                } else {
                    setNextQuestionTimer(count);
                }
            }, 1000);
        }
        return () => {
            if (countdown) clearInterval(countdown);
        };
    }, [timeLeft, battle?.status, battle?.hostId, authUser?.uid]);

    // Reset local state when question changes
    useEffect(() => {
        if (battle?.currentQuestionIndex !== undefined) {
            setTimeLeft(10);
            setSelectedOption(null);
            setNextQuestionTimer(null);
        }
    }, [battle?.currentQuestionIndex]);

    const handleStart = async () => {
        await updateBattle(battleId, { status: 'active', stats: [0, 0, 0, 0], currentQuestionIndex: 0 });
    };

    const handleNext = async () => {
        if (!quiz) return;
        const nextIdx = (battle.currentQuestionIndex || 0) + 1;
        if (nextIdx < quiz.questions.length) {
            await updateBattle(battleId, {
                currentQuestionIndex: nextIdx,
                stats: [0, 0, 0, 0]
            });
        } else {
            triggerCeremony();
        }
    };

    const handleAnswer = async (idx) => {
        if (selectedOption !== null || timeLeft === 0 || !quiz) return;
        setSelectedOption(idx);

        const currentQ = quiz.questions[battle.currentQuestionIndex || 0];
        const isCorrect = idx === currentQ?.correctIndex;

        await submitAnswer(battleId, authUser.uid, idx, isCorrect);
    };

    const triggerCeremony = async () => {
        await updateBattle(battleId, { status: 'finished' });
        await finalizeBattleRewards(battleId);
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
    };

    const handleJoin = async (nameOverride = null, emojiOverride = null) => {
        if (!authUser) return;
        setHasJoinedLocally(true);

        let finalProfile = userProfile;
        // TACTICAL FETCH: If registered and name is missing, force a fetch to avoid 'Guest' label
        if (!authUser.isAnonymous && !finalProfile?.username) {
            const snap = await getDoc(doc(db, "users", authUser.uid));
            if (snap.exists()) finalProfile = snap.data();
        }

        // If anonymous, use custom name/emoji from overrides or state.
        const playerPayload = authUser.isAnonymous ? {
            ...activeUser,
            username: nameOverride || customName || `Explorer #${authUser.uid?.slice(-4).toUpperCase() || '????'}`,
            emoji: emojiOverride || customEmoji,
            emojis: [emojiOverride || customEmoji, ...(activeUser?.emojis || [])]
        } : {
            ...finalProfile,
            uid: authUser.uid // Ensure UID is attached
        };

        const result = await joinBattle(battle.id || battleId, playerPayload);
        if (result && !result.success) {
            alert(result.error || "Could not join battle. 🛑");
            setHasJoinedLocally(false);
        } else {
            setShowGuestModal(false);

            // JOIN PRESENCE: Add to RTDB sidecar
            setPlayerOnline(battle.id || battleId, {
                uid: authUser.uid,
                username: playerPayload.username || 'Explorer',
                emoji: playerPayload.emoji || playerPayload.emojis?.[0] || '🐱',
                isGuest: !!activeUser?.isAnonymous,
                score: 0
            });

            // PERSIST GUEST: Store identity locally
            if (activeUser?.isAnonymous) {
                localStorage.setItem(`guest_auth_${battleId}`, JSON.stringify({
                    name: nameOverride || customName,
                    emoji: emojiOverride || customEmoji,
                    uid: authUser.uid
                }));
            }
        }
    };

    const handleReset = async () => {
        if (!isHost || !battle) return;
        if (confirm("Reset everything? This will remove all players from the leaderboard. 🧹")) {
            setLoading(true);
            await resetBattle(battle.id || battleId, activeUser);
            setLoading(false);
        }
    };

    const RenderRankings = () => (
        <div className="flex flex-col gap-6 h-full lg:col-span-3">
            <div className="floating-card hover:-translate-y-2 hover:-rotate-1 hover:scale-[1.01] hover:z-10 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-3d-cyan border-2 border-cyan-200 dark:border-cyan-700 flex-1 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 to-blue-500"></div>
                <h3 className="font-black text-gray-800 dark:text-white text-xl mb-6 flex items-center gap-2 uppercase tracking-wide drop-shadow-sm">
                    <span className="text-2xl animate-bounce">🏆</span> Leaderboard
                </h3>
                <div className="space-y-2 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar relative z-10">
                    {sortedPlayers.map((p, i) => (
                        <div key={p.uid} className="flex items-center gap-2 bg-gray-50/80 hover:bg-white dark:bg-gray-700/50 p-2 rounded-xl border-2 border-transparent hover:border-cyan-200 transition-all shadow-sm">
                            <div className={`w-8 h-8 flex items-center justify-center font-black rounded-lg text-xs ${i === 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</div>
                            <span className="text-xl">{p.emoji || '🐱'}</span>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-gray-800 dark:text-white truncate">{p.username || 'Guest'}</div>
                                <div className="text-[9px] font-black text-cyan-500 uppercase tracking-tighter">{p.score} pts</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="floating-card hover:-translate-y-1 hover:rotate-1 bg-white dark:bg-gray-800 rounded-3xl p-6 border-2 border-white dark:border-gray-700 shadow-3d-lime flex items-center gap-4 relative overflow-hidden group">
                <div className="w-14 h-14 bg-lime-100 dark:bg-lime-900 rounded-2xl flex items-center justify-center text-3xl border-2 border-lime-200 shadow-inner">
                    {userProfile?.emojis?.[0] || '😎'}
                </div>
                <div className="relative z-10">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Playing As</div>
                    <div className="font-bold text-gray-800 dark:text-white text-xl truncate w-32">{activeUser?.username || 'Guest'}</div>
                </div>
            </div>
        </div>
    );

    const RenderGameBoard = () => {
        const currentQ = quiz?.questions?.[battle.currentQuestionIndex || 0];

        if (!currentQ) return (
            <div className="lg:col-span-6 h-full flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-[3rem] shadow-3d-blue border-4 border-white animate-pulse">
                <div className="text-4xl font-black text-gray-300">Loading Question...</div>
            </div>
        );

        return (
            <div className="lg:col-span-6 h-full flex flex-col relative">
                {battle.status === 'lobby' ? (
                    <div className="floating-card hover:-translate-y-1 hover:scale-[1.005] hover:shadow-2xl transition-all duration-500 bg-white dark:bg-gray-800 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-8 border-4 border-white/50 dark:border-gray-600 shadow-3d-purple relative overflow-hidden group h-full">
                        <div className="absolute top-0 w-full h-3 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500"></div>
                        {/* Conditional Rendering: Join Form OR Lobby Status */}
                        {!isHost && !battle.players?.some(p => p.uid === authUser?.uid) ? (
                            <div className="w-full max-w-md bg-indigo-50/50 dark:bg-indigo-900/20 p-8 rounded-[2rem] border-2 border-indigo-100 dark:border-indigo-800 shadow-inner relative z-10 animate-in fade-in zoom-in duration-500">
                                <h3 className="text-2xl font-black text-indigo-900 dark:text-indigo-100 mb-6 uppercase tracking-wider">
                                    {userProfile?.isAnonymous ? "Join the Arena" : `Welcome, ${userProfile?.username}!`}
                                </h3>

                                <div className="flex flex-col items-center gap-4 mb-8">
                                    <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-3xl flex items-center justify-center text-5xl shadow-lg border-4 border-indigo-100 dark:border-indigo-900">
                                        {userProfile?.emojis?.[0] || '🐱'}
                                    </div>
                                    <p className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest text-sm">
                                        {userProfile?.isAnonymous ? "Join as a guest to compete!" : "Use your registered profile to compete!"}
                                    </p>
                                </div>

                                <button
                                    onClick={() => activeUser?.isAnonymous ? setShowGuestModal(true) : handleJoin()}
                                    disabled={!authUser}
                                    className={`w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 hover:scale-[1.02] transition-all uppercase tracking-widest mt-4 flex items-center justify-center gap-2 ${!authUser ? 'opacity-50 cursor-wait' : ''}`}
                                >
                                    {(activeUser?.isSyncing || !activeUser) && <span className="material-symbols-rounded animate-spin">sync</span>}
                                    {authUser ? (
                                        activeUser?.isAnonymous ? 'Enter Battle' : `Join as ${activeUser?.username || 'Member'}`
                                    ) : 'Syncing Profile...'}
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center text-8xl shadow-xl mb-8 border-8 border-indigo-50 animate-bounce relative z-10">
                                    <span className="filter drop-shadow-md">
                                        {battle.players?.find(p => p.uid === authUser?.uid)?.emoji || (isHost ? (userProfile?.emojis?.[0] || '🐱') : '🐱')}
                                    </span>
                                </div>
                                <h2 className="text-5xl font-black text-gray-800 dark:text-white mb-4 drop-shadow-sm relative z-10">
                                    {isHost ? "Ready to Rumble?" : "Waiting for Start..."}
                                </h2>
                                <p className="text-gray-500 dark:text-gray-300 font-bold mb-10 text-xl max-w-lg relative z-10">
                                    {isHost ? "You are the Commander! Start when ready." : "The battle will begin shortly."}
                                </p>
                                <div className="flex flex-col items-center gap-3 mb-8 relative z-10 scale-100">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em]">SECURE CHANNEL</span>
                                        <div className="text-5xl font-mono font-black bg-white dark:bg-gray-900 px-8 py-4 rounded-3xl border-4 border-indigo-100 dark:border-indigo-900 shadow-inner tracking-[0.2em] text-indigo-600 dark:text-indigo-400 select-all cursor-pointer hover:scale-105 transition-transform">
                                            {battle.code}
                                        </div>
                                    </div>

                                    {isHost && (
                                        <div className="mt-4 flex flex-col items-center gap-2 bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-2xl border-2 border-indigo-100 dark:border-indigo-800">
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Max Players: {battle.playerLimit || 50}</span>
                                            <div className="flex gap-2">
                                                {[10, 20, 50, 100].map(val => (
                                                    <button
                                                        key={val}
                                                        onClick={() => updateBattle(battle.id || battleId, { playerLimit: val })}
                                                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${battle.playerLimit === val ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-indigo-600 border border-indigo-100 dark:border-indigo-900'}`}
                                                    >
                                                        {val}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {isHost ? (
                                    <div className="flex gap-4 relative z-10">
                                        <button onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xl font-black rounded-3xl shadow-xl hover:scale-105 transition-all flex items-center gap-3 uppercase relative overflow-hidden group/btn">
                                            <span>Initiate Battle</span>
                                            <span className="material-symbols-rounded text-3xl group-hover/btn:rotate-45 transition-transform">swords</span>
                                        </button>
                                        <button
                                            onClick={handleReset}
                                            className="w-16 h-16 bg-white dark:bg-gray-800 text-gray-400 hover:text-red-500 rounded-2xl flex items-center justify-center border-2 border-gray-100 dark:border-gray-700 hover:border-red-200 transition-all shadow-sm group/reset"
                                            title="Reset Session"
                                        >
                                            <span className="material-symbols-rounded text-3xl group-hover/reset:rotate-180 transition-transform duration-500">restart_alt</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-6 py-3 rounded-full border border-indigo-100 dark:border-indigo-800 relative z-10">
                                        <span className="material-symbols-rounded animate-spin text-2xl">sync</span>
                                        Awaiting Host Command...
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col w-full h-full">
                        <div className="floating-card hover:-translate-y-2 hover:rotate-1 bg-white dark:bg-gray-800 p-10 mb-6 min-h-[220px] flex items-center justify-center text-center relative overflow-hidden border-4 border-white dark:border-gray-700 shadow-3d-blue rounded-[3rem] group">
                            <div className="absolute -top-20 -left-20 w-60 h-60 bg-blue-400/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                            <h2 className="text-3xl md:text-5xl font-black text-gray-800 dark:text-white relative z-10 leading-tight drop-shadow-sm px-4">
                                {currentQ.text}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            {currentQ.options.map((opt, i) => {
                                let btnClass = "bg-white hover:bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-200 border-b-4 border-gray-200 dark:border-gray-700 hover:border-b-8 hover:-translate-y-1";
                                if (selectedOption === i) btnClass = "bg-indigo-600 text-white border-b-4 border-indigo-800 ring-4 ring-indigo-200 scale-[0.98]";
                                if (timeLeft === 0) {
                                    if (i === currentQ.correctIndex) {
                                        btnClass = "bg-green-500 text-white border-b-4 border-green-700 shadow-xl scale-105 ring-4 ring-green-200 z-10";
                                    } else if (selectedOption === i) {
                                        btnClass = "bg-red-500 text-white border-b-4 border-red-700 ring-4 ring-red-200 opacity-90";
                                    } else {
                                        btnClass = "opacity-50 grayscale";
                                    }
                                }
                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleAnswer(i)}
                                        disabled={timeLeft === 0}
                                        className={`p-6 rounded-3xl text-xl font-black shadow-sm transition-all duration-200 flex items-center justify-between group/opt ${btnClass}`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-sm opacity-50">{['A', 'B', 'C', 'D'][i]}</span>
                                            {opt}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="floating-card bg-white/40 dark:bg-gray-800/40 rounded-3xl p-8 border-2 border-white dark:border-gray-700 shadow-inner h-72 flex flex-col justify-end group">
                            <div className="flex justify-between items-end h-[60%] gap-6 relative z-10 px-4">
                                {(battle.stats || [0, 0, 0, 0]).map((count, i) => {
                                    const statsArray = battle.stats || [0, 0, 0, 0];
                                    const max = Math.max(...statsArray, 1);
                                    const h = (count / max) * 100;

                                    // Color logic: Green for correct if revealed, Blue otherwise
                                    let barBg = "bg-gradient-to-t from-blue-600 to-blue-400 dark:from-blue-800 dark:to-blue-600";
                                    if (timeLeft === 0) {
                                        barBg = i === currentQ.correctIndex
                                            ? "bg-gradient-to-t from-green-500 to-green-400 shadow-[0_0_30px_rgba(34,197,94,0.4)]"
                                            : "bg-gradient-to-t from-blue-500 to-blue-400 opacity-60";
                                    } else if (selectedOption === i) {
                                        barBg = "bg-gradient-to-t from-indigo-500 to-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.4)]";
                                    }

                                    return (
                                        <div key={i} className="flex-1 flex flex-col justify-end items-center group/bar h-full relative">
                                            <div className="text-2xl font-black mb-2 text-gray-700 dark:text-white transition-all group-hover/bar:scale-125 drop-shadow-sm">{count}</div>

                                            {/* User Identity Icon on the bar - Positioned relative to the bar top */}
                                            {selectedOption === i && (
                                                <div
                                                    className="absolute z-20 animate-bounce transition-all duration-700"
                                                    style={{ bottom: `calc(${Math.max(5, h)}% + 45px)` }}
                                                >
                                                    <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl shadow-lg border-2 border-indigo-200">
                                                        {activeUser?.emoji || activeUser?.emojis?.[0] || '🐱'}
                                                    </div>
                                                </div>
                                            )}

                                            <div
                                                className={`w-full rounded-t-2xl transition-all duration-700 ease-out border-t-2 border-x-2 border-white/50 ${barBg}`}
                                                style={{ height: `${Math.max(5, h)}%` }}
                                            ></div>
                                            <div className="mt-3 text-sm font-black text-gray-500 uppercase tracking-widest">{['A', 'B', 'C', 'D'][i]}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const RenderStatus = () => (
        <div className="flex flex-col gap-6 h-full lg:col-span-3">
            <div className="floating-card hover:-translate-y-2 hover:scale-[1.01] hover:z-10 hover:rotate-1 bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center aspect-square relative border-4 border-white dark:border-gray-700 shadow-3d-red group overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-red-100 rounded-full blur-2xl opacity-50"></div>
                {battle.status === 'active' ? (
                    <div className="relative w-48 h-48 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-lg">
                            <circle cx="96" cy="96" r="80" stroke="#f3f4f6" strokeWidth="16" fill="none" />
                            <circle
                                cx="96" cy="96" r="80"
                                stroke={timeLeft < 4 ? '#ef4444' : '#6366f1'}
                                strokeWidth="16"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray="502"
                                strokeDashoffset={502 - (502 * timeLeft / 10)}
                                className="transition-all duration-1000 ease-linear"
                            />
                        </svg>
                        <div className="text-6xl font-black text-gray-800 dark:text-white drop-shadow-sm flex flex-col items-center leading-none">
                            {nextQuestionTimer !== null ? nextQuestionTimer : timeLeft}
                        </div>
                    </div>
                ) : (
                    <div className="text-center relative z-10">
                        <div className="text-7xl mb-4 animate-pulse filter drop-shadow">⚡</div>
                        <div className="text-gray-400 font-black text-2xl uppercase tracking-[0.2em]">Ready</div>
                    </div>
                )}
            </div>

            {isHost && battle.status === 'active' && (
                <div className="flex flex-col gap-3 mt-auto w-full">
                    <button onClick={triggerCeremony} className="floating-card hover:-translate-y-1 w-full py-5 bg-gray-900 text-white font-black rounded-3xl hover:bg-black transition shadow-3d-white border-2 border-gray-700 flex items-center justify-center gap-3 group">
                        <span className="material-symbols-rounded">flag</span>
                        END GAME
                    </button>
                    {timeLeft === 0 && (
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center animate-pulse">
                            Auto-syncing to next question...
                        </div>
                    )}
                </div>
            )}

            {battle.status === 'finished' && (
                <div className="mt-auto w-full">
                    <button onClick={() => nav('/')} className="floating-card hover:-translate-y-1 w-full py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black rounded-3xl shadow-3d-cyan border-2 border-white/20 flex items-center justify-center gap-3 group">
                        <span className="material-symbols-rounded">rocket_launch</span>
                        RETURN TO PLAY GROUND
                    </button>
                </div>
            )}
        </div>
    );

    const RenderCeremony = () => (
        <div className="lg:col-span-6 h-full floating-card bg-white dark:bg-gray-800 rounded-[3rem] flex flex-col items-center justify-center p-8 relative overflow-hidden shadow-3d-orange border-4 border-yellow-200">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/confetti.png')] opacity-10"></div>
            <div className="text-center z-10 w-full max-w-4xl">
                <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-12 drop-shadow-sm tracking-tighter filter hover:brightness-110 transition-all cursor-default animate-bounce">VICTORY!</h1>
                <div className="flex items-end justify-center gap-4 md:gap-12 h-80 mb-12">
                    <div className="flex flex-col items-center animate-in slide-in-from-bottom duration-1000 delay-200 group">
                        <div className="text-5xl md:text-6xl mb-4 group-hover:-translate-y-2 transition-transform">🥈</div>
                        <div className="w-24 md:w-32 h-40 bg-gray-100 dark:bg-gray-700 rounded-t-3xl flex items-end justify-center pb-6 shadow-inner border-t-8 border-gray-300 relative">
                            <div className="font-black text-gray-500 dark:text-white text-sm md:text-lg absolute bottom-4 capitalize truncate px-2 w-full text-center">{sortedPlayers[1]?.username || sortedPlayers[1]?.uid?.slice(0, 6) || 'N/A'}</div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center z-10 animate-in slide-in-from-bottom duration-1000 group">
                        <div className="text-7xl md:text-8xl mb-4 animate-bounce group-hover:scale-110 transition-transform">👑</div>
                        <div className="w-32 md:w-40 h-64 bg-gradient-to-b from-yellow-300 to-yellow-400 rounded-t-3xl flex items-end justify-center pb-8 shadow-2xl border-t-8 border-yellow-200 relative overflow-hidden">
                            <div className="font-black text-yellow-900 text-lg md:text-2xl absolute bottom-6 capitalize truncate px-2 w-full text-center">{sortedPlayers[0]?.username || sortedPlayers[0]?.uid?.slice(0, 6) || 'Champion'}</div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center animate-in slide-in-from-bottom duration-1000 delay-500 group">
                        <div className="text-5xl md:text-6xl mb-4 group-hover:-translate-y-2 transition-transform">🥉</div>
                        <div className="w-24 md:w-32 h-32 bg-orange-100 dark:bg-orange-900 rounded-t-3xl flex items-end justify-center pb-5 shadow-inner border-t-8 border-orange-300 relative">
                            <div className="font-black text-orange-700 dark:text-white text-sm md:text-lg absolute bottom-4 capitalize truncate px-2 w-full text-center">{sortedPlayers[2]?.username || sortedPlayers[2]?.uid?.slice(0, 6) || 'N/A'}</div>
                        </div>
                    </div>
                </div>
                <button onClick={() => nav('/')} className="px-12 py-5 bg-gray-900 text-white font-black rounded-[2rem] hover:scale-105 transition shadow-3d-white hover:translate-y-[-4px] md:text-xl flex items-center justify-center gap-3 mx-auto">
                    <span className="material-symbols-rounded">sports_esports</span>
                    Return to Play Ground
                </button>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="text-center animate-pulse">
                    <div className="text-6xl mb-4">🚀</div>
                    <h2 className="text-xl font-black text-gray-500 mb-2">Entering Arena...</h2>
                </div>
            </div>
        );
    }

    if (!battle) {
        return (
            <div className="min-h-screen bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-8">
                {authLoading ? (
                    <div className="floating-card p-12 bg-white dark:bg-gray-800 rounded-[3rem] shadow-3d-cyan text-center border-4 border-white animate-pulse">
                        <div className="w-24 h-24 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-rounded text-5xl text-cyan-600 animate-spin">sync</span>
                        </div>
                        <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-2 uppercase tracking-tight">Syncing Profile...</h2>
                        <p className="text-gray-500 font-bold">Identifying your character</p>
                    </div>
                ) : (
                    <div className="floating-card p-12 bg-white dark:bg-gray-800 rounded-[3rem] shadow-3d-red text-center border-4 border-white animate-in zoom-in duration-500">
                        <div className="relative w-32 h-32 mx-auto mb-10">
                            <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-20"></div>
                            <div className="w-full h-full bg-red-50 dark:bg-red-900/30 rounded-full border-4 border-red-100 dark:border-red-800 flex items-center justify-center relative">
                                <span className="material-symbols-rounded text-6xl text-red-500 drop-shadow-md">satellite_alt</span>
                            </div>
                        </div>
                        <h1 className="text-5xl font-black text-gray-800 dark:text-white mb-4 uppercase tracking-tighter">Signal Lost</h1>
                        <p className="text-gray-500 dark:text-gray-300 font-bold text-xl mb-12 max-w-sm mx-auto leading-relaxed">
                            We couldn't locate that Battle or Catpool. It may have been deleted.
                        </p>
                        <button
                            onClick={() => nav('/')}
                            className="w-full py-5 bg-gray-900 text-white font-black rounded-2xl shadow-3d-white hover:bg-black transition-all flex items-center justify-center gap-3 group"
                        >
                            <span className="material-symbols-rounded group-hover:-translate-x-1 transition-transform">arrow_back</span>
                            RETURN TO BASE
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 flex flex-col">
            <h1 className="text-xl font-bold text-gray-500/50 mb-6 font-display uppercase tracking-[0.2em] text-center">
                Battle Arena <span className="text-gray-400">#{battle.code}</span>
            </h1>
            <div className="max-w-[1400px] mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {RenderRankings()}
                {showCeremony ? RenderCeremony() : RenderGameBoard()}
                {RenderStatus()}
            </div>

            {showGuestModal && (
                <GuestJoinModal
                    onJoin={(name, emoji) => handleJoin(name, emoji)}
                    onCancel={() => setShowGuestModal(false)}
                    isSyncing={hasJoinedLocally}
                />
            )}
        </div>
    );
};

export default BattleRoom;
