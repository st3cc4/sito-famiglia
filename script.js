async function caricaScadenze() {
    listaScadenze.innerHTML = `<p class="text-muted">Caricamento in corso...</p>`;
    summaryScadenze.innerHTML = `<p class="text-muted">Caricamento in corso...</p>`;
    
    try {
        const querySnapshot = await getDocs(collection(db, "scadenze"));
        let scadenze = [];
        querySnapshot.forEach(docSnap => {
            scadenze.push({ id: docSnap.id, ...docSnap.data() });
        });

        scadenze.sort((a, b) => new Date(a.data) - new Date(b.data));

        let htmlScadenze = "";
        let totaleComplessivo = 0;
        
        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);

        if (scadenze.length === 0) {
            listaScadenze.innerHTML = `<p class="text-muted">Nessuna scadenza inserita.</p>`;
            summaryScadenze.innerHTML = `<p class="text-muted">Nessuna scadenza in arrivo.</p>`;
            totaleGeneraleScadenze.textContent = `Totale da pagare: € 0.00`;
            return;
        }

        let scadenzeCalcolate = scadenze.map(s => {
            totaleComplessivo += Number(s.importo || 0);
            
            const dataScadObj = new Date(s.data);
            dataScadObj.setHours(0, 0, 0, 0);
            const diffTempo = dataScadObj - oggi;
            const diffGiorni = Math.round(diffTempo / (1000 * 60 * 60 * 24));

            let stringaGiorni = "";
            let statusClass = "status-green";

            if (diffGiorni < 0) {
                statusClass = "status-red";
                const giorniPassati = Math.abs(diffGiorni);
                stringaGiorni = `Scaduta da ${giorniPassati} ${giorniPassati === 1 ? 'giorno' : 'giorni'}`;
            } else if (diffGiorni === 0) {
                statusClass = "status-red";
                stringaGiorni = `Scade oggi!`;
            } else if (diffGiorni <= 7) {
                statusClass = "status-red";
                stringaGiorni = `Mancano ${diffGiorni} giorni`;
            } else if (diffGiorni <= 14) {
                statusClass = "status-orange";
                stringaGiorni = `Mancano ${diffGiorni} giorni`;
            } else {
                statusClass = "status-green";
                stringaGiorni = `Mancano ${diffGiorni} giorni`;
            }

            return { ...s, diffGiorni, stringaGiorni, statusClass };
        });

        scadenzeCalcolate.forEach(s => {
            const creatoreScadenza = s.creatore ? s.creatore : "Famiglia";
            htmlScadenze += `
                <li class="scadenza-badge-item ${s.statusClass}">
                    <div>
                        <strong>${s.titolo}</strong> - Scad: ${formatoDataEuropeo(s.data)} (${s.stringaGiorni}) - <strong>€ ${Number(s.importo).toFixed(2)}</strong> <span style="font-size: 0.85rem; font-weight: normal; color: #475569; margin-left: 6px;">[${creatoreScadenza}]</span>
                    </div>
                    <div class="azioni-utente">
                        <button class="btn-modifica" onclick="modificaScadenza('${s.id}', '${s.titolo}', '${s.data}', '${s.importo}')">Mod.</button>
                        <button class="btn-elimina" onclick="eliminaScadenza('${s.id}')">Elimina</button>
                    </div>
                </li>`;
        });

        const scadenzeRosse = scadenzeCalcolate.filter(s => s.statusClass === 'status-red');
        const scadenzeArancioni = scadenzeCalcolate.filter(s => s.statusClass === 'status-orange');
        const scadenzeVerdi = scadenzeCalcolate.filter(s => s.statusClass === 'status-green');

        let scadenzeDaMostrareInHome = [];
        if (scadenzeRosse.length > 0) {
            scadenzeDaMostrareInHome = scadenzeRosse;
        } else if (scadenzeArancioni.length > 0) {
            scadenzeDaMostrareInHome = scadenzeArancioni;
        } else {
            scadenzeDaMostrareInHome = scadenzeVerdi;
        }

        let htmlHomeSummary = "";
        scadenzeDaMostrareInHome.forEach(s => {
            htmlHomeSummary += `
                <div class="scadenza-summary-badge ${s.statusClass}">
                    <div>
                        <strong>${s.titolo}</strong> (${formatoDataEuropeo(s.data)}) - <span style="font-size: 0.8rem; font-weight: normal;">${s.stringaGiorni}</span>
                    </div>
                    <div style="font-weight: bold;">€ ${Number(s.importo).toFixed(2)}</div>
                </div>`;
        });

        listaScadenze.innerHTML = htmlScadenze;
        summaryScadenze.innerHTML = htmlHomeSummary || `<p class="text-muted">Nessuna scadenza in programma.</p>`;
        totaleGeneraleScadenze.textContent = `Totale da pagare: € ${totaleComplessivo.toFixed(2)}`;

    } catch (err) {
        listaScadenze.innerHTML = `<p class="text-muted">Errore nel caricamento delle scadenze.</p>`;
        summaryScadenze.innerHTML = `<p class="text-muted">Errore caricamento.</p>`;
    }
}

