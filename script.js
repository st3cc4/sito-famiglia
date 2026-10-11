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
    updateDoc,
    getDoc
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

const ADMIN_EMAIL = "stpa79@gmail.com"; 

let nomeUtenteCorrente = "Utente";
let coloreUtenteCorrente = "#3b82f6";
let mappaColoriUtenti = {}; 

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

// Modale Scadenze
const btnApriModal = document.getElementById('btn-apri-modal');
const btnChiudiModal = document.getElementById('btn-chiudi-modal');
const modalScadenza = document.getElementById('modal-scadenza');
const modalTitle = document.getElementById('modal-title');
const scadenzaForm = document.getElementById('scadenza-form');
const inputTitolo = document.getElementById('titolo');
const inputData = document.getElementById('data');
const inputImporto = document.getElementById('importo');
const listaScadenze = document.getElementById('lista-scadenze');
const summaryScadenze = document.getElementById('home-summary-scadenze');
const totaleGeneraleScadenze = document.getElementById('totale-generale-scadenze');

const inputScattaFoto = document.getElementById('input-scatta-foto');
const inputCaricaFoto = document.getElementById('input-carica-foto');
const ocrLoading = document.getElementById('ocr-loading');
const ocrProgress = document.getElementById('ocr-progress');

// Modale Appuntamenti & Calendario Settimanale
const btnApriModalAppuntamento = document.getElementById('btn-apri-modal-appuntamento');
const btnChiudiModalAppuntamento = document.getElementById('btn-chiudi-modal-appuntamento');
const modalAppuntamento = document.getElementById('modal-appuntamento');
const modalAppuntamentoTitle = document.getElementById('modal-appuntamento-title');
const appuntamentoForm = document.getElementById('appuntamento-form');
const appIdInput = document.getElementById('app-id');
const appTitolo = document.getElementById('app-titolo');
const appData = document.getElementById('app-data');
const appOraInizio = document.getElementById('app-ora-inizio');
const appOraFine = document.getElementById('app-ora-fine');
const appCreatore = document.getElementById('app-creatore');
const summaryAppuntamenti = document.getElementById('home-summary-appuntamenti');
const gridSettimanale = document.getElementById('grid-settimanale');
const btnPrevWeek = document.getElementById('btn-prev-week');
const btnNextWeek = document.getElementById('btn-next-week');
const settimanaLabel = document.getElementById('settimana-label');

// Gestione Ricette
const btnApriModalRicetta = document.getElementById('btn-apri-modal-ricetta');
const btnChiudiModalRicetta = document.getElementById('btn-chiudi-modal-ricetta');
const modalRicetta = document.getElementById('modal-ricetta');
const modalRicettaTitle = document.getElementById('modal-ricetta-title');
const ricettaForm = document.getElementById('ricetta-form');
const ricettaIdInput = document.getElementById('ricetta-id');
const ricettaNomeInput = document.getElementById('ricetta-nome');
const containerIngredienti = document.getElementById('container-ingredienti');
const btnAggiungiIngrediente = document.getElementById('btn-aggiungi-ingrediente');
const containerProcedimento = document.getElementById('container-procedimento');
const btnAggiungiPasso = document.getElementById('btn-aggiungi-passo');
const ricettaNoteInput = document.getElementById('ricetta-note');
const ricettaPreferitaInput = document.getElementById('ricetta-preferita');
const listaRicette = document.getElementById('lista-ricette');
const summaryRicette = document.getElementById('home-summary-ricette');

// Gestione Utenti
const utenteForm = document.getElementById('utente-form');
const userEmailInput = document.getElementById('user-email-input');
const userNameInput = document.getElementById('user-name-input');
const userColorInput = document.getElementById('user-color-input');
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

function formatoDataEuropeo(dataIso) {
    if (!dataIso) return '';
    const parti = dataIso.split('-');
    if (parti.length !== 3) return dataIso;
    return `${parti[2]}/${parti[1]}/${parti[0]}`;
}

