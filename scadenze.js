import { 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc, 
    updateDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const btnApriModal = document.getElementById('btn-apri-modal');
const btnChiudiModal = document.getElementById('btn-chiudi-modal');
const modalScadenza = document.getElementById('modal-scadenza');
const modalTitle = document.getElementById('modal-title');
const scadenzaForm = document.getElementById('scadenza-form');
const titoloInput = document.getElementById('titolo');
const dataInput = document.getElementById('data');
const importoInput = document.getElementById('importo');
const listaScadenze = document.getElementById('lista-scadenze');
const totaleGeneraleEl = document.getElementById('totale-generale-scadenze');
const summaryScadenze = document.getElementById('home-summary-scadenze');

const inputScattaFoto = document.getElementById('input-scatta-foto');
const inputCaricaFoto = document.getElementById('input-carica-foto');
const ocrLoading = document.getElementById('ocr-loading');
const ocrProgress = document.getElementById('ocr-progress');

let scadenzaInModificaId = null;

if (btnApriModal) {
    btnApriModal.addEventListener('click', () => {
        modalTitle.textContent = "Nuova Scadenza";
        scadenzaForm.reset();
        scadenzaInModificaId = null;
        modalScadenza.style.display = 'flex';
    });
}

if (btnChiudiModal) {
    btnChiudiModal.addEventListener('click', () => {
        modalScadenza.style.display = 'none';
    });
}

if (scadenzaForm) {
    scadenzaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titolo = titoloInput.value.trim();
        const data = dataInput.value;
        const importo = parseFloat(importoInput.value);

        try {
            if (scadenzaInModificaId) {
                const docRef = doc(db, "scadenze", scadenzaInModificaId);
                await updateDoc(docRef, { titolo, data, importo });
            } else {
                await addDoc(collection(db, "scadenze"), {
                    titolo,
                    data,
                    importo,
                    pagato: false
                });
            }
            modalScadenza.style.display = 'none';
            scadenzaForm.reset();
            caricaScadenze();
        } catch (err) {
            console.error("Errore salvataggio scadenza:", err);
            alert("Errore nel salvataggio della scadenza.");
        }
    });
}

export async function caricaScadenze() {
    try {
        const querySnapshot = await getDocs(collection(db, "scadenze"));
        let scadenze = [];
        querySnapshot.forEach(docSnap => {
            scadenze.push({ id: docSnap.id, ...docSnap.data() });
        });

        const oggiStr = new Date().toISOString().split('T')[0];

        // 1. Popolamento Home Summary
        if (summaryScadenze) {
            const daPagareSummary = scadenze
                .filter(s => !s.pagato)
                .sort((a, b) => a.data.localeCompare(b.data))
                .slice(0, 3);

            let htmlSummary = "";
            daPagareSummary.forEach(s => {
                const [yyyy, mm, dd] = s.data.split('-');
                const dataFormattata = `${dd}/${mm}/${yyyy}`;
                
                const diffGiorni = Math.ceil((new Date(s.data) - new Date(oggiStr)) / (1000 * 60 * 60 * 24));
                let infoGiorni = "";
                if (diffGiorni < 0) infoGiorni = `<span style="color: #ef4444; font-weight: bold;">Scaduta!</span>`;
                else if (diffGiorni === 0) infoGiorni = `<span style="color: #f59e0b; font-weight: bold;">Scade Oggi!</span>`;
                else infoGiorni = `<span style="color: #64748b;">Mancano ${diffGiorni} giorni</span>`;

                htmlSummary += `
                    <div style="display: flex; justify-content: space-between; align-items: center; background-color: #fef2f2; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; border-left: 5px solid #ef4444;">
                        <div>
                            <strong style="font-size: 1.05rem; color: #991b1b;">${s.titolo}</strong>
                            <span style="font-size: 0.95rem; color: #7f1d1d; margin-left: 8px;">(${dataFormattata}) - ${infoGiorni}</span>
                        </div>
                        <strong style="font-size: 1.1rem; color: #991b1b;">€ ${s.importo.toFixed(2)}</strong>
                    </div>
                `;
            });

            summaryScadenze.innerHTML = htmlSummary || `<p class="text-muted">Nessuna scadenza in arrivo.</p>`;
        }

        // 2. Popolamento Sezione Scadenze
        if (listaScadenze) {
            let htmlScadenze = "";
            let totaleDaPagare = 0;

            scadenze.sort((a, b) => a.data.localeCompare(b.data));

            scadenze.forEach(s => {
                if (!s.pagato) totaleDaPagare += s.importo;

                const [yyyy, mm, dd] = s.data.split('-');
                const dataFormattata = `${dd}/${mm}/${yyyy}`;

                htmlScadenze += `
                    <li class="badge-item ${s.pagato ? 'pagato' : ''}" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; margin-bottom: 8px; border-radius: 8px; border-left: 5px solid ${s.pagato ? '#22c55e' : '#ef4444'};">
                        <div>
                            <strong style="font-size: 1.05rem;">${s.titolo}</strong>
                            <span style="font-size: 0.9rem; color: #64748b; margin-left: 10px;">${dataFormattata}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <strong style="font-size: 1.1rem;">€ ${s.importo.toFixed(2)}</strong>
                            <button class="btn-secondary" style="font-size: 0.8rem; padding: 4px 8px;" onclick="toggleStatoPagamento('${s.id}', ${s.pagato})">${s.pagato ? 'Segna Da Pagare' : 'Segna Pagata'}</button>
                            <button class="btn-modifica" style="font-size: 0.8rem; padding: 4px 8px;" onclick="modificaScadenza('${s.id}')">Mod.</button>
                            <button class="btn-elimina" style="font-size: 0.8rem; padding: 4px 8px;" onclick="eliminaScadenza('${s.id}')">&times;</button>
                        </div>
                    </li>
                `;
            });

            listaScadenze.innerHTML = htmlScadenze || `<p class="text-muted">Nessuna scadenza inserita.</p>`;
            if (totaleGeneraleEl) totaleGeneraleEl.textContent = `Totale da pagare: € ${totaleDaPagare.toFixed(2)}`;
        }

    } catch (err) {
        console.error("Errore caricaScadenze:", err);
        if (summaryScadenze) summaryScadenze.innerHTML = `<p class="text-muted">Errore caricamento scadenze.</p>`;
    }
}

