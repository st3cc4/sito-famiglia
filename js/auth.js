// js/auth.js - Gestione Autenticazione, Login e Sessione Utente

import { db } from "./firebase-config.js";
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let utenteCorrente = null;

export function getUtenteCorrente() {
    return utenteCorrente;
}

export function initAuth() {
    const formLogin = document.getElementById('form-login');
    const btnTogglePassword = document.getElementById('btn-toggle-password');
    const btnLogoutHeader = document.getElementById('btn-logout-header');
    const sidebarUserCard = document.getElementById('sidebar-user-card');

    if (btnTogglePassword) {
        btnTogglePassword.addEventListener('click', () => {
            const pwdInput = document.getElementById('login-password');
            if (pwdInput) {
                if (pwdInput.type === 'password') {
                    pwdInput.type = 'text';
                    btnTogglePassword.textContent = '🙈';
                } else {
                    pwdInput.type = 'password';
                    btnTogglePassword.textContent = '👁️';
                }
            }
        });
    }

    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            await eseguiLogin();
        });
    }

    if (btnLogoutHeader) {
        btnLogoutHeader.addEventListener('click', eseguiLogout);
    }

    if (sidebarUserCard) {
        sidebarUserCard.addEventListener('click', eseguiLogout);
    }

    verificaSessioneSalvata();
}

async function eseguiLogin() {
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const rememberCheckbox = document.getElementById('login-remember');
    const loginError = document.getElementById('login-error');

    if (!usernameInput || !passwordInput) return;

    const username = usernameInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (loginError) loginError.textContent = '';

    try {
        const querySnapshot = await getDocs(collection(db, "utenti"));
        let utenteTrovato = null;

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.nome && data.nome.toLowerCase() === username && data.password === password) {
                utenteTrovato = {
                    id: docSnap.id,
                    ...data
                };
            }
        });

        if (utenteTrovato) {
            utenteCorrente = utenteTrovato;

            if (rememberCheckbox && rememberCheckbox.checked) {
                localStorage.setItem('sito_famiglia_user', JSON.stringify(utenteCorrente));
            } else {
                sessionStorage.setItem('sito_famiglia_user', JSON.stringify(utenteCorrente));
            }

            aggiornaInterfacciaUtente();
            mostraSchermataApp();
        } else {
            if (loginError) {
                loginError.textContent = "Nome utente o password non corretti.";
            }
        }
    } catch (err) {
        console.error("Errore durante il login:", err);
        if (loginError) {
            loginError.textContent = "Errore di connessione durante il login.";
        }
    }
}

function verificaSessioneSalvata() {
    const userLocal = localStorage.getItem('sito_famiglia_user');
    const userSession = sessionStorage.getItem('sito_famiglia_user');

    if (userLocal) {
        utenteCorrente = JSON.parse(userLocal);
        aggiornaInterfacciaUtente();
        mostraSchermataApp();
    } else if (userSession) {
        utenteCorrente = JSON.parse(userSession);
        aggiornaInterfacciaUtente();
        mostraSchermataApp();
    } else {
        mostraSchermataLogin();
    }
}

function aggiornaInterfacciaUtente() {
    if (!utenteCorrente) return;

    const userGreeting = document.getElementById('user-greeting');
    const sidebarUserName = document.getElementById('sidebar-user-name');
    const sidebarUserRole = document.getElementById('sidebar-user-role');
    const btnAdminPanel = document.getElementById('btn-admin-panel');

    if (userGreeting) userGreeting.textContent = `Ciao ${utenteCorrente.nome}`;
    if (sidebarUserName) sidebarUserName.textContent = utenteCorrente.nome;
    if (sidebarUserRole) {
        sidebarUserRole.textContent = utenteCorrente.ruolo ? utenteCorrente.ruolo.toUpperCase() : 'UTENTE';
    }

    if (btnAdminPanel) {
        if (utenteCorrente.ruolo === 'admin') {
            btnAdminPanel.classList.remove('hidden');
        } else {
            btnAdminPanel.classList.add('hidden');
        }
    }

    // Applica colore utente personalizzato all'header
    const appHeader = document.querySelector('.app-header');
    if (appHeader && utenteCorrente.colore) {
        appHeader.style.backgroundColor = utenteCorrente.colore;
    }
}

function mostraSchermataApp() {
    const loginScreen = document.getElementById('login-screen');
    const appContainer = document.getElementById('app-container');

    if (loginScreen) loginScreen.classList.add('hidden');
    if (appContainer) appContainer.classList.remove('hidden');
}

function mostraSchermataLogin() {
    const loginScreen = document.getElementById('login-screen');
    const appContainer = document.getElementById('app-container');

    if (loginScreen) loginScreen.classList.remove('hidden');
    if (appContainer) appContainer.classList.add('hidden');
}

export function eseguiLogout() {
    if (confirm("Vuoi davvero uscire dall'applicazione?")) {
        utenteCorrente = null;
        localStorage.removeItem('sito_famiglia_user');
        sessionStorage.removeItem('sito_famiglia_user');
        mostraSchermataLogin();
    }
}
