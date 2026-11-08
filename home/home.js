// Funzione per calcolare la classe del colore in base ai giorni rimanenti
function getScadenzaColorClass(dataScadenzaStr) {
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  // Formato data atteso: YYYY-MM-DD oppure GG-MM-AAAA
  let dataScadenza;
  if (dataScadenzaStr.includes('-')) {
    const parti = dataScadenzaStr.split('-');
    if (parti[0].length === 4) {
      // YYYY-MM-DD
      dataScadenza = new Date(parti[0], parti[1] - 1, parti[2]);
    } else {
      // DD-MM-YYYY
      dataScadenza = new Date(parti[2], parti[1] - 1, parti[0]);
    }
  } else {
    dataScadenza = new Date(dataScadenzaStr);
  }
  
  dataScadenza.setHours(0, 0, 0, 0);

  // Calcolo la differenza in giorni
  const diffTempo = dataScadenza.getTime() - oggi.getTime();
  const diffGiorni = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

  if (diffGiorni <= 7) {
    return { classe: 'scadenza-rosso', testo: diffGiorni < 0 ? 'Scaduta' : (diffGiorni === 0 ? 'Oggi' : `Tra ${diffGiorni} gg`) };
  } else if (diffGiorni <= 14) {
    return { classe: 'scadenza-giallo', testo: `Tra ${diffGiorni} gg` };
  } else {
    return { classe: 'scadenza-verde', testo: `Tra ${diffGiorni} gg` };
  }
}

// Funzione di esempio per stampare le scadenze nell'HTML
function renderScadenze(listaScadenze) {
  const container = document.getElementById('scadenze-container');
  if (!container) return;

  let html = '<ul class="scadenze-list">';

  listaScadenze.forEach(item => {
    const infoColore = getScadenzaColorClass(item.data);
    
    html += `
      <li class="scadenza-item ${infoColore.classe}">
        <div class="scadenza-info">
          <strong>${item.titolo} € ${parseFloat(item.importo).toFixed(2)}</strong>
          <div class="scadenza-details">
            ${item.dataFormatted || item.data} (${item.persona})
          </div>
        </div>
        <div class="scadenza-badge">
          <strong>${infoColore.testo}</strong>
        </div>
      </li>
    `;
  });

  html += '</ul>';
  container.innerHTML = html;
}
