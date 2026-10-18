// --- Import SDK di Firebase ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configurazione Firebase dal tuo progetto
const firebaseConfig = {
    apiKey: "AIzaSyAtMnKhhfC43J73kVm8-QcNghqzOTV6UKA",
    authDomain: "sito-famiglia.firebaseapp.com",
    projectId: "sito-famiglia",
    storageBucket: "sito-famiglia.appspot.com",
    messagingSenderId: "93216467751",
    appId: "1:93216467751:web:9930052845521ca5ef895a",
    measurementId: "G-NYRQJDTWM3"
};

// Inizializza Firebase e Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 1. Controllo Autenticazione e Permessi all'avvio ---
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('famiglia_pwa_user') || sessionStorage.getItem('famiglia_pwa_user');
    
    if (!savedUser) {
        window.location.href = '../index.html';
        return;
    }

    const userData = JSON.parse(savedUser);
    
    const userDisplayName = document.getElementById('user-display-name');
    if (userDisplayName) {
        userDisplayName.textContent = userData.nome;
        if (userData.colore) {
            userDisplayName.style.backgroundColor = userData.colore;
        }
    }

    const sidebarUsername = document.getElementById('sidebar-username');
    const sidebarUserRole = document.getElementById('sidebar-user-role');
    
    if (sidebarUsername) sidebarUsername.textContent = userData.nome;
    
    const isAdmin = (userData.ruolo === 'admin' || (userData.nome && userData.nome.toLowerCase() === 'paolo'));
    if (sidebarUserRole) sidebarUserRole.textContent = isAdmin ? 'Admin' : 'Utente';

    if (isAdmin) {
        const adminMenuItem = document.getElementById('admin-menu-item');
        if (adminMenuItem) {
            adminMenuItem.style.display = 'block';
        }
    }

    initNavigation();
});

// --- 2. Gestione Sidebar (Espandi / Contrai) ---
const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

function toggleSidebar() {
    if (window.innerWidth <= 768) {
        if (sidebar) sidebar.classList.toggle('open');
        if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
    } else {
        if (sidebar) sidebar.classList.toggle('collapsed');
    }
}

if (btnToggleSidebar) btnToggleSidebar.addEventListener('click', toggleSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);

// --- 3. Gestione Logout ---
const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('famiglia_pwa_user');
        sessionStorage.removeItem('famiglia_pwa_user');
        window.location.href = '../index.html';
    });
}

// --- 4. Navigazione Dinamica (La Tela Centrale) ---
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const contentArea = document.getElementById('content-area');
    const pageTitle = document.getElementById('page-title');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const target = button.getAttribute('data-target');
            const navTextSpan = button.querySelector('.nav-text');
            const navText = navTextSpan ? navTextSpan.textContent.trim() : 'HOME';
            
            if (pageTitle) {
                pageTitle.textContent = `FAMIGLIA - ${navText.toUpperCase()}`;
            }
            document.title = `FAMIGLIA - ${navText.toUpperCase()}`;

            loadSectionContent(target, contentArea);

            if (window.innerWidth <= 768) {
                if (sidebar) sidebar.classList.remove('open');
                if (sidebarOverlay) sidebarOverlay.classList.remove('active');
            }
        });
    });

    if (pageTitle) {
        pageTitle.textContent = 'FAMIGLIA - HOME';
    }

    loadSectionContent('dashboard', contentArea);
}

// Funzione globale per attivare una scheda dal menu (usata cliccando sulle card)
window.selezionaScheda = function(targetName) {
    const targetButton = document.querySelector(`.nav-btn[data-target="${targetName}"]`);
    if (targetButton) {
        targetButton.click();
    }
};

