import {
    collection,
    addDoc,
    doc,
    updateDoc,
    onSnapshot,
    arrayUnion,
    getDocs,
    query,
    where,
    setDoc,
    getDoc,
    runTransaction
} from "firebase/firestore";
import { db, rtdb } from "../firebase";
import { updatePlayerScoreRTDB } from "./presenceService";
import { ref, remove } from "firebase/database";

// Generate a random 6-digit numeric code
const generateBattleCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Centralized player object creator to ensure consistency
const createPlayerObj = (profile, score = 0, isSpectator = false) => ({
    uid: profile.uid,
    username: profile.username || (profile.isAnonymous ? 'Guest Explorer' : 'Explorer'),
    level: profile.level || 1,
    emoji: profile.emojis?.[0] || '🐱',
    score: score,
    isGuest: !!profile.isAnonymous,
    isSpectator: isSpectator,
    lastActive: Date.now()
});

export const createBattle = async (hostProfile) => {
    const battleCode = generateBattleCode();

    const newBattle = {
        code: battleCode,
        hostId: hostProfile.uid,
        status: 'lobby', // lobby, active, finished
        players: [createPlayerObj(hostProfile)],
        playerLimit: 50, // Default limit
        createdAt: new Date()
    };

    const docRef = await addDoc(collection(db, "battles"), newBattle);
    return { id: docRef.id, ...newBattle };
};

export const updateBattle = async (battleId, updates) => {
    const battleRef = doc(db, "battles", battleId);
    await updateDoc(battleRef, updates);
};

export const joinBattle = async (battleId, userProfile, isSpectator = false) => {
    if (!userProfile?.uid) return { success: false, error: 'Invalid profile' };
    const battleRef = doc(db, "battles", battleId);

    try {
        const result = await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(battleRef);
            if (!snap.exists()) throw new Error("Battle not found");

            const data = snap.data();
            const players = data.players || [];
            const limit = data.playerLimit || 50;

            // Check if already in
            const alreadyIn = players.some(p => p.uid === userProfile.uid);
            if (alreadyIn) return { success: true, alreadyIn: true };

            // Check if full (spectators don't count toward limit)
            const nonSpectatorCount = players.filter(p => !p.isSpectator).length;
            if (!isSpectator && nonSpectatorCount >= limit) {
                return { success: false, error: 'Battle is full!' };
            }

            const newPlayer = createPlayerObj(userProfile, 0, isSpectator);
            transaction.update(battleRef, {
                players: arrayUnion(newPlayer)
            });

            return { success: true };
        });
        return result;
    } catch (e) {
        console.error("Join transaction failed:", e);
        return { success: false, error: e.message };
    }
};

export const submitAnswer = async (battleId, userId, optionIndex, isCorrect) => {
    const battleRef = doc(db, "battles", battleId);

    const snap = await getDoc(battleRef);
    if (snap.exists()) {
        const data = snap.data();
        const players = data.players || [];

        // Check if user is a spectator
        const player = players.find(p => p.uid === userId);
        const isSpectator = player?.isSpectator || false;

        // Skip stat updates for spectators
        let statsUpdate = {};
        if (!isSpectator) {
            const stats = data.stats || [0, 0, 0, 0];
            const newStats = [...stats];
            newStats[optionIndex] = (newStats[optionIndex] || 0) + 1;
            statsUpdate = { stats: newStats };
        }

        // Update player score in the array
        const newPlayers = players.map(p => {
            if (p.uid === userId && isCorrect && !p.isSpectator) {
                return { ...p, score: (p.score || 0) + 100 };
            }
            return p;
        });

        // 1. ALWAYS Update Live Leaderboard (RTDB) - Critical for Game State
        if (isCorrect && !isSpectator) {
            // Run this in parallel/independent of Firestore
            updatePlayerScoreRTDB(battleId, userId, 100).catch(err =>
                console.error("RTDB Score update failed:", err)
            );
        }

        // 2. Update Permanent History & Stats (Firestore)
        try {
            await updateDoc(battleRef, {
                ...statsUpdate,
                players: newPlayers
            });
        } catch (error) {
            console.warn("Firestore stat update failed (likely guest permissions):", error);
            // Non-blocking failure - game continues
        }
    }
};

export const subscribeToBattle = (battleId, callback) => {
    return onSnapshot(doc(db, "battles", battleId), (doc) => {
        if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() });
        } else {
            callback(null);
        }
    });
};