window.toggleStatoPagamento = async function(id, statoAttuale) {
    try {
        const docRef = doc(db, "scadenze", id);
        await updateDoc(docRef, { pagato: !statoAttuale });
        caricaScadenze();
    } catch (err) {
        alert("Errore nell'aggiornamento dello stato.");
    }
}

window.modificaScadenza = async function(id) {
    try {
        const docSnap = await getDoc(doc(db, "scadenze", id));
        if (docSnap.exists()) {
            const s = docSnap.data();
            modalTitle.textContent = "Modifica Scadenza";
            scadenzaInModificaId = id;
            titoloInput.value = s.titolo || "";
            dataInput.value = s.data || "";
            importoInput.value = s.importo || "";
            modalScadenza.style.display = 'flex';
        }
    } catch (err) {
        alert("Errore nel recupero della scadenza.");
    }
}

window.eliminaScadenza = async function(id) {
    if (confirm("Vuoi eliminare questa scadenza?")) {
        try {
            await deleteDoc(doc(db, "scadenze", id));
            caricaScadenze();
        } catch (err) {
            alert("Errore nell'eliminazione.");
        }
    }
}

// Gestione controllata OCR
if (inputScattaFoto) inputScattaFoto.addEventListener('change', elaboraOCR);
if (inputCaricaFoto) inputCaricaFoto.addEventListener('change', elaboraOCR);

async function elaboraOCR(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (ocrLoading) ocrLoading.style.display = 'block';
    if (ocrProgress) ocrProgress.textContent = '0%';

    try {
        const worker = await Tesseract.createWorker('ita');
        const ret = await worker.recognize(file);
        const testo = ret.data.text;
        await worker.terminate();

        // Estrazione importo semplice
        const matchImporto = testo.match(/(\d+[.,]\d{2})/);
        if (matchImporto && importoInput) {
            importoInput.value = matchImporto[1].replace(',', '.');
        }

        if (titoloInput) {
            titoloInput.value = "Scadenza da Foto";
        }

        if (ocrLoading) ocrLoading.style.display = 'none';
    } catch (err) {
        console.error("Errore OCR:", err);
        if (ocrLoading) ocrLoading.style.display = 'none';
        alert("Errore durante la lettura della foto.");
    }
}
