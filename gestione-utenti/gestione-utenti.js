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
                    <span class="user-role-badge ${ruolo}">${ruolo.toUpperCase()}</span>
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

// POP-UP MODALE PER CREARE O MODIFICARE UN UTENTE
function apriModaleUtente(utenteEsistente = null) {
    const isModifica = !!utenteEsistente;
    const modalId = 'modal-utente';

    const prevModal = document.getElementById(modalId);
    if (prevModal) prevModal.remove();

    const modalHtml = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content">
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

        const payload = {
            nome: nome,
            username: username,
            ruolo: ruolo,
            colore: colore
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
