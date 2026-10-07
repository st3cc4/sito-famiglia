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
    setDoc,
    getDoc,
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

// Email del tuo account Amministratore principale
const ADMIN_EMAIL = "stpa79@gmail.com"; 

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
const menuUtenti = document.getElementById('menu-utenti');

const scadenzaForm = document.getElementById('scadenza-form');
const inputTitolo = document.getElementById('titolo');
const inputData = document.getElementById('data');
const inputImporto = document.getElementById('importo');
const listaScadenze = document.getElementById('lista-scadenze');
const summaryScadenze = document.getElementById('home-summary-scadenze');

const utenteForm = document.getElementById('utente-form');
const userEmailInput = document.getElementById('user-email-input');
const userNameInput = document.getElementById('user-name-input');
const permScadenze = document.getElementById('perm-scadenze');
const permAppuntamenti = document.getElementById('perm-appuntamenti');
const permMedia = document.getElementById('perm-media');
const permRicette = document.getElementById('perm-ricette');
const listaUtenti = document.getElementById('lista-utenti');

toggleSidebarBtn.addEventListener('click', () => sidebar.classList.toggle('collapsed'));

function mostraSezione(targetId) {
    pageSections.forEach(sec => sec.classList.remove('active'));
    navButtons.forEach(btn => btn.classList.remove('active'));

    const activeSec = document.getElementById(targetId);
    if(activeSec) activeSec.classList.add('active');

    const activeBtn = document.querySelector(`.nav-btn[data-target="${targetId}"]`);
    if(activeBtn) activeBtn.classList.add('active');
}

navButtons.forEach(btn => btn.addEventListener('click', () => mostraSezione(btn.dataset.target)));
document.querySelectorAll('.link-goto, .btn-back-home').forEach(btn => {
    btn.addEventListener('click', () => mostraSezione(btn.dataset.target));
});

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

// Controllo sessione utente e caricamento permessi
onAuthStateChanged(auth, async (user) => {
    if (user) {
        authContainer.style.display = 'none';
        appContainer.style.display = 'flex';

        let nomeVisualizzato = user.email.split('@')[0];
        let permessi = { scadenze: true, appuntamenti: true, media: true, ricette: true };

        // Verifichiamo se l'utente ha un profilo personalizzato in Firestore
        try {
            const userDoc = await getDoc(doc(db, "utenti", user.email));
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.nome) nomeVisualizzato = data.nome;
                if (data.permessi) permessi = data.permessi;
            }
        } catch (err) {
            console.error("Errore lettura profilo utente", err);
        }

        greetingTitle.textContent = `Ciao, ${nomeVisualizzato}`;

        // Controllo visibilità sezioni in base ai permessi
        gestisciVisibilitaSezione('sec-scadenze', 'menu-scadenze', 'card-sec-scadenze', permessi.scadenze);
        gestisciVisibilitaSezione('sec-appuntamenti', 'menu-appuntamenti', 'card-sec-appuntamenti', permessi.appuntamenti);
        gestisciVisibilitaSezione('sec-media', 'menu-media', 'card-sec-media', permessi.media);
        gestisciVisibilitaSezione('sec-ricette', 'menu-ricette', 'card-sec-ricette', permessi.ricette);

        // Se sei l'amministratore (stpa79@gmail.com), mostriamo il menu Gestione Utenti
        if (user.email === ADMIN_EMAIL) {
            menuUtenti.style.display = 'flex';
            caricaListaUtenti();
        } else {
            menuUtenti.style.display = 'none';
        }

        caricaScadenze();
    } else {
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
        authForm.reset();
    }
});

function gestisciVisibilitaSezione(secId, menuId, cardId, autorizzato) {
    const menuBtn = document.getElementById(menuId);
    const cardHome = document.getElementById(cardId);
    if (!autorizzato) {
        if (menuBtn) menuBtn.style.display = 'none';
        if (cardHome) cardHome.style.display = 'none';
    } else {
        if (menuBtn) menuBtn.style.display = 'flex';
        if (cardHome) cardHome.style.display = 'block';
    }
}

// --- GESTIONE UTENTI (ADMIN) ---
utenteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = userEmailInput.value.trim().toLowerCase();
    const nome = userNameInput.value.trim();
    const permessi = {
        scadenze: permScadenze.checked,
        appuntamenti: permAppuntamenti.checked,
        media: permMedia.checked,
        ricette: permRicette.checked
    };

    try {
        await setDoc(doc(db, "utenti", email), { email, nome, permessi });
        alert(`Utente ${nome} salvato con successo!`);
        utenteForm.reset();
        caricaListaUtenti();
    } catch (error) {
        alert("Errore nel salvataggio utente: " + error.message);
    }
});

