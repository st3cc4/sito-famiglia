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

let impegniGlobal = [];
let utentiCollezioni = {};
let filtroAttivo = 'tutte';
let idInModifica = null;

// Funzione ausiliaria per convertire colori HEX in formato RGBA trasparente
function hexToRgba(hex, alpha = 0.12) {
    if (!hex) return `rgba(52, 152, 219, ${alpha})`;
    let c = hex.replace('#', '');
    if (c.length === 3) {
        c = c.split('').map(char => char + char).join('');
    }
    const num = parseInt(c, 16);
    if (isNaN(num)) return `rgba(52, 152, 219, ${alpha})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Funzione ausiliaria per formattare la data in formato europeo (GG-MM-AAAA)
function formatDataEuropea(dataString) {
    if (!dataString) return '';
    const parti = dataString.split('-');
    if (parti.length === 3) {
        return `${parti[2]}-${parti[1]}-${parti[0]}`;
    }
    return dataString;
}

// --- Render Principale della Sezione Impegni ---
export async function initImpegniSection(container) {
    container.innerHTML = `
        <div class="impegni-container">
            <!-- Header della sezione con Pulsante Home e Nuovo Impegno -->
            <div class="section-header-actions">
                <div class="header-left-group">
                    <button id="btn-torna-home" class="btn-outline" title="Torna alla Home">
                        <i class="fa-solid fa-arrow-left"></i> Home
                    </button>
                    <h2><i class="fa-solid fa-calendar-days"></i> GESTIONE IMPEGNI</h2>
                </div>
                <div class="header-buttons-right">
                    <button id="btn-toggle-form" class="btn-primary">
                        Nuovo Impegno
                    </button>
                </div>
            </div>

            <!-- Form per l'inserimento / modifica dell'impegno -->
            <div id="form-impegno-card" class="form-card" style="display: none;">
                <h3 id="form-impegno-title">Nuovo Impegno</h3>
                <form id="form-nuovo-impegno">
                    <div class="form-grid">
                        <div class="form-group" style="grid-column: 1 / -1;">
                            <label for="impegno-titolo">Titolo / Descrizione principale *</label>
                            <input type="text" id="impegno-titolo" placeholder="Es. Visita medica, Riunione scolastica..." required>
                        </div>
                        <div class="form-group">
                            <label for="impegno-data">Data *</label>
                            <input type="date" id="impegno-data" required>
                        </div>
                        <div class="form-group">
                            <label for="impegno-ora-inizio">Ora Inizio</label>
                            <input type="time" id="impegno-ora-inizio" value="09:00">
                        </div>
                        <div class="form-group">
                            <label for="impegno-ora-fine">Ora Fine</label>
                            <input type="time" id="impegno-ora-fine" value="10:00">
                        </div>
                        <div class="form-group" style="grid-column: 1 / -1;">
                            <label for="impegno-note">Note / Dettagli</label>
                            <textarea id="impegno-note" rows="2" placeholder="Eventuali dettagli aggiuntivi..."></textarea>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" id="btn-annulla-form" class="btn-secondary">Annulla</button>
                        <button type="submit" id="btn-salva-impegno" class="btn-primary">Salva Impegno</button>
                    </div>
                </form>
            </div>

            <!-- Barra dei Filtri -->
            <div class="filter-bar">
                <button class="filter-btn active" data-filter="tutte">Tutti</button>
                <button class="filter-btn" data-filter="oggi">Oggi</button>
                <button class="filter-btn" data-filter="settimana">Questa Settimana</button>
                <button class="filter-btn" data-filter="futuri">Futuri</button>
            </div>

            <!-- Lista degli Impegni -->
            <div id="impegni-list-container">
                <p style="text-align:center; padding: 20px; color: var(--text-muted);">Caricamento impegni...</p>
            </div>
        </div>
    `;

    setupEventListeners(container);
    await caricaImpegni(container);
}

// --- Caricamento Dati da Firebase ---
async function caricaImpegni(container) {
    const listContainer = container.querySelector('#impegni-list-container');
    
    try {
        // Recupera utenti per i colori
        const utentiSnapshot = await getDocs(collection(db, "utenti"));
        utentiCollezioni = {};
        utentiSnapshot.forEach(docSnap => {
            const data = docSnap.data();
            utentiCollezioni[data.nome.toLowerCase()] = data.colore || '#3498db';
        });

        // Recupera Appuntamenti/Impegni
        const impegniSnapshot = await getDocs(collection(db, "appuntamenti"));
        impegniGlobal = [];
        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);

        impegniSnapshot.forEach(docSnap => {
            const data = docSnap.data();
            const dataImpegnoGrezza = data.data || '';
            const dataImpegno = new Date(dataImpegnoGrezza);
            dataImpegno.setHours(0, 0, 0, 0);

            const creatore = data.creatore || 'Utente';
            const coloreUtente = utentiCollezioni[creatore.toLowerCase()] || '#3498db';

            impegniGlobal.push({
                id: docSnap.id,
                titolo: data.titolo || 'Impegno',
                dataGrezza: dataImpegnoGrezza,
                dataOggetto: dataImpegno,
                dataFormattata: formatDataEuropea(dataImpegnoGrezza),
                oraInizio: data.oraInizio || '',
                oraFine: data.oraFine || '',
                note: data.note || '',
                creatore: creatore,
                coloreUtente: coloreUtente,
                bgTrasparente: hexToRgba(coloreUtente, 0.12)
            });
        });

        // Ordina gli impegni per data crescente
        impegniGlobal.sort((a, b) => a.dataOggetto - b.dataOggetto);

        renderListaImpegni(listContainer, container);

    } catch (error) {
        console.error("Errore nel caricamento degli impegni:", error);
        if (listContainer) {
            listContainer.innerHTML = `<p style="color: red; text-align: center;">Errore durante il caricamento degli impegni.</p>`;
        }
    }
}

// --- Rendering della Lista Filtrata ---
function renderListaImpegni(listContainer, container) {
    if (!listContainer) return;

    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    // Calcolo limiti settimana corrente (Lunedì - Domenica)
    const curr = new Date();
    const firstDayOfWeek = new Date(curr);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    firstDayOfWeek.setDate(diff);
    firstDayOfWeek.setHours(0, 0, 0, 0);

    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    lastDayOfWeek.setHours(23, 59, 59, 999);

    let listaFiltrata = impegniGlobal;

    if (filtroAttivo === 'oggi') {
        listaFiltrata = impegniGlobal.filter(i => i.dataOggetto.getTime() === oggi.getTime());
    } else if (filtroAttivo === 'settimana') {
        listaFiltrata = impegniGlobal.filter(i => i.dataOggetto >= firstDayOfWeek && i.dataOggetto <= lastDayOfWeek);
    } else if (filtroAttivo === 'futuri') {
        listaFiltrata = impegniGlobal.filter(i => i.dataOggetto >= oggi);
    }

    if (listaFiltrata.length === 0) {
        listContainer.innerHTML = `<p class="card-empty">Nessun impegno trovato per questo filtro.</p>`;
        return;
    }

    listContainer.innerHTML = `
        <ul class="impegni-full-list">
            ${listaFiltrata.map(i => `
                <li class="impegno-full-card" style="background-color: ${i.bgTrasparente}; border-left-color:${i.coloreUtente};">
                    <div class="impegno-full-info">
                        <span class="impegno-full-title">${i.titolo}</span>
                        <div class="impegno-full-meta">
                            <span><i class="fa-regular fa-calendar"></i> ${i.dataFormattata}</span>${i.oraInizio ? `<span><i class="fa-regular fa-clock"></i> ${i.oraInizio}${i.oraFine ? ' - ' + i.oraFine : ''}</span>` : ''}
                            ${i.creatore ? `<span class="impegno-creator">(${i.creatore})</span>` : ''}
                        </div>
                        ${i.note ? `<div class="impegno-descrizione">${i.note}</div>` : ''}
                    </div>
                    <div class="impegno-full-right">
                        <div class="impegno-full-actions">
                            <button class="btn-action-icon edit" data-id="${i.id}" title="Modifica Impegno">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="btn-action-icon delete" data-id="${i.id}" title="Elimina Impegno">
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
            const impegnoId = btn.getAttribute('data-id');
            apriModificaForm(impegnoId, container);
        });
    });

    // Event listener per il pulsante ELIMINA
    const deleteButtons = listContainer.querySelectorAll('.btn-action-icon.delete');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const impegnoId = btn.getAttribute('data-id');
            if (confirm('Sei sicuro di voler eliminare questo impegno?')) {
                await eliminaImpegno(impegnoId, listContainer, container);
            }
        });
    });
}

// --- Funzione per Aprire il Form in Modalità Modifica ---
function apriModificaForm(id, container) {
    const item = impegniGlobal.find(i => i.id === id);
    if (!item) return;

    idInModifica = id;

    const formCard = container.querySelector('#form-impegno-card');
    const formTitle = container.querySelector('#form-impegno-title');
    const btnSalva = container.querySelector('#btn-salva-impegno');

    container.querySelector('#impegno-titolo').value = item.titolo;
    container.querySelector('#impegno-data').value = item.dataGrezza;
    container.querySelector('#impegno-ora-inizio').value = item.oraInizio;
    container.querySelector('#impegno-ora-fine').value = item.oraFine;
    container.querySelector('#impegno-note').value = item.note;

    if (formTitle) formTitle.textContent = 'Modifica Impegno';
    if (btnSalva) btnSalva.textContent = 'Aggiorna Impegno';

    formCard.style.display = 'flex';
    formCard.scrollIntoView({ behavior: 'smooth' });
}

// --- Reset del Form in Modalità Inserimento ---
function resetForm(container) {
    idInModifica = null;
    const formCard = container.querySelector('#form-impegno-card');
    const form = container.querySelector('#form-nuovo-impegno');
    const formTitle = container.querySelector('#form-impegno-title');
    const btnSalva = container.querySelector('#btn-salva-impegno');

    if (form) form.reset();
    if (formTitle) formTitle.textContent = 'Nuovo Impegno';
    if (btnSalva) btnSalva.textContent = 'Salva Impegno';
    if (formCard) formCard.style.display = 'none';
}

// --- Gestione Eventi (Form, Filtri e Ritorno Home) ---
function setupEventListeners(container) {
    const btnTornaHome = container.querySelector('#btn-torna-home');
    const btnToggleForm = container.querySelector('#btn-toggle-form');
    const formCard = container.querySelector('#form-impegno-card');
    const btnAnnulla = container.querySelector('#btn-annulla-form');
    const form = container.querySelector('#form-nuovo-impegno');
    const listContainer = container.querySelector('#impegni-list-container');

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
            
            const titolo = container.querySelector('#impegno-titolo').value.trim();
            const dataImpegno = container.querySelector('#impegno-data').value;
            const oraInizio = container.querySelector('#impegno-ora-inizio').value;
            const oraFine = container.querySelector('#impegno-ora-fine').value;
            const note = container.querySelector('#impegno-note').value.trim();

            const savedUser = localStorage.getItem('famiglia_pwa_user') || sessionStorage.getItem('famiglia_pwa_user');
            const userData = savedUser ? JSON.parse(savedUser) : { nome: 'Utente' };

            try {
                if (idInModifica) {
                    const impegnoRef = doc(db, "appuntamenti", idInModifica);
                    await updateDoc(impegnoRef, {
                        titolo: titolo,
                        data: dataImpegno,
                        oraInizio: oraInizio,
                        oraFine: oraFine,
                        note: note
                    });
                } else {
                    await addDoc(collection(db, "appuntamenti"), {
                        titolo: titolo,
                        data: dataImpegno,
                        oraInizio: oraInizio,
                        oraFine: oraFine,
                        note: note,
                        creatore: userData.nome,
                        creatoIl: new Date().toISOString()
                    });
                }

                resetForm(container);
                await caricaImpegni(container);

            } catch (err) {
                console.error("Errore durante il salvataggio dell'impegno:", err);
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
            renderListaImpegni(listContainer, container);
        });
    });
}

// --- Funzione Elimina Impegno ---
async function eliminaImpegno(id, listContainer, container) {
    try {
        await deleteDoc(doc(db, "appuntamenti", id));
        impegniGlobal = impegniGlobal.filter(i => i.id !== id);
        renderListaImpegni(listContainer, container);
    } catch (err) {
        console.error("Errore durante l'eliminazione dell'impegno:", err);
        alert("Errore durante l'eliminazione dell'impegno.");
    }
}
