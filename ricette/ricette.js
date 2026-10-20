// --- Import SDK di Firebase ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc 
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
let listaRicette = [];

export async function initRicetteSection(container) {
    await caricaUtenti();
    await caricaEDisegnaRicette(container);
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

// Carica da Firestore e disegna le ricette
async function caricaEDisegnaRicette(container) {
    container.innerHTML = `
        <div class="ricette-container">
            <div class="ricette-header">
                <h2><i class="fa-solid fa-utensils"></i> RICETTARIO DI FAMIGLIA</h2>
                <div class="ricette-actions">
                    <input type="text" id="search-ricette" class="search-ricette-input" placeholder="Cerca ricetta...">
                    <button class="btn-add-ricetta" id="btn-nuova-ricetta">
                        <i class="fa-solid fa-circle-plus"></i> Nuova Ricetta
                    </button>
                </div>
            </div>

            <div class="ricette-grid-main" id="ricette-grid-container">
                <p style="color: #64748b; padding: 20px;">Caricamento ricette in corso...</p>
            </div>
        </div>
    `;

    document.getElementById('btn-nuova-ricetta').addEventListener('click', () => {
        apriModaleFormRicetta();
    });

    const searchInput = document.getElementById('search-ricette');
    searchInput.addEventListener('input', (e) => {
        const queryStr = e.target.value.toLowerCase().trim();
        renderGrigliaRicette(queryStr);
    });

    try {
        const ricetteSnapshot = await getDocs(collection(db, "ricette"));
        listaRicette = [];

        ricetteSnapshot.forEach(docSnap => {
            listaRicette.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        // Ordina per valutazione decrescente
        listaRicette.sort((a, b) => Number(b.valutazione || 5) - Number(a.valutazione || 5));

        renderGrigliaRicette('');

    } catch (err) {
        console.error("Errore caricamento ricette:", err);
        document.getElementById('ricette-grid-container').innerHTML = '<p style="color:red;">Errore durante il caricamento delle ricette.</p>';
    }
}

function renderGrigliaRicette(filtro) {
    const gridEl = document.getElementById('ricette-grid-container');
    if (!gridEl) return;

    const ricetteFiltrate = listaRicette.filter(r => {
        const titolo = (r.nome || r.titolo || '').toLowerCase();
        const cat = (r.categoria || '').toLowerCase();
        return titolo.includes(filtro) || cat.includes(filtro);
    });

    if (ricetteFiltrate.length === 0) {
        gridEl.innerHTML = '<p style="color:#94a3b8; font-style:italic;">Nessuna ricetta trovata.</p>';
        return;
    }

    gridEl.innerHTML = ricetteFiltrate.map(r => {
        const creatore = r.creatore || 'Utente';
        const coloreUtente = utentiCollezioni[creatore.toLowerCase()] || '#3498db';
        const bgTrasparente = hexToRgba(coloreUtente, 0.12);
        
        const valNum = Number(r.valutazione || 5);
        const stelleStr = '★'.repeat(valNum) + '☆'.repeat(5 - valNum);

        return `
            <div class="ricetta-card-single" data-id="${r.id}" style="background-color: ${bgTrasparente}; border-left-color: ${coloreUtente};">
                <div class="ricetta-card-top">
                    <span class="ricetta-card-categoria">${r.categoria || 'Generale'}</span>
                    <span class="ricetta-card-titolo">${r.nome || r.titolo || 'Ricetta'}</span>
                    <span class="ricetta-card-creatore">di ${creatore}</span>
                </div>
                <div class="ricetta-card-bottom">
                    <span class="ricetta-card-stelle">${stelleStr}</span>
                    <div class="ricetta-card-azioni">
                        <button class="btn-icon-ricetta delete" title="Elimina ricetta" data-id="${r.id}">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    gridEl.querySelectorAll('.ricetta-card-single').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.delete')) return;
            const idR = card.getAttribute('data-id');
            const ricettaObj = listaRicette.find(r => r.id === idR);
            if (ricettaObj) apriModaleVisualizzaRicetta(ricettaObj);
        });
    });

    gridEl.querySelectorAll('.btn-icon-ricetta.delete').forEach(btnDel => {
        btnDel.addEventListener('click', async (e) => {
            e.stopPropagation();
            const idR = btnDel.getAttribute('data-id');
            if (confirm("Sei sicuro di voler eliminare questa ricetta?")) {
                try {
                    await deleteDoc(doc(db, "ricette", idR));
                    const contentArea = document.getElementById('content-area');
                    await caricaEDisegnaRicette(contentArea);
                } catch (err) {
                    console.error("Errore cancellazione ricetta:", err);
                    alert("Impossibile eliminare la ricetta.");
                }
            }
        });
    });
}

// MODALE DI VISUALIZZAZIONE DETTAGLIATA RICETTA
function apriModaleVisualizzaRicetta(r) {
    const modalId = 'modal-view-ricetta';
    const prevModal = document.getElementById(modalId);
    if (prevModal) prevModal.remove();

    const valNum = Number(r.valutazione || 5);
    const stelleStr = '★'.repeat(valNum) + '☆'.repeat(5 - valNum);

    // Parsing ingredienti
    let ingredientiList = [];
    if (Array.isArray(r.listaIngredienti) && r.listaIngredienti.length > 0) {
        ingredientiList = r.listaIngredienti;
    } else if (r.ingredienti) {
        ingredientiList = r.ingredienti.split(',').map(item => {
            const parti = item.split('-');
            return {
                nome: parti[0] ? parti[0].trim() : item.trim(),
                quantita: parti[1] ? parti[1].trim() : ''
            };
        });
    }

    // Parsing passaggi
    let passaggiList = [];
    if (Array.isArray(r.listaPassaggi) && r.listaPassaggi.length > 0) {
        passaggiList = r.listaPassaggi.filter(p => p.trim().length > 0);
    } else if (r.preparazione) {
        passaggiList = r.preparazione.split('\n').filter(p => p.trim().length > 0);
    }

    const modalHtml = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content" style="max-width: 550px;">
                <div class="modal-header">
                    <div>
                        <h3 style="margin-bottom: 2px;">${r.nome || r.titolo || 'Ricetta'}</h3>
                        <span style="font-size: 0.8rem; color: #64748b;">di ${r.creatore || 'Utente'} • ${r.categoria || 'Generale'}</span>
                    </div>
                    <button class="btn-close-modal" id="btn-close-view">&times;</button>
                </div>
                
                <div class="ricetta-dettaglio-box">
                    <div style="color: #f1c40f; font-size: 1.1rem; letter-spacing: 2px;">
                        ${stelleStr}
                    </div>

                    ${ingredientiList.length > 0 ? `
                        <div class="ricetta-dettaglio-section">
                            <h4><i class="fa-solid fa-basket-shopping"></i> Ingredienti</h4>
                            <ol class="ricetta-list-numerata">
                                ${ingredientiList.map(ing => `
                                    <li><strong>${ing.nome}</strong> ${ing.quantita ? ` - <em>${ing.quantita}</em>` : ''}</li>
                                `).join('')}
                            </ol>
                        </div>
                    ` : ''}

                    ${passaggiList.length > 0 ? `
                        <div class="ricetta-dettaglio-section">
                            <h4><i class="fa-solid fa-list-check"></i> Preparazione</h4>
                            <ol class="ricetta-list-numerata">
                                ${passaggiList.map(pas => `
                                    <li>${pas}</li>
                                `).join('')}
                            </ol>
                        </div>
                    ` : ''}
                </div>

                <div class="modal-footer" style="margin-top: 20px;">
                    <button type="button" class="btn-modal save" id="btn-edit-from-view">Modifica</button>
                    <button type="button" class="btn-modal cancel" id="btn-close-view-footer">Chiudi</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalEl = document.getElementById(modalId);
    document.getElementById('btn-close-view').addEventListener('click', () => modalEl.remove());
    document.getElementById('btn-close-view-footer').addEventListener('click', () => modalEl.remove());
    
    document.getElementById('btn-edit-from-view').addEventListener('click', () => {
        modalEl.remove();
        apriModaleFormRicetta(r);
    });
}

// MODALE DI INSERIMENTO / MODIFICA RICETTA CON LAYOUT AGGIORNATO
function apriModaleFormRicetta(ricettaEsistente = null) {
    const savedUser = localStorage.getItem('famiglia_pwa_user') || sessionStorage.getItem('famiglia_pwa_user');
    const userData = savedUser ? JSON.parse(savedUser) : { nome: 'Utente' };

    const isModifica = !!ricettaEsistente;
    const modalId = 'modal-form-ricetta';

    const prevModal = document.getElementById(modalId);
    if (prevModal) prevModal.remove();

    // Inizializzazione dati ingredienti
    let ingredientiIniziali = [{ nome: '', quantita: '' }];
    if (isModifica) {
        if (Array.isArray(ricettaEsistente.listaIngredienti) && ricettaEsistente.listaIngredienti.length > 0) {
            ingredientiIniziali = ricettaEsistente.listaIngredienti;
        } else if (ricettaEsistente.ingredienti) {
            ingredientiIniziali = ricettaEsistente.ingredienti.split(',').map(item => {
                const parti = item.split('-');
                return { nome: parti[0] ? parti[0].trim() : item.trim(), quantita: parti[1] ? parti[1].trim() : '' };
            });
        }
    }

    // Inizializzazione dati passaggi (3 righe predefinite se nuovo)
    let passaggiIniziali = ['', '', ''];
    if (isModifica) {
        if (Array.isArray(ricettaEsistente.listaPassaggi) && ricettaEsistente.listaPassaggi.length > 0) {
            passaggiIniziali = ricettaEsistente.listaPassaggi;
        } else if (ricettaEsistente.preparazione) {
            passaggiIniziali = ricettaEsistente.preparazione.split('\n');
        }
    }

    const modalHtml = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content" style="max-width: 560px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3>${isModifica ? 'Modifica Ricetta' : 'Nuova Ricetta'}</h3>
                    <button class="btn-close-modal" id="btn-close-modal">&times;</button>
                </div>
                <form id="form-ricetta">
                    <!-- NOME E CATEGORIA AFFIANCATI -->
                    <div style="display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap;">
                        <div class="form-group" style="flex: 2; min-width: 200px; margin-bottom: 0;">
                            <label for="ric-nome">Nome della Ricetta</label>
                            <input type="text" id="ric-nome" value="${isModifica ? (ricettaEsistente.nome || ricettaEsistente.titolo || '') : ''}" required placeholder="Es. Pasta alla Carbonara">
                        </div>
                        <div class="form-group" style="flex: 1; min-width: 120px; margin-bottom: 0;">
                            <label for="ric-categoria">Categoria</label>
                            <select id="ric-categoria">
                                <option value="Primo" ${isModifica && ricettaEsistente.categoria === 'Primo' ? 'selected' : ''}>Primo</option>
                                <option value="Secondo" ${isModifica && ricettaEsistente.categoria === 'Secondo' ? 'selected' : ''}>Secondo</option>
                                <option value="Contorno" ${isModifica && ricettaEsistente.categoria === 'Contorno' ? 'selected' : ''}>Contorno</option>
                                <option value="Dolce" ${isModifica && ricettaEsistente.categoria === 'Dolce' ? 'selected' : ''}>Dolce</option>
                                <option value="Altro" ${isModifica && ricettaEsistente.categoria === 'Altro' ? 'selected' : ''}>Altro</option>
                            </select>
                        </div>
                    </div>

                    <!-- INGREDIENTI DINAMICI -->
                    <div class="form-group" style="margin-top: 10px;">
                        <label>Ingredienti</label>
                        <div id="container-ingredienti">
                            ${ingredientiIniziali.map(ing => creaRigaIngredienteHtml(ing.nome, ing.quantita)).join('')}
                        </div>
                        <button type="button" class="btn-add-dynamic" id="btn-add-ingrediente">
                            <i class="fa-solid fa-plus"></i> Aggiungi un ingrediente
                        </button>
                    </div>

                    <!-- PASSAGGI DINAMICI -->
                    <div class="form-group" style="margin-top: 15px;">
                        <label>Preparazione / Passaggi</label>
                        <div id="container-passaggi">
                            ${passaggiIniziali.map(pas => creaRigaPassaggioHtml(pas)).join('')}
                        </div>
                        <button type="button" class="btn-add-dynamic" id="btn-add-passaggio">
                            <i class="fa-solid fa-plus"></i> Aggiungi un passaggio
                        </button>
                    </div>

                    <!-- FOOTER CON VALUTAZIONE A SINISTRA E PULSANTI A DESTRA -->
                    <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; gap: 10px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <label for="ric-valutazione" style="margin-bottom: 0; font-size: 0.88rem; font-weight: 600; color: #334155;">Valutazione:</label>
                            <select id="ric-valutazione" style="width: auto; padding: 6px 10px; font-size: 0.88rem; border-radius: 6px; border: 1px solid #cbd5e1;">
                                <option value="5" ${isModifica && Number(ricettaEsistente.valutazione) === 5 ? 'selected' : ''}>★★★★★ (5/5)</option>
                                <option value="4" ${isModifica && Number(ricettaEsistente.valutazione) === 4 ? 'selected' : ''}>★★★★☆ (4/5)</option>
                                <option value="3" ${isModifica && Number(ricettaEsistente.valutazione) === 3 ? 'selected' : ''}>★★★☆☆ (3/5)</option>
                                <option value="2" ${isModifica && Number(ricettaEsistente.valutazione) === 2 ? 'selected' : ''}>★★☆☆☆ (2/5)</option>
                                <option value="1" ${isModifica && Number(ricettaEsistente.valutazione) === 1 ? 'selected' : ''}>★☆☆☆☆ (1/5)</option>
                            </select>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <button type="button" class="btn-modal cancel" id="btn-cancel-modal">Annulla</button>
                            <button type="submit" class="btn-modal save">Salva Ricetta</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalEl = document.getElementById(modalId);
    const btnClose = document.getElementById('btn-close-modal');
    const btnCancel = document.getElementById('btn-cancel-modal');
    const form = document.getElementById('form-ricetta');

    const containerIng = document.getElementById('container-ingredienti');
    const containerPas = document.getElementById('container-passaggi');

    // Gestore aggiunta riga ingrediente
    document.getElementById('btn-add-ingrediente').addEventListener('click', () => {
        containerIng.insertAdjacentHTML('beforeend', creaRigaIngredienteHtml());
        aggiornaEventiRimuovi(containerIng);
    });

    // Gestore aggiunta riga passaggio
    document.getElementById('btn-add-passaggio').addEventListener('click', () => {
        containerPas.insertAdjacentHTML('beforeend', creaRigaPassaggioHtml());
        aggiornaEventiRimuovi(containerPas);
    });

    aggiornaEventiRimuovi(containerIng);
    aggiornaEventiRimuovi(containerPas);

    const chiudiModale = () => modalEl.remove();

    btnClose.addEventListener('click', chiudiModale);
    btnCancel.addEventListener('click', chiudiModale);

    // Salvataggio form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.getElementById('ric-nome').value.trim();
        const categoria = document.getElementById('ric-categoria').value;
        const valutazione = document.getElementById('ric-valutazione').value;

        if (!nome) {
            alert("Inserisci il nome della ricetta.");
            return;
        }

        // Estrazione ingredienti
        const listaIngredienti = [];
        containerIng.querySelectorAll('.dynamic-row').forEach(row => {
            const ingNome = row.querySelector('.input-ingrediente').value.trim();
            const ingQty = row.querySelector('.input-quantita').value.trim();
            if (ingNome) {
                listaIngredienti.push({ nome: ingNome, quantita: ingQty });
            }
        });

        // Estrazione passaggi
        const listaPassaggi = [];
        containerPas.querySelectorAll('.dynamic-row').forEach(row => {
            const pasTxt = row.querySelector('.input-passaggio').value.trim();
            if (pasTxt) {
                listaPassaggi.push(pasTxt);
            }
        });

        const payload = {
            nome: nome,
            categoria: categoria,
            valutazione: Number(valutazione),
            listaIngredienti: listaIngredienti,
            listaPassaggi: listaPassaggi,
            creatore: isModifica ? ricettaEsistente.creatore : userData.nome
        };

        try {
            if (isModifica) {
                await updateDoc(doc(db, "ricette", ricettaEsistente.id), payload);
            } else {
                await addDoc(collection(db, "ricette"), payload);
            }

            chiudiModale();
            const contentArea = document.getElementById('content-area');
            await caricaEDisegnaRicette(contentArea);

        } catch (err) {
            console.error("Errore salvataggio ricetta:", err);
            alert("Si è verificato un errore durante il salvataggio della ricetta.");
        }
    });
}

function creaRigaIngredienteHtml(nome = '', quantita = '') {
    return `
        <div class="dynamic-row">
            <input type="text" class="input-ingrediente" value="${nome}" placeholder="Ingrediente (es. Farina 00)">
            <input type="text" class="input-quantita" value="${quantita}" placeholder="Quantità (es. 100 gr)">
            <button type="button" class="btn-remove-row" title="Rimuovi"><i class="fa-solid fa-trash-can"></i></button>
        </div>
    `;
}

function creaRigaPassaggioHtml(testo = '') {
    return `
        <div class="dynamic-row">
            <input type="text" class="input-passaggio" value="${testo}" placeholder="Descrivi il passaggio...">
            <button type="button" class="btn-remove-row" title="Rimuovi"><i class="fa-solid fa-trash-can"></i></button>
        </div>
    `;
}

function aggiornaEventiRimuovi(container) {
    container.querySelectorAll('.btn-remove-row').forEach(btn => {
        btn.onclick = (e) => {
            const row = e.currentTarget.closest('.dynamic-row');
            if (row) row.remove();
        };
    });
}
