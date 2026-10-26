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
let categorieEsistenti = [];

export async function initMediaSection(container) {
    await caricaUtenti();
    await caricaEDisegnaMedia(container);
}

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

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formattaDataLeggibile(dataIsoStr) {
    if (!dataIsoStr) return 'Data non specificata';
    try {
        const d = new Date(dataIsoStr);
        if (isNaN(d.getTime())) return dataIsoStr.split('T')[0];
        
        const options = { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' };
        let formatted = d.toLocaleDateString('it-IT', options);
        return capitalize(formatted);
    } catch (e) {
        return dataIsoStr;
    }
}

function comprimiImmagine(file, maxWidth = 1200, maxHeight = 1200, qualita = 0.7) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrlCompressed = canvas.toDataURL('image/jpeg', qualita);
                resolve(dataUrlCompressed);
            };
        };
    });
}

async function caricaEDisegnaMedia(container) {
    container.innerHTML = `
        <div class="media-container">
            <div class="section-header-actions" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                <div class="header-left-group" style="display: flex; align-items: center; gap: 12px;">
                    <button id="btn-torna-home" class="btn-outline" title="Torna alla Home">
                        <i class="fa-solid fa-arrow-left"></i> Home
                    </button>
                    <h2 style="margin: 0;"><i class="fa-solid fa-photo-film"></i> FOTO E VIDEO</h2>
                </div>
                <div class="media-actions" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                    <input type="text" id="search-media" class="search-media-input" placeholder="Cerca categoria...">
                    <button class="btn-add-media btn-primary" id="btn-nuovo-media">
                        <i class="fa-solid fa-circle-plus"></i> Carica Foto/Video
                    </button>
                </div>
            </div>

            <div id="media-gruppi-container" style="display: flex; flex-direction: column; gap: 20px;">
                <p style="color: #64748b; padding: 20px;">Caricamento in corso...</p>
            </div>
        </div>
    `;

    // Pulsante Torna alla Home
    const btnTornaHome = container.querySelector('#btn-torna-home');
    if (btnTornaHome) {
        btnTornaHome.addEventListener('click', () => {
            if (typeof window.selezionaScheda === 'function') {
                window.selezionaScheda('dashboard');
            }
        });
    }

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
        const catMap = new Set();

        mediaSnapshot.forEach(docSnap => {
            const data = docSnap.data();
            const cat = capitalize(data.categoria || data.album || 'Generale');
            catMap.add(cat);
            
            listaMedia.push({
                id: docSnap.id,
                ...data,
                categoria: cat,
                dataCreazione: data.dataCreazione || new Date().toISOString()
            });
        });

        // Ordina dal più recente al meno recente
        listaMedia.sort((a, b) => new Date(b.dataCreazione) - new Date(a.dataCreazione));

        categorieEsistenti = Array.from(catMap).sort();
        renderGrigliaMedia('');

    } catch (err) {
        console.error("Errore caricamento media:", err);
        document.getElementById('media-gruppi-container').innerHTML = '<p style="color:red;">Errore durante il caricamento dei file.</p>';
    }
}

