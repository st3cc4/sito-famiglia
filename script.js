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
let dataInizioSettimanaCorrente = getInizioSettimana(new Date());

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
        appContainer.style.display = 'flex';

        let nomeVisualizzato = user.email.split('@')[0];
        let coloreUtente = "#3b82f6";
        let permessi = { scadenze: true, appuntamenti: true, media: true, ricette: true };

        try {
            const utentiSnapshot = await getDocs(collection(db, "utenti"));
            utentiSnapshot.forEach(docSnap => {
                const uData = docSnap.data();
                if (uData.nome && uData.colore) {
                    mappaColoriUtenti[uData.nome] = uData.colore;
                }
            });

            const userDoc = await getDoc(doc(db, "utenti", user.email));
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.nome) nomeVisualizzato = data.nome;
                if (data.colore) coloreUtente = data.colore;
                if (data.permessi) permessi = data.permessi;
            }
        } catch (err) {
            console.error("Errore lettura profilo utente", err);
        }

        nomeUtenteCorrente = formatCapitalize(nomeVisualizzato);
        coloreUtenteCorrente = coloreUtente;
        
        document.documentElement.style.setProperty('--user-primary', coloreUtenteCorrente);
        greetingTitle.textContent = `Ciao, ${nomeUtenteCorrente}`;

        if (user.email === ADMIN_EMAIL) {
            menuUtenti.style.display = 'flex';
            caricaListaUtenti();
        } else {
            menuUtenti.style.display = 'none';
        }

        caricaScadenze();
        caricaAppuntamenti();
    } else {
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
        authForm.reset();
    }
});

appOraInizio.addEventListener('change', () => {
    const inizio = appOraInizio.value;
    if (inizio) {
        const [ore, minuti] = inizio.split(':').map(Number);
        let nuoveOre = ore + 1;
        if (nuoveOre >= 24) nuoveOre = 23; 
        const oreStr = String(nuoveOre).padStart(2, '0');
        const minStr = String(minuti).padStart(2, '0');
        appOraFine.value = `${oreStr}:${minStr}`;
    }
});

// --- GESTIONE SCADENZE & OCR ---
scadenzaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titolo = inputTitolo.value.trim();
    const data = inputData.value;
    const importo = parseFloat(inputImporto.value);
    const editId = scadenzaForm.dataset.editId;

    try {
        if (editId) {
            await updateDoc(doc(db, "scadenze", editId), { titolo, data, importo });
        } else {
            await addDoc(collection(db, "scadenze"), { titolo, data, importo, creatore: nomeUtenteCorrente });
        }
        modalScadenza.style.display = 'none';
        scadenzaForm.reset();
        delete scadenzaForm.dataset.editId;
        caricaScadenze();
    } catch (err) {
        alert("Errore nel salvataggio della scadenza.");
    }
});

