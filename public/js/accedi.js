// --- INIZIALIZZAZIONE ---
document.addEventListener("DOMContentLoaded", () => {
  // Gestione del form di login
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  // Gestione submit del form
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      showLoginErrorToast("Inserisci sia l'email che la password");
      return;
    }

    try {
      const response = await fetch("/accedi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        window.location.href = data.redirect || '/profiloUtente';
      } else {
        showLoginErrorToast(data.message || "Credenziali non valide, riprovare");
      }
      
    } catch (err) {
      console.error("Errore durante il login:", err);
      showLoginErrorToast("Si è verificato un errore di connessione");
    }
  });

  // Mostra il toast di errore
  function showLoginErrorToast(message) {
    let toastEl = document.getElementById("loginErrorToast");
    if (toastEl) {
      toastEl.querySelector(".toast-body").textContent = message;
      
      const toast = new bootstrap.Toast(toastEl);
      toast.show();
    } else {
      alert(message);
    }
  }
});