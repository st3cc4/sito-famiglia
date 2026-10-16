// js/ricette.js - Gestione Ricette su Firestore

import { db } from "./firebase-config.js";
import { collection, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export function initRicette(getUtenteCorrente) {
    const modalRicetta = document.getElementById('modal-ricetta');
    const btnAddRicetta = document.getElementById('btn-add-ricetta');
    const btnCloseModalRicetta = document.getElementById('btn-close-modal-ricetta');
    const formRicetta = document.getElementById('form-ricetta');
    const containerRicette = document.getElementById('container-ricette');

    if (btnAddRicetta && modalRicetta) {
        btnAddRicetta.addEventListener('click', () => modalRicetta.classList.add('active'));
    }
    if (btnCloseModalRicetta && modalRicetta) {
        btnCloseModalRicetta.addEventListener('click', () => modalRicetta.classList.remove('active'));
    }

    if (formRicetta) {
        formRicetta.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('ricetta-nome').value;
            const ingredientiRaw = document.getElementById('ricetta-ingredienti').value;
            const procedimentoRaw = document.getElementById('ricetta-procedimento').value;
            const note = document.getElementById('ricetta-note').value;
            const utente = getUtenteCorrente();

            const ingredienti = ingredientiRaw.split('\n').filter(line => line.trim() !== '');
            const procedimento = procedimentoRaw.split('\n').filter(line => line.trim() !== '');

            try {
                await addDoc(collection(db, "ricette"), {
                    nome: nome,
                    ingredienti: ingredienti,
                    procedimento: procedimento,
                    note: note,
                    creatore: utente ? utente.nome : "Sconosciuto"
                });
                formRicetta.reset();
                if (modalRicetta) modalRicetta.classList.remove('active');
            } catch (error) {
                console.error("Errore salvataggio ricetta:", error);
            }
        });
    }

    if (containerRicette) {
        onSnapshot(collection(db, "ricette"), (snapshot) => {
            containerRicette.innerHTML = '';
            if (snapshot.empty) {
                containerRicette.innerHTML = '<p class="card-meta">Nessuna ricetta trovata.</p>';
                return;
            }
            snapshot.forEach((docSnap) => {
                const item = docSnap.data();
                const ingredientiLista = item.ingredienti && Array.isArray(item.ingredienti) 
                    ? item.ingredienti.join(', ') 
                    : 'Nessun ingrediente';

                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="card-title">${item.nome || 'Ricetta Senza Nome'}</div>
                    <div class="card-meta">🛒 <strong>Ingredienti:</strong> ${ingredientiLista}</div>
                    <div class="card-meta">📝 <strong>Note:</strong> ${item.note || 'Nessuna nota'}</div>
                    <div class="card-meta">👤 Creato da: ${item.creatore || 'Sconosciuto'}</div>
                `;
                containerRicette.appendChild(card);
            });
        });
    }
}
