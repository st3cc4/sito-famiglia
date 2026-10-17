// js/auth.js - Gestione Autenticazione, Utenti e Permessi Sidebar

import { db } from "./firebase-config.js";
import { collection, getDocs, doc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const loginScreen = document.getElementById('login-screen');
const appContainer = document.getElementById('app-container');
const formLogin = document.getElementById('form-login');
const loginError = document.getElementById('login-error');
const userGreeting = document.getElementById('user-greeting');
const sidebarUserName = document.getElementById('sidebar-user-name');
const btnLogoutHeader = document.getElementById('btn-logout-header');
const btnAdminPanel = document.getElementById('btn-admin-panel');

let utenteCorrente = null;

export function initAuth(onLoginSuccess) {
    // Controllo se c'è una sessione salvata in localStorage
    const utenteSalvato = localStorage.getItem('famiglia_utente');
    if (utenteSalvato) {
        try {
            utenteCorrente = JSON.parse(utenteSalvato);
            mostraApplicazione(onLoginSuccess);
        } catch (e) {
            localStorage.removeItem('famiglia_utente');
        }
    }

    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('login-username').value.trim();
            const passwordInput = document.getElementById('login-password').value.trim();
            const rememberMe = document.getElementById('login-remember').checked;

            loginError.textContent = "";

            try {
                const querySnapshot = await getDocs(collection(db, "utenti"));
                let utenteTrovato = null;

                querySnapshot.forEach((docSnap) => {
                    const dati = docSnap.data();
                    if (dati.nome.toLowerCase() === usernameInput.toLowerCase() && dati.password === passwordInput) {
                        utenteTrovato = { id: docSnap.id, ...dati };
                    }
                });

                if (utenteTrovato) {
                    utenteCorrente = utenteTrovato;
                    if (rememberMe) {
                        localStorage.setItem('famiglia_utente', JSON.stringify(utenteCorrente));
                    }
                    mostraApplicazione(onLoginSuccess);
                } else {
                    loginError.textContent = "Nome utente o password errati.";
                }
            } catch (err) {
                console.error("Errore durante il login:", err);
                loginError.textContent = "Errore di connessione a Firebase.";
            }
        });
    }

    if (btnLogoutHeader) {
        btnLogoutHeader.addEventListener('click', () => {
            localStorage.removeItem('famiglia_utente');
            utenteCorrente = null;
            location.reload();
        });
    }
}

function mostraApplicazione(onLoginSuccess) {
    if (loginScreen) loginScreen.classList.add('hidden');
    if (appContainer) appContainer.classList.remove('hidden');

    if (userGreeting) userGreeting.textContent = `Ciao ${utenteCorrente.nome}`;
    if (sidebarUserName) sidebarUserName.textContent = utenteCorrente.nome;

    // Gestione visibilità pannello Admin
    if (btnAdminPanel) {
        if (utenteCorrente.ruolo === 'admin' || utenteCorrente.nome.toLowerCase() === 'paolo') {
            btnAdminPanel.classList.remove('hidden');
        } else {
            btnAdminPanel.classList.add('hidden');
        }
    }

    // Gestione permessi sezioni/icone nella Sidebar
    applicaPermessiSidebar();

    if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(utenteCorrente);
    }
}

function applicaPermessiSidebar() {
    // Se l'utente ha una mappa di permessi personalizzata, nascondiamo le sezioni non autorizzate
    const permessi = utenteCorrente.permessi || { impegni: true, scadenze: true, ricette: true, media: true };

    const navImpegni = document.getElementById('nav-item-impegni');
    const navScadenze = document.getElementById('nav-item-scadenze');
    const navRicette = document.getElementById('nav-item-ricette');
    const navMedia = document.getElementById('nav-item-media');

    if (navImpegni) navImpegni.style.display = permessi.impegni !== false ? 'block' : 'none';
    if (navScadenze) navScadenze.style.display = permessi.scadenze !== false ? 'block' : 'none';
    if (navRicette) navRicette.style.display = permessi.ricette !== false ? 'block' : 'none';
    if (navMedia) navMedia.style.display = permessi.media !== false ? 'block' : 'none';
}

export function getUtenteCorrente() {
    return utenteCorrente;
}
