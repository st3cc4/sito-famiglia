// --- 1. Controllo Autenticazione all'avvio ---
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('famiglia_pwa_user') || sessionStorage.getItem('famiglia_pwa_user');
    
    if (!savedUser) {
        // Se non c'è nessun utente loggato, torna al login
        window.location.href = '../index.html';
        return;
    }

    const userData = JSON.parse(savedUser);
    
    // Mostra il nome dell'utente nell'header
    const userDisplayName = document.getElementById('user-display-name');
    userDisplayName.textContent = userData.nome;
    if (userData.colore) {
        userDisplayName.style.backgroundColor = userData.colore;
    }

    // Inizializza la navigazione dinamica (carica la dashboard iniziale)
    initNavigation();
});

// --- 2. Gestione Sidebar (Apri / Chiudi) ---
const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

function toggleSidebar() {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('active');
}

btnToggleSidebar.addEventListener('click', toggleSidebar);
sidebarOverlay.addEventListener('click', toggleSidebar);

// --- 3. Gestione Logout ---
const btnLogout = document.getElementById('btn-logout');
btnLogout.addEventListener('click', () => {
    localStorage.removeItem('famiglia_pwa_user');
    sessionStorage.removeItem('famiglia_pwa_user');
    window.location.href = '../index.html';
});

// --- 4. Navigazione Dinamica (La Tela Centrale) ---
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const contentArea = document.getElementById('content-area');
    const pageTitle = document.getElementById('page-title');

    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Rimuovi la classe active da tutti i bottoni e aggiungila a quello cliccato
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const target = button.getAttribute('data-target');
            const spanText = button.querySelector('span').textContent;
            pageTitle.textContent = `Famiglia PWA - ${spanText}`;

            // Carica i contenuti in base alla sezione selezionata sulla tela
            loadSectionContent(target, contentArea);

            // Su mobile, chiudi la sidebar dopo il clic
            if (window.innerWidth <= 768) {
                toggleSidebar();
            }
        });
    });

    // Carica la dashboard di default all'avvio
    loadSectionContent('dashboard', contentArea);
}

// Funzione per caricare le sezioni nella tela centrale
function loadSectionContent(target, container) {
    switch (target) {
        case 'dashboard':
            container.innerHTML = `
                <h2>Benvenuto nella Famiglia PWA</h2>
                <p>Questa è la tua dashboard principale. Da qui puoi tenere sotto controllo tutte le attività della famiglia.</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p>Seleziona una sezione dal menu laterale per gestire Impegni, Scadenze, Ricette o Foto e Video.</p>
            `;
            break;
        case 'impegni':
            container.innerHTML = `
                <h2>Gestione Impegni e Appuntamenti</h2>
                <p>Qui caricheremo la sezione impegni collegata al database.</p>
            `;
            break;
        case 'scadenze':
            container.innerHTML = `
                <h2>Gestione Scadenze</h2>
                <p>Qui caricheremo la sezione scadenze e bollette.</p>
            `;
            break;
        case 'ricette':
            container.innerHTML = `
                <h2>Ricettario di Famiglia</h2>
                <p>Qui caricheremo le ricette.</p>
            `;
            break;
        case 'media':
            container.innerHTML = `
                <h2>Raccolta Foto e Video</h2>
                <p>Qui caricheremo la galleria multimediale.</p>
            `;
            break;
        default:
            container.innerHTML = `<h2>Sezione non trovata</h2>`;
    }
}
