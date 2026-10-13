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
import { nomeUtenteCorrente, formatCapitalize } from "./auth.js";

const btnApriModalAppuntamento = document.getElementById('btn-apri-modal-appuntamento');
const btnChiudiModalAppuntamento = document.getElementById('btn-chiudi-modal-appuntamento');
const modalAppuntamento = document.getElementById('modal-appuntamento');
const modalAppuntamentoTitle = document.getElementById('modal-appuntamento-title');
const appuntamentoForm = document.getElementById('appuntamento-form');
const appIdInput = document.getElementById('app-id');
const appTitoloInput = document.getElementById('app-titolo');
const appDataInput = document.getElementById('app-data');
const appOraInizioInput = document.getElementById('app-ora-inizio');
const appOraFineInput = document.getElementById('app-ora-fine');
const appCreatoreInput = document.getElementById('app-creatore');

const gridSettimanale = document.getElementById('grid-settimanale');
const settimanaLabel = document.getElementById('settimana-label');
const btnPrevWeek = document.getElementById('btn-prev-week');
const btnNextWeek = document.getElementById('btn-next-week');
const summaryAppuntamenti = document.getElementById('home-summary-appuntamenti');

let dataCorrenteInizioSettimana = getInizioSettimana(new Date());

function getInizioSettimana(d) {
    const data = new Date(d);
    const giorno = data.getDay();
    const diff = data.getDate() - giorno + (giorno === 0 ? -6 : 1); // Lunedì come inizio
    return new Date(data.setDate(diff));
}

function formattaDataIso(data) {
    return data.toISOString().split('T')[0];
}

function formatoDataEuropeo(dataIso) {
    if (!dataIso) return '';
    const parti = dataIso.split('-');
    if (parti.length !== 3) return dataIso;
    return `${parti[2]}/${parti[1]}/${parti[0]}`;
}

btnApriModalAppuntamento.addEventListener('click', () => {
    window.apriModalNuovoAppuntamento();
});

window.apriModalNuovoAppuntamento = function(dataSelezionata = '') {
    modalAppuntamentoTitle.textContent = "Nuovo Appuntamento";
    appuntamentoForm.reset();
    appIdInput.value = "";
    appCreatoreInput.value = nomeUtenteCorrente;
    if (dataSelezionata) {
        appDataInput.value = dataSelezionata;
    } else {
        appDataInput.value = formattaDataIso(new Date());
    }
    modalAppuntamento.style.display = 'flex';
}

btnChiudiModalAppuntamento.addEventListener('click', () => {
    modalAppuntamento.style.display = 'none';
});

appuntamentoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titolo = formatCapitalize(appTitoloInput.value);
    const data = appDataInput.value;
    const oraInizio = appOraInizioInput.value;
    const oraFine = appOraFineInput.value;
    const editId = appIdInput.value;

    const datiImpegno = {
        titolo,
        data,
        oraInizio,
        oraFine,
        creatore: nomeUtenteCorrente
    };

    try {
        if (editId) {
            await updateDoc(doc(db, "appuntamenti", editId), datiImpegno);
        } else {
            await addDoc(collection(db, "appuntamenti"), datiImpegno);
        }
        modalAppuntamento.style.display = 'none';
        appuntamentoForm.reset();
        caricaAppuntamenti();
    } catch (err) {
        alert("Errore nel salvataggio dell'appuntamento.");
    }
});

