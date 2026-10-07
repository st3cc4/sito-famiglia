import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    sendPasswordResetEmail
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

const firebaseConfig = {
    apiKey: "AIzaSyAtMnKhhfC43J73kVm8-QcNghqzOTV6UKA",
    authDomain: "sito-famiglia.firebaseapp.com",
    projectId: "sito-famiglia",
    storageBucket: "sito-famigliastorage.app",
    messagingSenderId: "93216467751",
    appId: "1:93216467751:web:9930052845521ca5ef895a",
    measurementId: "G-NYRQJDTWM3"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const authForm = document.getElementById('auth-form');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const rememberCheck = document.getElementById('remember-check');
const forgotPasswordBtn = document.getElementById('forgot-password-btn');
const userEmailDisplay = document.getElementById('user-email-display');
const btnLogout = document.getElementById('btn-logout');

const scadenzaForm = document.getElementById('scadenza-form');
const inputTitolo = document.getElementById('titolo');
const inputData = document.getElementById('data');
const inputImporto = document.getElementById('importo');
const listaScadenze = document.getElementById('lista-scadenze');

// Gestione del Login
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = authEmailInput.value;
    const password = authPasswordInput.value;

    const persistenceType = rememberCheck.checked ? browserLocalPersistence : browserSessionPersistence;

    try {
        await setPersistence(auth, persistenceType);
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        alert("Errore di accesso: controlla email o password.");
    }
});

// Funzione per il recupero password tramite email
forgotPasswordBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = authEmailInput.value;
    
    if (!email) {
        alert("Inserisci prima la tua email nel campo apposito, poi clicca su 'Password dimenticata?'.");
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        alert("Ti è stata inviata un'email con le istruzioni per reimpostare la password.");
    } catch (error) {
        alert("Errore durante l'invio dell'email di recupero: " + error.message);
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

// Controllo dello stato di autenticazione
onAuthStateChanged(auth, (user) => {
    if (user) {
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        userEmailDisplay.textContent = user.email;
        caricaScadenze();
    } else {
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
        authForm.reset();
    }
});

// --- GESTIONE FIRESTORE ---

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

            li.querySelector('.btn-elimina').addEventListener('click', () => eliminaScadenza(id));
            listaScadenze.appendChild(li);
        });
    } catch (error) {
        console.error("Errore nel caricamento delle scadenze: ", error);
        listaScadenze.innerHTML = '<p style="text-align: center; color: #ef4444; padding: 10px;">Errore nel caricamento dei dati.</p>';
    }
}

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
        caricaScadenze();
    } catch (error) {
        alert("Errore nel salvataggio della scadenza: " + error.message);
    }
});

async function eliminaScadenza(id) {
    try {
        await deleteDoc(doc(db, "scadenze", id));
        caricaScadenze();
    } catch (error) {
        alert("Errore durante l'eliminazione: " + error.message);
    }
}
