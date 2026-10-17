// js/impegni.js - Gestione Agenda Settimanale Impegni

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
    });
}

function renderizzaAgendaSettimanale() {
    if (!containerImpegni) return;
    containerImpegni.innerHTML = '';

    const sectionImpegni = document.getElementById('section-impegni');
    let sectionHeader = sectionImpegni.querySelector('.section-header');

    // Calcola inizio settimana (Lunedì) e fine (Domenica)
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

    // Solo i giorni senza l'anno e senza "Settimana dal al"
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

    // Genera i 7 giorni della settimana
    const giorniNomi = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
    const coloriGiorni = ['#3498db', '#9b59b6', '#1abc9c', '#e67e22', '#2980b9', '#8e44ad', '#e74c3c'];

    for (let i = 0; i < 7; i++) {
        const giornoCorrente = new Date(lunedi);
        giornoCorrente.setDate(lunedi.getDate() + i);

        const anno = giornoCorrente.getFullYear();
        const mese = String(giornoCorrente.getMonth() + 1).padStart(2, '0');
        const giorno =
