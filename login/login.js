import { db } from '../home/firebase-config.js'; // Assicurati che il percorso del config di firebase sia corretto
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('error-msg');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = usernameInput.value.trim().toLowerCase(); // Normalizza minuscolo come in Firestore
    const password = passwordInput.value.trim();

    errorMsg.style.display = 'none';

    try {
        // Cerchiamo il documento nella collezione 'utenti' usando il nome inserito (es. "paolo")
        // Dalla tua struttura, l'id del documento sembra essere il nome con l'iniziale maiuscola o minuscola. 
        // Proviamo a capitalizzare la prima lettera o a cercarlo direttamente.
        const docId = username.charAt(0).toUpperCase() + username.slice(1);
        const userRef = doc(db, "utenti", docId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            
            // Verifica della password salvata su Firestore
            if (userData.password === password) {
                // Salviamo la sessione localmente
                localStorage.setItem('famiglia_user', JSON.stringify({
                    nome: userData.nome,
                    ruolo: userData.ruolo,
                    permessi: userData.permessi
                }));

                // Reindirizzamento alla home
                window.location.href = '../home.html';
            } else {
                errorMsg.textContent = "Password errata.";
                errorMsg.style.display = 'block';
            }
        } else {
            errorMsg.textContent = "Utente non trovato.";
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        console.error("Errore durante il login:", error);
        errorMsg.textContent = "Errore di connessione al database.";
        errorMsg.style.display = 'block';
    }
});
