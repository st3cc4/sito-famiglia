// --- Import SDK di Firebase ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configurazione Firebase dal tuo progetto
const firebaseConfig = {
    apiKey: "AIzaSyAtMnKhhfC43J73kVm8-QcNghqzOTV6UKA",
    authDomain: "sito-famiglia.firebaseapp.com",
    projectId: "sito-famiglia",
    storageBucket: "sito-famiglia.appspot.com",
    messagingSenderId: "93216467751",
    appId: "1:93216467751:web:9930052845521ca5ef895a",
    measurementId: "G-NYRQJDTWM3"
};

// Inizializza Firebase e Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let scadenzeGlobal = [];
let filtroAttivo = 'tutte';

// Funzione ausiliaria per formattare la data in formato europeo (GG-MM-AAAA)
function formatDataEuropea(dataString) {
    if (!dataString) return '';
    const parti = dataString.split('-');
    if (parti.length === 3) {
        return `${parti[2]}-${parti[1]}-${parti[0]}`;
    }
    return dataString;
}

// --- Render Principale della Sezione Scadenze ---
export async function initScadenzeSection(container) {
    container.innerHTML = `
        <div class="scadenze-container">
            <!-- Header della sezione con Azioni -->
            <div class="section-header-actions">
                <h2><i class="fa-solid fa-file-invoice-dollar"></i> GESTIONE SCADENZE</h2>
                <button id="btn-toggle-form" class="btn-primary">
                    <i class="fa-solid fa-plus"></i> Nuova Scadenza
                </button>
            </div>

            <!-- Form per l'inserimento di una nuova scadenza (Nascosto di default) -->
            <div id="form-scadenza-card" class="form-card" style="display: none;">
                <h3>Nuova Scadenza</h3>
                <form id="form-nuova-scadenza">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="scadenza-titolo">Titolo / Descrizione *</label>
                            <input type="text" id="scadenza-titolo" placeholder="Es. Bolletta Luce, Assicurazione..." required>
                        </div>
                        <div class="form-group">
                            <label for="scadenza-importo">Importo (€) *</label>
                            <input type="number" step="0.01" id="scadenza-importo" placeholder="0.00" required>
                        </div>
                        <div class="form-group">
                            <label for="scadenza-data">Data di Scadenza *</label>
                            <input type="date" id="scadenza-data" required>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" id="btn-annulla-form" class="btn-secondary">Annulla</button>
                        <button type="submit" class="btn-primary">Salva Scadenza</button>
                    </div>
                </form>
            </div>

            <!-- Barra dei Filtri -->
            <div class="filter-bar">
                <button class="filter-btn active" data-filter="tutte">Tutte</button>
                <button class="filter-btn" data-filter="urgenti">In Scadenza (<=7 gg)</button>
                <button class="filter-btn" data-filter="scadute">Scadute</button>
            </div>

            <!-- Lista delle Scadenze -->
            <div id="scadenze-list-container">
                <p style="text-align:center; padding: 20px; color: var(--text-muted);">Caricamento scadenze...</p>
            </div>
        </div>
    `;

    // Attiva eventi del modulo e dei filtri
    setupEventListeners(container);
    
    // Carica dati da Firebase
    await caricaScadenze(container);
}

// --- Caricamento Dati da Firebase ---
async function caricaScadenze(container) {
    const listContainer = container.querySelector('#scadenze-list-container');
    
    try {
        const scadenzeSnapshot = await getDocs(collection(db, "scadenze"));
        scadenzeGlobal = [];
        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);

        scadenzeSnapshot.forEach(docSnap => {
            const data = docSnap.data();
            const dataScad = new Date(data.data);
            dataScad.setHours(0, 0, 0, 0);

            const diffTempo = dataScad - oggi;
            const giorniMancanti = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

            let classeColore = 'green';
            if (giorniMancanti <= 7) {
                classeColore = 'red';
            } else if (giorniMancanti >= 8 && giorniMancanti <= 14) {
                classeColore = 'orange';
            }

            scadenzeGlobal.push({
                id: docSnap.id,
                titolo: data.titolo || 'Senza Titolo',
                importo: data.importo !== undefined ? Number(data.importo) : 0,
                dataGrezza: data.data || '',
                dataFormattata: formatDataEuropea(data.data),
                giorniMancanti: giorniMancanti,
                classeColore: classeColore,
                creatore: data.creatore || ''
            });
        });

        // Ordina le scadenze per data (dalla più vicina/scaduta alla più lontana)
        scadenzeGlobal.sort((a, b) => new Date(a.dataGrezza) - new Date(b.dataGrezza));

        renderListaScadenze(listContainer);

    } catch (error) {
        console.error("Errore nel caricamento delle scadenze:", error);
        if (listContainer) {
            listContainer.innerHTML = `<p style="color: red; text-align: center;">Errore durante il caricamento dei dati.</p>`;
        }
    }
}

