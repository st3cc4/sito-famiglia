import { 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc, 
    updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { nomeUtenteCorrente, mappaColoriUtenti, formatCapitalize } from "./auth.js";

const modalAppuntamento = document.getElementById('modal-appuntamento');
const modalAppuntamentoTitle = document.getElementById('modal-appuntamento-title');
const appuntamentoForm = document.getElementById('appuntamento-form');
const appIdInput = document.getElementById('app-id');
const appTitolo = document.getElementById('app-titolo');
const appData = document.getElementById('app-data');
const appOraInizio = document.getElementById('app-ora-inizio');
const appOraFine = document.getElementById('app-ora-fine');
const appCreatore = document.getElementById('app-creatore');
const summaryAppuntamenti = document.getElementById('home-summary-appuntamenti');
const gridSettimanale = document.getElementById('grid-settimanale');
const btnPrevWeek = document.getElementById('btn-prev-week');
const btnNextWeek = document.getElementById('btn-next-week');
const settimanaLabel = document.getElementById('settimana-label');

function formatoDataEuropeo(dataIso) {
    if (!dataIso) return '';
    const parti = dataIso.split('-');
    if (parti.length !== 3) return dataIso;
    return `${parti[2]}/${parti[1]}/${parti[0]}`;
}

function getInizioSettimana(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
}

let dataInizioSettimanaCorrente = getInizioSettimana(new Date());

btnPrevWeek.addEventListener('click', () => {
    dataInizioSettimanaCorrente.setDate(dataInizioSettimanaCorrente.getDate() - 7);
    caricaAppuntamenti();
});

btnNextWeek.addEventListener('click', () => {
    dataInizioSettimanaCorrente.setDate(dataInizioSettimanaCorrente.getDate() + 7);
    caricaAppuntamenti();
});

appOraInizio.addEventListener('change', () => {
    const inizio = appOraInizio.value;
    if (inizio) {
        const [ore, minuti] = inizio.split(':').map(Number);
        let nuoveOre = ore + 1;
        if (nuoveOre >= 24) nuoveOre = 23; 
        const oreStr = String(nuoveOre).padStart(2, '0');
        const minStr = String(minuti).padStart(2, '0');
        appOraFine.value = `${oreStr}:${minStr}`;
    }
});

window.apriModalNuovoAppuntamento = function(dataSelezionata = "") {
    modalAppuntamentoTitle.textContent = "Nuovo Appuntamento";
    appuntamentoForm.reset();
    appIdInput.value = "";
    appCreatore.value = nomeUtenteCorrente;
    if (dataSelezionata) {
        appData.value = dataSelezionata;
    }
    modalAppuntamento.style.display = 'flex';
}

appuntamentoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titolo = formatCapitalize(appTitolo.value);
    const data = appData.value;
    const oraInizio = appOraInizio.value;
    const oraFine = appOraFine.value;
    const editId = appIdInput.value;

    const datiAppuntamento = {
        titolo,
        data,
        oraInizio,
        oraFine,
        creatore: nomeUtenteCorrente
    };

    try {
        if (editId) {
            await updateDoc(doc(db, "appuntamenti", editId), datiAppuntamento);
        } else {
            await addDoc(collection(db, "appuntamenti"), datiAppuntamento);
        }
        modalAppuntamento.style.display = 'none';
        appuntamentoForm.reset();
        caricaAppuntamenti();
    } catch (err) {
        alert("Errore nel salvataggio dell'appuntamento.");
    }
});

