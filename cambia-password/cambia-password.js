// --- Import SDK Firebase ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, collection, getDocs, doc, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAtMnKhhfC43J73kVm8-QcNghqzOTV6UKA",
    authDomain: "sito-famiglia.firebaseapp.com",
    projectId: "sito-famiglia",
    storageBucket: "sito-famiglia.appspot.com",
    messagingSenderId: "93216467751",
    appId: "1:93216467751:web:9930052845521ca5ef895a",
    measurementId: "G-NYRQJDTWM3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Inizializzazione della sezione Cambia Password
export async function initCambiaPasswordSection(container) {
    container.innerHTML = `
        <div class="cambia-password-container">
            <div class="password-card">
                <div class="password-card-header">
                    <h3><i class="fa-solid fa-key"></i> CAMBIA PASSWORD</h3>
                </div>
                <div class="password-card-body">
                    <form id="form-cambia-password">
                        <div class="form-group-password">
                            <label for="pwd-attuale">Password Attuale</label>
                            <input type="password" id="pwd-attuale" required placeholder="Inserisci la password corrente">
                        </div>
                        <div class="form-group-password">
                            <label for="pwd-nuova">Nuova Password</label>
                            <input type="password" id="pwd-nuova" required placeholder="Inserisci la nuova password">
                        </div>
                        <div class="form-group-password">
                            <label for="pwd-conferma">Conferma Nuova Password</label>
                            <input type="password" id="pwd-conferma" required placeholder="Ripeti la nuova password">
                        </div>
                        <div class="password-footer">
                            <button type="submit" class="btn-salva-password">Aggiorna Password</button>
                        </div>
                        <div id="password-msg" class="password-msg"></div>
                    </form>
                </div>
            </div>
        </div>
    `;

    const form = document.getElementById('form-cambia-password');
    const msgBox = document.getElementById('password-msg');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        msgBox.className = 'password-msg';
        msgBox.textContent = '';

        const pwdAttuale = document.getElementById('pwd-attuale').value;
        const pwdNuova = document.getElementById('pwd-nuova').value;
        const pwdConferma = document.getElementById('pwd-conferma').value;

        if (pwdNuova !== pwdConferma) {
            msgBox.textContent = "Le nuove password non coincidono.";
            msgBox.classList.add('error');
            return;
        }

        if (pwdNuova.length < 4) {
            msgBox.textContent = "La nuova password deve contenere almeno 4 caratteri.";
            msgBox.classList.add('error');
            return;
        }

        const savedUserStr = localStorage.getItem('famiglia_pwa_user') || sessionStorage.getItem('famiglia_pwa_user');
        if (!savedUserStr) {
            alert("Sessione scaduta. Effettua nuovamente il login.");
            window.location.href = '../index.html';
            return;
        }

        const userData = JSON.parse(savedUserStr);

        try {
            // Recupera la collezione utenti per cercare il profilo corrente in modo sicuro
            const utentiSnapshot = await getDocs(collection(db, "utenti"));
            let userDocRef = null;
            let userDataDb = null;

            utentiSnapshot.forEach(docSnap => {
                const data = docSnap.data();
                const matchNome = userData.nome && data.nome && data.nome.toLowerCase() === userData.nome.toLowerCase();
                const matchUsername = userData.username && data.username && data.username.toLowerCase() === userData.username.toLowerCase();
                
                if (matchUsername || matchNome) {
                    userDocRef = doc(db, "utenti", docSnap.id);
                    userDataDb = data;
                }
            });

            if (!userDocRef || !userDataDb) {
                msgBox.textContent = "Utente non trovato nel database.";
                msgBox.classList.add('error');
                return;
            }

            // Verifica password attuale
            if (userDataDb.password && userDataDb.password !== pwdAttuale) {
                msgBox.textContent = "La password attuale non è corretta.";
                msgBox.classList.add('error');
                return;
            }

            // Aggiorna la password su Firestore
            await updateDoc(userDocRef, {
                password: pwdNuova
            });

            // Aggiorna anche la memoria locale di sessione
            userData.password = pwdNuova;
            if (localStorage.getItem('famiglia_pwa_user')) {
                localStorage.setItem('famiglia_pwa_user', JSON.stringify(userData));
            } else {
                sessionStorage.setItem('famiglia_pwa_user', JSON.stringify(userData));
            }

            msgBox.textContent = "Password aggiornata con successo!";
            msgBox.classList.add('success');
            form.reset();

        } catch (err) {
            console.error("Errore aggiornamento password:", err);
            msgBox.textContent = "Si è verificato un errore durante l'aggiornamento.";
            msgBox.classList.add('error');
        }
    });
}
