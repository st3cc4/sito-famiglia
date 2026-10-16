// js/impegni.js - Gestione Impegni e Appuntamenti su Firestore

import { db } from "./firebase-config.js";
import { collection, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export function initImpegni(getUtenteCorrente) {
    const modalImpegno = document.getElementById('modal-impegno');
    const btnAddImpegno = document.getElementById('btn-add-impegno');
    const btnCloseModalImpegno = document.getElementById('btn-close-modal-impegno');
    const formImpegno = document.getElementById('form-impegno');
    const containerImpegni = document.getElementById('container-impegni');

    if (btnAddImpegno && modalImpegno) {
        btnAddImpegno.addEventListener('click', () => modalImpegno.classList.add('active'));
    }
    if (btnCloseModalImpegno && modalImpegno) {
        btnCloseModalImpegno.addEventListener('click', () => modalImpegno.classList.remove('active'));
    }

    if (formImpegno) {
        formImpegno.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titolo = document.getElementById('impegno-titolo').value;
            const data = document.getElementById('impegno-data').value;
            const oraInizio = document.getElementById('impegno-ora-inizio').value;
            const oraFine = document.getElementById('impegno-ora-fine').value;
            const utente = getUtenteCorrente();

            try {
                await addDoc(collection(db, "appuntamenti"), {
                    titolo: titolo,
                    data: data,
                    oraInizio: oraInizio,
                    oraFine: oraFine,
                    creatore: utente ? utente.nome : "Sconosciuto"
                });
                formImpegno.reset();
                if (modalImpegno) modalImpegno.classList.remove('active');
            } catch (error) {
                console.error("Errore salvataggio impegno:", error);
            }
        });
    }

    if (containerImpegni) {
        onSnapshot(collection(db, "appuntamenti"), (snapshot) => {
            containerImpegni.innerHTML = '';
            if (snapshot.empty) {
                containerImpegni.innerHTML = '<p class="card-meta">Nessun impegno trovato.</p>';
                return;
            }
            snapshot.forEach((docSnap) => {
                const item = docSnap.data();
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="card-title">${item.titolo || 'Senza Titolo'}</div>
                    <div class="card-meta">📅 Data: ${item.data || 'N/D'} (${item.oraInizio || ''} - ${item.oraFine || ''})</div>
                    <div class="card-meta">👤 Creato da: ${item.creatore || 'Sconosciuto'}</div>
                `;
                containerImpegni.appendChild(card);
            });
        });
    }
}
