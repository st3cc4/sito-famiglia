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
import { nomeUtenteCorrente } from "../auth.js";

const listaRicette = document.getElementById('lista-ricette');

export async function caricaRicette() {
    if (!listaRicette) return;

    try {
        const querySnapshot = await getDocs(collection(db, "ricette"));
        let ricette = [];

        querySnapshot.forEach((docSnap) => {
            ricette.push({ id: docSnap.id, ...docSnap.data() });
        });

        listaRicette.innerHTML = '';

        if (ricette.length === 0) {
            listaRicette.innerHTML = '<p class="text-muted" style="color: #64748b; font-style: italic;">Nessuna ricetta trovata.</p>';
            return;
        }

        ricette.forEach((r) => {
            const divCard = document.createElement('div');
            divCard.style.cssText = "background: #ffffff; border-radius: 10px; margin-bottom: 12px; border: 1px solid #e2e8f0; border-left: 6px solid #3b82f6; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02);";

            // Gestione Ingredienti (array o stringa)
            let ingredientiHtml = "";
            if (Array.isArray(r.ingredienti)) {
                ingredientiHtml = r.ingredienti.map(i => `<li>${escapeHtml(i)}</li>`).join('');
            } else if (r.ingredienti) {
                ingredientiHtml = `<li>${escapeHtml(r.ingredienti)}</li>`;
            }

            // Gestione Procedimento (array o stringa)
            let procedimentoHtml = "";
            if (Array.isArray(r.procedimento)) {
                procedimentoHtml = r.procedimento.map(p => `<p style="margin: 4px 0;">• ${escapeHtml(p)}</p>`).join('');
            } else if (r.procedimento) {
                procedimentoHtml = `<p style="margin: 4px 0;">${escapeHtml(r.procedimento)}</p>`;
            }

            const eMia = (r.creatore || "").toLowerCase() === (nomeUtenteCorrente || "").toLowerCase();

            divCard.innerHTML = `
                <div class="ricetta-header" style="padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; background: #f8fafc;" onclick="toggleRicetta('${r.id}')">
                    <strong style="font-size: 1.1rem; color: #0f172a;">${escapeHtml(r.nome || r.titolo || 'Ricetta')}</strong>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="background-color: #2563eb; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">${escapeHtml(r.creatore || 'Paolo')}</span>
                        <span id="freccia-${r.id}" style="font-size: 0.9rem; color: #64748b; transition: transform 0.2s;">▼</span>
                    </div>
                </div>
                <div id="body-${r.id}" style="display: none; padding: 16px; border-top: 1px solid #e2e8f0;">
                    ${ingredientiHtml ? `
                        <strong style="font-size: 0.95rem; color: #1e293b; display: block; margin-bottom: 6px;">Ingredienti:</strong>
                        <ul style="margin: 0 0 12px 20px; padding: 0; color: #334155; font-size: 0.9rem;">
                            ${ingredientiHtml}
                        </ul>
                    ` : ''}
                    ${procedimentoHtml ? `
                        <strong style="font-size: 0.95rem; color: #1e293b; display: block; margin-bottom: 6px;">Procedimento:</strong>
                        <div style="color: #334155; font-size: 0.9rem; margin-bottom: 14px;">
                            ${procedimentoHtml}
                        </div>
                    ` : ''}
                    ${r.note ? `<p style="font-size: 0.85rem; color: #64748b; font-style: italic; margin-bottom: 12px;">Note: ${escapeHtml(r.note)}</p>` : ''}
                    
                    <div style="display: flex; justify-content: flex-end; gap: 8px;">
                        ${eMia ? `
                            <button onclick="modificaRicetta('${r.id}')" style="background-color: #0284c7; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem;">Mod.</button>
                            <button onclick="eliminaRicetta('${r.id}')" style="background-color: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem;">🗑️</button>
                        ` : ''}
                    </div>
                </div>
            `;

            listaRicette.appendChild(divCard);
        });

    } catch (err) {
        console.error("Errore caricamento ricette:", err);
    }
}

window.toggleRicetta = function(id) {
    const body = document.getElementById(`body-${id}`);
    const freccia = document.getElementById(`freccia-${id}`);
    if (body) {
        const isHidden = body.style.display === 'none';
        body.style.display = isHidden ? 'block' : 'none';
        if (freccia) freccia.textContent = isHidden ? '▲' : '▼';
    }
}

window.eliminaRicetta = async function(id) {
    if (confirm("Vuoi eliminare questa ricetta?")) {
        try {
            await deleteDoc(doc(db, "ricette", id));
            caricaRicette();
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
