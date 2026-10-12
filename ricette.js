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
import { nomeUtenteCorrente, formatCapitalize } from "./auth.js";

const btnApriModalRicetta = document.getElementById('btn-apri-modal-ricetta');
const btnChiudiModalRicetta = document.getElementById('btn-chiudi-modal-ricetta');
const modalRicetta = document.getElementById('modal-ricetta');
const modalRicettaTitle = document.getElementById('modal-ricetta-title');
const ricettaForm = document.getElementById('ricetta-form');
const ricettaIdInput = document.getElementById('ricetta-id');
const ricettaNomeInput = document.getElementById('ricetta-nome');
const containerIngredienti = document.getElementById('container-ingredienti');
const btnAggiungiIngrediente = document.getElementById('btn-aggiungi-ingrediente');
const containerProcedimento = document.getElementById('container-procedimento');
const btnAggiungiPasso = document.getElementById('btn-aggiungi-passo');
const ricettaNoteInput = document.getElementById('ricetta-note');
const listaRicette = document.getElementById('lista-ricette');
const summaryRicette = document.getElementById('home-summary-ricette');

const btnRicettaCasuale = document.getElementById('btn-ricetta-casuale');
const modalRicettaCasuale = document.getElementById('modal-ricetta-casuale');
const btnChiudiModalCasuale = document.getElementById('btn-chiudi-modal-casuale');
const contenutoRicettaCasuale = document.getElementById('contenuto-ricetta-casuale');
const btnAltraRicettaCasuale = document.getElementById('btn-altra-ricetta-casuale');
const titoloRicettaCasuale = document.getElementById('titolo-ricetta-casuale');

let elListaRicetteGlobal = [];

export function aggiungiRigaIngrediente(valore = "") {
    const div = document.createElement('div');
    div.className = 'dynamic-row-input';
    div.innerHTML = `
        <span style="font-weight: bold; color: #64748b;">•</span>
        <input type="text" class="input-ingrediente" value="${valore}" placeholder="Es. 200g di farina" required>
        <button type="button" class="btn-rimuovi-riga" onclick="this.parentElement.remove()">&times;</button>
    `;
    containerIngredienti.appendChild(div);
}

export function aggiungiRigaPasso(valore = "") {
    const numeroPassi = containerProcedimento.children.length + 1;
    const div = document.createElement('div');
    div.className = 'dynamic-row-input';
    div.innerHTML = `
        <span class="numero-passo-label" style="font-weight: bold; color: #3b82f6; min-width: 20px;">${numeroPassi}.</span>
        <input type="text" class="input-passo" value="${valore}" placeholder="Es. Mescolare uova e zucchero" required>
        <button type="button" class="btn-rimuovi-riga" onclick="rimuoviPasso(this)">&times;</button>
    `;
    containerProcedimento.appendChild(div);
}

window.rimuoviPasso = function(btn) {
    btn.parentElement.remove();
    aggiornaNumeriPassi();
}

function aggiornaNumeriPassi() {
    const righe = containerProcedimento.querySelectorAll('.dynamic-row-input');
    righe.forEach((riga, index) => {
        const etichetta = riga.querySelector('.numero-passo-label');
        if (etichetta) etichetta.textContent = `${index + 1}.`;
    });
}

btnAggiungiIngrediente.addEventListener('click', () => aggiungiRigaIngrediente());
btnAggiungiPasso.addEventListener('click', () => aggiungiRigaPasso());

btnApriModalRicetta.addEventListener('click', () => {
    modalRicettaTitle.textContent = "Nuova Ricetta";
    ricettaForm.reset();
    ricettaIdInput.value = "";
    containerIngredienti.innerHTML = "";
    containerProcedimento.innerHTML = "";
    aggiungiRigaIngrediente();
    aggiungiRigaPasso();
    modalRicetta.style.display = 'flex';
});

btnChiudiModalRicetta.addEventListener('click', () => {
    modalRicetta.style.display = 'none';
});

btnRicettaCasuale.addEventListener('click', estraiRicettaCasuale);
btnAltraRicettaCasuale.addEventListener('click', estraiRicettaCasuale);
btnChiudiModalCasuale.addEventListener('click', () => {
    modalRicettaCasuale.style.display = 'none';
});

function estraiRicettaCasuale() {
    if (elListaRicetteGlobal.length === 0) {
        alert("Nessuna ricetta presente nel ricettario!");
        return;
    }
    const randomIndex = Math.floor(Math.random() * elListaRicetteGlobal.length);
    const r = elListaRicetteGlobal[randomIndex];

    titoloRicettaCasuale.textContent = r.nome;

    let htmlIng = "";
    if (r.ingredienti && r.ingredienti.length > 0) {
        r.ingredienti.forEach(ing => htmlIng += `<li>• ${ing}</li>`);
    }

    let htmlProc = "";
    if (r.procedimento && r.procedimento.length > 0) {
        r.procedimento.forEach((pas, idx) => htmlProc += `<li><strong>${idx + 1}.</strong> ${pas}</li>`);
    }

    let htmlNote = r.note ? `<div style="margin-top: 8px; font-size: 0.9rem; color: #475569;"><strong>Note:</strong> ${r.note}</div>` : '';

    contenutoRicettaCasuale.innerHTML = `
        <div class="ricetta-sezione-titolo">Ingredienti:</div>
        <ul class="ricetta-lista-elementi">${htmlIng || '<li>Nessun ingrediente</li>'}</ul>
        <div class="ricetta-sezione-titolo">Procedimento:</div>
        <ul class="ricetta-lista-elementi" style="list-style-type: none; padding-left: 0;">${htmlProc || '<li>Nessun procedimento</li>'}</ul>
        ${htmlNote}
    `;

    modalRicettaCasuale.style.display = 'flex';
}

ricettaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = formatCapitalize(ricettaNomeInput.value);
    const editId = ricettaIdInput.value;

    const ingredienti = [];
    containerIngredienti.querySelectorAll('.input-ingrediente').forEach(input => {
        if (input.value.trim()) ingredienti.push(formatCapitalize(input.value));
    });

    const procedimento = [];
    containerProcedimento.querySelectorAll('.input-passo').forEach(input => {
        if (input.value.trim()) procedimento.push(formatCapitalize(input.value));
    });

    const note = formatCapitalize(ricettaNoteInput.value);

    const datiRicetta = {
        nome,
        ingredienti,
        procedimento,
        note,
        creatore: nomeUtenteCorrente
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
        alert("Errore nel salvataggio della ricetta.");
    }
});

export async function caricaRicette() {
    listaRicette.innerHTML = `<p class="text-muted">Caricamento ricette...</p>`;
    summaryRicette.innerHTML = `<p class="text-muted">Caricamento in corso...</p>`;

    try {
        const querySnapshot = await getDocs(collection(db, "ricette"));
        let ricette = [];
        querySnapshot.forEach(docSnap => {
            ricette.push({ id: docSnap.id, ...docSnap.data() });
        });

        ricette.sort((a, b) => a.nome.localeCompare(b.nome));
        elListaRicetteGlobal = ricette;

        if (ricette.length === 0) {
            listaRicette.innerHTML = `<p class="text-muted">Nessuna ricetta inserita nel ricettario.</p>`;
            summaryRicette.innerHTML = `<p class="text-muted">Nessuna ricetta salvata.</p>`;
            return;
        }

        let htmlGrigliaRicette = "";
        ricette.forEach(r => {
            let htmlIngredienti = "";
            if (r.ingredienti && r.ingredienti.length > 0) {
                r.ingredienti.forEach(ing => {
                    htmlIngredienti += `<li>• ${ing}</li>`;
                });
            }

            let htmlProcedimento = "";
            if (r.procedimento && r.procedimento.length > 0) {
                r.procedimento.forEach((pas, idx) => {
                    htmlProcedimento += `<li><strong>${idx + 1}.</strong> ${pas}</li>`;
                });
            }

            let htmlNote = r.note ? `<div style="margin-top: 6px; font-size: 0.9rem; color: #475569;"><strong>Note:</strong> ${r.note}</div>` : '';
            const creatoreRicetta = r.creatore ? r.creatore : "Famiglia";

            htmlGrigliaRicette += `
                <div class="ricetta-card-item" id="ricetta-card-${r.id}">
                    <div class="ricetta-header-row" onclick="toggleRicettaAccordion('${r.id}')">
                        <div class="ricetta-titolo">${r.nome}</div>
                        <span class="ricetta-creatore-tag">${creatoreRicetta}</span>
                    </div>
                    <div class="ricetta-corpo">
                        <div class="ricetta-sezione-titolo">Ingredienti:</div>
                        <ul class="ricetta-lista-elementi">${htmlIngredienti || '<li>Nessun ingrediente</li>'}</ul>

                        <div class="ricetta-sezione-titolo">Procedimento:</div>
                        <ul class="ricetta-lista-elementi" style="list-style-type: none; padding-left: 0;">${htmlProcedimento || '<li>Nessun procedimento</li>'}</ul>

                        ${htmlNote}

                        <div class="azioni-utente" style="margin-top: 10px;">
                            <button class="btn-modifica" onclick="modificaRicetta('${r.id}')">Mod.</button>
                            <button class="btn-elimina" onclick="eliminaRicetta('${r.id}')">Elimina</button>
                        </div>
                    </div>
                </div>`;
        });

        listaRicette.innerHTML = htmlGrigliaRicette;

        let htmlHomeRicette = "";
        ricette.forEach(r => {
            htmlHomeRicette += `
                <div style="padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem; font-weight: 600; color: #1e293b;">
                    ${r.nome}
                </div>`;
        });
        summaryRicette.innerHTML = htmlHomeRicette;

    } catch (err) {
        listaRicette.innerHTML = `<p class="text-muted">Errore nel caricamento delle ricette.</p>`;
        summaryRicette.innerHTML = `<p class="text-muted">Errore caricamento.</p>`;
    }
}

window.toggleRicettaAccordion = function(id) {
    const cardSelezionata = document.getElementById(`ricetta-card-${id}`);
    if (!cardSelezionata) return;

    const eraAperta = cardSelezionata.classList.contains('aperta');

    document.querySelectorAll('.ricetta-card-item').forEach(card => {
        card.classList.remove('aperta');
    });

    if (!eraAperta) {
        cardSelezionata.classList.add('aperta');
    }
}

window.eliminaRicetta = async function(id) {
    if (confirm("Vuoi eliminare questa ricetta?")) {
        await deleteDoc(doc(db, "ricette", id));
        caricaRicette();
    }
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
            if (r.ingredienti && r.ingredienti.length > 0) {
                r.ingredienti.forEach(ing => aggiungiRigaIngrediente(ing));
            } else {
                aggiungiRigaIngrediente();
            }

            containerProcedimento.innerHTML = "";
            if (r.procedimento && r.procedimento.length > 0) {
                r.procedimento.forEach(pas => aggiungiRigaPasso(pas));
            } else {
                aggiungiRigaPasso();
            }

            modalRicetta.style.display = 'flex';
        }
    } catch (err) {
        alert("Errore nel recupero dei dati della ricetta.");
    }
}