function renderGrigliaMedia(filtro) {
    const gruppiContainer = document.getElementById('media-gruppi-container');
    if (!gruppiContainer) return;

    const mediaFiltrati = listaMedia.filter(m => {
        const cat = (m.categoria || '').toLowerCase();
        return cat.includes(filtro);
    });

    if (mediaFiltrati.length === 0) {
        gruppiContainer.innerHTML = '<p style="color:#94a3b8; font-style:italic; padding: 10px;">Nessun file presente.</p>';
        return;
    }

    // Raggruppa i media per data (YYYY-MM-DD estratta da dataCreazione)
    const gruppiPerData = {};
    mediaFiltrati.forEach(m => {
        let dataIsoKey = 'Altro';
        if (m.dataCreazione) {
            dataIsoKey = m.dataCreazione.split('T')[0];
        }
        if (!gruppiPerData[dataIsoKey]) {
            gruppiPerData[dataIsoKey] = [];
        }
        gruppiPerData[dataIsoKey].push(m);
    });

    // Ordina le date in modo discendente (più recenti prima)
    const dateOrdinate = Object.keys(gruppiPerData).sort((a, b) => b.localeCompare(a));

    let htmlGruppi = '';

    dateOrdinate.forEach(dataKey => {
        const elementiDelGiorno = gruppiPerData[dataKey];
        const titoloDataLeggibile = dataKey === 'Altro' ? 'Altro' : formattaDataLeggibile(dataKey);

        htmlGruppi += `
            <div class="card" style="margin-bottom: 0;">
                <div class="card-header">
                    <h3><i class="fa-regular fa-calendar"></i> ${titoloDataLeggibile}</h3>
                </div>
                <div class="card-body">
                    <div class="media-grid-gallery">
                        ${elementiDelGiorno.map(m => {
                            const creatore = m.creatore || 'Utente';
                            const coloreUtente = utentiCollezioni[creatore.toLowerCase()] || '#3498db';
                            const bgTrasparente = hexToRgba(coloreUtente, 0.12);
                            const isVideo = m.tipo === 'video' || (m.url && m.url.startsWith('data:video/'));

                            return `
                                <div class="media-card-item" data-id="${m.id}" style="background-color: ${bgTrasparente}; border-left-color: ${coloreUtente};">
                                    <div class="media-preview-box">
                                        ${isVideo 
                                            ? `<video src="${m.url}" preload="metadata"></video><span class="media-badge-type"><i class="fa-solid fa-play"></i> Video</span>`
                                            : `<img src="${m.url}" alt="${m.categoria}" loading="lazy"><span class="media-badge-type"><i class="fa-solid fa-image"></i> Foto</span>`
                                        }
                                    </div>
                                    <div class="media-card-info">
                                        <span class="media-card-title">${m.categoria}</span>
                                        <div class="media-card-footer">
                                            <span>(${creatore})</span>
                                            <button class="btn-delete-media" title="Elimina" data-id="${m.id}">
                                                <i class="fa-solid fa-trash-can"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    });

    gruppiContainer.innerHTML = htmlGruppi;

    // Eventi click sulle card per visualizzare il media
    gruppiContainer.querySelectorAll('.media-card-item').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-delete-media')) return;
            const idM = card.getAttribute('data-id');
            const mediaObj = listaMedia.find(m => m.id === idM);
            if (mediaObj) apriModaleVisualizzaMedia(mediaObj);
        });
    });

    // Eventi eliminazione media
    gruppiContainer.querySelectorAll('.btn-delete-media').forEach(btnDel => {
        btnDel.addEventListener('click', async (e) => {
            e.stopPropagation();
            const idM = btnDel.getAttribute('data-id');
            if (confirm("Sei sicuro di voler eliminare questo file?")) {
                try {
                    await deleteDoc(doc(db, "media", idM));
                    const contentArea = document.getElementById('content-area');
                    await caricaEDisegnaMedia(contentArea);
                } catch (err) {
                    console.error("Errore cancellazione media:", err);
                    alert("Impossibile eliminare il file.");
                }
            }
        });
    });
}

