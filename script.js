import { controllaSessioneSalvata, impostaCallbackAvvio, attivaInterfacciaUtente } from "./auth.js";
import { caricaScadenze } from "./scadenze.js";
import { caricaAppuntamenti } from "./appuntamenti.js";
import { caricaRicette } from "./ricette.js";

const navButtons = document.querySelectorAll('.nav-btn');
const pageSections = document.querySelectorAll('.page-section');
const headerSectionName = document.getElementById('header-section-name');
const headerIcon = document.getElementById('header-icon');
const btnTopBackHome = document.getElementById('btn-top-back-home');
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const cardCliccabili = document.querySelectorAll('.card-cliccabile');

const iconeSezioni = {
    'sec-home': '🏠',
    'sec-scadenze': 'icon/icona-scadenze.png',
    'sec-appuntamenti': 'icon/icona-impegni.png',
    'sec-media': 'icon/icona-media.png',
    'sec-ricette': 'icon/icona-ricette.png',
    'sec-utenti': '⚙️'
};

const titoliSezioni = {
    'sec-home': 'Home',
    'sec-scadenze': 'Scadenze',
    'sec-appuntamenti': 'Appuntamenti',
    'sec-media': 'Media',
    'sec-ricette': 'Ricette',
    'sec-utenti': 'Gestione Utenti'
};

function attivaSezione(targetId) {
    pageSections.forEach(section => {
        section.classList.remove('active');
    });

    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    navButtons.forEach(btn => {
        if (btn.getAttribute('data-target') === targetId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    if (titoliSezioni[targetId]) {
        headerSectionName.textContent = titoliSezioni[targetId];
    }

    const icona = iconeSezioni[targetId];
    if (icona) {
        if (icona.startsWith('icon/')) {
            headerIcon.outerHTML = `<img src="${icona}" id="header-icon" class="header-icon">`;
        } else {
            headerIcon.outerHTML = `<span id="header-icon" style="font-size: 1.5rem;">${icona}</span>`;
        }
    }

    if (btnTopBackHome) {
        if (targetId === 'sec-home') {
            btnTopBackHome.style.display = 'none';
        } else {
            btnTopBackHome.style.display = 'inline-flex';
        }
    }

    if (targetId === 'sec-scadenze') {
        caricaScadenze();
    } else if (targetId === 'sec-appuntamenti') {
        caricaAppuntamenti();
    } else if (targetId === 'sec-ricette') {
        caricaRicette();
    } else if (targetId === 'sec-home') {
        caricaScadenze();
        caricaAppuntamenti();
        caricaRicette();
    }
}

navButtons.forEach(button => {
    button.addEventListener('click', () => {
        const target = button.getAttribute('data-target');
        if (target) {
            attivaSezione(target);
        }
    });
});

if (btnTopBackHome) {
    btnTopBackHome.addEventListener('click', () => {
        attivaSezione('sec-home');
    });
}

cardCliccabili.forEach(card => {
    card.addEventListener('click', () => {
        const target = card.getAttribute('data-target');
        if (target) {
            attivaSezione(target);
        }
    });
});

if (toggleSidebarBtn && sidebar) {
    toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });
}

impostaCallbackAvvio(() => {
    attivaSezione('sec-home');
    attivaInterfacciaUtente(null);
});

window.addEventListener('DOMContentLoaded', () => {
    controllaSessioneSalvata();
});