window.eliminaScadenza = async function(id) {
    if (confirm("Vuoi eliminare questa scadenza?")) {
        await deleteDoc(doc(db, "scadenze", id));
        caricaScadenze();
    }
}

window.modificaScadenza = function(id, titolo, data, importo) {
    modalTitle.textContent = "Modifica Scadenza";
    inputTitolo.value = titolo;
    inputData.value = data;
    inputImporto.value = importo;
    scadenzaForm.dataset.editId = id;
    modalScadenza.style.display = 'flex';
}

async function elaboraImmagineOCR(file) {
    ocrLoading.style.display = 'block';
    ocrProgress.textContent = '0%';
    try {
        const result = await Tesseract.recognize(file, 'ita', {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const prog = Math.round(m.progress * 100);
                    ocrProgress.textContent = `${prog}%`;
                }
            }
        });
        const testo = result.data.text;
        
        const matchImporto = testo.match(/(?:[€E]?\s*)(\d+[\.,]\d{2})/);
        if (matchImporto) {
            inputImporto.value = matchImporto[1].replace(',', '.');
        }

        const matchData = testo.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
        if (matchData) {
            inputData.value = `${matchData[3]}-${matchData[2]}-${matchData[1]}`;
        }

        if (testo.toLowerCase().includes('enel')) inputTitolo.value = "Enel Energia";
        else if (testo.toLowerCase().includes('telecom') || testo.toLowerCase().includes('tim')) inputTitolo.value = "TIM / Telefono";
        else if (testo.toLowerCase().includes('acqua')) inputTitolo.value = "Bolletta Acqua";

    } catch (err) {
        alert("Errore durante la lettura OCR dell'immagine.");
    } finally {
        ocrLoading.style.display = 'none';
    }
}

inputScattaFoto.addEventListener('change', (e) => {
    if (e.target.files[0]) elaboraImmagineOCR(e.target.files[0]);
});
inputCaricaFoto.addEventListener('change', (e) => {
    if (e.target.files[0]) elaboraImmagineOCR(e.target.files[0]);
});

appuntamentoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titolo = formatCapitalize(appTitolo.value);
    const data = appData.value;
    const oraInizio = appOraInizio.value;
    const oraFine = appOraFine.value;
    const editId = appIdInput.value;

    const datiAppuntamento = {
        titolo,
        data,
        oraInizio,
        oraFine,
        creatore: nomeUtenteCorrente
    };

    try {
        if (editId) {
            await updateDoc(doc(db, "appuntamenti", editId), datiAppuntamento);
        } else {
            await addDoc(collection(db, "appuntamenti"), datiAppuntamento);
        }
        modalAppuntamento.style.display = 'none';
        appuntamentoForm.reset();
        caricaAppuntamenti();
    } catch (err) {
        alert("Errore nel salvataggio dell'appuntamento.");
    }
});

