import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export const getChildStats = async (uid) => {
    // For MVP, since we don't have separate parent/child accounts linked yet,
    // we will fetch the current user's data to simulate the "Child View".
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
    }
    return null;
};

export const linkChild = async (joinCode) => {
    // Stub for future implementation
    console.log("Linking child with code:", joinCode);
    return true;
};
