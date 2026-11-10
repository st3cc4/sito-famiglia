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
                        <i class="fa-solid fa-circle-plus"></i> Nuova Ricetta
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
        const descrizione = r.descrizione || r.note || 'Nessuna descrizione...';

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
                    <p class="ricetta-descrizione">${descrizione.substring(0, 80)}...</p>
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

    // Gestione ingredienti (supporta sia array di stringhe, sia array di oggetti, sia stringa semplice)
    let ingredientiFormatted = '';
    const ingData = r.listaIngredienti || r.ingredienti;
    if (Array.isArray(ingData)) {
        ingredientiFormatted = ingData.map(item => {
            if (typeof item === 'object' && item !== null) {
                return `- ${item.nome || ''} ${item.quantita || ''}`.trim();
            }
            return `- ${item}`;
        }).join('\n');
    } else {
        ingredientiFormatted = ingData || 'Non specificati';
    }

    // Gestione procedimento (supporta sia array di stringhe che stringa semplice)
    let procedimentoFormatted = '';
    const procData = r.procedimento || r.listaPassaggi;
    if (Array.isArray(procData)) {
        procedimentoFormatted = procData.map((step, index) => `${index + 1}. ${step}`).join('\n');
    } else {
        procedimentoFormatted = procData || 'Non specificato';
    }

    const html = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <div>
                        <span class="ricetta-badge" style="margin-bottom: 6px; display: inline-block;">${r.categoria || 'Generale'}</span>
                        <h2 style="margin: 0; font-size: 1.25rem; color: #1e293b;">${titolo}</h2>
                    </div>
                    <button class="btn-close-modal" id="btn-close-view">&times;</button>
                </div>
                <div class="modal-body" style="margin: 15px 0; max-height: 60vh; overflow-y: auto;">
                    <h4 style="margin: 0 0 6px 0; color: #475569;">Ingredienti:</h4>
                    <p style="white-space: pre-line; background: #f8fafc; padding: 10px; border-radius: 6px; margin-bottom: 15px;">${ingredientiFormatted}</p>
                    
                    <h4 style="margin: 0 0 6px 0; color: #475569;">Preparazione / Procedimento:</h4>
                    <p style="white-space: pre-line; background: #f8fafc; padding: 10px; border-radius: 6px;">${procedimentoFormatted}</p>
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
            <div class="modal-content" style="max-width: 550px;">
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
                        <label for="ric-cat">Categoria / Tipo</label>
                        <input type="text" id="ric-cat" required placeholder="Es. Dolci, Primi, Secondi...">
                    </div>
                    <div class="form-group">
                        <label for="ric-ingredienti">Ingredienti (uno per riga)</label>
                        <textarea id="ric-ingredienti" rows="4" required placeholder="Es. Farina - 200g..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="ric-procedimento">Procedimento</label>
                        <textarea id="ric-procedimento" rows="5" required placeholder="Descrivi i passaggi..."></textarea>
                    </div>
                    <div class="modal-footer" style="margin-top: 15px; display: flex; justify-content: flex-end; gap: 8px;">
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

    document.getElementById('form-ricetta').addEventListener('submit', async (e) => {
        e.preventDefault();
        const titolo = document.getElementById('ric-titolo').value.trim();
        const categoria = capitalize(document.getElementById('ric-cat').value.trim());
        const ingredientiTesto = document.getElementById('ric-ingredienti').value.trim();
        const procedimentoTesto = document.getElementById('ric-procedimento').value.trim();

        // Trasforma il testo in array puliti per Firestore
        const listaIngredienti = ingredientiTesto.split('\n').map(item => item.trim()).filter(Boolean);
        const procedimento = procedimentoTesto.split('\n').map(item => item.trim()).filter(Boolean);

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
