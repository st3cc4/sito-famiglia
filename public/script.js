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
    const titolo = document.getElementById('titolo-bolletta').value;
    const mittente = document.getElementById('mittente-bolletta').value;
    const importo = document.getElementById('importo-bolletta').value;
    const scadenza = document.getElementById('scadenza-bolletta').value;
    const stato = document.getElementById('stato-bolletta').value;

    bollette.push({ titolo, mittente, importo, scadenza, stato });
    salvaEsterndiBollette();
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
        container.innerHTML += `
            <div class="bolletta-card ${classeColore}">
                <h4>${b.titolo}</h4>
                <p><strong>Inviata da:</strong> ${b.mittente}</p>
                <p><strong>Importo:</strong> €${b.importo}</p>
                <p><strong>Scadenza:</strong> ${b.scadenza}</p>
                <p><strong>Stato:</strong> ${b.stato === 'pagata' ? 'Già pagata' : 'Da pagare'}</p>
                <button onclick="rimuoviBolletta(${index})" class="btn" style="background:var(--rosso); padding: 0.4rem; font-size:0.8rem;">Elimina</button>
            </div>
        `;
    });
}

function rimuoviBolletta(index) {
    bollette.splice(index, 1);
    salvaEsterndiBollette();
    mostraBollette();
}

function salvaEsterndiBollette() {
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
    if(!titolo || !data) return;

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

    // Risposta simulata da parte mia (Gemini in famiglia)
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