function formatCapitalize(str) {
    if (!str) return '';
    const trimmed = str.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function getInizioSettimana(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
}

let dataInizioSettimanaCorrente = getInizioSettimana(new Date());

// Navigazione Settimane Calendario
btnPrevWeek.addEventListener('click', () => {
    dataInizioSettimanaCorrente.setDate(dataInizioSettimanaCorrente.getDate() - 7);
    caricaAppuntamenti();
});

btnNextWeek.addEventListener('click', () => {
    dataInizioSettimanaCorrente.setDate(dataInizioSettimanaCorrente.getDate() + 7);
    caricaAppuntamenti();
});

// Modali ed Eventi Form
btnApriModal.addEventListener('click', () => {
    modalTitle.textContent = "Nuova Scadenza";
    scadenzaForm.reset();
    delete scadenzaForm.dataset.editId;
    modalScadenza.style.display = 'flex';
});

btnChiudiModal.addEventListener('click', () => {
    modalScadenza.style.display = 'none';
});

btnApriModalAppuntamento.addEventListener('click', () => {
    modalAppuntamentoTitle.textContent = "Nuovo Appuntamento";
    appuntamentoForm.reset();
    appIdInput.value = "";
    appCreatore.value = nomeUtenteCorrente;
    modalAppuntamento.style.display = 'flex';
});

btnChiudiModalAppuntamento.addEventListener('click', () => {
    modalAppuntamento.style.display = 'none';
});

// Gestione modale Ricetta
btnApriModalRicetta.addEventListener('click', () => {
    modalRicettaTitle.textContent = "Nuova Ricetta";
    ricettaForm.reset();
    ricettaIdInput.value = "";
    containerIngredienti.innerHTML = "";
    containerProcedimento.innerHTML = "";
    aggiungiRigaIngrediente();
    aggiungiRigaPasso();
    modalRicetta.style.display = 'flex';
});

btnChiudiModalRicetta.addEventListener('click', () => {
    modalRicetta.style.display = 'none';
});

function aggiungiRigaIngrediente(valore = "") {
    const div = document.createElement('div');
    div.className = 'dynamic-row-input';
    div.innerHTML = `
        <span style="font-weight: bold; color: #64748b;">•</span>
        <input type="text" class="input-ingrediente" value="${valore}" placeholder="Es. 200g di farina" required>
        <button type="button" class="btn-rimuovi-riga" onclick="this.parentElement.remove()">&times;</button>
    `;
    containerIngredienti.appendChild(div);
}

function aggiungiRigaPasso(valore = "") {
    const numeroPassi = containerProcedimento.children.length + 1;
    const div = document.createElement('div');
    div.className = 'dynamic-row-input';
    div.innerHTML = `
        <span class="numero-passo-label" style="font-weight: bold; color: #3b82f6; min-width: 20px;">${numeroPassi}.</span>
        <input type="text" class="input-passo" value="${valore}" placeholder="Es. Mescolare uova e zucchero" required>
        <button type="button" class="btn-rimuovi-riga" onclick="rimuoviPasso(this)">&times;</button>
    `;
    containerProcedimento.appendChild(div);
}

window.rimuoviPasso = function(btn) {
    btn.parentElement.remove();
    aggiornaNumeriPassi();
}

function aggiornaNumeriPassi() {
    const righe = containerProcedimento.querySelectorAll('.dynamic-row-input');
    righe.forEach((riga, index) => {
        const etichetta = riga.querySelector('.numero-passo-label');
        if (etichetta) etichetta.textContent = `${index + 1}.`;
    });
}

btnAggiungiIngrediente.addEventListener('click', () => aggiungiRigaIngrediente());
btnAggiungiPasso.addEventListener('click', () => aggiungiRigaPasso());

// Autenticazione
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

onAuthStateChanged(auth, async (user) => {
    if (user) {
        authContainer.style.display = 'none';
        appContainer.style.display =
