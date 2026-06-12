import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "travelsphere-ai-46777.firebaseapp.com",
  projectId: "travelsphere-ai-46777",
  storageBucket: "travelsphere-ai-46777.firebasestorage.app",
  messagingSenderId: "270918321085",
  appId: "1:270918321085:web:46a7a0084640af14bc88d4",
  measurementId: "G-EELD883WQ0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth
export const auth = getAuth(app);

export default app;
