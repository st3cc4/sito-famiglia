// --- Import SDK di Firebase ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc 
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

let currentWeekStartDate = new Date();
let utentiCollezioni = {};
let appuntamentiSettimana = [];

// Funzione principale di inizializzazione della sezione Impegni
export async function initImpegniSection(container) {
    const day = currentWeekStartDate.getDay();
    const diff = currentWeekStartDate.getDate() - day + (day === 0 ? -6 : 1);
    currentWeekStartDate = new Date(currentWeekStartDate.setDate(diff));
    currentWeekStartDate.setHours(0, 0, 0, 0);

    await caricaUtenti();
    await caricaEDisegnaSettimana(container);
}

// Carica gli utenti e i relativi colori da Firebase
async function caricaUtenti() {
    try {
        const utentiSnapshot = await getDocs(collection(db, "utenti"));
        utentiCollezioni = {};
        utentiSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.nome) {
                utentiCollezioni[data.nome.toLowerCase()] = data.colore || '#3498db';
            }
        });
    } catch (e) {
        console.error("Errore caricamento utenti:", e);
    }
}

// Calcola i 7 giorni della settimana selezionata (Lunedì - Domenica)
function getGiorniSettimana(startDate) {
    const giorni = [];
    const nomiGiorni = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
    const classiGiorni = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'];

    for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        
        const anno = d.getFullYear();
        const mese = String(d.getMonth() + 1).padStart(2, '0');
        const giorno = String(d.getDate()).padStart(2, '0');
        const dataIso = `${anno}-${mese}-${giorno}`;
        const dataFormattata = `${giorno}-${mese}-${anno}`;

        giorni.push({
            nomeGiorno: nomiGiorni[i],
            classeGiorno: classiGiorni[i],
            dataIso: dataIso,
            dataFormattata: dataFormattata
        });
    }
    return giorni;
}

// Convertitore colore HEX -> RGBA Trasparente
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

