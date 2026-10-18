// --- Import SDK di Firebase ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
let idInModifica = null;

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
            <!-- Header della sezione con Pulsante Home e Nuova Scadenza -->
            <div class="section-header-actions">
                <div class="header-left-group">
                    <button id="btn-torna-home" class="btn-outline" title="Torna alla Home">
                        <i class="fa-solid fa-arrow-left"></i> Home
                    </button>
                    <h2><i class="fa-solid fa-file-invoice-dollar"></i> GESTIONE SCADENZE</h2>
                </div>
                <div class="header-buttons-right">
                    <button id="btn-toggle-form" class="btn-primary">
                        Nuova Scadenza
                    </button>
                </div>
            </div>

            <!-- Form per l'inserimento / modifica della scadenza -->
            <div id="form-scadenza-card" class="form-card" style="display: none;">
                <h3 id="form-scadenza-title">Nuova Scadenza</h3>
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
                        <button type="submit" id="btn-salva-scadenza" class="btn-primary">Salva Scadenza</button>
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

    setupEventListeners(container);
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

        // Ordina le scadenze per data
        scadenzeGlobal.sort((a, b) => new Date(a.dataGrezza) - new Date(b.dataGrezza));

        renderListaScadenze(listContainer, container);

    } catch (error) {
        console.error("Errore nel caricamento delle scadenze:", error);
        if (listContainer) {
            listContainer.innerHTML = `<p style="color: red; text-align: center;">Errore durante il caricamento dei dati.</p>`;
        }
    }
}

// --- Rendering della Lista Filtrata ---
function renderListaScadenze(listContainer, container) {
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
                            ${s.creatore ? `<span class="scadenza-creator">(${s.creatore})</span>` : ''}
                        </div>
                    </div>
                    <div class="scadenza-full-right">
                        <span class="scadenza-full-amount">€ ${s.importo.toFixed(2)}</span>
                        <div class="scadenza-full-actions">
                            <button class="btn-action-icon edit" data-id="${s.id}" title="Modifica Scadenza">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="btn-action-icon delete" data-id="${s.id}" title="Elimina Scadenza">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                </li>
            `).join('')}
        </ul>
    `;

    // Event listener per il pulsante MODIFICA
    const editButtons = listContainer.querySelectorAll('.btn-action-icon.edit');
    editButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const scadenzaId = btn.getAttribute('data-id');
            apriModificaForm(scadenzaId, container);
        });
    });

    // Event listener per il pulsante ELIMINA
    const deleteButtons = listContainer.querySelectorAll('.btn-action-icon.delete');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const scadenzaId = btn.getAttribute('data-id');
            if (confirm('Sei sicuro di voler eliminare questa scadenza?')) {
                await eliminaScadenza(scadenzaId, listContainer, container);
            }
        });
    });
}

// --- Funzione per Aprire il Form in Modalità Modifica ---
function apriModificaForm(id, container) {
    const item = scadenzeGlobal.find(s => s.id === id);
    if (!item) return;

    idInModifica = id;

    const formCard = container.querySelector('#form-scadenza-card');
    const formTitle = container.querySelector('#form-scadenza-title');
    const btnSalva = container.querySelector('#btn-salva-scadenza');

    container.querySelector('#scadenza-titolo').value = item.titolo;
    container.querySelector('#scadenza-importo').value = item.importo;
    container.querySelector('#scadenza-data').value = item.dataGrezza;

    if (formTitle) formTitle.textContent = 'Modifica Scadenza';
    if (btnSalva) btnSalva.textContent = 'Aggiorna Scadenza';

    formCard.style.display = 'flex';
    formCard.scrollIntoView({ behavior: 'smooth' });
}

// --- Reset del Form in Modalità Inserimento ---
function resetForm(container) {
    idInModifica = null;
    const formCard = container.querySelector('#form-scadenza-card');
    const form = container.querySelector('#form-nuova-scadenza');
    const formTitle = container.querySelector('#form-scadenza-title');
    const btnSalva = container.querySelector('#btn-salva-scadenza');

    if (form) form.reset();
    if (formTitle) formTitle.textContent = 'Nuova Scadenza';
    if (btnSalva) btnSalva.textContent = 'Salva Scadenza';
    if (formCard) formCard.style.display = 'none';
}

// --- Gestione Eventi (Form, Filtri e Ritorno Home) ---
function setupEventListeners(container) {
    const btnTornaHome = container.querySelector('#btn-torna-home');
    const btnToggleForm = container.querySelector('#btn-toggle-form');
    const formCard = container.querySelector('#form-scadenza-card');
    const btnAnnulla = container.querySelector('#btn-annulla-form');
    const form = container.querySelector('#form-nuova-scadenza');
    const listContainer = container.querySelector('#scadenze-list-container');

    // Pulsante Torna alla Home
    if (btnTornaHome) {
        btnTornaHome.addEventListener('click', () => {
            if (typeof window.selezionaScheda === 'function') {
                window.selezionaScheda('dashboard');
            }
        });
    }

    // Mostra/Nascondi Form
    if (btnToggleForm) {
        btnToggleForm.addEventListener('click', () => {
            const isHidden = formCard.style.display === 'none';
            if (isHidden) {
                resetForm(container);
                formCard.style.display = 'flex';
            } else {
                resetForm(container);
            }
        });
    }

    if (btnAnnulla) {
        btnAnnulla.addEventListener('click', () => {
            resetForm(container);
        });
    }

    // Invio Form (Nuovo Inserimento oppure Modifica)
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const titolo = container.querySelector('#scadenza-titolo').value.trim();
            const importo = parseFloat(container.querySelector('#scadenza-importo').value);
            const dataScad = container.querySelector('#scadenza-data').value;

            const savedUser = localStorage.getItem('famiglia_pwa_user') || sessionStorage.getItem('famiglia_pwa_user');
            const userData = savedUser ? JSON.parse(savedUser) : { nome: 'Utente' };

            try {
                if (idInModifica) {
                    const scadenzaRef = doc(db, "scadenze", idInModifica);
                    await updateDoc(scadenzaRef, {
                        titolo: titolo,
                        importo: importo,
                        data: dataScad
                    });
                } else {
                    await addDoc(collection(db, "scadenze"), {
                        titolo: titolo,
                        importo: importo,
                        data: dataScad,
                        creatore: userData.nome,
                        creatoIl: new Date().toISOString()
                    });
                }

                resetForm(container);
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
            renderListaScadenze(listContainer, container);
        });
    });
}

// --- Funzione Elimina Scadenza ---
async function eliminaScadenza(id, listContainer, container) {
    try {
        await deleteDoc(doc(db, "scadenze", id));
        scadenzeGlobal = scadenzeGlobal.filter(s => s.id !== id);
        renderListaScadenze(listContainer, container);
    } catch (err) {
        console.error("Errore durante l'eliminazione della scadenza:", err);
        alert("Errore durante l'eliminazione della scadenza.");
    }
}
