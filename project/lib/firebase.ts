import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDYFg_pLi9-NZBO7scfcFeWwnFgnS28FPk",
  authDomain: "job-tracker-59f3f.firebaseapp.com",
  projectId: "job-tracker-59f3f",
  storageBucket: "job-tracker-59f3f.firebasestorage.app",
  messagingSenderId: "440347402900",
  appId: "1:440347402900:web:01979575eff38560258a81",
  measurementId: "G-6E9PNCNKK5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;
