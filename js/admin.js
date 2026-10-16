// js/admin.js - Gestione Pannello Amministratore e Permessi Utenti

import { db } from "./firebase-config.js";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const btnAdminPanel = document.getElementById('btn-admin-panel');
const modalAdmin = document.getElementById('modal-admin');
const btnCloseModalAdmin = document.getElementById('btn-close-modal-admin');
const formAdminUser = document.getElementById('form-admin-user');
const btnAdminReset = document.getElementById('btn-admin-reset');
const adminUsersList = document.getElementById('admin-users-list');

// Voci di menu per i permessi
const navItemImpegni = document.getElementById('nav-item-impegni');
const navItemScadenze = document.getElementById('nav-item-scadenze');
const navItemRicette = document.getElementById('nav-item-ricette');
const navItemMedia = document.getElementById('nav-item-media');

export function initAdmin(getUtenteCorrente, onPermessiAggiornati) {
    if (btnAdminPanel) {
        btnAdminPanel.addEventListener('click', () => {
            caricaGestioneUtentiAdmin();
            if (modalAdmin) modalAdmin.classList.add('active');
        });
    }

    if (btnCloseModalAdmin) {
        btnCloseModalAdmin.addEventListener('click', () => {
            if (modalAdmin) modalAdmin.classList.remove('active');
        });
    }

    if (btnAdminReset) {
        btnAdminReset.addEventListener('click', () => {
            formAdminUser.reset();
            document.getElementById('admin-user-id').value = '';
            document.getElementById('perm-impegni').checked = true;
            document.getElementById('perm-scadenze').checked = true;
            document.getElementById('perm-ricette').checked = true;
            document.getElementById('perm-media').checked = true;
        });
    }

    if (formAdminUser) {
        formAdminUser.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('admin-user-id').value;
            const nome = document.getElementById('admin-user-name').value.trim();
            const password = document.getElementById('admin-user-pwd').value.trim();
            const colore = document.getElementById('admin-user-color').value;
            const ruolo = document.getElementById('admin-user-role').value;

            const permessi = {
                impegni: document.getElementById('perm-impegni').checked,
                scadenze: document.getElementById('perm-scadenze').checked,
                ricette: document.getElementById('perm-ricette').checked,
                media: document.getElementById('perm-media').checked
            };

            const userData = { nome, password, colore, ruolo, permessi };

            try {
                if (id) {
                    await updateDoc(doc(db, "utenti", id), userData);
                } else {
                    await addDoc(collection(db, "utenti"), userData);
                }

                btnAdminReset.click();
                alert("Utente salvato con successo!");
            } catch (err) {
                console.error("Errore salvataggio utente Admin:", err);
                alert("Errore durante il salvataggio dell'utente.");
            }
        });
    }
}

export function applicaPermessiSezioni(permessi) {
    const p = permessi || { impegni: true, scadenze: true, ricette: true, media: true };

    if (navItemImpegni) navItemImpegni.style.display = p.impegni ? "flex" : "none";
    if (navItemScadenze) navItemScadenze.style.display = p.scadenze ? "flex" : "none";
    if (navItemRicette) navItemRicette.style.display = p.ricette ? "flex" : "none";
    if (navItemMedia) navItemMedia.style.display = p.media ? "flex" : "none";
}

function caricaGestioneUtentiAdmin() {
    if (!adminUsersList) return;

    onSnapshot(collection(db, "utenti"), (snapshot) => {
        adminUsersList.innerHTML = '';
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            const nome = data.nome || id;

            const item = document.createElement('div');
            item.className = 'admin-user-item';
            item.innerHTML = `
                <div>
                    <strong style="color: ${data.colore || '#333'}">${nome}</strong> 
                    <small>(${data.ruolo || 'utente'})</small>
                </div>
                <div class="admin-user-actions">
                    <button type="button" class="sm-btn edit-btn">Modifica</button>
                    <button type="button" class="sm-btn del-btn">Elimina</button>
                </div>
            `;

            // Modifica utente
            item.querySelector('.edit-btn').addEventListener('click', () => {
                document.getElementById('admin-user-id').value = id;
                document.getElementById('admin-user-name').value = nome;
                document.getElementById('admin-user-pwd').value = data.password || '';
                document.getElementById('admin-user-color').value = data.colore || '#4A90E2';
                document.getElementById('admin-user-role').value = data.ruolo || 'utente';

                const p = data.permessi || { impegni: true, scadenze: true, ricette: true, media: true };
                document.getElementById('perm-impegni').checked = !!p.impegni;
                document.getElementById('perm-scadenze').checked = !!p.scadenze;
                document.getElementById('perm-ricette').checked = !!p.ricette;
                document.getElementById('perm-media').checked = !!p.media;
            });

            // Elimina utente
            item.querySelector('.del-btn').addEventListener('click', async () => {
                if (confirm(`Sei sicuro di voler eliminare l'utente "${nome}"?`)) {
                    try {
                        await deleteDoc(doc(db, "utenti", id));
                    } catch (err) {
                        console.error("Errore eliminazione utente:", err);
                    }
                }
            });

            adminUsersList.appendChild(item);
        });
    });
}
