const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Dati di Gioco
let steps = 0;
let alcohol = 100;
let isPlayerMoving = false;
let inLoadingZone = false;

// Posizione iniziale della Mappa (il Pub è al centro dell'inquadratura iniziale)
let mapX = -200;
let mapY = -200;
const speed = 4;

// Stato del Giocatore (Fisso al centro dello schermo quadrato di 400x400)
const player = {
    x: 200,
    y: 200,
    radius: 12,
    angle: 0 // Rotazione del pupetto
};

// Input Direzionali
const keys = { up: false, down: false, left: false, right: false };

// Mappa Finta (Colori primari/secondari come richiesto)
function drawMap() {
    // Sfondo erba/zona residenziale (Verde)
    ctx.fillStyle = '#55aa44';
    ctx.fillRect(mapX, mapY, 1200, 1200);

    // Zona Pub (Il tuo locale a Sud)
    ctx.fillStyle = '#aa4422'; // Marrone/Mattonato
    ctx.fillRect(mapX + 350, mapY + 700, 100, 800); 
    ctx.fillStyle = '#ffcc00'; // Insegna Pub Gialla
    ctx.fillRect(mapX + 380, mapY + 690, 40, 10);

    // La ferrovia/ostacolo che divide il pub dal mare
    ctx.fillStyle = '#777777';
    ctx.fillRect(mapX, mapY + 500, 1200, 40);

    // Il Sottopasso (Il punto di passaggio)
    ctx.fillStyle = '#333333';
    ctx.fillRect(mapX + 550, mapY + 490, 80, 60);

    // Il Lungomare (Asfalto Grigio a Nord della ferrovia)
    ctx.fillStyle = '#999999';
    ctx.fillRect(mapX, mapY, 1200, 450);

    // Il Mare (Blu a Nord del tutto)
    ctx.fillStyle = '#2266aa';
    ctx.fillRect(mapX, mapY, 1200, 100);

    // Elemento Satirico: Il Pusher vicino al sottopasso
    ctx.fillStyle = '#ff0055'; // Omino Magenta
    ctx.beginPath();
    ctx.arc(mapX + 530, mapY + 530, 8, 0, Math.PI * 2);
    ctx.fill();
}

// Disegna l'Avatar Custom (La testa che ruota)
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Corpo/Testa Arancione
    ctx.fillStyle = '#ff5500';
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Occhiali storti da miope/ubriaco (Dettaglio Lineart Bianca/Nera)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(-8, -6, 7, 7);
    ctx.strokeRect(1, -6, 7, 7);
    
    // Naso pronunciato stile UPA
    ctx.fillStyle = '#ff5500';
    ctx.beginPath();
    ctx.arc(0, 4, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// Logica di Movimento ed Eventi
function update() {
    isPlayerMoving = false;

    if (keys.up)    { mapY += speed; player.angle = Math.PI * 1.5; isPlayerMoving = true; }
    if (keys.down)  { mapY -= speed; player.angle = Math.PI * 0.5; isPlayerMoving = true; }
    if (keys.left)  { mapX += speed; player.angle = Math.PI;       isPlayerMoving = true; }
    if (keys.right) { mapX -= speed; player.angle = 0;             isPlayerMoving = true; }

    if (isPlayerMoving) {
        steps += 1; // Incrementa il contapassi sullo smartwatch
        document.getElementById('step-count').innerText = steps;
        
        // Consumo alcool progressivo
        if (steps % 10 === 0 && alcohol > 0) {
            alcohol--;
            document.getElementById('alcohol-level').innerText = alcohol + '%';
        }
    }

    // Trigger per il Caricamento del Sottopasso
    // Se il giocatore si trova all'altezza della ferrovia (coordinate mappa)
    let relativePlayerY = player.y - mapY;
    if (relativePlayerY > 480 && relativePlayerY < 520 && !inLoadingZone) {
        triggerUnderpassLoading();
    }
}

function triggerUnderpassLoading() {
    inLoadingZone = true;
    const loader = document.getElementById('loading-screen');
    loader.classList.remove('hidden');
    
    // Ferma il gioco durante il caricamento
    setTimeout(() => {
        loader.classList.add('hidden');
        // Teletrasporta leggermente il giocatore oltre la ferrovia per evitare loop di caricamento
        if (keys.up) mapY += 60;
        if (keys.down) mapY -= 60;
        inLoadingZone = false;
    }, 1500); // 1.5 secondi di caricamento ironico
}

// Il Game Loop Principale
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!inLoadingZone) {
        update();
    }
    
    drawMap();
    drawPlayer();
    
    requestAnimationFrame(loop);
}

// Setup dei Controlli Touch per Mobile (D-Pad del GameBoy)
function setupTouchControls(id, key) {
    const btn = document.getElementById(id);
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[key] = true; });
    btn.addEventListener('touchend', () => keys[key] = false);
}

setupTouchControls('pad-up', 'up');
setupTouchControls('pad-down', 'down');
setupTouchControls('pad-left', 'left');
setupTouchControls('pad-right', 'right');

// Tasti A e B Azione (per ora di test)
document.getElementById('btn-a').addEventListener('touchstart', (e) => {
    e.preventDefault();
    alert("RISSA ATTIVATA ODrink preso!");
});

// Avvia il gioco
loop();