async function caricaScadenze() {
    listaScadenze.innerHTML = `<p class="text-muted">Caricamento in corso...</p>`;
    summaryScadenze.innerHTML = `<p class="text-muted">Caricamento in corso...</p>`;
    
    try {
        const querySnapshot = await getDocs(collection(db, "scadenze"));
        let scadenze = [];
        querySnapshot.forEach(docSnap => {
            scadenze.push({ id: docSnap.id, ...docSnap.data() });
        });

        scadenze.sort((a, b) => new Date(a.data) - new Date(b.data));

        let htmlScadenze = "";
        let htmlHomeSummary = "";
        let totaleComplessivo = 0;
        
        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);

        if (scadenze.length === 0) {
            listaScadenze.innerHTML = `<p class="text-muted">Nessuna scadenza inserita.</p>`;
            summaryScadenze.innerHTML = `<p class="text-muted">Nessuna scadenza in arrivo.</p>`;
            totaleGeneraleScadenze.textContent = `Totale da pagare: € 0.00`;
            return;
        }

        scadenze.forEach(s => {
            totaleComplessivo += Number(s.importo || 0);
            
            const dataScadObj = new Date(s.data);
            dataScadObj.setHours(0, 0, 0, 0);
            const diffTempo = dataScadObj - oggi;
            const diffGiorni = Math.round(diffTempo / (1000 * 60 * 60 * 24));

            let stringaGiorni = "";
            let statusClass = "status-green";

            if (diffGiorni < 0) {
                statusClass = "status-red";
                const giorniPassati = Math.abs(diffGiorni);
                stringaGiorni = `Scaduta da ${giorniPassati} ${giorniPassati === 1 ? 'giorno' : 'giorni'}`;
            } else if (diffGiorni === 0) {
                statusClass = "status-orange";
                stringaGiorni = `Scade oggi!`;
            } else if (diffGiorni === 1) {
                statusClass = "status-orange";
                stringaGiorni = `Manca 1 giorno`;
            } else {
                stringaGiorni = `Mancano ${diffGiorni} giorni`;
            }

            const creatoreScadenza = s.creatore ? s.creatore : "Famiglia";

            const rigaHtml = `
                <li class="scadenza-badge-item ${statusClass}">
                    <div>
                        <strong>${s.titolo}</strong> - Scad: ${formatoDataEuropeo(s.data)} (${stringaGiorni}) - <strong>€ ${Number(s.importo).toFixed(2)}</strong> <span style="font-size: 0.9rem; font-weight: normal; color: #475569; margin-left: 10px;">[Inserita da: ${creatoreScadenza}]</span>
                    </div>
                    <div class="azioni-utente">
                        <button class="btn-modifica" onclick="modificaScadenza('${s.id}', '${s.titolo}', '${s.data}', '${s.importo}')">Mod.</button>
                        <button class="btn-elimina" onclick="eliminaScadenza('${s.id}')">Elimina</button>
                    </div>
                </li>`;
            htmlScadenze += rigaHtml;
        });

        let scadenzeHome = scadenze.slice(0, 3);
        scadenzeHome.forEach(s => {
            const dataScadObj = new Date(s.data);
            dataScadObj.setHours(0, 0, 0, 0);
            const diffTempo = dataScadObj - oggi;
            const diffGiorni = Math.round(diffTempo / (1000 * 60 * 60 * 24));

            let stringaGiorni = "";
            let statusClass = "status-green";

            if (diffGiorni < 0) {
                statusClass = "status-red";
                const giorniPassati = Math.abs(diffGiorni);
                stringaGiorni = `Scaduta da ${giorniPassati} ${giorniPassati === 1 ? 'giorno' : 'giorni'}`;
            } else if (diffGiorni === 0) {
                statusClass = "status-orange";
                stringaGiorni = `Scade oggi!`;
            } else if (diffGiorni === 1) {
                statusClass = "status-orange";
                stringaGiorni = `Manca 1 giorno`;
            } else {
                stringaGiorni = `Mancano ${diffGiorni} giorni`;
            }

            htmlHomeSummary += `
                <div class="scadenza-summary-badge ${statusClass}">
                    <div>
                        <strong>${s.titolo}</strong> (${formatoDataEuropeo(s.data)}) - <span style="font-size: 0.85rem; font-weight: normal;">${stringaGiorni}</span>
                    </div>
                    <div style="font-weight: bold;">€ ${Number(s.importo).toFixed(2)}</div>
                </div>`;
        });

        listaScadenze.innerHTML = htmlScadenze;
        summaryScadenze.innerHTML = htmlHomeSummary || `<p class="text-muted">Nessuna scadenza in arrivo.</p>`;
        totaleGeneraleScadenze.textContent = `Totale da pagare: € ${totaleComplessivo.toFixed(2)}`;

    } catch (err) {
        listaScadenze.innerHTML = `<p class="text-muted">Errore nel caricamento delle scadenze.</p>`;
        summaryScadenze.innerHTML = `<p class="text-muted">Errore caricamento.</p>`;
    }
}

window.eliminaScadenza = async function(id) {
    if (confirm("Vuoi eliminare questa scadenza?")) {
        await deleteDoc(doc(db, "scadenze", id));
        caricaScadenze();
    }
}

window.modificaScadenza = function(id, titolo, data, importo) {
    modalTitle.textContent = "Modifica Scadenza";
    inputTitolo.value = titolo;
    inputData.value = data;
    inputImporto.value = importo;
    scadenzaForm.dataset.editId = id;
    modalScadenza.style.display = 'flex';
}

