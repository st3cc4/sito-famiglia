// js/scadenze.js - Gestione Scadenze, Logica Intelligente e Card in Verticale

import { db } from "./firebase-config.js";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const containerScadenze = document.getElementById('container-scadenze');
const containerHomeScadenze = document.getElementById('container-home-scadenze');
const modalScadenza = document.getElementById('modal-scadenza');
const btnAddScadenza = document.getElementById('btn-add-scadenza');
const btnCloseModalScadenza = document.getElementById('btn-close-modal-scadenza');
const formScadenza = document.getElementById('form-scadenza');

let tutteLeScadenze = [];

export function initScadenze(getUtenteCorrente) {
    if (btnAddScadenza) {
        btnAddScadenza.addEventListener('click', () => {
            if (modalScadenza) modalScadenza.classList.add('active');
        });
    }

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

            const titolo = document.getElementById('scadenza-titolo').value.trim();
            const data = document.getElementById('scadenza-data').value;
            const importo = document.getElementById('scadenza-importo').value;

            try {
                await addDoc(collection(db, "scadenze"), {
                    titolo,
                    data,
                    importo: importo ? parseFloat(importo) : 0,
                    creatoDa: utente.nome,
                    creatoDaId: utente.id
                });

                formScadenza.reset();
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
    });
}

function renderizzaScadenzeNormali() {
    if (!containerScadenze) return;
    containerScadenze.innerHTML = '';

    // Forza il layout in colonna verticale perfetto per i telefoni
    containerScadenze.style.display = 'flex';
    containerScadenze.style.flexDirection = 'column';
    containerScadenze.style.gap = '15px';

    if (tutteLeScadenze.length === 0) {
        containerScadenze.innerHTML = '<p style="color: #777;">Nessuna scadenza presente.</p>';
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

        let testoScadenza = '';
        if (diffGiorni < 0) {
            testoScadenza = `Scaduta da ${Math.abs(diffGiorni)} giorni (${item.data})`;
        } else if (diffGiorni === 0) {
            testoScadenza = `Scade OGGI (${item.data})`;
        } else {
            testoScadenza = `Scade tra ${diffGiorni} giorni (${item.data})`;
        }

        card.innerHTML = `
            <div class="item-title" style="font-size: 1.1rem; font-weight: bold; margin-bottom: 6px;">${item.titolo}</div>
            <div class="item-info" style="margin-bottom: 4px;">⏰ ${testoScadenza}</div>
            ${item.importo ? `<div class="item-info" style="margin-bottom: 4px;">💶 Importo: € ${item.importo.toFixed(2)}</div>` : ''}
            <div class="item-info" style="margin-bottom: 10px;">👤 Creato da: ${item.creatoDa || 'Famiglia'}</div>
            <button type="button" class="cancel-btn" style="padding: 8px 14px; font-size: 0.9rem; cursor: pointer; border-radius: 6px; border: none;" data-id="${item.id}">Elimina</button>
        `;

        card.querySelector('button').addEventListener('click', async () => {
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
            <div class="item-title">${item.titolo}</div>
            <div class="item-info">⏰ ${testoScadenza}</div>
            ${item.importo ? `<div class="item-info">💶 € ${item.importo.toFixed(2)}</div>` : ''}
        `;

        containerHomeScadenze.appendChild(card);
    });
}
