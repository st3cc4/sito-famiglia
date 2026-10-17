// js/impegni.js - Gestione Impegni e Filtro Settimanale per la HOME

import { db } from "./firebase-config.js";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const containerImpegni = document.getElementById('container-impegni');
const containerHomeImpegni = document.getElementById('container-home-impegni');
const modalImpegno = document.getElementById('modal-impegno');
const btnAddImpegno = document.getElementById('btn-add-impegno');
const btnCloseModalImpegno = document.getElementById('btn-close-modal-impegno');
const formImpegno = document.getElementById('form-impegno');

let tuttiGliImpegni = [];

export function initImpegni(getUtenteCorrente) {
    if (btnAddImpegno) {
        btnAddImpegno.addEventListener('click', () => {
            if (modalImpegno) modalImpegno.classList.add('active');
        });
    }

    if (btnCloseModalImpegno) {
        btnCloseModalImpegno.addEventListener('click', () => {
            if (modalImpegno) modalImpegno.classList.remove('active');
        });
    }

    if (formImpegno) {
        formImpegno.addEventListener('submit', async (e) => {
            e.preventDefault();
            const utente = getUtenteCorrente();
            if (!utente) return;

            const titolo = document.getElementById('impegno-titolo').value.trim();
            const data = document.getElementById('impegno-data').value;
            const oraInizio = document.getElementById('impegno-ora-inizio').value;
            const oraFine = document.getElementById('impegno-ora-fine').value;

            try {
                await addDoc(collection(db, "appuntamenti"), {
                    titolo,
                    data,
                    oraInizio: oraInizio || "",
                    oraFine: oraFine || "",
                    creatoDa: utente.nome,
                    creatoDaId: utente.id
                });

                formImpegno.reset();
                if (modalImpegno) modalImpegno.classList.remove('active');
            } catch (err) {
                console.error("Errore salvataggio impegno:", err);
                alert("Errore durante il salvataggio dell'impegno.");
            }
        });
    }

    ascoltaImpegniFirestore();
}

function ascoltaImpegniFirestore() {
    onSnapshot(collection(db, "appuntamenti"), (snapshot) => {
        tuttiGliImpegni = [];
        snapshot.forEach((docSnap) => {
            tuttiGliImpegni.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        tuttiGliImpegni.sort((a, b) => new Date(a.data) - new Date(b.data));

        renderizzaImpegniNormali();
        renderizzaImpegniHomeSettimana();
    });
}

function renderizzaImpegniNormali() {
    if (!containerImpegni) return;
    containerImpegni.innerHTML = '';

    if (tuttiGliImpegni.length === 0) {
        containerImpegni.innerHTML = '<p style="color: #777;">Nessun impegno presente.</p>';
        return;
    }

    tuttiGliImpegni.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'home-item-card';
        card.innerHTML = `
            <div class="item-title">${item.titolo}</div>
            <div class="item-info">📅 Data: ${item.data}</div>
            ${item.oraInizio ? `<div class="item-info">⏰ Orario: ${item.oraInizio}${item.oraFine ? '- ' + item.oraFine : ''}</div>` : ''}
            <div class="item-info">👤 Creato da: ${item.creatoDa || 'Famiglia'}</div>
            <button type="button" class="cancel-btn" style="margin-top: 8px; padding: 6px 12px; font-size: 0.85rem;" data-id="${item.id}">Elimina</button>
        `;

        card.querySelector('button').addEventListener('click', async () => {
            if (confirm(`Vuoi eliminare l'impegno "${item.titolo}"?`)) {
                try {
                    await deleteDoc(doc(db, "appuntamenti", item.id));
                } catch (err) {
                    console.error("Errore eliminazione impegno:", err);
                }
            }
        });

        containerImpegni.appendChild(card);
    });
}

// Filtra e mostra gli impegni della settimana corrente nella HOME
function renderizzaImpegniHomeSettimana() {
    if (!containerHomeImpegni) return;
    containerHomeImpegni.innerHTML = '';

    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    // Calcoliamo la fine della settimana (tra 7 giorni)
    const tra7Giorni = new Date(oggi);
    tra7Giorni.setDate(oggi.getDate() + 7);

    const impegniSettimana = tuttiGliImpegni.filter((item) => {
        const dataImp = new Date(item.data);
        dataImp.setHours(0, 0, 0, 0);
        return dataImp >= oggi && dataImp <= tra7Giorni;
    });

    if (impegniSettimana.length === 0) {
        containerHomeImpegni.innerHTML = '<p style="color: #777; font-size: 0.9rem;">Nessun impegno nei prossimi 7 giorni.</p>';
        return;
    }

    impegniSettimana.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'home-item-card';
        card.style.borderLeftColor = '#4A90E2';

        card.innerHTML = `
            <div class="item-title">${item.titolo}</div>
            <div class="item-info">📅 ${item.data} ${item.oraInizio ? '(' + item.oraInizio + ')' : ''}</div>
            <div class="item-info">👤 ${item.creatoDa || 'Famiglia'}</div>
        `;

        containerHomeImpegni.appendChild(card);
    });
}
