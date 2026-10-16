// js/firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAtMnKhhfC43J73kVm8-QcNghqzOTV6UKA",
  authDomain: "sito-famiglia.firebaseapp.com",
  projectId: "sito-famiglia",
  storageBucket: "sito-famiglia.firebasestorage.app",
  messagingSenderId: "932164677551",
  appId: "1:932164677551:web:9930052845521ca5ef895a",
  measurementId: "G-NYRQJDTWM3"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
