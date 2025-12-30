import {
    collection,
    addDoc,
    doc,
    updateDoc,
    onSnapshot,
    arrayUnion
} from "firebase/firestore";
import { db } from "../firebase";

// Generate a random 6-character code
const generateBattleCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createBattle = async (hostProfile) => {
    const battleCode = generateBattleCode();

    const newBattle = {
        code: battleCode,
        hostId: hostProfile.uid,
        status: 'lobby', // lobby, active, finished
        players: [{
            uid: hostProfile.uid,
            level: hostProfile.level,
            emoji: hostProfile.emojis[0],
            score: 0
        }],
        createdAt: new Date()
    };

    const docRef = await addDoc(collection(db, "battles"), newBattle);
    return { id: docRef.id, ...newBattle };
};

export const joinBattle = async (battleId, userProfile) => {
    const battleRef = doc(db, "battles", battleId);

    await updateDoc(battleRef, {
        players: arrayUnion({
            uid: userProfile.uid,
            level: userProfile.level,
            emoji: userProfile.emojis[0],
            score: 0
        })
    });
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

// Helper to find battle ID by Code (since users might type the code)
// In a real app, you'd query for where('code', '==', inputCode)
// For this demo, we might skip implementation or assume direct direct linking for now to save time
// unless requested.
