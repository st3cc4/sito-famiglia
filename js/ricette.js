// js/ricette.js - Gestione Ricette, Layout Verticale, Colore Creatore e Anteprima Home

import { db } from "./firebase-config.js";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { mostraSezione } from "./navigation.js";

const containerRicette = document.getElementById('container-ricette');
const containerHomeRicette = document.getElementById('container-home-ricette');
const modalRicetta = document.getElementById('modal-ricetta');
const btnCloseModalRicetta = document.getElementById('btn-close-modal-ricetta');
const formRicetta = document.getElementById('form-ricetta');
const inputEditId = document.getElementById('ricetta-edit-id');
const modalRicettaTitoloTesto = document.getElementById('modal-ricetta-titolo-testo');

let tutteLeRicette = [];
let mappaColoriUtenti = {};

export function initRicette(getUtenteCorrente) {
    if (btnCloseModalRicetta) {
        btnCloseModalRicetta.addEventListener('click', () => {
            if (modalRicetta) modalRicetta.classList.remove('active');
        });
    }

    if (formRicetta) {
        formRicetta.addEventListener('submit', async (e) => {
            e.preventDefault();
            const utente = getUtenteCorrente();
            if (!utente) return;

            const editId = inputEditId ? inputEditId.value : "";
            const nome = document.getElementById('ricetta-nome').value.trim();
            const ingredienti = document.getElementById('ricetta-ingredienti').value.trim();
            const procedimento = document.getElementById('ricetta-procedimento').value.trim();
            const note = document.getElementById('ricetta-note').value.trim();

            try {
                if (editId) {
                    const ricRef = doc(db, "ricette", editId);
                    await updateDoc(ricRef, {
                        nome,
                        ingredienti,
                        procedimento,
                        note
                    });
                } else {
                    await addDoc(collection(db, "ricette"), {
                        nome,
                        ingredienti,
                        procedimento,
                        note,
                        creatoDa: utente.nome,
                        creatoDaId: utente.id,
                        coloreUtente: utente.colore || '#4A90E2'
                    });
                }

                formRicetta.reset();
                if (inputEditId) inputEditId.value = "";
                if (modalRicetta) modalRicetta.classList.remove('active');
            } catch (err) {
                console.error("Errore salvataggio ricetta:", err);
                alert("Errore durante il salvataggio della ricetta.");
            }
        });
    }

    caricaMappaColoriUtenti().then(() => {
        ascoltaRicetteFirestore();
    });
}

async function caricaMappaColoriUtenti() {
    try {
        const snap = await getDocs(collection(db, "utenti"));
        snap.forEach(d => {
            const u = d.data();
            if (u.nome && u.colore) {
                mappaColoriUtenti[u.nome.toLowerCase()] = u.colore;
            }
        });
    } catch (err) {
        console.error("Errore caricamento colori utenti:", err);
    }
}

