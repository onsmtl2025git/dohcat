import { doc, getDoc, setDoc, updateDoc, increment, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";

export const createUserProfile = async (uid, isAnonymous = true, extraData = {}) => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        const newProfile = {
            uid,
            isAnonymous,
            username: extraData.username || (isAnonymous ? 'Guest Explorer' : 'New Kid'),
            email: extraData.email || 'N/A',
            role: extraData.role || 'Kid',
            level: 1,
            xp: 0,
            coins: 0,
            emojis: ['🐱'], // Starter emoji
            createdAt: new Date(),
            ...extraData // Allow overriding any field
        };
        await setDoc(userRef, newProfile);
        return newProfile;
    }

    return userSnap.data();
};

export const addCoins = async (uid, amount) => {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
        coins: increment(amount)
    });
};

export const unlockEmoji = async (uid, emoji, cost) => {
    const userRef = doc(db, "users", uid);
    // Use a transaction or simpler update for MVP.
    // Checking balance before calling this is ideal in UI, but rule enforcement here is better.
    // For MVP, assuming UI checks balance.
    await updateDoc(userRef, {
        coins: increment(-cost),
        emojis: arrayUnion(emoji)
    });
};

export const getUserProfile = async (uid) => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        return userSnap.data();
    }
    return null;
};
