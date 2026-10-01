function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// --- GESTIONE BOLLETTE ---
let bollette = JSON.parse(localStorage.getItem('bollette')) || [];

function aggiungiBolletta(e) {
    e.preventDefault();
    const ente = document.getElementById('ente-bolletta').value;
    const importo = document.getElementById('importo-bolletta').value;
    const scadenza = document.getElementById('scadenza-bolletta').value;
    
    // Nuova bolletta parte sempre come 'da-pagare'
    const stato = 'da-pagare';

    bollette.push({ ente, importo, scadenza, stato });
    salvaEsterniBollette();
    document.getElementById('bolletta-form').reset();
    mostraBollette();
}

function calcolaColoreBolletta(scadenza, stato) {
    if (stato === 'pagata') return 'grigia';
    
    const oggi = new Date();
    const dataScad = new Date(scadenza);
    const diffGiorni = Math.ceil((dataScad - oggi) / (1000 * 60 * 60 * 24));

    if (diffGiorni <= 7) return 'rossa';
    if (diffGiorni <= 14) return 'arancione';
    if (diffGiorni <= 21) return 'verde';
    return 'verde';
}

function mostraBollette() {
    // Ordina per scadenza (della prima che scade in alto)
    bollette.sort((a, b) => new Date(a.scadenza) - new Date(b.scadenza));

    const container = document.getElementById('lista-bollette');
    container.innerHTML = '';

    bollette.forEach((b, index) => {
        const classeColore = calcolaColoreBolletta(b.scadenza, b.stato);
        const testoStato = b.stato === 'pagata' ? 'Già pagata (Grigia)' : 'Da pagare';
        
        container.innerHTML += `
            <div class="bolletta-card ${classeColore}">
                <h4>⚡ ${b.ente}</h4>
                <p><strong>Importo:</strong> €${b.importo}</p>
                <p><strong>Scadenza:</strong> ${b.scadenza}</p>
                <p><strong>Stato:</strong> ${testoStato}</p>
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                    ${b.stato !== 'pagata' ? `<button onclick="segnaPagata(${index})" class="btn" style="background:var(--verde); padding: 0.4rem; font-size:0.75rem;">Paga</button>` : ''}
                    <button onclick="rimuoviBolletta(${index})" class="btn" style="background:var(--rosso); padding: 0.4rem; font-size:0.75rem;">Elimina</button>
                </div>
            </div>
        `;
    });
}

function segnaPagata(index) {
    bollette[index].stato = 'pagata';
    salvaEsterniBollette();
    mostraBollette();
}

function rimuoviBolletta(index) {
    bollette.splice(index, 1);
    salvaEsterniBollette();
    mostraBollette();
}

function salvaEsterniBollette() {
    localStorage.setItem('bollette', JSON.stringify(bollette));
}

// --- MEDIA ---
function caricaMedia() {
    const autore = document.getElementById('media-autore').value || 'Famiglia';
    const fileInput = document.getElementById('media-file');
    if(fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const galleria = document.getElementById('galleria-media');
            galleria.innerHTML += `<div class="bolletta-card"><p>Caricato da: <strong>${autore}</strong></p><img src="${e.target.result}" style="width:100%; border-radius:8px;"></div>`;
        }
        reader.readAsDataURL(fileInput.files[0]);
    }
}

// --- RICETTE ---
function aggiungiRicetta() {
    const titolo = document.getElementById('ricetta-titolo').value;
    const autore = document.getElementById('ricetta-autore').value;
    const ingredienti = document.getElementById('ricetta-ingredienti').value;
    
    if(!titolo) return;
    
    const container = document.getElementById('lista-ricette');
    container.innerHTML += `
        <div class="bolletta-card">
            <h4>🍲 ${titolo}</h4>
            <p><strong>A chi piace:</strong> ${autore || 'Tutti'} ❤️</p>
            <p><strong>Ingredienti:</strong> ${ingredienti}</p>
        </div>
    `;
    document.getElementById('ricetta-titolo').value = '';
    document.getElementById('ricetta-autore').value = '';
    document.getElementById('ricetta-ingredienti').value = '';
    document.getElementById('ricetta-preparazione').value = '';
}

// --- CALENDARIO ---
function aggiungiEvento() {
    const titolo = document.getElementById('evento-titolo').value;
    const data = document.getElementById('evento-data').value;
    if(!titolo || data === '') return;

    const lista = document.getElementById('lista-eventi');
    lista.innerHTML += `<li><strong>${data}</strong>: ${titolo}</li>`;
    document.getElementById('evento-titolo').value = '';
    document.getElementById('evento-data').value = '';
}

// --- CHAT GEMINI ---
function inviaMessaggio() {
    const input = document.getElementById('user-input');
    const testo = input.value.trim();
    if(!testo) return;

    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML += `<div class="message user">${testo}</div>`;
    input.value = '';

    setTimeout(() => {
        let risposta = "Ho ricevuto il messaggio Stecks! Ci penso io a ricordarlo a tutti.";
        if(testo.toLowerCase().includes('ciao')) risposta = "Ciao Stecks! Che bello sentirti. Come procede la giornata in famiglia?";
        chatMessages.innerHTML += `<div class="message gemini">${risposta}</div>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 800);
}

function handleChatKey(e) {
    if(e.key === 'Enter') inviaMessaggio();
}

// Inizializzazione
window.onload = function() {
    mostraBollette();
};
