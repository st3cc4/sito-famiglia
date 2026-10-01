let currentUser = "Stecks";
let db = {
    bills: [
        { id: 1, entity: "Enel Energia", date: "2026-10-05", amount: 85.50, status: "da pagare" },
        { id: 2, entity: "Acqua", date: "2026-10-25", amount: 42.00, status: "da pagare" }
    ],
    media: [],
    recipes: [
        { id: 1, title: "Biscotti Frollini", ingredients: "Farina, Burro, Zucchero, Uova", prep: "Impastare e cuocere a 160°C", likes: { Stecks: true, Elena: false } }
    ],
    events: [
        { id: 1, title: "Visita controllo tartarughe", datetime: "2026-10-10T10:00" }
    ],
    logs: []
};

function logAction(action) {
    db.logs.unshift({ user: currentUser, action: action, time: new Date().toLocaleTimeString() });
}

document.getElementById('btn-login').addEventListener('click', () => {
    currentUser = document.getElementById('auth-user').value;
    document.getElementById('current-user-badge').innerText = `Utente: ${currentUser}`;
    document.getElementById('auth-overlay').style.display = 'none';
    if (currentUser === 'Stecks') {
        document.getElementById('menu-admin').style.display = 'flex';
    }
    logAction("Accesso effettuato");
    renderAll();
});

// Sidebar Toggle
document.getElementById('sidebar-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
});

// Navigazione sezioni
document.querySelectorAll('.sidebar-menu li').forEach(item => {
    item.addEventListener('click', (e) => {
        document.querySelectorAll('.sidebar-menu li').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        
        item.classList.add('active');
        const target = item.getAttribute('data-target');
        document.getElementById(target).classList.add('active');
        document.getElementById('page-title').innerText = item.querySelector('span').innerText;
    });
});

// Gemini Search Bar Chat
document.getElementById('gemini-send').addEventListener('click', askGemini);
document.getElementById('gemini-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') askGemini(); });
document.getElementById('close-gemini').addEventListener('click', () => { document.getElementById('gemini-response-box').style.display = 'none'; });

function askGemini() {
    const query = document.getElementById('gemini-input').value.trim();
    if (!query) return;
    const answerBox = document.getElementById('gemini-answer');
    document.getElementById('gemini-response-box').style.display = 'block';
    answerBox.innerHTML = "Sto elaborando la risposta per te...";

    setTimeout(() => {
        answerBox.innerHTML = `Ciao ${currentUser}! Ho analizzato la tua richiesta ("${query}"). Come assistente di famiglia, ti suggerisco di controllare le scadenze nella sezione bollette o di goderti le nuove ricette caricate!`;
        logAction(`Ha chiesto a Gemini: "${query}"`);
    }, 800);
}

// Bollette Logic
function renderBills() {
    const container = document.getElementById('bills-list-container');
    const overviewContainer = document.getElementById('overview-bills-list');
    container.innerHTML = '';
    
    // Ordina per data scadenza
    db.bills.sort((a, b) => new Date(a.date) - new Date(b.date));

    let overviewHtml = "";
    db.bills.forEach(bill => {
        let colorClass = "green";
        const today = new Date();
        const diffDays = Math.ceil((new Date(bill.date) - today) / (1000 * 60 * 60 * 24));

        if (bill.status === "pagata") colorClass = "gray";
        else if (diffDays < 7) colorClass = "red";
        else if (diffDays < 14) colorClass = "orange";
        else if (diffDays < 21) colorClass = "green";

        if(bill.status === "da pagare") {
            overviewHtml += `<div><b>${bill.entity}</b> - Scadenza: ${bill.date} (${bill.amount}€)</div>`;
        }

        const div = document.createElement('div');
        div.className = `bill-item ${colorClass}`;
        div.innerHTML = `
            <h4>${bill.entity}</h4>
            <p>Scadenza: ${bill.date}</p>
            <p>Importo: <b>€ ${bill.amount.toFixed(2)}</b></p>
            <p>Stato: <b>${bill.status}</b></p>
            <button class="btn-secondary" onclick="toggleBillStatus(${bill.id})">Cambia stato</button>
        `;
        container.appendChild(div);
    });

    overviewContainer.innerHTML = overviewHtml || "Non c'è niente da pagare";
}

window.toggleBillStatus = function(id) {
    const bill = db.bills.find(b => b.id === id);
    if (bill) {
        bill.status = bill.status === "da pagare" ? "pagata" : "da pagare";
        logAction(`Ha cambiato stato bolletta ${bill.entity} in ${bill.status}`);
        renderBills();
    }
}

document.getElementById('open-add-bill').addEventListener('click', () => { document.getElementById('modal-bill').style.display = 'flex'; });
document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', (e) => { e.target.closest('.modal').style.display = 'none'; }));

document.getElementById('save-bill').addEventListener('click', () => {
    const entity = document.getElementById('bill-entity').value;
    const date = document.getElementById('bill-date').value;
    const amount = parseFloat(document.getElementById('bill-amount').value);
    if(entity && date && !isNaN(amount)) {
        db.bills.push({ id: Date.now(), entity, date, amount, status: 'da pagare' });
        logAction(`Ha aggiunto la bolletta: ${entity}`);
        document.getElementById('modal-bill').style.display = 'none';
        renderBills();
    }
});

