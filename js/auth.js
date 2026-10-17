// js/auth.js - Gestione Autenticazione, Utenti, Cambia Password e Cambia Colore

import { db } from "./firebase-config.js";
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const loginScreen = document.getElementById('login-screen');
const appContainer = document.getElementById('app-container');
const formLogin = document.getElementById('form-login');
const loginError = document.getElementById('login-error');
const userGreeting = document.getElementById('user-greeting');
const sidebarUserName = document.getElementById('sidebar-user-name');
const btnLogoutHeader = document.getElementById('btn-logout-header');
const btnAdminPanel = document.getElementById('btn-admin-panel');

// Elementi Cambia Password
const btnChangePassword = document.getElementById('btn-change-password');
const modalPassword = document.getElementById('modal-password');
const formPassword = document.getElementById('form-password');
const btnCloseModalPassword = document.getElementById('btn-close-modal-password');

// Elementi Cambia Colore
const btnChangeColor = document.getElementById('btn-change-color');
const modalColore = document.getElementById('modal-colore');
const formColore = document.getElementById('form-colore');
const userColorPicker = document.getElementById('user-color-picker');
const btnCloseModalColore = document.getElementById('btn-close-modal-colore');

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

    // Evento Login
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('login-username').value.trim();
            const passwordInput = document.getElementById('login-password').value.trim();
            const rememberMe = document.getElementById('login-remember').checked;

            if (loginError) loginError.textContent = "";

            try {
                const querySnapshot = await getDocs(collection(db, "utenti"));
                let utenteTrovato = null;

                querySnapshot.forEach((docSnap) => {
                    const dati = docSnap.data();
                    if (dati.nome && dati.nome.toLowerCase() === usernameInput.toLowerCase() && dati.password === passwordInput) {
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
                    if (loginError) loginError.textContent = "Nome utente o password errati.";
                }
            } catch (err) {
                console.error("Errore durante il login:", err);
                if (loginError) loginError.textContent = "Errore di connessione a Firebase.";
            }
        });
    }

    // Evento Logout
    if (btnLogoutHeader) {
        btnLogoutHeader.addEventListener('click', () => {
            localStorage.removeItem('famiglia_utente');
            utenteCorrente = null;
            location.reload();
        });
    }

    // GESTIONE CAMBIA PASSWORD
    if (btnChangePassword && modalPassword) {
        btnChangePassword.addEventListener('click', () => {
            modalPassword.classList.add('show', 'active');
        });
    }

    if (btnCloseModalPassword && modalPassword) {
        btnCloseModalPassword.addEventListener('click', () => {
            modalPassword.classList.remove('show', 'active');
        });
    }

    if (formPassword) {
        formPassword.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('new-password').value.trim();
            if (!newPassword || !utenteCorrente) return;

            try {
                const userRef = doc(db, "utenti", utenteCorrente.id);
                await updateDoc(userRef, { password: newPassword });
                utenteCorrente.password = newPassword;
                localStorage.setItem('famiglia_utente', JSON.stringify(utenteCorrente));
                
                alert("Password aggiornata con successo!");
                modalPassword.classList.remove('show', 'active');
                formPassword.reset();
            } catch (err) {
                console.error("Errore aggiornamento password:", err);
                alert("Errore durante l'aggiornamento della password.");
            }
        });
    }

    // GESTIONE CAMBIA COLORE
    if (btnChangeColor && modalColore) {
        btnChangeColor.addEventListener('click', () => {
            if (userColorPicker && utenteCorrente && utenteCorrente.colore) {
                userColorPicker.value = utenteCorrente.colore;
            }
            modalColore.classList.add('show', 'active');
        });
    }

    if (btnCloseModalColore && modalColore) {
        btnCloseModalColore.addEventListener('click', () => {
            modalColore.classList.remove('show', 'active');
        });
    }

    if (formColore) {
        formColore.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nuovoColore = userColorPicker.value;
            if (!nuovoColore || !utenteCorrente) return;

            try {
                const userRef = doc(db, "utenti", utenteCorrente.id);
                await updateDoc(userRef, { colore: nuovoColore });
                utenteCorrente.colore = nuovoColore;
                localStorage.setItem('famiglia_utente', JSON.stringify(utenteCorrente));
                
                // Applica il nuovo colore all'header/tema
                document.documentElement.style.setProperty('--primary-color', nuovoColore);
                
                alert("Colore aggiornato con successo!");
                modalColore.classList.remove('show', 'active');
            } catch (err) {
                console.error("Errore aggiornamento colore:", err);
                alert("Errore durante il salvataggio del colore.");
            }
        });
    }
}

function mostraApplicazione(onLoginSuccess) {
    if (loginScreen) loginScreen.classList.add('hidden');
    if (appContainer) appContainer.classList.remove('hidden');

    if (userGreeting) userGreeting.textContent = `Ciao ${utenteCorrente.nome}`;
    if (sidebarUserName) sidebarUserName.textContent = utenteCorrente.nome;

    if (utenteCorrente.colore) {
        document.documentElement.style.setProperty('--primary-color', utenteCorrente.colore);
    }

    // Gestione visibilità pannello Admin
    if (btnAdminPanel) {
        if (utenteCorrente.ruolo === 'admin' || utenteCorrente.nome.toLowerCase() === 'paolo') {
            btnAdminPanel.classList.remove('hidden');
        } else {
            btnAdminPanel.classList.add('hidden');
        }
    }

    // Gestione permessi sezioni nella Sidebar
    applicaPermessiSidebar();

    if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(utenteCorrente);
    }
}

function applicaPermessiSidebar() {
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
