import { 
    collection, 
    getDocs, 
    addDoc, 
    deleteDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "../firebase-config.js";
import { nomeUtenteCorrente } from "../auth.js";

export async function caricaMedia() {
    const mediaContainer = document.getElementById('lista-media');
    const mediaSection = document.getElementById('media-section');

    if (!mediaSection) return;

    // Aggiorniamo l'intestazione H2 della sezione in "FOTO e VIDEO"
    const h2Title = mediaSection.querySelector('h2');
    if (h2Title) {
        h2Title.textContent = "FOTO e VIDEO";
    }

    if (!mediaContainer) return;

    try {
        const querySnapshot = await getDocs(collection(db, "media"));
        let mediaItems = [];

        querySnapshot.forEach((docSnap) => {
            mediaItems.push({ id: docSnap.id, ...docSnap.data() });
        });

        mediaContainer.innerHTML = '';

        if (mediaItems.length === 0) {
            mediaContainer.innerHTML = '<p class="text-muted" style="color: #64748b; font-style: italic;">Nessun elemento presente.</p>';
            return;
        }

        mediaItems.forEach((item) => {
            const divMedia = document.createElement('div');
            divMedia.style.cssText = "background: #ffffff; padding: 14px; border-radius: 10px; margin-bottom: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 8px;";

            const eMia = (item.creatore || "").toLowerCase() === (nomeUtenteCorrente || "").toLowerCase();

            divMedia.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="font-size: 1.05rem; color: #1e293b;">${escapeHtml(item.titolo || 'Senza titolo')}</strong>
                    <span style="font-size: 0.8rem; background: #e2e8f0; padding: 2px 8px; border-radius: 4px; color: #475569;">${escapeHtml(item.tipo || 'Media')}</span>
                </div>
                ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" style="color: #0284c7; font-weight: 600; text-decoration: none; font-size: 0.9rem;">Guarda Elemento →</a>` : ''}
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                    <span style="font-size: 0.8rem; color: #64748b;">Caricato da: ${escapeHtml(item.creatore || 'Utente')}</span>
                    ${eMia ? `<button onclick="eliminaMedia('${item.id}')" style="background-color: #ef4444; color: white; border: none; padding: 4px 10px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.8rem;" title="Elimina">🗑️</button>` : ''}
                </div>
            `;

            mediaContainer.appendChild(divMedia);
        });

    } catch (err) {
        console.error("Errore caricamento media:", err);
    }
}

window.eliminaMedia = async function(id) {
    if (confirm("Vuoi eliminare questo elemento foto/video?")) {
        try {
            await deleteDoc(doc(db, "media", id));
            caricaMedia();
        } catch (err) {
            alert("Errore durante l'eliminazione.");
        }
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
