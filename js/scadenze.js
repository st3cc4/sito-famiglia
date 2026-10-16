// js/scadenze.js - Gestione Scadenze su Firestore

import { db } from "./firebase-config.js";
import { collection, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export function initScadenze(getUtenteCorrente) {
    const modalScadenza = document.getElementById('modal-scadenza');
    const btnAddScadenza = document.getElementById('btn-add-scadenza');
    const btnCloseModalScadenza = document.getElementById('btn-close-modal-scadenza');
    const formScadenza = document.getElementById('form-scadenza');
    const containerScadenze = document.getElementById('container-scadenze');

    if (btnAddScadenza && modalScadenza) {
        btnAddScadenza.addEventListener('click', () => modalScadenza.classList.add('active'));
    }
    if (btnCloseModalScadenza && modalScadenza) {
        btnCloseModalScadenza.addEventListener('click', () => modalScadenza.classList.remove('active'));
    }

    if (formScadenza) {
        formScadenza.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titolo = document.getElementById('scadenza-titolo').value;
            const data = document.getElementById('scadenza-data').value;
            const importo = parseFloat(document.getElementById('scadenza-importo').value) || 0;
            const utente = getUtenteCorrente();

            try {
                await addDoc(collection(db, "scadenze"), {
                    titolo: titolo,
                    data: data,
                    importo: importo,
                    creatore: utente ? utente.nome : "Sconosciuto"
                });
                formScadenza.reset();
                if (modalScadenza) modalScadenza.classList.remove('active');
            } catch (error) {
                console.error("Errore salvataggio scadenza:", error);
            }
        });
    }

    if (containerScadenze) {
        onSnapshot(collection(db, "scadenze"), (snapshot) => {
            containerScadenze.innerHTML = '';
            if (snapshot.empty) {
                containerScadenze.innerHTML = '<p class="card-meta">Nessuna scadenza trovata.</p>';
                return;
            }
            snapshot.forEach((docSnap) => {
                const item = docSnap.data();
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="card-title">${item.titolo || 'Senza Titolo'}</div>
                    <div class="card-meta">📅 Data Scadenza: ${item.data || 'N/D'}</div>
                    <div class="card-meta">💰 Importo: € ${item.importo !== undefined ? item.importo.toFixed(2) : '0.00'}</div>
                    <div class="card-meta">👤 Creato da: ${item.creatore || 'Sconosciuto'}</div>
                `;
                containerScadenze.appendChild(card);
            });
        });
    }
}
