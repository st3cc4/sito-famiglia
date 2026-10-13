import { 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc, 
    updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { nomeUtenteCorrente } from "./auth.js";

const listaScadenze = document.getElementById('lista-scadenze');
const summaryScadenze = document.getElementById('home-summary-scadenze');
const totaleGeneraleScadenze = document.getElementById('totale-generale-scadenze');
const modalScadenza = document.getElementById('modal-scadenza');
const modalTitle = document.getElementById('modal-title');
const scadenzaForm = document.getElementById('scadenza-form');
const inputTitolo = document.getElementById('titolo');
const inputData = document.getElementById('data');
const inputImporto = document.getElementById('importo');

const inputScattaFoto = document.getElementById('input-scatta-foto');
const inputCaricaFoto = document.getElementById('input-carica-foto');
const ocrLoading = document.getElementById('ocr-loading');
const ocrProgress = document.getElementById('ocr-progress');

function formatoDataEuropeo(dataIso) {
    if (!dataIso) return '';
    const parti = dataIso.split('-');
    if (parti.length !== 3) return dataIso;
    return `${parti[2]}/${parti[1]}/${parti[0]}`;
}

export async function caricaScadenze() {
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
        let totaleComplessivo = 0;
        
        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);

        if (scadenze.length === 0) {
            listaScadenze.innerHTML = `<p class="text-muted">Nessuna scadenza inserita.</p>`;
            summaryScadenze.innerHTML = `<p class="text-muted">Nessuna scadenza in arrivo.</p>`;
            totaleGeneraleScadenze.textContent = `Totale da pagare: € 0.00`;
            return;
        }

        let scadenzeCalcolate = scadenze.map(s => {
            totaleComplessivo += Number(s.importo || 0);
            
            const dataScadObj = new Date(s.data);
            dataScadObj.setHours(0, 0, 0, 0);
            const diffTempo = dataScadObj - oggi;
            const diffGiorni = Math.round(diffTempo / (1000 * 60 * 60 * 24));

            let stringaGiorni = "";
            let statusClass = "status-green";

            if (diffGiorni <= 7) {
                // Rosso: scaduta o entro 7 giorni
                statusClass = "status-red";
                if (diffGiorni < 0) {
                    const giorniPassati = Math.abs(diffGiorni);
                    stringaGiorni = `Scaduta da ${giorniPassati} ${giorniPassati === 1 ? 'giorno' : 'giorni'}`;
                } else if (diffGiorni === 0) {
                    stringaGiorni = `Scade oggi!`;
                } else {
                    stringaGiorni = `Mancano ${diffGiorni} giorni`;
                }
            } else if (diffGiorni >= 8 && diffGiorni <= 14) {
                // Arancione: 8-14 giorni
                statusClass = "status-orange";
                stringaGiorni = `Mancano ${diffGiorni} giorni`;
            } else {
                // Verde: 15+ giorni
                statusClass = "status-green";
                stringaGiorni = `Mancano ${diffGiorni} giorni`;
            }

            return { ...s, diffGiorni, stringaGiorni, statusClass };
        });

        // Lista nella pagina Scadenze
        scadenzeCalcolate.forEach(s => {
            const creatoreScadenza = s.creatore ? s.creatore : "Famiglia";
            htmlScadenze += `
                <li class="scadenza-badge-item ${s.statusClass}">
                    <div>
                        <strong>${s.titolo}</strong> - Scad: ${formatoDataEuropeo(s.data)} (${s.stringaGiorni}) - <strong>€ ${Number(s.importo).toFixed(2)}</strong> <span style="font-size: 0.85rem; font-weight: normal; color: #475569; margin-left: 6px;">[${creatoreScadenza}]</span>
                    </div>
                    <div class="azioni-utente">
                        <button class="btn-modifica" onclick="modificaScadenza('${s.id}', '${s.titolo}', '${s.data}', '${s.importo}')">Mod.</button>
                        <button class="btn-elimina" onclick="eliminaScadenza('${s.id}')">Elimina</button>
                    </div>
                </li>`;
        });

        // Selezione per la Home
        const scadenzeRosse = scadenzeCalcolate.filter(s => s.statusClass === 'status-red');
        const scadenzeArancioni = scadenzeCalcolate.filter(s => s.statusClass === 'status-orange');
        const scadenzeVerdi = scadenzeCalcolate.filter(s => s.statusClass === 'status-green');

        let scadenzeDaMostrareInHome = [];
        if (scadenzeRosse.length > 0) {
            scadenzeDaMostrareInHome = scadenzeRosse;
        } else if (scadenzeArancioni.length > 0) {
            scadenzeDaMostrareInHome = scadenzeArancioni;
        } else {
            scadenzeDaMostrareInHome = scadenzeVerdi;
        }

        // Layout stile "Appuntamenti" con blocco colorato
        let htmlHomeSummary = "";
        scadenzeDaMostrareInHome.forEach(s => {
            htmlHomeSummary += `
                <div class="scadenza-block-style ${s.statusClass}">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${s.titolo}</strong> <span style="font-size: 0.85rem; opacity: 0.85;">(${formatoDataEuropeo(s.data)}) - ${s.stringaGiorni}</span>
                        </div>
                        <div style="font-weight: bold; font-size: 0.95rem;">€ ${Number(s.importo).toFixed(2)}</div>
                    </div>
                </div>`;
        });

        listaScadenze.innerHTML = htmlScadenze;
        summaryScadenze.innerHTML = htmlHomeSummary || `<p class="text-muted">Nessuna scadenza in programma.</p>`;
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
