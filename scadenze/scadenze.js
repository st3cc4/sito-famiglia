import { 
    collection, 
    getDocs, 
    addDoc, 
    deleteDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "../firebase-config.js";
import { nomeUtenteCorrente, idUtenteCorrenteId } from "../auth.js";

export async function caricaScadenze() {
    const containerScadenze = document.getElementById('lista-scadenze');
    if (!containerScadenze) return;

    try {
        const querySnapshot = await getDocs(collection(db, "scadenze"));
        let scadenze = [];
        querySnapshot.forEach((docSnap) => {
            scadenze.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Ordinamento per data crescente
        scadenze.sort((a, b) => new Date(a.data) - new Date(b.data));

        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);

        let html = "";
        scadenze.forEach((s) => {
            const dataScadenza = new Date(s.data);
            dataScadenza.setHours(0, 0, 0, 0);
            
            const diffTempo = dataScadenza - oggi;
            const diffGiorni = Math.round(diffTempo / (1000 * 60 * 60 * 24));

            let testoStato = "";
            let coloreBordo = "#cbd5e1";
            let coloreSfondo = "#f8fafc";
            let coloreTestoStato = "#1e293b";

            if (diffGiorni <= 7) {
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
                testoStato = `Mancano ${diffGiorni} giorni`;
                coloreBordo = "#f97316";
                coloreSfondo = "#fff7ed";
                coloreTestoStato = "#c2410c";
            } else {
                testoStato = `Mancano ${diffGiorni} giorni`;
                coloreBordo = "#22c55e";
                coloreSfondo = "#f0fdf4";
                coloreTestoStato = "#15803d";
            }

            const dataFormatted = `${dataScadenza.getDate().toString().padStart(2, '0')}/${(dataScadenza.getMonth()+1).toString().padStart(2, '0')}/${dataScadenza.getFullYear()}`;
            const creatoreNome = s.creatore || s.utente || '';

            html += `
                <div style="background-color: ${coloreSfondo}; padding: 12px 16px; border-radius: 8px; margin-bottom: 10px; border: 1px solid ${coloreBordo}40; border-left: 6px solid ${coloreBordo}; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <div>
                        <strong style="font-size: 1.05rem; color: #1e293b; display: block; margin-bottom: 2px;">${escapeHtml(s.titolo)}</strong>
                        <div style="font-size: 0.9rem; color: #475569;">${dataFormatted} - <strong style="color: ${coloreTestoStato};">${testoStato}</strong></div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 1.1rem; font-weight: 700; color: #0f172a;">€ ${Number(s.importo || 0).toFixed(2)}</span>
                        ${creatoreNome ? `<span style="font-size: 0.85rem; font-weight: 600; color: #64748b;">(${escapeHtml(creatoreNome)})</span>` : ''}
                        <button onclick="eliminaScadenza('${s.id}')" style="background: none; border: none; cursor: pointer; font-size: 1rem;" title="Elimina">🗑️</button>
                    </div>
                </div>
            `;
        });

        containerScadenze.innerHTML = html || `<p class="text-muted" style="font-style: italic; color: #64748b;">Nessuna scadenza inserita.</p>`;

    } catch (err) {
        console.error("Errore caricamento scadenze:", err);
    }
}

// Gestione aggiunta nuova scadenza da form
const formNuovaScadenza = document.getElementById('form-nuova-scadenza');
if (formNuovaScadenza) {
    formNuovaScadenza.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titoloInput = document.getElementById('scadenza-titolo');
        const importoInput = document.getElementById('scadenza-importo');
        const dataInput = document.getElementById('scadenza-data');

        if (!titoloInput || !dataInput) return;

        try {
            await addDoc(collection(db, "scadenze"), {
                titolo: titoloInput.value.trim(),
                importo: parseFloat(importoInput ? importoInput.value : 0) || 0,
                data: dataInput.value,
                creatore: nomeUtenteCorrente || 'Famiglia',
                creatoreId: idUtenteCorrenteId || ''
            });

            formNuovaScadenza.reset();
            caricaScadenze();
            if (window.caricaSummaryScadenzeHome) window.caricaSummaryScadenzeHome();
        } catch (err) {
            console.error("Errore salvataggio scadenza:", err);
            alert("Errore durante il salvataggio della scadenza.");
        }
    });
}

// Funzione globale per eliminare la scadenza
window.eliminaScadenza = async function(id) {
    if (!confirm("Vuoi davvero eliminare questa scadenza?")) return;
    try {
        await deleteDoc(doc(db, "scadenze", id));
        caricaScadenze();
        if (window.caricaSummaryScadenzeHome) window.caricaSummaryScadenzeHome();
    } catch (err) {
        console.error("Errore eliminazione scadenza:", err);
        alert("Impossibile eliminare la scadenza.");
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

window.caricaScadenze = caricaScadenze;
