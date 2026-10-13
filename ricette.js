import { 
    collection, 
    addDoc, 
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

if (btnApriModalRicetta) {
    btnApriModalRicetta.addEventListener('click', () => {
        modalRicettaTitle.textContent = "Nuova Ricetta";
        ricettaForm.reset();
        ricettaIdInput.value = "";
        containerIngredienti.innerHTML = "";
        containerProcedimento.innerHTML = "";
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

if (ricettaForm) {
    ricettaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = formatCapitalize(ricettaNomeInput.value);
        const note = ricettaNoteInput.value;
        const editId = ricettaIdInput.value;

        const ingredienti = Array.from(document.querySelectorAll('.ingrediente-item')).map(input => input.value.trim()).filter(Boolean);
        const procedimento = Array.from(document.querySelectorAll('.procedimento-item')).map(input => input.value.trim()).filter(Boolean);

        const datiRicetta = {
            nome,
            ingredienti,
            procedimento,
            note,
            creatore: nomeUtenteCorrente
        };

        try {
            if (editId) {
                const docRef = doc(db, "ricette", editId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    datiRicetta.creatore = docSnap.data().creatore || nomeUtenteCorrente;
                }
                await updateDoc(docRef, datiRicetta);
            } else {
                await addDoc(collection(db, "ricette"), datiRicetta);
            }
            modalRicetta.style.display = 'none';
            ricettaForm.reset();
            caricaRicette();
        } catch (err) {
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

        ricette.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));

        const isAdmin = isAdminCorrente();

        if (listaRicette) {
            let htmlRicette = "";
            ricette.forEach(r => {
                const creatore = r.creatore || "Famiglia";
                const puoModificare = isAdmin || (creatore.toLowerCase() === nomeUtenteCorrente.toLowerCase());

                let ingredientiHtml = (r.ingredienti || []).map(i => `<li>${i}</li>`).join('');
                let procedimentoHtml = (r.procedimento || []).map((p, idx) => `<li><strong>Passo ${idx + 1}:</strong> ${p}</li>`).join('');

                htmlRicette += `
                    <div class="ricetta-card-item" style="border-left: 5px solid var(--user-primary);">
                        <div class="ricetta-header-row" onclick="toggleRicetta(this)">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span style="font-weight: 600; font-size: 1.05rem;">${r.nome}</span>
                                <span style="font-size: 0.8rem; color: #64748b; font-weight: bold;">[${creatore}]</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;" onclick="event.stopPropagation()">
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

        if (summaryRicette) {
            let htmlHomeRicette = "";
            ricette.slice(0, 3).forEach(r => {
                htmlHomeRicette += `
                    <div class="scadenza-block-style" style="border-left: 4px solid var(--user-primary); background-color: #fff7ed; padding: 10px 14px; border-radius: 6px; margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <strong>${r.nome}</strong>
                            <span style="font-size: 0.8rem; color: #64748b; font-weight: bold;">${r.creatore || ''}</span>
                        </div>
                    </div>`;
            });
            summaryRicette.innerHTML = htmlHomeRicette || `<p class="text-muted">Nessuna ricetta disponibile.</p>`;
        }

    } catch (err) {
        if (listaRicette) listaRicette.innerHTML = `<p class="text-muted">Errore caricamento ricette.</p>`;
        if (summaryRicette) summaryRicette.innerHTML = `<p class="text-muted">Nessuna ricetta disponibile.</p>`;
    }
}

window.toggleRicetta = function(headerElement) {
    const cardItem = headerElement.closest('.ricetta-card-item');
    cardItem.classList.toggle('aperta');
}

window.modificaRicetta = async function(id) {
    try {
        const docSnap = await getDoc(doc(db, "ricette", id));
        if (docSnap.exists()) {
            const r = docSnap.data();
            modalRicettaTitle.textContent = "Modifica Ricetta";
            ricettaIdInput.value = id;
            ricettaNomeInput.value = r.nome || "";
            ricettaNoteInput.value = r.note || "";

            containerIngredienti.innerHTML = "";
            (r.ingredienti || []).forEach(i => aggiungiRigaIngrediente(i));

            containerProcedimento.innerHTML = "";
            (r.procedimento || []).forEach(p => aggiungiRigaProcedimento(p));

            modalRicetta.style.display = 'flex';
        }
    } catch (err) {
        alert("Errore nel recupero della ricetta.");
    }
}

window.eliminaRicetta = async function(id) {
    if (confirm("Vuoi eliminare questa ricetta?")) {
        await deleteDoc(doc(db, "ricette", id));
        caricaRicette();
    }
}

if (btnRicettaCasuale) {
    btnRicettaCasuale.addEventListener('click', async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "ricette"));
            let ricette = [];
            querySnapshot.forEach(docSnap => ricette.push(docSnap.data()));

            if (ricette.length === 0) {
                alert("Nessuna ricetta disponibile nel ricettario!");
                return;
            }

            const estratta = ricette[Math.floor(Math.random() * ricette.length)];
            mostraModalRicettaCasuale(estratta);
        } catch (err) {
            alert("Errore nell'estrazione della ricetta casuale.");
        }
    });
}

function mostraModalRicettaCasuale(r) {
    let ing = (r.ingredienti || []).map(i => `<li>${i}</li>`).join('');
    let proc = (r.procedimento || []).map(p => `<li>${p}</li>`).join('');

    contenutoRicettaCasuale.innerHTML = `
        <h4 style="color: var(--user-primary); margin-bottom: 10px; font-size: 1.2rem;">${r.nome}</h4>
        <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 10px;">Caricata da: <strong>${r.creatore || 'Famiglia'}</strong></p>
        <div style="margin-bottom: 10px;">
            <strong style="font-size: 1rem;">Ingredienti:</strong>
            <ul style="padding-left: 18px; font-size: 0.95rem;">${ing}</ul>
        </div>
        <div>
            <strong style="font-size: 1rem;">Procedimento:</strong>
            <ol style="padding-left: 18px; font-size: 0.95rem;">${proc}</ol>
        </div>
    `;
    modalRicettaCasuale.style.display = 'flex';
}

if (btnAltraRicettaCasuale) {
    btnAltraRicettaCasuale.addEventListener('click', async () => {
        btnRicettaCasuale.click();
        modalRicettaCasuale.style.display = 'none';
    });
}

if (btnChiudiModalCasuale) {
    btnChiudiModalCasuale.addEventListener('click', () => {
        modalRicettaCasuale.style.display = 'none';
    });
}
