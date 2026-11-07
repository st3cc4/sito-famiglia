import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, collection, getDocs, addDoc, doc, deleteDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAtMnKhhfC43J73kVm8-QcNghqzOTV6UKA",
    authDomain: "sito-famiglia.firebaseapp.com",
    projectId: "sito-famiglia",
    storageBucket: "sito-famiglia.appspot.com",
    messagingSenderId: "93216467751",
    appId: "1:93216467751:web:9930052845521ca5ef895a",
    measurementId: "G-NYRQJDTWM3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let utentiCollezioni = {};
let listaScadenze = [];

export async function initScadenzeSection(container) {
    await caricaUtenti();
    await caricaEDisegnaScadenze(container);
}

async function caricaUtenti() {
    try {
        const utentiSnapshot = await getDocs(collection(db, "utenti"));
        utentiCollezioni = {};
        utentiSnapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data.nome) {
                utentiCollezioni[data.nome.toLowerCase()] = data.colore || '#3498db';
            }
        });
    } catch (e) {
        console.error("Errore caricamento utenti:", e);
    }
}

function hexToRgba(hex, alpha = 0.12) {
    if (!hex) return `rgba(52, 152, 219, ${alpha})`;
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(char => char + char).join('');
    const num = parseInt(c, 16);
    if (isNaN(num)) return `rgba(52, 152, 219, ${alpha})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formattaDataLeggibile(dataIsoStr) {
    if (!dataIsoStr) return 'Data non specificata';
    try {
        const d = new Date(dataIsoStr);
        if (isNaN(d.getTime())) return dataIsoStr.split('T')[0];
        
        const options = { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' };
        let formatted = d.toLocaleDateString('it-IT', options);
        return capitalize(formatted);
    } catch (e) {
        return dataIsoStr;
    }
}

async function caricaEDisegnaScadenze(container) {
    container.innerHTML = `
        <div class="scadenze-container">
            <div class="section-header-actions" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                <div class="header-left-group" style="display: flex; align-items: center; gap: 12px;">
                    <button id="btn-torna-home" class="btn-outline" title="Torna alla Home">
                        <i class="fa-solid fa-arrow-left"></i> Home
                    </button>
                    <h2 style="margin: 0;"><i class="fa-solid fa-file-invoice-dollar"></i> GESTIONE SCADENZE</h2>
                </div>
                <div class="scadenze-actions" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                    <input type="text" id="search-scadenze" class="search-media-input" placeholder="Cerca scadenza...">
                    <button class="btn-add-media btn-primary" id="btn-nuova-scadenza">
                        <i class="fa-solid fa-circle-plus"></i> Nuova Scadenza
                    </button>
                </div>
            </div>

            <div id="scadenze-lista-container" style="display: flex; flex-direction: column; gap: 15px;">
                <p style="color: #64748b; padding: 20px;">Caricamento in corso...</p>
            </div>
        </div>
    `;

    const btnTornaHome = container.querySelector('#btn-torna-home');
    if (btnTornaHome) {
        btnTornaHome.addEventListener('click', () => {
            if (typeof window.selezionaScheda === 'function') {
                window.selezionaScheda('dashboard');
            }
        });
    }

    document.getElementById('btn-nuova-scadenza').addEventListener('click', () => {
        apriModaleFormScadenza();
    });

    const searchInput = document.getElementById('search-scadenze');
    searchInput.addEventListener('input', (e) => {
        const queryStr = e.target.value.toLowerCase().trim();
        renderTabellaScadenze(queryStr);
    });

    try {
        const snap = await getDocs(collection(db, "scadenze"));
        listaScadenze = [];
        snap.forEach(docSnap => {
            listaScadenze.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        listaScadenze.sort((a, b) => new Date(a.dataScadenza || '9999-12-31') - new Date(b.dataScadenza || '9999-12-31'));
        renderTabellaScadenze('');

    } catch (err) {
        console.error("Errore caricamento scadenze:", err);
        document.getElementById('scadenze-lista-container').innerHTML = '<p style="color:red;">Errore durante il caricamento delle scadenze.</p>';
    }
}

function renderTabellaScadenze(filtro) {
    const container = document.getElementById('scadenze-lista-container');
    if (!container) return;

    const filtrate = listaScadenze.filter(s => {
        const titolo = (s.titolo || '').toLowerCase();
        return titolo.includes(filtro);
    });

    if (filtrate.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8; font-style:italic; padding: 10px;">Nessuna scadenza trovata.</p>';
        return;
    }

    let html = '';
    filtrate.forEach(s => {
        const creatore = s.creatore || 'Utente';
        const coloreUtente = utentiCollezioni[creatore.toLowerCase()] || '#3498db';
        const bgTrasparente = hexToRgba(coloreUtente, 0.12);
        
        const oggi = new Date();
        oggi.setHours(0,0,0,0);
        const dataScad = new Date(s.dataScadenza);
        dataScad.setHours(0,0,0,0);

        const diffGiorni = Math.ceil((dataScad - oggi) / (1000 * 60 * 60 * 24));
        
        let statoClasse = 'green';
        let statoTesto = `Scade tra ${diffGiorni} giorni`;
        if (s.pagata) {
            statoClasse = 'green';
            statoTesto = 'Pagata / Risolta';
        } else if (diffGiorni < 0) {
            statoClasse = 'red';
            statoTesto = `Scaduta da ${Math.abs(diffGiorni)} giorni!`;
        } else if (diffGiorni === 0) {
            statoClasse = 'red';
            statoTesto = 'Scade OGGI!';
        } else if (diffGiorni <= 5) {
            statoClasse = 'orange';
            statoTesto = `Scade tra ${diffGiorni} giorni`;
        }

        html += `
            <div class="scadenza-item ${statoClasse}" style="background-color: ${bgTrasparente}; border-left-color: ${coloreUtente}; padding: 15px; border-radius: 8px; border-left-width: 5px; border-style: solid; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h4 style="margin: 0 0 4px 0; font-size: 1rem; color: #1e293b;">${s.titolo}</h4>
                        <span style="font-size: 0.85rem; color: #64748b;">Inserito da: (${creatore})</span>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 1.1rem; font-weight: bold; color: #1e293b;">€ ${Number(s.importo || 0).toFixed(2)}</span>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.05); flex-wrap: wrap; gap: 8px;">
                    <div>
                        <span style="font-size: 0.82rem; font-weight: 600; color: #475569;"><i class="fa-regular fa-calendar"></i> ${formattaDataLeggibile(s.dataScadenza)}</span>
                        <span style="margin-left: 10px; font-size: 0.82rem; font-weight: bold;" class="scadenza-status">${statoTesto}</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-outline btn-toggle-pagata" data-id="${s.id}" data-pagata="${s.pagata ? 'true' : 'false'}" style="padding: 4px 10px; font-size: 0.8rem;">
                            ${s.pagata ? '<i class="fa-solid fa-rotate-left"></i> Segna da pagare' : '<i class="fa-solid fa-check"></i> Segna Pagata'}
                        </button>
                        <button class="btn-outline btn-delete-scadenza" data-id="${s.id}" title="Elimina" style="padding: 4px 8px; font-size: 0.8rem; color: #e74c3c; border-color: #e74c3c;">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.btn-toggle-pagata').forEach(btn => {
        btn.addEventListener('click', async () => {
            const idS = btn.getAttribute('data-id');
            const statoAttuale = btn.getAttribute('data-pagata') === 'true';
            try {
                await updateDoc(doc(db, "scadenze", idS), { pagata: !statoAttuale });
                const contentArea = document.getElementById('content-area');
                await caricaEDisegnaScadenze(contentArea);
            } catch (err) {
                console.error("Errore aggiornamento scadenza:", err);
                alert("Impossibile aggiornare lo stato.");
            }
        });
    });

    container.querySelectorAll('.btn-delete-scadenza').forEach(btn => {
        btn.addEventListener('click', async () => {
            const idS = btn.getAttribute('data-id');
            if (confirm("Vuoi eliminare questa scadenza?")) {
                try {
                    await deleteDoc(doc(db, "scadenze", idS));
                    const contentArea = document.getElementById('content-area');
                    await caricaEDisegnaScadenze(contentArea);
                } catch (err) {
                    console.error("Errore eliminazione scadenza:", err);
                    alert("Impossibile eliminare.");
                }
            }
        });
    });
}