function ascoltaRicetteFirestore() {
    onSnapshot(collection(db, "ricette"), (snapshot) => {
        tutteLeRicette = [];
        snapshot.forEach((docSnap) => {
            tutteLeRicette.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        renderizzaRicette();
        renderizzaRicetteHome();
    });
}

function renderizzaRicetteHome() {
    if (!containerHomeRicette) return;
    containerHomeRicette.innerHTML = '';

    if (tutteLeRicette.length === 0) {
        containerHomeRicette.innerHTML = '<p style="color: #777; font-size: 0.95rem; font-weight: bold; margin: 0;">Nessuna ricetta salvata.</p>';
        return;
    }

    // Prende le ultime ricette o fino a 3 ricette per la Home
    const ultimeRicette = tutteLeRicette.slice(-3).reverse();

    ultimeRicette.forEach(item => {
        const nomeCreatore = item.creatoDa || 'Famiglia';
        const coloreCreatore = item.coloreUtente || mappaColoriUtenti[nomeCreatore.toLowerCase()] || '#4A90E2';

        const div = document.createElement('div');
        div.style.padding = '8px 10px';
        div.style.backgroundColor = '#f8f9fa';
        div.style.borderRadius = '6px';
        div.style.marginBottom = '8px';
        div.style.borderLeft = `4px solid ${coloreCreatore}`;

        div.innerHTML = `
            <div style="font-weight: 800; color: #2c3e50; font-size: 1rem;">🍳 ${item.nome || 'Senza Titolo'}</div>
            <div style="font-size: 0.85rem; font-weight: bold; color: ${coloreCreatore}; margin-top: 2px;">
                👤 Creato da: ${nomeCreatore}
            </div>
        `;

        containerHomeRicette.appendChild(div);
    });
}

function renderizzaRicette() {
    if (!containerRicette) return;
    containerRicette.innerHTML = '';

    const sectionRicette = document.getElementById('section-ricette');
    let sectionHeader = sectionRicette ? sectionRicette.querySelector('.section-header') : null;
    
    if (sectionHeader) {
        sectionHeader.innerHTML = `
            <button id="btn-torna-home-ricette" class="cancel-btn" style="padding: 10px 16px; font-weight: bold; cursor: pointer; border-radius: 8px;">← Torna alla Home</button>
            <button id="btn-add-ricetta-custom" class="add-btn" style="padding: 10px 18px; font-weight: bold; cursor: pointer; border-radius: 8px;">Nuova Ricetta</button>
        `;

        document.getElementById('btn-torna-home-ricette').addEventListener('click', () => {
            mostraSezione('home');
        });

        document.getElementById('btn-add-ricetta-custom').addEventListener('click', () => {
            if (formRicetta) formRicetta.reset();
            if (inputEditId) inputEditId.value = "";
            if (modalRicettaTitoloTesto) modalRicettaTitoloTesto.textContent = "Nuova Ricetta";
            if (modalRicetta) modalRicetta.classList.add('active');
        });
    }

    containerRicette.style.display = 'flex';
    containerRicette.style.flexDirection = 'column';
    containerRicette.style.gap = '15px';
    containerRicette.style.marginTop = '20px';

    if (tutteLeRicette.length === 0) {
        containerRicette.innerHTML = '<p style="color: #777; font-size: 1.1rem; font-weight: bold;">Nessuna ricetta salvata.</p>';
        return;
    }

    tutteLeRicette.forEach((item) => {
        const nomeCreatore = item.creatoDa || 'Famiglia';
        const coloreCreatore = item.coloreUtente || mappaColoriUtenti[nomeCreatore.toLowerCase()] || '#4A90E2';

        const card = document.createElement('div');
        card.style.width = '100%';
        card.style.boxSizing = 'border-box';
        card.style.backgroundColor = '#ffffff';
        card.style.padding = '18px';
        card.style.borderRadius = '12px';
        card.style.boxShadow = '0 4px 10px rgba(0,0,0,0.08)';
        card.style.borderLeft = `8px solid ${coloreCreatore}`;

        let htmlIngredienti = 'Nessun ingrediente specificato';
        if (Array.isArray(item.ingredienti)) {
            htmlIngredienti = item.ingredienti.join(' • ');
        } else if (typeof item.ingredienti === 'string' && item.ingredienti.trim() !== '') {
            htmlIngredienti = item.ingredienti.split('\n').filter(i => i.trim() !== '').join(' • ');
        } else if (item.ingredienti) {
            htmlIngredienti = String(item.ingredienti);
        }

        let htmlProcedimento = '';
        let passaggi = [];
        if (Array.isArray(item.procedimento)) {
            passaggi = item.procedimento;
        } else if (typeof item.procedimento === 'string' && item.procedimento.trim() !== '') {
            passaggi = item.procedimento.split('\n').filter(p => p.trim() !== '');
        } else if (item.procedimento) {
            passaggi = [String(item.procedimento)];
        }

        if (passaggi.length > 0) {
            htmlProcedimento = passaggi.map((p, idx) => `<div style="margin-top: 4px;"><strong>${idx + 1}.</strong> ${p}</div>`).join('');
        }

        card.innerHTML = `
            <div style="font-size: 1.3rem; font-weight: 800; color: #222; margin-bottom: 10px;">${item.nome || 'Senza Titolo'}</div>
            
            <div style="font-size: 1.05rem; font-weight: bold; color: #333; margin-bottom: 8px;">
                🛒 <strong>Ingredienti:</strong> <span style="font-weight: normal; color: #444;">${htmlIngredienti}</span>
            </div>

            ${htmlProcedimento ? `
                <div style="font-size: 1.05rem; color: #333; margin-bottom: 8px;">
                    👨‍🍳 <strong>Procedimento:</strong>
                    <div style="margin-top: 4px; padding-left: 8px; font-weight: normal; color: #444;">${htmlProcedimento}</div>
                </div>
            ` : ''}

            ${item.note ? `
                <div style="font-size: 1rem; font-weight: bold; color: #d35400; margin-bottom: 8px;">
                    📝 <strong>Note:</strong> <span style="font-weight: normal; color: #555;">${item.note}</span>
                </div>
            ` : ''}

            <div style="font-size: 0.95rem; font-weight: bold; color: ${coloreCreatore}; margin-bottom: 14px;">
                👤 Creato da: ${nomeCreatore}
            </div>

            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button type="button" class="btn-edit-ric" style="background-color: #2980b9; color: white; padding: 10px; font-size: 1rem; font-weight: bold; cursor: pointer; border-radius: 8px; border: none; flex: 1;" data-id="${item.id}">Modifica</button>
                <button type="button" class="btn-del-ric" style="background-color: #e74c3c; color: white; padding: 10px; font-size: 1rem; font-weight: bold; cursor: pointer; border-radius: 8px; border: none; flex: 1;" data-id="${item.id}">Elimina</button>
            </div>
        `;

        card.querySelector('.btn-edit-ric').addEventListener('click', () => {
            if (inputEditId) inputEditId.value = item.id;
            document.getElementById('ricetta-nome').value = item.nome || '';
            
            const ingrVal = Array.isArray(item.ingredienti) ? item.ingredienti.join('\n') : (item.ingredienti || '');
            const procVal = Array.isArray(item.procedimento) ? item.procedimento.join('\n') : (item.procedimento || '');

            document.getElementById('ricetta-ingredienti').value = ingrVal;
            document.getElementById('ricetta-procedimento').value = procVal;
            document.getElementById('ricetta-note').value = item.note || '';

            if (modalRicettaTitoloTesto) modalRicettaTitoloTesto.textContent = "Modifica Ricetta";
            if (modalRicetta) modalRicetta.classList.add('active');
        });

        card.querySelector('.btn-del-ric').addEventListener('click', async () => {
            if (confirm(`Vuoi eliminare la ricetta "${item.nome}"?`)) {
                try {
                    await deleteDoc(doc(db, "ricette", item.id));
                } catch (err) {
                    console.error("Errore eliminazione ricetta:", err);
                }
            }
        });

        containerRicette.appendChild(card);
    });
}
