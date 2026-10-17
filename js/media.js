// js/media.js - Gestione Galleria Foto/Video e Anteprima Home

import { db } from "./firebase-config.js";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { mostraSezione } from "./navigation.js";

const containerMedia = document.getElementById('container-media');
const containerHomeMedia = document.getElementById('container-home-media');
const btnAddMedia = document.getElementById('btn-add-media');

let tuttiIMedia = [];

export function initMedia(getUtenteCorrente) {
    if (btnAddMedia) {
        btnAddMedia.addEventListener('click', () => {
            const url = prompt("Inserisci l'URL dell'immagine o del video:");
            if (!url) return;

            const utente = getUtenteCorrente();
            if (!utente) return;

            const tipo = url.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'immagine';

            addDoc(collection(db, "media"), {
                url: url.trim(),
                tipo,
                creatoDa: utente.nome,
                creatoDaId: utente.id,
                dataCaricamento: new Date().toISOString()
            }).catch(err => console.error("Errore salvataggio media:", err));
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

        renderizzaMedia();
        renderizzaMediaHome();
    });
}

function renderizzaMediaHome() {
    if (!containerHomeMedia) return;
    containerHomeMedia.innerHTML = '';

    if (tuttiIMedia.length === 0) {
        containerHomeMedia.innerHTML = '<p style="color: #777; font-size: 0.95rem; font-weight: bold; margin: 0;">Nessun media recente.</p>';
        return;
    }

    // Prende gli ultimi 2 media caricati
    const ultimiMedia = tuttiIMedia.slice(-2).reverse();

    const gridHome = document.createElement('div');
    gridHome.style.display = 'grid';
    gridHome.style.gridTemplateColumns = 'repeat(auto-fit, minmax(100px, 1fr))';
    gridHome.style.gap = '10px';

    ultimiMedia.forEach(item => {
        const itemBox = document.createElement('div');
        itemBox.style.borderRadius = '8px';
        itemBox.style.overflow = 'hidden';
        itemBox.style.height = '90px';
        itemBox.style.backgroundColor = '#eee';

        if (item.tipo === 'video') {
            itemBox.innerHTML = `
                <video src="${item.url}" style="width: 100%; height: 100%; object-fit: cover;"></video>
            `;
        } else {
            itemBox.innerHTML = `
                <img src="${item.url}" alt="Foto" style="width: 100%; height: 100%; object-fit: cover;">
            `;
        }

        gridHome.appendChild(itemBox);
    });

    containerHomeMedia.appendChild(gridHome);
}

function renderizzaMedia() {
    if (!containerMedia) return;
    containerMedia.innerHTML = '';

    const sectionMedia = document.getElementById('section-media');
    let sectionHeader = sectionMedia ? sectionMedia.querySelector('.section-header') : null;

    if (sectionHeader) {
        sectionHeader.innerHTML = `
            <button id="btn-torna-home-media" class="cancel-btn" style="padding: 10px 16px; font-weight: bold; cursor: pointer; border-radius: 8px;">← Torna alla Home</button>
            <button id="btn-add-media-custom" class="add-btn" style="padding: 10px 18px; font-weight: bold; cursor: pointer; border-radius: 8px;">+ Carica File</button>
        `;

        document.getElementById('btn-torna-home-media').addEventListener('click', () => {
            mostraSezione('home');
        });

        document.getElementById('btn-add-media-custom').addEventListener('click', () => {
            if (btnAddMedia) btnAddMedia.click();
        });
    }

    containerMedia.style.display = 'grid';
    containerMedia.style.gridTemplateColumns = 'repeat(auto-fill, minmax(160px, 1fr))';
    containerMedia.style.gap = '15px';
    containerMedia.style.marginTop = '20px';

    if (tuttiIMedia.length === 0) {
        containerMedia.innerHTML = '<p style="color: #777; font-size: 1.1rem; font-weight: bold;">Nessun file presente in galleria.</p>';
        return;
    }

    tuttiIMedia.forEach((item) => {
        const card = document.createElement('div');
        card.style.backgroundColor = '#ffffff';
        card.style.borderRadius = '12px';
        card.style.overflow = 'hidden';
        card.style.boxShadow = '0 4px 10px rgba(0,0,0,0.08)';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';

        let previewHtml = '';
        if (item.tipo === 'video') {
            previewHtml = `<video src="${item.url}" controls style="width: 100%; height: 160px; object-fit: cover;"></video>`;
        } else {
            previewHtml = `<img src="${item.url}" alt="Foto" style="width: 100%; height: 160px; object-fit: cover;">`;
        }

        card.innerHTML = `
            ${previewHtml}
            <div style="padding: 10px; display: flex; justify-content: space-between; align-items: center; background-color: #f9f9f9;">
                <span style="font-size: 0.85rem; font-weight: bold; color: #555;">👤 ${item.creatoDa || 'Famiglia'}</span>
                <button type="button" class="btn-del-media" style="background-color: #e74c3c; color: white; border: none; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 0.8rem; cursor: pointer;" data-id="${item.id}">Elimina</button>
            </div>
        `;

        card.querySelector('.btn-del-media').addEventListener('click', async () => {
            if (confirm("Vuoi eliminare questo file dalla galleria?")) {
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