async function caricaAppuntamenti() {
    gridSettimanale.innerHTML = `<p class="text-muted" style="padding: 20px;">Caricamento calendario...</p>`;
    summaryAppuntamenti.innerHTML = `<p class="text-muted">Caricamento in corso...</p>`;

    try {
        const querySnapshot = await getDocs(collection(db, "appuntamenti"));
        let appuntamenti = [];
        querySnapshot.forEach(docSnap => {
            appuntamenti.push({ id: docSnap.id, ...docSnap.data() });
        });

        let giorniSettimana = [];
        let curr = new Date(dataInizioSettimanaCorrente);
        for (let i = 0; i < 7; i++) {
            giorniSettimana.push(new Date(curr));
            curr.setDate(curr.getDate() + 1);
        }

        const dataInizioStr = giorniSettimana[0].toISOString().split('T')[0];
        const dataFineStr = giorniSettimana[6].toISOString().split('T')[0];

        settimanaLabel.textContent = `${formatoDataEuropeo(dataInizioStr)} - ${formatoDataEuropeo(dataFineStr)}`;

        const giorniNomi = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
        const oggiIso = new Date().toISOString().split('T')[0];

        let htmlGriglia = "";
        giorniSettimana.forEach((giornoDate, index) => {
            const isoDate = giornoDate.toISOString().split('T')[0];
            const isOggi = isoDate === oggiIso;
            const nomeGiorno = giorniNomi[index];
            const numGiorno = giornoDate.getDate();

            let appuntamentiGiorno = appuntamenti.filter(a => a.data === isoDate);
            appuntamentiGiorno.sort((a, b) => a.oraInizio.localeCompare(b.oraInizio));

            let htmlImpegni = "";
            appuntamentiGiorno.forEach(app => {
                const coloreCreatore = mappaColoriUtenti[app.creatore] || '#3b82f6';
                htmlImpegni += `
                    <div class="card-impegno-google" style="border-left-color: ${coloreCreatore};">
                        <div class="card-impegno-titolo">${app.titolo}</div>
                        <div class="card-impegno-orario">${app.oraInizio} - ${app.oraFine}</div>
                        <div class="card-impegno-creatore">Creato da: ${app.creatore}</div>
                        <div class="card-impegno-azioni">
                            <button class="btn-mini btn-mini-edit" onclick="modificaAppuntamento('${app.id}', '${app.titolo}', '${app.data}', '${app.oraInizio}', '${app.oraFine}')">Mod</button>
                            <button class="btn-mini btn-mini-del" onclick="eliminaAppuntamento('${app.id}')">Del</button>
                        </div>
                    </div>`;
            });

            htmlGriglia += `
                <div class="colonna-giorno-scheda">
                    <div class="header-giorno-moderno ${isOggi ? 'oggi' : ''}" onclick="apriModalNuovoAppuntamento('${isoDate}')" title="Clicca per aggiungere un impegno">
                        <div class="nome-giorno">${nomeGiorno}</div>
                        <div class="numero-giorno">${numGiorno}</div>
                    </div>
                    <div class="corpo-giorno-moderno">
                        ${htmlImpegni || '<span class="text-muted" style="font-size: 0.85rem;">Nessun impegno</span>'}
                    </div>
                </div>`;
        });

        gridSettimanale.innerHTML = htmlGriglia;

        let appFuturi = appuntamenti.filter(a => a.data >= oggiIso);
        appFuturi.sort((a, b) => a.data.localeCompare(b.data) || a.oraInizio.localeCompare(b.oraInizio));
        
        const dateDistinte = [...new Set(appFuturi.map(a => a.data))].slice(0, 3);
        const stiliColoriGiorni = [
            { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
            { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
            { bg: '#faf5ff', border: '#a855f7', text: '#6b21a8' } 
        ];

        let htmlHomeApp = "";
        if (dateDistinte.length === 0) {
            summaryAppuntamenti.innerHTML = `<p class="text-muted">Nessun appuntamento in programma.</p>`;
        } else {
            dateDistinte.forEach((dataIso, idx) => {
                const stile = stiliColoriGiorni[idx % stiliColoriGiorni.length];
                const appDelGiorno = appFuturi.filter(a => a.data === dataIso);

                htmlHomeApp += `
                    <div style="background-color: ${stile.bg}; border-left: 4px solid ${stile.border}; padding: 8px 12px; border-radius: 6px; margin-bottom: 10px;">
                        <div style="font-weight: bold; color: ${stile.text}; font-size: 0.85rem; margin-bottom: 6px;">
                            📅 ${formatoDataEuropeo(dataIso)}
                        </div>`;

                appDelGiorno.forEach(app => {
                    htmlHomeApp += `
                        <div style="padding: 4px 0; border-top: 1px dashed rgba(0,0,0,0.1); display: flex; justify-content: space-between; font-size: 0.9rem;">
                            <span><strong>${app.titolo}</strong> (${app.oraInizio})</span>
                            <span style="font-size: 0.8rem; color: #64748b;">${app.creatore}</span>
                        </div>`;
                });

                htmlHomeApp += `</div>`;
            });
            summaryAppuntamenti.innerHTML = htmlHomeApp;
        }

    } catch (err) {
        gridSettimanale.innerHTML = `<p class="text-muted" style="padding: 20px;">Errore nel caricamento del calendario.</p>`;
        summaryAppuntamenti.innerHTML = `<p class="text-muted">Errore caricamento.</p>`;
    }
}

window.eliminaAppuntamento = async function(id) {
    if (confirm("Vuoi eliminare questo appuntamento?")) {
        await deleteDoc(doc(db, "appuntamenti", id));
        caricaAppuntamenti();
    }
}

window.modificaAppuntamento = function(id, titolo, data, oraInizio, oraFine) {
    modalAppuntamentoTitle.textContent = "Modifica Appuntamento";
    appIdInput.value = id;
    appTitolo.value = titolo;
    appData.value = data;
    appOraInizio.value = oraInizio;
    appOraFine.value = oraFine;
    appCreatore.value = nomeUtenteCorrente;
    modalAppuntamento.style.display = 'flex';
}

// --- GESTIONE RICETTE ---
ricettaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = formatCapitalize(ricettaNomeInput.value);
    const editId = ricettaIdInput.value;

    const ingredienti = [];
    containerIngredienti.querySelectorAll('.input-ingrediente').forEach(input => {
        if (input.value.trim()) ingredienti.push(formatCapitalize(input.value));
    });

    const procedimento = [];
    containerProcedimento.querySelectorAll('.input-passo').forEach(input => {
        if (input.value.trim()) procedimento.push(formatCapitalize(input.value));
    });

    const note = formatCapitalize(ricettaNoteInput.value);

    const datiRicetta = {
        nome,
        ingredienti,
        procedimento,
        note,
        creatore: nomeUtenteCorrente
    };

    try {
        if (editId) {
            await updateDoc(doc(db, "ricette", editId), datiRicetta);
        } else {
            await addDoc(collection(db, "ricette"), datiRicetta);
        }
        modalRicetta.style.display = 'none';
        ricettaForm.reset();
        caricaRicette();
    } catch (err) {
        alert("Errore nel salvataggio della ricetta.");
    }
});

