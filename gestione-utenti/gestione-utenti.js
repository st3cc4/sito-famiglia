// --- Import SDK Firebase ---
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

let listaUtenti = [];

// Funzione principale di inizializzazione della sezione Gestione Utenti
export async function initGestioneUtentiSection(container) {
    const savedUser = localStorage.getItem('famiglia_pwa_user') || sessionStorage.getItem('famiglia_pwa_user');
    const userData = savedUser ? JSON.parse(savedUser) : {};

    const isAdmin = (userData.ruolo === 'admin' || (userData.nome && userData.nome.toLowerCase() === 'paolo'));
    if (!isAdmin) {
        container.innerHTML = '<p style="color:red; text-align:center; padding: 20px;">Accesso negato. Sezione riservata all amministratore.</p>';
        return;
    }

    await caricaEDisegnaUtenti(container);
}

async function caricaEDisegnaUtenti(container) {
    container.innerHTML = `
        <div class="admin-container">
            <div class="admin-header">
                <h2><i class="fa-solid fa-users-gear"></i> GESTIONE UTENTI</h2>
                <button class="btn-add-user" id="btn-nuovo-utente">
                    <i class="fa-solid fa-user-plus"></i> Nuovo Utente
                </button>
            </div>
            <div class="utenti-grid" id="utenti-grid-container">
                <p style="color: #64748b;">Caricamento utenti in corso...</p>
            </div>
        </div>
    `;

    document.getElementById('btn-nuovo-utente').addEventListener('click', () => {
        apriModaleUtente();
    });

    const gridContainer = document.getElementById('utenti-grid-container');

    try {
        const utentiSnapshot = await getDocs(collection(db, "utenti"));
        listaUtenti = [];

        utentiSnapshot.forEach(docSnap => {
            listaUtenti.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        if (listaUtenti.length === 0) {
            gridContainer.innerHTML = '<p style="color: #64748b;">Nessun utente trovato nel database.</p>';
            return;
        }

        gridContainer.innerHTML = listaUtenti.map(u => {
            const iniziale = u.nome ? u.nome.charAt(0).toUpperCase() : 'U';
            const colore = u.colore || '#3498db';
            const ruolo = u.ruolo || 'utente';
            
            // Permessi schede (se non definiti, di default sono abilitati)
            const permessi = u.permessi || { scadenze: true, impegni: true, media: true, ricette: true };

            const schedeAbilitate = [
                permessi.scadenze !== false ? 'Scadenze' : null,
                permessi.impegni !== false ? 'Impegni' : null,
                permessi.media !== false ? 'Foto & Video' : null,
                permessi.ricette !== false ? 'Ricette' : null
            ].filter(Boolean);

            return `
                <div class="user-card" data-id="${u.id}">
                    <div class="user-card-header">
                        <div class="user-avatar-circle" style="background-color: ${colore};">
                            ${iniziale}
                        </div>
                        <div class="user-details">
                            <span class="user-name">${u.nome || 'Senza nome'}</span>
                            <span class="user-username">Username: ${u.username || '-'}</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                        <span class="user-role-badge ${ruolo}">${ruolo.toUpperCase()}</span>
                    </div>
                    
                    <div style="font-size: 0.78rem; color: #64748b; margin-top: 4px;">
                        <strong>Schede visibili:</strong>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                            ${schedeAbilitate.length > 0 
                                ? schedeAbilitate.map(s => `<span style="background-color: #f1f5f9; color: #334155; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">${s}</span>`).join('')
                                : '<span style="color: #94a3b8; font-style: italic;">Nessuna scheda abilitata</span>'}
                        </div>
                    </div>

                    <div class="user-card-actions">
                        <button class="btn-user-action edit" data-id="${u.id}" title="Modifica Utente">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-user-action delete" data-id="${u.id}" title="Elimina Utente">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Eventi per modifica ed eliminazione
        gridContainer.querySelectorAll('.btn-user-action.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idUtente = e.currentTarget.getAttribute('data-id');
                const utenteObj = listaUtenti.find(u => u.id === idUtente);
                if (utenteObj) apriModaleUtente(utenteObj);
            });
        });

        gridContainer.querySelectorAll('.btn-user-action.delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const idUtente = e.currentTarget.getAttribute('data-id');
                const utenteObj = listaUtenti.find(u => u.id === idUtente);
                
                if (utenteObj && utenteObj.nome && utenteObj.nome.toLowerCase() === 'paolo') {
                    alert("Impossibile eliminare l'account Amministratore principale!");
                    return;
                }

                if (confirm(`Sei sicuro di voler eliminare l'utente "${utenteObj ? utenteObj.nome : ''}"?`)) {
                    try {
                        await deleteDoc(doc(db, "utenti", idUtente));
                        const contentArea = document.getElementById('content-area');
                        await caricaEDisegnaUtenti(contentArea);
                    } catch (err) {
                        console.error("Errore cancellazione utente:", err);
                        alert("Impossibile eliminare l'utente.");
                    }
                }
            });
        });

    } catch (err) {
        console.error("Errore caricamento utenti da Firestore:", err);
        gridContainer.innerHTML = '<p style="color: red;">Errore durante il caricamento degli utenti.</p>';
    }
}

