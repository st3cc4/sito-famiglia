// Importa Firebase e Firestore dai CDN ufficiali (senza Analytics che genera il blocco 403)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configurazione Firebase dal tuo progetto
const firebaseConfig = {
    apiKey: "AIzaSyAtMnKhhfC43J73kVm8-QcNghqzOTV6UKA",
    authDomain: "sito-famiglia.firebaseapp.com",
    projectId: "sito-famiglia",
    storageBucket: "sito-famiglia.firebasestorage.app",
    messagingSenderId: "93216467751",
    appId: "1:93216467751:web:993005284551ca5ef895a"
};

// Inizializzazione Firebase & Firestore (senza Analytics)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Esportazione globale per le funzioni interne
window.db = db;
window.firebaseFns = {
    collection,
    getDocs,
    addDoc,
    doc,
    setDoc,
    deleteDoc
};

document.addEventListener('DOMContentLoaded', () => {
    // Riferimenti elementi UI
    const authOverlay = document.getElementById('auth-overlay');
    const appContainer = document.getElementById('app-container');
    const btnLogin = document.getElementById('btn-login');
    const authEmailInput = document.getElementById('auth-email');
    const authPasswordInput = document.getElementById('auth-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const errorMessage = document.getElementById('error-message');
    const currentUserBadge = document.getElementById('current-user-badge');
    const welcomeTitle = document.getElementById('welcome-title');
    const pageTitle = document.getElementById('page-title');
    const menuAdmin = document.getElementById('menu-admin');
    
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarMenuLi = document.querySelectorAll('.sidebar-menu li');

    // Toggle sidebar
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Gestione navigazione sezioni
    window.switchSection = function(targetId) {
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });
        const targetSec = document.getElementById(targetId);
        if (targetSec) {
            targetSec.classList.add('active');
        }

        sidebarMenuLi.forEach(li => {
            if (li.getAttribute('data-target') === targetId) {
                li.classList.add('active');
            } else {
                li.classList.remove('active');
            }
        });

        const activeLiSpan = document.querySelector(`.sidebar-menu li[data-target="${targetId}"] span`);
        if (activeLiSpan) {
            pageTitle.textContent = activeLiSpan.textContent;
        } else if (targetId === 'section-overview') {
            pageTitle.textContent = 'HOME';
        }
    };

    sidebarMenuLi.forEach(li => {
        li.addEventListener('click', () => {
            const target = li.getAttribute('data-target');
            if (target) switchSection(target);
        });
    });

    // Controllo login salvato
    const savedUserJson = localStorage.getItem('family_current_user') || sessionStorage.getItem('family_current_user');
    if (savedUserJson) {
        try {
            const userObj = JSON.parse(savedUserJson);
            initAppSession(userObj);
        } catch(e) {
            console.error(e);
        }
    }

    // Evento Login
    if (btnLogin) {
        btnLogin.addEventListener('click', async () => {
            const email = authEmailInput.value.trim().toLowerCase();
            const password = authPasswordInput.value.trim();
            errorMessage.style.display = 'none';

            if (!email || !password) {
                errorMessage.textContent = 'Inserisci email e password.';
                errorMessage.style.display = 'block';
                return;
            }

            // Credenziali Super Admin di Stecca (verificate direttamente)
            if (email === 'stpa79@gmail.com' && password === 'sv058753') {
                const adminUser = {
                    name: 'Stecca',
                    email: email,
                    role: 'Admin',
                    permissions: ['section-bills', 'section-gallery', 'section-recipes', 'section-calendar']
                };
                saveAndInitSession(adminUser, rememberMeCheckbox.checked);
                return;
            }

            // Cerca utente su Firebase Firestore
            try {
                const querySnapshot = await getDocs(collection(window.db, 'members'));
                let foundUser = null;
                
                querySnapshot.forEach(docSnap => {
                    const data = docSnap.data();
                    if (data.email && data.email.toLowerCase() === email && data.password === password) {
                        foundUser = { id: docSnap.id, ...data };
                    }
                });

                if (foundUser) {
                    saveAndInitSession(foundUser, rememberMeCheckbox.checked);
                } else {
                    errorMessage.textContent = 'Email o password errati.';
                    errorMessage.style.display = 'block';
                }
            } catch (err) {
                console.error(err);
                errorMessage.textContent = 'Errore di connessione al database.';
                errorMessage.style.display = 'block';
            }
        });
    }

    function saveAndInitSession(userObj, remember) {
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem('family_current_user', JSON.stringify(userObj));
        initAppSession(userObj);
    }

    function initAppSession(userObj) {
        authOverlay.style.display = 'none';
        appContainer.style.display = 'flex';
        currentUserBadge.textContent = `Utente: ${userObj.name || userObj.email}`;
        welcomeTitle.textContent = `Ciao, ${userObj.name || 'Famiglia'}!`;

        if (userObj.role === 'Admin') {
            if (menuAdmin) menuAdmin.style.display = 'flex';
        } else {
            if (menuAdmin) menuAdmin.style.display = 'none';
        }

        const perms = userObj.permissions || [];
        if (userObj.role !== 'Admin') {
            document.querySelectorAll('.sidebar-menu li[data-target]').forEach(li => {
                const target = li.getAttribute('data-target');
                if (target !== 'section-overview' && target !== 'section-admin') {
                    if (!perms.includes(target)) {
                        li.style.display = 'none';
                    } else {
                        li.style.display = 'flex';
                    }
                }
            });
        }

        loadBillsData();
        loadMembersData();
    }

    // --- GESTIONE BOLLETTE ---
    const toggleAddBillForm = document.getElementById('toggle-add-bill-form');
    const billFormCard = document.getElementById('bill-form-card');
    const btnAddBill = document.getElementById('btn-add-bill');
    const billTitle = document.getElementById('bill-title');
    const billAmount = document.getElementById('bill-amount');
    const billDate = document.getElementById('bill-date');
    const billsListContainer = document.getElementById('bills-list-container');
    const overviewBillsList = document.getElementById('overview-bills-list');
    const overviewBillsTotal = document.getElementById('overview-bills-total');
    const overviewTotalAmount = document.getElementById('overview-total-amount');
    const billsPageTotal = document.getElementById('bills-page-total');

    if (toggleAddBillForm && billFormCard) {
        toggleAddBillForm.addEventListener('click', () => {
            billFormCard.style.display = billFormCard.style.display === 'none' ? 'block' : 'none';
        });
    }

    if (btnAddBill) {
        btnAddBill.addEventListener('click', async () => {
            const title = billTitle.value.trim();
            const amount = parseFloat(billAmount.value);
            const date = billDate.value;

            if (!title || isNaN(amount) || !date) {
                alert('Compila tutti i campi della bolletta.');
                return;
            }

            try {
                await addDoc(collection(window.db, 'bills'), {
                    title,
                    amount,
                    date,
                    paid: false,
                    createdAt: new Date().toISOString()
                });

                billTitle.value = '';
                billAmount.value = '';
                billDate.value = '';
                billFormCard.style.display = 'none';
                loadBillsData();
            } catch (err) {
                console.error(err);
                alert('Errore durante il salvataggio della bolletta.');
            }
        });
    }

    async function loadBillsData() {
        if (!billsListContainer) return;
        try {
            const querySnapshot = await getDocs(collection(window.db, 'bills'));
            let bills = [];
            querySnapshot.forEach(docSnap => {
                bills.push({ id: docSnap.id, ...docSnap.data() });
            });

            bills.sort((a, b) => new Date(a.date) - new Date(b.date));
            renderBills(bills);
        } catch (err) {
            console.error(err);
            billsListContainer.innerHTML = 'Errore caricamento bollette.';
        }
    }

    function renderBills(bills) {
        let unpaidTotal = 0;
        let html = '';

        if (bills.length === 0) {
            billsListContainer.innerHTML = '<p style="color:var(--text-muted);">Nessuna bolletta inserita.</p>';
            if (overviewBillsList) overviewBillsList.innerHTML = 'Nessuna bolletta in scadenza.';
            if (overviewBillsTotal) overviewBillsTotal.style.display = 'none';
            if (billsPageTotal) billsPageTotal.textContent = '0.00 €';
            return;
        }

        html = `<table>
            <thead>
                <tr>
                    <th>Ente / Titolo</th>
                    <th>Importo</th>
                    <th>Scadenza</th>
                    <th>Stato</th>
                    <th>Azioni</th>
                </tr>
            </thead>
            <tbody>`;

        let overviewHtml = '<ul style="list-style:none; padding-left:0;">';
        let overviewCount = 0;

        bills.forEach(bill => {
            if (!bill.paid) {
                unpaidTotal += Number(bill.amount);
                if (overviewCount < 3) {
                    overviewHtml += `<li style="margin-bottom:6px; display:flex; justify-content:space-between;"><span>${bill.title}</span> <strong style="color:var(--danger);">${Number(bill.amount).toFixed(2)} €</strong> (Scad. ${bill.date})</li>`;
                    overviewCount++;
                }
            }

            html += `<tr>
                <td>${bill.title}</td>
                <td>${Number(bill.amount).toFixed(2)} €</td>
                <td>${bill.date}</td>
                <td><span style="color: ${bill.paid ? 'var(--success)' : 'var(--danger)'}; font-weight:600;">${bill.paid ? 'Pagata' : 'Da pagare'}</span></td>
                <td>
                    <button class="btn-secondary" onclick="toggleBillPaid('${bill.id}', ${!bill.paid})" style="padding:4px 8px; font-size:12px; margin-right:5px;">${bill.paid ? 'Segna aperta' : 'Paga'}</button>
                    <button class="btn-secondary" onclick="deleteBill('${bill.id}')" style="padding:4px 8px; font-size:12px; background:#fee2e2; color:var(--danger);">Elimina</button>
                </td>
            </tr>`;
        });

        html += `</tbody></table>`;
        billsListContainer.innerHTML = html;
        if (billsPageTotal) billsPageTotal.textContent = `${unpaidTotal.toFixed(2)} €`;

        if (overviewCount > 0) {
            overviewHtml += '</ul>';
            if (overviewBillsList) overviewBillsList.innerHTML = overviewHtml;
            if (overviewBillsTotal) overviewBillsTotal.style.display = 'flex';
            if (overviewTotalAmount) overviewTotalAmount.textContent = `${unpaidTotal.toFixed(2)} €`;
        } else {
            if (overviewBillsList) overviewBillsList.innerHTML = 'Tutte le bollette sono state pagate! 🎉';
            if (overviewBillsTotal) overviewBillsTotal.style.display = 'none';
        }
    }

    window.toggleBillPaid = async function(id, newStatus) {
        try {
            const billRef = doc(window.db, 'bills', id);
            await setDoc(billRef, { paid: newStatus }, { merge: true });
            loadBillsData();
        } catch (err) {
            console.error(err);
            alert('Errore aggiornamento bolletta.');
        }
    };

    window.deleteBill = async function(id) {
        if (!confirm('Sei sicuro di voler eliminare questa bolletta?')) return;
        try {
            await deleteDoc(doc(window.db, 'bills', id));
            loadBillsData();
        } catch (err) {
            console.error(err);
            alert('Errore durante l\'eliminazione.');
        }
    };

    // OCR Tesseract per bollette
    const billOcrInput = document.getElementById('bill-ocr-input');
    const ocrStatus = document.getElementById('ocr-status');

    if (billOcrInput) {
        billOcrInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (ocrStatus) ocrStatus.textContent = 'Analisi immagine in corso con OCR...';

            try {
                const result = await Tesseract.recognize(file, 'ita', {
                    logger: m => {
                        if (m.status === 'recognizing text' && ocrStatus) {
                            ocrStatus.textContent = `Estrazione testo: ${Math.round(m.progress * 100)}%`;
                        }
                    }
                });

                const text = result.data.text;
                if (ocrStatus) ocrStatus.textContent = 'Elaborazione completata!';

                const amountMatch = text.match(/(?:totale|eur|€)\s*[:\.]?\s*([0-9]+[,\.][0-9]{2})/i) || text.match(/([0-9]+[,\.][0-9]{2})/);
                if (amountMatch && billAmount) {
                    billAmount.value = amountMatch[1].replace(',', '.');
                }

                const dateMatch = text.match(/([0-9]{2}[\/\-][0-9]{2}[\/\-][0-9]{4})/);
                if (dateMatch && billDate) {
                    const parts = dateMatch[1].split(/[\/\-]/);
                    billDate.value = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }

                if (billFormCard) billFormCard.style.display = 'block';
            } catch (err) {
                console.error(err);
                if (ocrStatus) ocrStatus.textContent = 'Errore durante l\'OCR. Inserisci i dati manualmente.';
                if (billFormCard) billFormCard.style.display = 'block';
            }
        });
    }

    // --- GESTIONE MEMBRI (ADMIN) ---
    const btnAddMember = document.getElementById('btn-add-member');
    const newMemberName = document.getElementById('new-member-name');
    const newMemberEmail = document.getElementById('new-member-email');
    const newMemberPass = document.getElementById('new-member-pass');
    const newMemberRole = document.getElementById('new-member-role');
    const membersListContainer = document.getElementById('members-list-container');
    let editingMemberId = null;

    if (btnAddMember) {
        btnAddMember.addEventListener('click', async () => {
            const name = newMemberName.value.trim();
            const email = newMemberEmail.value.trim().toLowerCase();
            const password = newMemberPass.value.trim();
            const role = newMemberRole.value;

            const permissions = [];
            document.querySelectorAll('.perm-chk:checked').forEach(chk => {
                permissions.push(chk.value);
            });

            if (!name || !email || !password) {
                alert('Compila nome, email e password per il membro.');
                return;
            }

            try {
                const memberData = { name, email, password, role, permissions };

                if (editingMemberId) {
                    await setDoc(doc(window.db, 'members', editingMemberId), memberData);
                    editingMemberId = null;
                    document.getElementById('admin-form-title').textContent = 'Gestione membri e permessi';
                    btnAddMember.textContent = 'Salva Membro';
                    document.getElementById('btn-cancel-edit').style.display = 'none';
                } else {
                    await addDoc(collection(window.db, 'members'), memberData);
                }

                newMemberName.value = '';
                newMemberEmail.value = '';
                newMemberPass.value = '';
                loadMembersData();
            } catch (err) {
                console.error(err);
                alert('Errore salvataggio membro.');
            }
        });
    }

    async function loadMembersData() {
        if (!membersListContainer) return;
        try {
            const querySnapshot = await getDocs(collection(window.db, 'members'));
            let members = [];
            querySnapshot.forEach(docSnap => {
                members.push({ id: docSnap.id, ...docSnap.data() });
            });

            let html = `<table>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Ruolo</th>
                        <th>Azioni</th>
                    </tr>
                </thead>
                <tbody>`;

            if (members.length === 0) {
                membersListContainer.innerHTML = '<p style="color:var(--text-muted);">Nessun membro registrato oltre l\'admin principale.</p>';
                return;
            }

            members.forEach(m => {
                html += `<tr>
                    <td>${m.name}</td>
                    <td>${m.email}</td>
                    <td>${m.role}</td>
                    <td>
                        <button class="btn-secondary" onclick="editMember('${m.id}', '${m.name}', '${m.email}', '${m.password}', '${m.role}')" style="padding:4px 8px; font-size:12px; margin-right:5px;">Modifica</button>
                        <button class="btn-secondary" onclick="deleteMember('${m.id}')" style="padding:4px 8px; font-size:12px; background:#fee2e2; color:var(--danger);">Elimina</button>
                    </td>
                </tr>`;
            });

            html += `</tbody></table>`;
            membersListContainer.innerHTML = html;
        } catch (err) {
            console.error(err);
            membersListContainer.innerHTML = 'Errore caricamento membri.';
        }
    }

    window.editMember = function(id, name, email, password, role) {
        editingMemberId = id;
        newMemberName.value = name;
        newMemberEmail.value = email;
        newMemberPass.value = password;
        newMemberRole.value = role;
        document.getElementById('admin-form-title').textContent = 'Modifica Membro';
        btnAddMember.textContent = 'Aggiorna Membro';
        document.getElementById('btn-cancel-edit').style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.cancelEditMember = function() {
        editingManagerId = null;
        newMemberName.value = '';
        newMemberEmail.value = '';
        newMemberPass.value = '';
        newMemberRole.value = 'Member';
        document.getElementById('admin-form-title').textContent = 'Gestione membri e permessi';
        btnAddMember.textContent = 'Salva Membro';
        document.getElementById('btn-cancel-edit').style.display = 'none';
    };

    window.deleteMember = async function(id) {
        if (!confirm('Eliminare questo membro?')) return;
        try {
            await deleteDoc(doc(window.db, 'members', id));
            loadMembersData();
        } catch (err) {
            console.error(err);
            alert('Errore eliminazione.');
        }
    };
});
