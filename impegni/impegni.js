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
import { nomeUtenteCorrente, coloreUtenteCorrente } from "../auth.js";

const listaSettimana = document.getElementById('lista-settimana');
const btnApriModalImpegno = document.getElementById('btn-apri-modal-impegno');
const btnChiudiModalImpegno = document.getElementById('btn-chiudi-modal-impegno');
const modalImpegno = document.getElementById('modal-impegno');
const impegnoForm = document.getElementById('impegno-form');
const modalTitleImpegno = document.getElementById('modal-title-impegno');
const titoloImpegnoInput = document.getElementById('impegno-titolo');
const dataImpegnoInput = document.getElementById('impegno-data');
const oraImpegnoInput = document.getElementById('impegno-ora');

let idModificaImpegnoCorrente = null;
let dataRiferimentoSettimana = new Date();

if (btnApriModalImpegno) {
    btnApriModalImpegno.addEventListener('click', () => {
        modalTitleImpegno.textContent = "Nuovo Impegno";
        impegnoForm.reset();
        idModificaImpegnoCorrente = null;
        modalImpegno.style.display = 'flex';
    });
}

if (btnChiudiModalImpegno) {
    btnChiudiModalImpegno.addEventListener('click', () => {
        modalImpegno.style.display = 'none';
    });
}

if (impegnoForm) {
    impegnoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titolo = titoloImpegnoInput.value.trim();
        const data = dataImpegnoInput.value;
        const ora = oraImpegnoInput.value || "00:00";

        if (!titolo || !data) return;

        try {
            if (idModificaImpegnoCorrente) {
                await updateDoc(doc(db, "appuntamenti", idModificaImpegnoCorrente), {
                    titolo,
                    data,
                    ora
                });
            } else {
                await addDoc(collection(db, "appuntamenti"), {
                    titolo,
                    data,
                    ora,
                    creatore: nomeUtenteCorrente || "Anonimo",
                    colore: coloreUtenteCorrente || "#3b82f6"
                });
            }

            modalImpegno.style.display = 'none';
            impegnoForm.reset();
            idModificaImpegnoCorrente = null;
            caricaAppuntamenti();
            if (window.caricaSummaryImpegniHome) window.caricaSummaryImpegniHome();
        } catch (err) {
            console.error("Errore salvataggio impegno:", err);
            alert("Errore durante il salvataggio dell'impegno.");
        }
    });
}

