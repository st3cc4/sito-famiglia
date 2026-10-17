// js/navigation.js - Gestione della Navigazione tra le Sezioni della Web App

const navLinks = document.querySelectorAll('.nav-link');
const appSections = document.querySelectorAll('.app-section');
const headerTitle = document.getElementById('header-title');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const btnToggleMenu = document.getElementById('btn-toggle-menu');
const btnCloseMenu = document.getElementById('btn-close-menu');

export function initNavigation() {
    // 1. Gestione Clic sulle Voci della Sidebar
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionTarget = link.getAttribute('data-section');
            mostraSezione(sectionTarget);
            chiudiSidebar();
        });
    });

    // 2. Gestione Clic sulle Card Cliccabili della HOME (Dashboard)
    const clickableCards = document.querySelectorAll('.clickable-card');
    clickableCards.forEach(card => {
        card.addEventListener('click', () => {
            const sectionTarget = card.getAttribute('data-section');
            if (sectionTarget) {
                mostraSezione(sectionTarget);
            }
        });
    });

    // 3. Gestione Apertura/Chiusura Sidebar
    if (btnToggleMenu) {
        btnToggleMenu.addEventListener('click', apriSidebar);
    }

    if (btnCloseMenu) {
        btnCloseMenu.addEventListener('click', chiudiSidebar);
    }

    if (overlay) {
        overlay.addEventListener('click', chiudiSidebar);
    }
}

// Funzione principale per attivare la sezione desiderata
export function mostraSezione(sectionId) {
    // Nascondi tutte le sezioni
    appSections.forEach(section => {
        section.classList.remove('active');
    });

    // Rimuovi lo stato attivo dai link della sidebar
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Mostra la sezione selezionata
    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Se la sezione è 'home', mostra l'header speciale della HOME
    if (sectionId === 'home') {
        if (headerTitle) headerTitle.textContent = "HOME";
    } else {
        // Altrimenti attiva il link corrispondente nella sidebar e aggiorna il titolo dell'header
        const activeLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
            const testoVoce = activeLink.querySelector('span:not(.nav-emoji)');
            if (headerTitle && testoVoce) {
                headerTitle.textContent = testoVoce.textContent.toUpperCase();
            }
        }
    }

    // Torna in cima alla pagina ad ogni cambio sezione
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function apriSidebar() {
    if (sidebar) sidebar.classList.add('active');
    if (overlay) overlay.classList.add('active');
}

function chiudiSidebar() {
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}
