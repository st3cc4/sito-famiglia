import { 
    collection, 
    getDocs, 
    setDoc, 
    updateDoc,
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
            const ruoloDb = u.ruolo || 'membro';
            const ruoloUtente = ruoloDb.charAt(0).toUpperCase() + ruoloDb.slice(1);
            const coloreUtente = u.colore || '#3b82f6';
            const passwordUtente = u.password || 'Non impostata';
            
            // Permessi di default: se non specificati, vedono tutto
            const permessi = u.permessi || { scadenze: true, impegni: true, media: true, ricette: true };
            const etichettePermessi = [
                permessi.scadenze ? 'Scadenze' : null,
                permessi.impegni ? 'Impegni' : null,
                permessi.media ? 'Foto/Video' : null,
                permessi.ricette ? 'Ricette' : null
            ].filter(Boolean).join(', ') || 'Nessuna sezione';

            const divUtente = document.createElement('div');
            divUtente.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 12px 16px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e2e8f0; border-left: 6px solid " + coloreUtente + "; flex-wrap: wrap; gap: 10px;";

            const puoEliminare = isAdminCorrente() && u.id.toLowerCase() !== (nomeUtenteCorrente || "").toLowerCase();

            divUtente.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <strong style="font-size: 1.05rem; color: #1e293b;">${escapeHtml(nomeUtente)}</strong>
                    <span style="font-size: 0.85rem; background: #e2e8f0; padding: 2px 8px; border-radius: 4px; color: #475569; font-weight: 600;">${escapeHtml(ruoloUtente)}</span>
                    <span style="font-size: 0.9rem; color: #64748b; background: #ffffff; padding: 2px 8px; border-radius: 4px; border: 1px solid #cbd5e1; display: flex; align-items: center; gap: 6px;">
                        Password: <strong id="pwd-text-${u.id}">${escapeHtml(passwordUtente)}</strong>
                        ${isAdminCorrente() ? `<button class="btn-modifica-pwd-admin" data-id="${u.id}" style="background-color: #0284c7; color: white; border: none; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; cursor: pointer; font-weight: 600;">Modifica</button>` : ''}
                    </span>
                    <span style="font-size: 0.85rem; color: #0f172a; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; border: 1px solid #cbd5e1;">
                        Vede: <strong>${etichettePermessi}</strong>
                        ${isAdminCorrente() ? `<button class="btn-modifica-permessi" data-id="${u.id}" style="background-color: #059669; color: white; border: none; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; cursor: pointer; font-weight: 600; margin-left: 6px;">Permessi</button>` : ''}
                    </span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    ${puoEliminare ? `
                        <button class="btn-elimina-utente" data-id="${u.id}" style="background-color: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; gap: 4px;" title="Elimina Utente">🗑️ Elimina</button>
                    ` : ''}
                </div>
            `;

            listaUtentiContainer.appendChild(divUtente);
        });

        // Gestione modifica password
        document.querySelectorAll('.btn-modifica-pwd-admin').forEach(btn => {
            btn.addEventListener('click', async () => {
                const idUtente = btn.getAttribute('data-id');
                const nuovaPwd = prompt("Inserisci la nuova password per l'utente:");
                if (nuovaPwd !== null && nuovaPwd.trim() !== "") {
                    try {
                        const userRef = doc(db, "utenti", idUtente);
                        await updateDoc(userRef, { password: nuovaPwd.trim() });
                        alert("Password aggiornata con successo!");
                        await caricaUtenti();
                    } catch (err) {
                        console.error("Errore aggiornamento password:", err);
                        alert("Errore durante l'aggiornamento della password.");
                    }
                }
            });
        });

        // Gestione modifica permessi
        document.querySelectorAll('.btn-modifica-permessi').forEach(btn => {
            btn.addEventListener('click', async () => {
                const idUtente = btn.getAttribute('data-id');
                const utenteTrovato = utenti.find(x => x.id === idUtente);
                if (!utenteTrovato) return;

                const vScadenze = confirm(`L'utente ${utenteTrovato.nome} può vedere le SCADENZE?\nOK = Sì | Annulla = No`);
                const vImpegni = confirm(`L'utente ${utenteTrovato.nome} può vedere gli IMPEGNI?\nOK = Sì | Annulla = No`);
                const vMedia = confirm(`L'utente ${utenteTrovato.nome} può vedere FOTO e VIDEO?\nOK = Sì | Annulla = No`);
                const vRicette = confirm(`L'utente ${utenteTrovato.nome} può vedere le RICETTE?\nOK = Sì | Annulla = No`);

                try {
                    const userRef = doc(db, "utenti", idUtente);
                    await updateDoc(userRef, {
                        permessi: {
                            scadenze: vScadenze,
                            impegni: vImpegni,
                            media: vMedia,
                            ricette: vRicette
                        }
                    });
                    alert("Permessi aggiornati con successo!");
                    await caricaUtenti();
                } catch (err) {
                    console.error("Errore aggiornamento permessi:", err);
                    alert("Errore durante l'aggiornamento dei permessi.");
                }
            });
        });

        // Gestione eliminazione utente
        document.querySelectorAll('.btn-elimina-utente').forEach(btn => {
            btn.addEventListener('click', async () => {
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

    // Gestione salvataggio nuovo utente
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
                await setDoc(doc(db, "utenti", idDoc), {
                    nome: nome,
                    password: password,
                    ruolo: ruolo,
                    colore: "#3b82f6",
                    permessi: {
                        scadenze: true,
                        impegni: true,
                        media: true,
                        ricette: true
                    }
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
