import { 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "../firebase-config.js";
import { nomeUtenteCorrente, isAdminCorrente } from "../auth.js";

let dataInizioSettimanaCorrente = new Date();

function ottieniInizioSettimana(d) {
    const data = new Date(d);
    const day = data.getDay();
    const diff = data.getDate() - day + (day === 0 ? -6 : 1);
    const inizio = new Date(data.setDate(diff));
    inizio.setHours(0, 0, 0, 0);
    return inizio;
}

dataInizioSettimanaCorrente = ottieniInizioSettimana(new Date());

const btnPrevWeek = document.getElementById('btn-prev-week');
const btnNextWeek = document.getElementById('btn-next-week');
const settimanaLabel = document.getElementById('settimana-label');
const gridSettimanale = document.getElementById('grid-settimanale');
const summaryAppuntamenti = document.getElementById('home-summary-appuntamenti');

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

if (btnPrevWeek) {
    btnPrevWeek.addEventListener('click', () => {
        dataInizioSettimanaCorrente.setDate(dataInizioSettimanaCorrente.getDate() - 7);
        caricaAppuntamenti();
    });
}

if (btnNextWeek) {
    btnNextWeek.addEventListener('click', () => {
        dataInizioSettimanaCorrente.setDate(dataInizioSettimanaCorrente.getDate() + 7);
        caricaAppuntamenti();
    });
}

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
                await updateDoc(doc(db, "appuntamenti", editId), datiApp);
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

        // 1. Popolamento Home Summary Impegni
        if (summaryAppuntamenti) {
            const inizioSettimanaOggi = ottieniInizioSettimana(new Date());
            const fineSettimanaOggi = new Date(inizioSettimanaOggi);
            fineSettimanaOggi.setDate(fineSettimanaOggi.getDate() + 6);
            fineSettimanaOggi.setHours(23, 59, 59, 999);

            let appSettimanaOggi = appuntamenti.filter(a => {
                const d = new Date(a.data);
                return d >= inizioSettimanaOggi && d <= fineSettimanaOggi;
            });

            appSettimanaOggi.sort((a, b) => new Date(a.data + 'T' + a.oraInizio) - new Date(b.data + 'T' + b.oraInizio));

            let htmlSummary = "";
            appSettimanaOggi.forEach(a => {
                const creatore = a.creatore || 'Famiglia';
                const coloreUser = mappaColoriUtenti[creatore.toLowerCase()] || '#3b82f6';
                const d = new Date(a.data);
                const dataStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;

                htmlSummary += `
                    <div style="display: flex; justify-content: space-between; align-items: center; background-color: ${coloreUser}15; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; border-left: 6px solid ${coloreUser}; border: 1px solid ${coloreUser}40;">
                        <div>
                            <strong style="font-size: 1.05rem; color: #1e293b;">${a.titolo}</strong>
                            <span style="font-size: 0.95rem; color: #475569; margin-left: 8px;">(${dataStr} - ${a.oraInizio})</span>
                        </div>
                        <span style="font-size: 0.85rem; font-weight: 700; color: #ffffff; background-color: ${coloreUser}; padding: 4px 12px; border-radius: 6px;">${creatore}</span>
                    </div>
                `;
            });

            summaryAppuntamenti.innerHTML = htmlSummary || `<p class="text-muted">Nessun impegno previsto per questa settimana.</p>`;
        }

        // 2. Popolamento Griglia Settimanale IN VERTICALE con sfondi giorno differenziati
        if (gridSettimanale) {
            const dataFineSettimana = new Date(dataInizioSettimanaCorrente);
            dataFineSettimana.setDate(dataFineSettimana.getDate() + 6);

            const formatGiornoMese = (d) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}`;
            if (settimanaLabel) {
                settimanaLabel.textContent = `Dal ${formatGiornoMese(dataInizioSettimanaCorrente)} al ${formatGiornoMese(dataFineSettimana)}`;
            }

            gridSettimanale.style.display = 'flex';
            gridSettimanale.style.flexDirection = 'column';
            gridSettimanale.style.gap = '15px';
            gridSettimanale.innerHTML = '';

            const nomiGiorni = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
            
            // Sfondi delicati e distinti per ciascun giorno della settimana
            const sfondiGiorni = [
                '#f0fdf4', // Lunedì (Verde chiaro)
                '#eff6ff', // Martedì (Blu chiaro)
                '#fef2f2', // Mercoledì (Rosso/Rosa chiaro)
                '#fdf4ff', // Giovedì (Viola chiaro)
                '#fffbeb', // Venerdì (Giallo chiaro)
                '#fff7ed', // Sabato (Arancione chiaro)
                '#f8fafc'  // Domenica (Grigio/Azzurro chiaro)
            ];

            for (let i = 0; i < 7; i++) {
                const dataGiorno = new Date(dataInizioSettimanaCorrente);
                dataGiorno.setDate(dataGiorno.getDate() + i);
                const isoGiorno = dataGiorno.toISOString().split('T')[0];

                const appDelGiorno = appuntamenti.filter(a => a.data === isoGiorno);
                appDelGiorno.sort((a, b) => a.oraInizio.localeCompare(b.oraInizio));

                let cardGiorno = document.createElement('div');
                cardGiorno.style.background = sfondiGiorni[i];
                cardGiorno.style.borderRadius = '10px';
                cardGiorno.style.padding = '15px';
                cardGiorno.style.border = '1px solid #cbd5e1';
                cardGiorno.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';

                let htmlApp = '';
                appDelGiorno.forEach(a => {
                    const creatore = a.creatore || 'Famiglia';
                    const coloreUser = mappaColoriUtenti[creatore.toLowerCase()] || '#3b82f6';
                    const userIsAdmin = typeof isAdminCorrente === 'function' ? isAdminCorrente() : Boolean(isAdminCorrente);
                    const puoModificare = userIsAdmin || (creatore.toLowerCase() === (nomeUtenteCorrente || "").toLowerCase());

                    htmlApp += `
                        <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 10px 14px; margin-top: 8px; border-radius: 8px; border-left: 5px solid ${coloreUser}; border: 1px solid #e2e8f0; border-left-width: 5px; border-left-color: ${coloreUser};">
                            <div>
                                <strong style="font-size: 1rem; color: #0f172a; display: block;">${a.titolo}</strong>
                                <span style="font-size: 0.85rem; color: #64748b;">${a.oraInizio} - ${a.oraFine}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 0.8rem; font-weight: 700; color: #ffffff; background-color: ${coloreUser}; padding: 3px 10px; border-radius: 6px;">${creatore}</span>
                                ${puoModificare ? `
                                    <button onclick="modificaAppuntamento('${a.id}')" style="background-color: #0284c7; color: white; border: none; padding: 5px 10px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.8rem;">Mod.</button>
                                    <button onclick="eliminaAppuntamento('${a.id}')" style="background-color: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem;" title="Elimina">🗑️</button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                });

                cardGiorno.innerHTML = `
                    <div style="font-weight: 700; font-size: 1.1rem; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
                        ${nomiGiorni[i]} <span style="font-size: 0.9rem; color: #64748b; font-weight: 500;">${formatGiornoMese(dataGiorno)}</span>
                    </div>
                    <div>${htmlApp || '<p style="font-size: 0.85rem; color: #94a3b8; margin-top: 8px; font-style: italic;">Nessun impegno</p>'}</div>
                `;

                gridSettimanale.appendChild(cardGiorno);
            }
        }

    } catch (err) {
        console.error("Errore caricaAppuntamenti:", err);
    }
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
