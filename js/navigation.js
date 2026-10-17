// js/navigation.js - Gestione Navigazione e Cambio Sezioni

const sezioni = document.querySelectorAll('.app-section');
const vociMenu = document.querySelectorAll('.sidebar-menu li');
const headerTitle = document.getElementById('header-title');

const titoliSezioni = {
    'home': 'HOME',
    'impegni': 'IMPEGNI',
    'scadenze': 'SCADENZE',
    'ricette': 'RICETTE',
    'media': 'MEDIA'
};

export function initNavigation() {
    // Navigazione tramite Menu Sidebar
    vociMenu.forEach(item => {
        item.addEventListener('click', () => {
            const sezione = item.getAttribute('data-section');
            if (sezione) {
                mostraSezione(sezione);
            }
        });
    });

    // Navigazione tramite Click sulle Card della Home
    const cardClickabili = document.querySelectorAll('.clickable-card');
    cardClickabili.forEach(card => {
        card.addEventListener('click', () => {
            const navTarget = card.getAttribute('data-nav');
            if (navTarget) {
                mostraSezione(navTarget);
            }
        });
    });
}

export function mostraSezione(idSezione) {
    // Nasconde tutte le sezioni
    sezioni.forEach(sec => sec.classList.remove('active'));

    // Mostra la sezione selezionata
    const sezioneTarget = document.getElementById(`section-${idSezione}`);
    if (sezioneTarget) {
        sezioneTarget.classList.add('active');
    }

    // Aggiorna lo stato attivo nel menu della sidebar
    vociMenu.forEach(item => {
        if (item.getAttribute('data-section') === idSezione) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Aggiorna il titolo nell'header
    if (headerTitle && titoliSezioni[idSezione]) {
        headerTitle.textContent = titoliSezioni[idSezione];
    }

    // Scorri in alto alla pagina
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
