import { 
    doc, 
    getDoc,
    updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

export let nomeUtenteCorrente = null;
export let ruoloUtenteCorrente = null;
export let idUtenteCorrenteId = null;

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
    const pickerColoreUtente = document.getElementById('picker-colore-utente');
    const formNuovoUtenteContainer = document.getElementById('form-nuovo-utente-container');
    
    // Elementi modale cambio password
    const modalPassword = document.getElementById('modal-password');
    const btnApriModalPassword = document.getElementById('btn-apri-modal-password');
    const btnChiudiModalPassword = document.getElementById('btn-chiudi-modal-password');
    const formCambiaPassword = document.getElementById('form-cambia-password');
    const pwdAttualeInput = document.getElementById('pwd-attuale');
    const pwdNuovaInput = document.getElementById('pwd-nuova');

    if (btnCambiaUtente) {
        btnCambiaUtente.textContent = "ESCI";
    }

    // Controllo se c'è un utente salvato con "Ricordami"
    const utenteSalvato = localStorage.getItem('famiglia_utente_corrente') || sessionStorage.getItem('famiglia_utente_corrente');
    if (utenteSalvato) {
        await validaEImpostaUtente(utenteSalvato);
    }

    // Gestione pulsante occhio per mostrare/nascondere la password nel login
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

    // Gestione invio form di login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInserito = usernameInput.value.trim();
            const password = passwordInput.value.trim();

            if (!usernameInserito) return;

            try {
                let userDocRef = doc(db, "utenti", usernameInserito);
                let userSnap = await getDoc(userDocRef);

                if (!userSnap.exists()) {
                    userDocRef = doc(db, "utenti", usernameInserito.toLowerCase());
                    userSnap = await getDoc(userDocRef);
                }

                if (!userSnap.exists()) {
                    alert("Accesso negato: utente non autorizzato o inesistente nel database.");
                    return;
                }

                const userData = userSnap.data();
                const userIdTrovato = userSnap.id;
                
                if (userData.password && userData.password !== password) {
                    alert("Password errata.");
                    return;
                }

                if (ricordamiCheckbox && ricordamiCheckbox.checked) {
                    localStorage.setItem('famiglia_utente_corrente', userIdTrovato);
                } else {
                    sessionStorage.setItem('famiglia_utente_corrente', userIdTrovato);
                }

                await validaEImpostaUtente(userIdTrovato);

            } catch (err) {
                console.error("Errore durante il login:", err);
                alert("Errore di connessione durante il login.");
            }
        });
    }

    // Cliccando sul badge del nome, apriamo il color picker per cambiare colore al volo
    if (currentUserBadge && pickerColoreUtente) {
        currentUserBadge.addEventListener('click', () => {
            pickerColoreUtente.click();
        });

        pickerColoreUtente.addEventListener('change', async (e) => {
            const nuovoColore = e.target.value;
            if (!idUtenteCorrenteId) return;

            try {
                const userDocRef = doc(db, "utenti", idUtenteCorrenteId);
                await updateDoc(userDocRef, { colore: nuovoColore });

                // Aggiorniamo subito l'interfaccia
                currentUserBadge.style.backgroundColor = nuovoColore;
                currentUserBadge.style.color = isColorDark(nuovoColore) ? '#ffffff' : '#0f172a';
            } catch (err) {
                console.error("Errore durante l'aggiornamento del colore:", err);
                alert("Errore durante il salvataggio del colore.");
            }
        });
    }

    // Gestione Modale Cambio Password
    if (btnApriModalPassword && modalPassword) {
        btnApriModalPassword.addEventListener('click', () => {
            modalPassword.style.display = 'flex';
            if (formCambiaPassword) formCambiaPassword.reset();
        });
    }

    if (btnChiudiModalPassword && modalPassword) {
        btnChiudiModalPassword.addEventListener('click', () => {
            modalPassword.style.display = 'none';
        });
    }

    if (formCambiaPassword) {
        formCambiaPassword.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pwdAttuale = pwdAttualeInput.value.trim();
            const pwdNuova = pwdNuovaInput.value.trim();

            if (!idUtenteCorrenteId) return;

            try {
                const userDocRef = doc(db, "utenti", idUtenteCorrenteId);
                const userSnap = await getDoc(userDocRef);

                if (!userSnap.exists()) {
                    alert("Errore: utente non trovato.");
                    return;
                }

                const userData = userSnap.data();

                // Verifica password attuale
                if (userData.password && userData.password !== pwdAttuale) {
                    alert("La password attuale inserita non è corretta.");
                    return;
                }

                // Aggiorna con la nuova password
                await updateDoc(userDocRef, { password: pwdNuova });
                alert("Password aggiornata con successo!");
                modalPassword.style.display = 'none';

            } catch (err) {
                console.error("Errore durante il cambio password:", err);
                alert("Errore di connessione durante il cambio password.");
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

    // Pulsante ESCI / Logout
    if (btnCambiaUtente) {
        btnCambiaUtente.addEventListener('click', () => {
            localStorage.removeItem('famiglia_utente_corrente');
            sessionStorage.removeItem('famiglia_utente_corrente');
            nomeUtenteCorrente = null;
            ruoloUtenteCorrente = null;
            idUtenteCorrenteId = null;
            if (appContainer) appContainer.style.display = 'none';
            if (authScreen) authScreen.style.display = 'flex';
            if (loginForm) loginForm.reset();
        });
    }

    async function validaEImpostaUtente(username) {
        try {
            let userSnap = await getDoc(doc(db, "utenti", username));
            if (!userSnap.exists()) {
                userSnap = await getDoc(doc(db, "utenti", username.toLowerCase()));
            }

            if (userSnap.exists()) {
                const data = userSnap.data();
                idUtenteCorrenteId = userSnap.id;
                nomeUtenteCorrente = data.nome || username;
                ruoloUtenteCorrente = (username.toLowerCase() === 'paolo' || data.ruolo === 'admin') ? 'admin' : 'membro';

                if (authScreen) authScreen.style.display = 'none';
                if (appContainer) appContainer.style.display = 'flex';

                if (currentUserBadge) {
                    currentUserBadge.textContent = `${nomeUtenteColrente} (${ruoloUtenteCorrente})`;
                    
                    const coloreUtente = data.colore || '#3b82f6';
                    currentUserBadge.style.backgroundColor = coloreUtente;
                    currentUserBadge.style.color = isColorDark(coloreUtente) ? '#ffffff' : '#0f172a';
                    if (pickerColoreUtente) {
                        pickerColoreUtente.value = coloreUtente;
                    }
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

// Funzione di supporto per determinare se il colore di sfondo è scuro
function isColorDark(hexColor) {
    let color = hexColor.replace('#', '');
    if (color.length === 3) {
        color = color.split('').map(c => c + c).join('');
    }
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
}