// Disegna l'interfaccia con i giorni e le tessere
async function caricaEDisegnaSettimana(container) {
    const giorni = getGiorniSettimana(currentWeekStartDate);
    const dataInizioStr = giorni[0].dataFormattata;
    const dataFineStr = giorni[6].dataFormattata;

    container.innerHTML = `
        <div class="impegni-container">
            <div class="impegni-header">
                <h2>IMPEGNI SETTIMANALI</h2>
                <div class="week-nav">
                    <button class="btn-week-nav" id="btn-prev-week"><i class="fa-solid fa-chevron-left"></i> Sett. Prec.</button>
                    <span class="current-week-label">${dataInizioStr} al ${dataFineStr}</span>
                    <button class="btn-week-nav" id="btn-next-week">Sett. Succ. <i class="fa-solid fa-chevron-right"></i></button>
                </div>
            </div>

            <div class="giorni-list">
                ${giorni.map(g => `
                    <div class="giorno-card ${g.classeGiorno}" data-iso="${g.dataIso}">
                        <div class="giorno-header">
                            <span class="giorno-titolo">${g.nomeGiorno} (${g.dataFormattata})</span>
                            <button class="btn-add-impegno" data-iso="${g.dataIso}">
                                <i class="fa-solid fa-circle-plus"></i> Aggiungi
                            </button>
                        </div>
                        <div class="giorno-body" id="body-${g.dataIso}">
                            <p class="giorno-empty">Caricamento in corso...</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    document.getElementById('btn-prev-week').addEventListener('click', () => {
        currentWeekStartDate.setDate(currentWeekStartDate.getDate() - 7);
        caricaEDisegnaSettimana(container);
    });

    document.getElementById('btn-next-week').addEventListener('click', () => {
        currentWeekStartDate.setDate(currentWeekStartDate.getDate() + 7);
        caricaEDisegnaSettimana(container);
    });

    container.querySelectorAll('.btn-add-impegno').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const dataIso = e.currentTarget.getAttribute('data-iso');
            apriModaleImpegno(dataIso);
        });
    });

    try {
        const appuntamentiSnapshot = await getDocs(collection(db, "appuntamenti"));
        appuntamentiSettimana = [];

        appuntamentiSnapshot.forEach(docSnap => {
            const data = docSnap.data();
            appuntamentiSettimana.push({
                id: docSnap.id,
                ...data
            });
        });

        giorni.forEach(g => {
            const bodyEl = document.getElementById(`body-${g.dataIso}`);
            const impegniDelGiorno = appuntamentiSettimana.filter(imp => imp.data === g.dataIso);

            impegniDelGiorno.sort((a, b) => (a.oraInizio || '').localeCompare(b.oraInizio || ''));

            if (impegniDelGiorno.length === 0) {
                bodyEl.innerHTML = `<p class="giorno-empty">Nessun impegno in programma</p>`;
            } else {
                bodyEl.innerHTML = impegniDelGiorno.map(imp => {
                    const creatore = imp.creatore || 'Utente';
                    const coloreUtente = utentiCollezioni[creatore.toLowerCase()] || '#3498db';
                    const bgTrasparente = hexToRgba(coloreUtente, 0.12);
                    const orarioStr = imp.oraInizio ? imp.oraInizio : 'Tutto il gg';

                    return `
                        <div class="impegno-quadratino" data-id="${imp.id}" style="background-color: ${bgTrasparente}; border-left-color: ${coloreUtente};">
                            <div class="impegno-quadratino-top">
                                <span class="impegno-quadratino-titolo">${imp.titolo || 'Impegno'}</span>
                                <span class="impegno-quadratino-creatore">(${creatore})</span>
                            </div>
                            <div class="impegno-quadratino-bottom">
                                <span class="impegno-quadratino-ora">
                                    <i class="fa-regular fa-clock"></i> ${orarioStr}
                                </span>
                                <div class="impegno-quadratino-azioni">
                                    <button class="btn-icon-quadratino delete" title="Elimina impegno" data-id="${imp.id}">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

                bodyEl.querySelectorAll('.impegno-quadratino').forEach(card => {
                    card.addEventListener('click', (e) => {
                        if (e.target.closest('.delete')) return;
                        const idImp = card.getAttribute('data-id');
                        const impegnoObj = appuntamentiSettimana.find(i => i.id === idImp);
                        if (impegnoObj) {
                            apriModaleImpegno(impegnoObj.data, impegnoObj);
                        }
                    });
                });

                bodyEl.querySelectorAll('.btn-icon-quadratino.delete').forEach(btnDel => {
                    btnDel.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const idImp = btnDel.getAttribute('data-id');
                        if (confirm("Sei sicuro di voler eliminare questo impegno?")) {
                            try {
                                await deleteDoc(doc(db, "appuntamenti", idImp));
                                await caricaEDisegnaSettimana(container);
                            } catch (err) {
                                console.error("Errore durante la cancellazione:", err);
                                alert("Impossibile eliminare l'impegno.");
                            }
                        }
                    });
                });
            }
        });

    } catch (err) {
        console.error("Errore durante il caricamento impegni:", err);
    }
}

// MODALE DI INSERIMENTO / MODIFICA (Solo Ora di Inizio)
function apriModaleImpegno(dataIso, impegnoEsistente = null) {
    const savedUser = localStorage.getItem('famiglia_pwa_user') || sessionStorage.getItem('famiglia_pwa_user');
    const userData = savedUser ? JSON.parse(savedUser) : { nome: 'Utente' };

    const isModifica = !!impegnoEsistente;
    const modalId = 'modal-impegno';

    const prevModal = document.getElementById(modalId);
    if (prevModal) prevModal.remove();

    const modalHtml = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${isModifica ? 'Modifica Impegno' : 'Nuovo Impegno'}</h3>
                    <button class="btn-close-modal" id="btn-close-modal">&times;</button>
                </div>
                <form id="form-impegno">
                    <div class="form-group">
                        <label for="imp-titolo">Titolo / Descrizione</label>
                        <input type="text" id="imp-titolo" value="${isModifica ? impegnoEsistente.titolo : ''}" required placeholder="Es. Turno, Visita medica, Calcio...">
                    </div>
                    <div class="form-group">
                        <label for="imp-data">Data</label>
                        <input type="date" id="imp-data" value="${dataIso}" required>
                    </div>
                    <div class="form-group">
                        <label for="imp-ora-inizio">Ora Inizio</label>
                        <input type="time" id="imp-ora-inizio" value="${isModifica ? (impegnoEsistente.oraInizio || '') : ''}">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-modal cancel" id="btn-cancel-modal">Annulla</button>
                        <button type="submit" class="btn-modal save">Salva</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalEl = document.getElementById(modalId);
    const btnClose = document.getElementById('btn-close-modal');
    const btnCancel = document.getElementById('btn-cancel-modal');
    const form = document.getElementById('form-impegno');

    const chiudiModale = () => modalEl.remove();

    btnClose.addEventListener('click', chiudiModale);
    btnCancel.addEventListener('click', chiudiModale);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const titolo = document.getElementById('imp-titolo').value.trim();
        const dataVal = document.getElementById('imp-data').value;
        const oraInizio = document.getElementById('imp-ora-inizio').value;

        if (!titolo || !dataVal) {
            alert("Inserisci titolo e data.");
            return;
        }

        const payload = {
            titolo: titolo,
            data: dataVal,
            oraInizio: oraInizio,
            creatore: isModifica ? impegnoEsistente.creatore : userData.nome
        };

        try {
            if (isModifica) {
                await updateDoc(doc(db, "appuntamenti", impegnoEsistente.id), payload);
            } else {
                await addDoc(collection(db, "appuntamenti"), payload);
            }

            chiudiModale();
            const contentArea = document.getElementById('content-area');
            await caricaEDisegnaSettimana(contentArea);

        } catch (err) {
            console.error("Errore durante il salvataggio:", err);
            alert("Si è verificato un errore durante il salvataggio.");
        }
    });
}