export async function caricaAppuntamenti() {
    if (!listaSettimana) return;

    try {
        const querySnapshot = await getDocs(collection(db, "appuntamenti"));
        let impegni = [];
        querySnapshot.forEach((docSnap) => {
            impegni.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Calcolo date inizio e fine settimana (da Lunedì a Domenica)
        const curr = new Date(dataRiferimentoSettimana);
        const day = curr.getDay();
        const diffToMonday = curr.getDate() - day + (day === 0 ? -6 : 1);
        
        const lunedi = new Date(curr.setDate(diffToMonday));
        lunedi.setHours(0, 0, 0, 0);

        const giorniSettimana = [];
        const nomiGiorni = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
        const sfondiGiorni = ['#f0fdf4', '#f0f9ff', '#fef2f2', '#fdf4ff', '#fefce8', '#fff7ed', '#faf5ff'];

        for (let i = 0; i < 7; i++) {
            const d = new Date(lunedi);
            d.setDate(lunedi.getDate() + i);
            giorniSettimana.push({
                nome: nomiGiorni[i],
                dataObj: d,
                dataStr: d.toISOString().split('T')[0],
                sfondo: sfondiGiorni[i]
            });
        }

        const dataInizioStr = `${lunedi.getDate().toString().padStart(2, '0')}/${(lunedi.getMonth()+1).toString().padStart(2, '0')}`;
        const domenica = giorniSettimana[6].dataObj;
        const dataFineStr = `${domenica.getDate().toString().padStart(2, '0')}/${(domenica.getMonth()+1).toString().padStart(2, '0')}`;

        listaSettimana.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                <button id="btn-settimana-prec" style="background-color: #e2e8f0; color: #334155; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.9rem;">← Prec.</button>
                <strong style="font-size: 1.05rem; color: #1e293b;">Dal ${dataInizioStr} al ${dataFineStr}</strong>
                <button id="btn-settimana-succ" style="background-color: #e2e8f0; color: #334155; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.9rem;">Succ. →</button>
            </div>
        `;

        giorniSettimana.forEach(giorno => {
            const impegniDelGiorno = impegni.filter(i => i.data === giorno.dataStr);
            impegniDelGiorno.sort((a, b) => (a.ora || "00:00").localeCompare(b.ora || "00:00"));

            const divGiorno = document.createElement('div');
            divGiorno.style.cssText = `background: ${giorno.sfondo}; padding: 14px 16px; border-radius: 10px; margin-bottom: 12px; border: 1px solid #cbd5e1;`;

            const giornoFormatted = `${giorno.dataObj.getDate().toString().padStart(2, '0')}/${(giorno.dataObj.getMonth()+1).toString().padStart(2, '0')}`;

            let htmlImpegni = "";
            if (impegniDelGiorno.length === 0) {
                htmlImpegni = `<p style="color: #94a3b8; font-style: italic; margin: 6px 0 0 0; font-size: 0.9rem;">Nessun impegno</p>`;
            } else {
                impegniDelGiorno.forEach(imp => {
                    const coloreBadge = imp.colore || "#3b82f6";
                    htmlImpegni += `
                        <div style="background: #ffffff; padding: 10px 14px; border-radius: 8px; margin-top: 8px; border: 1px solid #e2e8f0; border-left: 5px solid ${coloreBadge}; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
                            <div>
                                <strong style="font-size: 1.05rem; color: #0f172a; display: block;">${escapeHtml(imp.titolo)}</strong>
                                <span style="font-size: 0.85rem; color: #64748b;">${escapeHtml(imp.ora || '00:00')}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="background-color: ${coloreBadge}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">${escapeHtml(imp.creatore || 'Membro')}</span>
                                <button onclick="modificaImpegno('${imp.id}')" style="background-color: #0284c7; color: white; border: none; padding: 5px 10px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.8rem;" title="Modifica">Mod.</button>
                                <button onclick="eliminaImpegno('${imp.id}')" style="background-color: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.8rem;" title="Elimina">🗑️</button>
                            </div>
                        </div>
                    `;
                });
            }

            divGiorno.innerHTML = `
                <strong style="font-size: 1.1rem; color: #1e293b;">${giorno.nome}</strong> 
                <span style="font-size: 0.9rem; color: #64748b; margin-left: 6px;">${giornoFormatted}</span>
                ${htmlImpegni}
            `;

            listaSettimana.appendChild(divGiorno);
        });

        // Event listener per navigazione settimane
        document.getElementById('btn-settimana-prec')?.addEventListener('click', () => {
            dataRiferimentoSettimana.setDate(dataRiferimentoSettimana.getDate() - 7);
            caricaAppuntamenti();
        });

        document.getElementById('btn-settimana-succ')?.addEventListener('click', () => {
            dataRiferimentoSettimana.setDate(dataRiferimentoSettimana.getDate() + 7);
            caricaAppuntamenti();
        });

    } catch (err) {
        console.error("Errore caricamento impegni:", err);
    }
}

window.modificaImpegno = async function(id) {
    try {
        const docSnap = await getDoc(doc(db, "appuntamenti", id));
        if (docSnap.exists()) {
            const data = docSnap.data();
            modalTitleImpegno.textContent = "Modifica Impegno";
            titoloImpegnoInput.value = data.titolo || "";
            dataImpegnoInput.value = data.data || "";
            oraImpegnoInput.value = data.ora || "";
            idModificaImpegnoCorrente = id;
            modalImpegno.style.display = 'flex';
        }
    } catch (err) {
        alert("Errore nel recupero dell'impegno.");
    }
}

window.eliminaImpegno = async function(id) {
    if (confirm("Vuoi eliminare questo impegno?")) {
        try {
            await deleteDoc(doc(db, "appuntamenti", id));
            await caricaAppuntamenti();
            // Ricarica anche il summary della Home se presente
            location.reload(); 
        } catch (err) {
            alert("Errore durante l'eliminazione.");
        }
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
