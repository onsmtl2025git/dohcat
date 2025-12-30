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
    setDoc
} from "firebase/firestore";
import { db } from "../firebase";

// Generate a random 6-digit numeric code
const generateBattleCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
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

// Find battle ID by its 6-character Code
export const findBattleByCode = async (code) => {
    const q = query(collection(db, "battles"), where("code", "==", code.toUpperCase()));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    }
    return null;
};

// Ensure a battle exists for a quiz, or create one with the persistent code
export const ensureBattleForQuiz = async (quiz, hostProfile) => {
    // Fallback if quiz is missing persistent code (older records), assign a new numeric one
    const codeToUse = quiz.battleCode || generateBattleCode();

    // Check if battle with this code already exists
    const existing = await findBattleByCode(codeToUse);
    if (existing) return existing;

    // Create a new one
    const newBattle = {
        code: codeToUse,
        quizId: quiz.id || 'none',
        hostId: hostProfile.uid,
        status: 'lobby',
        players: [{
            uid: hostProfile.uid,
            level: hostProfile.level || 1,
            emoji: hostProfile.emojis?.[0] || '🐱',
            score: 0
        }],
        createdAt: new Date()
    };

    const docRef = await addDoc(collection(db, "battles"), newBattle);
    return { id: docRef.id, ...newBattle };
};
