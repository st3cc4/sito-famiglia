// js/app.js - Logica principale dell'applicazione

import { db } from "./firebase-config.js";
import { 
    collection, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- STATO APPLICAZIONE ---
let utenteCorrente = null;

// --- ELEMENTI DOM ---
const btnToggleMenu = document.getElementById('btn-toggle-menu');
const btnCloseMenu = document.getElementById('btn-close-menu');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.app-section');
const headerTitle = document.getElementById('header-title');

const userBadge = document.getElementById('user-badge');
const userNameDisplay = document.getElementById('user-name-display');
const btnLogout = document.getElementById('btn-logout');

const modalUtenti = document.getElementById('modal-utenti');
const utentiList = document.getElementById('utenti-list');
const btnCloseModalUtenti = document.getElementById('btn-close-modal-utenti');

const containerImpegni = document.getElementById('container-impegni');
const containerScadenze = document.getElementById('container-scadenze');
const containerRicette = document.getElementById('container-ricette');

// --- GESTIONE SIDEBAR MENU ---
function openMenu() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
}

function closeMenu() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
}

btnToggleMenu.addEventListener('click', openMenu);
btnCloseMenu.addEventListener('click', closeMenu);
overlay.addEventListener('click', closeMenu);

// --- NAVIGAZIONE TRA LE SEZIONI ---
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetSection = link.getAttribute('data-section');

        // Aggiorna link attivo nel menu
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        // Mostra la sezione selezionata
        sections.forEach(section => {
            if (section.id === `section-${targetSection}`) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        // Aggiorna titolo header
        switch(targetSection) {
            case 'impegni': headerTitle.textContent = "📅 Appuntamenti"; break;
            case 'scadenze': headerTitle.textContent = "⏰ Scadenze"; break;
            case 'ricette': headerTitle.textContent = "🍳 Ricette"; break;
            case 'media': headerTitle.textContent = "🖼️ Foto e Video"; break;
        }

        closeMenu();
    });
});

// --- GESTIONE MODALE UTENTI ---
function openModalUtenti() {
    modalUtenti.classList.add('active');
}

function closeModalUtenti() {
    modalUtenti.classList.remove('active');
}

userBadge.addEventListener('click', openModalUtenti);
btnLogout.addEventListener('click', () => {
    closeMenu();
    openModalUtenti();
});
btnCloseModalUtenti.addEventListener('click', closeModalUtenti);

// --- CARICAMENTO UTENTI DA FIRESTORE ---
function caricaUtenti() {
    onSnapshot(collection(db, "utenti"), (snapshot) => {
        utentiList.innerHTML = '';
        snapshot.forEach((doc) => {
            const data = doc.data();
            const btn = document.createElement('button');
            btn.className = 'utente-btn';
            btn.textContent = data.nome || doc.id;
            
            if (data.colore) {
                btn.style.borderLeft = `6px solid ${data.colore}`;
            }

            btn.addEventListener('click', () => {
                selezionaUtente(data.nome || doc.id, data.colore);
                closeModalUtenti();
            });

            utentiList.appendChild(btn);
        });
    });
}

function selezionaUtente(nome, colore) {
    utenteCorrente = { nome, colore };
    userNameDisplay.textContent = nome;
    if (colore) {
        userBadge.style.backgroundColor = colore;
    }
}

// --- CARICAMENTO DATI REALTIME DA FIRESTORE ---

// 1. Caricamento Appuntamenti / Impegni
function ascoltaImpegni() {
    onSnapshot(collection(db, "appuntamenti"), (snapshot) => {
        containerImpegni.innerHTML = '';
        if (snapshot.empty) {
            containerImpegni.innerHTML = '<p class="card-meta">Nessun impegno trovato.</p>';
            return;
        }
        snapshot.forEach((doc) => {
            const item = doc.data();
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-title">${item.titolo || 'Senza Titolo'}</div>
                <div class="card-meta">📅 Data: ${item.data || 'N/D'} (${item.oraInizio || ''} - ${item.oraFine || ''})</div>
                <div class="card-meta">👤 Creato da: ${item.creatore || 'Sconosciuto'}</div>
            `;
            containerImpegni.appendChild(card);
        });
    });
}

// 2. Caricamento Scadenze
function ascoltaScadenze() {
    onSnapshot(collection(db, "scadenze"), (snapshot) => {
        containerScadenze.innerHTML = '';
        if (snapshot.empty) {
            containerScadenze.innerHTML = '<p class="card-meta">Nessuna scadenza trovata.</p>';
            return;
        }
        snapshot.forEach((doc) => {
            const item = doc.data();
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-title">${item.titolo || 'Senza Titolo'}</div>
                <div class="card-meta">📅 Data Scadenza: ${item.data || 'N/D'}</div>
                <div class="card-meta">💰 Importo: € ${item.importo !== undefined ? item.importo : '0.00'}</div>
                <div class="card-meta">👤 Creato da: ${item.creatore || 'Sconosciuto'}</div>
            `;
            containerScadenze.appendChild(card);
        });
    });
}

// 3. Caricamento Ricette
function ascoltaRicette() {
    onSnapshot(collection(db, "ricette"), (snapshot) => {
        containerRicette.innerHTML = '';
        if (snapshot.empty) {
            containerRicette.innerHTML = '<p class="card-meta">Nessuna ricetta trovata.</p>';
            return;
        }
        snapshot.forEach((doc) => {
            const item = doc.data();
            const ingredientiLista = item.ingredienti && Array.isArray(item.ingredienti) 
                ? item.ingredienti.join(', ') 
                : 'Nessun ingrediente elencato';

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-title">${item.nome || 'Ricetta Senza Nome'}</div>
                <div class="card-meta">🛒 <strong>Ingredienti:</strong> ${ingredientiLista}</div>
                <div class="card-meta">📝 <strong>Note:</strong> ${item.note || 'Nessuna nota'}</div>
                <div class="card-meta">👤 Creato da: ${item.creatore || 'Sconosciuto'}</div>
            `;
            containerRicette.appendChild(card);
        });
    });
}

// --- INIZIALIZZAZIONE APP ---
document.addEventListener('DOMContentLoaded', () => {
    caricaUtenti();
    ascoltaImpegni();
    ascoltaScadenze();
    ascoltaRicette();
});
