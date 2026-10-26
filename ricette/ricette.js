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

function calcolaMediaValutazione(valutazioniObj, valPredefinita = 5) {
    if (!valutazioniObj || typeof valutazioniObj !== 'object') {
        return Number(valPredefinita) || 5;
    }
    const valori = Object.values(valutazioniObj).map(v => Number(v)).filter(v => !isNaN(v));
    if (valori.length === 0) return Number(valPredefinita) || 5;
    const somma = valori.reduce((acc, curr) => acc + curr, 0);
    return Math.round(somma / valori.length);
}

async function caricaEDisegnaRicette(container) {
    container.innerHTML = `
        <div class="ricette-container">
            <div class="section-header-actions" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                <div class="header-left-group" style="display: flex; align-items: center; gap: 12px;">
                    <button id="btn-torna-home" class="btn-outline" title="Torna alla Home">
                        <i class="fa-solid fa-arrow-left"></i> Home
                    </button>
                    <h2 style="margin: 0;"><i class="fa-solid fa-utensils"></i> RICETTE</h2>
                </div>
                <div class="ricette-actions" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                    <input type="text" id="search-ricette" class="search-ricette-input" placeholder="Cerca ricetta...">
                    <button class="btn-add-ricetta btn-primary" id="btn-nuova-ricetta">
                        <i class="fa-solid fa-circle-plus"></i> Nuova Ricetta
                    </button>
                </div>
            </div>

            <div class="ricette-grid-main" id="ricette-grid-container">
                <p style="color: #64748b; padding: 20px;">Caricamento ricette in corso...</p>
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

        listaRicette.sort((a, b) => {
            const medA = calcolaMediaValutazione(a.valutazioniUtenti, a.valutazione);
            const medB = calcolaMediaValutazione(b.valutazioniUtenti, b.valutazione);
            return medB - medA;
        });

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
        
        const valNum = calcolaMediaValutazione(r.valutazioniUtenti, r.valutazione);
        const stelleStr = '★'.repeat(valNum) + '☆'.repeat(5 - valNum);

        return `
            <div class="ricetta-card-single" data-id="${r.id}" style="background-color: ${bgTrasparente}; border-left-color: ${coloreUtente};">
                <div class="ricetta-card-top">
                    <span class="ricetta-card-categoria">${r.categoria || 'Generale'}</span>
                    <span class="ricetta-card-titolo">${r.nome || r.titolo || 'Ricetta'}</span>
                    <span class="ricetta-card-creatore">(${creatore})</span>
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

function estraiIngredientiDaDoc(r) {
    let ris = [];
    if (Array.isArray(r.ingredienti)) {
        r.ingredienti.forEach(item => {
            if (typeof item === 'string') {
                const parti = item.split(' - ');
                ris.push({ nome: parti[0] ? parti[0].trim() : item, quantita: parti[1] ? parti[1].trim() : '' });
            } else if (item && typeof item === 'object') {
                ris.push({ nome: item.nome || '', quantita: item.quantita || '' });
            }
        });
    } else if (Array.isArray(r.listaIngredienti)) {
        ris = r.listaIngredienti;
    } else if (typeof r.ingredienti === 'string' && r.ingredienti.trim().length > 0) {
        r.ingredienti.split(',').forEach(item => {
            const parti = item.split(' - ');
            ris.push({ nome: parti[0] ? parti[0].trim() : item.trim(), quantita: parti[1] ? parti[1].trim() : '' });
        });
    }
    return ris;
}

function estraiPassaggiDaDoc(r) {
    let ris = [];
    if (Array.isArray(r.procedimento)) {
        ris = r.procedimento.filter(p => typeof p === 'string' && p.trim().length > 0);
    } else if (Array.isArray(r.listaPassaggi)) {
        ris = r.listaPassaggi.filter(p => typeof p === 'string' && p.trim().length > 0);
    } else {
        const testo = r.preparazione || r.procedimento;
        if (typeof testo === 'string' && testo.trim().length > 0) {
            ris = testo.split('\n').filter(p => p.trim().length > 0);
        }
    }
    return ris;
}

function apriModaleVisualizzaRicetta(r) {
    const savedUser = localStorage.getItem('famiglia_session') || sessionStorage.getItem('famiglia_session');
    const userData = savedUser ? JSON.parse(savedUser) : { nome: 'Utente' };
    const nomeUtenteCorrente = (userData.nome || 'Utente').toLowerCase();

    const modalId = 'modal-view-ricetta';
    const prevModal = document.getElementById(modalId);
    if (prevModal) prevModal.remove();

    const valutazioniObj = r.valutazioniUtenti || {};
    const votoPersonaleUtente = Number(valutazioniObj[nomeUtenteCorrente] || 0);
    const mediaVal = calcolaMediaValutazione(valutazioniObj, r.valutazione);
    const stelleStrMedia = '★'.repeat(mediaVal) + '☆'.repeat(5 - mediaVal);

    const ingredientiList = estraiIngredientiDaDoc(r);
    const passaggiList = estraiPassaggiDaDoc(r);

    const modalHtml = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content" style="max-width: 550px;">
                <div class="modal-header">
                    <div>
                        <h3 style="margin-bottom: 4px; font-size: 1.25rem;">${r.nome || r.titolo || 'Ricetta'}</h3>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 0.88rem; color: #64748b; font-weight: 600;">(${r.creatore || 'Utente'})</span>
                            <span style="color: #f1c40f; font-size: 0.95rem; letter-spacing: 1px;" title="Media valutazione">${stelleStrMedia}</span>
                        </div>
                    </div>
                    <button class="btn-close-modal" id="btn-close-view">&times;</button>
                </div>
                
                <div class="ricetta-dettaglio-box" style="margin-top: 12px;">
                    <div class="rating-interactive-box">
                        <span style="font-size: 0.88rem; font-weight: 600; color: #78350f;">Il tuo voto:</span>
                        <div id="stars-container-user">
                            ${[1, 2, 3, 4, 5].map(starIndex => `
                                <span class="star-rating-btn ${starIndex <= votoPersonaleUtente ? 'active' : ''}" data-value="${starIndex}">★</span>
                            `).join('')}
                        </div>
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
                    ` : '<p style="font-style:italic; color:#94a3b8; padding: 10px;">Nessun ingrediente specificato.</p>'}

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

                <div class="modal-footer" style="margin-top: 20px; display:flex; justify-content:flex-end; gap:8px;">
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

    const starBtns = modalEl.querySelectorAll('.star-rating-btn');
    starBtns.forEach(star => {
        star.addEventListener('click', async () => {
            const valVoto = Number(star.getAttribute('data-value'));
            const valutazioniAggiornate = r.valutazioniUtenti || {};
            valutazioniAggiornate[nomeUtenteCorrente] = valVoto;

            try {
                await updateDoc(doc(db, "ricette", r.id), {
                    valutazioniUtenti: valutazioniAggiornate
                });
                r.valutazioniUtenti = valutazioniAggiornate;
                
                starBtns.forEach(s => {
                    const v = Number(s.getAttribute('data-value'));
                    if (v <= valVoto) s.classList.add('active');
                    else s.classList.remove('active');
                });

                const contentArea = document.getElementById('content-area');
                await caricaEDisegnaRicette(contentArea);

            } catch (err) {
                console.error("Errore salvataggio voto:", err);
            }
        });
    });

    document.getElementById('btn-edit-from-view').addEventListener('click', () => {
        modalEl.remove();
        apriModaleFormRicetta(r);
    });
}

function apriModaleFormRicetta(ricettaEsistente = null) {
    const savedUser = localStorage.getItem('famiglia_session') || sessionStorage.getItem('famiglia_session');
    const userData = savedUser ? JSON.parse(savedUser) : { nome: 'Utente' };

    const isModifica = !!ricettaEsistente;
    const modalId = 'modal-form-ricetta';

    const prevModal = document.getElementById(modalId);
    if (prevModal) prevModal.remove();

    let ingredientiIniziali = isModifica ? estraiIngredientiDaDoc(ricettaEsistente) : [];
    if (ingredientiIniziali.length === 0) {
        ingredientiIniziali = [{ nome: '', quantita: '' }];
    }

    let passaggiIniziali = isModifica ? estraiPassaggiDaDoc(ricettaEsistente) : [];
    if (passaggiIniziali.length === 0) {
        passaggiIniziali = ['', '', ''];
    }

    const modalHtml = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content" style="max-width: 560px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3>${isModifica ? 'Modifica Ricetta' : 'Nuova Ricetta'}</h3>
                    <button class="btn-close-modal" id="btn-close-modal">&times;</button>
                </div>
                <form id="form-ricetta">
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

                    <div class="form-group" style="margin-top: 10px;">
                        <label>Ingredienti</label>
                        <div id="container-ingredienti">
                            ${ingredientiIniziali.map(ing => creaRigaIngredienteHtml(ing.nome, ing.quantita)).join('')}
                        </div>
                        <button type="button" class="btn-add-dynamic" id="btn-add-ingrediente">
                            <i class="fa-solid fa-plus"></i> Aggiungi un ingrediente
                        </button>
                    </div>

                    <div class="form-group" style="margin-top: 15px;">
                        <label>Preparazione / Passaggi</label>
                        <div id="container-passaggi">
                            ${passaggiIniziali.map(pas => creaRigaPassaggioHtml(pas)).join('')}
                        </div>
                        <button type="button" class="btn-add-dynamic" id="btn-add-passaggio">
                            <i class="fa-solid fa-plus"></i> Aggiungi un passaggio
                        </button>
                    </div>

                    <div class="modal-footer" style="display: flex; justify-content: flex-end; align-items: center; margin-top: 20px; gap: 8px;">
                        <button type="button" class="btn-modal cancel" id="btn-cancel-modal">Annulla</button>
                        <button type="submit" class="btn-modal save">Salva Ricetta</button>
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

    document.getElementById('btn-add-ingrediente').addEventListener('click', () => {
        containerIng.insertAdjacentHTML('beforeend', creaRigaIngredienteHtml());
        aggiornaEventiRimuovi(containerIng);
    });

    document.getElementById('btn-add-passaggio').addEventListener('click', () => {
        containerPas.insertAdjacentHTML('beforeend', creaRigaPassaggioHtml());
        aggiornaEventiRimuovi(containerPas);
    });

    aggiornaEventiRimuovi(containerIng);
    aggiornaEventiRimuovi(containerPas);

    const chiudiModale = () => modalEl.remove();

    btnClose.addEventListener('click', chiudiModale);
    btnCancel.addEventListener('click', chiudiModale);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.getElementById('ric-nome').value.trim();
        const categoria = document.getElementById('ric-categoria').value;

        if (!nome) {
            alert("Inserisci il nome della ricetta.");
            return;
        }

        const listaIngredienti = [];
        const arrayStringheIngredienti = [];
        containerIng.querySelectorAll('.dynamic-row').forEach(row => {
            const ingNome = row.querySelector('.input-ingrediente').value.trim();
            const ingQty = row.querySelector('.input-quantita').value.trim();
            if (ingNome) {
                listaIngredienti.push({ nome: ingNome, quantita: ingQty });
                arrayStringheIngredienti.push(ingQty ? `${ingNome} - ${ingQty}` : ingNome);
            }
        });

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
            ingredienti: arrayStringheIngredienti,
            procedimento: listaPassaggi,
            listaIngredienti: listaIngredienti,
            listaPassaggi: listaPassaggi,
            creatore: isModifica ? ricettaEsistente.creatore : userData.nome,
            valutazioniUtenti: isModifica ? (ricettaEsistente.valutazioniUtenti || {}) : {}
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