export async function caricaAppuntamenti() {
    if (!gridSettimanale) return;
    
    gridSettimanale.innerHTML = `<p class="text-muted">Caricamento appuntamenti...</p>`;
    if (summaryAppuntamenti) summaryAppuntamenti.innerHTML = `<p class="text-muted">Caricamento in corso...</p>`;

    try {
        const querySnapshot = await getDocs(collection(db, "appuntamenti"));
        let appuntamenti = [];
        querySnapshot.forEach(docSnap => {
            appuntamenti.push({ id: docSnap.id, ...docSnap.data() });
        });

        appuntamenti.sort((a, b) => {
            if (a.data === b.data) {
                return (a.oraInizio || "").localeCompare(b.oraInizio || "");
            }
            return new Date(a.data) - new Date(b.data);
        });

        // Calcolo giorni della settimana corrente (in verticale)
        let giorniSettimana = [];
        let tempDate = new Date(dataCorrenteInizioSettimana);
        
        for (let i = 0; i < 7; i++) {
            giorniSettimana.push(new Date(tempDate));
            tempDate.setDate(tempDate.getDate() + 1);
        }

        const dataFine = new Date(tempDate);
        dataFine.setDate(dataFine.getDate() - 1);
        settimanaLabel.textContent = `${formatoDataEuropeo(formattaDataIso(giorniSettimana[0]))} - ${formatoDataEuropeo(formattaDataIso(dataFine))}`;

        const oggiStr = formattaDataIso(new Date());

        let htmlGrigliaVerticale = "";
        const nomiGiorni = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

        giorniSettimana.forEach((giornoDate, index) => {
            const dataIso = formattaDataIso(giornoDate);
            const nomeGiorno = nomiGiorni[index];
            const isOggi = (dataIso === oggiStr);

            // Calcolo urgenza/sfondo identico alle scadenze
            const dataGiornoObj = new Date(dataIso);
            dataGiornoObj.setHours(0,0,0,0);
            const oggiObj = new Date();
            oggiObj.setHours(0,0,0,0);
            
            const diffTempo = dataGiornoObj - oggiObj;
            const diffGiorni = Math.round(diffTempo / (1000 * 60 * 60 * 24));

            let statusClass = "status-green";
            if (diffGiorni <= 0) {
                statusClass = "status-red"; // Passati o oggi
            } else if (diffGiorni <= 3) {
                statusClass = "status-orange"; // Nei prossimi 3 giorni
            } else {
                statusClass = "status-green"; // Più avanti
            }

            // Filtra impegni per questo giorno
            const impegniGiorno = appuntamenti.filter(a => a.data === dataIso);

            let htmlImpegni = "";
            if (impegniGiorno.length === 0) {
                htmlImpegni = `<p class="text-muted" style="font-size: 0.85rem; padding: 5px;">Nessun impegno</p>`;
            } else {
                impegniGiorno.forEach(imp => {
                    const creatoreImp = imp.creatore || "Famiglia";
                    htmlImpegni += `
                        <div class="card-impegno-google">
                            <div style="font-weight: 600;">${imp.titolo}</div>
                            <div style="font-size: 0.8rem; color: #475569;">${imp.oraInizio || ''} - ${imp.oraFine || ''}</div>
                            <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">[${creatoreImp}]</div>
                            <div style="margin-top: 6px; display: flex; gap: 5px;">
                                <button class="btn-modifica" style="padding: 2px 8px; font-size: 0.75rem;" onclick="modificaAppuntamento('${imp.id}')">Mod.</button>
                                <button class="btn-elimina" style="padding: 2px 8px; font-size: 0.75rem;" onclick="eliminaAppuntamento('${imp.id}')">Del</button>
                            </div>
                        </div>`;
                });
            }

            htmlGrigliaVerticale += `
                <div class="colonna-giorno-scheda ${statusClass}" style="margin-bottom: 12px;">
                    <div class="header-giorno-moderno ${isOggi ? 'oggi' : ''}" onclick="apriModalNuovoAppuntamento('${dataIso}')" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; cursor: pointer;">
                        <span style="font-weight: bold; font-size: 1rem;">${nomeGiorno} (${formatoDataEuropeo(dataIso)})</span>
                        <span style="font-size: 0.85rem; opacity: 0.8;">+ Aggiungi</span>
                    </div>
                    <div class="corpo-giorno-moderno" style="display: flex; flex-direction: column; gap: 8px; padding: 12px;">
                        ${htmlImpegni}
                    </div>
                </div>`;
        });

        gridSettimanale.innerHTML = htmlGrigliaVerticale;

        // Riepilogo in Home (prossimi appuntamenti)
        if (summaryAppuntamenti) {
            let htmlHomeApp = "";
            const impegniFuturi = appuntamenti.filter(a => new Date(a.data) >= oggiObj).slice(0, 4);
            
            if (impegniFuturi.length === 0) {
                summaryAppuntamenti.innerHTML = `<p class="text-muted">Nessun appuntamento in programma.</p>`;
            } else {
                impegniFuturi.forEach(imp => {
                    htmlHomeApp += `
                        <div class="scadenza-block-style status-green">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div><strong>${imp.titolo}</strong> <span style="font-size: 0.85rem; opacity: 0.85;">(${formatoDataEuropeo(imp.data)} - ${imp.oraInizio || ''})</span></div>
                                <div style="font-size: 0.85rem;">${imp.creatore || ''}</div>
                            </div>
                        </div>`;
                });
                summaryAppuntamenti.innerHTML = htmlHomeApp;
            }
        }

    } catch (err) {
        gridSettimanale.innerHTML = `<p class="text-muted">Errore nel caricamento degli appuntamenti.</p>`;
    }
}

btnPrevWeek.addEventListener('click', () => {
    dataCorrenteInizioSettimana.setDate(dataCorrenteInizioSettimana.getDate() - 7);
    caricaAppuntamenti();
});

btnNextWeek.addEventListener('click', () => {
    dataCorrenteInizioSettimana.setDate(dataCorrenteInizioSettimana.getDate() + 7);
    caricaAppuntamenti();
});

window.eliminaAppuntamento = async function(id) {
    if (confirm("Vuoi eliminare questo appuntamento?")) {
        await deleteDoc(doc(db, "appuntamenti", id));
        caricaAppuntamenti();
    }
}

window.modificaAppuntamento = async function(id) {
    try {
        const docSnap = await getDoc(doc(db, "appuntamenti", id));
        if (docSnap.exists()) {
            const a = docSnap.data();
            modalAppuntamentoTitle.textContent = "Modifica Appuntamento";
            appIdInput.value = id;
            appTitoloInput.value = a.titolo || "";
            appDataInput.value = a.data || "";
            appOraInizioInput.value = a.oraInizio || "";
            appOraFineInput.value = a.oraFine || "";
            appCreatoreInput.value = a.creatore || nomeUtenteCorrente;
            modalAppuntamento.style.display = 'flex';
        }
    } catch (err) {
        alert("Errore nel recupero dell'appuntamento.");
    }
}
