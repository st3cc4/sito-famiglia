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

// Modale Appuntamenti
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
const listaAppuntamenti = document.getElementById('lista-appuntamenti');
const summaryAppuntamenti = document.getElementById('home-summary-appuntamenti');

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

// Funzione utile per formattare la data da ISO (YYYY-MM-DD) a Europea (DD/MM/YYYY)
function formatoDataEuropeo(dataIso) {
    if (!dataIso) return '';
    const parti = dataIso.split('-');
    if (parti.length !== 3) return dataIso;
    return `${parti[2]}/${parti[1]}/${parti[0]}`;
}

// Modale Scadenze Eventi
btnApriModal.addEventListener('click', () => {
    modalTitle.textContent = "Nuova Scadenza";
    scadenzaForm.reset();
    modalScadenza.style.display = 'flex';
});

btnChiudiModal.addEventListener('click', () => {
    modalScadenza.style.display = 'none';
});

// Modale Appuntamenti Eventi
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

        gestisciVisibilitaSezione('sec-scadenze', 'menu-scadenze', 'card-sec-scadenze', permessi.scadenze);
        gestisciVisibilitaSezione('sec-appuntamenti', 'menu-appuntamenti', 'card-sec-appuntamenti', permessi.appuntamenti);
        gestisciVisibilitaSezione('sec-media', 'menu-media', 'card-sec-media', permessi.media);
        gestisciVisibilitaSezione('sec-ricette', 'menu-ricette', 'card-sec-ricette', permessi.ricette);

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

function formatCapitalize(str) {
    if (!str) return '';
    const trimmed = str.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

// --- LOGICA AUTOMATICA ORARIO FINE (+1 ORA) ---
appOraInizio.addEventListener('change', () => {
    const inizio = appOraInizio.value;
    if (inizio) {
        const [ore, minuti] = inizio.split(':').map(Number);
        let nuoveOre = ore + 1;
        if (nuoveOre >= 24) nuoveOre = 23; // Evita overflow oltre mezzanotte
        const oreStr = String(nuoveOre).padStart(2, '0');
        const minStr = String(minuti).padStart(2, '0');
        appOraFine.value = `${oreStr}:${minStr}`;
    }
});

// --- LOGICA APPUNTAMENTI ---
appuntamentoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = appIdInput.value;
    const titolo = formatCapitalize(appTitolo.value);
    const data = appData.value;
    const oraInizio = appOraInizio.value;
    const oraFine = appOraFine.value;
    const creatore = nomeUtenteCorrente;

    try {
        if (id) {
            await updateDoc(doc(db, "appuntamenti", id), {
                titolo,
                data,
                oraInizio,
                oraFine
            });
            alert("Appuntamento aggiornato con successo!");
        } else {
            await addDoc(collection(db, "appuntamenti"), {
                titolo,
                data,
                oraInizio,
                oraFine,
                creatore,
                creatoIl: new Date()
            });
        }
        appuntamentoForm.reset();
        modalAppuntamento.style.display = 'none';
        caricaAppuntamenti();
    } catch (error) {
        alert("Errore nel salvataggio appuntamento: " + error.message);
    }
});