// POP-UP MODALE PER CREARE O MODIFICARE UN UTENTE CON SELEZIONE SCHEDE
function apriModaleUtente(utenteEsistente = null) {
    const isModifica = !!utenteEsistente;
    const modalId = 'modal-utente';

    const prevModal = document.getElementById(modalId);
    if (prevModal) prevModal.remove();

    const permessiObj = (utenteEsistente && utenteEsistente.permessi) ? utenteEsistente.permessi : {
        scadenze: true,
        impegni: true,
        media: true,
        ricette: true
    };

    const modalHtml = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content" style="max-width: 480px;">
                <div class="modal-header">
                    <h3>${isModifica ? 'Modifica Utente' : 'Nuovo Utente'}</h3>
                    <button class="btn-close-modal" id="btn-close-modal">&times;</button>
                </div>
                <form id="form-utente">
                    <div class="form-group">
                        <label for="usr-nome">Nome Completo</label>
                        <input type="text" id="usr-nome" value="${isModifica ? (utenteEsistente.nome || '') : ''}" required placeholder="Es. Elena">
                    </div>
                    <div class="form-group">
                        <label for="usr-username">Username (Login)</label>
                        <input type="text" id="usr-username" value="${isModifica ? (utenteEsistente.username || '') : ''}" required placeholder="Es. elena">
                    </div>
                    <div class="form-group">
                        <label for="usr-password">Password ${isModifica ? '(Lascia vuoto per non modificare)' : ''}</label>
                        <input type="password" id="usr-password" ${isModifica ? '' : 'required'} placeholder="Password di accesso">
                    </div>
                    <div class="form-group">
                        <label for="usr-ruolo">Ruolo</label>
                        <select id="usr-ruolo">
                            <option value="utente" ${isModifica && utenteEsistente.ruolo === 'utente' ? 'selected' : ''}>Utente</option>
                            <option value="admin" ${isModifica && utenteEsistente.ruolo === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="usr-colore">Colore Distintivo</label>
                        <div class="color-picker-wrapper">
                            <input type="color" id="usr-colore" class="color-picker-input" value="${isModifica ? (utenteEsistente.colore || '#3498db') : '#e74c3c'}">
                            <span style="font-size: 0.85rem; color: #64748b;">Scegli il colore identificativo</span>
                        </div>
                    </div>

                    <!-- SELEZIONE SCHEDE ACCESSIBILI -->
                    <div class="form-group" style="margin-top: 10px; background-color: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <label style="margin-bottom: 8px; display: block; color: #2b3e50;">Schede Visibili</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.88rem;">
                            <label style="font-weight: normal; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <input type="checkbox" id="perm-scadenze" ${permessiObj.scadenze !== false ? 'checked' : ''}> Scadenze
                            </label>
                            <label style="font-weight: normal; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <input type="checkbox" id="perm-impegni" ${permessiObj.impegni !== false ? 'checked' : ''}> Impegni
                            </label>
                            <label style="font-weight: normal; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <input type="checkbox" id="perm-media" ${permessiObj.media !== false ? 'checked' : ''}> Foto & Video
                            </label>
                            <label style="font-weight: normal; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <input type="checkbox" id="perm-ricette" ${permessiObj.ricette !== false ? 'checked' : ''}> Ricette
                            </label>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn-modal cancel" id="btn-cancel-modal">Annulla</button>
                        <button type="submit" class="btn-modal save">Salva</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalEl = document.getElementById(modalId);
    const btnClose = document.getElementById('btn-close-modal');
    const btnCancel = document.getElementById('btn-cancel-modal');
    const form = document.getElementById('form-utente');

    const chiudiModale = () => modalEl.remove();

    btnClose.addEventListener('click', chiudiModale);
    btnCancel.addEventListener('click', chiudiModale);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.getElementById('usr-nome').value.trim();
        const username = document.getElementById('usr-username').value.trim().toLowerCase();
        const password = document.getElementById('usr-password').value;
        const ruolo = document.getElementById('usr-ruolo').value;
        const colore = document.getElementById('usr-colore').value;

        const permessi = {
            scadenze: document.getElementById('perm-scadenze').checked,
            impegni: document.getElementById('perm-impegni').checked,
            media: document.getElementById('perm-media').checked,
            ricette: document.getElementById('perm-ricette').checked
        };

        const payload = {
            nome: nome,
            username: username,
            ruolo: ruolo,
            colore: colore,
            permessi: permessi
        };

        if (password) {
            payload.password = password;
        }

        try {
            if (isModifica) {
                await updateDoc(doc(db, "utenti", utenteEsistente.id), payload);
            } else {
                await addDoc(collection(db, "utenti"), payload);
            }

            chiudiModale();
            const contentArea = document.getElementById('content-area');
            await caricaEDisegnaUtenti(contentArea);

        } catch (err) {
            console.error("Errore salvataggio utente:", err);
            alert("Si è verificato un errore durante il salvataggio dell'utente.");
        }
    });
}
