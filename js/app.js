// js/app.js - File principale e gestione avvio/login

import { db } from "./firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { initNavigation } from "./navigation.js";
import { initImpegni } from "./impegni.js";
import { initScadenze } from "./scadenze.js";
import { initRicette } from "./ricette.js";
import { initMedia } from "./media.js";

let utenteCorrente = null;

export function getUtenteCorrente() {
    return utenteCorrente;
}

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    const formLogin = document.getElementById('form-login');
    const btnTogglePassword = document.getElementById('btn-toggle-password');
    const inputPassword = document.getElementById('login-password');
    const btnLogoutHeader = document.getElementById('btn-logout-header');
    const sidebarUserCard = document.getElementById('sidebar-user-card');

    // Toggle visibilità password
    if (btnTogglePassword && inputPassword) {
        btnTogglePassword.addEventListener('click', () => {
            const isPassword = inputPassword.type === 'password';
            inputPassword.type = isPassword ? 'text' : 'password';
            btnTogglePassword.textContent = isPassword ? '🙈' : '👁️';
        });
    }

    // Gestione Form Login
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('login-username');
            const passwordInput = document.getElementById('login-password');
            const rememberCheckbox = document.getElementById('login-remember');
            const loginError = document.getElementById('login-error');

            if (loginError) loginError.textContent = "";

            const username = usernameInput ? usernameInput.value.trim() : "";
            const password = passwordInput ? passwordInput.value.trim() : "";

            try {
                const q = query(collection(db, "utenti"), where("username", "==", username));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    if (loginError) loginError.textContent = "Utente non trovato.";
                    return;
                }

                let utenteTrovato = null;
                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    if (data.password === password) {
                        utenteTrovato = { id: docSnap.id, ...data };
                    }
                });

                if (!utenteTrovato) {
                    if (loginError) loginError.textContent = "Password errata.";
                    return;
                }

                utenteCorrente = utenteTrovato;

                if (rememberCheckbox && rememberCheckbox.checked) {
                    localStorage.setItem('utente_salvato', JSON.stringify(utenteCorrente));
                }

                avviaApplicazione();

            } catch (err) {
                console.error("Errore durante il login:", err);
                if (loginError) loginError.textContent = "Errore di connessione durante la verifica.";
            }
        });
    }

    // Controllo se l'utente è già salvato nel localStorage
    const utenteSalvato = localStorage.getItem('utente_salvato');
    if (utenteSalvato) {
        try {
            utenteCorrente = JSON.parse(utenteSalvato);
            avviaApplicazione();
        } catch (e) {
            localStorage.removeItem('utente_salvato');
        }
    }

    // Gestione Logout
    if (btnLogoutHeader) {
        btnLogoutHeader.addEventListener('click', gestisciLogout);
    }
    if (sidebarUserCard) {
        sidebarUserCard.addEventListener('click', gestisciLogout);
    }

    // Inizializza Banner PWA
    initPwaBanner();
}

function avviaApplicazione() {
    const loginScreen = document.getElementById('login-screen');
    const appContainer = document.getElementById('app-container');
    const userGreeting = document.getElementById('user-greeting');
    const sidebarUserName = document.getElementById('sidebar-user-name');
    const sidebarUserRole = document.getElementById('sidebar-user-role');
    const btnAdminPanel = document.getElementById('btn-admin-panel');

    if (loginScreen) loginScreen.classList.add('hidden');
    if (appContainer) appContainer.classList.remove('hidden');

    if (utenteCorrente) {
        const nomeDaMostrare = utenteCorrente.nome || utenteCorrente.username || 'Utente';
        const ruoloDaMostrare = (utenteCorrente.ruolo || 'USER').toUpperCase();

        if (userGreeting) userGreeting.textContent = `Ciao ${nomeDaMostrare}`;
        if (sidebarUserName) sidebarUserName.textContent = nomeDaMostrare;
        if (sidebarUserRole) sidebarUserRole.textContent = ruoloDaMostrare;

        if (btnAdminPanel) {
            if (ruoloDaMostrare === 'ADMIN') {
                btnAdminPanel.classList.remove('hidden');
            } else {
                btnAdminPanel.classList.add('hidden');
            }
        }
    }

    // Inizializza i moduli applicativi
    initNavigation();
    initImpegni(getUtenteCorrente);
    initScadenze(getUtenteCorrente);
    initRicette(getUtenteCorrente);
    initMedia(getUtenteCorrente);
}

function gestisciLogout() {
    localStorage.removeItem('utente_salvato');
    utenteCorrente = null;
    window.location.reload();
}

function initPwaBanner() {
    const banner = document.getElementById('pwa-install-banner');
    const btnClose = document.getElementById('pwa-btn-close');
    const btnInstall = document.getElementById('pwa-btn-install');

    if (localStorage.getItem('pwa_banner_chiuso') === 'true') {
        if (banner) banner.classList.add('hidden');
    }

    if (btnClose && banner) {
        btnClose.addEventListener('click', () => {
            banner.classList.add('hidden');
            localStorage.setItem('pwa_banner_chiuso', 'true');
        });
    }

    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (banner && localStorage.getItem('pwa_banner_chiuso') !== 'true') {
            banner.classList.remove('hidden');
        }
    });

    if (btnInstall) {
        btnInstall.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    console.log('Utente ha accettato installazione PWA');
                }
                deferredPrompt = null;
            }
            if (banner) banner.classList.add('hidden');
            localStorage.setItem('pwa_banner_chiuso', 'true');
        });
    }
}
