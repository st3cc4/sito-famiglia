import { db } from "../firebase-config.js";
import { 
    collection, getDocs, addDoc, updateDoc, doc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let utentiCollezioni = {};
let listaRicette = [];
let categorieEsistenti = ["Primo", "Secondo", "Contorno", "Dolce", "Antipasto", "Piatto Unico", "Impasto", "Bevanda"];
let categoriaFiltroCorrente = "TUTTE";

// ATTENZIONE: l'export qui è fondamentale!
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
            const usernameKey = (data.username || docSnap.id || '').toLowerCase();
            if (usernameKey) {
                utentiCollezioni[usernameKey] = data.colore || '#2563eb';
            }
        });
    } catch (e) {
        console.error("Errore caricamento utenti:", e);
    }
}

function hexToRgba(hex, alpha = 0.22) {
    if (!hex || !hex.startsWith('#')) return `rgba(37, 99, 235, ${alpha})`;
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(char => char + char).join('');
    const num = parseInt(c, 16);
    if (isNaN(num)) return `rgba(37, 99, 235, ${alpha})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function escapeAttr(str) {
    if (!str) return '';
    return String(str).replace(/"/g, '&quot;');
}

function renderStelleMini(punteggio) {
    const voto = Number(punteggio) || 0;
    if (voto <= 0) return '';
    return `<span style="color: #f59e0b; font-size: 0.72rem; letter-spacing: 1px;" title="Valutazione: ${voto}/5">${'★'.repeat(voto)}${'☆'.repeat(5 - voto)}</span>`;
}

async function caricaEDisegnaRicette(container) {
    container.innerHTML = `
        <div class="ricette-container">
            <div class="ricette-header">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 8px;">
                    <h2><i class="fa-solid fa-utensils"></i> RICETTE</h2>
                    <button class="btn-add-ricetta" id="btn-nuova-ricetta">
                        Nuova Ricetta
                    </button>
                </div>
                <div class="ricette-actions" style="width: 100%;">
                    <select id="select-categoria-filtro" class="search-ricetta-input" style="background: #fff; cursor: pointer; width: 100%; max-width: 100%;">
                        <option value="TUTTE">Tutte le categorie</option>
                    </select>
                </div>
            </div>

            <div id="ricette-grid-container" class="ricette-grid">
                <p style="color: #64748b; padding: 20px;">Caricamento ricette...</p>
            </div>
        </div>
    `;

    document.getElementById('btn-nuova-ricetta').addEventListener('click', () => {
        apriModaleFormRicetta();
    });

    try {
        const snapshot = await getDocs(collection(db, "ricette"));
        listaRicette = [];
        const catSet = new Set(categorieEsistenti);

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data.categoria) catSet.add(capitalize(data.categoria));
            listaRicette.push({
                id: docSnap.id,
                ...data
            });
        });

        categorieEsistenti = Array.from(catSet).sort();
        listaRicette.sort((a, b) => (b.creatoIl || "").localeCompare(a.creatoIl || ""));
        
        aggiornaSelectFiltroCategorie();
        renderGrigliaRicette();

        const selectFiltro = document.getElementById('select-categoria-filtro');
        selectFiltro.addEventListener('change', (e) => {
            categoriaFiltroCorrente = e.target.value;
            renderGrigliaRicette();
        });

    } catch (err) {
        console.error("Errore caricamento ricette:", err);
        document.getElementById('ricette-grid-container').innerHTML = '<p style="color:#dc3545;">Errore durante il caricamento delle ricette.</p>';
    }
}

function aggiornaSelectFiltroCategorie() {
    const selectFiltro = document.getElementById('select-categoria-filtro');
    if (!selectFiltro) return;

    let html = `<option value="TUTTE">Tutte le categorie</option>`;
    html += categorieEsistenti.map(cat => `
        <option value="${cat}" ${categoriaFiltroCorrente === cat ? 'selected' : ''}>${cat}</option>
    `).join('');
    selectFiltro.innerHTML = html;
}

function renderGrigliaRicette() {
    const gridContainer = document.getElementById('ricette-grid-container');
    if (!gridContainer) return;

    const filtrate = listaRicette.filter(r => {
        const categoria = capitalize(r.categoria || 'Generale');
        if (categoriaFiltroCorrente !== "TUTTE" && categoria !== categoriaFiltroCorrente) {
            return false;
        }
        return true;
    });

    if (filtrate.length === 0) {
        gridContainer.innerHTML = '<p style="color:#94a3b8; font-style:italic; padding: 10px; grid-column: 1/-1;">Nessuna ricetta trovata.</p>';
        return;
    }

    gridContainer.innerHTML = filtrate.map(r => {
        const titolo = r.titolo || r.nome || 'Senza titolo';
        const creatoreRaw = r.creatore || 'Utente';
        const creatoreFormatted = capitalize(creatoreRaw);
        const categoria = capitalize(r.categoria || 'Generale');
        const coloreUtente = utentiCollezioni[creatoreRaw.toLowerCase()] || '#2563eb';
        const bgTrasparente = hexToRgba(coloreUtente, 0.22);
        const stelleMini = renderStelleMini(r.valutazione);

        return `
            <div class="ricetta-card" data-id="${r.id}" style="background-color: ${bgTrasparente}; border-left: 4px solid ${coloreUtente};">
                <div class="ricetta-card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span class="ricetta-badge">${categoria}</span>
                        <span style="font-size: 0.76rem; color: #475569; font-weight: 600;">(${creatoreFormatted})</span>
                    </div>
                    <button class="btn-delete-ricetta" title="Elimina" data-id="${r.id}">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
                <div class="ricetta-card-body" style="padding: 4px 0 0 0; display: flex; flex-direction: column; gap: 2px;">
                    <h3 class="ricetta-titolo" style="margin: 0; font-size: 0.96rem; color: #1e293b;">${titolo}</h3>
                    ${stelleMini ? `<div>${stelleMini}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    gridContainer.querySelectorAll('.ricetta-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-delete-ricetta')) return;
            const idR = card.getAttribute('data-id');
            const ricettaObj = listaRicette.find(r => r.id === idR);
            if (ricettaObj) apriModaleDettaglioRicetta(ricettaObj);
        });
    });

    gridContainer.querySelectorAll('.btn-delete-ricetta').forEach(btnDel => {
        btnDel.addEventListener('click', async (e) => {
            e.stopPropagation();
            const idR = btnDel.getAttribute('data-id');
            if (confirm("Vuoi davvero eliminare questa ricetta?")) {
                try {
                    await deleteDoc(doc(db, "ricette", idR));
                    const container = document.getElementById('ricette-content-root') || document.getElementById('content-area');
                    await caricaEDisegnaRicette(container);
                } catch (err) {
                    console.error("Errore eliminazione ricetta:", err);
                    alert("Impossibile eliminare la ricetta.");
                }
            }
        });
    });
}

function formattaStepConNumeroGrassetto(step, indice) {
    const numero = indice + 1;
    const testoPulito = String(step).replace(/^\s*\d+[\.\)\-:]?\s*/, '');
    return `<li><strong class="procedimento-step-num">${numero}.</strong> ${testoPulito}</li>`;
}

function apriModaleDettaglioRicetta(r) {
    const modalId = 'modal-view-ricetta';
    const prev = document.getElementById(modalId);
    if (prev) prev.remove();

    const titolo = r.titolo || r.nome || 'Senza titolo';
    const categoria = capitalize(r.categoria || 'Generale');
    const creatoreFormatted = capitalize(r.creatore || 'Utente');
    let punteggioCorrente = Number(r.valutazione) || 0;

    let ingredientiHtml = '<p style="color: #64748b; font-style: italic; font-size: 1rem;">Nessun ingrediente specificato</p>';
    const ingData = r.listaIngredienti || r.ingredienti;
    if (Array.isArray(ingData) && ingData.length > 0) {
        ingredientiHtml = `<ul class="ingredienti-lista-dettaglio">` + ingData.map(item => {
            if (typeof item === 'object' && item !== null) {
                const nome = item.nome || '';
                const quantita = item.quantita ? `<strong>(${item.quantita})</strong>` : '';
                return `<li><strong>${nome}</strong> ${quantita}</li>`;
            }
            return `<li>${item}</li>`;
        }).join('') + `</ul>`;
    }

    let procedimentoHtml = '<p style="color: #64748b; font-style: italic; font-size: 1rem;">Nessun procedimento specificato</p>';
    const procData = r.procedimento || r.listaPassaggi;
    if (Array.isArray(procData) && procData.length > 0) {
        procedimentoHtml = `<ol class="procedimento-lista-numerata">` + procData.map((step, idx) => {
            return formattaStepConNumeroGrassetto(step, idx);
        }).join('') + `</ol>`;
    } else if (typeof procData === 'string' && procData.trim() !== '') {
        const righe = procData.split(/\r?\n/).map(riga => riga.trim()).filter(Boolean);
        procedimentoHtml = `<ol class="procedimento-lista-numerata">` + righe.map((riga, idx) => {
            return formattaStepConNumeroGrassetto(riga, idx);
        }).join('') + `</ol>`;
    }

    const html = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content" style="max-width: 650px;">
                <div class="modal-header">
                    <div>
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                            <span class="ricetta-badge" style="font-size: 0.75rem;">${categoria}</span>
                            <span style="font-size: 0.88rem; color: #475569; font-weight: 600;">(${creatoreFormatted})</span>
                        </div>
                        <h2 style="margin: 0; font-size: 1.4rem; color: #1e293b;">${titolo}</h2>
                    </div>
                    <button class="btn-close-modal" id="btn-close-view">&times;</button>
                </div>

                <div class="modal-body" style="margin: 14px 0; max-height: 62vh; overflow-y: auto;">
                    <h4 style="margin: 0 0 8px 0; color: #1e293b; font-weight: 700; font-size: 1.08rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px;">Ingredienti</h4>
                    <div style="background: #f8fafc; padding: 14px; border-radius: 8px; margin-bottom: 18px;">
                        ${ingredientiHtml}
                    </div>
                    
                    <h4 style="margin: 0 0 8px 0; color: #1e293b; font-weight: 700; font-size: 1.08rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px;">Procedimento</h4>
                    <div style="background: #f8fafc; padding: 14px; border-radius: 8px;">
                        ${procedimentoHtml}
                    </div>

                    <div class="rating-box">
                        <div>
                            <div style="font-weight: 700; font-size: 0.95rem; color: #1e293b;">Punteggio ricetta</div>
                            <div id="rating-label-text" style="font-size: 0.82rem; color: #64748b;">
                                ${punteggioCorrente > 0 ? `Valutata ${punteggioCorrente} su 5 stelle` : 'Tocca una stella per votare'}
                            </div>
                        </div>
                        <div class="rating-stars" id="rating-stars-container" role="group" aria-label="Valutazione da 1 a 5 stelle">
                            ${[1, 2, 3, 4, 5].map(num => `
                                <button type="button" class="rating-star-btn ${num <= punteggioCorrente ? 'active' : ''}" data-value="${num}" title="${num} stelle">
                                    <i class="fa-solid fa-star"></i>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="modal-footer" style="display: flex; justify-content: flex-end; align-items: center; gap: 8px;">
                    <button type="button" class="btn-modal cancel" id="btn-chiudi-modal">Chiudi</button>
                    <button type="button" class="btn-modal save" id="btn-modifica-ricetta"><i class="fa-solid fa-pen"></i> Modifica</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
    const modalEl = document.getElementById(modalId);

    const aggiornaStelleVisive = (nuovoVoto) => {
        punteggioCorrente = nuovoVoto;
        modalEl.querySelectorAll('.rating-star-btn').forEach(btn => {
            const val = Number(btn.getAttribute('data-value'));
            btn.classList.toggle('active', val <= nuovoVoto);
        });
        const labelEl = document.getElementById('rating-label-text');
        if (labelEl) {
            labelEl.textContent = nuovoVoto > 0 ? `Valutata ${nuovoVoto} su 5 stelle` : 'Tocca una stella per votare';
        }
    };

    modalEl.querySelectorAll('.rating-star-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const votoScelto = Number(btn.getAttribute('data-value'));
            const votoFinale = (votoScelto === punteggioCorrente) ? 0 : votoScelto;
            aggiornaStelleVisive(votoFinale);

            try {
                await updateDoc(doc(db, "ricette", r.id), {
                    valutazione: votoFinale
                });
                r.valutazione = votoFinale;
                const ricettaInLista = listaRicette.find(item => item.id === r.id);
                if (ricettaInLista) ricettaInLista.valutazione = votoFinale;
                renderGrigliaRicette();
            } catch (err) {
                console.error("Errore salvataggio punteggio ricetta:", err);
                alert("Impossibile salvare il punteggio.");
            }
        });
    });

    document.getElementById('btn-close-view').addEventListener('click', () => modalEl.remove());
    document.getElementById('btn-chiudi-modal').addEventListener('click', () => modalEl.remove());
    document.getElementById('btn-modifica-ricetta').addEventListener('click', () => {
        modalEl.remove();
        apriModaleFormRicetta(r);
    });
}