// Find battle ID by its 6-character Code
export const findBattleByCode = async (code) => {
    const q = query(collection(db, "battles"), where("code", "==", code.toString()));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        const d = snapshot.docs[0];
        return { id: d.id, ...d.data() };
    }
    return null;
};

// Forcefully reset a battle to its lobby state with only the host
export const resetBattle = async (battleId, hostProfile) => {
    const battleRef = doc(db, "battles", battleId);
    const resetData = {
        status: 'lobby',
        currentQuestionIndex: 0,
        players: [createPlayerObj(hostProfile)],
        playerLimit: 50,
        stats: [0, 0, 0, 0],
        createdAt: new Date() // Refresh timestamp
    };
    await updateDoc(battleRef, resetData);

    // Reset RTDB Sidecar
    const onlineRef = ref(rtdb, `battles/${battleId}/online`);
    await remove(onlineRef);

    return { id: battleId, ...resetData };
};

// Ensure a battle exists for a quiz, or create one with the persistent code
export const ensureBattleForQuiz = async (quiz, hostProfile) => {
    // PRIVACY-BASED HOSTING: Check if user is authorized to host
    const isPrivate = quiz.isPublic === false;
    const isCreator = quiz.authorId === hostProfile.uid;

    if (isPrivate && !isCreator) {
        throw new Error('Only the creator can host private quizzes');
    }

    // 1. ALWAYS use the persistent code from the quiz
    const codeToUse = quiz.battleCode || Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Use a deterministic ID for the active battle of this quiz
    const battleId = `active_${quiz.id}`;
    const battleRef = doc(db, "battles", battleId);
    const snap = await getDoc(battleRef);

    if (snap.exists()) {
        const data = snap.data();

        // STALE BATTLE CLEANUP: If battle is older than 4 hours, reset it
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
        const createdAt = data.createdAt?.toDate() || new Date(0);

        if (data.status !== 'finished' && createdAt > fourHoursAgo) {
            // For public quizzes: allow dynamic host takeover if current host left
            if (!isPrivate && !data.players?.some(p => p.uid === data.hostId)) {
                await updateDoc(battleRef, { hostId: hostProfile.uid });
                return { id: snap.id, ...data, hostId: hostProfile.uid };
            }
            return { id: snap.id, ...data };
        }

        // If finished OR stale, reset for a new session
        return await resetBattle(battleId, hostProfile);
    }

    // Create or Reset active battle doc
    const newBattle = {
        code: codeToUse,
        quizId: quiz.id || 'none',
        hostId: hostProfile.uid,
        status: 'lobby',
        currentQuestionIndex: 0,
        players: [createPlayerObj(hostProfile)],
        playerLimit: 50, // Default limit
        stats: [0, 0, 0, 0],
        createdAt: new Date()
    };

    await setDoc(battleRef, newBattle);
    return { id: battleId, ...newBattle };
};

// Finalize rewards at the end of a battle
// Marks the boundary between temporary session play and permanent account growth
export const finalizeBattleRewards = async (battleId) => {
    const battleRef = doc(db, "battles", battleId);
    const snap = await getDoc(battleRef);

    if (snap.exists()) {
        const data = snap.data();
        const players = data.players || [];

        // Distribute rewards using an optimistic parallel approach
        const rewardPromises = players.map(async (player) => {
            if (player.isGuest === false && (player.score || 0) > 0) {
                const userRef = doc(db, "users", player.uid);
                try {
                    await updateDoc(userRef, {
                        coins: increment(Math.floor(player.score / 10)), // 10% of score reward
                        xp: increment(player.score) // 1:1 XP reward
                    });
                } catch (err) {
                    console.error(`Failed to reward user ${player.uid}:`, err);
                }
            }
        });

        await Promise.all(rewardPromises);
    }
};

// Refresh a player's lastActive timestamp to avoid being flagged as a "Ghost"
export const updatePlayerHeartbeat = async (battleId, uid) => {
    const battleRef = doc(db, "battles", battleId);
    try {
        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(battleRef);
            if (!snap.exists()) return;

            const data = snap.data();
            const players = data.players || [];
            let changed = false;

            const newPlayers = players.map(p => {
                if (p.uid === uid) {
                    changed = true;
                    return { ...p, lastActive: Date.now() };
                }
                return p;
            });

            if (changed) {
                transaction.update(battleRef, { players: newPlayers });
            }
        });
    } catch (e) {
        console.error("Heartbeat update failed:", e);
    }
};
