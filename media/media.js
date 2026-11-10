import { db } from "../firebase-config.js";
import { 
    collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let listaMedia = [];

// Funzione principale di inizializzazione della sezione Foto & Video
export async function initMediaSection(container) {
    await caricaEDisegnaMedia(container);
}

async function caricaEDisegnaMedia(container) {
    const sessionUser = localStorage.getItem('sitoFamiglia_user') || 'Anonimo';
    const sessionNome = localStorage.getItem('sitoFamiglia_nome') || sessionUser;

    container.innerHTML = `
        <div class="media-container">
            <div class="media-header">
                <h2><i class="fa-solid fa-images"></i> FOTO E VIDEO</h2>
                <div class="media-actions">
                    <input type="text" id="search-media" class="search-media-input" placeholder="Cerca categoria...">
                    <button class="btn-add-media" id="btn-carica-media">
                        Carica Foto/Video
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3><i class="fa-solid fa-calendar-day"></i> Archivio Media</h3>
                </div>
                <div class="card-body">
                    <div class="media-grid-gallery" id="media-grid-gallery">
                        <p style="color: #64748b; font-size: 0.88rem;">Caricamento media in corso...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Pulsante per aprire la modale di caricamento
    const btnCarica = container.querySelector('#btn-carica-media');
    if (btnCarica) {
        btnCarica.addEventListener('click', () => apriModaleCaricamento(sessionNome));
    }

    // Input di ricerca
    const inputSearch = container.querySelector('#search-media');
    if (inputSearch) {
        inputSearch.addEventListener('input', (e) => {
            const filtro = e.target.value.toLowerCase();
            filtrzaEMostraMedia(filtro);
        });
    }

    await recuperaMediaDaFirestore();
}

async function recuperaMediaDaFirestore() {
    const gridGallery = document.getElementById('media-grid-gallery');
    if (!gridGallery) return;

    try {
        const q = query(collection(db, "media"), orderBy("dataCreazione", "desc"));
        const snapshot = await getDocs(q);
        listaMedia = [];

        snapshot.forEach(docSnap => {
            listaMedia.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        disegnaGrigliaMedia(listaMedia);

    } catch (err) {
        console.error("Errore caricamento media:", err);
        gridGallery.innerHTML = '<p style="color: #dc3545; font-size: 0.88rem;">Errore durante il caricamento dei media.</p>';
    }
}

function disegnaGrigliaMedia(arrayMedia) {
    const gridGallery = document.getElementById('media-grid-gallery');
    if (!gridGallery) return;

    if (arrayMedia.length === 0) {
        gridGallery.innerHTML = '<p style="color: #64748b; font-size: 0.88rem;">Nessun media trovato.</p>';
        return;
    }

    gridGallery.innerHTML = arrayMedia.map(m => {
        const isVideo = m.tipo === 'video' || (m.url && m.url.includes('.mp4'));
        const badgeIcon = isVideo ? '<i class="fa-solid fa-video"></i> Video' : '<i class="fa-solid fa-image"></i> Foto';
        
        const anteprimaHtml = isVideo 
            ? `<video src="${m.url}" preload="metadata"></video>` 
            : `<img src="${m.url}" alt="${m.categoria || 'Media'}">`;

        return `
            <div class="media-card-item" data-id="${m.id}">
                <div class="media-preview-box">
                    ${anteprimaHtml}
                    <span class="media-badge-type">${badgeIcon}</span>
                </div>
                <div class="media-card-info">
                    <span class="media-card-title">${m.categoria || m.titolo || 'Senza categoria'}</span>
                    <div class="media-card-footer">
                        <span>(${m.creatore || 'Anonimo'})</span>
                        <button class="btn-delete-media" data-id="${m.id}" title="Elimina">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Eventi click per eliminare
    gridGallery.querySelectorAll('.btn-delete-media').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation(); // Evita di aprire la modale di visualizzazione
            const idMedia = e.currentTarget.getAttribute('data-id');
            if (confirm("Sei sicuro di voler eliminare questo elemento?")) {
                try {
                    await deleteDoc(doc(db, "media", idMedia));
                    await recuperaMediaDaFirestore();
                } catch (err) {
                    console.error("Errore eliminazione media:", err);
                    alert("Impossibile eliminare l'elemento.");
                }
            }
        });
    });

    // Eventi click sulla card per ingrandire l'immagine/video
    gridGallery.querySelectorAll('.media-card-item').forEach(card => {
        card.addEventListener('click', (e) => {
            // Se clicca sul cestino non fa nulla
            if (e.target.closest('.btn-delete-media')) return;
            const idMedia = card.getAttribute('data-id');
            const mediaObj = listaMedia.find(m => m.id === idMedia);
            if (mediaObj) apriModaleVisualizzazione(mediaObj);
        });
    });
}

