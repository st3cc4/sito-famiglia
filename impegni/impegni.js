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

let utentiCollezioni = {};
let dataInizioSettimana = getLunedimorning(new Date());

export async function initImpegniSection(container) {
    await caricaUtenti();
    await caricaEDisegnaSettimana(container);
    avviaControlloPromemoriaImpegni();
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

function getLunedimorning(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const lunedi = new Date(date.setDate(diff));
    lunedi.setHours(0, 0, 0, 0);
    return lunedi;
}

function formatDateIso(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateShort(d) {
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${month}`;
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
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

// --- Controllo Promemoria 2 Ore e 30 Minuti Prima ---
async function avviaControlloPromemoriaImpegni() {
    try {
        const snapshot = await getDocs(collection(db, "appuntamenti"));
        const adesso = new Date();
        const oggiIso = formatDateIso(adesso);

        snapshot.forEach(docSnap => {
            const app = docSnap.data();
            if (app.data === oggiIso && app.oraInizio) {
                const [ore, minuti] = app.oraInizio.split(':').map(Number);
                const dataEvento = new Date();
                dataEvento.setHours(ore, minuti, 0, 0);

                const diffMinuti = (dataEvento - adesso) / (1000 * 60);

                // Controlla se mancano circa 2 ore e 30 minuti (150 minuti, con un range di tolleranza di 2 minuti)
                if (diffMinuti >= 148 && diffMinuti <= 152) {
                    const chiaveNotifica = `promemoria_inviato_${docSnap.id}_${oggiIso}`;
                    if (!localStorage.getItem(chiaveNotifica)) {
                        if (typeof window.inviaNotificaFamiglia === 'function') {
                            window.inviaNotificaFamiglia(
                                "⏰ Promemoria Impegno",
                                `L'impegno "${app.titolo}" inserito da ${app.creatore || 'Famiglia'} inizierà tra circa 2 ore e mezza (${app.oraInizio}).`
                            );
                        }
                        localStorage.setItem(chiaveNotifica, 'true');
                    }
                }
            }
        });
    } catch (e) {
        console.error("Errore nel controllo promemoria impegni:", e);
    }
}

