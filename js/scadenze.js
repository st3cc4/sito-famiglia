// js/scadenze.js - Gestione Scadenze con Importo in Alto a Destra e Layout Ottimizzato

import { db } from "./firebase-config.js";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { mostraSezione } from "./navigation.js";

const containerScadenze = document.getElementById('container-scadenze');
const containerHomeScadenze = document.getElementById('container-home-scadenze');
const modalScadenza = document.getElementById('modal-scadenza');
const btnCloseModalScadenza = document.getElementById('btn-close-modal-scadenza');
const formScadenza = document.getElementById('form-scadenza');
const inputEditId = document.getElementById('scadenza-edit-id');
const modalScadenzaTitoloTesto = document.getElementById('modal-scadenza-titolo-testo');
const scadenzeTotaleImporto = document.getElementById('scadenze-totale-importo');

let tutteLeScadenze = [];

export function initScadenze(getUtenteCorrente) {
    if (btnCloseModalScadenza) {
        btnCloseModalScadenza.addEventListener('click', () => {
            if (modalScadenza) modalScadenza.classList.remove('active');
        });
    }

    if (formScadenza) {
        formScadenza.addEventListener('submit', async (e) => {
            e.preventDefault();
            const utente = getUtenteCorrente();
            if (!utente) return;

            const editId = inputEditId ? inputEditId.value : "";
            const titolo = document.getElementById('scadenza-titolo').value.trim();
            const data = document.getElementById('scadenza-data').value;
            const importo = document.getElementById('scadenza-importo').value;

            try {
                if (editId) {
                    const scadRef = doc(db, "scadenze", editId);
                    await updateDoc(scadRef, {
                        titolo,
                        data,
                        importo: importo ? parseFloat(importo) : 0
                    });
                } else {
                    await addDoc(collection(db, "scadenze"), {
                        titolo,
                        data,
                        importo: importo ? parseFloat(importo) : 0,
                        creatoDa: utente.nome,
                        creatoDaId: utente.id
                    });
                }

                formScadenza.reset();
                if (inputEditId) inputEditId.value = "";
                if (modalScadenza) modalScadenza.classList.remove('active');
            } catch (err) {
                console.error("Errore salvataggio scadenza:", err);
                alert("Errore durante il salvataggio della scadenza.");
            }
        });
    }

    ascoltaScadenzeFirestore();
}

