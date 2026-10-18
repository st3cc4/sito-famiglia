<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Famiglia PWA - Home</title>
    <!-- Foglio di stile specifico per la Home -->
    <link rel="stylesheet" href="home/stile-home.css">
    <!-- Icone FontAwesome per menu e icone di navigazione -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Manifest per PWA -->
    <link rel="manifest" href="manifest.json">
</head>
<body>

    <!-- Header / Barra Superiore (Cornice) -->
    <header class="app-header">
        <div class="header-left">
            <button id="btn-toggle-sidebar" class="btn-icon" aria-label="Apri Menu">
                <i class="fa-solid fa-bars"></i>
            </button>
            <h1 id="page-title">Famiglia PWA</h1>
        </div>
        <div class="header-right">
            <span id="user-display-name" class="user-badge">Utente</span>
            <button id="btn-logout" class="btn-icon btn-logout" title="Disconnetti">
                <i class="fa-solid fa-right-from-bracket"></i>
            </button>
        </div>
    </header>

    <!-- Overlay per chiudere la Sidebar su dispositivi mobili -->
    <div id="sidebar-overlay" class="sidebar-overlay"></div>

    <!-- Container Principale (Cornice + Tela Dynamic) -->
    <div class="app-container">
        
        <!-- Sidebar / Menu di Navigazione -->
        <aside id="sidebar" class="sidebar">
            <nav class="nav-menu">
                <ul>
                    <li>
                        <button class="nav-btn active" data-target="dashboard">
                            <i class="fa-solid fa-house"></i>
                            <span>Home</span>
                        </button>
                    </li>
                    <li>
                        <button class="nav-btn" data-target="impegni">
                            <i class="fa-solid fa-calendar-days"></i>
                            <span>Impegni</span>
                        </button>
                    </li>
                    <li>
                        <button class="nav-btn" data-target="scadenze">
                            <i class="fa-solid fa-file-invoice-dollar"></i>
                            <span>Scadenze</span>
                        </button>
                    </li>
                    <li>
                        <button class="nav-btn" data-target="ricette">
                            <i class="fa-solid fa-utensils"></i>
                            <span>Ricette</span>
                        </button>
                    </li>
                    <li>
                        <button class="nav-btn" data-target="media">
                            <i class="fa-solid fa-photo-film"></i>
                            <span>Foto & Video</span>
                        </button>
                    </li>
                </ul>
            </nav>
        </aside>

        <!-- TELA CENTRALE DYNAMICA -->
        <main id="main-content" class="main-content">
            <!-- Qui verranno iniettate le varie schermate/sezioni -->
            <div id="content-area">
                <h2>Benvenuto nella Famiglia PWA</h2>
                <p>Seleziona una voce dal menu per iniziare.</p>
            </div>
        </main>

    </div>

    <!-- Script di gestione della Home -->
    <script type="module" src="home/home.js"></script>
</body>
</html>
