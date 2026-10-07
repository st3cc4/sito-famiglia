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
import { GoogleGenAI } from "https://esm.run/@google/genai";

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
const ai = new GoogleGenAI({ apiKey: "AIzaSyAtMnKhhfC43J73kVm8-QcNghqzOTV6UKA" });

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

// Scadenze elementi
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

// Appuntamenti elementi
const btnApriModalApp = document.getElementById('btn-apri-modal-app');
const btnChiudiModalApp = document.getElementById('btn-chiudi-modal-app');
const modalAppuntamento = document.getElementById('modal-appuntamento');
const appuntamentoForm = document.getElementById('appuntamento-form');
const appTitolo = document.getElementById('app-titolo');
const appData = document.getElementById('app-data');
const appOrario = document.getElementById('app-orario');
const listaAppuntamenti = document.getElementById('lista-appuntamenti');
const summaryAppuntamenti = document.getElementById('home-summary-appuntamenti');

const inputScattaFoto = document.getElementById('input-scatta-foto');
const inputCaricaFoto = document.getElementById('input-carica-foto');
const ocrLoading = document.getElementById('ocr-loading');

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

// Modale Scadenze
btnApriModal.addEventListener('click', () => {
    modalTitle.textContent = "Nuova Scadenza";
    scadenzaForm.reset();
    modalScadenza.style.display = 'flex';
});
btnChiudiModal.addEventListener('click', () => { modalScadenza.style.display = 'none'; });

// Modale Appuntamenti
btnApriModalApp.addEventListener('click', () => {
    appuntamentoForm.reset();
    modalAppuntamento.style.display = 'flex';
});
btnChiudiModalApp.addEventListener('click', () => { modalAppuntamento.style.display = 'none'; });

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
    if (!email) { alert("Inserisci prima la tua email nel campo apposito."); return; }
    try {
        await sendPasswordResetEmail(auth, email);
        alert("Email per il recupero password inviata!");
    } catch (error) { alert("Errore: " + error.message); }
});

btnLogout.addEventListener('click', async () => {
    try { await signOut(auth); } catch (error) { console.error(error); }
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        authContainer.style.display = 'none';
        appContainer.style.display = 'flex';

        let nomeVisualizzato = user.email.split('@')[0];
        let permessi = { scadenze: true, appuntamenti: true, media: true, ricette: true };

        try {
            const userDoc = await getDoc(doc(db, "utenti", user.email));
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.nome) nomeVisualizzato = data.nome;
                if (data.permessi) permessi = data.permessi;
            }
        } catch (err) { console.error(err); }

        greetingTitle.textContent = `Ciao, ${nomeVisualizzato}`;

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

async function elaboraImmagineConOCR(file) {
    ocrLoading.style.display = 'block';
    try {
        const base64Data = await fileToGenerativePart(file);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { inlineData: { mimeType: file.type, data: base64Data } },
                { text: "Estrai da questa bolletta o documento i seguenti 3 dati in formato esatto JSON con chiavi 'titolo', 'data' (in formato YYYY-MM-DD) e 'importo' (solo numero decimale)." }
            ]
        });
        const testoRisposta = response.text;
        const jsonPulito = testoRisposta.replace(/```json/g, '').replace(/```/g, '').trim();
        const datiEstratti = JSON.parse(jsonPulito);

        if (datiEstratti.titolo) inputTitolo.value = formatCapitalize(datiEstratti.titolo);
        if (datiEstratti.data) inputData.value = datiEstratti.data;
        if (datiEstratti.importo) inputImporto.value = datiEstratti.importo;
    } catch (error) {
        console.error(error);
        alert("Impossibile estrarre automaticamente i dati dalla foto.");
    } finally {
        ocrLoading.style.display = 'none';
    }
}

