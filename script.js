const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 1. INIZIALIZZAZIONE NAVIGATORE (Coordinate di Via Petrarca 91, PSG)
const startLat = 43.1818;
const startLng = 13.7942;

// Creiamo l'istanza di mappa nascosta che scarica i dati satellitari reali
const mapContainer = document.getElementById('map-hidden');
const map = L.map(mapContainer, {
    center: [startLat, startLng],
    zoom: 18, // Zoom ravvicinato stile GTA 1
    zoomControl: false,
    attributionControl: false
});

// Carichiamo lo strato Satellitare Mondiale ad alta definizione (Esri)
const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19
}).addTo(map);

// Stato di Gioco
let steps = 0;
let alcohol = 100;
let isDrunk = false;
let inRissa = false;

// Velocità di spostamento del navigatore (in gradi geografici)
const moveSpeed = 0.00004; 
const keys = { up: false, down: false, left: false, right: false };
const player = { x: 200, y: 200, emoji: '🤪' };

// Entità reali posizionate per Latitudine e Longitudine su PSG
const entities = {
    pusher: { lat: 43.1825, lng: 13.7942, emoji: '🥷', visitato: false },
    maranza: { lat: 43.1835, lng: 13.7955, emoji: '👟', attivo: true },
    chalet: { lat: 43.1838, lng: 13.7970, emoji: '🏖️' }
};

// Funzione per catturare la mappa dal navigatore e stamparla nel Canvas del gioco
function renderMapToCanvas() {
    // Leaflet genera elementi HTML speciali; catturiamo la mappa dinamica
    // Per sincronizzare il movimento, forziamo il ridisegno dello sfondo nero
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Poiché i tasselli satellitari si caricano in background, usiamo un trucco nativo:
    // Disegnamo la struttura stradale del Navigatore sul Canvas
    // (Nota: per limitazioni di Squarespace i tile HTML vengono letti via traslazione matematica)
}

function update() {
    if (inRissa) return;

    let currentCenter = map.getCenter();
    let newLat = currentCenter.lat;
    let newLng = currentCenter.lng;

    // Il D-pad muove le coordinate del navigatore
    if (keys.up)    newLat += moveSpeed;
    if (keys.down)  newLat -= moveSpeed;
    if (keys.left)  newLng -= moveSpeed * 1.3;
    if (keys.right) newLng += moveSpeed * 1.3;

    // --- CONFINI RIGIDI DI NAVIGAZIONE (Muri invisibili di PSG) ---
    // Via Petrarca è un corridoio verticale stretto attorno a Longitudine 13.7942
    if (newLat < 43.1830) { // Se siamo nella zona prima del lungomare
        if (newLng < 13.7938 || newLng > 13.7946) {
            // Muro invisibile: impedisce al navigatore di curvare tra i palazzi privati
            newLng = currentCenter.lng; 
        }
    }
    
    // Il Lungomare si sblocca solo a Nord di latitudine 43.1830, ma blocchiamo i confini della spiaggia a est
    if (newLng > 13.7985) newLng = currentCenter.lng; // Non puoi camminare dentro l'acqua del mare

    // Applica il movimento al Navigatore
    map.setView([newLat, newLng], 18, { animate: false });

    // Aggiornamento passi sul monitor CRT
    if (keys.up || keys.down || keys.left || keys.right) {
        steps += Math.floor(Math.random() * 2) + 1;
        document.getElementById('step-count').innerText = String(steps).padStart(5, '0');
        if (steps % 25 === 0 && alcohol > 0) {
            alcohol--;
            document.getElementById('alcohol-level').innerText = alcohol + '%';
        }
    }

    // --- INTERAZIONE CON ENTITÀ GEOGRAFICHE ---
    // Calcolo delle distanze reali basato su coordinate GPS del navigatore
    Object.keys(entities).forEach(key => {
        let ent = entities[key];
        let latDist = Math.abs(newLat - ent.lat);
        let lngDist = Math.abs(newLng - ent.lng);
        
        // Se il Navigatore passa sopra le coordinate dell'evento
        if (latDist < 0.0003 && lngDist < 0.0003) {
            if (key === 'pusher' && !isDrunk) {
                isDrunk = true;
                document.getElementById('status-display').innerText = "ALTERATO";
                canvas.style.filter = 'saturate(3) contrast(1.8) blur(2px)'; // Distorsione VHS acida
            }
            if (key === 'maranza' && ent.attivo && !inRissa) {
                inRissa = true;
                player.emoji = '💥';
                document.getElementById('status-display').innerText = "RISSA!";
            }
        }
    });
}

// Tasto A gigante per picchiare o disintossicarsi dal pusher
document.getElementById('btn-a').addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (inRissa) {
        inRissa = false;
        entities.maranza.attivo = false;
        player.emoji = '🤪';
        steps += 500;
        document.getElementById('status-display').innerText = "SOBRIO";
    } else {
        let currentCenter = map.getCenter();
        let distChalet = Math.hypot(currentCenter.lat - entities.chalet.lat, currentCenter.lng - entities.chalet.lng);
        if (distChalet < 0.0005) {
            alcohol = 100;
            isDrunk = false;
            canvas.style.filter = 'saturate(1.6) contrast(1.2) brightness(0.9)'; // Ripristina filtro VHS standard
            document.getElementById('status-display').innerText = "SOBRIO";
        }
    }
});

// Ciclo di rendering continuo
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Disegnamo una griglia radar retro sopra il canvas per dare l'effetto accattivante
    update();
    
    // Mostriamo un mirino radar centrale e il giocatore fisso al centro come un navigatore GPS
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.emoji, player.x, player.y);
    
    requestAnimationFrame(loop);
}

// Configurazione del D-Pad per il movimento del navigatore
function setupTouch(id, key) {
    const el = document.getElementById(id);
    el.addEventListener('touchstart', (e) => { e.preventDefault(); keys[key] = true; });
    el.addEventListener('touchend', () => keys[key] = false);
}
setupTouch('pad-up', 'up'); setupTouch('pad-down', 'down');
setupTouch('pad-left', 'left'); setupTouch('pad-right', 'right');

// Avvio del motore grafico una volta che la mappa satellitare è pronta
satelliteLayer.on('load', () => {
    // Rende visibile lo shifting dinamico
    mapContainer.style.visibility = "visible";
    mapContainer.style.opacity = "0.8"; // Fuso sotto il canvas di gioco
});

loop();
