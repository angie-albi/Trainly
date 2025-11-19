# Trainly 🏋️ - Piattaforma E-commerce per il Fitness

<div align="center">

[](https://nodejs.org/) [](https://expressjs.com/) [](https://sqlite.org/) [](https://ejs.co/)

Un'applicazione web per migliorare il percorso di allenamento attraverso l'acquisto di prodotti e servizi digitali dedicati al fitness

</div>

## Funzionalità Principali

### 👤 Per i Visitatori (Non Registrati):

  - 🛍️ Esplorare il catalogo completo di prodotti e servizi
  - 🔎 Utilizzare la funzione di ricerca per trovare prodotti specifici
  - 🛒 Aggiungere e rimuovere prodotti dal carrello

### 🧑 Per gli Utenti Standard (Registrati):

  - 🔐 **Autenticazione sicura** con registrazione e login
  - 💳 **Completare l'acquisto** dei prodotti nel carrello
  - 📖 **Visualizzare lo storico** dei propri ordini
  - ✍️ **Gestire il profilo** personale 

### 👑 Per gli Amministratori:

  - 📊 **Pannello di controllo dedicato** per la gestione del sito
  - 🛍️ **Gestione completa del catalogo**: aggiunta, modifica ed eliminazione di prodotti
  - 📦 **Visualizzazione di tutti gli ordini** effettuati dagli utenti sulla piattaforma

## Tecnologie Utilizzate

### Backend

  - **Node.js**: Runtime JavaScript per il server
  - **Express.js**: Framework web per la gestione delle route e delle richieste API
  - **EJS**: Template engine per generare HTML dinamico lato server
  - **Passport.js**: Middleware per la gestione dell'autenticazione
  - **Bcrypt**: Libreria per l'hashing sicuro delle password

### Database

  - **SQLite**: Database relazionale leggero per la memorizzazione dei dati

### Frontend

  - **HTML5 / CSS3**: Struttura e stile delle pagine web
  - **JavaScript (ES6+)**: Interattività e logica lato client
  - **Bootstrap 5**: Framework CSS per un design responsive e moderno

### Sviluppo

  - **Nodemon**: Riavvio automatico del server durante lo sviluppo

## Installazione e Avvio

Per avviare il progetto in locale, segui questi semplici passaggi

### 📋 Prerequisiti

  - **Node.js** (versione 16 o superiore)
  - **npm** (incluso in Node.js)

### ⚙️ Istruzioni

1.  **Clona il repository** (o scarica i file in una cartella)
    ```bash
    git clone https://github.com/angie-albi/Trainly.git    
    ```

2.  **Spostati nella directory del progetto**
    ```bash
    cd Trainly    
    ```
    
3.  **Installa le dipendenze** del progetto. Apri un terminale nella cartella principale ed esegui

    ```bash
    npm install
    ```

4.  **Avvia l'applicazione**. Il database e i dati iniziali verranno creati automaticamente

    ```bash
    npm start
    ```

5.  **Apri il browser** e visita l'indirizzo: http://localhost:3000/

## Account di Test

Per testare le diverse funzionalità, puoi utilizzare i seguenti account preconfigurati:

| Ruolo | Email | Password |
| :--- | :--- | :--- |
| 👑 **Admin** | `admin@trainly.com` | `Admin123!` |
| 🧑 **User** | `albitres2004@gmail.com` | `Test123!` |
| 🧑 **User** | `lucia.bianchi@gmail.com` | `Test123!` |

## Struttura del Progetto

```
trainly/
├── 📁 bin/
│   └── www                # Script di avvio del server
├── 📁 middleware/
│   ├── autorizzazioni.js  # Middleware per permessi (utente, admin)
│   └── passport.js        # Configurazione per l'autenticazione
├── 📁 models/
│   └── 📁 dao/            # Data Access Objects per le operazioni sul DB
├── 📁 public/             # File statici (CSS, JS client, immagini)
├── 📁 routes/             # Gestione delle route per le pagine e le API
├── 📁 views/              # Viste EJS (template HTML)
│   └── 📁 partials/       # Componenti riutilizzabili (header footer, ...)
├── 📄 app.js              # File principale di configurazione Express
├── 📄 db.js               # Gestione della connessione e inizializzazione del DB
├── 📄 schema.sql          # Schema del database SQLite
├── 📄 package.json        # Dipendenze e script del progetto
└── 📄 .env                # Template per le variabili d'ambiente
```

## Schema del Database

Il database `SQLite` è organizzato nelle seguenti tabelle principali:

  - `users`: Memorizza i dati degli utenti (inclusi gli admin)
  - `products`: Contiene il catalogo di tutti i prodotti digitali in vendita
  - `orders` e `order_items`: Gestiscono gli ordini e i prodotti associati
  - `cart_items`: Salva il contenuto del carrello per gli utenti registrati
  - `newsletter`: Lista delle email iscritte alla newsletter

Per una visione completa della struttura, consulta il file schema.sql

## Video Dimostrativo

Guarda il video che mostra le principali funzionalità di **Trainly** in azione\!

**[Guarda il video]** https://youtu.be/ZLD7Dgu3Zag
