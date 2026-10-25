import { db } from '../home/firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const rememberMeCheckbox = document.getElementById('remember-me');
const errorMsg = document.getElementById('error-msg');
const togglePasswordBtn = document.getElementById('toggle-password');
const eyeIcon = document.getElementById('eye-icon');

// Controllo sessione all'avvio: reindirizza solo se c'è una sessione attiva valida
window.addEventListener('DOMContentLoaded', () => {
    const savedSession = localStorage.getItem('famiglia_session') || sessionStorage.getItem('famiglia_session');
    if (savedSession) {
        try {
            const userData = JSON.parse(savedSession);
            if (userData && userData.nome) {
                window.location.replace('./home.html');
            }
        } catch (e) {
            localStorage.removeItem('famiglia_session');
            sessionStorage.removeItem('famiglia_session');
        }
    }
});

// Mostra o nascondi la password
if (togglePasswordBtn) {
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
}

// Gestione invio modulo di login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const usernameVal = usernameInput.value.trim();
        const passwordVal = passwordInput.value.trim();

        if (errorMsg) errorMsg.style.display = 'none';

        if (!usernameVal || !passwordVal) {
            if (errorMsg) {
                errorMsg.textContent = "Inserisci nome utente e password.";
                errorMsg.style.display = 'block';
            }
            return;
        }

        try {
            // Converte l'input in minuscolo per trovare correttamente l'ID del documento su Firestore (es. "elena")
            const docId = usernameVal.toLowerCase();
            const userRef = doc(db, "utenti", docId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                
                if (userData.password === passwordVal) {
                    const sessionData = {
                        nome: userData.nome || usernameVal,
                        ruolo: userData.ruolo || 'user',
                        permessi: userData.permessi || {},
                        colore: userData.colore || '#3498db'
                    };

                    // Se "Ricordami" è spuntato salva in localStorage, altrimenti in sessionStorage
                    if (rememberMeCheckbox && rememberMeCheckbox.checked) {
                        localStorage.setItem('famiglia_session', JSON.stringify(sessionData));
                    } else {
                        sessionStorage.setItem('famiglia_session', JSON.stringify(sessionData));
                    }

                    // Vai alla home
                    window.location.replace('./home.html');
                } else {
                    if (errorMsg) {
                        errorMsg.textContent = "Password errata. Riprova.";
                        errorMsg.style.display = 'block';
                    }
                }
            } else {
                if (errorMsg) {
                    errorMsg.textContent = `Utente "${usernameVal}" non trovato nel database.`;
                    errorMsg.style.display = 'block';
                }
            }
        } catch (error) {
            console.error("Errore di accesso:", error);
            if (errorMsg) {
                errorMsg.textContent = "Errore di connessione: " + error.message;
                errorMsg.style.display = 'block';
            }
        }
    });
}
