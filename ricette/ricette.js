import { db } from "../firebase-config.js";
import { 
    collection, getDocs, addDoc, doc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let utentiCollezioni = {};
let listaRicette = [];

export async function initRicetteSection(container) {
    await caricaUtenti();
    await caricaEDisegnaRicette(container);
}

async function caricaUtenti() {
    try {
        const utentiSnapshot = await getDocs(collection(db, "utenti"));
        utentiCollezioni = {};
        utentiSnapshot.forEach(docSnap => {
            const data = docSnap.data();
            const usernameKey = (data.username || docSnap.id || '').toLowerCase();
            if (usernameKey) {
                utentiCollezioni[usernameKey] = data.colore || '#2563eb';
            }
        });
    } catch (e) {
        console.error("Errore caricamento utenti:", e);
    }
}

function hexToRgba(hex, alpha = 0.22) {
    if (!hex || !hex.startsWith('#')) return `rgba(37, 99, 235, ${alpha})`;
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(char => char + char).join('');
    const num = parseInt(c, 16);
    if (isNaN(num)) return `rgba(37, 99, 235, ${alpha})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

async function caricaEDisegnaRicette(container) {
    container.innerHTML = `
        <div class="ricette-container">
            <div class="ricette-header">
                <h2><i class="fa-solid fa-utensils"></i> RICETTE</h2>
                <div class="ricette-actions">
                    <input type="text" id="search-ricetta" class="search-ricetta-input" placeholder="Cerca ricetta...">
                    <button class="btn-add-ricetta" id="btn-nuova-ricetta">
                        Nuova Ricetta
                    </button>
                </div>
            </div>

            <div id="ricette-grid-container" class="ricette-grid">
                <p style="color: #64748b; padding: 20px;">Caricamento ricette...</p>
            </div>
        </div>
    `;

    document.getElementById('btn-nuova-ricetta').addEventListener('click', () => {
        apriModaleFormRicetta();
    });

    const searchInput = document.getElementById('search-ricetta');
    searchInput.addEventListener('input', (e) => {
        const queryStr = e.target.value.toLowerCase().trim();
        renderGrigliaRicette(queryStr);
    });

    try {
        const snapshot = await getDocs(collection(db, "ricette"));
        listaRicette = [];

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            listaRicette.push({
                id: docSnap.id,
                ...data
            });
        });

        listaRicette.sort((a, b) => (b.creatoIl || "").localeCompare(a.creatoIl || ""));
        renderGrigliaRicette('');

    } catch (err) {
        console.error("Errore caricamento ricette:", err);
        document.getElementById('ricette-grid-container').innerHTML = '<p style="color:#dc3545;">Errore durante il caricamento delle ricette.</p>';
    }
}

function renderGrigliaRicette(filtro) {
    const gridContainer = document.getElementById('ricette-grid-container');
    if (!gridContainer) return;

    const filtrate = listaRicette.filter(r => {
        const titolo = (r.titolo || r.nome || '').toLowerCase();
        const categoria = (r.categoria || '').toLowerCase();
        return titolo.includes(filtro) || categoria.includes(filtro);
    });

    if (filtrate.length === 0) {
        gridContainer.innerHTML = '<p style="color:#94a3b8; font-style:italic; padding: 10px; grid-column: 1/-1;">Nessuna ricetta trovata.</p>';
        return;
    }

    gridContainer.innerHTML = filtrate.map(r => {
        const titolo = r.titolo || r.nome || 'Senza titolo';
        const creatore = r.creatore || 'Utente';
        const coloreUtente = utentiCollezioni[creatore.toLowerCase()] || '#2563eb';
        const bgTrasparente = hexToRgba(coloreUtente, 0.22);
        
        // Estrae un'anteprima degli ingredienti o del procedimento se manca la descrizione
        let previewText = r.descrizione || r.note || '';
        if (!previewText && r.listaIngredienti && r.listaIngredienti.length > 0) {
            previewText = r.listaIngredienti.map(i => i.nome).filter(Boolean).join(', ');
        }
        if (!previewText) previewText = 'Nessuna descrizione...';

        return `
            <div class="ricetta-card" data-id="${r.id}" style="background-color: ${bgTrasparente}; border-left: 4px solid ${coloreUtente};">
                <div class="ricetta-card-header">
                    <span class="ricetta-badge">${r.categoria || 'Generale'}</span>
                    <button class="btn-delete-ricetta" title="Elimina" data-id="${r.id}">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
                <div class="ricetta-card-body">
                    <h3 class="ricetta-titolo">${titolo}</h3>
                    <p class="ricetta-descrizione">${previewText.substring(0, 80)}...</p>
                </div>
                <div class="ricetta-card-footer">
                    <span>Creatore: ${creatore}</span>
                </div>
            </div>
        `;
    }).join('');

    gridContainer.querySelectorAll('.ricetta-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-delete-ricetta')) return;
            const idR = card.getAttribute('data-id');
            const ricettaObj = listaRicette.find(r => r.id === idR);
            if (ricettaObj) apriModaleDettaglioRicetta(ricettaObj);
        });
    });

    gridContainer.querySelectorAll('.btn-delete-ricetta').forEach(btnDel => {
        btnDel.addEventListener('click', async (e) => {
            e.stopPropagation();
            const idR = btnDel.getAttribute('data-id');
            if (confirm("Vuoi davvero eliminare questa ricetta?")) {
                try {
                    await deleteDoc(doc(db, "ricette", idR));
                    const container = document.getElementById('ricette-content-root') || document.getElementById('content-area');
                    await caricaEDisegnaRicette(container);
                } catch (err) {
                    console.error("Errore eliminazione ricetta:", err);
                    alert("Impossibile eliminare la ricetta.");
                }
            }
        });
    });
}

function apriModaleDettaglioRicetta(r) {
    const modalId = 'modal-view-ricetta';
    const prev = document.getElementById(modalId);
    if (prev) prev.remove();

    const titolo = r.titolo || r.nome || 'Senza titolo';

    // Formattazione ingredienti con punto nero (elenco puntato)
    let ingredientiHtml = '<p style="color: #64748b; font-style: italic;">Nessun ingrediente specificato</p>';
    const ingData = r.listaIngredienti || r.ingredienti;
    if (Array.isArray(ingData) && ingData.length > 0) {
        ingredientiHtml = `<ul style="margin: 0; padding-left: 20px; line-height: 1.6;">` + ingData.map(item => {
            if (typeof item === 'object' && item !== null) {
                const nome = item.nome || '';
                const quantita = item.quantita ? `(${item.quantita})` : '';
                return `<li><strong>${nome}</strong> ${quantita}</li>`;
            }
            return `<li>${item}</li>`;
        }).join('') + `</ul>`;
    }

    // Formattazione procedimento con numeri
    let procedimentoHtml = '<p style="color: #64748b; font-style: italic;">Nessun procedimento specificato</p>';
    const procData = r.procedimento || r.listaPassaggi;
    if (Array.isArray(procData) && procData.length > 0) {
        procedimentoHtml = `<ol style="margin: 0; padding-left: 20px; line-height: 1.6;">` + procData.map(step => {
            return `<li style="margin-bottom: 6px;">${step}</li>`;
        }).join('') + `</ol>`;
    } else if (typeof procData === 'string' && procData.trim() !== '') {
        procedimentoHtml = `<p style="white-space: pre-line;">${procData}</p>`;
    }

    const html = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content" style="max-width: 650px;">
                <div class="modal-header">
                    <div>
                        <span class="ricetta-badge" style="margin-bottom: 6px; display: inline-block;">${r.categoria || 'Generale'}</span>
                        <h2 style="margin: 0; font-size: 1.3rem; color: #1e293b;">${titolo}</h2>
                    </div>
                    <button class="btn-close-modal" id="btn-close-view">&times;</button>
                </div>
                <div class="modal-body" style="margin: 15px 0; max-height: 65vh; overflow-y: auto;">
                    <h4 style="margin: 0 0 8px 0; color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px;">Ingredienti</h4>
                    <div style="background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                        ${ingredientiHtml}
                    </div>
                    
                    <h4 style="margin: 0 0 8px 0; color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px;">Procedimento</h4>
                    <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                        ${procedimentoHtml}
                    </div>
                </div>
                <div class="modal-footer" style="display: flex; justify-content: flex-end; align-items: center;">
                    <button type="button" class="btn-modal cancel" id="btn-chiudi-modal">Chiudi</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
    const modalEl = document.getElementById(modalId);
    document.getElementById('btn-close-view').addEventListener('click', () => modalEl.remove());
    document.getElementById('btn-chiudi-modal').addEventListener('click', () => modalEl.remove());
}

function apriModaleFormRicetta() {
    const savedUser = localStorage.getItem('sitoFamiglia_user') || 'Utente';
    const modalId = 'modal-form-ricetta';
    const prev = document.getElementById(modalId);
    if (prev) prev.remove();

    const html = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>Nuova Ricetta</h3>
                    <button class="btn-close-modal" id="btn-close-form">&times;</button>
                </div>
                <form id="form-ricetta">
                    <div class="form-group">
                        <label for="ric-titolo">Titolo Ricetta</label>
                        <input type="text" id="ric-titolo" required placeholder="Es. Torta di mele">
                    </div>
                    <div class="form-group">
                        <label for="ric-cat">Categoria</label>
                        <input type="text" id="ric-cat" required placeholder="Es. Dolci, Primi, Secondi...">
                    </div>

                    <div class="form-group">
                        <label>Ingredienti (Nome e Quantità)</label>
                        <div id="container-ingredienti-dinamici" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 6px;">
                            <!-- Generate via JS (3 righe iniziali) -->
                        </div>
                        <button type="button" id="btn-aggiungi-ingrediente-riga" style="background: none; border: none; color: #2563eb; font-weight: 600; cursor: pointer; padding: 0; text-align: left; font-size: 0.85rem;">
                            + Aggiungi ingrediente
                        </button>
                    </div>

                    <div class="form-group" style="margin-top: 15px;">
                        <label>Procedimento (Passaggi)</label>
                        <div id="container-procedimento-dinamico" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 6px;">
                            <!-- Generate via JS (3 righe iniziali) -->
                        </div>
                        <button type="button" id="btn-aggiungi-proc-riga" style="background: none; border: none; color: #2563eb; font-weight: 600; cursor: pointer; padding: 0; text-align: left; font-size: 0.85rem;">
                            + Aggiungi passaggio
                        </button>
                    </div>

                    <div class="modal-footer" style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 8px;">
                        <button type="button" class="btn-modal cancel" id="btn-cancel-ricetta">Annulla</button>
                        <button type="submit" class="btn-modal save" id="btn-save-ricetta">Salva Ricetta</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
    const modalEl = document.getElementById(modalId);
    const chiudi = () => modalEl.remove();

    document.getElementById('btn-close-form').addEventListener('click', chiudi);
    document.getElementById('btn-cancel-ricetta').addEventListener('click', chiudi);

    const containerIng = document.getElementById('container-ingredienti-dinamici');
    const containerProc = document.getElementById('container-procedimento-dinamico');

    function aggiungiRigaIngrediente(nomeVal = '', quantitaVal = '') {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; gap: 8px; align-items: center;';
        row.innerHTML = `
            <input type="text" class="ing-nome" placeholder="Nome ingrediente (es. Farina)" value="${nomeVal}" style="flex: 2; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;">
            <input type="text" class="ing-quantita" placeholder="Quantità (es. 200g)" value="${quantitaVal}" style="flex: 1; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;">
            <button type="button" class="btn-rimuovi-riga" style="background: none; border: none; color: #dc3545; cursor: pointer; padding: 4px 8px;"><i class="fa-solid fa-trash"></i></button>
        `;
        row.querySelector('.btn-rimuovi-riga').addEventListener('click', () => row.remove());
        containerIng.appendChild(row);
    }

    function aggiungiRigaProcedimento(testoVal = '') {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; gap: 8px; align-items: center;';
        row.innerHTML = `
            <input type="text" class="proc-testo" placeholder="Descrivi il passaggio..." value="${testoVal}" style="flex: 1; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;">
            <button type="button" class="btn-rimuovi-riga" style="background: none; border: none; color: #dc3545; cursor: pointer; padding: 4px 8px;"><i class="fa-solid fa-trash"></i></button>
        `;
        row.querySelector('.btn-rimuovi-riga').addEventListener('click', () => row.remove());
        containerProc.appendChild(row);
    }

    // Inserisce 3 righe di default
    for (let i = 0; i < 3; i++) {
        aggiungiRigaIngrediente();
        aggiungiRigaProcedimento();
    }

    document.getElementById('btn-aggiungi-ingrediente-riga').addEventListener('click', () => aggiungiRigaIngrediente());
    document.getElementById('btn-aggiungi-proc-riga').addEventListener('click', () => aggiungiRigaProcedimento());

    document.getElementById('form-ricetta').addEventListener('submit', async (e) => {
        e.preventDefault();
        const titolo = document.getElementById('ric-titolo').value.trim();
        const categoria = capitalize(document.getElementById('ric-cat').value.trim());

        // Raccoglie gli ingredienti dalle righe
        const listaIngredienti = [];
        containerIng.querySelectorAll('div').forEach(row => {
            const nome = row.querySelector('.ing-nome').value.trim();
            const quantita = row.querySelector('.ing-quantita').value.trim();
            if (nome) {
                listaIngredienti.push({ nome, quantita });
            }
        });

        // Raccoglie i procedimenti dalle righe
        const procedimento = [];
        containerProc.querySelectorAll('div').forEach(row => {
            const testo = row.querySelector('.proc-testo').value.trim();
            if (testo) {
                procedimento.push(testo);
            }
        });

        if (listaIngredienti.length === 0 || procedimento.length === 0) {
            alert("Inserisci almeno un ingrediente e un passaggio per il procedimento.");
            return;
        }

        try {
            await addDoc(collection(db, "ricette"), {
                titolo,
                categoria,
                listaIngredienti,
                procedimento,
                creatore: savedUser,
                creatoIl: new Date().toISOString()
            });

            chiudi();
            const container = document.getElementById('ricette-content-root') || document.getElementById('content-area');
            await caricaEDisegnaRicette(container);
        } catch (err) {
            console.error("Errore salvataggio ricetta:", err);
            alert("Errore durante il salvataggio.");
        }
    });
}
