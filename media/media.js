// --- Import SDK di Firebase ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, collection, getDocs, addDoc, doc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAtMnKhhfC43J73kVm8-QcNghqzOTV6UKA",
    authDomain: "sito-famiglia.firebaseapp.com",
    projectId: "sito-famiglia",
    storageBucket: "sito-famiglia.appspot.com",
    messagingSenderId: "93216467751",
    appId: "1:93216467751:web:9930052845521ca5ef895a",
    measurementId: "G-NYRQJDTWM3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let utentiCollezioni = {};
let listaMedia = [];

export async function initMediaSection(container) {
    await caricaUtenti();
    await caricaEDisegnaMedia(container);
}

// Carica utenti e relativi colori
async function caricaUtenti() {
    try {
        const utentiSnapshot = await getDocs(collection(db, "utenti"));
        utentiCollezioni = {};
        utentiSnapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data.nome) {
                utentiCollezioni[data.nome.toLowerCase()] = data.colore || '#3498db';
            }
        });
    } catch (e) {
        console.error("Errore caricamento utenti:", e);
    }
}

// Convertitore colore HEX -> RGBA Trasparente
function hexToRgba(hex, alpha = 0.12) {
    if (!hex) return `rgba(52, 152, 219, ${alpha})`;
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(char => char + char).join('');
    const num = parseInt(c, 16);
    if (isNaN(num)) return `rgba(52, 152, 219, ${alpha})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Carica da Firestore e disegna i media
async function caricaEDisegnaMedia(container) {
    container.innerHTML = `
        <div class="media-container">
            <div class="media-header">
                <h2><i class="fa-solid fa-photo-film"></i> FOTO & VIDEO DI FAMIGLIA</h2>
                <div class="media-actions">
                    <input type="text" id="search-media" class="search-media-input" placeholder="Cerca foto o video...">
                    <button class="btn-add-media" id="btn-nuovo-media">
                        <i class="fa-solid fa-circle-plus"></i> Aggiungi Foto/Video
                    </button>
                </div>
            </div>

            <div class="media-grid-gallery" id="media-grid-container">
                <p style="color: #64748b; padding: 20px;">Caricamento galleria in corso...</p>
            </div>
        </div>
    `;

    document.getElementById('btn-nuovo-media').addEventListener('click', () => {
        apriModaleFormMedia();
    });

    const searchInput = document.getElementById('search-media');
    searchInput.addEventListener('input', (e) => {
        const queryStr = e.target.value.toLowerCase().trim();
        renderGrigliaMedia(queryStr);
    });

    try {
        const mediaSnapshot = await getDocs(collection(db, "media"));
        listaMedia = [];

        mediaSnapshot.forEach(docSnap => {
            listaMedia.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        // Se non ci sono media su Firestore, usiamo foto dimostrative di base
        if (listaMedia.length === 0) {
            listaMedia = [
                { id: 'm1', titolo: 'Vacanze al mare', url: 'https://picsum.photos/seed/fam1/800/600', tipo: 'foto', album: 'Vacanze', creatore: 'Paolo' },
                { id: 'm2', titolo: 'Compleanno in famiglia', url: 'https://picsum.photos/seed/fam2/800/600', tipo: 'foto', album: 'Feste', creatore: 'Elena' },
                { id: 'm3', titolo: 'Gita in montagna', url: 'https://picsum.photos/seed/fam3/800/600', tipo: 'foto', album: 'Gite', creatore: 'Paolo' },
                { id: 'm4', titolo: 'Cena domenicale', url: 'https://picsum.photos/seed/fam4/800/600', tipo: 'foto', album: 'Cene', creatore: 'Elena' }
            ];
        }

        renderGrigliaMedia('');

    } catch (err) {
        console.error("Errore caricamento media:", err);
        document.getElementById('media-grid-container').innerHTML = '<p style="color:red;">Errore durante il caricamento della galleria.</p>';
    }
}

function renderGrigliaMedia(filtro) {
    const gridEl = document.getElementById('media-grid-container');
    if (!gridEl) return;

    const mediaFiltrati = listaMedia.filter(m => {
        const tit = (m.titolo || '').toLowerCase();
        const alb = (m.album || '').toLowerCase();
        return tit.includes(filtro) || alb.includes(filtro);
    });

    if (mediaFiltrati.length === 0) {
        gridEl.innerHTML = '<p style="color:#94a3b8; font-style:italic;">Nessun contenuto multimediale trovato.</p>';
        return;
    }

    gridEl.innerHTML = mediaFiltrati.map(m => {
        const creatore = m.creatore || 'Utente';
        const coloreUtente = utentiCollezioni[creatore.toLowerCase()] || '#3498db';
        const bgTrasparente = hexToRgba(coloreUtente, 0.12);
        const isVideo = m.tipo === 'video';

        return `
            <div class="media-card-item" data-id="${m.id}" style="background-color: ${bgTrasparente}; border-left-color: ${coloreUtente};">
                <div class="media-preview-box">
                    ${isVideo 
                        ? `<video src="${m.url}" preload="metadata"></video><span class="media-badge-type"><i class="fa-solid fa-play"></i> Video</span>`
                        : `<img src="${m.url}" alt="${m.titolo}" loading="lazy"><span class="media-badge-type"><i class="fa-solid fa-image"></i> Foto</span>`
                    }
                </div>
                <div class="media-card-info">
                    <span class="media-card-title">${m.titolo || 'Senza titolo'}</span>
                    <div class="media-card-footer">
                        <span>(${creatore}) • ${m.album || 'Generale'}</span>
                        <button class="btn-delete-media" title="Elimina" data-id="${m.id}">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    gridEl.querySelectorAll('.media-card-item').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-delete-media')) return;
            const idM = card.getAttribute('data-id');
            const mediaObj = listaMedia.find(m => m.id === idM);
            if (mediaObj) apriModaleVisualizzaMedia(mediaObj);
        });
    });

    gridEl.querySelectorAll('.btn-delete-media').forEach(btnDel => {
        btnDel.addEventListener('click', async (e) => {
            e.stopPropagation();
            const idM = btnDel.getAttribute('data-id');
            if (confirm("Sei sicuro di voler eliminare questo contenuto?")) {
                try {
                    await deleteDoc(doc(db, "media", idM));
                    const contentArea = document.getElementById('content-area');
                    await caricaEDisegnaMedia(contentArea);
                } catch (err) {
                    console.error("Errore cancellazione media:", err);
                    alert("Impossibile eliminare il contenuto.");
                }
            }
        });
    });
}

