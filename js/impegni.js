// js/impegni.js - Gestione Agenda Settimanale Impegni e Anteprima Home

import { db } from "./firebase-config.js";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { mostraSezione } from "./navigation.js";

const containerImpegni = document.getElementById('container-impegni');
const containerHomeImpegni = document.getElementById('container-home-impegni');
const modalImpegno = document.getElementById('modal-impegno');
const btnCloseModalImpegno = document.getElementById('btn-close-modal-impegno');
const formImpegno = document.getElementById('form-impegno');
const inputEditId = document.getElementById('impegno-edit-id');
const modalImpegnoTitoloTesto = document.getElementById('modal-impegno-titolo-testo');

let tuttiGliImpegni = [];
let dataCorrenteRiferimento = new Date();

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
                    const impRef = doc(db, "appuntamenti", editId);
                    await updateDoc(impRef, {
                        titolo,
                        data,
                        oraInizio,
                        oraFine
                    });
                } else {
                    await addDoc(collection(db, "appuntamenti"), {
                        titolo,
                        data,
                        oraInizio,
                        oraFine,
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
        renderizzaImpegniHome();
    });
}

function renderizzaImpegniHome() {
    if (!containerHomeImpegni) return;
    containerHomeImpegni.innerHTML = '';

    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    const curr = new Date(oggi);
    const day = curr.getDay();
    const diffToMonday = curr.getDate() - day + (day === 0 ? -6 : 1);
    const lunedi = new Date(curr.setDate(diffToMonday));
    lunedi.setHours(0, 0, 0, 0);

    const domenica = new Date(lunedi);
    domenica.setDate(lunedi.getDate() + 6);
    domenica.setHours(23, 59, 59, 999);

    // Filtra gli impegni che rientrano nella settimana corrente
    const impegniSettimana = tuttiGliImpegni.filter(imp => {
        if (!imp.data) return false;
        const d = new Date(imp.data);
        return d >= lunedi && d <= domenica;
    });

    if (impegniSettimana.length === 0) {
        containerHomeImpegni.innerHTML = '<p style="color: #777; font-size: 0.95rem; font-weight: bold; margin: 0;">Nessun impegno in programma per questa settimana.</p>';
        return;
    }

    // Ordina per data
    impegniSettimana.sort((a, b) => new Date(a.data) - new Date(b.data));

    const giorniNomi = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

    impegniSettimana.forEach(item => {
        const d = new Date(item.data);
        const nomeGiorno = giorniNomi[d.getDay()];
        const gg = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');

        let orario = '';
        if (item.oraInizio) {
            orario = ` 🕒 ${item.oraInizio}`;
        }

        const div = document.createElement('div');
        div.style.padding = '8px 10px';
        div.style.backgroundColor = '#f8f9fa';
        div.style.borderRadius = '6px';
        div.style.marginBottom = '8px';
        div.style.borderLeft = '4px solid #3498db';

        div.innerHTML = `
            <div style="font-weight: 800; color: #2c3e50; font-size: 1rem;">${item.titolo}</div>
            <div style="font-size: 0.85rem; font-weight: bold; color: #666; margin-top: 2px;">
                📅 ${nomeGiorno} ${gg}/${mm}${orario}
            </div>
        `;

        containerHomeImpegni.appendChild(div);
    });
}

