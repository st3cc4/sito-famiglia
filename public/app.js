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

// Selezione Elementi DOM
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const authForm = document.getElementById('auth-form');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const rememberCheck = document.getElementById('remember-check');
const forgotPasswordBtn = document.getElementById('forgot-password-btn');
const greetingTitle = document.getElementById('greeting-title');
const btnLogout = document.getElementById('btn-logout');

const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const navButtons = document.querySelectorAll('.nav-btn');
const pageSections = document.querySelectorAll('.page-section');

const scadenzaForm = document.getElementById('scadenza-form');
const inputTitolo = document.getElementById('titolo');
const inputData = document.getElementById('data');
const inputImporto = document.getElementById('importo');
const listaScadenze = document.getElementById('lista-scadenze');
const summaryScadenze = document.getElementById('home-summary-scadenze');

// Gestione Sidebar Toggle
toggleSidebarBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
});

// Cambio Schermata/Scheda
function mostraSezione(targetId) {
    pageSections.forEach(sec => sec.classList.remove('active'));
    navButtons.forEach(btn => btn.classList.remove('active'));

    const activeSec = document.getElementById(targetId);
    if(activeSec) activeSec.classList.add('active');

    const activeBtn = document.querySelector(`.nav-btn[data-target="${targetId}"]`);
    if(activeBtn) activeBtn.classList.add('active');
}

navButtons.forEach(btn => {
    btn.addEventListener('click', () => mostraSezione(btn.dataset.target));
});

document.querySelectorAll('.link-goto, .btn-back-home').forEach(btn => {
    btn.addEventListener('click', () => mostraSezione(btn.dataset.target));
});

// Gestione Autenticazione
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

forgotPasswordBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = authEmailInput.value;
    if (!email) {
        alert("Inserisci prima la tua email nel campo apposito.");
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        alert("Email per il recupero password inviata!");
    } catch (error) {
        alert("Errore: " + error.message);
    }
});

btnLogout.addEventListener('click', async () => {
    try { await signOut(auth); } catch (error) { console.error(error); }
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        authContainer.style.display = 'none';
        appContainer.style.display = 'flex';
        
        // Estraiamo il nome prima della @ dell'email
        const username = user.email.split('@')[0];
        greetingTitle.textContent = `Ciao, ${username}`;
        
        caricaScadenze();
    } else {
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
        authForm.reset();
    }
});

// --- LOGICA DELLE SCADENZE SMART PER LA HOME ---
async function caricaScadenze() {
    listaScadenze.innerHTML = '<p class="text-muted">Caricamento in corso...</p>';
    summaryScadenze.innerHTML = '<p class="text-muted">Caricamento in corso...</p>';
    
    try {
        const q = query(collection(db, "scadenze"), orderBy("data", "asc"));
        const querySnapshot = await getDocs(q);
        
        listaScadenze.innerHTML = '';
        const items = [];

        querySnapshot.forEach((docSnap) => {
            items.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (items.length === 0) {
            listaScadenze.innerHTML = '<p class="text-muted">Nessuna scadenza inserita.</p>';
            summaryScadenze.innerHTML = '<p class="text-muted">Nessuna scadenza presente.</p>';
            return;
        }

        // Popolamento lista completa nella scheda Scadenze
        items.forEach((scadenza) => {
            const li = document.createElement('li');
            li.className = 'elemento-lista';
            li.innerHTML = `
                <div>
                    <strong>${scadenza.titolo}</strong>
                    <p class="text-muted">📅 ${scadenza.data} | 💶 € ${Number(scadenza.importo).toFixed(2)}</p>
                </div>
                <button class="btn-elimina" data-id="${scadenza.id}">Fatto</button>
            `;
            li.querySelector('.btn-elimina').addEventListener('click', () => eliminaScadenza(scadenza.id));
            listaScadenze.appendChild(li);
        });

        // Generazione Riassunto Smart per la Home
        elaboraRiassuntoHome(items);

    } catch (error) {
        console.error(error);
        summaryScadenze.innerHTML = '<p class="text-muted">Errore nel caricamento.</p>';
    }
}

function elaboraRiassuntoHome(items) {
    const oggi = new Date();
    oggi.setHours(0,0,0,0);

    // Calcolo giorni rimanenti per ogni scadenza
    const calcolate = items.map(item => {
        const dataScad = new Date(item.data);
        const diffTempo = dataScad - oggi;
        const diffGiorni = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));
        return { ...item, diffGiorni };
    });

    // Categoria Rosso: <= 7 giorni o già scadute
    const rosse = calcolate.filter(i => i.diffGiorni <= 7);
    
    if (rosse.length > 0) {
        renderSummaryItems(rosse, 'status-red');
        return;
    }

    // Categoria Arancione: entro 14 giorni
    const arancioni = calcolate.filter(i => i.diffGiorni > 7 && i.diffGiorni <= 14);
    if (arancioni.length > 0) {
        renderSummaryItems(arancioni, 'status-orange');
        return;
    }

    // Categoria Verde: dai 21 giorni in su (o comunque le successive)
    const verdi = calcolate.filter(i => i.diffGiorni > 14);
    if (verdi.length > 0) {
        renderSummaryItems(verdi, 'status-green');
        return;
    }

    summaryScadenze.innerHTML = '<p class="text-muted">Tutto in regola!</p>';
}

function renderSummaryItems(lista, cssClass) {
    summaryScadenze.innerHTML = '';
    lista.forEach(item => {
        const div = document.createElement('div');
        div.className = `scadenza-badge-item ${cssClass}`;
        div.innerHTML = `
            <span><strong>${item.titolo}</strong> (${item.data})</span>
            <strong>€ ${Number(item.importo).toFixed(2)}</strong>
        `;
        summaryScadenze.appendChild(div);
    });
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
        alert("Errore nel salvataggio: " + error.message);
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