// OCR Simulato
document.getElementById('bill-ocr-file').addEventListener('change', (e) => {
    if(e.target.files[0]) {
        setTimeout(() => {
            document.getElementById('bill-entity').value = "Enel Energia (OCR)";
            document.getElementById('bill-amount').value = "65.40";
            alert("Dati estratti automaticamente tramite OCR!");
        }, 1000);
    }
});

// Ricette Logic
function renderRecipes() {
    const container = document.getElementById('recipes-container');
    container.innerHTML = '';
    db.recipes.forEach(recipe => {
        if(!recipe.likes) recipe.likes = {};
        const isLiked = recipe.likes[currentUser] || false;
        
        const div = document.createElement('div');
        div.className = 'recipe-card';
        div.innerHTML = `
            <h3>${recipe.title}</h3>
            <p><b>Ingredienti:</b><br>${recipe.ingredients.replace(/\n/g, '<br>')}</p>
            <p style="margin-top:8px;"><b>Preparazione:</b><br>${recipe.prep.replace(/\n/g, '<br>')}</p>
            <div class="likes-section">
                <button class="like-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike(${recipe.id})">
                    <i class="fa-solid fa-heart"></i>
                </button>
                <span>A ${Object.keys(recipe.likes).filter(k => recipe.likes[k]).length} persone piace</span>
            </div>
        `;
        container.appendChild(div);
    });
}

window.toggleLike = function(id) {
    const recipe = db.recipes.find(r => r.id === id);
    if(recipe) {
        if(!recipe.likes) recipe.likes = {};
        recipe.likes[currentUser] = !recipe.likes[currentUser];
        logAction(`Ha messo/tolto mi piace alla ricetta ${recipe.title}`);
        renderRecipes();
    }
}

document.getElementById('open-add-recipe').addEventListener('click', () => { document.getElementById('modal-recipe').style.display = 'flex'; });
document.getElementById('save-recipe').addEventListener('click', () => {
    const title = document.getElementById('recipe-title').value;
    const ingredients = document.getElementById('recipe-ingredients').value;
    const prep = document.getElementById('recipe-prep').value;
    if(title) {
        db.recipes.push({ id: Date.now(), title, ingredients, prep, likes: {} });
        logAction(`Ha aggiunto la ricetta: ${title}`);
        document.getElementById('modal-recipe').style.display = 'none';
        renderRecipes();
    }
});

// Gallery Logic
document.getElementById('btn-upload-media').addEventListener('click', () => { document.getElementById('media-file-input').click(); });
document.getElementById('media-file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(file) {
        const url = URL.createObjectURL(file);
        db.media.push({ type: file.type.startsWith('video') ? 'video' : 'image', url, user: currentUser });
        logAction(`Ha caricato un nuovo file multimediale`);
        renderGallery();
    }
});

function renderGallery() {
    const container = document.getElementById('gallery-container');
    const overviewMedia = document.getElementById('overview-media-list');
    container.innerHTML = '';
    let overviewHtml = "";
    
    db.media.forEach((item, index) => {
        if(index < 3) {
            overviewHtml += `<div>Caricato da <b>${item.user}</b></div>`;
        }
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.innerHTML = item.type === 'image' ? `<img src="${item.url}" style="width:100%; border-radius:6px;">` : `<video src="${item.url}" controls style="width:100%; border-radius:6px;"></video>`;
        container.appendChild(div);
    });
    overviewMedia.innerHTML = overviewHtml || "Nessuna foto o video recente.";
}

// Calendario Logic
document.getElementById('open-add-event').addEventListener('click', () => { document.getElementById('modal-event').style.display = 'flex'; });
document.getElementById('save-event').addEventListener('click', () => {
    const title = document.getElementById('event-title').value;
    const datetime = document.getElementById('event-datetime').value;
    if(title && datetime) {
        db.events.push({ id: Date.now(), title, datetime });
        logAction(`Ha aggiunto l'appuntamento: ${title}`);
        document.getElementById('modal-event').style.display = 'none';
        renderCalendar();
    }
});

function renderCalendar() {
    const container = document.getElementById('calendar-container');
    const overviewEvents = document.getElementById('overview-events-list');
    container.innerHTML = '';
    let overviewHtml = "";

    db.events.forEach((ev, index) => {
        if(index < 3) {
            overviewHtml += `<div><b>${ev.title}</b> - ${ev.datetime.replace('T', ' ')}</div>`;
        }
        const div = document.createElement('div');
        div.className = 'card';
        div.style.marginBottom = '10px';
        div.innerHTML = `<h4>${ev.title}</h4><p><i class="fa-solid fa-clock"></i> ${ev.datetime.replace('T', ' ')}</p>`;
        container.appendChild(div);
    });
    overviewEvents.innerHTML = overviewHtml || "Nessun appuntamento in calendario.";
}

// Admin Logs
function renderAdmin() {
    const container = document.getElementById('admin-logs-container');
    container.innerHTML = '';
    db.logs.forEach(log => {
        const div = document.createElement('div');
        div.style.padding = '8px 0';
        div.style.borderBottom = '1px solid var(--border)';
        div.innerHTML = `[${log.time}] <b>${log.user}</b>: ${log.action}`;
        container.appendChild(div);
    });
}

function renderAll() {
    renderBills();
    renderRecipes();
    renderGallery();
    renderCalendar();
    if(currentUser === 'Stecks') renderAdmin();
}
