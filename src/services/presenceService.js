import { ref, set, onDisconnect, remove, update, runTransaction } from "firebase/database";
import { rtdb } from "../firebase";

/**
 * Marks a player as online in the Realtime Database 'sidecar'.
 * Uses onDisconnect().remove() to ensure they vanish if they close the tab.
 */
export const setPlayerOnline = async (battleId, player) => {
    if (!battleId || !player?.uid) return;

    const userStatusRef = ref(rtdb, `battles/${battleId}/online/${player.uid}`);

    // 1. Setup automatic removal on disconnect
    onDisconnect(userStatusRef).remove();

    // 2. Set current status
    // We mirror essential UI data: Name, Emoji/Avatar, isGuest, and Score
    const statusData = {
        uid: player.uid,
        username: player.username || 'Explorer',
        emoji: player.emoji || (player.emojis?.[0]) || '🐱',
        isGuest: !!player.isGuest,
        score: player.score || 0,
        lastActive: Date.now()
    };

    await set(userStatusRef, statusData);

    // Return a cleanup function
    return () => remove(userStatusRef);
};

/**
 * Updates a player's score in the RTDB sidecar using runTransaction to prevent overwrites.
 * Accepts pointsToAdd (delta) for atomic increments.
 */
export const updatePlayerScoreRTDB = async (battleId, uid, pointsToAdd) => {
    if (!battleId || !uid) return;
    const scoreRef = ref(rtdb, `battles/${battleId}/online/${uid}/score`);
    const lastActiveRef = ref(rtdb, `battles/${battleId}/online/${uid}/lastActive`);

    // 1. Update Score Atomically
    await runTransaction(scoreRef, (currentScore) => {
        return (currentScore || 0) + pointsToAdd;
    });

    // 2. Update Timestamp
    await set(lastActiveRef, Date.now());
};

/**
 * Manually removes a player from the online list.
 */
export const removePlayerOnline = async (battleId, uid) => {
    if (!battleId || !uid) return;
    const userStatusRef = ref(rtdb, `battles/${battleId}/online/${uid}`);
    await remove(userStatusRef);
};
