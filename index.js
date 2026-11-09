document.addEventListener("DOMContentLoaded", () => {
  // 1. Verifica se l'utente è loggato
  const isLogged = localStorage.getItem("sitoFamiglia_logged");
  const username = localStorage.getItem("sitoFamiglia_user");
  const ruolo = localStorage.getItem("sitoFamiglia_ruolo");
  const permessi = JSON.parse(localStorage.getItem("sitoFamiglia_permessi") || "{}");

  if (!isLogged || !username) {
    window.location.href = "login/login.html";
    return;
  }

  // 2. Mostra il nome utente in alto a destra
  const loggedUserName = document.getElementById("logged-user-name");
  if (loggedUserName) {
    loggedUserName.textContent = username.charAt(0).toUpperCase() + username.slice(1);
  }

  // 3. Gestione visibilità pulsanti in base ai permessi
  const navUtenti = document.getElementById("nav-utenti");
  if (ruolo === "admin" && navUtenti) {
    navUtenti.style.display = "flex";
  }

  const navScadenze = document.getElementById("nav-scadenze");
  if (permessi.scadenze === false && navScadenze) {
    navScadenze.style.display = "none";
  }

  const navImpegni = document.getElementById("nav-impegni");
  if (permessi.impegni === false && navImpegni) {
    navImpegni.style.display = "none";
  }

  const navRicette = document.getElementById("nav-ricette");
  if (permessi.ricette === false && navRicette) {
    navRicette.style.display = "none";
  }

  const navMedia = document.getElementById("nav-media");
  if (permessi.media === false && navMedia) {
    navMedia.style.display = "none";
  }

  // 4. Gestione Apertura/Chiusura Menu Laterale (Hamburger)
  const menuToggleBtn = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("main-sidebar");

  if (menuToggleBtn && sidebar) {
    menuToggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("closed");
    });
  }

  // 5. Cambiamento dinamico delle pagine sulla tela (iframe)
  const navButtons = document.querySelectorAll(".nav-btn");
  const telaIframe = document.getElementById("tela-iframe");

  navButtons.forEach(button => {
    button.addEventListener("click", () => {
      const targetPage = button.getAttribute("data-page");
      if (targetPage && telaIframe) {
        telaIframe.src = targetPage;
        
        // Evidenzia il pulsante attivo
        navButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
      }
    });
  });

  // 6. Gestione Logout
  const btnLogout = document.getElementById("btn-logout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "login/login.html";
    });
  }
});
