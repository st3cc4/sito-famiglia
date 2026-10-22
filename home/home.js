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

// --- 1. Controllo Autenticazione e Permessi Schede all'avvio ---
document.addEventListener('DOMContentLoaded', function() {
    const savedUser = localStorage.getItem('famiglia_session') || sessionStorage.getItem('famiglia_session');
    
    if (!savedUser) {
        window.location.replace('./index.html');
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

    // GESTIONE VISIBILITA' DELLE SCHEDE NELLA SIDEBAR IN BASE AI PERMESSI
    const permessi = userData.permessi || { scadenze: true, impegni: true, media: true, ricette: true };

    aggiornaVisibilitaTastoSidebar('scadenze', permessi.scadenze !== false);
    aggiornaVisibilitaTastoSidebar('impegni', permessi.impegni !== false);
    aggiornaVisibilitaTastoSidebar('media', permessi.media !== false);
    aggiornaVisibilitaTastoSidebar('ricette', permessi.ricette !== false);

    // Caricamento dinamico dei fogli di stile esterni
    caricaStileDinamico('../scadenze/stile-scadenze.css?v=2', 'css-scadenze');
    caricaStileDinamico('../impegni/stile-impegni.css?v=2', 'css-impegni');
    caricaStileDinamico('../gestione-utenti/stile-gestione-utenti.css?v=2', 'css-gestione-utenti');
    caricaStileDinamico('../cambia-password/stile-cambia-password.css?v=2', 'css-cambia-password');
    caricaStileDinamico('../cambia-colore/stile-cambia-colore.css?v=2', 'css-cambia-colore');
    caricaStileDinamico('../ricette/stile-ricette.css?v=2', 'css-ricette');
    caricaStileDinamico('../media/stile-media.css?v=2', 'css-media');

    initNavigation();
});

function aggiornaVisibilitaTastoSidebar(targetName, visibile) {
    const btn = document.querySelector(`.nav-btn[data-target="${targetName}"]`);
    if (btn) {
        btn.style.display = visibile ? 'flex' : 'none';
    }
}

// Funzione ausiliaria per caricare Fogli di Stile CSS esterni dinamicamente
function caricaStileDinamico(url, idElemento) {
    let link = document.getElementById(idElemento);
    if (!link) {
        const head = document.getElementsByTagName('head')[0];
        link = document.createElement('link');
        link.id = idElemento;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = url;
        head.appendChild(link);
    } else {
        link.href = url;
    }
}

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
    btnLogout.addEventListener('click', function() {
        localStorage.removeItem('famiglia_session');
        sessionStorage.removeItem('famiglia_session');
        window.location.replace('../index.html');
    });
}

// --- 4. Navigazione Dinamica (La Tela Centrale) ---
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const contentArea = document.getElementById('content-area');
    const pageTitle = document.getElementById('page-title');

    navButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            navButtons.forEach(function(btn) { btn.classList.remove('active'); });
            button.classList.add('active');

            const target = button.getAttribute('data-target');
            const navTextSpan = button.querySelector('.nav-text');
            const navText = navTextSpan ? navTextSpan.textContent.trim() : 'HOME';
            
            if (pageTitle) {
                pageTitle.textContent = 'FAMIGLIA - ' + navText.toUpperCase();
            }
            document.title = 'FAMIGLIA - ' + navText.toUpperCase();

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
    document.title = 'FAMIGLIA - HOME';

    loadSectionContent('dashboard', contentArea);
}

// Funzione globale per attivare una scheda dal menu
window.selezionaScheda = function(targetName) {
    const targetButton = document.querySelector('.nav-btn[data-target="' + targetName + '"]');
    if (targetButton && targetButton.style.display !== 'none') {
        targetButton.click();
    }
};