// Funzione OCR con Tesseract.js
async function elaboraImmagineOCR(file) {
    ocrLoading.style.display = 'block';
    ocrProgress.textContent = '0%';
    try {
        const result = await Tesseract.recognize(file, 'ita', {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const prog = Math.round(m.progress * 100);
                    ocrProgress.textContent = `${prog}%`;
                }
            }
        });
        const testo = result.data.text;
        
        const matchImporto = testo.match(/(?:[€E]?\s*)(\d+[\.,]\d{2})/);
        if (matchImporto) {
            inputImporto.value = matchImporto[1].replace(',', '.');
        }

        const matchData = testo.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
        if (matchData) {
            inputData.value = `${matchData[3]}-${matchData[2]}-${matchData[1]}`;
        }

        if (testo.toLowerCase().includes('enel')) inputTitolo.value = "Enel Energia";
        else if (testo.toLowerCase().includes('telecom') || testo.toLowerCase().includes('tim')) inputTitolo.value = "TIM / Telefono";
        else if (testo.toLowerCase().includes('acqua')) inputTitolo.value = "Bolletta Acqua";

    } catch (err) {
        alert("Errore durante la lettura OCR dell'immagine.");
    } finally {
        ocrLoading.style.display = 'none';
    }
}

inputScattaFoto.addEventListener('change', (e) => {
    if (e.target.files[0]) elaboraImmagineOCR(e.target.files[0]);
});
inputCaricaFoto.addEventListener('change', (e) => {
    if (e.target.files[0]) elaboraImmagineOCR(e.target.files[0]);
});

// --- GESTIONE APPUNTAMENTI & CALENDARIO SETTIMANALE ---
appuntamentoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titolo = appTitolo.value.trim();
    const data = appData.value;
    const oraInizio = appOraInizio.value;
    const oraFine = appOraFine.value;
    const editId = appIdInput.value;

    const datiAppuntamento = {
        titolo,
        data,
        oraInizio,
        oraFine,
        creatore: nomeUtenteCorrente
    };

    try {
        if (editId) {
            await updateDoc(doc(db, "appuntamenti", editId), datiAppuntamento);
        } else {
            await addDoc(collection(db, "appuntamenti"), datiAppuntamento);
        }
        modalAppuntamento.style.display = 'none';
        appuntamentoForm.reset();
        caricaAppuntamenti();
    } catch (err) {
        alert("Errore nel salvataggio dell'appuntamento.");
    }
});

async function caricaAppuntamenti() {
    gridSettimanale.innerHTML = `<p class="text-muted" style="padding: 20px;">Caricamento calendario...</p>`;
    summaryAppuntamenti.innerHTML = `<p class="text-muted">Caricamento in corso...</p>`;

    try {
        const querySnapshot = await getDocs(collection(db, "appuntamenti"));
        let appuntamenti = [];
        querySnapshot.forEach(docSnap => {
            appuntamenti.push({ id: docSnap.id, ...docSnap.data() });
        });

        let giorniSettimana = [];
        let curr = new Date(dataInizioSettimanaCorrente);
        for (let i = 0; i < 7; i++) {
            giorniSettimana.push(new Date(curr));
            curr.setDate(curr.getDate() + 1);
        }

        const dataInizioStr = giorniSettimana[0].toISOString().split('T')[0];
        const dataFineStr = giorniSettimana[6].toISOString().split('T')[0];

        settimanaLabel.textContent = `${formatoDataEuropeo(dataInizioStr)} - ${formatoDataEuropeo(dataFineStr)}`;

        const giorniNomi = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
        const oggiIso = new Date().toISOString().split('T')[0];

        let htmlGriglia = "";
        giorniSettimana.forEach((giornoDate, index) => {
            const isoDate = giornoDate.toISOString().split('T')[0];
            const isOggi = isoDate === oggiIso;
            const nomeGiorno = giorniNomi[index];
            const numGiorno = giornoDate.getDate();

            let appuntamentiGiorno = appuntamenti.filter(a => a.data === isoDate);
            appuntamentiGiorno.sort((a, b) => a.oraInizio.localeCompare(b.oraInizio));

            let htmlImpegni = "";
            appuntamentiGiorno.forEach(app => {
                const coloreCreatore = mappaColoriUtenti[app.creatore] || '#3b82f6';
                htmlImpegni += `
                    <div class="card-impegno-google" style="border-left-color: ${coloreCreatore};">
                        <div class="card-impegno-titolo">${app.titolo}</div>
                        <div class="card-impegno-orario">${app.oraInizio} - ${app.oraFine}</div>
                        <div class="card-impegno-creatore">Creato da: ${app.creatore}</div>
                        <div class="card-impegno-azioni">
                            <button class="btn-mini btn-mini-edit" onclick="modificaAppuntamento('${app.id}', '${app.titolo}', '${app.data}', '${app.oraInizio}', '${app.oraFine}')">Mod</button>
                            <button class="btn-mini btn-mini-del" onclick="eliminaAppuntamento('${app.id}')">Del</button>
                        </div>
                    </div>`;
            });

            htmlGriglia += `
                <div class="colonna-giorno">
                    <div class="header-giorno-moderno ${isOggi ? 'oggi' : ''}">
                        <div class="nome-giorno">${nomeGiorno}</div>
                        <div class="numero-giorno">${numGiorno}</div>
                    </div>
                    <div class="corpo-giorno-moderno">
                        ${htmlImpegni || '<span class="text-muted" style="font-size: 0.8rem;">Nessun impegno</span>'}
                    </div>
                </div>`;
        });

        gridSettimanale.innerHTML = htmlGriglia;

        let appFuturi = appuntamenti.filter(a => a.data >= oggiIso);
        appFuturi.sort((a, b) => a.data.localeCompare(b.data) || a.oraInizio.localeCompare(b.oraInizio));
        
        let htmlHomeApp = "";
        appFuturi.slice(0, 3).forEach(app => {
            htmlHomeApp += `
                <div style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between;">
                    <span><strong>${app.titolo}</strong> (${formatoDataEuropeo(app.data)} ${app.oraInizio})</span>
                    <span style="font-size: 0.85rem; color: #64748b;">${app.creatore}</span>
                </div>`;
        });
        summaryAppuntamenti.innerHTML = htmlHomeApp || `<p class="text-muted">Nessun appuntamento in programma.</p>`;

    } catch (err) {
        gridSettimanale.innerHTML = `<p class="text-muted" style="padding: 20px;">Errore nel caricamento del calendario.</p>`;
        summaryAppuntamenti.innerHTML = `<p class="text-muted">Errore caricamento.</p>`;
    }
}

