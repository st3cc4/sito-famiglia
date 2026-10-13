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

const btnApriModalRicetta = document.getElementById('btn-apri-modal-ricetta');
const btnChiudiModalRicetta = document.getElementById('btn-chiudi-modal-ricetta');
const modalRicetta = document.getElementById('modal-ricetta');
const modalRicettaTitle = document.getElementById('modal-ricetta-title');
const ricettaForm = document.getElementById('ricetta-form');
const ricettaIdInput = document.getElementById('ricetta-id');
const ricettaNomeInput = document.getElementById('ricetta-nome');
const ingredientiContainer = document.getElementById('ingredienti-container');
const btnAggiungiIngrediente = document.getElementById('btn-aggiungi-ingrediente');
const procedimentiContainer = document.getElementById('procedimenti-container');
const btnAggiungiProcedimento = document.getElementById('btn-aggiungi-procedimento');
const listaRicette = document.getElementById('lista-ricette');
const summaryRicette = document.getElementById('home-summary-ricette');

if (btnApriModalRicetta) {
    btnApriModalRicetta.addEventListener('click', () => {
        modalRicettaTitle.textContent = "Nuova Ricetta";
        ricettaForm.reset();
        ricettaIdInput.value = "";
        ingredientiContainer.innerHTML = "";
        procedimentiContainer.innerHTML = "";
        aggiungiRigaIngrediente();
        aggiungiRigaProcedimento();
        modalRicetta.style.display = 'flex';
    });
}

if (btnChiudiModalRicetta) {
    btnChiudiModalRicetta.addEventListener('click', () => {
        modalRicetta.style.display = 'none';
    });
}

if (btnAggiungiIngrediente) {
    btnAggiungiIngrediente.addEventListener('click', () => aggiungiRigaIngrediente());
}

if (btnAggiungiProcedimento) {
    btnAggiungiProcedimento.addEventListener('click', () => aggiungiRigaProcedimento());
}

function aggiungiRigaIngrediente(valore = "") {
    const div = document.createElement('div');
    div.className = 'dynamic-row-input';
    div.innerHTML = `
        <input type="text" class="form-control ing-input" placeholder="Es. 200g di farina" value="${valore}" required>
        <button type="button" class="btn-rimuovi-riga" onclick="this.parentElement.remove()">&times;</button>
    `;
    ingredientiContainer.appendChild(div);
}

function aggiungiRigaProcedimento(valore = "") {
    const div = document.createElement('div');
    div.className = 'dynamic-row-input';
    div.innerHTML = `
        <input type="text" class="form-control proc-input" placeholder="Es. Mescolare gli ingredienti" value="${valore}" required>
        <button type="button" class="btn-rimuovi-riga" onclick="this.parentElement.remove()">&times;</button>
    `;
    procedimentiContainer.appendChild(div);
}

if (ricettaForm) {
    ricettaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = ricettaNomeInput.value.trim();
        const editId = ricettaIdInput.value;

        const ingredienti = Array.from(document.querySelectorAll('.ing-input')).map(i => i.value.trim()).filter(Boolean);
        const procedimenti = Array.from(document.querySelectorAll('.proc-input')).map(p => p.value.trim()).filter(Boolean);

        const datiRicetta = {
            nome,
            ingredienti,
            procedimenti,
            creatore: nomeUtenteCorrente || "Famiglia"
        };

        try {
            if (editId) {
                await updateDoc(doc(db, "ricette", editId), datiRicetta);
            } else {
                await addDoc(collection(db, "ricette"), datiRicetta);
            }
            modalRicetta.style.display = 'none';
            ricettaForm.reset();
            caricaRicette();
        } catch (err) {
            console.error("Errore salvataggio ricetta:", err);
            alert("Errore nel salvataggio della ricetta.");
        }
    });
}

