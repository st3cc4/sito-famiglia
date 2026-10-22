import { db } from '../home/firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const rememberMeCheckbox = document.getElementById('remember-me');
const errorMsg = document.getElementById('error-msg');
const togglePasswordBtn = document.getElementById('toggle-password');
const eyeIcon = document.getElementById('eye-icon');

// 1. Controllo all'avvio: se l'utente aveva scelto "Ricordami", effettua l'accesso automatico
window.addEventListener('DOMContentLoaded', () => {
    const savedSession = localStorage.getItem('famiglia_session');
    if (savedSession) {
        try {
            const userData = JSON.parse(savedSession);
            if (userData && userData.nome) {
                // Reindirizzamento automatico alla home
                window.location.href = '../home.html';
                return;
            }
        } catch (e) {
            localStorage.removeItem('famiglia_session');
        }
    }
});

// 2. Gestione Mostra/Nascondi Password
togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    if (type === 'text') {
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
});

// 3. Gestione invio form di login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const usernameVal = usernameInput.value.trim();
    const passwordVal = passwordInput.value.trim();

    errorMsg.style.display = 'none';

    try {
        // Formatta la prima lettera maiuscola per coincidere con l'ID del documento su Firestore (es. "Paolo")
        const docId = usernameVal.charAt(0).toUpperCase() + usernameVal.slice(1).toLowerCase();
        const userRef = doc(db, "utenti", docId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            
            // Verifica della password
            if (userData.password === passwordVal) {
                const sessionData = {
                    nome: userData.nome,
                    ruolo: userData.ruolo,
                    permessi: userData.permessi
                };

                // Se "Ricordami" è spuntato, salviamo in localStorage per i prossimi accessi
                if (rememberMeCheckbox.checked) {
                    localStorage.setItem('famiglia_session', JSON.stringify(sessionData));
                } else {
                    // Altrimenti salviamo solo per la sessione corrente del browser (sessionStorage)
                    sessionStorage.setItem('famiglia_session', JSON.stringify(sessionData));
                }

                // Vai alla home
                window.location.href = '../home.html';
            } else {
                errorMsg.textContent = "Password errata. Riprova.";
                errorMsg.style.display = 'block';
            }
        } else {
            errorMsg.textContent = "Utente non trovato.";
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        console.error("Errore di accesso:", error);
        errorMsg.textContent = "Errore di connessione al database.";
        errorMsg.style.display = 'block';
    }
});
