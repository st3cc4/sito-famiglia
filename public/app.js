// Importazione dei moduli necessari da Firebase tramite CDN ufficiale
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configurazione di Firebase presa dai tuoi dati
const firebaseConfig = {
    apiKey: "AIzaSyAtMnKhhfC43J73kVm8-QcNghqzOTV6UKA",
    authDomain: "sito-famiglia.firebaseapp.com",
    projectId: "sito-famiglia",
    storageBucket: "sito-famigliastorage.app",
    messagingSenderId: "93216467751",
    appId: "1:93216467751:web:9930052845521ca5ef895a",
    measurementId: "G-NYRQJDTWM3"
};

// Inizializzazione di Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Selezione degli elementi HTML
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const authForm = document.getElementById('auth-form');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const authBtn = document.getElementById('auth-btn');
const authSubtitle = document.getElementById('auth-subtitle');
const authToggleText = document.getElementById('auth-toggle-text');
const authToggleBtn = document.getElementById('auth-toggle-btn');
const userEmailDisplay = document.getElementById('user-email-display');
const btnLogout = document.getElementById('btn-logout');

const scadenzaForm = document.getElementById('scadenza-form');
const inputTitolo = document.getElementById('titolo');
const inputData = document.getElementById('data');
const inputImporto = document.getElementById('importo');
const listaScadenze = document.getElementById('lista-scadenze');

// Stato per gestire se l'utente sta facendo Login o Registrazione
let isRegistering = false;

authToggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isRegistering = !isRegistering;
    if (isRegistering) {
        authSubtitle.textContent = "Crea un nuovo account per la famiglia";
        authBtn.textContent = "Registrati";
        authToggleText.textContent = "Hai già un account?";
        authToggleBtn.textContent = "Accedi";
    } else {
        authSubtitle.textContent = "Accedi per gestire le scadenze";
        authBtn.textContent = "Accedi";
        authToggleText.textContent = "Non hai un account?";
        authToggleBtn.textContent = "Registrati";
    }
});

// Gestione dell'invio del form di autenticazione (Login / Registrazione)
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = authEmailInput.value;
    const password = authPasswordInput.value;

    try {
        if (isRegistering) {
            await createUserWithEmailAndPassword(auth, email, password);
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch (error) {
        alert("Errore di autenticazione: " + error.message);
    }
});

// Gestione del Logout
btnLogout.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Errore durante il logout", error);
    }
});

// Controllo dello stato di autenticazione in tempo reale
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Utente loggato: mostra l'app e carica i dati
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        userEmailDisplay.textContent = user.email;
        caricaScadenze();
    } else {
        // Utente disconnesso: mostra la schermata di login
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
        authForm.reset();
    }
});

// --- GESTIONE DEL DATABASE FIRESTORE (Scadenze) ---

// Funzione per caricare le scadenze da Firestore
async function caricaScadenze() {
    listaScadenze.innerHTML = '<p style="text-align: center; color: #94a3b8; padding: 10px;">Caricamento in corso...</p>';
    
    try {
        const q = query(collection(db, "scadenze"), orderBy("data", "asc"));
        const querySnapshot = await getDocs(q);
        
        listaScadenze.innerHTML = '';

        if (querySnapshot.empty) {
            listaScadenze.innerHTML = '<p style="text-align: center; color: #94a3b8; padding: 10px;">Nessuna scadenza inserita.</p>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const scadenza = docSnap.data();
            const id = docSnap.id;

            const li = document.createElement('li');
            li.className = 'elemento-lista';

            li.innerHTML = `
                <div class="info-scadenza">
                    <h3>${scadenza.titolo}</h3>
                    <p>📅 Scadenza: ${scadenza.data} &nbsp;|&nbsp; 💶 <strong>€ ${Number(scadenza.importo).toFixed(2)}</strong></p>
                </div>
                <button class="btn-elimina" data-id="${id}">Fatto / Elimina</button>
            `;

            // Aggiungiamo l'evento per eliminare la scadenza
            li.querySelector('.btn-elimina').addEventListener('click', () => eliminaScadenza(id));

            listaScadenze.appendChild(li);
        });
    } catch (error) {
        console.error("Errore nel caricamento delle scadenze: ", error);
        listaScadenze.innerHTML = '<p style="text-align: center; color: #ef4444; padding: 10px;">Errore nel caricamento dei dati.</p>';
    }
}

// Funzione per aggiungere una nuova scadenza su Firestore
scadenzaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nuovaScadenza = {
        titolo: inputTitolo.value,
        data: inputData.value,
        importo: parseFloat(inputImporto.value),
        creatoIl: new Date()
    };

    try {
        await addDoc(collection(db, "scadenze"), nuovaScadenza);
        scadenzaForm.reset();
        caricaScadenze(); // Ricarica la lista aggiornata
    } catch (error) {
        alert("Errore nel salvataggio della scadenza: " + error.message);
    }
});

// Funzione per eliminare una scadenza da Firestore
async function eliminaScadenza(id) {
    try {
        await deleteDoc(doc(db, "scadenze", id));
        caricaScadenze(); // Ricarica la lista aggiornata
    } catch (error) {
        alert("Errore durante l'eliminazione: " + error.message);
    }
}