// --- Rendering della Lista Filtrata ---
function renderListaScadenze(listContainer) {
    if (!listContainer) return;

    let listaFiltrata = scadenzeGlobal;

    if (filtroAttivo === 'urgenti') {
        listaFiltrata = scadenzeGlobal.filter(s => s.giorniMancanti >= 0 && s.giorniMancanti <= 7);
    } else if (filtroAttivo === 'scadute') {
        listaFiltrata = scadenzeGlobal.filter(s => s.giorniMancanti < 0);
    }

    if (listaFiltrata.length === 0) {
        listContainer.innerHTML = `<p class="card-empty">Nessuna scadenza trovata per questo filtro.</p>`;
        return;
    }

    listContainer.innerHTML = `
        <ul class="scadenze-full-list">
            ${listaFiltrata.map(s => `
                <li class="scadenza-full-card ${s.classeColore}">
                    <div class="scadenza-full-info">
                        <span class="scadenza-full-title">${s.titolo}</span>
                        <div class="scadenza-full-meta">
                            <span><i class="fa-regular fa-calendar"></i> ${s.dataFormattata}</span>
                            <span><strong>${s.giorniMancanti < 0 ? 'Scaduta' : (s.giorniMancanti === 0 ? 'Scade Oggi' : `Tra ${s.giorniMancanti} gg`)}</strong></span>
                        </div>
                    </div>
                    <div class="scadenza-full-right">
                        <span class="scadenza-full-amount">€ ${s.importo.toFixed(2)}</span>
                        <div class="scadenza-full-actions">
                            <button class="btn-action-icon delete" data-id="${s.id}" title="Elimina Scadenza">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                </li>
            `).join('')}
        </ul>
    `;

    // Aggiungi listener per i pulsanti di eliminazione
    const deleteButtons = listContainer.querySelectorAll('.btn-action-icon.delete');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const scadenzaId = btn.getAttribute('data-id');
            if (confirm('Sei sicuro di voler eliminare questa scadenza?')) {
                await eliminaScadenza(scadenzaId, listContainer);
            }
        });
    });
}

// --- Gestione Eventi (Form e Filtri) ---
function setupEventListeners(container) {
    const btnToggleForm = container.querySelector('#btn-toggle-form');
    const formCard = container.querySelector('#form-scadenza-card');
    const btnAnnulla = container.querySelector('#btn-annulla-form');
    const form = container.querySelector('#form-nuova-scadenza');
    const listContainer = container.querySelector('#scadenze-list-container');

    // Mostra/Nascondi Form
    if (btnToggleForm) {
        btnToggleForm.addEventListener('click', () => {
            const isHidden = formCard.style.display === 'none';
            formCard.style.display = isHidden ? 'flex' : 'none';
        });
    }

    if (btnAnnulla) {
        btnAnnulla.addEventListener('click', () => {
            formCard.style.display = 'none';
            form.reset();
        });
    }

    // Invio Form Nuova Scadenza
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const titolo = container.querySelector('#scadenza-titolo').value.trim();
            const importo = parseFloat(container.querySelector('#scadenza-importo').value);
            const dataScad = container.querySelector('#scadenza-data').value;

            const savedUser = localStorage.getItem('famiglia_pwa_user') || sessionStorage.getItem('famiglia_pwa_user');
            const userData = savedUser ? JSON.parse(savedUser) : { nome: 'Utente' };

            try {
                await addDoc(collection(db, "scadenze"), {
                    titolo: titolo,
                    importo: importo,
                    data: dataScad,
                    creatore: userData.nome,
                    creatoIl: new Date().toISOString()
                });

                form.reset();
                formCard.style.display = 'none';
                await caricaScadenze(container);

            } catch (err) {
                console.error("Errore durante il salvataggio della scadenza:", err);
                alert("Errore durante il salvataggio. Riprova.");
            }
        });
    }

    // Gestione Filtri
    const filterButtons = container.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            filtroAttivo = btn.getAttribute('data-filter');
            renderListaScadenze(listContainer);
        });
    });
}

// --- Funzione Elimina Scadenza ---
async function eliminaScadenza(id, listContainer) {
    try {
        await deleteDoc(doc(db, "scadenze", id));
        scadenzeGlobal = scadenzeGlobal.filter(s => s.id !== id);
        renderListaScadenze(listContainer);
    } catch (err) {
        console.error("Errore durante l'eliminazione della scadenza:", err);
        alert("Errore durante l'eliminazione della scadenza.");
    }
}
