import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA83OSZye6bzZOZ5l7CHl-k4mHjqtHIgYA",
  authDomain: "rix-quiz.firebaseapp.com",
  projectId: "rix-quiz",
  storageBucket: "rix-quiz.firebasestorage.app",
  messagingSenderId: "425739108591",
  appId: "1:425739108591:web:4b06dfcc35c6ce2fa71b1a"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);