async function caricaListaUtenti() {
    listaUtenti.innerHTML = '<p class="text-muted">Caricamento...</p>';
    try {
        const querySnapshot = await getDocs(collection(db, "utenti"));
        listaUtenti.innerHTML = '';
        if (querySnapshot.empty) {
            listaUtenti.innerHTML = '<p class="text-muted">Nessun utente configurato.</p>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const u = docSnap.data();
            const li = document.createElement('li');
            li.className = 'elemento-lista';
            li.innerHTML = `
                <div>
                    <strong>${u.nome}</strong> (${u.email})
                    <p class="text-muted">Visibilità: S:${u.permessi?.scadenze?'✔':'✖'} | A:${u.permessi?.appuntamenti?'✔':'✖'} | M:${u.permessi?.media?'✔':'✖'} | R:${u.permessi?.ricette?'✔':'✖'}</p>
                </div>
                <button class="btn-elimina" data-email="${u.email}">Elimina</button>
            `;
            li.querySelector('.btn-elimina').addEventListener('click', () => eliminaUtente(u.email));
            listaUtenti.appendChild(li);
        });
    } catch (error) {
        console.error(error);
    }
}

async function eliminaUtente(email) {
    if (confirm(`Vuoi rimuovere la configurazione per ${email}?`)) {
        try {
            await deleteDoc(doc(db, "utenti", email));
            caricaListaUtenti();
        } catch (error) {
            alert("Errore durante l'eliminazione: " + error.message);
        }
    }
}

// --- LOGICA SCADENZE ---
async function caricaScadenze() {
    listaScadenze.innerHTML = '<p class="text-muted">Caricamento in corso...</p>';
    summaryScadenze.innerHTML = '<p class="text-muted">Caricamento in corso...</p>';
    
    try {
        const q = query(collection(db, "scadenze"), orderBy("data", "asc"));
        const querySnapshot = await getDocs(q);
        
        listaScadenze.innerHTML = '';
        const items = [];
        querySnapshot.forEach((docSnap) => items.push({ id: docSnap.id, ...docSnap.data() }));

        if (items.length === 0) {
            listaScadenze.innerHTML = '<p class="text-muted">Nessuna scadenza inserita.</p>';
            summaryScadenze.innerHTML = '<p class="text-muted">Tutto in regola!</p>';
            return;
        }

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

        elaboraRiassuntoHome(items);
    } catch (error) {
        console.error(error);
        summaryScadenze.innerHTML = '<p class="text-muted">Errore nel caricamento.</p>';
    }
}

function elaboraRiassuntoHome(items) {
    const oggi = new Date();
    oggi.setHours(0,0,0,0);

    const calcolate = items.map(item => {
        const diffGiorni = Math.ceil((new Date(item.data) - oggi) / (1000 * 60 * 60 * 24));
        return { ...item, diffGiorni };
    });

    const rosse = calcolate.filter(i => i.diffGiorni <= 7);
    if (rosse.length > 0) { renderSummaryItems(rosse, 'status-red'); return; }

    const arancioni = calcolate.filter(i => i.diffGiorni > 7 && i.diffGiorni <= 14);
    if (arancioni.length > 0) { renderSummaryItems(arancioni, 'status-orange'); return; }

    const verdi = calcolate.filter(i => i.diffGiorni > 14);
    if (verdi.length > 0) { renderSummaryItems(verdi, 'status-green'); return; }

    summaryScadenze.innerHTML = '<p class="text-muted">Tutto in regola!</p>';
}

function renderSummaryItems(lista, cssClass) {
    summaryScadenze.innerHTML = '';
    lista.forEach(item => {
        const div = document.createElement('div');
        div.className = `scadenza-badge-item ${cssClass}`;
        div.innerHTML = `<span><strong>${item.titolo}</strong> (${item.data})</span><strong>€ ${Number(item.importo).toFixed(2)}</strong>`;
        summaryScadenze.appendChild(div);
    });
}

scadenzaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await addDoc(collection(db, "scadenze"), {
            titolo: inputTitolo.value,
            data: inputData.value,
            importo: parseFloat(inputImporto.value),
            creatoIl: new Date()
        });
        scadenzaForm.reset();
        caricaScadenze();
    } catch (error) { alert("Errore: " + error.message); }
});

async function eliminaScadenza(id) {
    try {
        await deleteDoc(doc(db, "scadenze", id));
        caricaScadenze();
    } catch (error) { alert("Errore: " + error.message); }
}