function apriModaleVisualizzaMedia(m) {
    const modalId = 'modal-view-media';
    const prevModal = document.getElementById(modalId);
    if (prevModal) prevModal.remove();

    const isVideo = m.tipo === 'video' || (m.url && m.url.startsWith('data:video/'));

    const modalHtml = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content" style="max-width: 750px; text-align: center;">
                <div class="modal-header">
                    <div>
                        <h3 style="margin-bottom: 2px;">${m.categoria}</h3>
                        <span style="font-size: 0.8rem; color: #64748b;">Caricato da ${m.creatore || 'Utente'}</span>
                    </div>
                    <button class="btn-close-modal" id="btn-close-view-media">&times;</button>
                </div>
                
                <div class="media-view-box">
                    ${isVideo 
                        ? `<video src="${m.url}" controls autoplay class="media-view-display"></video>`
                        : `<img src="${m.url}" alt="${m.categoria}" class="media-view-display">`
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

function apriModaleFormMedia() {
    const savedUser = localStorage.getItem('famiglia_session') || sessionStorage.getItem('famiglia_session');
    const userData = savedUser ? JSON.parse(savedUser) : { nome: 'Utente' };

    const modalId = 'modal-form-media';
    const prevModal = document.getElementById(modalId);
    if (prevModal) prevModal.remove();

    const optionsCat = categorieEsistenti.map(c => `<option value="${c}">${c}</option>`).join('');

    const modalHtml = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>Carica Foto o Video</h3>
                    <button class="btn-close-modal" id="btn-close-form-media">&times;</button>
                </div>
                <form id="form-media">
                    <div class="form-group">
                        <label for="med-cat-select">Categoria / Album</label>
                        <select id="med-cat-select">
                            ${optionsCat}
                            <option value="__NUOVA__">+ Crea Nuova Categoria...</option>
                        </select>
                    </div>

                    <div class="form-group" id="group-nuova-cat" style="display: ${categorieEsistenti.length === 0 ? 'block' : 'none'};">
                        <label for="med-nuova-cat">Nome Nuova Categoria</label>
                        <input type="text" id="med-nuova-cat" placeholder="Es. Vacanze, Feste..." value="${categorieEsistenti.length === 0 ? 'Generale' : ''}">
                    </div>

                    <div class="form-group">
                        <label>Seleziona Foto o Video dal Dispositivo</label>
                        <div class="file-upload-box" id="box-file-upload">
                            <i class="fa-solid fa-cloud-arrow-up file-upload-icon"></i>
                            <div class="file-upload-text" id="txt-file-selected">Tocca qui per scegliere foto o video</div>
                            <input type="file" id="input-file-native" accept="image/*,video/*" required style="display: none;">
                        </div>
                    </div>

                    <div class="modal-footer" style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 8px;">
                        <button type="button" class="btn-modal cancel" id="btn-cancel-media">Annulla</button>
                        <button type="submit" class="btn-modal save" id="btn-save-media">Salva</button>
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

    const catSelect = document.getElementById('med-cat-select');
    const groupNuovaCat = document.getElementById('group-nuova-cat');
    const boxUpload = document.getElementById('box-file-upload');
    const inputFile = document.getElementById('input-file-native');
    const txtFileSelected = document.getElementById('txt-file-selected');
    const btnSave = document.getElementById('btn-save-media');

    let fileDataFormatted = '';
    let fileTipo = 'foto';

    catSelect.addEventListener('change', () => {
        if (catSelect.value === '__NUOVA__') {
            groupNuovaCat.style.display = 'block';
        } else {
            groupNuovaCat.style.display = 'none';
        }
    });

    boxUpload.addEventListener('click', () => inputFile.click());

    inputFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        txtFileSelected.textContent = `Ottimizzazione: ${file.name}...`;
        fileTipo = file.type.startsWith('video/') ? 'video' : 'foto';

        if (fileTipo === 'foto') {
            fileDataFormatted = await comprimiImmagine(file);
            txtFileSelected.textContent = `Pronto: ${file.name}`;
        } else {
            const reader = new FileReader();
            reader.onload = (event) => {
                fileDataFormatted = event.target.result;
                txtFileSelected.textContent = `Pronto: ${file.name}`;
            };
            reader.readAsDataURL(file);
        }
    });

    const chiudiModale = () => modalEl.remove();

    btnClose.addEventListener('click', chiudiModale);
    btnCancel.addEventListener('click', chiudiModale);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        let categoria = '';
        if (catSelect.value === '__NUOVA__' || categorieEsistenti.length === 0) {
            categoria = capitalize(document.getElementById('med-nuova-cat').value.trim());
        } else {
            categoria = catSelect.value;
        }

        if (!categoria || !fileDataFormatted) {
            alert("Seleziona prima una foto o video dal dispositivo.");
            return;
        }

        btnSave.disabled = true;
        btnSave.textContent = 'Salvataggio...';

        const payload = {
            categoria: categoria,
            tipo: fileTipo,
            url: fileDataFormatted,
            creatore: userData.nome || 'Utente',
            dataCreazione: new Date().toISOString()
        };

        try {
            await addDoc(collection(db, "media"), payload);

            // Invia notifica di nuovo contenuto multimediale caricato
            if (typeof window.inviaNotificaFamiglia === 'function') {
                window.inviaNotificaFamiglia(
                    "📷 Nuovo Contenuto Multimediale",
                    `${userData.nome || 'Un utente'} ha caricato un nuovo file (${fileTipo}) nell'album "${categoria}".`
                );
            }

            chiudiModale();
            const contentArea = document.getElementById('content-area');
            await caricaEDisegnaMedia(contentArea);

        } catch (err) {
            console.error("Errore salvataggio media:", err);
            alert("Si è verificato un errore durante il salvataggio.");
            btnSave.disabled = false;
            btnSave.textContent = 'Salva';
        }
    });
}
