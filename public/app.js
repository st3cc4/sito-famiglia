// Selezioniamo gli elementi dal documento HTML
const form = document.getElementById('scadenza-form');
const inputTitolo = document.getElementById('titolo');
const inputData = document.getElementById('data');
const inputImporto = document.getElementById('importo');
const listaScadenze = document.getElementById('lista-scadenze');

// Carichiamo le scadenze salvate in precedenza (o partiamo con una lista vuota)
let scadenze = JSON.parse(localStorage.getItem('famiglia_scadenze')) || [];

// Funzione per mostrare le scadenze a schermo
function mostraScadenze() {
    listaScadenze.innerHTML = '';

    if (scadenze.length === 0) {
        listaScadenze.innerHTML = '<p style="text-align: center; color: #94a3b8; padding: 10px;">Nessuna scadenza inserita.</p>';
        return;
    }

    scadenze.forEach((scadenza, indice) => {
        const li = document.createElement('li');
        li.className = 'elemento-lista';

        li.innerHTML = `
            <div class="info-scadenza">
                <h3>${scadenza.titolo}</h3>
                <p>📅 Scadenza: ${scadenza.data} &nbsp;|&nbsp; 💶 <strong>€ ${Number(scadenza.importo).toFixed(2)}</strong></p>
            </div>
            <button class="btn-elimina" onclick="eliminaScadenza(${indice})">Fatto / Elimina</button>
        `;

        listaScadenze.appendChild(li);
    });
}

// Funzione per aggiungere una nuova scadenza
form.addEventListener('submit', function(e) {
    e.preventDefault(); // Evita il ricaricamento della pagina

    const nuovaScadenza = {
        titolo: inputTitolo.value,
        data: inputData.value,
        importo: inputImporto.value
    };

    scadenze.push(nuovaScadenza);
    salvaEAggiorna();

    // Pulisce il modulo
    form.reset();
});

// Funzione per eliminare una scadenza
function eliminaScadenza(indice) {
    scadenze.splice(indice, 1);
    salvaEAggiorna();
}

// Salva nel localStorage e aggiorna la schermata
function salvaEAggiorna() {
    localStorage.setItem('famiglia_scadenze', JSON.stringify(scadenze));
    mostraScadenze();
}

// Mostra le scadenze all'avvio
mostraScadenze();
