const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Coordinate di partenza (Via Petrarca 91, PSG)
const startLat = 43.1818;
const startLng = 13.7942;

const mapContainer = document.getElementById('map-hidden');
const map = L.map(mapContainer, {
    center: [startLat, startLng],
    zoom: 19, // ZOOM MASSIMO PER L'EFFETTO RAGAZZO DI STRADA
    zoomControl: false,
    attributionControl: false,
    dragging: false,      // Blocchiamo il trascinamento con le dita
    touchZoom: false,     // Blocchiamo lo zoom manuale
    scrollWheelZoom: false
});

// Satellite Esri ad altissima risoluzione
const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19
}).addTo(map);

// Stato di Gioco
let steps = 0;
let alcohol = 100;
let isDrunk = false;
let inRissa = false;

const keys = { up: false, down: false, left: false, right: false };
const player = { x: 200, y: 200, emoji: '🤪' };

// Angolo di rotazione impostato nel CSS (in radianti per la matematica del movimento)
const angleRad = -23 * Math.PI / 180;
const moveSpeed = 0.00003; // Velocità calibrata sullo zoom 19

function update() {
    if (inRissa) return;

    let currentCenter = map.getCenter();
    let dLat = 0;
    let dLng = 0;

    // Calcolo del movimento basato sui tasti premuti
    if (keys.up)    dLat += moveSpeed;
    if (keys.down)  dLat -= moveSpeed;
    if (keys.left)  dLng -= moveSpeed * 1.4;
    if (keys.right) dLng += moveSpeed * 1.4;

    // MATRICE DI ROTAZIONE: Adatta i comandi del D-Pad alla mappa ruotata di 23 gradi
    // In questo modo "Su" ti farà andare avanti dritto lungo la via visibile sullo schermo
    let rotatedLat = dLat * Math.cos(angleRad) - dLng * Math.sin(angleRad);
    let rotatedLng = dLat * Math.sin(angleRad) + dLng * Math.cos(angleRad);

    let newLat = currentCenter.lat + rotatedLat;
    let newLng = currentCenter.lng + rotatedLng;

    // --- CONFINI INVISIBILI ADATTATI ---
    // (Opzionale: puoi rifinire questi valori per bloccare il giocatore dentro Via Petrarca)
    if (newLat < 43.1830 && (newLng < 13.7935 || newLng > 13.7949)) {
        newLng = currentCenter.lng;
        newLat = currentCenter.lat;
    }

    // Applica il movimento al navigatore satellitare
    map.setView([newLat, newLng], 19, { animate: false });

    // Contapassi Smartwatch
    if (keys.up || keys.down || keys.left || keys.right) {
        steps += Math.floor(Math.random() * 2) + 1;
        document.getElementById('step-count').innerText = String(steps).padStart(5, '0');
    }
}

// Ciclo di animazione del GameBoy
function loop() {
    update();
    
    // Pulizia e disegno dell'omino fisso al centro dello schermo
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.emoji, player.x, player.y);
    
    requestAnimationFrame(loop);
}

// Configurazione D-Pad mobile
function setupTouch(id, key) {
    const el = document.getElementById(id);
    el.addEventListener('touchstart', (e) => { e.preventDefault(); keys[key] = true; });
    el.addEventListener('touchend', () => keys[key] = false);
}
setupTouch('pad-up', 'up'); setupTouch('pad-down', 'down');
setupTouch('pad-left', 'left'); setupTouch('pad-right', 'right');

// Avvio del gioco appena la mappa satellitare è pronta
satelliteLayer.on('load', () => {
    mapContainer.style.opacity = "1";
});

loop();