// MODALE DI VISUALIZZAZIONE FULL SCREEN / INGRANDITA
function apriModaleVisualizzaMedia(m) {
    const modalId = 'modal-view-media';
    const prevModal = document.getElementById(modalId);
    if (prevModal) prevModal.remove();

    const isVideo = m.tipo === 'video';

    const modalHtml = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content" style="max-width: 750px; text-align: center;">
                <div class="modal-header">
                    <div>
                        <h3 style="margin-bottom: 2px;">${m.titolo || 'Dettaglio Media'}</h3>
                        <span style="font-size: 0.8rem; color: #64748b;">Caricato da ${m.creatore || 'Utente'} • Album: ${m.album || 'Generale'}</span>
                    </div>
                    <button class="btn-close-modal" id="btn-close-view-media">&times;</button>
                </div>
                
                <div class="media-view-box">
                    ${isVideo 
                        ? `<video src="${m.url}" controls autoplay class="media-view-display"></video>`
                        : `<img src="${m.url}" alt="${m.titolo}" class="media-view-display">`
                    }
                </div>

                <div class="modal-footer" style="margin-top: 15px; display: flex; justify-content: flex-end;">
                    <button type="button" class="btn-modal cancel" id="btn-close-view-media-footer">Chiudi</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalEl = document.getElementById(modalId);
    document.getElementById('btn-close-view-media').addEventListener('click', () => modalEl.remove());
    document.getElementById('btn-close-view-media-footer').addEventListener('click', () => modalEl.remove());
}

// MODALE DI INSERIMENTO NUOVO MEDIA
function apriModaleFormMedia() {
    const savedUser = localStorage.getItem('famiglia_pwa_user') || sessionStorage.getItem('famiglia_pwa_user');
    const userData = savedUser ? JSON.parse(savedUser) : { nome: 'Utente' };

    const modalId = 'modal-form-media';
    const prevModal = document.getElementById(modalId);
    if (prevModal) prevModal.remove();

    const modalHtml = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>Aggiungi Foto o Video</h3>
                    <button class="btn-close-modal" id="btn-close-form-media">&times;</button>
                </div>
                <form id="form-media">
                    <div class="form-group">
                        <label for="med-titolo">Titolo / Descrizione</label>
                        <input type="text" id="med-titolo" required placeholder="Es. Vacanze estive 2026">
                    </div>

                    <div style="display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap;">
                        <div class="form-group" style="flex: 1; min-width: 130px; margin-bottom: 0;">
                            <label for="med-tipo">Tipo Contenuto</label>
                            <select id="med-tipo">
                                <option value="foto">Foto</option>
                                <option value="video">Video</option>
                            </select>
                        </div>
                        <div class="form-group" style="flex: 1; min-width: 150px; margin-bottom: 0;">
                            <label for="med-album">Album / Categoria</label>
                            <input type="text" id="med-album" placeholder="Es. Vacanze, Compleanni..." value="Generale">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="med-url">URL Immagine o Video</label>
                        <input type="url" id="med-url" required placeholder="Incolla l'indirizzo web dell'immagine o del video">
                    </div>

                    <div class="modal-footer" style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 8px;">
                        <button type="button" class="btn-modal cancel" id="btn-cancel-media">Annulla</button>
                        <button type="submit" class="btn-modal save">Salva Contenuto</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalEl = document.getElementById(modalId);
    const btnClose = document.getElementById('btn-close-form-media');
    const btnCancel = document.getElementById('btn-cancel-media');
    const form = document.getElementById('form-media');

    const chiudiModale = () => modalEl.remove();

    btnClose.addEventListener('click', chiudiModale);
    btnCancel.addEventListener('click', chiudiModale);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const titolo = document.getElementById('med-titolo').value.trim();
        const tipo = document.getElementById('med-tipo').value;
        const album = document.getElementById('med-album').value.trim() || 'Generale';
        const url = document.getElementById('med-url').value.trim();

        if (!titolo || !url) {
            alert("Compila tutti i campi richiesti.");
            return;
        }

        const payload = {
            titolo: titolo,
            tipo: tipo,
            album: album,
            url: url,
            creatore: userData.nome,
            dataCreazione: new Date().toISOString()
        };

        try {
            await addDoc(collection(db, "media"), payload);
            chiudiModale();
            const contentArea = document.getElementById('content-area');
            await caricaEDisegnaMedia(contentArea);

        } catch (err) {
            console.error("Errore salvataggio media:", err);
            alert("Si è verificato un errore durante il salvataggio.");
        }
    });
}
