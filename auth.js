import { 
    collection, 
    getDocs, 
    doc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

export let nomeUtenteCorrente = null;
export let ruoloUtenteCorrente = null;

export function isAdminCorrente() {
    return ruoloUtenteCorrente === 'admin';
}

export async function inizializzaAuth() {
    const authScreen = document.getElementById('auth-screen');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const ricordamiCheckbox = document.getElementById('login-ricordami');
    const btnTogglePassword = document.getElementById('btn-toggle-password');
    const linkPasswordDimenticata = document.getElementById('link-password-dimenticata');
    const btnCambiaUtente = document.getElementById('btn-cambia-utente');
    const currentUserBadge = document.getElementById('current-user-badge');
    const formNuovoUtenteContainer = document.getElementById('form-nuovo-utente-container');

    // Controllo se c'è un utente salvato con "Ricordami"
    const utenteSalvato = localStorage.getItem('famiglia_utente_corrente') || sessionStorage.getItem('famiglia_utente_corrente');
    if (utenteSalvato) {
        await validaEImpostaUtente(utenteSalvato);
    }

    // Gestione pulsante occhio per mostrare/nascondere la password
    if (btnTogglePassword && passwordInput) {
        const nuovoBtn = btnTogglePassword.cloneNode(true);
        btnTogglePassword.parentNode.replaceChild(nuovoBtn, btnTogglePassword);
        
        nuovoBtn.addEventListener('click', () => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                nuovoBtn.textContent = '🔒';
            } else {
                passwordInput.type = 'password';
                nuovoBtn.textContent = '👁️';
            }
        });
    }

    // Gestione invio form di login con controlli rigorosi
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInserito = usernameInput.value.trim();
            const usernameId = usernameInserito.toLowerCase();
            const password = passwordInput.value.trim();

            if (!usernameInserito) return;

            try {
                const userDocRef = doc(db, "utenti", usernameId);
                const userSnap = await getDoc(userDocRef);

                // Controllo rigoroso: l'utente deve esistere nel database (creato da te)
                if (!userSnap.exists()) {
                    alert("Accesso negato: utente non autorizzato o inesistente nel database.");
                    return;
                }

                const userData = userSnap.data();
                
                // Controllo password rigoroso
                if (userData.password && userData.password !== password) {
                    alert("Password errata.");
                    return;
                }

                // Salva sessione in base a "Ricordami"
                if (ricordamiCheckbox && ricordamiCheckbox.checked) {
                    localStorage.setItem('famiglia_utente_corrente', usernameId);
                } else {
                    sessionStorage.setItem('famiglia_utente_corrente', usernameId);
                }

                await validaEImpostaUtente(usernameId);

            } catch (err) {
                console.error("Errore durante il login:", err);
                alert("Errore di connessione durante il login.");
            }
        });
    }

    // Password dimenticata
    if (linkPasswordDimenticata) {
        linkPasswordDimenticata.addEventListener('click', (e) => {
            e.preventDefault();
            alert("Contatta l'amministratore (Paolo) per reimpostare la password.");
        });
    }

    // Pulsante Cambia Utente / Logout
    if (btnCambiaUtente) {
        btnCambiaUtente.addEventListener('click', () => {
            localStorage.removeItem('famiglia_utente_corrente');
            sessionStorage.removeItem('famiglia_utente_corrente');
            nomeUtenteCorrente = null;
            ruoloUtenteCorrente = null;
            if (appContainer) appContainer.style.display = 'none';
            if (authScreen) authScreen.style.display = 'flex';
            if (loginForm) loginForm.reset();
        });
    }

    async function validaEImpostaUtente(username) {
        try {
            const userSnap = await getDoc(doc(db, "utenti", username));
            if (userSnap.exists()) {
                const data = userSnap.data();
                nomeUtenteCorrente = data.nome || username;
                ruoloUtenteCorrente = data.ruolo || 'membro';

                if (authScreen) authScreen.style.display = 'none';
                if (appContainer) appContainer.style.display = 'flex';

                if (currentUserBadge) {
                    currentUserBadge.textContent = `${nomeUtenteCorrente} (${ruoloUtenteCorrente})`;
                }

                if (formNuovoUtenteContainer) {
                    formNuovoUtenteContainer.style.display = isAdminCorrente() ? 'block' : 'none';
                }
            } else {
                localStorage.removeItem('famiglia_utente_corrente');
                sessionStorage.removeItem('famiglia_utente_corrente');
            }
        } catch (err) {
            console.error("Errore validazione utente:", err);
        }
    }
}
