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

btnApriModal.addEventListener('click', () => {
    modalTitle.textContent = "Nuova Scadenza";
    scadenzaForm.reset();
    modalScadenza.style.display = 'flex';
});

btnChiudiModal.addEventListener('click', () => {
    modalScadenza.style.display = 'none';
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

function formatCapitalize(str) {
    if (!str) return '';
    const trimmed = str.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

// --- OCR DEFINITIVO CORRETTO PER DATA E IMPORTO REALE ---
async function elaboraImmagineConTesseract(file) {
    ocrLoading.style.display = 'block';
    ocrProgress.textContent = '0%';

    try {
        const result = await Tesseract.recognize(file, 'ita', {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const percent = Math.round(m.progress * 100);
                    ocrProgress.textContent = percent + '%';
                }
            }
        });

        const testo = result.data.text;
        analizzaTestoBollettaMirato(testo);

    } catch (error) {
        console.error("Errore OCR:", error);
        alert("Impossibile leggere l'immagine. Inserisci i dati manualmente.");
    } finally {
        ocrLoading.style.display = 'none';
    }
}

function analizzaTestoBollettaMirato(testo) {
    const testoPulito = testo.replace(/\r\n/g, '\n');
    const linee = testoPulito.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const testoLower = testoPulito.toLowerCase();

    // 1. ENTE
    let enteTrovato = "Bolletta";
    if (testoLower.includes("dolomiti")) enteTrovato = "Dolomiti Energia";
    else if (testoLower.includes("enel")) enteTrovato = "Enel";
    else if (testoLower.includes("iren")) enteTrovato = "Iren";
    else if (testoLower.includes("hera")) enteTrovato = "Hera";
    else if (testoLower.includes("eni")) enteTrovato = "Eni Gas e Luce";
    else if (testoLower.includes("acea")) enteTrovato = "Acea";
    inputTitolo.value = formatCapitalize(enteTrovato);

    // 2. IMPORTO REALE (Cerca esclusivamente dove c'è la dicitura TOTALE DA PAGARE)
    let importoTrovato = "";
    for (let i = 0; i < linee.length; i++) {
        let linea = linee[i].toLowerCase();
        // Cerca la sezione "totale da pagare"
        if (linea.includes("totale da pagare") || linea.includes("quanto pago")) {
            // Controlla la riga stessa e le 3 successive alla ricerca di un importo con virgola (es. 1.446,22 o 147,30)
            for (let j = i; j <= Math.min(i + 3, linee.length - 1); j++) {
                const match = linee[j].match(/([0-9]{1,3}(?:\.[0-9]{3})*[.,][0-9]{2})/);
                if (match) {
                    importoTrovato = match[1].replace(/\./g, '').replace(',', '.');
                    break;
                }
            }
            if (importoTrovato) break;
        }
    }
    // Fallback generico se non trova l'etichetta ma trova un prezzo realistico (sotto i 10.000 euro)
    if (!importoTrovato) {
        for (let linea of linee) {
            const match = linea.match(/\b([1-9][0-9]{0,3}[.,][0-9]{2})\b/);
            if (match) {
                let val = parseFloat(match[1].replace(',', '.'));
                if (val < 10000) { // Evita di prendere i kWh o i metri cubi che sono cifre enormi
                    importoTrovato = match[1].replace(',', '.');
                    break;
                }
            }
        }
    }
    if (importoTrovato) inputImporto.value = importoTrovato;

    // 3. DATA DI SCADENZA REALE (Cerca esclusivamente dove c'è QUANDO SCADE o SCADE IL pagamento)
    let dataTrovata = "";
    const mesiMappa = {
        'gennaio': '01', 'febbraio': '02', 'marzo': '03', 'aprile': '04',
        'maggio': '05', 'giugno': '06', 'luglio': '07', 'agosto': '08',
        'settembre': '09', 'ottobre': '10', 'novembre': '11', 'dicembre': '12'
    };

    for (let i = 0; i < linee.length; i++) {
        let linea = linee[i].toLowerCase();
        // Cerchiamo rigorosamente il blocco di scadenza della fattura (escludendo scadenze offerte promozionali)
        if (linea.includes("quando scade") || linea.includes("scade") || linea.includes("entro il")) {
            // Se la riga contiene parole ingannevoli sull'offerta, la saltiamo
            if (linea.includes("condizioni economiche") || linea.includes("offerta")) continue;

            for (let j = i; j <= Math.min(i + 2, linee.length - 1); j++) {
                let rigaTarget = linee[j];

                // Cerca formato testuale (es. "5 agosto 2025")
                let matchTxt = rigaTarget.toLowerCase().match(/\b([0-9]{1,2})\s+([a-zà-ù]+)\s+(20\d{2})\b/);
                if (matchTxt) {
                    let giorno = matchTxt[1].padStart(2, '0');
                    let nomeMese = matchTxt[2];
                    let anno = matchTxt[3];
                    if (mesiMappa[nomeMese]) {
                        dataTrovata = `${anno}-${mesiMappa[nomeMese]}-${giorno}`;
                        break;
                    }
                }

                // Cerca formato numerico (es. 05/08/2025 o 01/04/2025)
                let matchNum = rigaTarget.match(/\b(0[1-9]|[12][0-9]|3[01])[\/\-](0[1-9]|1[0-2])[\/\-](20\d{2})\b/);
                if (matchNum) {
                    dataTrovata = `${matchNum[3]}-${matchNum[2]}-${matchNum[1]}`;
                    break;
                }
            }
            if (dataTrovata) break;
        }
    }

    if (dataTrovata) {
        inputData.value = dataTrovata;
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

// LOGICA SCADENZE E TOTALI
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

            const li = document.createElement('li');
            li.className = `elemento-lista scadenza-badge-item ${cssClass}`;
            li.innerHTML = `
                <div>
                    <strong>${scadenza.titolo}</strong>
                    <p style="font-size: 0.85rem; margin-top: 2px;">📅 Scadenza: ${scadenza.data} (${scadenza.diffGiorni <= 0 ? 'Scaduta!' : scadenza.diffGiorni + ' giorni'})</p>
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
    const titoloFormattato = formatCapitalize(inputTitolo.value);

    try {
        await addDoc(collection(db, "scadenze"), {
            titolo: titoloFormattato,
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
    } catch (error) { alert("Errore durante l'eliminazione: " + error.message); }
}
