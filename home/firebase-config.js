// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// TODO: Sostituisci con i dati reali del tuo progetto Firebase (che trovi nella console di Firebase)
const firebaseConfig = {
  apiKey: "IL_TUO_API_KEY",
  authDomain: "IL_TUO_AUTH_DOMAIN",
  projectId: "IL_TUO_PROJECT_ID",
  storageBucket: "IL_TUO_STORAGE_BUCKET",
  messagingSenderId: "IL_TUO_MESSAGING_SENDER_ID",
  appId: "IL_TUO_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
