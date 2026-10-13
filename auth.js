import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const authForm = document.getElementById('auth-form');
const authUsernameInput = document.getElementById('auth-username');
const authPasswordInput = document.getElementById('auth-password');
const rememberCheck = document.getElementById('remember-check');
const btnLogout = document.getElementById('btn-logout');
const greetingTitle = document.getElementById('greeting-title');
const headerColorPicker = document.getElementById('header-color-picker');
const menuUtenti = document.getElementById('menu-utenti');

export let nomeUtenteCorrente = "";
export let isAdminCorrente = false;
let callbackAvvio = null;

export function impostaCallbackAvvio(cb) {
    callbackAvvio = cb;
}

export function formatCapitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function isAdminCorrenteFunzione() {
    return isAdminCorrente;
}

// Esporta anche come proprietà per compatibilità
export function isAdminCorrenteExport() {
    return isAdminCorrente;
}

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = formatCapitalize(authUsernameInput.value.trim());
    const password = authPasswordInput.value.trim();

    if (!username || !password) {
        alert("Inserisci nome utente e password.");
        return;
    }

    try {
        const userDocRef = doc(db, "utenti", username);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
            alert("Utente non trovato. Verifica il nome inserito.");
            return;
        }

        const userData = userSnap.data();

        if (userData.password !== password) {
            alert("Password errata.");
            return;
        }

        // Login riuscito
        nomeUtenteCorrente = username;
        // È admin se è Paolo o se specificato
        isAdminCorrente = (username.toLowerCase() === 'paolo' || userData.isAdmin === true);

        if (rememberCheck.checked) {
            localStorage.setItem('portale_famiglia_utente', username);
        } else {
            sessionStorage.setItem('portale_famiglia_utente', username);
        }

        applicaDatiUtente(userData);

    } catch (err) {
        console.error("Errore di accesso:", err);
        alert("Errore durante l'accesso al database.");
    }
});

function applicaDatiUtente(userData) {
    authContainer.style.display = 'none';
    appContainer.style.display = 'flex';

    if (greetingTitle) {
        greetingTitle.textContent = `Ciao, ${userData.nome}`;
    }

    if (headerColorPicker) {
        headerColorPicker.value = userData.colore || '#3b82f6';
        document.documentElement.style.setProperty('--user-primary', userData.colore || '#3b82f6');
    }

    // Mostra gestione utenti solo se Admin (es. Paolo)
    if (menuUtenti) {
        if (isAdminCorrente) {
            menuUtenti.style.display = 'flex';
        } else {
            menuUtenti.style.display = 'none';
        }
    }

    if (callbackAvvio) {
        callbackAvvio();
    }
}

// Salvataggio colore utente in tempo reale
if (headerColorPicker) {
    headerColorPicker.addEventListener('input', async (e) => {
        const nuovoColore = e.target.value;
        document.documentElement.style.setProperty('--user-primary', nuovoColore);
        if (nomeUtenteCorrente) {
            try {
                const userDocRef = doc(db, "utenti", nomeUtenteCorrente);
                await setDoc(userDocRef, { colore: nuovoColore }, { merge: true });
            } catch (err) {
                console.error("Errore salvataggio colore", err);
            }
        }
    });
}

btnLogout.addEventListener('click', () => {
    localStorage.removeItem('portale_famiglia_utente');
    sessionStorage.removeItem('portale_famiglia_utente');
    location.reload();
});

export function controllaSessioneSalvata() {
    const utenteSalvato = localStorage.getItem('portale_famiglia_utente') || sessionStorage.getItem('portale_famiglia_utente');
    if (utenteSalvato) {
        getDoc(doc(db, "utenti", utenteSalvato)).then(userSnap => {
            if (userSnap.exists()) {
                nomeUtenteCorrente = utenteSalvato;
                isAdminCorrente = (utenteSalvato.toLowerCase() === 'paolo' || userSnap.data().isAdmin === true);
                applicaDatiUtente(userSnap.data());
            }
        }).catch(err => {
            console.error("Errore sessione", err);
        });
    }
}

export function attivaInterfacciaUtente(caricaUtentiCb) {
    if (isAdminCorrente && caricaUtentiCb) {
        caricaUtentiCb();
    }
}