function apriModaleFormRicetta(ricettaDaModificare = null) {
    const isModifica = Boolean(ricettaDaModificare && ricettaDaModificare.id);
    const savedUser = localStorage.getItem('sitoFamiglia_user') || 'Utente';
    const modalId = 'modal-form-ricetta';
    const prev = document.getElementById(modalId);
    if (prev) prev.remove();

    const categoriaIniziale = isModifica ? capitalize(ricettaDaModificare.categoria || 'Generale') : categorieEsistenti[0];
    const titoloIniziale = isModifica ? (ricettaDaModificare.titolo || ricettaDaModificare.nome || '') : '';

    const optionsCatHtml = categorieEsistenti.map(c => `
        <option value="${escapeAttr(c)}" ${c === categoriaIniziale ? 'selected' : ''}>${c}</option>
    `).join('') + `<option value="__NUOVA__">+ Aggiungi nuova categoria...</option>`;

    const html = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${isModifica ? 'Modifica Ricetta' : 'Nuova Ricetta'}</h3>
                    <button class="btn-close-modal" id="btn-close-form">&times;</button>
                </div>
                <form id="form-ricetta">
                    <div class="form-group">
                        <label for="ric-titolo">Titolo Ricetta</label>
                        <input type="text" id="ric-titolo" required placeholder="Es. Torta di mele" value="${escapeAttr(titoloIniziale)}">
                    </div>
                    <div class="form-group">
                        <label for="ric-cat-select">Categoria</label>
                        <select id="ric-cat-select">
                            ${optionsCatHtml}
                        </select>
                    </div>
                    <div class="form-group" id="group-nuova-cat" style="display: none;">
                        <label for="ric-nuova-cat">Nome Nuova Categoria</label>
                        <input type="text" id="ric-nuova-cat" placeholder="Es. Focacce, Dessert...">
                    </div>

                    <div class="form-group" style="margin-top: 10px;">
                        <label style="font-weight: 700; color: #1e293b; font-size: 0.88rem; margin-bottom: 2px; display: block;">Ingredienti</label>
                        <div id="container-ingredienti-dinamici" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 4px;">
                            <!-- Generato via JS -->
                        </div>
                        <button type="button" id="btn-aggiungi-ingrediente-riga" style="background: none; border: none; color: #2563eb; font-weight: 600; cursor: pointer; padding: 0; text-align: left; font-size: 0.82rem;">
                            + Aggiungi ingrediente
                        </button>
                    </div>

                    <div class="form-group" style="margin-top: 10px;">
                        <label style="font-weight: 700; color: #1e293b; font-size: 0.88rem; margin-bottom: 2px; display: block;">Procedimento</label>
                        <div id="container-procedimento-dinamico" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 4px;">
                            <!-- Generato via JS -->
                        </div>
                        <button type="button" id="btn-aggiungi-proc-riga" style="background: none; border: none; color: #2563eb; font-weight: 600; cursor: pointer; padding: 0; text-align: left; font-size: 0.82rem;">
                            + Aggiungi passaggio
                        </button>
                    </div>

                    <div class="modal-footer" style="margin-top: 14px; display: flex; justify-content: flex-end; gap: 6px;">
                        <button type="button" class="btn-modal cancel" id="btn-cancel-ricetta">Annulla</button>
                        <button type="submit" class="btn-modal save" id="btn-save-ricetta">${isModifica ? 'Salva Modifiche' : 'Salva Ricetta'}</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
    const modalEl = document.getElementById(modalId);
    const chiudi = () => modalEl.remove();

    document.getElementById('btn-close-form').addEventListener('click', chiudi);
    document.getElementById('btn-cancel-ricetta').addEventListener('click', chiudi);

    const catSelect = document.getElementById('ric-cat-select');
    const groupNuovaCat = document.getElementById('group-nuova-cat');

    catSelect.addEventListener('change', () => {
        if (catSelect.value === '__NUOVA__') {
            groupNuovaCat.style.display = 'block';
        } else {
            groupNuovaCat.style.display = 'none';
        }
    });

    const containerIng = document.getElementById('container-ingredienti-dinamici');
    const containerProc = document.getElementById('container-procedimento-dinamico');

    function aggiungiRigaIngrediente(nomeVal = '', quantitaVal = '') {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; gap: 6px; align-items: center; width: 100%;';
        row.innerHTML = `
            <input type="text" class="ing-nome" placeholder="Ingrediente" value="${escapeAttr(nomeVal)}" style="flex: 2; padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
            <input type="text" class="ing-quantita" placeholder="Qtà" value="${escapeAttr(quantitaVal)}" style="flex: 1; padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
            <button type="button" class="btn-rimuovi-riga" style="background: none; border: none; color: #dc3545; cursor: pointer; padding: 4px; font-size: 0.85rem;"><i class="fa-solid fa-trash"></i></button>
        `;
        row.querySelector('.btn-rimuovi-riga').addEventListener('click', () => row.remove());
        containerIng.appendChild(row);
    }

    function aggiungiRigaProcedimento(testoVal = '') {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; gap: 6px; align-items: center; width: 100%;';
        row.innerHTML = `
            <input type="text" class="proc-testo" placeholder="Passaggio..." value="${escapeAttr(testoVal)}" style="flex: 1; padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
            <button type="button" class="btn-rimuovi-riga" style="background: none; border: none; color: #dc3545; cursor: pointer; padding: 4px; font-size: 0.85rem;"><i class="fa-solid fa-trash"></i></button>
        `;
        row.querySelector('.btn-rimuovi-riga').addEventListener('click', () => row.remove());
        containerProc.appendChild(row);
    }

    if (isModifica) {
        const ingEsistenti = ricettaDaModificare.listaIngredienti || ricettaDaModificare.ingredienti || [];
        if (Array.isArray(ingEsistenti) && ingEsistenti.length > 0) {
            ingEsistenti.forEach(item => {
                if (typeof item === 'object' && item !== null) {
                    aggiungiRigaIngrediente(item.nome || '', item.quantita || '');
                } else {
                    aggiungiRigaIngrediente(String(item), '');
                }
            });
        } else {
            aggiungiRigaIngrediente();
        }

        const procEsistente = ricettaDaModificare.procedimento || ricettaDaModificare.listaPassaggi || [];
        if (Array.isArray(procEsistente) && procEsistente.length > 0) {
            procEsistente.forEach(step => {
                const testoPulito = String(step).replace(/^\s*\d+[\.\)\-:]?\s*/, '');
                aggiungiRigaProcedimento(testoPulito);
            });
        } else if (typeof procEsistente === 'string' && procEsistente.trim() !== '') {
            procEsistente.split(/\r?\n/).map(r => r.trim()).filter(Boolean).forEach(riga => {
                const testoPulito = riga.replace(/^\s*\d+[\.\)\-:]?\s*/, '');
                aggiungiRigaProcedimento(testoPulito);
            });
        } else {
            aggiungiRigaProcedimento();
        }
    } else {
        for (let i = 0; i < 2; i++) {
            aggiungiRigaIngrediente();
            aggiungiRigaProcedimento();
        }
    }

    document.getElementById('btn-aggiungi-ingrediente-riga').addEventListener('click', () => aggiungiRigaIngrediente());
    document.getElementById('btn-aggiungi-proc-riga').addEventListener('click', () => aggiungiRigaProcedimento());

    document.getElementById('form-ricetta').addEventListener('submit', async (e) => {
        e.preventDefault();
        const titolo = document.getElementById('ric-titolo').value.trim();
        
        let categoria = catSelect.value;
        if (categoria === '__NUOVA__') {
            categoria = capitalize(document.getElementById('ric-nuova-cat').value.trim());
        }
        if (!categoria) categoria = 'Generale';

        const listaIngredienti = [];
        containerIng.querySelectorAll('div').forEach(row => {
            const nome = row.querySelector('.ing-nome').value.trim();
            const quantita = row.querySelector('.ing-quantita').value.trim();
            if (nome) {
                listaIngredienti.push({ nome, quantita });
            }
        });

        const procedimento = [];
        containerProc.querySelectorAll('div').forEach(row => {
            const testo = row.querySelector('.proc-testo').value.trim();
            if (testo) {
                procedimento.push(testo);
            }
        });

        if (listaIngredienti.length === 0 || procedimento.length === 0) {
            alert("Inserisci almeno un ingrediente e un passaggio per il procedimento.");
            return;
        }

        try {
            if (isModifica) {
                await updateDoc(doc(db, "ricette", ricettaDaModificare.id), {
                    titolo,
                    categoria,
                    listaIngredienti,
                    procedimento
                });
            } else {
                await addDoc(collection(db, "ricette"), {
                    titolo,
                    categoria,
                    listaIngredienti,
                    procedimento,
                    valutazione: 0,
                    creatore: savedUser,
                    creatoIl: new Date().toISOString()
                });
            }

            chiudi();
            const container = document.getElementById('ricette-content-root') || document.getElementById('content-area');
            await caricaEDisegnaRicette(container);
        } catch (err) {
            console.error("Errore salvataggio ricetta:", err);
            alert("Errore durante il salvataggio.");
        }
    });
}