// Funzione per caricare le differenti schermate nella tela centrale
function loadSectionContent(target, container) {
    if (!container) return;

    switch (target) {
        case 'dashboard':
            renderDashboard(container);
            break;
        case 'scadenze':
            container.innerHTML = `
                <h2>Gestione Scadenze</h2>
                <p>Sezione completa per visualizzare e aggiungere tutte le scadenze.</p>
            `;
            break;
        case 'impegni':
            container.innerHTML = `
                <h2>Gestione Impegni</h2>
                <p>Sezione dedicata agli impegni e appuntamenti di famiglia.</p>
            `;
            break;
        case 'media':
            container.innerHTML = `
                <h2>Foto & Video</h2>
                <p>Raccolta multimediale completa della famiglia.</p>
            `;
            break;
        case 'ricette':
            container.innerHTML = `
                <h2>Ricettario di Famiglia</h2>
                <p>Sezione completa per visualizzare e salvare le ricette preferite.</p>
            `;
            break;
        case 'gestione-utenti':
            container.innerHTML = `
                <h2>Gestione Utenti (Pannello Admin)</h2>
                <p>Qui l'amministratore può gestire gli utenti, i ruoli e i permessi.</p>
            `;
            break;
        case 'cambia-password':
            container.innerHTML = `
                <h2>Cambia Password</h2>
                <p>Pannello per aggiornare la propria password di accesso.</p>
            `;
            break;
        case 'cambia-colore':
            container.innerHTML = `
                <h2>Cambia Colore</h2>
                <p>Pannello per personalizzare il proprio colore utente.</p>
            `;
            break;
        default:
            container.innerHTML = `<h2>Sezione non trovata</h2>`;
    }
}

