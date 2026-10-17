// js/impegni.js - Agenda Settimanale Verticale con Colori Differenziati e Domenica in Rosso

import { db } from "./firebase-config.js";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { mostraSezione } from "./navigation.js";

const containerImpegni = document.getElementById('container-impegni');
const modalImpegno = document.getElementById('modal-impegno');
const btnCloseModalImpegno = document.getElementById('btn-close-modal-impegno');
const formImpegno = document.getElementById('form-impegno');
const inputEditId = document.getElementById('impegno-edit-id');
const modalImpegnoTitoloTesto = document.getElementById('modal-impegno-titolo-testo');

let tuttiGliImpegni = [];
let dataRiferimentoSettimana = new Date(); // Data di partenza per la settimana visualizzata

// Configurazione nomi giorni e colori di sfondo leggeri
const configurazioneGiorni = [
    { nome: 'Lunedì', bg: '#eef6ff', headerBg: '#3498db' },
    { nome: 'Martedì', bg: '#f4eefd', headerBg: '#9b59b6' },
    { nome: 'Mercoledì', bg: '#eef9f6', headerBg: '#1abc9c' },
    { nome: 'Giovedì', bg: '#fef9e7', headerBg: '#f39c12' },
    { nome: 'Venerdì', bg: '#fef5e7', headerBg: '#e67e22' },
    { nome: 'Sabato', bg: '#f2f4f4', headerBg: '#7f8c8d' },
    { nome: 'Domenica', bg: '#fdedec', headerBg: '#e74c3c' } // Rosso caratteristico per la Domenica
];

export function initImpegni(getUtenteCorrente) {
    if (btnCloseModalImpegno) {
        btnCloseModalImpegno.addEventListener('click', () => {
            if (modalImpegno) modalImpegno.classList.remove('active');
        });
    }

    if (formImpegno) {
        formImpegno.addEventListener('submit', async (e) => {
            e.preventDefault();
            const utente = getUtenteCorrente();
            if (!utente) return;

            const editId = inputEditId ? inputEditId.value : "";
            const titolo = document.getElementById('impegno-titolo').value.trim();
            const data = document.getElementById('impegno-data').value;
            const oraInizio = document.getElementById('impegno-ora-inizio').value;
            const oraFine = document.getElementById('impegno-ora-fine').value;

            try {
                if (editId) {
                    // MODIFICA
                    const impRef = doc(db, "appuntamenti", editId);
                    await updateDoc(impRef, {
                        titolo,
                        data,
                        oraInizio: oraInizio || "",
                        oraFine: oraFine || ""
                    });
                } else {
                    // CREAZIONE
                    await addDoc(collection(db, "appuntamenti"), {
                        titolo,
                        data,
                        oraInizio: oraInizio || "",
                        oraFine: oraFine || "",
                        creatoDa: utente.nome,
                        creatoDaId: utente.id
                    });
                }

                formImpegno.reset();
                if (inputEditId) inputEditId.value = "";
                if (modalImpegno) modalImpegno.classList.remove('active');
            } catch (err) {
                console.error("Errore salvataggio impegno:", err);
                alert("Errore durante il salvataggio dell'impegno.");
            }
        });
    }

    ascoltaImpegniFirestore();
}

