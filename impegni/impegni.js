import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    deleteDoc, 
    updateDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "../firebase-config.js";
import { nomeUtenteCorrente, isAdminCorrente } from "../auth.js";

const btnApriModalApp = document.getElementById('btn-apri-modal-appuntamento');
const btnChiudiModalApp = document.getElementById('btn-chiudi-modal-appuntamento');
const modalApp = document.getElementById('modal-appuntamento');
const modalAppTitle = document.getElementById('modal-appuntamento-title');
const appForm = document.getElementById('appuntamento-form');
const appIdInput = document.getElementById('app-id');
const appTitoloInput = document.getElementById('app-titolo');
const appDataInput = document.getElementById('app-data');
const appOraInizioInput = document.getElementById('app-ora-inizio');
const appOraFineInput = document.getElementById('app-ora-fine');
const gridSettimanale = document.getElementById('grid-settimanale');
const settimanaLabel = document.getElementById('settimana-label');
const btnPrevWeek = document.getElementById('btn-prev-week');
const btnNextWeek = document.getElementById('btn-next-week');
const summaryAppuntamenti = document.getElementById('home-summary-appuntamenti');

let dataCorrenteSettimana = new Date();

if (btnApriModalApp) {
    btnApriModalApp.addEventListener('click', () => {
        modalAppTitle.textContent = "Nuovo Impegno";
        appForm.reset();
        appIdInput.value = "";
        modalApp.style.display = 'flex';
    });
}

if (btnChiudiModalApp) {
    btnChiudiModalApp.addEventListener('click', () => {
        modalApp.style.display = 'none';
    });
}

if (appForm) {
    appForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titolo = appTitoloInput.value.trim();
        const data = appDataInput.value;
        const oraInizio = appOraInizioInput.value;
        const oraFine = appOraFineInput.value;
        const editId = appIdInput.value;

        const datiApp = {
            titolo,
            data,
            oraInizio,
            oraFine,
            creatore: nomeUtenteCorrente || "Famiglia"
        };

        try {
            if (editId) {
                const docRef = doc(db, "appuntamenti", editId);
                await updateDoc(docRef, datiApp);
            } else {
                await addDoc(collection(db, "appuntamenti"), datiApp);
            }
            modalApp.style.display = 'none';
            appForm.reset();
            caricaAppuntamenti();
        } catch (err) {
            console.error("Errore salvataggio impegno:", err);
            alert("Errore nel salvataggio dell'impegno.");
        }
    });
}

export async function caricaAppuntamenti() {
    try {
        const querySnapshot = await getDocs(collection(db, "appuntamenti"));
        let appuntamenti = [];
        querySnapshot.forEach(docSnap => {
            appuntamenti.push({ id: docSnap.id, ...docSnap.data() });
        });

        let mappaColoriUtenti = {};
        try {
            const utentiSnap = await getDocs(collection(db, "utenti"));
            utentiSnap.forEach(uDoc => {
                const uData = uDoc.data();
                mappaColoriUtenti[uDoc.id.toLowerCase()] = uData.colore || '#3b82f6';
            });
        } catch(e) {}

        // 1. Popolamento Scheda HOME Impegni: Tutti gli impegni della SETTIMANA CORRENTE
        if (summaryAppuntamenti) {
            const oggi = new Date();
            const startOfWeek = getStartOfWeek(oggi);
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
            const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

            const impegniSettimana = appuntamenti
                .filter(a => a.data >= startOfWeekStr && a.data <= endOfWeekStr)
                .sort((a, b) => (a.data + a.oraInizio).localeCompare(b.data + b.oraInizio));

            let htmlSummary = "";
            impegniSettimana.forEach(a => {
                const [yyyy, mm, dd] = a.data.split('-');
                const dataFormattata = `${dd}/${mm}/${yyyy}`;
                const creatore = a.creatore || 'Famiglia';
                const coloreUser = mappaColoriUtenti[creatore.toLowerCase()] || '#3b82f6';

                htmlSummary += `
                    <div style="display: flex; justify-content: space-between; align-items: center; background-color: ${coloreUser}15; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; border-left: 6px solid ${coloreUser}; border: 1px solid ${coloreUser}40;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <strong style="font-size: 1.05rem; color: #1e293b;">${a.titolo}</strong>
                            <span style="font-size: 1.05rem; color: #334155; font-weight: 700;">(${dataFormattata} - ${a.oraInizio})</span>
                        </div>
                        <span style="font-size: 0.9rem; font-weight: 700; color: #ffffff; background-color: ${coloreUser}; padding: 4px 12px; border-radius: 6px;">${creatore}</span>
                    </div>
                `;
            });

            summaryAppuntamenti.innerHTML = htmlSummary || `<p class="text-muted">Nessun impegno programmato per questa settimana.</p>`;
        }

        aggiornaGrigliaSettimanale(appuntamenti, mappaColoriUtenti);

    } catch (err) {
        console.error("Errore caricaAppuntamenti:", err);
    }
}