export async function caricaRicette() {
    try {
        const querySnapshot = await getDocs(collection(db, "ricette"));
        let ricette = [];
        querySnapshot.forEach(docSnap => {
            ricette.push({ id: docSnap.id, ...docSnap.data() });
        });

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
            let htmlSummary = "";
            ricette.slice(0, 3).forEach(r => {
                const creatore = r.creatore || 'Famiglia';
                const coloreUser = mappaColoriUtenti[creatore.toLowerCase()] || '#3b82f6';

                htmlSummary += `
                    <div style="display: flex; justify-content: space-between; align-items: center; background-color: #f8fafc; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; border-left: 5px solid ${coloreUser};">
                        <strong style="font-size: 1.05rem; color: #1e293b;">${r.nome}</strong>
                        <span style="font-size: 0.9rem; font-weight: 700; color: #ffffff; background-color: ${coloreUser}; padding: 4px 12px; border-radius: 6px;">${creatore}</span>
                    </div>
                `;
            });
            summaryRicette.innerHTML = htmlSummary || `<p class="text-muted">Nessuna ricetta disponibile.</p>`;
        }

        // 2. Popolamento Sezione Ricette Completa
        if (listaRicette) {
            let htmlRicette = "";
            ricette.sort((a, b) => a.nome.localeCompare(b.nome));

            ricette.forEach(r => {
                const creatore = r.creatore || 'Famiglia';
                const coloreUser = mappaColoriUtenti[creatore.toLowerCase()] || '#3b82f6';
                const userIsAdmin = typeof isAdminCorrente === 'function' ? isAdminCorrente() : Boolean(isAdminCorrente);
                const puoModificare = userIsAdmin || (creatore.toLowerCase() === (nomeUtenteCorrente || "").toLowerCase());

                const ingredientiHtml = (r.ingredienti || []).map(i => `<li>${i}</li>`).join('');
                const procedimentiHtml = (r.procedimenti || []).map((p, idx) => `<li><strong>${idx + 1}.</strong> ${p}</li>`).join('');

                htmlRicette += `
                    <div class="ricetta-card-item" style="border-left: 5px solid ${coloreUser};">
                        <div class="ricetta-header-row" onclick="toggleCardRicetta(this)">
                            <div>
                                <strong style="font-size: 1.1rem; color: #1e293b;">${r.nome}</strong>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 0.85rem; font-weight: 700; color: #ffffff; background-color: ${coloreUser}; padding: 3px 10px; border-radius: 6px;">${creatore}</span>
                                <span style="font-size: 1.2rem; color: #64748b;">&#9660;</span>
                            </div>
                        </div>
                        <div class="ricetta-corpo">
                            <div style="margin-top: 10px;">
                                <strong style="color: #0f172a;">Ingredienti:</strong>
                                <ul style="margin: 5px 0 15px 20px; color: #334155;">${ingredientiHtml}</ul>
                                <strong style="color: #0f172a;">Procedimento:</strong>
                                <ol style="margin: 5px 0 15px 20px; color: #334155; list-style-type: none; padding-left: 0;">${procedimentiHtml}</ol>
                            </div>
                            ${puoModificare ? `
                                <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 10px;">
                                    <button class="btn-modifica" style="font-size: 0.8rem; padding: 4px 10px;" onclick="modificaRicetta('${r.id}')">Modifica</button>
                                    <button class="btn-elimina" style="font-size: 0.8rem; padding: 4px 10px;" onclick="eliminaRicetta('${r.id}')">Elimina</button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            });

            listaRicette.innerHTML = htmlRicette || `<p class="text-muted">Nessuna ricetta inserita.</p>`;
        }

    } catch (err) {
        console.error("Errore caricaRicette:", err);
    }
}

window.toggleCardRicetta = function(headerEl) {
    const card = headerEl.parentElement;
    card.classList.toggle('aperta');
}

window.modificaRicetta = async function(id) {
    try {
        const docSnap = await getDoc(doc(db, "ricette", id));
        if (docSnap.exists()) {
            const r = docSnap.data();
            modalRicettaTitle.textContent = "Modifica Ricetta";
            ricettaIdInput.value = id;
            ricettaNomeInput.value = r.nome || "";

            ingredientiContainer.innerHTML = "";
            (r.ingredienti || []).forEach(ing => aggiungiRigaIngrediente(ing));

            procedimentiContainer.innerHTML = "";
            (r.procedimenti || []).forEach(proc => aggiungiRigaProcedimento(proc));

            modalRicetta.style.display = 'flex';
        }
    } catch (err) {
        alert("Errore nel recupero della ricetta.");
    }
}

window.eliminaRicetta = async function(id) {
    if (confirm("Vuoi eliminare questa ricetta?")) {
        try {
            await deleteDoc(doc(db, "ricette", id));
            caricaRicette();
        } catch (err) {
            alert("Errore nell'eliminazione.");
        }
    }
}