// Funzione per caricare le differenti schermate nella tela centrale
async function loadSectionContent(target, container) {
    if (!container) return;

    switch (target) {
        case 'dashboard':
            renderDashboard(container);
            break;
        case 'scadenze':
            try {
                const moduloScadenze = await import('../scadenze/scadenze.js?v=' + Date.now());
                await moduloScadenze.initScadenzeSection(container);
            } catch (err) {
                console.error("Errore caricamento modulo Scadenze:", err);
                container.innerHTML = '<p style="color:red; text-align:center;">Impossibile caricare la sezione Scadenze.</p>';
            }
            break;
        case 'impegni':
            try {
                const moduloImpegni = await import('../impegni/impegni.js?v=' + Date.now());
                await moduloImpegni.initImpegniSection(container);
            } catch (err) {
                console.error("Errore caricamento modulo Impegni:", err);
                container.innerHTML = '<p style="color:red; text-align:center;">Impossibile caricare la sezione Impegni.</p>';
            }
            break;
        case 'media':
            try {
                const moduloMedia = await import('../media/media.js?v=' + Date.now());
                await moduloMedia.initMediaSection(container);
            } catch (err) {
                console.error("Errore caricamento modulo Media:", err);
                container.innerHTML = '<p style="color:red; text-align:center;">Impossibile caricare la sezione Foto & Video.</p>';
            }
            break;
        case 'ricette':
            try {
                const moduloRicette = await import('../ricette/ricette.js?v=' + Date.now());
                await moduloRicette.initRicetteSection(container);
            } catch (err) {
                console.error("Errore caricamento modulo Ricette:", err);
                container.innerHTML = '<p style="color:red; text-align:center;">Impossibile caricare la sezione Ricette.</p>';
            }
            break;
        case 'gestione-utenti':
            try {
                const moduloGestioneUtenti = await import('../gestione-utenti/gestione-utenti.js?v=' + Date.now());
                await moduloGestioneUtenti.initGestioneUtentiSection(container);
            } catch (err) {
                console.error("Errore caricamento modulo Gestione Utenti:", err);
                container.innerHTML = '<p style="color:red; text-align:center;">Impossibile caricare la sezione Gestione Utenti.</p>';
            }
            break;
        case 'cambia-password':
            try {
                const moduloCambiaPwd = await import('../cambia-password/cambia-password.js?v=' + Date.now());
                await moduloCambiaPwd.initCambiaPasswordSection(container);
            } catch (err) {
                console.error("Errore caricamento modulo Cambia Password:", err);
                container.innerHTML = '<p style="color:red; text-align:center;">Impossibile caricare la sezione Cambia Password.</p>';
            }
            break;
        case 'cambia-colore':
            try {
                const moduloCambiaColore = await import('../cambia-colore/cambia-colore.js?v=' + Date.now());
                await moduloCambiaColore.initCambiaColoreSection(container);
            } catch (err) {
                console.error("Errore caricamento modulo Cambia Colore:", err);
                container.innerHTML = '<p style="color:red; text-align:center;">Impossibile caricare la sezione Cambia Colore.</p>';
            }
            break;
        default:
            container.innerHTML = '<h2>Sezione non trovata</h2>';
    }
}

// Convertitore colore HEX -> RGBA Trasparente
function hexToRgba(hex, alpha) {
    const a = alpha !== undefined ? alpha : 0.12;
    if (!hex) return "rgba(52, 152, 219, " + a + ")";
    let c = hex.replace('#', '');
    if (c.length === 3) {
        c = c.split('').map(function(char) { return char + char; }).join('');
    }
    const num = parseInt(c, 16);
    if (isNaN(num)) return "rgba(52, 152, 219, " + a + ")";
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
}

// Formattatore Data Europea GG-MM-AAAA
function formatDataEuropea(dataString) {
    if (!dataString) return '';
    const parti = dataString.split('-');
    if (parti.length === 3) {
        return parti[2] + '-' + parti[1] + '-' + parti[0];
    }
    return dataString;
}