function ascoltaScadenzeFirestore() {
    onSnapshot(collection(db, "scadenze"), (snapshot) => {
        tutteLeScadenze = [];
        snapshot.forEach((docSnap) => {
            tutteLeScadenze.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        tutteLeScadenze.sort((a, b) => new Date(a.data) - new Date(b.data));

        renderizzaScadenzeNormali();
        renderizzaScadenzeHomeIntelligente();
        calcolaEmostraTotale();
    });
}

function calcolaEmostraTotale() {
    if (!scadenzeTotaleImporto) return;

    let totale = 0;
    tutteLeScadenze.forEach((item) => {
        if (item.importo) {
            totale += parseFloat(item.importo);
        }
    });

    scadenzeTotaleImporto.textContent = `€ ${totale.toFixed(2)}`;
}

function renderizzaScadenzeNormali() {
    if (!containerScadenze) return;
    containerScadenze.innerHTML = '';

    const sectionScadenze = document.getElementById('section-scadenze');
    let sectionHeader = sectionScadenze.querySelector('.section-header');
    
    if (sectionHeader) {
        sectionHeader.innerHTML = `
            <button id="btn-torna-home-scadenze" class="cancel-btn" style="padding: 10px 16px; font-weight: bold; cursor: pointer; border-radius: 8px;">← Torna alla Home</button>
            <button id="btn-add-scadenza-custom" class="add-btn" style="padding: 10px 18px; font-weight: bold; cursor: pointer; border-radius: 8px;">Nuova Scadenza</button>
        `;

        document.getElementById('btn-torna-home-scadenze').addEventListener('click', () => {
            mostraSezione('home');
        });

        document.getElementById('btn-add-scadenza-custom').addEventListener('click', () => {
            if (formScadenza) formScadenza.reset();
            if (inputEditId) inputEditId.value = "";
            if (modalScadenzaTitoloTesto) modalScadenzaTitoloTesto.textContent = "Nuova Scadenza";
            if (modalScadenza) modalScadenza.classList.add('active');
        });
    }

    containerScadenze.style.display = 'flex';
    containerScadenze.style.flexDirection = 'column';
    containerScadenze.style.gap = '15px';
    containerScadenze.style.marginTop = '20px';

    if (tutteLeScadenze.length === 0) {
        containerScadenze.innerHTML = '<p style="color: #777; font-size: 1.1rem; font-weight: bold;">Nessuna scadenza presente.</p>';
        return;
    }

    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    tutteLeScadenze.forEach((item) => {
        const dataScad = new Date(item.data);
        dataScad.setHours(0, 0, 0, 0);

        const diffTempo = dataScad - oggi;
        const diffGiorni = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

        let urgenza = 'verde';
        if (diffGiorni <= 7) {
            urgenza = 'rossa';
        } else if (diffGiorni >= 8 && diffGiorni <= 14) {
            urgenza = 'arancione';
        }

        const card = document.createElement('div');
        card.className = `home-item-card urgente-${urgenza}`;
        card.style.width = '100%';
        card.style.boxSizing = 'border-box';
        card.style.padding = '18px';
        card.style.borderRadius = '12px';
        card.style.boxShadow = '0 4px 10px rgba(0,0,0,0.08)';

        let testoScadenza = '';
        if (diffGiorni < 0) {
            testoScadenza = `Scaduta da ${Math.abs(diffGiorni)} giorni (${item.data})`;
        } else if (diffGiorni === 0) {
            testoScadenza = `Scade OGGI (${item.data})`;
        } else {
            testoScadenza = `Scade tra ${diffGiorni} giorni (${item.data})`;
        }

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div class="item-title" style="font-size: 1.3rem; font-weight: 800; color: #222; margin: 0;">${item.titolo}</div>
                ${item.importo ? `<div style="font-size: 1.2rem; font-weight: 800; color: #27ae60; background: #e8f8f5; padding: 4px 10px; border-radius: 8px;">💶 € ${item.importo.toFixed(2)}</div>` : ''}
            </div>
            <div class="item-info" style="font-size: 1.1rem; font-weight: bold; margin-bottom: 6px; color: #444;">⏰ ${testoScadenza}</div>
            <div class="item-info" style="font-size: 1rem; font-weight: bold; margin-bottom: 14px; color: #555;">👤 Creato da: ${item.creatoDa || 'Famiglia'}</div>
            
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button type="button" class="btn-edit-custom" style="background-color: #2980b9; color: white; padding: 10px; font-size: 1rem; font-weight: bold; cursor: pointer; border-radius: 8px; border: none; flex: 1;" data-id="${item.id}">Modifica</button>
                <button type="button" class="btn-delete-custom" style="background-color: #e74c3c; color: white; padding: 10px; font-size: 1rem; font-weight: bold; cursor: pointer; border-radius: 8px; border: none; flex: 1;" data-id="${item.id}">Elimina</button>
            </div>
        `;

        card.querySelector('.btn-edit-custom').addEventListener('click', () => {
            if (inputEditId) inputEditId.value = item.id;
            document.getElementById('scadenza-titolo').value = item.titolo || '';
            document.getElementById('scadenza-data').value = item.data || '';
            document.getElementById('scadenza-importo').value = item.importo || '';
            
            if (modalScadenzaTitoloTesto) modalScadenzaTitoloTesto.textContent = "Modifica Scadenza";
            if (modalScadenza) modalScadenza.classList.add('active');
        });

        card.querySelector('.btn-delete-custom').addEventListener('click', async () => {
            if (confirm(`Vuoi eliminare la scadenza "${item.titolo}"?`)) {
                try {
                    await deleteDoc(doc(db, "scadenze", item.id));
                } catch (err) {
                    console.error("Errore eliminazione scadenza:", err);
                }
            }
        });

        containerScadenze.appendChild(card);
    });
}

function renderizzaScadenzeHomeIntelligente() {
    if (!containerHomeScadenze) return;
    containerHomeScadenze.innerHTML = '';

    if (tutteLeScadenze.length === 0) {
        containerHomeScadenze.innerHTML = '<p style="color: #777; font-size: 0.9rem;">Nessuna scadenza in programma.</p>';
        return;
    }

    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    let scadenzeRosse = [];
    let scadenzeArancioni = [];
    let scadenzeVerdi = [];

    tutteLeScadenze.forEach((item) => {
        const dataScad = new Date(item.data);
        dataScad.setHours(0, 0, 0, 0);

        const diffTempo = dataScad - oggi;
        const diffGiorni = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

        if (diffGiorni <= 7) {
            scadenzeRosse.push({ ...item, urgenza: 'rossa', giorni: diffGiorni });
        } else if (diffGiorni >= 8 && diffGiorni <= 14) {
            scadenzeArancioni.push({ ...item, urgenza: 'arancione', giorni: diffGiorni });
        } else {
            scadenzeVerdi.push({ ...item, urgenza: 'verde', giorni: diffGiorni });
        }
    });

    let gruppoDaMostrare = [];
    if (scadenzeRosse.length > 0) {
        gruppoDaMostrare = scadenzeRosse;
    } else if (scadenzeArancioni.length > 0) {
        gruppoDaMostrare = scadenzeArancioni;
    } else {
        gruppoDaMostrare = scadenzeVerdi;
    }

    gruppoDaMostrare.forEach((item) => {
        const card = document.createElement('div');
        card.className = `home-item-card urgente-${item.urgenza}`;

        let testoScadenza = '';
        if (item.giorni < 0) {
            testoScadenza = `Scaduta da ${Math.abs(item.giorni)} giorni (${item.data})`;
        } else if (item.giorni === 0) {
            testoScadenza = `Scade OGGI (${item.data})`;
        } else {
            testoScadenza = `Scade tra ${item.giorni} giorni (${item.data})`;
        }

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <div class="item-title" style="margin: 0;">${item.titolo}</div>
                ${item.importo ? `<div style="font-weight: 800; color: #27ae60; font-size: 1rem;">💶 € ${item.importo.toFixed(2)}</div>` : ''}
            </div>
            <div class="item-info">⏰ ${testoScadenza}</div>
        `;

        containerHomeScadenze.appendChild(card);
    });
}
