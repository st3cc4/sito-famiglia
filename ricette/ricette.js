import { 
    collection, 
    getDocs, 
    addDoc, 
    deleteDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "../firebase-config.js";
import { nomeUtenteCorrente, idUtenteCorrenteId } from "../auth.js";

export async function caricaMedia() {
    const containerMedia = document.getElementById('lista-media');
    if (!containerMedia) return;

    try {
        const querySnapshot = await getDocs(collection(db, "media"));
        let mediaItems = [];
        querySnapshot.forEach((docSnap) => {
            mediaItems.push({ id: docSnap.id, ...docSnap.data() });
        });

        let html = "";
        mediaItems.forEach((item) => {
            const creatoreNome = item.creatore || '';

            html += `
                <div style="background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <div>
                        <strong style="font-size: 1.05rem; color: #1e293b; display: block; margin-bottom: 2px;">${escapeHtml(item.titolo || 'Media')}</strong>
                        <a href="${escapeHtml(item.url)}" target="_blank" style="font-size: 0.9rem; color: #3b82f6; text-decoration: underline; word-break: break-all;">Apri link</a>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        ${creatoreNome ? `<span style="font-size: 0.85rem; font-weight: 600; color: #64748b;">(${escapeHtml(creatoreNome)})</span>` : ''}
                        <button onclick="eliminaMedia('${item.id}')" style="background: none; border: none; cursor: pointer; font-size: 1rem;" title="Elimina">🗑️</button>
                    </div>
                </div>
            `;
        });

        containerMedia.innerHTML = html || `<p class="text-muted" style="font-style: italic; color: #64748b;">Nessun elemento media registrato.</p>`;

    } catch (err) {
        console.error("Errore caricamento media:", err);
    }
}

// Gestione aggiunta nuovo media da form
const formNuovoMedia = document.getElementById('form-nuovo-media');
if (formNuovoMedia) {
    formNuovoMedia.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titoloInput = document.getElementById('media-titolo');
        const urlInput = document.getElementById('media-url');

        if (!titoloInput || !urlInput) return;

        try {
            await addDoc(collection(db, "media"), {
                titolo: titoloInput.value.trim(),
                url: urlInput.value.trim(),
                creatore: nomeUtenteCorrente || 'Famiglia',
                creatoreId: idUtenteCorrenteId || ''
            });

            formNuovoMedia.reset();
            caricaMedia();
            if (window.caricaSummaryMediaHome) window.caricaSummaryMediaHome();
        } catch (err) {
            console.error("Errore salvataggio media:", err);
            alert("Errore durante il salvataggio del media.");
        }
    });
}

// Funzione globale per eliminare il media
window.eliminaMedia = async function(id) {
    if (!confirm("Vuoi davvero eliminare questo elemento media?")) return;
    try {
        await deleteDoc(doc(db, "media", id));
        caricaMedia();
        if (window.caricaSummaryMediaHome) window.caricaSummaryMediaHome();
    } catch (err) {
        console.error("Errore eliminazione media:", err);
        alert("Impossibile eliminare il media.");
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

window.caricaMedia = caricaMedia;
