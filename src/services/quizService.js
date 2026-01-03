import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    onSnapshot,
    where,
    doc,
    getDoc
} from "firebase/firestore";
import { db } from "../firebase";

export const findQuizByBattleCode = async (code) => {
    const q = query(collection(db, "quizzes"), where("battleCode", "==", code));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    }
    return null;
    return null;
};

// Find quiz by direct ID
export const findQuizById = async (id) => {
    const docRef = doc(db, "quizzes", id);
    const snapshot = await getDocs(query(collection(db, "quizzes"), where("__name__", "==", id)));
    // Firestore getDoc is better for single ID, but sticking to existing pattern if possible.
    // Actually getDoc is standard. Let's use getDoc.
    // wait, I need to import doc and getDoc if not already. They are imported.
    const fromGetDoc = await import("firebase/firestore").then(mod => mod.getDoc(docRef));
    if (fromGetDoc.exists()) {
        return { id: fromGetDoc.id, ...fromGetDoc.data() };
    }
    return null;
};

export const subscribeToQuizzes = (callback) => {
    const q = query(collection(db, "quizzes"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        const quizzes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(quizzes);
    });
};

export const createQuiz = async (quizData, userId) => {
    // 1. Generate a UNIQUE persistent 6-digit numeric code 
    let battleCode = '';
    let isUnique = false;
    while (!isUnique) {
        battleCode = Math.floor(100000 + Math.random() * 900000).toString();
        const existing = await findQuizByBattleCode(battleCode);
        if (!existing) isUnique = true;
    }

    const newQuiz = {
        ...quizData,
        creatorId: userId,
        battleCode,
        createdAt: new Date(),
        plays: 0,
        likes: 0
    };

    const docRef = await addDoc(collection(db, "quizzes"), newQuiz);
    return { id: docRef.id, ...newQuiz };
};

export const getAllQuizzes = async () => {
    // For now, get all quizzes. In future, maybe paginate or filter.
    const q = query(collection(db, "quizzes"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
