import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    query,
    orderBy,
    increment,
    serverTimestamp,
    limit,
    deleteDoc
} from "firebase/firestore";
import { db } from "../firebase";

export const createPost = async (title, content, user) => {
    const newPost = {
        title,
        content,
        authorId: user.uid,
        authorName: user.email?.split('@')[0] || 'User', // Simple name derivation
        authorEmoji: user.emojis?.[0] || '🐱',
        createdAt: serverTimestamp(),
        likes: 0,
        commentCount: 0,
        views: 0
    };
    const docRef = await addDoc(collection(db, "posts"), newPost);
    return { id: docRef.id, ...newPost };
};

export const getPosts = async () => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getHotTopics = async () => {
    const q = query(collection(db, "posts"), orderBy("commentCount", "desc"), limit(3));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addComment = async (postId, content, user) => {
    const comment = {
        postId,
        content,
        authorId: user.uid,
        authorName: user.email?.split('@')[0],
        authorEmoji: user.emojis?.[0],
        createdAt: new Date()
    };

    // Add comment to subcollection
    await addDoc(collection(db, "posts", postId, "comments"), comment);

    // Update post stats
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
        commentCount: increment(1)
    });
};

export const deletePost = async (postId) => {
    // In real app, also delete subcollection 'comments' (requires cloud function or batch)
    // For MVP, just delete the doc
    await deleteDoc(doc(db, "posts", postId));
};