async function caricaAppuntamenti() {
    listaAppuntamenti.innerHTML = '<p class="text-muted">Caricamento in corso...</p>';
    summaryAppuntamenti.innerHTML = '<p class="text-muted">Caricamento in corso...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "appuntamenti"));
        const oggi = new Date();
        oggi.setHours(0,0,0,0);

        const items = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const diffGiorni = Math.ceil((new Date(data.data) - oggi) / (1000 * 60 * 60 * 24));
            items.push({ id: docSnap.id, ...data, diffGiorni });
        });

        // ORDINAMENTO CORRETTO: In base alla data e all'orario di inizio (cronologico)
        items.sort((a, b) => {
            const dataOraA = new Date(`${a.data}T${a.oraInizio || '00:00'}`);
            const dataOraB = new Date(`${b.data}T${b.oraInizio || '00:00'}`);
            return dataOraA - dataOraB;
        });

        listaAppuntamenti.innerHTML = '';
        if (items.length === 0) {
            listaAppuntamenti.innerHTML = '<p class="text-muted">Nessun appuntamento inserito.</p>';
            summaryAppuntamenti.innerHTML = '<p class="text-muted">Nessun appuntamento recente.</p>';
            return;
        }

        items.forEach((app) => {
            const creatoreNome = app.creatore || 'Famiglia';
            const coloreCreatore = mappaColoriUtenti[creatoreNome] || '#3b82f6';
            const dataEur = formatoDataEuropeo(app.data);

            const li = document.createElement('li');
            li.className = 'elemento-lista';
            li.innerHTML = `
                <div>
                    <strong style="font-size: 1.05rem; color: ${coloreCreatore};">${app.titolo}</strong>
                    <p style="font-size: 0.9rem; margin-top: 4px; color: #334155; font-weight: 500;">
                        📅 <strong>${dataEur}</strong> | ⏰ <strong>${app.oraInizio} - ${app.oraFine}</strong> | 
                        <span class="badge-utente" style="background-color: ${coloreCreatore};"></span> Creato da: <strong>${creatoreNome}</strong>
                    </p>
                </div>
                <div class="azioni-utente">
                    <button class="btn-modifica" data-id="${app.id}">Modifica</button>
                    <button class="btn-elimina" data-id="${app.id}">Elimina</button>
                </div>
            `;

            li.querySelector('.btn-modifica').addEventListener('click', () => {
                modalAppuntamentoTitle.textContent = "Modifica Appuntamento";
                appIdInput.value = app.id;
                appTitolo.value = app.titolo;
                appData.value = app.data;
                appOraInizio.value = app.oraInizio;
                appOraFine.value = app.oraFine;
                appCreatore.value = creatoreNome;
                modalAppuntamento.style.display = 'flex';
            });

            li.querySelector('.btn-elimina').addEventListener('click', () => eliminaAppuntamento(app.id));
            listaAppuntamenti.appendChild(li);
        });

        // Mostra il prossimo appuntamento nella Home
        const prossimo = items.find(i => i.diffGiorni >= 0) || items[0];
        const coloreProssimo = mappaColoriUtenti[prossimo.creatore] || '#3b82f6';
        const dataProssimaEur = formatoDataEuropeo(prossimo.data);

        summaryAppuntamenti.innerHTML = `
            <div style="padding: 12px; background: #f8fafc; border-radius: 8px; border-left: 4px solid ${coloreProssimo};">
                <strong style="font-size: 1rem; color: ${coloreProssimo};">${prossimo.titolo}</strong>
                <p style="font-size: 0.9rem; margin-top: 4px; color: #334155; font-weight: 600;">📅 ${dataProssimaEur} (${prossimo.oraInizio} - ${prossimo.oraFine})</p>
                <p style="font-size: 0.85rem; color: #475569; margin-top: 2px;"><span class="badge-utente" style="background-color: ${coloreProssimo};"></span> Creato da: <strong>${prossimo.creatore || 'Famiglia'}</strong></p>
            </div>
        `;

    } catch (error) {
        console.error(error);
        summaryAppuntamenti.innerHTML = '<p class="text-muted">Errore nel caricamento.</p>';
    }
}

async function eliminaAppuntamento(id) {
    if (confirm("Vuoi eliminare questo appuntamento?")) {
        try {
            await deleteDoc(doc(db, "appuntamenti", id));
            caricaAppuntamenti();
        } catch (error) {
            alert("Errore durante l'eliminazione: " + error.message);
        }
    }
}

// --- OCR ORIGINALE SCADENZE ---
async function elaboraImmagineConTesseract(file) {
    ocrLoading.style.display = 'block';
    ocrProgress.textContent = '0%';
    try {
        const result = await Tesseract.recognize(file, 'ita', {
            logger: m => {
                if (m.status === 'recognizing text') {
                    ocrProgress.textContent = Math.round(m.progress * 100) + '%';
                }
            }
        });
        const testo = result.data.text.toLowerCase();
        if (testo.includes("enel")) inputTitolo.value = "Enel";
        else if (testo.includes("dolomiti")) inputTitolo.value = "Dolomiti Energia";
    } catch (error) {
        console.error(error);
    } finally {
        ocrLoading.style.display = 'none';
    }
}

