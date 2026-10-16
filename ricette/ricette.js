import { 
    collection, 
    getDocs, 
    addDoc, 
    deleteDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "../firebase-config.js";
import { nomeUtenteCorrente, idUtenteCorrenteId } from "../auth.js";

export async function caricaRicette() {
    const containerRicette = document.getElementById('lista-ricette');
    if (!containerRicette) return;

    try {
        const querySnapshot = await getDocs(collection(db, "ricette"));
        let ricette = [];
        querySnapshot.forEach((docSnap) => {
            ricette.push({ id: docSnap.id, ...docSnap.data() });
        });

        let html = "";
        ricette.forEach((r) => {
            const creatoreNome = r.creatore || '';
            const nomeRicetta = r.nome || r.titolo || 'Ricetta';

            html += `
                <div style="background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e2e8f0; border-left: 6px solid #10b981; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <div>
                        <strong style="font-size: 1.05rem; color: #1e293b; display: block; margin-bottom: 2px;">${escapeHtml(nomeRicetta)}</strong>
                        ${r.descrizione ? `<div style="font-size: 0.9rem; color: #475569;">${escapeHtml(r.descrizione)}</div>` : ''}
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        ${creatoreNome ? `<span style="font-size: 0.85rem; font-weight: 600; color: #64748b;">(${escapeHtml(creatoreNome)})</span>` : ''}
                        <button onclick="eliminaRicetta('${r.id}')" style="background: none; border: none; cursor: pointer; font-size: 1rem;" title="Elimina">🗑️</button>
                    </div>
                </div>
            `;
        });

        containerRicette.innerHTML = html || `<p class="text-muted" style="font-style: italic; color: #64748b;">Nessuna ricetta inserita.</p>`;

    } catch (err) {
        console.error("Errore caricamento ricette:", err);
    }
}

// Gestione aggiunta nuova ricetta da form
const formNuovaRicetta = document.getElementById('form-nuova-ricetta');
if (formNuovaRicetta) {
    formNuovaRicetta.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nomeInput = document.getElementById('ricetta-nome') || document.getElementById('ricetta-titolo');
        const descInput = document.getElementById('ricetta-descrizione');

        if (!nomeInput) return;

        try {
            await addDoc(collection(db, "ricette"), {
                nome: nomeInput.value.trim(),
                descrizione: descInput ? descInput.value.trim() : '',
                creatore: nomeUtenteCorrente || 'Famiglia',
                creatoreId: idUtenteCorrenteId || ''
            });

            formNuovaRicetta.reset();
            caricaRicette();
            if (window.caricaSummaryRicetteHome) window.caricaSummaryRicetteHome();
        } catch (err) {
            console.error("Errore salvataggio ricetta:", err);
            alert("Errore durante il salvataggio della ricetta.");
        }
    });
}

// Funzione globale per eliminare la ricetta
window.eliminaRicetta = async function(id) {
    if (!confirm("Vuoi davvero eliminare questa ricetta?")) return;
    try {
        await deleteDoc(doc(db, "ricette", id));
        caricaRicette();
        if (window.caricaSummaryRicetteHome) window.caricaSummaryRicetteHome();
    } catch (err) {
        console.error("Errore eliminazione ricetta:", err);
        alert("Impossibile eliminare la ricetta.");
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

window.caricaRicette = caricaRicette;
