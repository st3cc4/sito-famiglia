import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configurazione Firebase del Portale
const firebaseConfig = {
    apiKey: "AIzaSyD-YOUR-API-KEY",
    authDomain: "sito-famiglia.firebaseapp.com",
    projectId: "sito-famiglia",
    storageBucket: "sito-famiglia.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef123456"
};

// Inizializza solo la configurazione base e il database Firestore
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
