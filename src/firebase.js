// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCIaaXlXlo7-A7lC5siJWMinT29ycocW4o",
    authDomain: "catpools-3d8de.firebaseapp.com",
    projectId: "catpools-3d8de",
    storageBucket: "catpools-3d8de.firebasestorage.app",
    messagingSenderId: "40247053296",
    appId: "1:40247053296:web:543eec240bdcc65887eb35",
    measurementId: "G-RE9XLQDBDB",
    databaseURL: "https://catpools-3d8de-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

export default app;