function renderizzaAgendaSettimanale() {
    if (!containerImpegni) return;
    containerImpegni.innerHTML = '';

    const sectionImpegni = document.getElementById('section-impegni');
    let sectionHeader = sectionImpegni ? sectionImpegni.querySelector('.section-header') : null;

    const curr = new Date(dataCorrenteRiferimento);
    const day = curr.getDay();
    const diffToMonday = curr.getDate() - day + (day === 0 ? -6 : 1);
    const lunedi = new Date(curr.setDate(diffToMonday));
    lunedi.setHours(0, 0, 0, 0);

    const domenica = new Date(lunedi);
    domenica.setDate(lunedi.getDate() + 6);

    const formatoDataBreve = (d) => {
        const gg = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        return `${gg}/${mm}`;
    };

    const stringaIntervallo = `${formatoDataBreve(lunedi)} - ${formatoDataBreve(domenica)}`;

    if (sectionHeader) {
        sectionHeader.innerHTML = `
            <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; width: 100%; justify-content: space-between;">
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button id="btn-torna-home-impegni" class="cancel-btn" style="padding: 10px 16px; font-weight: bold; cursor: pointer; border-radius: 8px;">← Torna alla Home</button>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button id="btn-prec-settimana" class="cancel-btn" style="padding: 8px 12px; font-weight: bold; cursor: pointer; border-radius: 6px;">← Prec.</button>
                    <button id="btn-oggi-settimana" class="save-btn" style="padding: 8px 12px; font-weight: bold; cursor: pointer; border-radius: 6px;">Oggi</button>
                    <button id="btn-succ-settimana" class="cancel-btn" style="padding: 8px 12px; font-weight: bold; cursor: pointer; border-radius: 6px;">Succ. →</button>
                </div>
                <div style="font-weight: 800; font-size: 1.1rem; color: #333; display: flex; align-items: center; gap: 6px;">
                    📅 <span>${stringaIntervallo}</span>
                </div>
            </div>
        `;

        document.getElementById('btn-torna-home-impegni').addEventListener('click', () => {
            mostraSezione('home');
        });

        document.getElementById('btn-prec-settimana').addEventListener('click', () => {
            dataCorrenteRiferimento.setDate(dataCorrenteRiferimento.getDate() - 7);
            renderizzaAgendaSettimanale();
        });

        document.getElementById('btn-oggi-settimana').addEventListener('click', () => {
            dataCorrenteRiferimento = new Date();
            renderizzaAgendaSettimanale();
        });

        document.getElementById('btn-succ-settimana').addEventListener('click', () => {
            dataCorrenteRiferimento.setDate(dataCorrenteRiferimento.getDate() + 7);
            renderizzaAgendaSettimanale();
        });
    }

    containerImpegni.style.display = 'flex';
    containerImpegni.style.flexDirection = 'column';
    containerImpegni.style.gap = '15px';
    containerImpegni.style.marginTop = '15px';

    const giorniNomi = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
    const coloriGiorni = ['#3498db', '#9b59b6', '#1abc9c', '#e67e22', '#2980b9', '#8e44ad', '#e74c3c'];

    for (let i = 0; i < 7; i++) {
        const giornoCorrente = new Date(lunedi);
        giornoCorrente.setDate(lunedi.getDate() + i);

        const anno = giornoCorrente.getFullYear();
        const mese = String(giornoCorrente.getMonth() + 1).padStart(2, '0');
        const giorno = String(giornoCorrente.getDate()).padStart(2, '0');
        const dataFormatoISO = `${anno}-${mese}-${giorno}`;
        const dataFormatoVisibile = `${giorno}/${mese}`;

        const impegniDelGiorno = tuttiGliImpegni.filter(imp => imp.data === dataFormatoISO);

        const cardGiorno = document.createElement('div');
        cardGiorno.style.backgroundColor = '#ffffff';
        cardGiorno.style.borderRadius = '12px';
        cardGiorno.style.boxShadow = '0 4px 10px rgba(0,0,0,0.08)';
        cardGiorno.style.overflow = 'hidden';

        const headerColor = coloriGiorni[i];

        cardGiorno.innerHTML = `
            <div style="background-color: ${headerColor}; color: white; padding: 12px 18px; display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 1.2rem; font-weight: 800;">${giorniNomi[i]} ${dataFormatoVisibile}</div>
                <button type="button" class="btn-add-imp-giorno" data-data="${dataFormatoISO}" style="background-color: rgba(255,255,255,0.25); color: white; border: none; width: 32px; height: 32px; border-radius: 50%; font-size: 1.4rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center;">+</button>
            </div>
            <div class="body-giorno" style="padding: 15px; background-color: ${headerColor}0D;"></div>
        `;

        const bodyGiorno = cardGiorno.querySelector('.body-giorno');

        if (impegniDelGiorno.length === 0) {
            bodyGiorno.innerHTML = `<p style="color: #888; font-style: italic; font-size: 0.95rem; margin: 0;">Nessun impegno salvato</p>`;
        } else {
            impegniDelGiorno.forEach(item => {
                const itemCard = document.createElement('div');
                itemCard.style.backgroundColor = '#ffffff';
                itemCard.style.padding = '12px 15px';
                itemCard.style.borderRadius = '8px';
                itemCard.style.marginBottom = '10px';
                itemCard.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';

                let orarioTesto = '';
                if (item.oraInizio && item.oraFine) {
                    orarioTesto = `🕒 ${item.oraInizio} - ${item.oraFine}`;
                } else if (item.oraInizio) {
                    orarioTesto = `🕒 Ore ${item.oraInizio}`;
                }

                itemCard.innerHTML = `
                    <div style="font-size: 1.1rem; font-weight: 800; color: #222; margin-bottom: 4px;">${item.titolo}</div>
                    ${orarioTesto ? `<div style="font-size: 0.95rem; font-weight: bold; color: #555; margin-bottom: 4px;">${orarioTesto}</div>` : ''}
                    <div style="font-size: 0.85rem; font-weight: bold; color: #777; margin-bottom: 8px;">👤 Creato da: ${item.creatoDa || 'Famiglia'}</div>
                    
                    <div style="display: flex; gap: 8px;">
                        <button type="button" class="btn-edit-imp" style="background-color: #2980b9; color: white; padding: 6px 12px; font-size: 0.85rem; font-weight: bold; cursor: pointer; border-radius: 6px; border: none;" data-id="${item.id}">Modifica</button>
                        <button type="button" class="btn-del-imp" style="background-color: #e74c3c; color: white; padding: 6px 12px; font-size: 0.85rem; font-weight: bold; cursor: pointer; border-radius: 6px; border: none;" data-id="${item.id}">Elimina</button>
                    </div>
                `;

                itemCard.querySelector('.btn-edit-imp').addEventListener('click', () => {
                    if (inputEditId) inputEditId.value = item.id;
                    document.getElementById('impegno-titolo').value = item.titolo || '';
                    document.getElementById('impegno-data').value = item.data || '';
                    document.getElementById('impegno-ora-inizio').value = item.oraInizio || '';
                    document.getElementById('impegno-ora-fine').value = item.oraFine || '';

                    if (modalImpegnoTitoloTesto) modalImpegnoTitoloTesto.textContent = "Modifica Impegno";
                    if (modalImpegno) modalImpegno.classList.add('active');
                });

                itemCard.querySelector('.btn-del-imp').addEventListener('click', async () => {
                    if (confirm(`Vuoi eliminare l'impegno "${item.titolo}"?`)) {
                        try {
                            await deleteDoc(doc(db, "appuntamenti", item.id));
                        } catch (err) {
                            console.error("Errore eliminazione impegno:", err);
                        }
                    }
                });

                bodyGiorno.appendChild(itemCard);
            });
        }

        cardGiorno.querySelector('.btn-add-imp-giorno').addEventListener('click', (e) => {
            const dataGiorno = e.currentTarget.getAttribute('data-data');
            if (formImpegno) formImpegno.reset();
            if (inputEditId) inputEditId.value = "";
            document.getElementById('impegno-data').value = dataGiorno;
            if (modalImpegnoTitoloTesto) modalImpegnoTitoloTesto.textContent = "Nuovo Impegno";
            if (modalImpegno) modalImpegno.classList.add('active');
        });

        containerImpegni.appendChild(cardGiorno);
    }
}