function fileToGenerativePart(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

inputScattaFoto.addEventListener('change', (e) => { if (e.target.files[0]) elaboraImmagineConOCR(e.target.files[0]); });
inputCaricaFoto.addEventListener('change', (e) => { if (e.target.files[0]) elaboraImmagineConOCR(e.target.files[0]); });

// GESTIONE UTENTI
utenteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = userEmailInput.value.trim().toLowerCase();
    const nome = formatCapitalize(userNameInput.value);
    const permessi = { scadenze: permScadenze.checked, appuntamenti: permAppuntamenti.checked, media: permMedia.checked, ricette: permRicette.checked };

    try {
        await setDoc(doc(db, "utenti", email), { email, nome, permessi });
        alert(`Utente ${nome} salvato con successo!`);
        utenteForm.reset();
        userEmailInput.removeAttribute('readonly');
        caricaListaUtenti();
    } catch (error) { alert("Errore: " + error.message); }
});

async function caricaListaUtenti() {
    listaUtenti.innerHTML = '<p class="text-muted">Caricamento...</p>';
    try {
        const querySnapshot = await getDocs(collection(db, "utenti"));
        listaUtenti.innerHTML = '';
        if (querySnapshot.empty) { listaUtenti.innerHTML = '<p class="text-muted">Nessun utente.</p>'; return; }

        querySnapshot.forEach((docSnap) => {
            const u = docSnap.data();
            const p = u.permessi || {};
            const li = document.createElement('li');
            li.className = 'elemento-lista';
            li.innerHTML = `
                <div>
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
    if (confirm(`Rimuovere ${email}?`)) {
        try { await deleteDoc(doc(db, "utenti", email)); caricaListaUtenti(); } catch (error) { alert(error.message); }
    }
}

// LOGICA SCADENZE
async function caricaScadenze() {
    listaScadenze.innerHTML = '<p class="text-muted">Caricamento...</p>';
    summaryScadenze.innerHTML = '<p class="text-muted">Caricamento...</p>';
    
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

            const li = document.createElement('li');
            li.className = `elemento-lista scadenza-badge-item ${cssClass}`;
            li.innerHTML = `
                <div>
                    <strong>${scadenza.titolo}</strong>
                    <p style="font-size: 0.85rem; margin-top: 2px;">📅 ${scadenza.data} (${scadenza.diffGiorni <= 0 ? 'Scaduta!' : scadenza.diffGiorni + ' giorni'})</p>
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
    } catch (error) { console.error(error); }
}

function elaboraRiassuntoHome(items) {
    let gruppoSelezionato = [];
    let cssTrovato = 'status-green';
    const rosse = items.filter(i => i.diffGiorni <= 7);
    if (rosse.length > 0) { gruppoSelezionato = rosse; cssTrovato = 'status-red'; }
    else {
        const arancioni = items.filter(i => i.diffGiorni > 7 && i.diffGiorni <= 14);
        if (arancioni.length > 0) { gruppoSelezionato = arancioni; cssTrovato = 'status-orange'; }
        else {
            const verdi = items.filter(i => i.diffGiorni > 14);
            if (verdi.length > 0) { gruppoSelezionato = verdi; cssTrovato = 'status-green'; }
        }
    }
    if (gruppoSelezionato.length === 0) { summaryScadenze.innerHTML = '<p class="text-muted">Tutto in regola!</p>'; return; }
    renderSummaryItems(gruppoSelezionato, cssTrovato);
}

function renderSummaryItems(lista, cssClass) {
    summaryScadenze.innerHTML = '';
    let sommaParziale = 0;
    lista.forEach(item => {
        sommaParziale += item.importoNum;
        const div = document.createElement('div');
        div.className = `scadenza-badge-item ${cssClass}`;
        div.innerHTML = `<span><strong>${item.titolo}</strong> (${item.data})</span><strong>€ ${item.importoNum.toFixed(2)}</strong>`;
        summaryScadenze.appendChild(div);
    });
    const divTotale = document.createElement('div');
    divTotale.className = 'home-totale-riga';
    divTotale.innerHTML = `Totale visualizzato: <strong>€ ${sommaParziale.toFixed(2)}</strong>`;
    summaryScadenze.appendChild(divTotale);
}

scadenzaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await addDoc(collection(db, "scadenze"), {
            titolo: formatCapitalize(inputTitolo.value),
            data: inputData.value,
            importo: parseFloat(inputImporto.value),
            creatoIl: new Date()
        });
        scadenzaForm.reset();
        modalScadenza.style.display = 'none';
        caricaScadenze();
    } catch (error) { alert(error.message); }
});

