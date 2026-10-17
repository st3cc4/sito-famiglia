// js/media.js - Gestione Galleria Foto/Video e Ultimi 5 Media per la HOME

import { db } from "./firebase-config.js";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const containerMedia = document.getElementById('container-media');
const containerHomeMedia = document.getElementById('container-home-media');
const btnAddMedia = document.getElementById('btn-add-media');

let tuttiIMedia = [];

export function initMedia(getUtenteCorrente) {
    if (btnAddMedia) {
        btnAddMedia.addEventListener('click', () => {
            const urlFile = prompt("Inserisci l'URL dell'immagine o del video:");
            const titolo = prompt("Inserisci una descrizione o un titolo per il file:");
            
            if (urlFile && titolo) {
                const utente = getUtenteCorrente();
                addDoc(collection(db, "media"), {
                    titolo,
                    url: urlFile,
                    dataCaricamento: new Date().toISOString().split('T')[0],
                    creatoDa: utente ? utente.nome : "Famiglia"
                }).catch(err => console.error("Errore salvataggio media:", err));
            }
        });
    }

    ascoltaMediaFirestore();
}

function ascoltaMediaFirestore() {
    onSnapshot(collection(db, "media"), (snapshot) => {
        tuttiIMedia = [];
        snapshot.forEach((docSnap) => {
            tuttiIMedia.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        // Ordina per data decrescente (più recenti prima)
        tuttiIMedia.sort((a, b) => new Date(b.dataCaricamento || 0) - new Date(a.dataCaricamento || 0));

        renderizzaMediaNormali();
        renderizzaMediaHomeUltime5();
    });
}

function renderizzaMediaNormali() {
    if (!containerMedia) return;
    containerMedia.innerHTML = '';

    if (tuttiIMedia.length === 0) {
        containerMedia.innerHTML = '<p style="color: #777;">Nessun file multimediale caricato.</p>';
        return;
    }

    tuttiIMedia.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'home-item-card';
        card.innerHTML = `
            <div class="item-title">${item.titolo}</div>
            <div style="margin: 8px 0; max-height: 150px; overflow: hidden; border-radius: 6px;">
                <img src="${item.url}" alt="${item.titolo}" style="width: 100%; object-fit: cover;" onerror="this.src='https://via.placeholder.com/300x150?text=Anteprima+Non+Disponibile'">
            </div>
            <div class="item-info">📅 Caricato il: ${item.dataCaricamento || 'N/D'}</div>
            <div class="item-info">👤 Da: ${item.creatoDa || 'Famiglia'}</div>
            <button type="button" class="cancel-btn" style="margin-top: 8px; padding: 6px 12px; font-size: 0.85rem;" data-id="${item.id}">Elimina</button>
        `;

        card.querySelector('button').addEventListener('click', async () => {
            if (confirm(`Vuoi eliminare il file "${item.titolo}"?`)) {
                try {
                    await deleteDoc(doc(db, "media", item.id));
                } catch (err) {
                    console.error("Errore eliminazione media:", err);
                }
            }
        });

        containerMedia.appendChild(card);
    });
}

// Mostra gli ultimi 5 media caricati nella HOME
function renderizzaMediaHomeUltime5() {
    if (!containerHomeMedia) return;
    containerHomeMedia.innerHTML = '';

    if (tuttiIMedia.length === 0) {
        containerHomeMedia.innerHTML = '<p style="color: #777; font-size: 0.9rem;">Nessun media recente.</p>';
        return;
    }

    const ultimi5 = tuttiIMedia.slice(0, 5);

    ultimi5.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'home-item-card';
        card.style.borderLeftColor = '#9b59b6';

        card.innerHTML = `
            <div class="item-title">${item.titolo}</div>
            <div class="item-info">📅 ${item.dataCaricamento || 'N/D'} - 👤 ${item.creatoDa || 'Famiglia'}</div>
        `;

        containerHomeMedia.appendChild(card);
    });
}
