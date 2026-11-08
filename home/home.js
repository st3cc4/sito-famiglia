// Funzione per calcolare la classe colore in base alla data
export function getScadenzaColorClass(dataScadenzaStr) {
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  let dataScadenza;
  if (dataScadenzaStr.includes('-')) {
    const parti = dataScadenzaStr.split('-');
    if (parti[0].length === 4) {
      // Formato YYYY-MM-DD
      dataScadenza = new Date(parti[0], parti[1] - 1, parti[2]);
    } else {
      // Formato DD-MM-YYYY
      dataScadenza = new Date(parti[2], parti[1] - 1, parti[0]);
    }
  } else {
    dataScadenza = new Date(dataScadenzaStr);
  }
  
  dataScadenza.setHours(0, 0, 0, 0);

  const diffTempo = dataScadenza.getTime() - oggi.getTime();
  const diffGiorni = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

  if (diffGiorni <= 7) {
    return { 
      classe: 'scadenza-rosso', 
      testo: diffGiorni < 0 ? 'Scaduta' : (diffGiorni === 0 ? 'Oggi' : `Tra ${diffGiorni} gg`) 
    };
  } else if (diffGiorni <= 14) {
    return { 
      classe: 'scadenza-giallo', 
      testo: `Tra ${diffGiorni} gg` 
    };
  } else {
    return { 
      classe: 'scadenza-verde', 
      testo: `Tra ${diffGiorni} gg` 
    };
  }
}

// Funzione di rendering per Firebase o array di dati
export function renderScadenze(listaScadenze) {
  const container = document.getElementById('scadenze-container');
  if (!container || !listaScadenze) return;

  let html = '<ul class="scadenze-list">';

  listaScadenze.forEach(item => {
    const info = getScadenzaColorClass(item.data);
    
    html += `
      <li class="scadenza-item ${info.classe}">
        <div class="scadenza-info">
          <strong>${item.titolo} € ${parseFloat(item.importo).toFixed(2)}</strong>
          <div class="scadenza-details">${item.data} (${item.persona})</div>
        </div>
        <div><strong>${info.testo}</strong></div>
      </li>
    `;
  });

  html += '</ul>';
  container.innerHTML = html;
}