async function eliminaScadenza(id) {
    try { await deleteDoc(doc(db, "scadenze", id)); caricaScadenze(); } catch (error) { alert(error.message); }
}

// --- LOGICA APPUNTAMENTI ---
async function caricaAppuntamenti() {
    listaAppuntamenti.innerHTML = '<p class="text-muted">Caricamento...</p>';
    summaryAppuntamenti.innerHTML = '<p class="text-muted">Caricamento...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "appuntamenti"));
        const items = [];
        querySnapshot.forEach((docSnap) => { items.push({ id: docSnap.id, ...docSnap.data() }); });

        // Ordinamento per data e orario crescenti
        items.sort((a, b) => new Date(`${a.data}T${a.orario}`) - new Date(`${b.data}T${b.orario}`));

        listaAppuntamenti.innerHTML = '';
        if (items.length === 0) {
            listaAppuntamenti.innerHTML = '<p class="text-muted">Nessun appuntamento inserito.</p>';
            summaryAppuntamenti.innerHTML = '<p class="text-muted">Nessun appuntamento per questa settimana.</p>';
            return;
        }

        items.forEach((app) => {
            const li = document.createElement('li');
            li.className = 'elemento-lista appuntamento-item';
            li.innerHTML = `
                <div>
                    <strong>${app.titolo}</strong>
                    <p style="font-size: 0.85rem; margin-top: 2px;">📅 ${app.data} ⏰ ${app.orario}</p>
                </div>
                <button class="btn-elimina" data-id="${app.id}">Elimina</button>
            `;
            li.querySelector('.btn-elimina').addEventListener('click', () => eliminaAppuntamento(app.id));
            listaAppuntamenti.appendChild(li);
        });

        elaboraRiassuntoAppuntamentiHome(items);
    } catch (error) { console.error(error); }
}

function elaboraRiassuntoAppuntamentiHome(items) {
    const oggi = new Date();
    oggi.setHours(0,0,0,0);

    // Calcolo inizio settimana corrente (Lunedì) e fine settimana (Domenica)
    const giornoSettimana = oggi.getDay(); // 0 = Domenica, 1 = Lunedì, ecc.
    const diffAInizio = oggi.getDate() - giornoSettimana + (giornoSettimana === 0 ? -6 : 1);
    const inizioSettimana = new Date(oggi.setDate(diffAInizio));
    inizioSettimana.setHours(0,0,0,0);

    const fineSettimana = new Date(inizioSettimana);
    fineSettimana.setDate(fineSettimana.getDate() + 6);
    fineSettimana.setHours(23,59,59,999);

    // Filtriamo gli appuntamenti della settimana corrente
    const appSettimana = items.filter(i => {
        const d = new Date(i.data);
        return d >= inizioSettimana && d <= fineSettimana;
    });

    summaryAppuntamenti.innerHTML = '';
    if (appSettimana.length === 0) {
        summaryAppuntamenti.innerHTML = '<p class="text-muted">Nessun appuntamento per questa settimana.</p>';
        return;
    }

    appSettimana.forEach(app => {
        const div = document.createElement('div');
        div.className = 'scadenza-badge-item status-green';
        div.innerHTML = `<span><strong>${app.titolo}</strong> (${app.data})</span><strong>⏰ ${app.orario}</strong>`;
        summaryAppuntamenti.appendChild(div);
    });
}

appuntamentoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await addDoc(collection(db, "appuntamenti"), {
            titolo: formatCapitalize(appTitolo.value),
            data: appData.value,
            orario: appOrario.value,
            creatoIl: new Date()
        });
        appuntamentoForm.reset();
        modalAppuntamento.style.display = 'none';
        caricaAppuntamenti();
    } catch (error) { alert(error.message); }
});

async function eliminaAppuntamento(id) {
    try {
        await deleteDoc(doc(db, "appuntamenti", id));
        caricaAppuntamenti();
    } catch (error) { alert(error.message); }
}
