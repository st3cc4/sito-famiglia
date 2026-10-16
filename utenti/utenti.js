import { 
    collection, 
    getDocs, 
    setDoc, 
    deleteDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "../firebase-config.js";
import { isAdminCorrente, nomeUtenteCorrente } from "../auth.js";

export async function caricaUtenti() {
    const listaUtentiContainer = document.getElementById('lista-utenti');
    const formNuovoUtente = document.getElementById('form-nuovo-utente');
    const formNuovoUtenteContainer = document.getElementById('form-nuovo-utente-container');

    if (!listaUtentiContainer) return;

    // Mostra o nasconde il form di creazione utente in base ai permessi Admin
    if (formNuovoUtenteContainer) {
        formNuovoUtenteContainer.style.display = isAdminCorrente() ? 'block' : 'none';
    }

    try {
        const querySnapshot = await getDocs(collection(db, "utenti"));
        let utenti = [];

        querySnapshot.forEach((docSnap) => {
            utenti.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        listaUtentiContainer.innerHTML = '';

        if (utenti.length === 0) {
            listaUtentiContainer.innerHTML = '<p class="text-muted">Nessun utente registrato.</p>';
            return;
        }

        utenti.forEach((u) => {
            const nomeUtente = u.nome || u.id;
            const ruoloUtente = u.ruolo || 'membro';
            const coloreUtente = u.colore || '#3b82f6';
            const passwordUtente = u.password || 'Non impostata';

            const divUtente = document.createElement('div');
            divUtente.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 12px 16px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e2e8f0; border-left: 6px solid " + coloreUtente + ";";

            // Solo l'admin o l'utente stesso possono eliminare (ma l'admin non può eliminare se stesso per sicurezza)
            const puoEliminare = isAdminCorrente() && u.id.toLowerCase() !== (nomeUtenteCorrente || "").toLowerCase();

            divUtente.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <strong style="font-size: 1.05rem; color: #1e293b;">${escapeHtml(nomeUtente)}</strong>
                    <span style="font-size: 0.85rem; background: #e2e8f0; padding: 2px 8px; border-radius: 4px; color: #475569; font-weight: 600;">${escapeHtml(ruoloUtente)}</span>
                    <span style="font-size: 0.9rem; color: #64748b; background: #ffffff; padding: 2px 8px; border-radius: 4px; border: 1px solid #cbd5e1;">Password: <strong>${escapeHtml(passwordUtente)}</strong></span>
                </div>
                <div>
                    ${puoEliminare ? `
                        <button class="btn-elimina-utente" data-id="${u.id}" style="background-color: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem;" title="Elimina Utente">🗑️</button>
                    ` : ''}
                </div>
            `;

            listaUtentiContainer.appendChild(divUtente);
        });

        // Gestione eventi pulsante elimina utente
        document.querySelectorAll('.btn-elimina-utente').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const idUtente = btn.getAttribute('data-id');
                if (confirm(`Sei sicuro di voler eliminare l'utente "${idUtente}"?`)) {
                    try {
                        await deleteDoc(doc(db, "utenti", idUtente));
                        await caricaUtenti();
                    } catch (err) {
                        console.error("Errore eliminazione utente:", err);
                        alert("Errore durante l'eliminazione dell'utente.");
                    }
                }
            });
        });

    } catch (err) {
        console.error("Errore nel caricamento degli utenti:", err);
    }

    // Gestione salvataggio nuovo utente (senza color picker)
    if (formNuovoUtente && !formNuovoUtente.dataset.listenerAggiunto) {
        formNuovoUtente.dataset.listenerAggiunto = "true";
        formNuovoUtente.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nomeInput = document.getElementById('nuovo-utente-nome');
            const passwordInput = document.getElementById('nuovo-utente-password');
            const ruoloSelect = document.getElementById('nuovo-utente-ruolo');

            if (!nomeInput || !passwordInput || !ruoloSelect) return;

            const nome = nomeInput.value.trim();
            const password = passwordInput.value.trim();
            const ruolo = ruoloSelect.value;
            const idDoc = nome.toLowerCase();

            if (!nome || !password) return;

            try {
                // Salviamo l'utente con un colore predefinito iniziale (es. #3b82f6), che poi l'utente potrà cambiare autonomamente
                await setDoc(doc(db, "utenti", idDoc), {
                    nome: nome,
                    password: password,
                    ruolo: ruolo,
                    colore: "#3b82f6"
                });

                formNuovoUtente.reset();
                await caricaUtenti();
                alert("Utente aggiunto con successo!");

            } catch (err) {
                console.error("Errore salvataggio nuovo utente:", err);
                alert("Errore durante il salvataggio dell'utente.");
            }
        });
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