async function caricaRicette() {
    listaRicette.innerHTML = `<p class="text-muted">Caricamento ricette...</p>`;
    summaryRicette.innerHTML = `<p class="text-muted">Caricamento in corso...</p>`;

    try {
        const querySnapshot = await getDocs(collection(db, "ricette"));
        let ricette = [];
        querySnapshot.forEach(docSnap => {
            ricette.push({ id: docSnap.id, ...docSnap.data() });
        });

        ricette.sort((a, b) => a.nome.localeCompare(b.nome));
        elListaRicetteGlobal = ricette;

        if (ricette.length === 0) {
            listaRicette.innerHTML = `<p class="text-muted">Nessuna ricetta inserita nel ricettario.</p>`;
            summaryRicette.innerHTML = `<p class="text-muted">Nessuna ricetta salvata.</p>`;
            return;
        }

        let htmlGrigliaRicette = "";
        ricette.forEach(r => {
            let htmlIngredienti = "";
            if (r.ingredienti && r.ingredienti.length > 0) {
                r.ingredienti.forEach(ing => {
                    htmlIngredienti += `<li>• ${ing}</li>`;
                });
            }

            let htmlProcedimento = "";
            if (r.procedimento && r.procedimento.length > 0) {
                r.procedimento.forEach((pas, idx) => {
                    htmlProcedimento += `<li><strong>${idx + 1}.</strong> ${pas}</li>`;
                });
            }

            let htmlNote = r.note ? `<div style="margin-top: 6px; font-size: 0.9rem; color: #475569;"><strong>Note:</strong> ${r.note}</div>` : '';
            const creatoreRicetta = r.creatore ? r.creatore : "Famiglia";

            htmlGrigliaRicette += `
                <div class="ricetta-card-item" id="ricetta-card-${r.id}">
                    <div class="ricetta-header-row" onclick="toggleRicettaAccordion('${r.id}')">
                        <div class="ricetta-titolo">${r.nome}</div>
                        <span class="ricetta-creatore-tag">${creatoreRicetta}</span>
                    </div>
                    <div class="ricetta-corpo">
                        <div class="ricetta-sezione-titolo">Ingredienti:</div>
                        <ul class="ricetta-lista-elementi">${htmlIngredienti || '<li>Nessun ingrediente</li>'}</ul>

                        <div class="ricetta-sezione-titolo">Procedimento:</div>
                        <ul class="ricetta-lista-elementi" style="list-style-type: none; padding-left: 0;">${htmlProcedimento || '<li>Nessun procedimento</li>'}</ul>

                        ${htmlNote}

                        <div class="azioni-utente" style="margin-top: 10px;">
                            <button class="btn-modifica" onclick="modificaRicetta('${r.id}')">Mod.</button>
                            <button class="btn-elimina" onclick="eliminaRicetta('${r.id}')">Elimina</button>
                        </div>
                    </div>
                </div>`;
        });

        listaRicette.innerHTML = htmlGrigliaRicette;

        let htmlHomeRicette = "";
        ricette.forEach(r => {
            htmlHomeRicette += `
                <div style="padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem; font-weight: 600; color: #1e293b;">
                    ${r.nome}
                </div>`;
        });
        summaryRicette.innerHTML = htmlHomeRicette;

    } catch (err) {
        listaRicette.innerHTML = `<p class="text-muted">Errore nel caricamento delle ricette.</p>`;
        summaryRicette.innerHTML = `<p class="text-muted">Errore caricamento.</p>`;
    }
}