// Funzione ausiliaria per convertire colori HEX in formato RGBA trasparente
function hexToRgba(hex, alpha = 0.12) {
    let c = hex.replace('#', '');
    if (c.length === 3) {
        c = c.split('').map(char => char + char).join('');
    }
    const num = parseInt(c, 16);
    if (isNaN(num)) return `rgba(52, 152, 219, ${alpha})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// --- 5. Logica di Rendering della DASHBOARD con dati reali da Firebase ---
async function renderDashboard(container) {
    container.innerHTML = `<p style="text-align:center; padding: 20px; color: var(--text-muted);">Caricamento dati in corso...</p>`;

    try {
        // Recupera utenti (per associare i colori ai creatori degli impegni)
        const utentiSnapshot = await getDocs(collection(db, "utenti"));
        const utentiCollezioni = {};
        utentiSnapshot.forEach(doc => {
            const data = doc.data();
            utentiCollezioni[data.nome.toLowerCase()] = data.colore || '#3498db';
        });

        // Recupera Scadenze da Firestore
        const scadenzeSnapshot = await getDocs(collection(db, "scadenze"));
        const scadenzeList = [];
        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);

        scadenzeSnapshot.forEach(doc => {
            const data = doc.data();
            const dataScad = new Date(data.data);
            dataScad.setHours(0, 0, 0, 0);
            
            const diffTempo = dataScad - oggi;
            const giorniMancanti = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));
            
            scadenzeList.push({
                titolo: data.titolo || 'Senza titolo',
                importo: data.importo !== undefined ? `€ ${Number(data.importo).toFixed(2)}` : '',
                dataFormattata: data.data || '',
                giorniMancanti: giorniMancanti
            });
        });

        // Filtro scadenze: Rosso (<=7), Arancione (8-14), Verde (>=15)
        let scadenzeFiltrate = scadenzeList.filter(s => s.giorniMancanti <= 7);
        let coloreScadenza = 'red';

        if (scadenzeFiltrate.length === 0) {
            scadenzeFiltrate = scadenzeList.filter(s => s.giorniMancanti >= 8 && s.giorniMancanti <= 14);
            coloreScadenza = 'orange';
        }
        if (scadenzeFiltrate.length === 0) {
            scadenzeFiltrate = scadenzeList.filter(s => s.giorniMancanti >= 15);
            coloreScadenza = 'green';
        }

        // Recupera Impegni (appuntamenti) da Firestore
        const appuntamentiSnapshot = await getDocs(collection(db, "appuntamenti"));
        const impegniList = [];
        
        appuntamentiSnapshot.forEach(doc => {
            const data = doc.data();
            const creatore = (data.creatore || '').toLowerCase();
            const coloreUtente = utentiCollezioni[creatore] || '#3498db';
            impegniList.push({
                titolo: data.titolo || 'Impegno',
                data: data.data || '',
                coloreUtente: coloreUtente,
                bgTrasparente: hexToRgba(coloreUtente, 0.12)
            });
        });

        // Recupera Ricette da Firestore (prime 3)
        const ricetteSnapshot = await getDocs(collection(db, "ricette"));
        const ricetteList = [];
        ricetteSnapshot.forEach(doc => {
            const data = doc.data();
            ricetteList.push({
                titolo: data.nome || 'Ricetta',
                stelle: '★★★★★'
            });
        });
        const primeRicette = ricetteList.slice(0, 3);

        // Foto & Video di esempio
        const mediaData = [
            'https://picsum.photos/seed/fam1/200',
            'https://picsum.photos/seed/fam2/200',
            'https://picsum.photos/seed/fam3/200',
            'https://picsum.photos/seed/fam4/200',
            'https://picsum.photos/seed/fam5/200'
        ];

        // Costruisci l'HTML della Dashboard
        container.innerHTML = `
            <div class="dashboard-grid">
                <!-- 1. CARD SCADENZE -->
                <div class="card" onclick="selezionaScheda('scadenze')" style="cursor: pointer;" title="Clicca per aprire Scadenze">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-file-invoice-dollar"></i> SCADENZE</h3>
                    </div>
                    <div class="card-body">
                        ${scadenzeFiltrate.length > 0 ? `
                            <ul class="scadenze-list">
                                ${scadenzeFiltrate.map(s => `
                                    <li class="scadenza-item ${coloreScadenza}">
                                        <div class="scadenza-row">
                                            <span class="scadenza-title">${s.titolo}</span>
                                            <span class="scadenza-amount">${s.importo}</span>
                                        </div>
                                        <div class="scadenza-row">
                                            <span class="scadenza-date">${s.dataFormattata}</span>
                                            <span class="scadenza-status">${s.giorniMancanti < 0 ? 'Scaduta' : (s.giorniMancanti === 0 ? 'Scade oggi' : `Tra ${s.giorniMancanti} gg`)}</span>
                                        </div>
                                    </li>
                                `).join('')}
                            </ul>
                        ` : `<p class="card-empty">Nessuna scadenza in evidenza</p>`}
                    </div>
                </div>

                <!-- 2. CARD IMPEGNI -->
                <div class="card" onclick="selezionaScheda('impegni')" style="cursor: pointer;" title="Clicca per aprire Impegni">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-calendar-days"></i> IMPEGNI</h3>
                    </div>
                    <div class="card-body">
                        ${impegniList.length > 0 ? `
                            <ul class="impegni-list">
                                ${impegniList.map(i => `
                                    <li class="impegno-item" style="background-color: ${i.bgTrasparente}; border-left-color: ${i.coloreUtente};">
                                        <span>${i.titolo}</span>
                                        <span style="font-size: 0.88rem; font-weight: 600; color: #4a5568;">${i.data}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        ` : `<p class="card-empty">Nessun impegno in programma</p>`}
                    </div>
                </div>

                <!-- 3. CARD FOTO & VIDEO -->
                <div class="card" onclick="selezionaScheda('media')" style="cursor: pointer;" title="Clicca per aprire Foto & Video">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-photo-film"></i> FOTO & VIDEO</h3>
                    </div>
                    <div class="card-body">
                        ${mediaData.length > 0 ? `
                            <div class="media-grid-preview">
                                ${mediaData.map(img => `<img src="${img}" class="media-thumb" alt="Anteprima media">`).join('')}
                            </div>
                        ` : `<p class="card-empty">Nessun contenuto multimediale recente</p>`}
                    </div>
                </div>

                <!-- 4. CARD RICETTE -->
                <div class="card" onclick="selezionaScheda('ricette')" style="cursor: pointer;" title="Clicca per aprire Ricette">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-utensils"></i> RICETTE</h3>
                    </div>
                    <div class="card-body">
                        ${primeRicette.length > 0 ? `
                            <ul class="ricette-list">
                                ${primeRicette.map(r => `
                                    <li class="ricetta-item">
                                        <span>${r.titolo}</span>
                                        <span class="ricetta-rating">${r.stelle}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        ` : `<p class="card-empty">Nessuna ricetta salvata</p>`}
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        console.error("Errore nel recupero dei dati da Firebase:", error);
        container.innerHTML = `<p style="color: red; text-align: center;">Errore durante il caricamento dei dati dal database.</p>`;
    }
}