export async function caricaAppuntamenti() {
    gridSettimanale.innerHTML = `<p class="text-muted" style="padding: 20px;">Caricamento calendario...</p>`;
    summaryAppuntamenti.innerHTML = `<p class="text-muted">Caricamento in corso...</p>`;

    try {
        const querySnapshot = await getDocs(collection(db, "appuntamenti"));
        let appuntamenti = [];
        querySnapshot.forEach(docSnap => {
            appuntamenti.push({ id: docSnap.id, ...docSnap.data() });
        });

        let giorniSettimana = [];
        let curr = new Date(dataInizioSettimanaCorrente);
        for (let i = 0; i < 7; i++) {
            giorniSettimana.push(new Date(curr));
            curr.setDate(curr.getDate() + 1);
        }

        const dataInizioStr = giorniSettimana[0].toISOString().split('T')[0];
        const dataFineStr = giorniSettimana[6].toISOString().split('T')[0];

        settimanaLabel.textContent = `${formatoDataEuropeo(dataInizioStr)} - ${formatoDataEuropeo(dataFineStr)}`;

        const giorniNomi = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
        const oggiIso = new Date().toISOString().split('T')[0];

        let htmlGriglia = "";
        giorniSettimana.forEach((giornoDate, index) => {
            const isoDate = giornoDate.toISOString().split('T')[0];
            const isOggi = isoDate === oggiIso;
            const nomeGiorno = giorniNomi[index];
            const numGiorno = giornoDate.getDate();

            let appuntamentiGiorno = appuntamenti.filter(a => a.data === isoDate);
            appuntamentiGiorno.sort((a, b) => a.oraInizio.localeCompare(b.oraInizio));

            let htmlImpegni = "";
            appuntamentiGiorno.forEach(app => {
                const coloreCreatore = mappaColoriUtenti[app.creatore] || '#3b82f6';
                htmlImpegni += `
                    <div class="card-impegno-google" style="border-left-color: ${coloreCreatore};">
                        <div class="card-impegno-titolo">${app.titolo}</div>
                        <div class="card-impegno-orario">${app.oraInizio} - ${app.oraFine}</div>
                        <div class="card-impegno-creatore">Creato da: ${app.creatore}</div>
                        <div class="card-impegno-azioni">
                            <button class="btn-mini btn-mini-edit" onclick="modificaAppuntamento('${app.id}', '${app.titolo}', '${app.data}', '${app.oraInizio}', '${app.oraFine}')">Mod</button>
                            <button class="btn-mini btn-mini-del" onclick="eliminaAppuntamento('${app.id}')">Del</button>
                        </div>
                    </div>`;
            });

            htmlGriglia += `
                <div class="colonna-giorno-scheda">
                    <div class="header-giorno-moderno ${isOggi ? 'oggi' : ''}" onclick="apriModalNuovoAppuntamento('${isoDate}')" title="Clicca per aggiungere un impegno">
                        <div class="nome-giorno">${nomeGiorno}</div>
                        <div class="numero-giorno">${numGiorno}</div>
                    </div>
                    <div class="corpo-giorno-moderno">
                        ${htmlImpegni || '<span class="text-muted" style="font-size: 0.85rem;">Nessun impegno</span>'}
                    </div>
                </div>`;
        });

        gridSettimanale.innerHTML = htmlGriglia;

        let appFuturi = appuntamenti.filter(a => a.data >= oggiIso);
        appFuturi.sort((a, b) => a.data.localeCompare(b.data) || a.oraInizio.localeCompare(b.oraInizio));
        
        const dateDistinte = [...new Set(appFuturi.map(a => a.data))].slice(0, 3);
        const stiliColoriGiorni = [
            { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
            { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
            { bg: '#faf5ff', border: '#a855f7', text: '#6b21a8' } 
        ];

        let htmlHomeApp = "";
        if (dateDistinte.length === 0) {
            summaryAppuntamenti.innerHTML = `<p class="text-muted">Nessun appuntamento in programma.</p>`;
        } else {
            dateDistinte.forEach((dataIso, idx) => {
                const stile = stiliColoriGiorni[idx % stiliColoriGiorni.length];
                const appDelGiorno = appFuturi.filter(a => a.data === dataIso);

                htmlHomeApp += `
                    <div style="background-color: ${stile.bg}; border-left: 4px solid ${stile.border}; padding: 8px 12px; border-radius: 6px; margin-bottom: 10px;">
                        <div style="font-weight: bold; color: ${stile.text}; font-size: 0.85rem; margin-bottom: 6px;">
                            📅 ${formatoDataEuropeo(dataIso)}
                        </div>`;

                appDelGiorno.forEach(app => {
                    htmlHomeApp += `
                        <div style="padding: 4px 0; border-top: 1px dashed rgba(0,0,0,0.1); display: flex; justify-content: space-between; font-size: 0.9rem;">
                            <span><strong>${app.titolo}</strong> (${app.oraInizio})</span>
                            <span style="font-size: 0.8rem; color: #64748b;">${app.creatore}</span>
                        </div>`;
                });

                htmlHomeApp += `</div>`;
            });
            summaryAppuntamenti.innerHTML = htmlHomeApp;
        }

    } catch (err) {
        gridSettimanale.innerHTML = `<p class="text-muted" style="padding: 20px;">Errore nel caricamento del calendario.</p>`;
        summaryAppuntamenti.innerHTML = `<p class="text-muted">Errore caricamento.</p>`;
    }
}

window.eliminaAppuntamento = async function(id) {
    if (confirm("Vuoi eliminare questo appuntamento?")) {
        await deleteDoc(doc(db, "appuntamenti", id));
        caricaAppuntamenti();
    }
}

window.modificaAppuntamento = function(id, titolo, data, oraInizio, oraFine) {
    modalAppuntamentoTitle.textContent = "Modifica Appuntamento";
    appIdInput.value = id;
    appTitolo.value = titolo;
    appData.value = data;
    appOraInizio.value = oraInizio;
    appOraFine.value = oraFine;
    appCreatore.value = nomeUtenteCorrente;
    modalAppuntamento.style.display = 'flex';
}