function apriModaleFormScadenza() {
    const savedUser = localStorage.getItem('famiglia_session') || sessionStorage.getItem('famiglia_session');
    const userData = savedUser ? JSON.parse(savedUser) : { nome: 'Utente' };

    const modalId = 'modal-form-scadenza';
    const prevModal = document.getElementById(modalId);
    if (prevModal) prevModal.remove();

    const modalHtml = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>Nuova Scadenza / Bolletta</h3>
                    <button class="btn-close-modal" id="btn-close-form-scad">&times;</button>
                </div>
                
                <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px dashed #cbd5e1; margin-bottom: 15px; text-align: center;">
                    <p style="font-size: 0.85rem; color: #475569; margin-bottom: 8px;"><i class="fa-solid fa-wand-magic-sparkles" style="color: #3498db;"></i> Hai una bolletta o un avviso cartaceo?</p>
                    <button type="button" id="btn-scansiona-ocr" class="btn-outline" style="font-size: 0.85rem; width: 100%;">
                        <i class="fa-solid fa-camera"></i> Scansiona con OCR (Estrai dati)
                    </button>
                    <input type="file" id="input-ocr-file" accept="image/*" style="display: none;">
                    <div id="ocr-status" style="font-size: 0.78rem; color: #64748b; margin-top: 6px;"></div>
                </div>

                <form id="form-scadenza">
                    <div class="form-group" style="margin-bottom: 12px;">
                        <label for="scad-titolo">Titolo / Nome Scadenza</label>
                        <input type="text" id="scad-titolo" required placeholder="Es. Enel Energia, Affitto, Assicurazione..." style="width:100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;">
                    </div>

                    <div class="form-group" style="margin-bottom: 12px;">
                        <label for="scad-importo">Importo (€)</label>
                        <input type="number" step="0.01" id="scad-importo" required placeholder="0.00" style="width:100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;">
                    </div>

                    <div class="form-group" style="margin-bottom: 15px;">
                        <label for="scad-data">Data di Scadenza</label>
                        <input type="date" id="scad-data" required style="width:100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;">
                    </div>

                    <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 8px;">
                        <button type="button" class="btn-modal cancel" id="btn-cancel-scad">Annulla</button>
                        <button type="submit" class="btn-modal save" id="btn-save-scad">Salva Scadenza</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalEl = document.getElementById(modalId);
    document.getElementById('btn-close-form-scad').addEventListener('click', () => modalEl.remove());
    document.getElementById('btn-cancel-scad').addEventListener('click', () => modalEl.remove());

    const btnOcr = document.getElementById('btn-scansiona-ocr');
    const inputOcr = document.getElementById('input-ocr-file');
    const ocrStatus = document.getElementById('ocr-status');

    btnOcr.addEventListener('click', () => inputOcr.click());

    inputOcr.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        ocrStatus.textContent = "Caricamento libreria OCR e analisi in corso...";
        btnOcr.disabled = true;

        try {
            if (!window.Tesseract) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            ocrStatus.textContent = "Lettura del testo dalla foto...";
            const worker = await Tesseract.createWorker('ita+eng');
            const ret = await worker.recognize(file);
            await worker.terminate();

            const testoRiconosciuto = ret.data.text;
            ocrStatus.textContent = "Analisi dati completata!";
            btnOcr.disabled = false;

            // Estrazione automatica Importo
            const regexImporto = /(?:totale|eur|€)\s*[:\.]?\s*(\d+[.,]\d{2})/i;
            const matchImporto = testoRiconosciuto.match(regexImporto);
            if (matchImporto && matchImporto[1]) {
                document.getElementById('scad-importo').value = matchImporto[1].replace(',', '.');
            } else {
                const numeriTrovati = testoRiconosciuto.match(/\b\d+[.,]\d{2}\b/g);
                if (numeriTrovati && numeriTrovati.length > 0) {
                    document.getElementById('scad-importo').value = numeriTrovati[numeriTrovati.length - 1].replace(',', '.');
                }
            }

            // Estrazione automatica Data
            const regexData = /\b(0[1-9]|[12]\d|3[01])[\/\-\.](0[1-9]|1[0-2])[\/\-\.](\d{2,4})\b/;
            const matchData = testoRiconosciuto.match(regexData);
            if (matchData) {
                let anno = matchData[3];
                if (anno.length === 2) anno = '20' + anno;
                const mese = matchData[2];
                const giorno = matchData[1];
                document.getElementById('scad-data').value = `${anno}-${mese}-${giorno}`;
            }

        } catch (err) {
            console.error("Errore OCR:", err);
            ocrStatus.textContent = "Errore durante la lettura dell'immagine.";
            btnOcr.disabled = false;
        }
    });

    const form = document.getElementById('form-scadenza');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const titolo = document.getElementById('scad-titolo').value.trim();
        const importo = parseFloat(document.getElementById('scad-importo').value);
        const dataScadenza = document.getElementById('scad-data').value;

        if (!titolo || isNaN(importo) || !dataScadenza) {
            alert("Compila tutti i campi obbligatori.");
            return;
        }

        const payload = {
            titolo: titolo,
            importo: importo,
            dataScadenza: dataScadenza,
            pagata: false,
            creatore: userData.nome || 'Utente',
            dataCreazione: new Date().toISOString()
        };

        try {
            await addDoc(collection(db, "scadenze"), payload);

            if (typeof window.inviaNotificaFamiglia === 'function') {
                window.inviaNotificaFamiglia(
                    "📅 Nuova Scadenza Inserita",
                    `${userData.nome || 'Un utente'} ha aggiunto la scadenza "${titolo}" di € ${importo.toFixed(2)}.`
                );
            }

            modalEl.remove();
            const contentArea = document.getElementById('content-area');
            await caricaEDisegnaScadenze(contentArea);

        } catch (err) {
            console.error("Errore salvataggio scadenza:", err);
            alert("Errore durante il salvataggio.");
        }
    });
}
