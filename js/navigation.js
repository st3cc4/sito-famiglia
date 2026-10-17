// js/navigation.js - Gestione Navigazione, Home e Apertura/Chiusura Sidebar

const navLinks = document.querySelectorAll('.nav-link');
const appSections = document.querySelectorAll('.app-section');
const headerTitle = document.getElementById('header-title');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const btnToggleMenu = document.getElementById('btn-toggle-menu');
const btnGoHome = document.getElementById('btn-go-home');

export function initNavigation() {
    // 1. Clic sulle Voci della Sidebar
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionTarget = link.getAttribute('data-section');
            mostraSezione(sectionTarget);
            chiudiSidebar();
        });
    });

    // 2. Clic sulle Card Cliccabili della HOME
    const clickableCards = document.querySelectorAll('.clickable-card');
    clickableCards.forEach(card => {
        card.addEventListener('click', () => {
            const sectionTarget = card.getAttribute('data-section');
            if (sectionTarget) {
                mostraSezione(sectionTarget);
            }
        });
    });

    // 3. Clic sul pulsante Home (🏠) nell'header per tornare alla dashboard
    if (btnGoHome) {
        btnGoHome.addEventListener('click', () => {
            mostraSezione('home');
            chiudiSidebar();
        });
    }

    // 4. Clic sulle tre barre (hamburger) in alto nella sidebar per espandere/comprimere
    if (btnToggleMenu) {
        btnToggleMenu.addEventListener('click', toggleSidebar);
    }

    if (overlay) {
        overlay.addEventListener('click', chiudiSidebar);
    }
}

// Funzione principale per attivare la sezione desiderata
export function mostraSezione(sectionId) {
    appSections.forEach(section => {
        section.classList.remove('active');
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    if (sectionId === 'home') {
        if (headerTitle) headerTitle.textContent = "HOME";
    } else {
        const activeLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
            const testoVoce = activeLink.querySelector('span:not(.nav-emoji)');
            if (headerTitle && testoVoce) {
                headerTitle.textContent = testoVoce.textContent.toUpperCase();
            }
        }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Alterna lo stato della sidebar (chiusa/aperta)
function toggleSidebar() {
    if (sidebar) {
        sidebar.classList.toggle('expanded');
        if (overlay) {
            if (sidebar.classList.contains('expanded')) {
                overlay.classList.add('active');
            } else {
                overlay.classList.remove('active');
            }
        }
    }
}

function chiudiSidebar() {
    if (sidebar) sidebar.classList.remove('expanded');
    if (overlay) overlay.classList.remove('active');
}