function ascoltaImpegniFirestore() {
    onSnapshot(collection(db, "appuntamenti"), (snapshot) => {
        tuttiGliImpegni = [];
        snapshot.forEach((docSnap) => {
            tuttiGliImpegni.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        renderizzaAgendaSettimanale();
    });
}

function ottieniLunedisettimana(d) {
    const data = new Date(d);
    const day = data.getDay();
    const diff = data.getDate() - day + (day === 0 ? -6 : 1); // Aggiusta se domenica
    return new Date(data.setDate(diff));
}

function formattaDataITA(dateObj) {
    const aaaa = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${aaaa}-${mm}-${dd}`;
}

function formattaDataLeggibile(dateObj) {
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${dd}/${mm}`;
}

function renderizzaAgendaSettimanale() {
    if (!containerImpegni) return;
    containerImpegni.innerHTML = '';

    const lunedi = ottieniLunedisettimana(dataRiferimentoSettimana);
    const domenica = new Date(lunedi);
    domenica.setDate(lunedi.getDate() + 6);

    // Intestazione Sezione Impegni
    const sectionImpegni = document.getElementById('section-impegni');
    let sectionHeader = sectionImpegni.querySelector('.section-header');

    if (sectionHeader) {
        sectionHeader.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; flex-wrap: wrap; gap: 10px;">
                <button id="btn-torna-home-impegni" class="cancel-btn" style="padding: 8px 14px; font-weight: bold; cursor: pointer; border-radius: 8px;">← Torna alla Home</button>
                
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button id="btn-settimana-prec" class="cancel-btn" style="padding: 8px 12px; font-weight: bold; cursor: pointer; border-radius: 8px;">← Prec.</button>
                    <button id="btn-settimana-oggi" class="save-btn" style="padding: 8px 12px; font-weight: bold; cursor: pointer; border-radius: 8px; background-color: #27ae60;">Oggi</button>
                    <button id="btn-settimana-succ" class="cancel-btn" style="padding: 8px 12px; font-weight: bold; cursor: pointer; border-radius: 8px;">Succ. →</button>
                </div>
            </div>
            <div style="width: 100%; text-align: center; margin-top: 12px; font-size: 1.15rem; font-weight: 800; color: #2c3e50;">
                📅 Settimana dal ${formattaDataLeggibile(lunedi)} al ${formattaDataLeggibile(domenica)} ${lunedi.getFullYear()}
            </div>
        `;

        document.getElementById('btn-torna-home-impegni').addEventListener('click', () => {
            mostraSezione('home');
        });

        document.getElementById('btn-settimana-prec').addEventListener('click', () => {
            dataRiferimentoSettimana.setDate(dataRiferimentoSettimana.getDate() - 7);
            renderizzaAgendaSettimanale();
        });

        document.getElementById('btn-settimana-oggi').addEventListener('click', () => {
            dataRiferimentoSettimana = new Date();
            renderizzaAgendaSettimanale();
        });

        document.getElementById('btn-settimana-succ').addEventListener('click', () => {
            dataRiferimentoSettimana.setDate(dataRiferimentoSettimana.getDate() + 7);
            renderizzaAgendaSettimanale();
        });
    }

    containerImpegni.style.display = 'flex';
    containerImpegni.style.flexDirection = 'column';
    containerImpegni.style.gap = '15px';
    containerImpegni.style.marginTop = '20px';

    const oggiString = formattaDataITA(new Date());

    // Generazione dei 7 Giorni della Settimana
    for (let i = 0; i < 7; i++) {
        const giornoData = new Date(lunedi);
        giornoData.setDate(lunedi.getDate() + i);
        const dataStringa = formattaDataITA(giornoData);

        const config = configurazioneGiorni[i];
        const isOggi = (dataStringa === oggiString);

        // Filtra gli impegni per questo giorno
        const impegniDelGiorno = tuttiGliImpegni.filter(imp => imp.data === dataStringa);

        const cardGiorno = document.createElement('div');
        cardGiorno.style.backgroundColor = config.bg;
        cardGiorno.style.borderRadius = '12px';
        cardGiorno.style.border = isOggi ? '3px solid #2980b9' : '1px solid #e0e0e0';
        cardGiorno.style.overflow = 'hidden';
        cardGiorno.style.boxShadow = '0 3px 8px rgba(0,0,0,0.06)';

        // Header della card del giorno
        const headerGiorno = document.createElement('div');
        headerGiorno.style.backgroundColor = config.headerBg;
        headerGiorno.style.color = '#ffffff';
        headerGiorno.style.padding = '10px 16px';
        headerGiorno.style.display = 'flex';
        headerGiorno.style.justifyContent = 'space-between';
        headerGiorno.style.alignItems = 'center';
        headerGiorno.style.fontWeight = 'bold';
        headerGiorno.style.fontSize = '1.1rem';

        headerGiorno.innerHTML = `
            <span>${config.nome} ${formattaDataLeggibile(giornoData)} ${isOggi ? '📌 (OGGI)' : ''}</span>
            <button class="btn-add-giorno" style="background-color: rgba(255,255,255,0.25); color: white; border: none; padding: 4px 10px; font-size: 1.1rem; font-weight: bold; border-radius: 6px; cursor: pointer;" title="Aggiungi impegno per questo giorno">+</button>
        `;

        // Click sul tasto "+" per aggiungere impegno in quella data specifica
        headerGiorno.querySelector('.btn-add-giorno').addEventListener('click', (e) => {
            e.stopPropagation();
            if (formImpegno) formImpegno.reset();
            if (inputEditId) inputEditId.value = "";
            document.getElementById('impegno-data').value = dataStringa;
            if (modalImpegnoTitoloTesto) modalImpegnoTitoloTesto.textContent = `Nuovo Impegno per ${config.nome}`;
            if (modalImpegno) modalImpegno.classList.add('active');
        });

        const bodyGiorno = document.createElement('div');
        bodyGiorno.style.padding = '12px 16px';

        if (impegniDelGiorno.length === 0) {
            bodyGiorno.innerHTML = '<p style="color: #888; font-style: italic; margin: 4px 0; font-size: 0.95rem;">Nessun impegno salvato</p>';
        } else {
            impegniDelGiorno.forEach(imp => {
                const itemDiv = document.createElement('div');
                itemDiv.style.backgroundColor = '#ffffff';
                itemDiv.style.padding = '12px';
                itemDiv.style.borderRadius = '8px';
                itemDiv.style.marginBottom = '10px';
                itemDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
                itemDiv.style.borderLeft = `5px solid ${config.headerBg}`;

                let orarioTesto = "";
                if (imp.oraInizio) {
                    orarioTesto = `🕒 ${imp.oraInizio}${imp.oraFine ? ' - ' + imp.oraFine : ''}`;
                }

                itemDiv.innerHTML = `
                    <div style="font-size: 1.15rem; font-weight: 800; color: #222;">${imp.titolo}</div>
                    ${orarioTesto ? `<div style="font-size: 1rem; font-weight: bold; color: #444; margin-top: 4px;">${orarioTesto}</div>` : ''}
                    <div style="font-size: 0.85rem; color: #666; margin-top: 4px;">👤 Creato da: ${imp.creatoDa || 'Famiglia'}</div>
                    
                    <div style="display: flex; gap: 8px; margin-top: 10px;">
                        <button class="btn-edit-imp" style="background-color: #2980b9; color: white; border: none; padding: 6px 12px; font-size: 0.85rem; font-weight: bold; border-radius: 6px; cursor: pointer; flex: 1;">Modifica</button>
                        <button class="btn-del-imp" style="background-color: #e74c3c; color: white; border: none; padding: 6px 12px; font-size: 0.85rem; font-weight: bold; border-radius: 6px; cursor: pointer; flex: 1;">Elimina</button>
                    </div>
                `;

                // Tasto Modifica Impegno
                itemDiv.querySelector('.btn-edit-imp').addEventListener('click', () => {
                    if (inputEditId) inputEditId.value = imp.id;
                    document.getElementById('impegno-titolo').value = imp.titolo || '';
                    document.getElementById('impegno-data').value = imp.data || dataStringa;
                    document.getElementById('impegno-ora-inizio').value = imp.oraInizio || '';
                    document.getElementById('impegno-ora-fine').value = imp.oraFine || '';

                    if (modalImpegnoTitoloTesto) modalImpegnoTitoloTesto.textContent = "Modifica Impegno";
                    if (modalImpegno) modalImpegno.classList.add('active');
                });

                // Tasto Elimina Impegno
                itemDiv.querySelector('.btn-del-imp').addEventListener('click', async () => {
                    if (confirm(`Vuoi eliminare l'impegno "${imp.titolo}"?`)) {
                        try {
                            await deleteDoc(doc(db, "appuntamenti", imp.id));
                        } catch (err) {
                            console.error("Errore eliminazione impegno:", err);
                        }
                    }
                });

                bodyGiorno.appendChild(itemDiv);
            });
        }

        cardGiorno.appendChild(headerGiorno);
        cardGiorno.appendChild(bodyGiorno);
        containerImpegni.appendChild(cardGiorno);
    }
}
