// js/ricette.js - Gestione Ricette con Accordion, Colore Utente e Campi Dinamici per Ingredienti e Procedimento

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

    // Inizializza i pulsanti per aggiungere righe dinamiche nella modale se presenti nell'HTML
    preparaCampiDinamiciModale();

    if (formRicetta) {
        formRicetta.addEventListener('submit', async (e) => {
            e.preventDefault();
            const utente = getUtenteCorrente();
            if (!utente) return;

            const editId = inputEditId ? inputEditId.value : "";
            const nome = document.getElementById('ricetta-nome').value.trim();
            const note = document.getElementById('ricetta-note') ? document.getElementById('ricetta-note').value.trim() : '';

            // Raccoglie gli ingredienti dai vari input dinamici
            const ingredientiInputs = document.querySelectorAll('.input-ingrediente-dinamico');
            const ingredienti = Array.from(ingredientiInputs)
                .map(input => input.value.trim())
                .filter(val => val !== '');

            // Raccoglie i passaggi del procedimento dai vari input dinamici
            const procedimentoInputs = document.querySelectorAll('.input-procedimento-dinamico');
            const procedimento = Array.from(procedimentoInputs)
                .map(input => input.value.trim())
                .filter(val => val !== '');

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

function preparaCampiDinamiciModale() {
    // Verifica e configura i container per ingredienti e procedimenti dinamici nella modale
    const containerIng = document.getElementById('container-ingredienti-dinamici');
    const containerProc = document.getElementById('container-procedimenti-dinamici');

    if (containerIng && !document.getElementById('btn-aggiungi-ingrediente')) {
        const btnAddIng = document.createElement('button');
        btnAddIng.type = 'button';
        btnAddIng.id = 'btn-aggiungi-ingrediente';
        btnAddIng.textContent = '+ Aggiungi ingrediente';
        btnAddIng.className = 'add-btn';
        btnAddIng.style.marginTop = '8px';
        btnAddIng.style.padding = '6px 12px';
        btnAddIng.style.fontSize = '0.9rem';
        
        btnAddIng.addEventListener('click', () => {
            aggiungiRigaIngrediente('');
        });
        containerIng.parentNode.appendChild(btnAddIng);
    }

    if (containerProc && !document.getElementById('btn-aggiungi-passaggio')) {
        const btnAddProc = document.createElement('button');
        btnAddProc.type = 'button';
        btnAddProc.id = 'btn-aggiungi-passaggio';
        btnAddProc.textContent = '+ Aggiungi passaggio';
        btnAddProc.className = 'add-btn';
        btnAddProc.style.marginTop = '8px';
        btnAddProc.style.padding = '6px 12px';
        btnAddProc.style.fontSize = '0.9rem';

        btnAddProc.addEventListener('click', () => {
            aggiungiRigaProcedimento('');
        });
        containerProc.parentNode.appendChild(btnAddProc);
    }
}

export function aggiungiRigaIngrediente(valore = '') {
    const containerIng = document.getElementById('container-ingredienti-dinamici');
    if (!containerIng) return;

    const riga = document.createElement('div');
    riga.style.display = 'flex';
    riga.style.gap = '8px';
    riga.style.marginBottom = '6px';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'input-ingrediente-dinamico';
    input.value = valore;
    input.placeholder = 'Es. Farina 200g';
    input.style.flex = '1';
    input.style.padding = '8px';
    input.style.borderRadius = '6px';
    input.style.border = '1px solid #ccc';

    const btnDel = document.createElement('button');
    btnDel.type = 'button';
    btnDel.textContent = '✕';
    btnDel.style.backgroundColor = '#e74c3c';
    btnDel.style.color = 'white';
    btnDel.style.border = 'none';
    btnDel.style.padding = '0 10px';
    btnDel.style.borderRadius = '6px';
    btnDel.style.cursor = 'pointer';

    btnDel.addEventListener('click', () => {
        riga.remove();
    });

    riga.appendChild(input);
    riga.appendChild(btnDel);
    containerIng.appendChild(riga);
}

export function aggiungiRigaProcedimento(valore = '') {
    const containerProc = document.getElementById('container-procedimenti-dinamici');
    if (!containerProc) return;

    const numeroPassaggio = containerProc.children.length + 1;

    const riga = document.createElement('div');
    riga.style.display = 'flex';
    riga.style.gap = '8px';
    riga.style.marginBottom = '6px';
    riga.style.alignItems = 'center';

    const spanNum = document.createElement('span');
    spanNum.textContent = `${numeroPassaggio}.`;
    spanNum.style.fontWeight = 'bold';
    spanNum.style.minWidth = '20px';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'input-procedimento-dinamico';
    input.value = valore;
    input.placeholder = 'Descrivi il passaggio...';
    input.style.flex = '1';
    input.style.padding = '8px';
    input.style.borderRadius = '6px';
    input.style.border = '1px solid #ccc';

    const btnDel = document.createElement('button');
    btnDel.type = 'button';
    btnDel.textContent = '✕';
    btnDel.style.backgroundColor = '#e74c3c';
    btnDel.style.color = 'white';
    btnDel.style.border = 'none';
    btnDel.style.padding = '0 10px';
    btnDel.style.borderRadius = '6px';
    btnDel.style.cursor = 'pointer';

    btnDel.addEventListener('click', () => {
        riga.remove();
        aggiornaNumeriProcedimento();
    });

    riga.appendChild(spanNum);
    riga.appendChild(input);
    riga.appendChild(btnDel);
    containerProc.appendChild(riga);
}

function aggiornaNumeriProcedimento() {
    const containerProc = document.getElementById('container-procedimenti-dinamici');
    if (!containerProc) return;
    const righe = containerProc.children;
    for (let i = 0; i < righe.length; i++) {
        const span = righe[i].querySelector('span');
        if (span) span.textContent = `${i + 1}.`;
    }
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
            
            const containerIng = document.getElementById('container-ingredienti-dinamici');
            const containerProc = document.getElementById('container-procedimenti-dinamici');
            if (containerIng) containerIng.innerHTML = '';
            if (containerProc) containerProc.innerHTML = '';
            aggiungiRigaIngrediente();
            aggiungiRigaProcedimento();

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
        card.style.borderRadius = '12px';
        card.style.boxShadow = '0 4px 10px rgba(0,0,0,0.08)';
        card.style.borderLeft = `8px solid ${coloreCreatore}`;
        card.style.overflow = 'hidden';

        // Header chiuso (visibile di default) con il nome della ricetta e l'autore sullo sfondo colorato
        const headerChiuso = document.createElement('div');
        headerChiuso.style.padding = '15px 18px';
        headerChiuso.style.backgroundColor = `${coloreCreatore}15`; // Leggera sfumatura del colore utente
        headerChiuso.style.cursor = 'pointer';
        headerChiuso.style.display = 'flex';
        headerChiuso.style.justifyContent = 'space-between';
        headerChiuso.style.alignItems = 'center';

        headerChiuso.innerHTML = `
            <div>
                <div style="font-size: 1.2rem; font-weight: 800; color: #222;">🍳 ${item.nome || 'Senza Titolo'}</div>
                <div style="font-size: 0.9rem; font-weight: bold; color: ${coloreCreatore}; margin-top: 4px;">👤 Creato da: ${nomeCreatore}</div>
            </div>
            <div style="font-size: 1.2rem; font-weight: bold; color: #555;">▼</div>
        `;

        // Corpo espandibile (nascosto di default)
        const corpoEspandibile = document.createElement('div');
        corpoEspandibile.style.padding = '18px';
        corpoEspandibile.style.display = 'none'; // Chiuso inizialmente
        corpoEspandibile.style.borderTop = '1px solid #eee';

        let htmlIngredienti = 'Nessun ingrediente specificato';
        if (Array.isArray(item.ingredienti)) {
            htmlIngredienti = item.ingredienti.join(' • ');
        } else if (typeof item.ingredienti === 'string') {
            htmlIngredienti = item.ingredienti;
        }

        let htmlProcedimento = '';
        let passaggi = [];
        if (Array.isArray(item.procedimento)) {
            passaggi = item.procedimento;
        } else if (typeof item.procedimento === 'string') {
            passaggi = item.procedimento.split('\n').filter(p => p.trim() !== '');
        }

        if (passaggi.length > 0) {
            htmlProcedimento = passaggi.map((p, idx) => `<div style="margin-top: 4px;"><strong>${idx + 1}.</strong> ${p}</div>`).join('');
        }

        corpoEspandibile.innerHTML = `
            <div style="font-size: 1.05rem; font-weight: bold; color: #333; margin-bottom: 10px;">
                🛒 <strong>Ingredienti:</strong> <span style="font-weight: normal; color: #444;">${htmlIngredienti}</span>
            </div>

            ${htmlProcedimento ? `
                <div style="font-size: 1.05rem; color: #333; margin-bottom: 10px;">
                    👨‍🍳 <strong>Procedimento:</strong>
                    <div style="margin-top: 4px; padding-left: 8px; font-weight: normal; color: #444;">${htmlProcedimento}</div>
                </div>
            ` : ''}

            ${item.note ? `
                <div style="font-size: 1rem; font-weight: bold; color: #d35400; margin-bottom: 12px;">
                    📝 <strong>Note:</strong> <span style="font-weight: normal; color: #555;">${item.note}</span>
                </div>
            ` : ''}

            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button type="button" class="btn-edit-ric" style="background-color: #2980b9; color: white; padding: 10px; font-size: 1rem; font-weight: bold; cursor: pointer; border-radius: 8px; border: none; flex: 1;" data-id="${item.id}">Modifica</button>
                <button type="button" class="btn-del-ric" style="background-color: #e74c3c; color: white; padding: 10px; font-size: 1rem; font-weight: bold; cursor: pointer; border-radius: 8px; border: none; flex: 1;" data-id="${item.id}">Elimina</button>
            </div>
        `;

        // Logica di apertura/chiusura al click sull'header
        headerChiuso.addEventListener('click', () => {
            const isOpen = corpoEspandibile.style.display === 'block';
            corpoEspandibile.style.display = isOpen ? 'none' : 'block';
            headerChiuso.querySelector('div:last-child').textContent = isOpen ? '▼' : '▲';
        });

        // Pulsante Modifica
        corpoEspandibile.querySelector('.btn-edit-ric').addEventListener('click', (e) => {
            e.stopPropagation();
            if (inputEditId) inputEditId.value = item.id;
            document.getElementById('ricetta-nome').value = item.nome || '';
            if (document.getElementById('ricetta-note')) {
                document.getElementById('ricetta-note').value = item.note || '';
            }

            // Popola i campi dinamici ingredienti nella modale
            const containerIng = document.getElementById('container-ingredienti-dinamici');
            if (containerIng) {
                containerIng.innerHTML = '';
                const ingArray = Array.isArray(item.ingredienti) ? item.ingredienti : [item.ingredienti || ''];
                ingArray.forEach(ing => aggiungiRigaIngrediente(ing));
            }

            // Popola i campi dinamici procedimento nella modale
            const containerProc = document.getElementById('container-procedimenti-dinamici');
            if (containerProc) {
                containerProc.innerHTML = '';
                const procArray = Array.isArray(item.procedimento) ? item.procedimento : [item.procedimento || ''];
                procArray.forEach(proc => aggiungiRigaProcedimento(proc));
            }

            if (modalRicettaTitoloTesto) modalRicettaTitoloTesto.textContent = "Modifica Ricetta";
            if (modalRicetta) modalRicetta.classList.add('active');
        });

        // Pulsante Elimina
        corpoEspandibile.querySelector('.btn-del-ric').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`Vuoi eliminare la ricetta "${item.nome}"?`)) {
                try {
                    await deleteDoc(doc(db, "ricette", item.id));
                } catch (err) {
                    console.error("Errore eliminazione ricetta:", err);
                }
            }
        });

        card.appendChild(headerChiuso);
        card.appendChild(corpoEspandibile);
        containerRicette.appendChild(card);
    });
}
