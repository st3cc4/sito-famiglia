// js/auth.js - Gestione Autenticazione, Login e Profilo Utente

import { db } from "./firebase-config.js";
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export let utenteCorrente = null;

// Elementi DOM Login
const loginScreen = document.getElementById('login-screen');
const appContainer = document.getElementById('app-container');
const formLogin = document.getElementById('form-login');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const loginRemember = document.getElementById('login-remember');
const loginError = document.getElementById('login-error');
const btnTogglePassword = document.getElementById('btn-toggle-password');

// Elementi Profilo e Sidebar
const sidebarUserCard = document.getElementById('sidebar-user-card');
const sidebarUserName = document.getElementById('sidebar-user-name');
const sidebarUserRole = document.getElementById('sidebar-user-role');
const userBadge = document.getElementById('user-badge');
const userNameDisplay = document.getElementById('user-name-display');
const btnAdminPanel = document.getElementById('btn-admin-panel');

// Modali Profilo
const modalPassword = document.getElementById('modal-password');
const modalColore = document.getElementById('modal-colore');
const btnChangePassword = document.getElementById('btn-change-password');
const btnChangeColor = document.getElementById('btn-change-color');
const btnCloseModalPassword = document.getElementById('btn-close-modal-password');
const btnCloseModalColore = document.getElementById('btn-close-modal-colore');
const formPassword = document.getElementById('form-password');
const formColore = document.getElementById('form-colore');

let onLoginSuccessCallback = null;

export function initAuth(onLoginSuccess) {
    onLoginSuccessCallback = onLoginSuccess;

    // Mostra/Nascondi Password
    if (btnTogglePassword) {
        btnTogglePassword.addEventListener('click', () => {
            const isPassword = loginPassword.getAttribute('type') === 'password';
            loginPassword.setAttribute('type', isPassword ? 'text' : 'password');
            btnTogglePassword.textContent = isPassword ? '🙈' : '👁️';
        });
    }

    // Submit Login
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginError.textContent = "";

            const usernameDigitato = loginUsername.value.trim();
            const passwordDigitata = loginPassword.value.trim();

            try {
                const utentiRef = collection(db, "utenti");
                const querySnapshot = await getDocs(utentiRef);

                let utenteTrovato = null;

                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    const nomeUtente = data.nome || docSnap.id;

                    if (nomeUtente.toLowerCase() === usernameDigitato.toLowerCase() && data.password === passwordDigitata) {
                        const eAdmin = (data.ruolo === 'admin') || (nomeUtente.toLowerCase() === 'paolo');

                        utenteTrovato = {
                            id: docSnap.id,
                            nome: nomeUtente,
                            password: data.password,
                            colore: data.colore || "#4A90E2",
                            ruolo: eAdmin ? 'admin' : (data.ruolo || 'utente'),
                            permessi: data.permessi || { impegni: true, scadenze: true, ricette: true, media: true }
                        };
                    }
                });

                if (utenteTrovato) {
                    effettuaLogin(utenteTrovato, loginRemember.checked);
                } else {
                    loginError.textContent = "Nome utente o password non corretti.";
                }
            } catch (error) {
                console.error("Errore durante il login:", error);
                loginError.textContent = "Errore di connessione durante la verifica.";
            }
        });
    }

    // Click sulla Card Utente per Logout
    if (sidebarUserCard) {
        sidebarUserCard.addEventListener('click', () => {
            if (confirm("Vuoi uscire / disconnetterti dall'applicazione?")) {
                eseguiLogout();
            }
        });
    }

    // Modali Password e Colore
    if (btnChangePassword) {
        btnChangePassword.addEventListener('click', () => { modalPassword.classList.add('active'); });
    }
    if (btnCloseModalPassword) {
        btnCloseModalPassword.addEventListener('click', () => modalPassword.classList.remove('active'));
    }

    if (btnChangeColor) {
        btnChangeColor.addEventListener('click', () => {
            document.getElementById('user-color-picker').value = utenteCorrente ? utenteCorrente.colore : "#4A90E2";
            modalColore.classList.add('active');
        });
    }
    if (btnCloseModalColore) {
        btnCloseModalColore.addEventListener('click', () => modalColore.classList.remove('active'));
    }

    // Salva Password
    if (formPassword) {
        formPassword.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nuovaPwd = document.getElementById('new-password').value.trim();
            if (!utenteCorrente || !nuovaPwd) return;

            try {
                await updateDoc(doc(db, "utenti", utenteCorrente.id), { password: nuovaPwd });
                utenteCorrente.password = nuovaPwd;
                if (localStorage.getItem('sito_famiglia_user')) {
                    localStorage.setItem('sito_famiglia_user', JSON.stringify(utenteCorrente));
                }
                alert("Password aggiornata con successo!");
                formPassword.reset();
                modalPassword.classList.remove('active');
            } catch (err) {
                console.error("Errore aggiornamento password:", err);
                alert("Errore durante l'aggiornamento della password.");
            }
        });
    }

    // Salva Colore
    if (formColore) {
        formColore.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nuovoColore = document.getElementById('user-color-picker').value;
            if (!utenteCorrente || !nuovoColore) return;

            try {
                await updateDoc(doc(db, "utenti", utenteCorrente.id), { colore: nuovoColore });
                utenteCorrente.colore = nuovoColore;
                applicaColoreUtente(nuovoColore);

                if (localStorage.getItem('sito_famiglia_user')) {
                    localStorage.setItem('sito_famiglia_user', JSON.stringify(utenteCorrente));
                }
                alert("Colore aggiornato con successo!");
                modalColore.classList.remove('active');
            } catch (err) {
                console.error("Errore aggiornamento colore:", err);
                alert("Errore durante l'aggiornamento del colore.");
            }
        });
    }

    controllaSessioneSalvata();
}

