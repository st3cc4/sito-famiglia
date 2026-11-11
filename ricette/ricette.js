function apriModaleFormRicetta() {
    const savedUser = localStorage.getItem('sitoFamiglia_user') || 'Utente';
    const modalId = 'modal-form-ricetta';
    const prev = document.getElementById(modalId);
    if (prev) prev.remove();

    const optionsCatHtml = categorieEsistenti.map(c => `<option value="${c}">${c}</option>`).join('') + `<option value="__NUOVA__">+ Aggiungi nuova categoria...</option>`;

    const html = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Nuova Ricetta</h3>
                    <button class="btn-close-modal" id="btn-close-form">&times;</button>
                </div>
                <form id="form-ricetta">
                    <div class="form-group">
                        <label for="ric-titolo">Titolo Ricetta</label>
                        <input type="text" id="ric-titolo" required placeholder="Es. Torta di mele">
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
                        <label style="font-weight: 700; color: #1e293b; font-size: 0.85rem; margin-bottom: 2px; display: block;">Ingredienti</label>
                        <div id="container-ingredienti-dinamici" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 4px;">
                            <!-- Generato via JS -->
                        </div>
                        <button type="button" id="btn-aggiungi-ingrediente-riga" style="background: none; border: none; color: #2563eb; font-weight: 600; cursor: pointer; padding: 0; text-align: left; font-size: 0.78rem;">
                            + Aggiungi ingrediente
                        </button>
                    </div>

                    <div class="form-group" style="margin-top: 10px;">
                        <label style="font-weight: 700; color: #1e293b; font-size: 0.85rem; margin-bottom: 2px; display: block;">Procedimento</label>
                        <div id="container-procedimento-dinamico" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 4px;">
                            <!-- Generato via JS -->
                        </div>
                        <button type="button" id="btn-aggiungi-proc-riga" style="background: none; border: none; color: #2563eb; font-weight: 600; cursor: pointer; padding: 0; text-align: left; font-size: 0.78rem;">
                            + Aggiungi passaggio
                        </button>
                    </div>

                    <div class="modal-footer" style="margin-top: 14px; display: flex; justify-content: flex-end; gap: 6px;">
                        <button type="button" class="btn-modal cancel" id="btn-cancel-ricetta">Annulla</button>
                        <button type="submit" class="btn-modal save" id="btn-save-ricetta">Salva Ricetta</button>
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
            <input type="text" class="ing-nome" placeholder="Ingrediente" value="${nomeVal}" style="flex: 2; padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.8rem;">
            <input type="text" class="ing-quantita" placeholder="Qtà" value="${quantitaVal}" style="flex: 1; padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.8rem;">
            <button type="button" class="btn-rimuovi-riga" style="background: none; border: none; color: #dc3545; cursor: pointer; padding: 4px; font-size: 0.8rem;"><i class="fa-solid fa-trash"></i></button>
        `;
        row.querySelector('.btn-rimuovi-riga').addEventListener('click', () => row.remove());
        containerIng.appendChild(row);
    }

    function aggiungiRigaProcedimento(testoVal = '') {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; gap: 6px; align-items: center; width: 100%;';
        row.innerHTML = `
            <input type="text" class="proc-testo" placeholder="Passaggio..." value="${testoVal}" style="flex: 1; padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.8rem;">
            <button type="button" class="btn-rimuovi-riga" style="background: none; border: none; color: #dc3545; cursor: pointer; padding: 4px; font-size: 0.8rem;"><i class="fa-solid fa-trash"></i></button>
        `;
        row.querySelector('.btn-rimuovi-riga').addEventListener('click', () => row.remove());
        containerProc.appendChild(row);
    }

    // 2 righe iniziali per compattezza ottimale su mobile
    for (let i = 0; i < 2; i++) {
        aggiungiRigaIngrediente();
        aggiungiRigaProcedimento();
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
            await addDoc(collection(db, "ricette"), {
                titolo,
                categoria,
                listaIngredienti,
                procedimento,
                creatore: savedUser,
                creatoIl: new Date().toISOString()
            });

            chiudi();
            const container = document.getElementById('ricette-content-root') || document.getElementById('content-area');
            await caricaEDisegnaRicette(container);
        } catch (err) {
            console.error("Errore salvataggio ricetta:", err);
            alert("Errore durante il salvataggio.");
        }
    });
}