function filtrzaEMostraMedia(filtro) {
    const filtrati = listaMedia.filter(m => {
        const cat = (m.categoria || m.titolo || '').toLowerCase();
        const autore = (m.creatore || '').toLowerCase();
        return cat.includes(filtro) || autore.includes(filtro);
    });
    disegnaGrigliaMedia(filtrati);
}

// MODALE PER CARICARE UN NUOVO MEDIA
function apriModaleCaricamento(nomeUtente) {
    const modalId = 'modal-carica-media';
    const prev = document.getElementById(modalId);
    if (prev) prev.remove();

    const modalHtml = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 style="margin: 0; font-size: 1rem;"><i class="fa-solid fa-cloud-arrow-up"></i> Carica Foto o Video</h3>
                    <button class="btn-close-modal" id="btn-close-modal">&times;</button>
                </div>
                <form id="form-carica-media">
                    <div class="form-group">
                        <label for="media-url">URL Immagine / Video</label>
                        <input type="url" id="media-url" required placeholder="https://esempio.com/foto.jpg">
                    </div>
                    <div class="form-group">
                        <label for="media-categoria">Categoria / Titolo</label>
                        <input type="text" id="media-categoria" required placeholder="Es. Vacanze, Maya, Compleanno">
                    </div>
                    <div class="form-group">
                        <label for="media-tipo">Tipo</label>
                        <select id="media-tipo">
                            <option value="foto">Foto</option>
                            <option value="video">Video</option>
                        </select>
                    </div>
                    <div class="modal-buttons" style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 15px;">
                        <button type="button" class="btn-modal cancel" id="btn-cancel-modal">Annulla</button>
                        <button type="submit" class="btn-modal save">Carica</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalEl = document.getElementById(modalId);
    const chiudi = () => modalEl.remove();

    modalEl.querySelector('#btn-close-modal').addEventListener('click', chiudi);
    modalEl.querySelector('#btn-cancel-modal').addEventListener('click', chiudi);

    modalEl.querySelector('#form-carica-media').addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = document.getElementById('media-url').value.trim();
        const categoria = document.getElementById('media-categoria').value.trim();
        const tipo = document.getElementById('media-tipo').value;

        if (!url || !categoria) {
            alert("Compella tutti i campi obbligatori.");
            return;
        }

        try {
            await addDoc(collection(db, "media"), {
                url: url,
                categoria: categoria,
                tipo: tipo,
                creatore: nomeUtente,
                dataCreazione: serverTimestamp()
            });

            chiudi();
            await recuperaMediaDaFirestore();
        } catch (err) {
            console.error("Errore salvataggio media:", err);
            alert("Errore durante il salvataggio.");
        }
    });
}

// MODALE PER VISUALIZZARE L'IMMAGINE O IL VIDEO IN GRANDE
function apriModaleVisualizzazione(mediaObj) {
    const modalId = 'modal-visualizza-media';
    const prev = document.getElementById(modalId);
    if (prev) prev.remove();

    const isVideo = mediaObj.tipo === 'video' || (mediaObj.url && mediaObj.url.includes('.mp4'));
    const contenutoHtml = isVideo 
        ? `<video src="${mediaObj.url}" controls autoplay class="media-view-display" style="width:100%;"></video>` 
        : `<img src="${mediaObj.url}" alt="${mediaObj.categoria}" class="media-view-display" style="width:100%;">`;

    const modalHtml = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content" style="max-width: 550px; text-align: center;">
                <div class="modal-header">
                    <h3 style="margin: 0; font-size: 0.95rem;">${mediaObj.categoria || 'Dettaglio'} (${mediaObj.creatore || 'Anonimo'})</h3>
                    <button class="btn-close-modal" id="btn-close-modal">&times;</button>
                </div>
                <div style="margin-top: 10px; display: flex; justify-content: center; align-items: center;">
                    ${contenutoHtml}
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById(modalId);
    const chiudi = () => modalEl.remove();

    modalEl.querySelector('#btn-close-modal').addEventListener('click', chiudi);
    modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) chiudi();
    });
}
