// Replace with your real config from Firebase project settings
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDwdBlUgppuQzTOrGy3dLcgwDW3Bqx_32g",
    authDomain: "notebook-chat-room.firebaseapp.com",
    projectId: "notebook-chat-room",
    storageBucket: "notebook-chat-room.firebasestorage.app",
    messagingSenderId: "396742511625",
    appId: "1:396742511625:web:96d6e6829da954bdc73cd8",
    measurementId: "G-5XPTR6WC0K"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
