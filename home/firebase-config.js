// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyAtMnKhhfC43J73KvM8-QcNghqzOTV6UKA",
  authDomain: "sito-famiglia.firebaseapp.com",
  projectId: "sito-famiglia",
  storageBucket: "sito-famiglia.appspot.com",
  messagingSenderId: "93216467751",
  appId: "1:93216467751:web:9930052845521ca5ef895a",
  measurementId: "G-NYRQJDTWM3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
