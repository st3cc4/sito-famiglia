import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const authForm = document.getElementById('auth-form');
const authUsernameInput = document.getElementById('auth-username');
const authPasswordInput = document.getElementById('auth-password');
const togglePasswordBtn = document.getElementById('toggle-password');
const rememberCheck = document.getElementById('remember-check');
const btnLogout = document.getElementById('btn-logout');
const greetingTitle = document.getElementById('greeting-title');
const headerColorPicker = document.getElementById('header-color-picker');
const menuUtenti = document.getElementById('menu-utenti');

// Modale Cambio Password
const btnApriModalePassword = document.getElementById('btn-apri-modale-password');
const modalCambiaPassword = document.getElementById('modal-cambia-password');
const btnChiudiModalPassword = document.getElementById('btn-chiudi-modal-password');
const formCambiaPassword = document.getElementById('form-cambia-password');
const nuovaPasswordInput = document.getElementById('nuova-password-input');

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

export function isAdminCorrenteExport() {
    return isAdminCorrente;
}

// Gestione pulsante Mostra/Nascondi password nel login
if (togglePasswordBtn && authPasswordInput) {
    togglePasswordBtn.addEventListener('click', () => {
        if (authPasswordInput.type === 'password') {
            authPasswordInput.type = 'text';
            togglePasswordBtn.textContent = 'Nascondi';
        } else {
            authPasswordInput.type = 'password';
            togglePasswordBtn.textContent = 'Mostra';
        }
    });
}

// Apertura e chiusura modale cambio password
if (btnApriModalePassword && modalCambiaPassword) {
    btnApriModalePassword.addEventListener('click', () => {
        nuovaPasswordInput.value = '';
        modalCambiaPassword.style.display = 'flex';
    });
}

if (btnChiudiModalPassword && modalCambiaPassword) {
    btnChiudiModalPassword.addEventListener('click', () => {
        modalCambiaPassword.style.display = 'none';
    });
}

// Salvataggio nuova password
if (formCambiaPassword) {
    formCambiaPassword.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nuovaPassword = nuovaPasswordInput.value.trim();
        if (!nuovaPassword) {
            alert("Inserisci una password valida.");
            return;
        }

        if (!nomeUtenteCorrente) {
            alert("Nessun utente attualmente connesso.");
            return;
        }

        try {
            const userDocRef = doc(db, "utenti", nomeUtenteCorrente);
            await updateDoc(userDocRef, { password: nuovaPassword });
            alert("Password modificata con successo!");
            modalCambiaPassword.style.display = 'none';
            formCambiaPassword.reset();
        } catch (err) {
            console.error("Errore modifica password:", err);
            alert("Errore durante il salvataggio della nuova password.");
        }
    });
}

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usernameInput = authUsernameInput.value.trim();
    const usernameFormatted = formatCapitalize(usernameInput);
    const password = authPasswordInput.value.trim();

    if (!usernameInput || !password) {
        alert("Inserisci nome utente e password.");
        return;
    }

    try {
        let userDocRef = doc(db, "utenti", usernameFormatted);
        let userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
            userDocRef = doc(db, "utenti", usernameInput);
            userSnap = await getDoc(userDocRef);
        }

        if (!userSnap.exists()) {
            alert("Utente non trovato. Verifica il nome inserito.");
            return;
        }

        const userData = userSnap.data();

        if (userData.password !== password) {
            alert("Password errata.");
            return;
        }

        nomeUtenteCorrente = userSnap.id;
        isAdminCorrente = (nomeUtenteCorrente.toLowerCase() === 'paolo' || userData.isAdmin === true);

        if (rememberCheck.checked) {
            localStorage.setItem('portale_famiglia_utente', nomeUtenteCorrente);
        } else {
            sessionStorage.setItem('portale_famiglia_utente', nomeUtenteCorrente);
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
        greetingTitle.textContent = `Ciao, ${userData.nome || nomeUtenteCorrente}`;
    }

    if (headerColorPicker) {
        headerColorPicker.value = userData.colore || '#3b82f6';
        document.documentElement.style.setProperty('--user-primary', userData.colore || '#3b82f6');
    }

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
