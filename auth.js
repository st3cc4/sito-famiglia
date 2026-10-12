import { 
    collection, 
    getDocs, 
    doc, 
    setDoc,
    updateDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

export const ADMIN_NAME = "Paolo"; 

export let nomeUtenteCorrente = "";
export let coloreUtenteCorrente = "#3b82f6";
export let mappaColoriUtenti = {}; 

const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const authForm = document.getElementById('auth-form');
const authUsernameInput = document.getElementById('auth-username');
const authPasswordInput = document.getElementById('auth-password');
const rememberCheck = document.getElementById('remember-check');
const forgotPasswordBtn = document.getElementById('forgot-password-btn');
const greetingTitle = document.getElementById('greeting-title');
const headerColorPicker = document.getElementById('header-color-picker');
const btnLogout = document.getElementById('btn-logout');
const menuUtenti = document.getElementById('menu-utenti');

export function formatCapitalize(str) {
    if (!str) return '';
    const trimmed = str.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nomeInserito = formatCapitalize(authUsernameInput.value);
    const passwordInserita = authPasswordInput.value.trim();

    try {
        const utentiSnapshot = await getDocs(collection(db, "utenti"));
        
        if (utentiSnapshot.empty) {
            const adminData = {
                nome: ADMIN_NAME,
                password: passwordInserita || "sv058753",
                colore: "#3b82f6",
                permessi: { scadenze: true, appuntamenti: true, media: true, ricette: true }
            };
            await setDoc(doc(db, "utenti", ADMIN_NAME), adminData);

            nomeUtenteCorrente = ADMIN_NAME;
            coloreUtenteCorrente = adminData.colore;

            if (rememberCheck.checked) {
                localStorage.setItem("portale_famiglia_utente", nomeUtenteCorrente);
            } else {
                sessionStorage.setItem("portale_famiglia_utente", nomeUtenteCorrente);
            }

            avviaApplicazioneCallback();
            return;
        }

        const userDocRef = doc(db, "utenti", nomeInserito);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.password === passwordInserita) {
                nomeUtenteCorrente = nomeInserito;
                coloreUtenteCorrente = data.colore || "#3b82f6";

                if (rememberCheck.checked) {
                    localStorage.setItem("portale_famiglia_utente", nomeUtenteCorrente);
                } else {
                    sessionStorage.setItem("portale_famiglia_utente", nomeUtenteCorrente);
                }

                avviaApplicazioneCallback();
            } else {
                alert("Password errata!");
            }
        } else {
            alert("Utente non trovato!");
        }
    } catch (err) {
        alert("Errore durante l'accesso.");
    }
});

forgotPasswordBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const nomeInserito = formatCapitalize(authUsernameInput.value);
    if (!nomeInserito) {
        alert("Inserisci prima il tuo nome utente nel campo apposito.");
        return;
    }
    try {
        const userDoc = await getDoc(doc(db, "utenti", nomeInserito));
        if (userDoc.exists()) {
            alert(`La password per ${nomeInserito} è: ${userDoc.data().password}`);
        } else {
            alert("Utente non registrato.");
        }
    } catch (err) {
        alert("Errore nel recupero della password.");
    }
});

btnLogout.addEventListener('click', () => {
    localStorage.removeItem("portale_famiglia_utente");
    sessionStorage.removeItem("portale_famiglia_utente");
    location.reload();
});

let avviaApplicazioneCallback = () => {};

export function impostaCallbackAvvio(callback) {
    avviaApplicazioneCallback = callback;
}

export async function controllaSessioneSalvata() {
    const utenteSalvato = localStorage.getItem("portale_famiglia_utente") || sessionStorage.getItem("portale_famiglia_utente");
    if (utenteSalvato) {
        try {
            const userDoc = await getDoc(doc(db, "utenti", utenteSalvato));
            if (userDoc.exists()) {
                nomeUtenteCorrente = utenteSalvato;
                coloreUtenteCorrente = userDoc.data().colore || "#3b82f6";
                avviaApplicazioneCallback();
            }
        } catch (err) {
            console.error(err);
        }
    }
}

export async function attivaInterfacciaUtente(caricaListaUtentiFn) {
    authContainer.style.display = 'none';
    appContainer.style.display = 'flex';

    document.documentElement.style.setProperty('--user-primary', coloreUtenteCorrente);
    greetingTitle.textContent = `Ciao, ${nomeUtenteCorrente}`;
    headerColorPicker.value = coloreUtenteCorrente;

    try {
        const utentiSnapshot = await getDocs(collection(db, "utenti"));
        utentiSnapshot.forEach(docSnap => {
            const uData = docSnap.data();
            if (uData.nome && uData.colore) {
                mappaColoriUtenti[uData.nome] = uData.colore;
            }
        });
    } catch (err) {
        console.error(err);
    }

    if (nomeUtenteCorrente === ADMIN_NAME) {
        menuUtenti.style.display = 'flex';
        caricaListaUtentiFn();
    } else {
        menuUtenti.style.display = 'none';
    }
}

headerColorPicker.addEventListener('input', async (e) => {
    const nuovoColore = e.target.value;
    coloreUtenteCorrente = nuovoColore;
    document.documentElement.style.setProperty('--user-primary', nuovoColore);

    if (nomeUtenteCorrente) {
        try {
            const userRef = doc(db, "utenti", nomeUtenteCorrente);
            await updateDoc(userRef, { colore: nuovoColore });
            mappaColoriUtenti[nomeUtenteCorrente] = nuovoColore;
        } catch (err) {
            console.error("Errore nel salvataggio del colore utente:", err);
        }
    }
});
