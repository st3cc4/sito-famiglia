import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAtMnKhhfC43J73kVm8-QcNghqzOTV6UKA",
    authDomain: "sito-famiglia.firebaseapp.com",
    projectId: "sito-famiglia",
    storageBucket: "sito-famiglia.appspot.com",
    messagingSenderId: "93216467751",
    appId: "1:93216467751:web:9930052845521ca5ef895a",
    measurementId: "G-NYRQJDTWM3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');
    const errorMsg = document.getElementById('error-msg');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pwdInserita = passwordInput.value.trim();
        errorMsg.style.display = 'none';

        try {
            const utentiSnapshot = await getDocs(collection(db, "utenti"));
            let utenteTrovato = null;

            utentiSnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if (data.password === pwdInserita) {
                    utenteTrovato = { id: docSnap.id, ...data };
                }
            });

            if (utenteTrovato) {
                localStorage.setItem('famiglia_pwa_user', JSON.stringify(utenteTrovato));
                window.location.href = '../home/home.html';
            } else {
                errorMsg.style.display = 'block';
            }

        } catch (err) {
            console.error("Errore durante il login:", err);
            errorMsg.textContent = "Errore di connessione. Riprova.";
            errorMsg.style.display = 'block';
        }
    });
});