inputScattaFoto.addEventListener('change', (e) => {
    if (e.target.files[0]) elaboraImmagineConTesseract(e.target.files[0]);
});

inputCaricaFoto.addEventListener('change', (e) => {
    if (e.target.files[0]) elaboraImmagineConTesseract(e.target.files[0]);
});

// GESTIONE UTENTI (ADMIN)
utenteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = userEmailInput.value.trim().toLowerCase();
    const nome = formatCapitalize(userNameInput.value);
    const colore = userColorInput.value;
    const permessi = {
        scadenze: permScadenze.checked,
        appuntamenti: permAppuntamenti.checked,
        media: permMedia.checked,
        ricette: permRicette.checked
    };

    try {
        await setDoc(doc(db, "utenti", email), { email, nome, colore, permessi });
        alert(`Utente ${nome} salvato con successo!`);
        utenteForm.reset();
        userColorInput.value = "#3b82f6";
        userEmailInput.removeAttribute('readonly');
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
            const p = u.permessi || {};
            const coloreU = u.colore || '#3b82f6';

            const li = document.createElement('li');
            li.className = 'elemento-lista';
            li.innerHTML = `
                <div>
                    <span class="badge-utente" style="background-color: ${coloreU}; width: 12px; height: 12px;"></span>
                    <strong>${u.nome}</strong> <span class="text-muted">(${u.email})</span>
                </div>
                <div class="azioni-utente">
                    <button class="btn-modifica">Modifica</button>
                    <button class="btn-elimina">Elimina</button>
                </div>
            `;

            li.querySelector('.btn-modifica').addEventListener('click', () => {
                userEmailInput.value = u.email;
                userEmailInput.setAttribute('readonly', true);
                userNameInput.value = u.nome;
                userColorInput.value = u.colore || '#3b82f6';
                permScadenze.checked = !!p.scadenze;
                permAppuntamenti.checked = !!p.appuntamenti;
                permMedia.checked = !!p.media;
                permRicette.checked = !!p.ricette;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            li.querySelector('.btn-elimina').addEventListener('click', () => eliminaUtente(u.email));
            listaUtenti.appendChild(li);
        });
    } catch (error) { console.error(error); }
}

async function eliminaUtente(email) {
    if (confirm(`Vuoi rimuovere la configurazione per ${email}?`)) {
        try {
            await deleteDoc(doc(db, "utenti", email));
            userEmailInput.removeAttribute('readonly');
            utenteForm.reset();
            caricaListaUtenti();
        } catch (error) { alert("Errore durante l'eliminazione: " + error.message); }
    }
}

