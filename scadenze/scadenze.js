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

const listaScadenze = document.getElementById('lista-scadenze');
const totaleGeneraleScadenze = document.getElementById('totale-generale-scadenze');
const btnApriModal = document.getElementById('btn-apri-modal');
const btnChiudiModal = document.getElementById('btn-chiudi-modal');
const modalScadenza = document.getElementById('modal-scadenza');
const scadenzaForm = document.getElementById('scadenza-form');
const modalTitle = document.getElementById('modal-title');
const titoloInput = document.getElementById('titolo');
const dataInput = document.getElementById('data');
const importoInput = document.getElementById('importo');

let idModificaCorrente = null;

if (btnApriModal) {
    btnApriModal.addEventListener('click', () => {
        modalTitle.textContent = "Nuova Scadenza";
        scadenzaForm.reset();
        idModificaCorrente = null;
        modalScadenza.style.display = 'flex';
    });
}

if (btnChiudiModal) {
    btnChiudiModal.addEventListener('click', () => {
        modalScadenza.style.display = 'none';
    });
}

if (scadenzaForm) {
    scadenzaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titolo = titoloInput.value.trim();
        const data = dataInput.value;
        const importo = parseFloat(importoInput.value);

        if (!titolo || !data || isNaN(importo)) return;

        try {
            if (idModificaCorrente) {
                await updateDoc(doc(db, "scadenze", idModificaCorrente), {
                    titolo,
                    data,
                    importo
                });
            } else {
                await addDoc(collection(db, "scadenze"), {
                    titolo,
                    data,
                    importo,
                    pagata: false
                });
            }

            modalScadenza.style.display = 'none';
            scadenzaForm.reset();
            idModificaCorrente = null;
            caricaScadenze();
        } catch (err) {
            console.error("Errore salvataggio scadenza:", err);
            alert("Errore durante il salvataggio della scadenza.");
        }
    });
}

export async function caricaScadenze() {
    try {
        const querySnapshot = await getDocs(collection(db, "scadenze"));
        let scadenze = [];
        querySnapshot.forEach((docSnap) => {
            scadenze.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Ordinamento per data
        scadenze.sort((a, b) => new Date(a.data) - new Date(b.data));

        if (listaScadenze) {
            listaScadenze.innerHTML = '';
            let totaleComplessivo = 0;
            const oggi = new Date();
            oggi.setHours(0, 0, 0, 0);

            scadenze.forEach((s) => {
                const dataScadenza = new Date(s.data);
                dataScadenza.setHours(0, 0, 0, 0);
                
                const diffTempo = dataScadenza - oggi;
                const diffGiorni = Math.round(diffTempo / (1000 * 60 * 60 * 24));

                let testoStato = "";
                let coloreBordo = "#cbd5e1";
                let coloreSfondo = "#ffffff";

                if (diffGiorni < 0) {
                    const giorniRitardo = Math.abs(diffGiorni);
                    testoStato = `Scaduta da ${giorniRitardo} ${giorniRitardo === 1 ? 'giorno' : 'giorni'}`;
                    coloreBordo = "#ef4444"; // Rosso urgenza
                    coloreSfondo = "#fef2f2";
                } else if (diffGiorni === 0) {
                    testoStato = "Scade oggi!";
                    coloreBordo = "#ef4444"; // Rosso urgenza
                    coloreSfondo = "#fef2f2";
                } else if (diffGiorni <= 7) {
                    testoStato = `Mancano ${diffGiorni} giorni`;
                    coloreBordo = "#ef4444"; // Rosso urgenza
                    coloreSfondo = "#fef2f2";
                } else if (diffGiorni <= 14) {
                    testoStato = `Mancano ${diffGiorni} giorni`;
                    coloreBordo = "#f97316"; // Arancione
                    coloreSfondo = "#fff7ed";
                } else {
                    testoStato = `Mancano ${diffGiorni} giorni`;
                    coloreBordo = "#22c55e"; // Verde
                    coloreSfondo = "#f0fdf4";
                }

                totaleComplessivo += Number(s.importo) || 0;

                const li = document.createElement('li');
                li.style.cssText = `background: ${coloreSfondo}; padding: 12px 16px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e2e8f0; border-left: 6px solid ${coloreBordo}; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;`;

                const dataFormatted = `${dataScadenza.getDate().toString().padStart(2, '0')}/${(dataScadenza.getMonth()+1).toString().padStart(2, '0')}/${dataScadenza.getFullYear()}`;

                li.innerHTML = `
                    <div>
                        <strong style="font-size: 1.05rem; color: #1e293b;">${escapeHtml(s.titolo)}</strong> 
                        <span style="font-size: 0.9rem; color: #64748b; margin-left: 6px;">${dataFormatted} - <span style="font-weight: 600; color: ${coloreBordo};">${testoStato}</span></span>
                        <div style="font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-top: 4px;">€ ${Number(s.importo).toFixed(2)}</div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button onclick="modificaScadenza('${s.id}')" style="background-color: #0284c7; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem;">Mod.</button>
                        <button onclick="eliminaScadenza('${s.id}')" style="background-color: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem;" title="Elimina">🗑️</button>
                    </div>
                `;

                listaScadenze.appendChild(li);
            });

            if (totaleGeneraleScadenze) {
                totaleGeneraleScadenze.innerHTML = `Totale da pagare: € ${totaleComplessivo.toFixed(2)}`;
            }
        }
    } catch (err) {
        console.error("Errore caricamento scadenze:", err);
    }
}

window.modificaScadenza = async function(id) {
    try {
        const docSnap = await getDoc(doc(db, "scadenze", id));
        if (docSnap.exists()) {
            const data = docSnap.data();
            modalTitle.textContent = "Modifica Scadenza";
            titoloInput.value = data.titolo || "";
            dataInput.value = data.data || "";
            importoInput.value = data.importo || "";
            idModificaCorrente = id;
            modalScadenza.style.display = 'flex';
        }
    } catch (err) {
        alert("Errore nel recupero della scadenza.");
    }
}

window.eliminaScadenza = async function(id) {
    if (confirm("Vuoi eliminare questa scadenza?")) {
        try {
            await deleteDoc(doc(db, "scadenze", id));
            caricaScadenze();
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
