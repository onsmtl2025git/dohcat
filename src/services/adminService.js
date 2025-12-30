import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export const getAllUsers = async () => {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getAllBattles = async () => {
    const snap = await getDocs(collection(db, "battles"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getAllQuizzes = async () => {
    const snap = await getDocs(collection(db, "quizzes"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const deleteItem = async (collectionName, id) => {
    await deleteDoc(doc(db, collectionName, id));
};

export const updateItem = async (collectionName, id, data) => {
    await updateDoc(doc(db, collectionName, id), data);
};

export const getAllPosts = async () => {
    const snap = await getDocs(collection(db, "posts"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
