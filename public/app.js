function pulisciECompilaDati(testo) {
    const linee = testo.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // 1. Riconoscimento Ente
    let enteTrovato = "Enel";
    const testoUnito = testo.toLowerCase();
    
    if (testoUnito.includes("enel")) enteTrovato = "Enel";
    else if (testoUnito.includes("iren")) enteTrovato = "Iren";
    else if (testoUnito.includes("hera")) enteTrovato = "Hera";
    else if (testoUnito.includes("enigas") || testoUnito.includes("eni")) enteTrovato = "Eni Gas e Luce";
    else if (testoUnito.includes("acea")) enteTrovato = "Acea";
    else if (linee.length > 0) {
        for (let l of linee) {
            if (l.length > 2 && !l.includes("XXXX") && !l.includes("Codice")) {
                enteTrovato = l;
                break;
            }
        }
    }
    inputTitolo.value = formatCapitalize(enteTrovato);

    // 2. Riconoscimento Importo
    let importoTrovato = "";
    for (let i = 0; i < linee.length; i++) {
        let linea = linee[i].toLowerCase();
        if (linea.includes("quanto pago") || linea.includes("totale") || linea.includes("importo")) {
            let match = linee[i].match(/([0-9]+[.,][0-9]{2})/);
            if (!match && i + 1 < linee.length) {
                match = linee[i+1].match(/([0-9]+[.,][0-9]{2})/);
            }
            if (match) {
                importoTrovato = match[1].replace(',', '.');
                break;
            }
        }
    }
    if (!importoTrovato) {
        for (let linea of linee) {
            const match = linea.match(/\b([1-9][0-9]*[.,][0-9]{2})\b/);
            if (match) {
                importoTrovato = match[1].replace(',', '.');
                break;
            }
        }
    }
    if (importoTrovato) inputImporto.value = importoTrovato;

    // 3. Riconoscimento Data (Cerca prioritariamente "quando scade" per evitare la fine offerta)
    let dataTrovata = "";
    for (let i = 0; i < linee.length; i++) {
        let linea = linee[i].toLowerCase();
        // Cerca specificamente la riga del pagamento
        if (linea.includes("quando scade") || linea.includes("pagamento")) {
            for (let j = i; j <= Math.min(i + 2, linee.length - 1); j++) {
                let match = linee[j].match(/\b(0[1-9]|[12][0-9]|3[01])[\/\-](0[1-9]|1[0-2])[\/\-](20\d{2})\b/);
                if (match) {
                    dataTrovata = `${match[3]}-${match[2]}-${match[1]}`;
                    break;
                }
            }
            if (dataTrovata) break;
        }
    }

    // Fallback generale se non trova la dicitura specifica
    if (!dataTrovata) {
        for (let i = 0; i < linee.length; i++) {
            let linea = linee[i].toLowerCase();
            if (linea.includes("scade") && !linea.includes("offerta")) {
                let match = linee[i].match(/\b(0[1-9]|[12][0-9]|3[01])[\/\-](0[1-9]|1[0-2])[\/\-](20\d{2})\b/);
                if (match) {
                    dataTrovata = `${match[3]}-${match[2]}-${match[1]}`;
                    break;
                }
            }
        }
    }

    if (dataTrovata) {
        inputData.value = dataTrovata;
    }
}
