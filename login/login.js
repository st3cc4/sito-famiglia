// Importazione dei moduli Firebase SDK v9+
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configurazione Firebase dal tuo progetto
const firebaseConfig = {
    apiKey: "AIzaSyAtMnKhhfC43J73kVm8-QcNghqzOTV6UKA",
    authDomain: "sito-famiglia.firebaseapp.com",
    projectId: "sito-famiglia",
    storageBucket: "sito-famiglia.firebasestorage.app",
    messagingSenderId: "932164677551",
    appId: "1:932164677551:web:9930052845521ca5ef895a",
    measurementId: "G-NYRQDTWM3"
};

// Inizializzazione Firebase e Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Elementi DOM
const loginForm = document.getElementById('login-form');
const usernameSelect = document.getElementById('username');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('toggle-password');
const eyeIcon = document.getElementById('eye-icon');
const rememberMeCheckbox = document.getElementById('remember-me');
const loginError = document.getElementById('login-error');

// --- 1. Controllo Accesso Automatico all'avvio ---
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('famiglia_pwa_user');
    if (savedUser) {
        // Se c'è un utente salvato, vai direttamente alla HOME
        window.location.href = 'home.html';
    }
});

// --- 2. Mostra / Nascondi Password ---
togglePasswordBtn.addEventListener('click', () => {
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
});

// --- 3. Gestione Submit del Form di Login ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';

    const selectedName = usernameSelect.value;
    const enteredPassword = passwordInput.value.trim();

    if (!selectedName || !enteredPassword) {
        loginError.textContent = 'Seleziona un nome e inserisci la password.';
        return;
    }

    try {
        // Ricerca dell'utente nella collezione "utenti" dove nome è uguale a quello selezionato
        const utentiRef = collection(db, "utenti");
        const q = query(utentiRef, where("nome", "==", selectedName));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            loginError.textContent = 'Utente non trovato nel database.';
            return;
        }

        let userFound = false;
        let userData = null;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.password === enteredPassword) {
                userFound = true;
                userData = {
                    id: doc.id,
                    nome: data.nome,
                    colore: data.colore || "#2c3e50",
                    permessi: data.permessi || {},
                    ruolo: data.ruolo || "utente"
                };
            }
        });

        if (userFound) {
            // Salviamo i dati dell'utente per la sessione corrente o permanente
            if (rememberMeCheckbox.checked) {
                localStorage.setItem('famiglia_pwa_user', JSON.stringify(userData));
            } else {
                sessionStorage.setItem('famiglia_pwa_user', JSON.stringify(userData));
            }

            // Reindirizzamento alla schermata HOME (Cornice)
            window.location.href = 'home.html';
        } else {
            loginError.textContent = 'Password errata. Riprova.';
        }

    } catch (error) {
        console.error("Errore durante il login:", error);
        loginError.textContent = 'Si è verificato un errore di connessione.';
    }
});
