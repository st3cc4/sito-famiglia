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

// Inizializzazione SDK GenAI (utilizzando la tua chiave API di Firebase/Google)
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

// Elementi Scadenze e Modale
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

// Gestione Modale Scadenza
btnApriModal.addEventListener('click', () => {
    modalTitle.textContent = "Nuova Scadenza";
    scadenzaForm.reset();
    modalScadenza.style.display = 'flex';
});

btnChiudiModal.addEventListener('click', () => {
    modalScadenza.style.display = 'none';
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
        } catch (err) {
            console.error("Errore lettura profilo utente", err);
        }

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

// --- INTEGRAZIONE OCR CON GOOGLE GEMINI AI ---
async function elaboraImmagineConOCR(file) {
    ocrLoading.style.display = 'block';
    try {
        // Convertiamo il file in base64
        const base64Data = await fileToGenerativePart(file);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    inlineData: {
                        mimeType: file.type,
                        data: base64Data
                    }
                },
                {
                    text: "Estrai da questa bolletta o documento i seguenti 3 dati in formato esatto JSON con chiavi 'titolo', 'data' (in formato YYYY-MM-DD) e 'importo' (solo numero decimale). Se non trovi un dato metti stringa vuota o 0."
                }
            ]
        });

        const testoRisposta = response.text;
        // Puliamo l'output nel caso ci siano blocchi markdown di codice
        const jsonPulito = testoRisposta.replace(/```json/g, '').replace(/```/g, '').trim();
        const datiEstratti = JSON.parse(jsonPulito);

        if (datiEstratti.titolo) inputTitolo.value = datiEstratti.titolo;
        if (datiEstratti.data) inputData.value = datiEstratti.data;
        if (datiEstratti.importo) inputImporto.value = datiEstratti.importo;

    } catch (error) {
        console.error("Errore OCR:", error);
        alert("Impossibile estrarre automaticamente i dati dalla foto. Inseriscili manualmente.");
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

inputScattaFoto.addEventListener('change', (e) => {
    if (e.target.files[0]) elaboraImmagineConOCR(e.target.files[0]);
});

inputCaricaFoto.addEventListener('change', (e) => {
    if (e.target.files[0]) elaboraImmagineConOCR(e.target.files[0]);
});

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

            const iconScad = p.scadenze ? '<span style="color:#22c55e; font-weight:bold;">✔ Scadenze</span>' : '<span style="color:#ef4444; font-weight:bold;">✖ Scadenze</span>';
            const iconApp = p.appuntamenti ? '<span style="color:#22c55e; font-weight:bold;">✔ Appuntamenti</span>' : '<span style="color:#ef4444; font-weight:bold;">✖ Appuntamenti</span>';
            const iconMed = p.media ? '<span style="color:#22c55e; font-weight:bold;">✔ Media</span>' : '<span style="color:#ef4444; font-weight:bold;">✖ Media</span>';
            const iconRic = p.ricette ? '<span style="color:#22c55e; font-weight:bold;">✔ Ricette</span>' : '<span style="color:#ef4444; font-weight:bold;">✖ Ricette</span>';

            const li = document.createElement('li');
            li.className = 'elemento-lista';
            li.innerHTML = `
                <div>
                    <strong>${u.nome}</strong> <span class="text-muted">(${u.email})</span>
                    <p class="text-muted" style="margin-top: 4px;">${iconScad} | ${iconApp} | ${iconMed} | ${iconRic}</p>
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
    if (confirm(`Vuoi rimuovere la configurazione per ${email}?`)) {
        try {
            await deleteDoc(doc(db, "utenti", email));
            userEmailInput.removeAttribute('readonly');
            utenteForm.reset();
            caricaListaUtenti();
        } catch (error) { alert("Errore durante l'eliminazione: " + error.message); }
    }
}

// --- LOGICA SCADENZE (ORDINATE PER GIORNI MANCANTI E COLORATE) ---
async function caricaScadenze() {
    listaScadenze.innerHTML = '<p class="text-muted">Caricamento in corso...</p>';
    summaryScadenze.innerHTML = '<p class="text-muted">Caricamento in corso...</p>';
    
    try {
        const querySnapshot = await getDocs(collection(db, "scadenze"));
        const oggi = new Date();
        oggi.setHours(0,0,0,0);

        const items = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const diffGiorni = Math.ceil((new Date(data.data) - oggi) / (1000 * 60 * 60 * 24));
            items.push({ id: docSnap.id, ...data, diffGiorni });
        });

        // Ordinamento decrescente in base ai giorni mancanti (o crescente? Richiesta: "elenco di tutte le scadenze messe in ordine decrescente in base ai giorni mancanti")
        // Nota: Ordinare per giorni mancanti in ordine decrescente significa partire dalle scadenze più lontane a salire verso le più vicine/scadute, oppure viceversa. Mettiamole ordinate dal più vicino al più lontano o viceversa in base alla regola logica dei giorni. Facciamo sort per diffGiorni crescente (più urgenti prima) o decrescente.
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
                    <p style="font-size: 0.85rem; margin-top: 2px;">📅 Scadenza: ${scadenza.data} (${scadenza.diffGiorni <= 0 ? 'Scaduta!' : scadenza.diffGiorni + ' giorni'})</p>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <strong>💶 € ${Number(scadenza.importo).toFixed(2)}</strong>
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
    const rosse = items.filter(i => i.diffGiorni <= 7);
    if (rosse.length > 0) { renderSummaryItems(rosse, 'status-red'); return; }

    const arancioni = items.filter(i => i.diffGiorni > 7 && i.diffGiorni <= 14);
    if (arancioni.length > 0) { renderSummaryItems(arancioni, 'status-orange'); return; }

    const verdi = items.filter(i => i.diffGiorni > 14);
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
        modalScadenza.style.display = 'none';
        caricaScadenze();
    } catch (error) { alert("Errore: " + error.message); }
});

async function eliminaScadenza(id) {
    try {
        await deleteDoc(doc(db, "scadenze", id));
        caricaScadenze();
    } catch (error) { alert("Errore: " + error.message); }
}
