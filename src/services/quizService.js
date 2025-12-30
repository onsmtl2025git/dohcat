import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";

export const subscribeToQuizzes = (callback) => {
    const q = query(collection(db, "quizzes"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        const quizzes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(quizzes);
    });
};

export const createQuiz = async (quizData, userId) => {
    const newQuiz = {
        ...quizData,
        creatorId: userId,
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
