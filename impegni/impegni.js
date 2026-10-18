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
let idInModifica = null;

// Funzione ausiliaria per convertire colori HEX in formato RGBA trasparente
function hexToRgba(hex, alpha) {
    const a = alpha !== undefined ? alpha : 0.12;
    if (!hex) return "rgba(52, 152, 219, " + a + ")";
    let c = hex.replace('#', '');
    if (c.length === 3) {
        c = c.split('').map(function(char) { return char + char; }).join('');
    }
    const num = parseInt(c, 16);
    if (isNaN(num)) return "rgba(52, 152, 219, " + a + ")";
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
}

// Funzione ausiliaria per formattare la data in formato europeo (GG-MM-AAAA)
function formatDataEuropea(dataString) {
    if (!dataString) return '';
    const parti = dataString.split('-');
    if (parti.length === 3) {
        return parti[2] + '-' + parti[1] + '-' + parti[0];
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
                    <h2><i class="fa-solid fa-calendar-days"></i> GESTIONE IMPEGNI (SETTIMANA)</h2>
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
                            <input type="text" id="impegno-titolo" placeholder="Es. Visita medica, Riunione..." required>
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

            <!-- Visualizzazione Settimanale Verticale -->
            <div id="impegni-settimana-container">
                <p style="text-align:center; padding: 20px; color: var(--text-muted);">Caricamento impegni...</p>
            </div>
        </div>
    `;

    setupEventListeners(container);
    await caricaImpegni(container);
}

// --- Caricamento Dati da Firebase ---
async function caricaImpegni(container) {
    const listContainer = container.querySelector('#impegni-settimana-container');
    
    try {
        const utentiSnapshot = await getDocs(collection(db, "utenti"));
        utentiCollezioni = {};
        utentiSnapshot.forEach(function(docSnap) {
            const data = docSnap.data();
            if (data.nome) {
                utentiCollezioni[data.nome.toLowerCase()] = data.colore || '#3498db';
            }
        });

        const impegniSnapshot = await getDocs(collection(db, "appuntamenti"));
        impegniGlobal = [];

        impegniSnapshot.forEach(function(docSnap) {
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

        renderSettimanaVerticale(listContainer, container);

    } catch (error) {
        console.error("Errore nel caricamento degli impegni:", error);
        if (listContainer) {
            listContainer.innerHTML = `<p style="color: red; text-align: center;">Errore durante il caricamento degli impegni.</p>`;
        }
    }
}

// --- Rendering dei 7 Giorni della Settimana (Lunedì - Domenica) ---
function renderSettimanaVerticale(listContainer, container) {
    if (!listContainer) return;

    const curr = new Date();
    const dayOfWeek = curr.getDay();
    const diffToMonday = curr.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    
    const primoGiornoSettimana = new Date(curr.setDate(diffToMonday));
    primoGiornoSettimana.setHours(0, 0, 0, 0);

    const giorniNomi = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
    let htmlContent = '<div class="settimana-verticale-container">';

    for (let i = 0; i < 7; i++) {
        const dataCorrente = new Date(primoGiornoSettimana);
        dataCorrente.setDate(primoGiornoSettimana.getDate() + i);
        dataCorrente.setHours(0, 0, 0, 0);

        const anno = dataCorrente.getFullYear();
        const mese = String(dataCorrente.getMonth() + 1).padStart(2, '0');
        const giornoNum = String(dataCorrente.getDate()).padStart(2, '0');
        const dataIsoString = anno + '-' + mese + '-' + giornoNum;

        const nomeGiorno = giorniNomi[i];
        const isDomenica = (i === 6);

        const impegniDelGiorno = impegniGlobal.filter(function(item) {
            return item.dataOggetto.getTime() === dataCorrente.getTime();
        });

        impegniDelGiorno.sort(function(a, b) {
            return (a.oraInizio || '').localeCompare(b.oraInizio || '');
        });

        htmlContent += `
            <div class="giorno-box ${isDomenica ? 'domenica' : ''}">
                <div class="giorno-header" data-data-iso="${dataIsoString}" title="Clicca per aggiungere un impegno in questo giorno">
                    <span class="giorno-nome">${nomeGiorno} (${formatDataEuropea(dataIsoString)})</span>
                    <span class="giorno-data"><i class="fa-solid fa-plus-circle"></i> Aggiungi</span>
                </div>
                ${impegniDelGiorno.length > 0 ? `
                    <ul class="giorno-eventi-lista">
                        ${impegniDelGiorno.map(function(item) {
                            return `
                            <li class="impegno-item-card" style="background-color: ${item.bgTrasparente}; border-left-color: ${item.coloreUtente};">
                                <div class="impegno-info">
                                    <span class="impegno-titolo">${item.titolo}</span>
                                    <div class="impegno-meta">
                                        ${item.oraInizio ? `<span><i class="fa-regular fa-clock"></i> ${item.oraInizio}${item.oraFine ? ' - ' + item.oraFine : ''}</span>` : ''}
                                        ${item.creatore ? `<span class="impegno-creator">(${item.creatore})</span>` : ''}
                                        ${item.note ? `<span>- ${item.note}</span>` : ''}
                                    </div>
                                </div>
                                <div class="impegno-azioni">
                                    <button class="btn-action-icon edit" data-id="${item.id}" title="Modifica">
                                        <i class="fa-solid fa-pen"></i>
                                    </button>
                                    <button class="btn-action-icon delete" data-id="${item.id}" title="Elimina">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </div>
                            </li>
                            `;
                        }).join('')}
                    </ul>
                ` : `
                    <div class="giorno-vuoto">Nessun impegno in programma</div>
                `}
            </div>
        `;
    }

    htmlContent += '</div>';
    listContainer.innerHTML = htmlContent;

    // Attiva i click sugli header dei giorni
    const giornoHeaders = listContainer.querySelectorAll('.giorno-header');
    giornoHeaders.forEach(function(header) {
        header.addEventListener('click', function() {
            const dataIso = header.getAttribute('data-data-iso');
            apriNuovoImpegnoConData(dataIso, container);
        });
    });

    // Event listener Modifica
    const editButtons = listContainer.querySelectorAll('.btn-action-icon.edit');
    editButtons.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            apriModificaForm(id, container);
        });
    });

    // Event listener Elimina
    const deleteButtons = listContainer.querySelectorAll('.btn-action-icon.delete');
    deleteButtons.forEach(function(btn) {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (confirm('Sei sicuro di voler eliminare questo impegno?')) {
                await eliminaImpegno(id, listContainer, container);
            }
        });
    });
}

// --- Funzione per Aprire il Form con Data Preimpostata ---
function apriNuovoImpegnoConData(dataIso, container) {
    idInModifica = null;
    const formCard = container.querySelector('#form-impegno-card');
    const form = container.querySelector('#form-nuovo-impegno');
    const formTitle = container.querySelector('#form-impegno-title');
    const btnSalva = container.querySelector('#btn-salva-impegno');

    if (form) form.reset();
    if (formTitle) formTitle.textContent = 'Nuovo Impegno';
    if (btnSalva) btnSalva.textContent = 'Salva Impegno';

    const inputData = container.querySelector('#impegno-data');
    if (inputData) inputData.value = dataIso;

    if (formCard) {
        formCard.style.display = 'flex';
        formCard.scrollIntoView({ behavior: 'smooth' });
    }
}

// --- Funzione per Modificare un Impegno Esistente ---
function apriModificaForm(id, container) {
    const item = impegniGlobal.find(function(i) { return i.id === id; });
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

// --- Reset del Form ---
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

// --- Gestione Eventi ---
function setupEventListeners(container) {
    const btnTornaHome = container.querySelector('#btn-torna-home');
    const btnToggleForm = container.querySelector('#btn-toggle-form');
    const btnAnnulla = container.querySelector('#btn-annulla-form');
    const form = container.querySelector('#form-nuovo-impegno');

    if (btnTornaHome) {
        btnTornaHome.addEventListener('click', function() {
            if (typeof window.selezionaScheda === 'function') {
                window.selezionaScheda('dashboard');
            }
        });
    }

    if (btnToggleForm) {
        btnToggleForm.addEventListener('click', function() {
            const formCard = container.querySelector('#form-impegno-card');
            const isHidden = formCard.style.display === 'none';
            if (isHidden) {
                const oggiIso = new Date().toISOString().split('T')[0];
                apriNuovoImpegnoConData(oggiIso, container);
            } else {
                resetForm(container);
            }
        });
    }

    if (btnAnnulla) {
        btnAnnulla.addEventListener('click', function() {
            resetForm(container);
        });
    }

    if (form) {
        form.addEventListener('submit', async function(e) {
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
}

// --- Funzione Elimina Impegno ---
async function eliminaImpegno(id, listContainer, container) {
    try {
        await deleteDoc(doc(db, "appuntamenti", id));
        impegniGlobal = impegniGlobal.filter(function(i) { return i.id !== id; });
        renderSettimanaVerticale(listContainer, container);
    } catch (err) {
        console.error("Errore durante l'eliminazione dell'impegno:", err);
        alert("Errore durante l'eliminazione dell'impegno.");
    }
}