window.eliminaAppuntamento = async function(id) {
    if (confirm("Vuoi eliminare questo appuntamento?")) {
        await deleteDoc(doc(db, "appuntamenti", id));
        caricaAppuntamenti();
    }
}

window.modificaAppuntamento = function(id, titolo, data, oraInizio, oraFine) {
    modalAppuntamentoTitle.textContent = "Modifica Appuntamento";
    appIdInput.value = id;
    appTitolo.value = titolo;
    appData.value = data;
    appOraInizio.value = oraInizio;
    appOraFine.value = oraFine;
    appCreatore.value = nomeUtenteCorrente;
    modalAppuntamento.style.display = 'flex';
}

// --- GESTIONE UTENTI (ADMIN) ---
utenteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = userEmailInput.value.trim().toLowerCase();
    const nome = userNameInput.value.trim();
    const colore = userColorInput.value;
    const permessi = {
        scadenze: permScadenze.checked,
        appuntamenti: permAppuntamenti.checked,
        media: permMedia.checked,
        ricette: permRicette.checked
    };

    try {
        await setDoc(doc(db, "utenti", email), { email, nome, colore, permessi });
        alert("Utente configurato con successo!");
        utenteForm.reset();
        userColorInput.value = "#3b82f6";
        caricaListaUtenti();
    } catch (err) {
        alert("Errore nel salvataggio dell'utente.");
    }
});

async function caricaListaUtenti() {
    listaUtenti.innerHTML = `<p class="text-muted">Caricamento utenti...</p>`;
    try {
        const querySnapshot = await getDocs(collection(db, "utenti"));
        let html = "";
        querySnapshot.forEach(docSnap => {
            const u = docSnap.data();
            html += `
                <li class="elemento-lista">
                    <div>
                        <span class="badge-utente" style="background-color: ${u.colore};"></span>
                        <strong>${u.nome}</strong> (${u.email})
                    </div>
                    <div>
                        <button class="btn-elimina" onclick="eliminaUtente('${docSnap.id}')">Elimina</button>
                    </div>
                </li>`;
        });
        listaUtenti.innerHTML = html || `<p class="text-muted">Nessun utente configurato.</p>`;
    } catch (err) {
        listaUtenti.innerHTML = `<p class="text-muted">Errore caricamento utenti.</p>`;
    }
}

window.eliminaUtente = async function(emailId) {
    if (confirm(`Vuoi rimuovere i permessi/configurazione per ${emailId}?`)) {
        await deleteDoc(doc(db, "utenti", emailId));
        caricaListaUtenti();
    }
}