function aggiornaGrigliaSettimanale(appuntamenti, mappaColori) {
    if (!gridSettimanale) return;

    const startOfWeek = getStartOfWeek(dataCorrenteSettimana);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const formatDataShort = (d) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    if (settimanaLabel) {
        settimanaLabel.textContent = `Dal ${formatDataShort(startOfWeek)} al ${formatDataShort(endOfWeek)}`;
    }

    gridSettimanale.innerHTML = "";
    const giorniSettimana = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

    for (let i = 0; i < 7; i++) {
        const giornoCorrente = new Date(startOfWeek);
        giornoCorrente.setDate(startOfWeek.getDate() + i);
        const dataIso = giornoCorrente.toISOString().split('T')[0];

        const impegniDelGiorno = appuntamenti
            .filter(a => a.data === dataIso)
            .sort((a, b) => a.oraInizio.localeCompare(b.oraInizio));

        const col = document.createElement('div');
        col.className = 'giorno-colonna';
        col.innerHTML = `
            <div class="giorno-header">
                <strong>${giorniSettimana[i]}</strong>
                <span style="font-size: 0.85rem; color: #64748b;">${formatDataShort(giornoCorrente)}</span>
            </div>
            <div class="giorno-eventi" id="giorno-${dataIso}"></div>
        `;

        const containerEventi = col.querySelector(`#giorno-${dataIso}`);
        impegniDelGiorno.forEach(imp => {
            const creatore = imp.creatore || 'Famiglia';
            const colore = mappaColori[creatore.toLowerCase()] || '#3b82f6';
            const userIsAdmin = typeof isAdminCorrente === 'function' ? isAdminCorrente() : Boolean(isAdminCorrente);
            const puoModificare = userIsAdmin || (creatore.toLowerCase() === (nomeUtenteCorrente || "").toLowerCase());

            const ev = document.createElement('div');
            ev.className = 'evento-card';
            ev.style.borderLeft = `4px solid ${colore}`;
            ev.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 6px;">
                    <div>
                        <strong style="font-size: 1rem; color: #0f172a; display: block;">${imp.titolo}</strong>
                        <span style="font-size: 0.95rem; font-weight: 600; color: #475569;">${imp.oraInizio} - ${imp.oraFine}</span>
                    </div>
                    <span style="font-size: 0.8rem; font-weight: 700; color: #ffffff; background-color: ${colore}; padding: 3px 8px; border-radius: 4px;">${creatore}</span>
                </div>
                ${puoModificare ? `
                    <div style="margin-top: 6px; display: flex; gap: 6px; justify-content: flex-end;">
                        <button class="btn-modifica" style="font-size: 0.75rem; padding: 2px 6px;" onclick="modificaAppuntamento('${imp.id}')">Mod.</button>
                        <button class="btn-elimina" style="font-size: 0.75rem; padding: 2px 6px;" onclick="eliminaAppuntamento('${imp.id}')">&times;</button>
                    </div>
                ` : ''}
            `;
            containerEventi.appendChild(ev);
        });

        gridSettimanale.appendChild(col);
    }
}

function getStartOfWeek(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
}

if (btnPrevWeek) {
    btnPrevWeek.addEventListener('click', () => {
        dataCorrenteSettimana.setDate(dataCorrenteSettimana.getDate() - 7);
        caricaAppuntamenti();
    });
}

if (btnNextWeek) {
    btnNextWeek.addEventListener('click', () => {
        dataCorrenteSettimana.setDate(dataCorrenteSettimana.getDate() + 7);
        caricaAppuntamenti();
    });
}

window.modificaAppuntamento = async function(id) {
    try {
        const docSnap = await getDoc(doc(db, "appuntamenti", id));
        if (docSnap.exists()) {
            const a = docSnap.data();
            modalAppTitle.textContent = "Modifica Impegno";
            appIdInput.value = id;
            appTitoloInput.value = a.titolo || "";
            appDataInput.value = a.data || "";
            appOraInizioInput.value = a.oraInizio || "";
            appOraFineInput.value = a.oraFine || "";
            modalApp.style.display = 'flex';
        }
    } catch (err) {
        alert("Errore nel recupero dell'impegno.");
    }
}

window.eliminaAppuntamento = async function(id) {
    if (confirm("Vuoi eliminare questo impegno?")) {
        try {
            await deleteDoc(doc(db, "appuntamenti", id));
            caricaAppuntamenti();
        } catch (err) {
            alert("Errore nell'eliminazione.");
        }
    }
}