// --- 5. Logica di Rendering della DASHBOARD ---
async function renderDashboard(container) {
    container.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-muted);">Caricamento dati in corso...</p>';

    const savedUser = localStorage.getItem('famiglia_session') || sessionStorage.getItem('famiglia_session');
    const userData = savedUser ? JSON.parse(savedUser) : {};
    const permessi = userData.permessi || { scadenze: true, impegni: true, media: true, ricette: true };

    try {
        const utentiSnapshot = await getDocs(collection(db, "utenti"));
        const utentiCollezioni = {};
        utentiSnapshot.forEach(function(doc) {
            const data = doc.data();
            if (data.nome) {
                utentiCollezioni[data.nome.toLowerCase()] = data.colore || '#3498db';
            }
        });

        const scadenzeSnapshot = await getDocs(collection(db, "scadenze"));
        const scadenzeList = [];
        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);

        scadenzeSnapshot.forEach(function(doc) {
            const data = doc.data();
            const dataScad = new Date(data.data);
            dataScad.setHours(0, 0, 0, 0);
            
            const diffTempo = dataScad - oggi;
            const giorniMancanti = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));
            
            scadenzeList.push({
                titolo: data.titolo || 'Senza titolo',
                importo: data.importo !== undefined ? '€ ' + Number(data.importo).toFixed(2) : '',
                dataFormattata: formatDataEuropea(data.data),
                giorniMancanti: giorniMancanti
            });
        });

        let scadenzeFiltrate = scadenzeList.filter(function(s) { return s.giorniMancanti <= 7; });
        let coloreScadenza = 'red';

        if (scadenzeFiltrate.length === 0) {
            scadenzeFiltrate = scadenzeList.filter(function(s) { return s.giorniMancanti >= 8 && s.giorniMancanti <= 14; });
            coloreScadenza = 'orange';
        }
        if (scadenzeFiltrate.length === 0) {
            scadenzeFiltrate = scadenzeList.filter(function(s) { return s.giorniMancanti >= 15; });
            coloreScadenza = 'green';
        }

        const annoOggi = oggi.getFullYear();
        const meseOggi = String(oggi.getMonth() + 1).padStart(2, '0');
        const giornoOggi = String(oggi.getDate()).padStart(2, '0');
        const dataOggiIso = annoOggi + '-' + meseOggi + '-' + giornoOggi;

        const appuntamentiSnapshot = await getDocs(collection(db, "appuntamenti"));
        const impegniList = [];
        
        appuntamentiSnapshot.forEach(function(doc) {
            const data = doc.data();
            if (data.data === dataOggiIso) {
                const creatore = data.creatore || '';
                const coloreUtente = utentiCollezioni[creatore.toLowerCase()] || '#3498db';
                
                impegniList.push({
                    titolo: data.titolo || 'Impegno',
                    dataFormattata: formatDataEuropea(data.data),
                    oraInizio: data.oraInizio || '',
                    creatore: creatore,
                    coloreUtente: coloreUtente,
                    bgTrasparente: hexToRgba(coloreUtente, 0.12)
                });
            }
        });

        impegniList.sort(function(a, b) {
            return (a.oraInizio || '').localeCompare(b.oraInizio || '');
        });

        const ricetteSnapshot = await getDocs(collection(db, "ricette"));
        const ricetteList = [];
        ricetteSnapshot.forEach(function(doc) {
            const data = doc.data();
            const creatore = data.creatore || '';
            const coloreUtente = utentiCollezioni[creatore.toLowerCase()] || '#3498db';

            const valNum = Number(data.valutazione || 5);
            const stelleStr = '★'.repeat(valNum) + '☆'.repeat(5 - valNum);

            ricetteList.push({
                titolo: data.nome || data.titolo || 'Ricetta',
                valutazioneNum: valNum,
                stelle: stelleStr,
                creatore: creatore,
                coloreUtente: coloreUtente,
                bgTrasparente: hexToRgba(coloreUtente, 0.12)
            });
        });

        ricetteList.sort((a, b) => b.valutazioneNum - a.valutazioneNum);
        const top4Ricette = ricetteList.slice(0, 4);

        const mediaSnapshot = await getDocs(collection(db, "media"));
        let mediaData = [];
        mediaSnapshot.forEach(function(doc) {
            const data = doc.data();
            if (data.url && data.tipo !== 'video') {
                mediaData.push(data.url);
            }
        });

        if (mediaData.length === 0) {
            mediaData = [
                'https://picsum.photos/seed/fam1/200',
                'https://picsum.photos/seed/fam2/200',
                'https://picsum.photos/seed/fam3/200',
                'https://picsum.photos/seed/fam4/200',
                'https://picsum.photos/seed/fam5/200'
            ];
        } else {
            mediaData = mediaData.slice(0, 5);
        }

        container.innerHTML = `
            <div class="dashboard-grid">
                <!-- 1. CARD SCADENZE -->
                ${permessi.scadenze !== false ? `
                <div class="card" onclick="selezionaScheda('scadenze')" style="cursor: pointer;" title="Clicca per aprire Scadenze">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-file-invoice-dollar"></i> SCADENZE</h3>
                    </div>
                    <div class="card-body">
                        ${scadenzeFiltrate.length > 0 ? `
                            <ul class="scadenze-list">
                                ${scadenzeFiltrate.map(function(s) {
                                    return `
                                    <li class="scadenza-item ${coloreScadenza}">
                                        <div class="scadenza-row">
                                            <span class="scadenza-title">${s.titolo}</span>
                                            <span class="scadenza-amount">${s.importo}</span>
                                        </div>
                                        <div class="scadenza-row">
                                            <span class="scadenza-date">${s.dataFormattata}</span>
                                            <span class="scadenza-status">${s.giorniMancanti < 0 ? 'Scaduta' : (s.giorniMancanti === 0 ? 'Scade oggi' : 'Tra ' + s.giorniMancanti + ' gg')}</span>
                                        </div>
                                    </li>`;
                                }).join('')}
                            </ul>
                        ` : '<p class="card-empty">Nessuna scadenza in evidenza</p>'}
                    </div>
                </div>
                ` : ''}

                <!-- 2. CARD IMPEGNI DI OGGI -->
                ${permessi.impegni !== false ? `
                <div class="card" onclick="selezionaScheda('impegni')" style="cursor: pointer;" title="Clicca per aprire Impegni">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-calendar-days"></i> IMPEGNI DI OGGI (${formatDataEuropea(dataOggiIso)})</h3>
                    </div>
                    <div class="card-body">
                        ${impegniList.length > 0 ? `
                            <div class="impegni-grid-home">
                                ${impegniList.map(function(i) {
                                    return `
                                    <div class="impegno-quadratino-home" style="background-color: ${i.bgTrasparente}; border-left-color:${i.coloreUtente};">
                                        <div class="impegno-quadratino-top">
                                            <span class="impegno-quadratino-titolo">${i.titolo}</span>
                                            <span class="impegno-quadratino-creatore">(${i.creatore})</span>
                                        </div>
                                        <div class="impegno-quadratino-bottom">
                                            <span class="impegno-quadratino-ora">
                                                <i class="fa-regular fa-clock"></i> ${i.oraInizio ? i.oraInizio : 'Tutto il gg'}
                                            </span>
                                        </div>
                                    </div>`;
                                }).join('')}
                            </div>
                        ` : '<p class="card-empty">Nessun impegno in programma per oggi</p>'}
                    </div>
                </div>
                ` : ''}

                <!-- 3. CARD FOTO & VIDEO -->
                ${permessi.media !== false ? `
                <div class="card" onclick="selezionaScheda('media')" style="cursor: pointer;" title="Clicca per aprire Foto & Video">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-photo-film"></i> FOTO & VIDEO</h3>
                    </div>
                    <div class="card-body">
                        ${mediaData.length > 0 ? `
                            <div class="media-grid-preview">
                                ${mediaData.map(function(img) { return '<img src="' + img + '" class="media-thumb" alt="Anteprima media">'; }).join('')}
                            </div>
                        ` : '<p class="card-empty">Nessun contenuto multimediale recente</p>'}
                    </div>
                </div>
                ` : ''}

                <!-- 4. CARD RICETTE -->
                ${permessi.ricette !== false ? `
                <div class="card" onclick="selezionaScheda('ricette')" style="cursor: pointer;" title="Clicca per aprire Ricette">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-utensils"></i> RICETTE PREFERITE</h3>
                    </div>
                    <div class="card-body">
                        ${top4Ricette.length > 0 ? `
                            <div class="ricette-grid-home">
                                ${top4Ricette.map(function(r) {
                                    return `
                                    <div class="ricetta-quadratino-home" style="background-color: ${r.bgTrasparente}; border-left-color:${r.coloreUtente};">
                                        <div class="ricetta-quadratino-top">
                                            <span class="ricetta-quadratino-titolo">${r.titolo}</span>
                                            <span class="ricetta-quadratino-creatore">(${r.creatore})</span>
                                        </div>
                                        <div class="ricetta-quadratino-bottom">
                                            <span class="ricetta-quadratino-stelle">${r.stelle}</span>
                                        </div>
                                    </div>`;
                                }).join('')}
                            </div>
                        ` : '<p class="card-empty">Nessuna ricetta salvata</p>'}
                    </div>
                </div>
                ` : ''}
            </div>
        `;

    } catch (error) {
        console.error("Errore nel recupero dei dati da Firebase:", error);
        container.innerHTML = '<p style="color: red; text-align: center;">Errore durante il caricamento dei dati dal database.</p>';
    }
}
