// js/navigation.js - Gestione Navigazione e Aggiornamento Header

const headerTitle = document.getElementById('header-title');
const headerIcon = document.getElementById('header-icon');
const navLinks = document.querySelectorAll('.nav-link');
const appSections = document.querySelectorAll('.app-section');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

// Mappa Titoli ed Emoji per l'Header
const sezioniInfo = {
    'home': { titolo: 'HOME', emoji: '🏠' },
    'scadenze': { titolo: 'SCADENZE', emoji: '⏰' },
    'impegni': { titolo: 'IMPEGNI', emoji: '📅' },
    'media': { titolo: 'FOTO E VIDEO', emoji: '🖼️' },
    'ricette': { titolo: 'RICETTE', emoji: '🍳' }
};

export function initNavigation() {
    // Navigazione tramite barra laterale
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('data-section');
            if (targetSection) {
                mostraSezione(targetSection);
                chiudiSidebarMobile();
            }
        });
    });

    // Navigazione tramite Card Cliccabili nella HOME
    const clickableCards = document.querySelectorAll('.clickable-card');
    clickableCards.forEach(card => {
        card.addEventListener('click', () => {
            const targetSection = card.getAttribute('data-section');
            if (targetSection) {
                mostraSezione(targetSection);
            }
        });
    });
}

export function mostraSezione(sectionId) {
    const info = sezioniInfo[sectionId] || { titolo: 'HOME', emoji: '🏠' };

    // Aggiorna Titolo ed Emoji nell'Header (non cliccabile)
    if (headerTitle) headerTitle.textContent = info.titolo;
    if (headerIcon) headerIcon.textContent = info.emoji;

    // Gestione visibilità sezioni
    appSections.forEach(section => {
        if (section.id === `section-${sectionId}`) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });

    // Aggiorna stato attivo nei link della sidebar
    navLinks.forEach(link => {
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Scorrimento in cima alla pagina
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function chiudiSidebarMobile() {
    if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
    }
    if (overlay && overlay.classList.contains('active')) {
        overlay.classList.remove('active');
    }
}
