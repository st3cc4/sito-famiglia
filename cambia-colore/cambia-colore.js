// --- Import SDK Firebase ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, collection, getDocs, doc, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAtMnKhhfC43J73kVm8-QcNghqzOTV6UKA",
    authDomain: "sito-famiglia.firebaseapp.com",
    projectId: "sito-famiglia",
    storageBucket: "sito-famiglia.appspot.com",
    messagingSenderId: "93216467751",
    appId: "1:93216467751:web:9930052845521ca5ef895a",
    measurementId: "G-NYRQJDTWM3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Inizializzazione della sezione Cambia Colore
export async function initCambiaColoreSection(container) {
    const savedUserStr = localStorage.getItem('famiglia_pwa_user') || sessionStorage.getItem('famiglia_pwa_user');
    const userData = savedUserStr ? JSON.parse(savedUserStr) : { nome: 'Utente', colore: '#3498db' };

    const coloreAttuale = userData.colore || '#3498db';

    // Lista tavolozza colori consigliati
    const coloriPreset = [
        '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', 
        '#1abc9c', '#3498db', '#9b59b6', '#34495e',
        '#e91e63', '#00bcd4', '#4caf50', '#ff9800'
    ];

    container.innerHTML = `
        <div class="cambia-colore-container">
            <div class="colore-card">
                <div class="colore-card-header">
                    <h3><i class="fa-solid fa-palette"></i> CAMBIA COLORE DISTINTIVO</h3>
                </div>
                <div class="colore-card-body">
                    <form id="form-cambia-colore">
                        <div>
                            <span class="color-presets-label">Scegli tra i colori rapidi:</span>
                            <div class="color-presets-grid" id="presets-container">
                                ${coloriPreset.map(c => `
                                    <button type="button" class="color-preset-btn ${c.toLowerCase() === coloreAttuale.toLowerCase() ? 'selected' : ''}" 
                                            data-color="${c}" style="background-color: ${c};"></button>
                                `).join('')}
                            </div>
                        </div>

                        <div>
                            <span class="color-presets-label">Oppure seleziona un colore personalizzato:</span>
                            <div class="color-picker-custom-box">
                                <input type="color" id="input-colore-custom" class="color-picker-custom-input" value="${coloreAttuale}">
                                <span style="font-size: 0.88rem; color: #475569;">Fai clic per aprire il selettore di colori</span>
                            </div>
                        </div>

                        <div>
                            <span class="color-presets-label">Anteprima:</span>
                            <div class="color-preview-box" id="color-preview" style="background-color: ${coloreAttuale};">
                                <span>${userData.nome || 'Utente'}</span>
                                <i class="fa-solid fa-user-tag"></i>
                            </div>
                        </div>

                        <div class="colore-footer">
                            <button type="submit" class="btn-salva-colore">Salva Colore</button>
                        </div>
                        <div id="colore-msg" class="colore-msg"></div>
                    </form>
                </div>
            </div>
        </div>
    `;

    const form = document.getElementById('form-cambia-colore');
    const inputCustom = document.getElementById('input-colore-custom');
    const preview = document.getElementById('color-preview');
    const msgBox = document.getElementById('colore-msg');
    const presetButtons = container.querySelectorAll('.color-preset-btn');

    let coloreSelezionato = coloreAttuale;

    // Gestione Selezione Preset
    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            presetButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            coloreSelezionato = btn.getAttribute('data-color');
            inputCustom.value = coloreSelezionato;
            preview.style.backgroundColor = coloreSelezionato;
        });
    });

    // Gestione Selezione Custom
    inputCustom.addEventListener('input', (e) => {
        presetButtons.forEach(b => b.classList.remove('selected'));
        coloreSelezionato = e.target.value;
        preview.style.backgroundColor = coloreSelezionato;
    });

    // Salvataggio su Firestore
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        msgBox.className = 'colore-msg';
        msgBox.textContent = '';

        try {
            const utentiSnapshot = await getDocs(collection(db, "utenti"));
            let userDocRef = null;

            utentiSnapshot.forEach(docSnap => {
                const data = docSnap.data();
                const matchNome = userData.nome && data.nome && data.nome.toLowerCase() === userData.nome.toLowerCase();
                const matchUsername = userData.username && data.username && data.username.toLowerCase() === userData.username.toLowerCase();
                
                if (matchUsername || matchNome) {
                    userDocRef = doc(db, "utenti", docSnap.id);
                }
            });

            if (!userDocRef) {
                msgBox.textContent = "Utente non trovato nel database.";
                msgBox.classList.add('error');
                return;
            }

            // Aggiorna colore su Firestore
            await updateDoc(userDocRef, {
                colore: coloreSelezionato
            });

            // Aggiorna sessione locale
            userData.colore = coloreSelezionato;
            if (localStorage.getItem('famiglia_pwa_user')) {
                localStorage.setItem('famiglia_pwa_user', JSON.stringify(userData));
            } else {
                sessionStorage.setItem('famiglia_pwa_user', JSON.stringify(userData));
            }

            // Aggiorna subito il badge nell'header della Home
            const headerBadge = document.getElementById('user-display-name');
            if (headerBadge) {
                headerBadge.style.backgroundColor = coloreSelezionato;
            }

            msgBox.textContent = "Colore aggiornato con successo!";
            msgBox.classList.add('success');

        } catch (err) {
            console.error("Errore aggiornamento colore:", err);
            msgBox.textContent = "Si è verificato un errore durante il salvataggio.";
            msgBox.classList.add('error');
        }
    });
}