async function caricaEDisegnaSettimana(container) {
    const domenica = new Date(dataInizioSettimana);
    domenica.setDate(domenica.getDate() + 6);

    const testoSettimana = `${formatDateShort(dataInizioSettimana)} - ${formatDateShort(domenica)}`;

    container.innerHTML = `
        <div class="impegni-container">
            <!-- HEADER CON TASTO HOME A SINISTRA E NAVIGAZIONE SETTIMANA -->
            <div class="impegni-header">
                <div class="week-nav-left">
                    <button class="btn-week-nav" id="btn-torna-home">
                        <i class="fa-solid fa-arrow-left"></i> Home
                    </button>
                </div>
                <div class="week-nav-right">
                    <button class="btn-week-nav" id="btn-sett-prec"><i class="fa-solid fa-chevron-left"></i> Prec.</button>
                    <div class="current-week-label" id="titolo-settimana">${testoSettimana}</div>
                    <button class="btn-week-nav" id="btn-sett-succ">Succ. <i class="fa-solid fa-chevron-right"></i></button>
                </div>
            </div>

            <div class="giorni-list" id="giorni-container">
                <p style="color: #64748b; padding: 20px;">Caricamento impegni in corso...</p>
            </div>
        </div>
    `;

    document.getElementById('btn-torna-home').addEventListener('click', () => {
        if (window.selezionaScheda) {
            window.selezionaScheda('dashboard');
        } else {
            window.location.reload();
        }
    });

    document.getElementById('btn-sett-prec').addEventListener('click', () => {
        dataInizioSettimana.setDate(dataInizioSettimana.getDate() - 7);
        caricaEDisegnaSettimana(container);
    });

    document.getElementById('btn-sett-succ').addEventListener('click', () => {
        dataInizioSettimana.setDate(dataInizioSettimana.getDate() + 7);
        caricaEDisegnaSettimana(container);
    });

    try {
        const appuntamentiSnapshot = await getDocs(collection(db, "appuntamenti"));
        const tuttiAppuntamenti = [];

        appuntamentiSnapshot.forEach(docSnap => {
            tuttiAppuntamenti.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        disegnaGiorniSettimana(tuttiAppuntamenti);

    } catch (err) {
        console.error("Errore caricamento appuntamenti:", err);
        document.getElementById('giorni-container').innerHTML = '<p style="color:red;">Errore durante il caricamento degli impegni.</p>';
    }
}

function disegnaGiorniSettimana(appuntamenti) {
    const giorniContainer = document.getElementById('giorni-container');
    if (!giorniContainer) return;

    const nomiGiorni = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
    const classiCSSGiorni = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'];
    let htmlGiorni = '';

    for (let i = 0; i < 7; i++) {
        const dataGiorno = new Date(dataInizioSettimana);
        dataGiorno.setDate(dataGiorno.getDate() + i);

        const dataIso = formatDateIso(dataGiorno);
        const dataLeggibile = `${nomiGiorni[i]} (${formatDateShort(dataGiorno)})`;
        const classeGiorno = classiCSSGiorni[i];

        const impegniDelGiorno = appuntamenti.filter(app => app.data === dataIso);
        impegniDelGiorno.sort((a, b) => (a.oraInizio || '').localeCompare(b.oraInizio || ''));

        htmlGiorni += `
            <div class="giorno-card ${classeGiorno}">
                <div class="giorno-header btn-add-giorno" data-date="${dataIso}" style="cursor: pointer;" title="Clicca per aggiungere un impegno">
                    <span class="giorno-titolo">${dataLeggibile}</span>
                </div>
                <div class="giorno-body">
                    ${impegniDelGiorno.length > 0 ? impegniDelGiorno.map(imp => {
                        const creatore = imp.creatore || 'Utente';
                        const coloreUtente = utentiCollezioni[creatore.toLowerCase()] || '#3498db';
                        const bgTrasparente = hexToRgba(coloreUtente, 0.12);
                        
                        let orarioStr = imp.oraInizio || 'Tutto il gg';
                        if (imp.oraInizio && imp.oraFine) {
                            orarioStr = `${imp.oraInizio} - ${imp.oraFine}`;
                        }

                        return `
                            <div class="impegno-quadratino" data-id="${imp.id}" style="background-color: ${bgTrasparente}; border-left-color: ${coloreUtente};">
                                <div class="impegno-quadratino-top">
                                    <span class="impegno-quadratino-titolo">${capitalize(imp.titolo)}</span>
                                    <span class="impegno-quadratino-creatore">(${creatore})</span>
                                </div>
                                <div class="impegno-quadratino-bottom">
                                    <span class="impegno-quadratino-ora">
                                        <i class="fa-regular fa-clock"></i> ${orarioStr}
                                    </span>
                                    <div class="impegno-quadratino-azioni">
                                        <button class="btn-icon-quadratino delete btn-delete-impegno" data-id="${imp.id}" title="Elimina">
                                            <i class="fa-solid fa-trash-can"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('') : '<span class="giorno-empty">Nessun impegno in programma</span>'}
                </div>
            </div>
        `;
    }

    giorniContainer.innerHTML = htmlGiorni;

    giorniContainer.querySelectorAll('.btn-add-giorno').forEach(headerEl => {
        headerEl.addEventListener('click', (e) => {
            const dateIso = e.currentTarget.getAttribute('data-date');
            apriModaleFormImpegno(null, dateIso);
        });
    });

    giorniContainer.querySelectorAll('.impegno-quadratino').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-delete-impegno')) return;
            const idImp = card.getAttribute('data-id');
            const impObj = appuntamenti.find(a => a.id === idImp);
            if (impObj) apriModaleFormImpegno(impObj);
        });
    });

    giorniContainer.querySelectorAll('.btn-delete-impegno').forEach(btnDel => {
        btnDel.addEventListener('click', async (e) => {
            e.stopPropagation();
            const idImp = btnDel.getAttribute('data-id');
            if (confirm("Sei sicuro di voler eliminare questo impegno?")) {
                try {
                    await deleteDoc(doc(db, "appuntamenti", idImp));
                    const contentArea = document.getElementById('content-area');
                    await caricaEDisegnaSettimana(contentArea);
                } catch (err) {
                    console.error("Errore cancellazione impegno:", err);
                    alert("Impossibile eliminare l'impegno.");
                }
            }
        });
    });
}

function apriModaleFormImpegno(impegnoEsistente = null, dataPredefinitaIso = '') {
    const savedUser = localStorage.getItem('famiglia_session') || sessionStorage.getItem('famiglia_session');
    const userData = savedUser ? JSON.parse(savedUser) : { nome: 'Utente' };

    const isModifica = !!impegnoEsistente;
    const modalId = 'modal-form-impegno';

    const prevModal = document.getElementById(modalId);
    if (prevModal) prevModal.remove();

    const dataVal = isModifica ? impegnoEsistente.data : (dataPredefinitaIso || formatDateIso(new Date()));

    const modalHtml = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${isModifica ? 'Modifica Impegno' : 'Nuovo Impegno'}</h3>
                    <button class="btn-close-modal" id="btn-close-impegno">&times;</button>
                </div>
                <form id="form-impegno">
                    <div class="form-group">
                        <label for="imp-titolo">Titolo / Descrizione</label>
                        <input type="text" id="imp-titolo" value="${isModifica ? impegnoEsistente.titolo || '' : ''}" required placeholder="Es. Turno di lavoro, Visita...">
                    </div>

                    <div class="form-group">
                        <label for="imp-data">Data</label>
                        <input type="date" id="imp-data" value="${dataVal}" required>
                    </div>

                    <div style="display: flex; gap: 10px;">
                        <div class="form-group" style="flex: 1;">
                            <label for="imp-ora-inizio">Ora Inizio</label>
                            <input type="time" id="imp-ora-inizio" value="${isModifica ? impegnoEsistente.oraInizio || '' : ''}">
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label for="imp-ora-fine">Ora Fine</label>
                            <input type="time" id="imp-ora-fine" value="${isModifica ? impegnoEsistente.oraFine || '' : ''}">
                        </div>
                    </div>

                    <!-- Pulsante Sincronizzazione Google Calendar -->
                    <div class="form-group" style="margin-top: 10px;">
                        <button type="button" id="btn-gcalendar" class="btn-primary" style="background-color: #4285F4; width: 100%; justify-content: center; gap: 8px;">
                            <i class="fa-brands fa-google"></i> Aggiungi a Google Calendar
                        </button>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn-modal cancel" id="btn-cancel-impegno">Annulla</button>
                        <button type="submit" class="btn-modal save">Salva</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalEl = document.getElementById(modalId);
    const btnClose = document.getElementById('btn-close-impegno');
    const btnCancel = document.getElementById('btn-cancel-impegno');
    const form = document.getElementById('form-impegno');
    const btnGCalendar = document.getElementById('btn-gcalendar');

    const inputOraInizio = document.getElementById('imp-ora-inizio');
    const inputOraFine = document.getElementById('imp-ora-fine');

    inputOraInizio.addEventListener('change', () => {
        const valInizio = inputOraInizio.value;
        if (valInizio && (!inputOraFine.value || !isModifica)) {
            const parti = valInizio.split(':');
            let ore = parseInt(parti[0], 10);
            let minuti = parseInt(parti[1], 10);

            ore = (ore + 1) % 24;
            const oreStr = String(ore).padStart(2, '0');
            const minStr = String(minuti).padStart(2, '0');

            inputOraFine.value = `${oreStr}:${minStr}`;
        }
    });

    // --- Integrazione Google Calendar ---
    btnGCalendar.addEventListener('click', () => {
        const titoloVal = document.getElementById('imp-titolo').value.trim() || 'Impegno Famiglia';
        const dataValG = document.getElementById('imp-data').value;
        const oraInizioVal = document.getElementById('imp-ora-inizio').value;
        const oraFineVal = document.getElementById('imp-ora-fine').value;

        let dataOraInizioIso = dataValG.replace(/-/g, '');
        let dataOraFineIso = dataValG.replace(/-/g, '');

        if (oraInizioVal) {
            dataOraInizioIso += 'T' + oraInizioVal.replace(':', '') + '00';
        } else {
            dataOraInizioIso += 'T090000';
        }

        if (oraFineVal) {
            dataOraFineIso += 'T' + oraFineVal.replace(':', '') + '00';
        } else {
            dataOraFineIso += 'T100000';
        }

        const urlCalendar = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titoloVal)}&dates=${dataOraInizioIso}/${dataOraFineIso}&details=${encodeURIComponent('Inserito tramite Portale Famiglia')}`;
        window.open(urlCalendar, '_blank');
    });

    const chiudiModale = () => modalEl.remove();

    btnClose.addEventListener('click', chiudiModale);
    btnCancel.addEventListener('click', chiudiModale);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const titolo = capitalize(document.getElementById('imp-titolo').value.trim());
        const data = document.getElementById('imp-data').value;
        const oraInizio = document.getElementById('imp-ora-inizio').value;
        const oraFine = document.getElementById('imp-ora-fine').value;
        const creatoreCorrente = isModifica ? impegnoEsistente.creatore : userData.nome;

        if (!titolo || !data) {
            alert("Compila i campi richiesti.");
            return;
        }

        const payload = {
            titolo: titolo,
            data: data,
            oraInizio: oraInizio,
            oraFine: oraFine,
            creatore: creatoreCorrente
        };

        try {
            if (isModifica) {
                await updateDoc(doc(db, "appuntamenti", impegnoEsistente.id), payload);
            } else {
                await addDoc(collection(db, "appuntamenti"), payload);
                if (typeof window.inviaNotificaFamiglia === 'function') {
                    window.inviaNotificaFamiglia(
                        "📅 Nuovo Impegno Aggiunto",
                        `"${titolo}" aggiunto da ${creatoreCorrente} per il giorno ${formatDateShort(new Date(data))}.`
                    );
                }
            }

            chiudiModale();
            const contentArea = document.getElementById('content-area');
            await caricaEDisegnaSettimana(contentArea);

        } catch (err) {
            console.error("Errore salvataggio impegno:", err);
            alert("Si è verificato un errore durante il salvataggio.");
        }
    });
}
