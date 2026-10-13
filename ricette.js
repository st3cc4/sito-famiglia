import { 
    collection, 
    getDocs, 
    deleteDoc, 
    doc, 
    updateDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { nomeUtenteCorrente, formatCapitalize, isAdminCorrente } from "./auth.js";

const btnApriModalRicetta = document.getElementById('btn-apri-modal-ricetta');
const btnChiudiModalRicetta = document.getElementById('btn-chiudi-modal-ricetta');
const modalRicetta = document.getElementById('modal-ricetta');
const modalRicettaTitle = document.getElementById('modal-ricetta-title');
const ricettaForm = document.getElementById('ricetta-form');
const ricettaIdInput = document.getElementById('ricetta-id');
const ricettaNomeInput = document.getElementById('ricetta-nome');
const ricettaNoteInput = document.getElementById('ricetta-note');
const containerIngredienti = document.getElementById('container-ingredienti');
const containerProcedimento = document.getElementById('container-procedimento');
const btnAggiungiIngrediente = document.getElementById('btn-aggiungi-ingrediente');
const btnAggiungiPasso = document.getElementById('btn-aggiungi-passo');
const listaRicette = document.getElementById('lista-ricette');
const summaryRicette = document.getElementById('home-summary-ricette');

const btnRicettaCasuale = document.getElementById('btn-ricetta-casuale');
const modalRicettaCasuale = document.getElementById('modal-ricetta-casuale');
const contenutoRicettaCasuale = document.getElementById('contenuto-ricetta-casuale');
const btnAltraRicettaCasuale = document.getElementById('btn-altra-ricetta-casuale');
const btnChiudiModalCasuale = document.getElementById('btn-chiudi-modal-casuale');

if (btnRicettaCasuale) btnRicettaCasuale.textContent = "🎲 Ricetta Casuale";

if (btnAggiungiIngrediente) btnAggiungiIngrediente.addEventListener('click', () => aggiungiRigaIngrediente(''));
if (btnAggiungiPasso) btnAggiungiPasso.addEventListener('click', () => aggiungiRigaProcedimento(''));

function aggiungiRigaIngrediente(valore = '') {
    const div = document.createElement('div');
    div.className = 'dynamic-row-input';
    div.innerHTML = `
        <input type="text" class="ingrediente-item" value="${valore}" placeholder="Es. 200g Farina" required style="flex: 1;">
        <button type="button" class="btn-rimuovi-riga" onclick="this.parentElement.remove()">&times;</button>
    `;
    containerIngredienti.appendChild(div);
}

function aggiungiRigaProcedimento(valore = '') {
    const div = document.createElement('div');
    div.className = 'dynamic-row-input';
    div.innerHTML = `
        <input type="text" class="procedimento-item" value="${valore}" placeholder="Es. Mescolare gli ingredienti" required style="flex: 1;">
        <button type="button" class="btn-rimuovi-riga" onclick="this.parentElement.remove()">&times;</button>
    `;
    containerProcedimento.appendChild(div);
}

export async function caricaRicette() {
    try {
        const querySnapshot = await getDocs(collection(db, "ricette"));
        let ricette = [];
        querySnapshot.forEach(docSnap => {
            ricette.push({ id: docSnap.id, ...docSnap.data() });
        });

        ricette.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));

        let mappaColoriUtenti = {};
        try {
            const utentiSnap = await getDocs(collection(db, "utenti"));
            utentiSnap.forEach(uDoc => {
                const uData = uDoc.data();
                mappaColoriUtenti[uDoc.id.toLowerCase()] = uData.colore || '#3b82f6';
            });
        } catch(e) {}

        // 1. Popolamento Home Summary Ricette
        if (summaryRicette) {
            let htmlHomeRicette = "";
            ricette.slice(0, 3).forEach(r => {
                const creatore = r.creatore || 'Famiglia';
                const coloreUser = mappaColoriUtenti[creatore.toLowerCase()] || '#3b82f6';

                // Sfondo semitrasparente o delicato basato sul colore utente
                htmlHomeRicette += `
                    <div style="display: flex; justify-content: space-between; align-items: center; background-color: ${coloreUser}15; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; border-left: 5px solid ${coloreUser};">
                        <strong style="font-size: 1.05rem; color: #1e293b;">${r.nome || 'Senza nome'}</strong>
                        <span style="font-size: 0.9rem; font-weight: 700; color: #ffffff; background-color: ${coloreUser}; padding: 4px 12px; border-radius: 6px;">${creatore}</span>
                    </div>
                `;
            });
            summaryRicette.innerHTML = htmlHomeRicette || `<p class="text-muted">Nessuna ricetta disponibile.</p>`;
        }

        // 2. Popolamento Sezione Ricette completa
        if (listaRicette) {
            let htmlRicette = "";
            const userIsAdmin = typeof isAdminCorrente === 'function' ? isAdminCorrente() : Boolean(isAdminCorrente);

            ricette.forEach(r => {
                const creatore = r.creatore || "Famiglia";
                const coloreUser = mappaColoriUtenti[creatore.toLowerCase()] || '#3b82f6';
                const puoModificare = userIsAdmin || (creatore.toLowerCase() === (nomeUtenteCorrente || "").toLowerCase());

                let ingredientiHtml = (r.ingredienti || []).map(i => `<li>${i}</li>`).join('');
                let procedimentoHtml = (r.procedimento || []).map((p, idx) => `<li><strong>Passo ${idx + 1}:</strong> ${p}</li>`).join('');

                htmlRicette += `
                    <div class="ricetta-card-item" style="border-left: 5px solid ${coloreUser}; background-color: ${coloreUser}10;">
                        <div class="ricetta-header-row" onclick="toggleRicetta(this)">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span style="font-weight: 600; font-size: 1.05rem;">${r.nome}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 12px;" onclick="event.stopPropagation()">
                                <span style="font-size: 0.9rem; font-weight: 700; color: #ffffff; background-color: ${coloreUser}; padding: 4px 12px; border-radius: 6px;">${creatore}</span>
                                ${puoModificare ? `
                                    <button class="btn-modifica" onclick="modificaRicetta('${r.id}')">Mod.</button>
                                    <button class="btn-elimina" onclick="eliminaRicetta('${r.id}')">Elimina</button>
                                ` : ''}
                                <span style="font-size: 0.9rem; color: #64748b;">▼</span>
                            </div>
                        </div>
                        <div class="ricetta-corpo">
                            <div style="margin-bottom: 12px;">
                                <h4 style="font-size: 1.15rem; color: #1e293b; margin-bottom: 6px; font-weight: 700;">Ingredienti</h4>
                                <ul style="padding-left: 20px; font-size: 1.05rem; color: #334155; display: flex; flex-direction: column; gap: 6px;">
                                    ${ingredientiHtml}
                                </ul>
                            </div>
                            <div style="margin-bottom: 12px;">
                                <h4 style="font-size: 1.15rem; color: #1e293b; margin-bottom: 6px; font-weight: 700;">Procedimento</h4>
                                <ol style="padding-left: 20px; font-size: 1.05rem; color: #334155; display: flex; flex-direction: column; gap: 8px;">
                                    ${procedimentoHtml}
                                </ol>
                            </div>
                            ${r.note ? `<p style="font-size: 1rem; color: #64748b; margin-top: 8px;"><strong>Note:</strong> ${r.note}</p>` : ''}
                        </div>
                    </div>`;
            });

            listaRicette.innerHTML = htmlRicette || `<p class="text-muted">Nessuna ricetta inserita.</p>`;
        }

    } catch (err) {
        console.error("Errore caricamento ricette:", err);
    }
}
