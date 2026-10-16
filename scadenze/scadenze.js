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

            if (scadenze.length === 0) {
                listaScadenze.innerHTML = '<p class="text-muted" style="color: #64748b; font-style: italic;">Nessuna scadenza presente.</p>';
                if (totaleGeneraleScadenze) totaleGeneraleScadenze.innerHTML = 'Totale da pagare: € 0.00';
                return;
            }

            scadenze.forEach((s) => {
                const dataScadenza = new Date(s.data);
                dataScadenza.setHours(0, 0, 0, 0);
                
                const diffTempo = dataScadenza - oggi;
                const diffGiorni = Math.round(diffTempo / (1000 * 60 * 60 * 24));

                let testoStato = "";
                let coloreBordo = "#cbd5e1";
                let coloreSfondo = "#ffffff";
                let coloreTestoStato = "#1e293b";

                // Logica a cascata colori (sfondo, bordo e testo)
                if (diffGiorni <= 7) {
                    // <= 7 giorni o già scaduta -> ROSSO
                    if (diffGiorni < 0) {
                        const giorniRitardo = Math.abs(diffGiorni);
                        testoStato = `Scaduta da ${giorniRitardo} ${giorniRitardo === 1 ? 'giorno' : 'giorni'}`;
                    } else if (diffGiorni === 0) {
                        testoStato = "Scade oggi!";
                    } else {
                        testoStato = `Mancano ${diffGiorni} giorni`;
                    }
                    coloreBordo = "#ef4444";
                    coloreSfondo = "#fef2f2";
                    coloreTestoStato = "#991b1b";
                } else if (diffGiorni >= 8 && diffGiorni <= 14) {
                    // 8-14 giorni -> ARANCIONE
                    testoStato = `Mancano ${diffGiorni} giorni`;
                    coloreBordo = "#f97316";
                    coloreSfondo = "#fff7ed";
                    coloreTestoStato = "#c2410c";
                } else {
                    // >= 15 giorni -> VERDE
                    testoStato = `Mancano ${diffGiorni} giorni`;
                    coloreBordo = "#22c55e";
                    coloreSfondo = "#f0fdf4";
                    coloreTestoStato = "#15803d";
                }

                totaleComplessivo += Number(s.importo) || 0;

                const li = document.createElement('li');
                li.style.cssText = `background-color: ${coloreSfondo}; padding: 14px 18px; border-radius: 10px; margin-bottom: 12px; border: 1px solid ${coloreBordo}40; border-left: 6px solid ${coloreBordo}; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);`;

                const dataFormatted = `${dataScadenza.getDate().toString().padStart(2, '0')}/${(dataScadenza.getMonth()+1).toString().padStart(2, '0')}/${dataScadenza.getFullYear()}`;

                li.innerHTML = `
                    <div>
                        <strong style="font-size: 1.1rem; color: #0f172a; display: block; margin-bottom: 2px;">${escapeHtml(s.titolo)}</strong> 
                        <span style="font-size: 0.9rem; color: #475569;">${dataFormatted} - <strong style="color: ${coloreTestoStato};">${testoStato}</strong></span>
                        <div style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-top: 4px;">€ ${Number(s.importo).toFixed(2)}</div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                        <button onclick="segnaPagata('${s.id}')" style="background-color: #16a34a; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem;" title="Segna come Pagata">Segna Pagata</button>
                        <button onclick="modificaScadenza('${s.id}')" style="background-color: #0284c7; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem;" title="Modifica">Mod.</button>
                        <button onclick="eliminaScadenza('${s.id}')" style="background-color: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem;" title="Elimina">🗑️</button>
                    </div>
                `;

                listaScadenze.appendChild(li);
            });

            if (totaleGeneraleScadenze) {
                totaleGeneraleScadenze.innerHTML = `<strong>Totale da pagare: € ${totaleComplessivo.toFixed(2)}</strong>`;
            }
        }
    } catch (err) {
        console.error("Errore caricamento scadenze:", err);
    }
}

window.segnaPagata = async function(id) {
    if (confirm("Vuoi segnare questa bolletta/scadenza come PAGATA? Verrà rimossa dalla lista.")) {
        try {
            await deleteDoc(doc(db, "scadenze", id));
            caricaScadenze();
        } catch (err) {
            alert("Errore nell'aggiornamento della scadenza.");
        }
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