function effettuaLogin(utente, ricorda) {
    utenteCorrente = utente;

    userNameDisplay.textContent = utente.nome;
    sidebarUserName.textContent = utente.nome;
    sidebarUserRole.textContent = utente.ruolo === 'admin' ? '(Admin)' : '(Utente)';

    applicaColoreUtente(utente.colore);

    if (utente.ruolo === 'admin') {
        btnAdminPanel.classList.remove('hidden');
    } else {
        btnAdminPanel.classList.add('hidden');
    }

    if (ricorda) {
        localStorage.setItem('sito_famiglia_user', JSON.stringify(utente));
    } else {
        localStorage.removeItem('sito_famiglia_user');
    }

    loginScreen.classList.add('hidden');
    appContainer.classList.remove('hidden');

    if (onLoginSuccessCallback) {
        onLoginSuccessCallback(utente);
    }
}

// Funzione automatica che calcola se il colore è chiaro o scuro e sceglie il colore del testo
function calcolaColoreTestoContrastato(hexColor) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    
    // Formula della luminanza relativa per percezione visiva umana
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#1a1a1a' : '#ffffff';
}

function applicaColoreUtente(colore) {
    const coloreTesto = calcolaColoreTestoContrastato(colore);

    if (sidebarUserCard) {
        sidebarUserCard.style.backgroundColor = colore;
        sidebarUserCard.style.color = coloreTesto;
    }

    const userInfoText = document.querySelector('.user-info-text');
    if (userInfoText) {
        userInfoText.style.color = coloreTesto;
    }

    if (userBadge) {
        userBadge.style.backgroundColor = colore;
        userBadge.style.color = coloreTesto;
    }
}

function eseguiLogout() {
    localStorage.removeItem('sito_famiglia_user');
    utenteCorrente = null;
    appContainer.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    if (formLogin) formLogin.reset();
}

function controllaSessioneSalvata() {
    const salvato = localStorage.getItem('sito_famiglia_user');
    if (salvato) {
        try {
            const utente = JSON.parse(salvato);
            if (utente.nome && utente.nome.toLowerCase() === 'paolo') {
                utente.ruolo = 'admin';
            }
            effettuaLogin(utente, true);
        } catch (e) {
            localStorage.removeItem('sito_famiglia_user');
        }
    }
}