// LOGICA SCADENZE
async function caricaScadenze() {
    listaScadenze.innerHTML = '<p class="text-muted">Caricamento in corso...</p>';
    summaryScadenze.innerHTML = '<p class="text-muted">Caricamento in corso...</p>';
    
    try {
        const querySnapshot = await getDocs(collection(db, "scadenze"));
        const oggi = new Date();
        oggi.setHours(0,0,0,0);

        let sommaTotaleGenerale = 0;
        const items = [];
        
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const diffGiorni = Math.ceil((new Date(data.data) - oggi) / (1000 * 60 * 60 * 24));
            const importoNum = Number(data.importo) || 0;
            
            sommaTotaleGenerale += importoNum;
            items.push({ id: docSnap.id, ...data, diffGiorni, importoNum });
        });

        totaleGeneraleScadenze.textContent = `Totale da pagare: € ${sommaTotaleGenerale.toFixed(2)}`;
        items.sort((a, b) => a.diffGiorni - b.diffGiorni);

        listaScadenze.innerHTML = '';
        if (items.length === 0) {
            listaScadenze.innerHTML = '<p class="text-muted">Nessuna scadenza inserita.</p>';
            summaryScadenze.innerHTML = '<p class="text-muted">Tutto in regola!</p>';
            return;
        }

        items.forEach((scadenza) => {
            let cssClass = 'status-green';
            if (scadenza.diffGiorni <= 7) cssClass = 'status-red';
            else if (scadenza.diffGiorni <= 14) cssClass = 'status-orange';

            const creatoreScad = scadenza.creatore || 'Famiglia';
            const coloreScad = mappaColoriUtenti[creatoreScad] || '#3b82f6';
            const dataEur = formatoDataEuropeo(scadenza.data);

            const li = document.createElement('li');
            li.className = `elemento-lista scadenza-badge-item ${cssClass}`;
            li.innerHTML = `
                <div>
                    <strong style="color: ${coloreScad};">${scadenza.titolo}</strong>
                    <p style="font-size: 0.85rem; margin-top: 2px;">
                        📅 Scadenza: ${dataEur} (${scadenza.diffGiorni <= 0 ? 'Scaduta!' : scadenza.diffGiorni + ' giorni'}) | 
                        <span class="badge-utente" style="background-color: ${coloreScad};"></span> ${creatoreScad}
                    </p>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <strong>💶 € ${scadenza.importoNum.toFixed(2)}</strong>
                    <button class="btn-elimina" data-id="${scadenza.id}">Fatto</button>
                </div>
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
    let gruppoSelezionato = [];
    let cssTrovato = 'status-green';

    const rosse = items.filter(i => i.diffGiorni <= 7);
    if (rosse.length > 0) {
        gruppoSelezionato = rosse;
        cssTrovato = 'status-red';
    } else {
        const arancioni = items.filter(i => i.diffGiorni > 7 && i.diffGiorni <= 14);
        if (arancioni.length > 0) {
            gruppoSelezionato = arancioni;
            cssTrovato = 'status-orange';
        } else {
            const verdi = items.filter(i => i.diffGiorni > 14);
            if (verdi.length > 0) {
                gruppoSelezionato = verdi;
                cssTrovato = 'status-green';
            }
        }
    }

    if (gruppoSelezionato.length === 0) {
        summaryScadenze.innerHTML = '<p class="text-muted">Tutto in regola!</p>';
        return;
    }

    renderSummaryItems(gruppoSelezionato, cssTrovato);
}

function renderSummaryItems(lista, cssClass) {
    summaryScadenze.innerHTML = '';
    let sommaParziale = 0;

    lista.forEach(item => {
        sommaParziale += item.importoNum;
        const creatoreItem = item.creatore || 'Famiglia';
        const coloreItem = mappaColoriUtenti[creatoreItem] || '#3b82f6';
        const dataEur = formatoDataEuropeo(item.data);

        const div = document.createElement('div');
        div.className = `scadenza-badge-item ${cssClass}`;
        div.innerHTML = `<span><span class="badge-utente" style="background-color: ${coloreItem};"></span><strong style="color: ${coloreItem};">${item.titolo}</strong> (${dataEur})</span><strong>€ ${item.importoNum.toFixed(2)}</strong>`;
        summaryScadenze.appendChild(div);
    });

    const divTotale = document.createElement('div');
    divTotale.className = 'home-totale-riga';
    divTotale.innerHTML = `Totale visualizzato: <strong>€ ${sommaParziale.toFixed(2)}</strong>`;
    summaryScadenze.appendChild(divTotale);
}

scadenzaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titoloFormattato = formatCapitalize(inputTitolo.value);

    try {
        await addDoc(collection(db, "scadenze"), {
            titolo: titoloFormattato,
            data: inputData.value,
            importo: parseFloat(inputImporto.value),
            creatore: nomeUtenteCorrente,
            creatoIl: new Date()
        });
        scadenzaForm.reset();
        modalScadenza.style.display = 'none';
        caricaScadenze();
    } catch (error) { alert("Errore: " + error.message); }
});

async function eliminaScadenza(id) {
    try {
        await deleteDoc(doc(db, "scadenze", id));
        caricaScadenze();
    } catch (error) { alert("Errore durante l'eliminazione: " + error.message); }
}