window.toggleRicettaAccordion = function(id) {
    const cardSelezionata = document.getElementById(`ricetta-card-${id}`);
    if (!cardSelezionata) return;

    const eraAperta = cardSelezionata.classList.contains('aperta');

    // Chiude tutte le schede delle ricette
    document.querySelectorAll('.ricetta-card-item').forEach(card => {
        card.classList.remove('aperta');
    });

    // Se quella cliccata non era aperta, adesso la apre
    if (!eraAperta) {
        cardSelezionata.classList.add('aperta');
    }
}

window.eliminaRicetta = async function(id) {
    if (confirm("Vuoi eliminare questa ricetta?")) {
        await deleteDoc(doc(db, "ricette", id));
        caricaRicette();
    }
}

window.modificaRicetta = async function(id) {
    try {
        const docSnap = await getDoc(doc(db, "ricette", id));
        if (docSnap.exists()) {
            const r = docSnap.data();
            modalRicettaTitle.textContent = "Modifica Ricetta";
            ricettaIdInput.value = id;
            ricettaNomeInput.value = r.nome || "";
            ricettaNoteInput.value = r.note || "";

            containerIngredienti.innerHTML = "";
            if (r.ingredienti && r.ingredienti.length > 0) {
                r.ingredienti.forEach(ing => aggiungiRigaIngrediente(ing));
            } else {
                aggiungiRigaIngrediente();
            }

            containerProcedimento.innerHTML = "";
            if (r.procedimento && r.procedimento.length > 0) {
                r.procedimento.forEach(pas => aggiungiRigaPasso(pas));
            } else {
                aggiungiRigaPasso();
            }

            modalRicetta.style.display = 'flex';
        }
    } catch (err) {
        alert("Errore nel recupero dei dati della ricetta.");
    }
}

utenteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = formatCapitalize(userNameInput.value);
    const password = userPassInput.value.trim();
    const colore = "#3b82f6";
    const permessi = {
        scadenze: permScadenze.checked,
        appuntamenti: permAppuntamenti.checked,
        media: permMedia.checked,
        ricette: permRicette.checked
    };

    try {
        await setDoc(doc(db, "utenti", nome), { nome, password, colore, permessi });
        alert("Utente configurato con successo!");
        utenteForm.reset();
        caricaListaUtenti();
    } catch (err) {
        alert("Errore nel salvataggio dell'utente.");
    }
});

async function caricaListaUtenti() {
    listaUtenti.innerHTML = `<p class="text-muted">Caricamento utenti...</p>`;
    try {
        const querySnapshot = await getDocs(collection(db, "utenti"));
        let html = "";
        querySnapshot.forEach(docSnap => {
            const u = docSnap.data();
            html += `
                <li class="elemento-lista">
                    <div>
                        <span class="badge-utente" style="background-color: ${u.colore || '#3b82f6'};"></span>
                        <strong>${u.nome}</strong> (Password: ${u.password})
                    </div>
                    <div>
                        <button class="btn-elimina" onclick="eliminaUtente('${docSnap.id}')">Elimina</button>
                    </div>
                </li>`;
        });
        listaUtenti.innerHTML = html || `<p class="text-muted">Nessun utente configurato.</p>`;
    } catch (err) {
        listaUtenti.innerHTML = `<p class="text-muted">Errore caricamento utenti.</p>`;
    }
}

window.eliminaUtente = async function(emailId) {
    if (confirm(`Vuoi rimuovere l'utente ${emailId}?`)) {
        await deleteDoc(doc(db, "utenti", emailId));
        caricaListaUtenti();
    }
}
