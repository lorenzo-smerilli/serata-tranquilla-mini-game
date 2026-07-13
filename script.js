const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Stato di Gioco
let steps = 0;
let alcohol = 100;
let lives = 3;
let isPlayerMoving = false;
let inLoadingZone = false;
let isDrunk = false;
let inRissa = false;

// Coordinate Mappa (Partiamo da Via Petrarca 91, posizionata in modo che il Pub sia al centro)
let mapX = -200;
let mapY = -600; 
const speed = 5;

const player = { x: 200, y: 200, emoji: '🤪' };
const keys = { up: false, down: false, left: false, right: false };

// --- MOM DEL GAMEPLAY (ENTITÀ SULLA MAPPA DI PORTO SAN GIORGIO) ---
// Coordinate relative alla mappa di Via Petrarca e Lungomare
const entities = {
    pub: { x: 400, y: 800, emoji: '🍺' },
    pusher: { x: 400, y: 520, emoji: '🥷' },
    sottopasso: { x: 400, y: 480 },
    chalet1: { x: 250, y: 200, emoji: '🏖️' },
    chalet2: { x: 550, y: 150, emoji: '🏖️' },
    maranza: { x: 420, y: 300, emoji: '👟', attivo: true }
};

function drawMap() {
    // 1. Pavimentazione urbana / Strade sbloccate (Grigio)
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(mapX, mapY, 1000, 1200);

    // Muri/Limiti stradali invalicabili (Edifici di PSG bloccati a est/ovest)
    ctx.fillStyle = '#111111';
    ctx.fillRect(mapX, mapY + 600, 300, 600); // Blocco Ovest Via Petrarca
    ctx.fillRect(mapX + 500, mapY + 600, 500, 600); // Blocco Est Via Petrarca

    // Il Sottopasso Ferroviario
    ctx.fillStyle = '#555555';
    ctx.fillRect(mapX + 350, mapY + 450, 100, 80);

    // Il Lungomare (Zona attiva spaziosa)
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(mapX, mapY, 1000, 450);

    // Disegno Entità statiche tramite Emoji
    ctx.font = '30px Arial';
    ctx.fillText(entities.pub.emoji, mapX + entities.pub.x, mapY + entities.pub.y);
    ctx.fillText(entities.pusher.emoji, mapX + entities.pusher.x, mapY + entities.pusher.y);
    ctx.fillText(entities.chalet1.emoji, mapX + entities.chalet1.x, mapY + entities.chalet1.y);
    ctx.fillText(entities.chalet2.emoji, mapX + entities.chalet2.x, mapY + entities.chalet2.y);
    
    if(entities.maranza.attivo) {
        ctx.fillText(entities.maranza.emoji, mapX + entities.maranza.x, mapY + entities.maranza.y);
    }
}

function drawPlayer() {
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.emoji, player.x, player.y);
}

function update() {
    if (inRissa) return; // Se sei in rissa i comandi si bloccano

    isPlayerMoving = false;
    let oldMapX = mapX;
    let oldMapY = mapY;

    if (keys.up)    { mapY += speed; isPlayerMoving = true; }
    if (keys.down)  { mapY -= speed; isPlayerMoving = true; }
    if (keys.left)  { mapX += speed; isPlayerMoving = true; }
    if (keys.right) { mapX -= speed; isPlayerMoving = true; }

    // --- LIMITI DELLE STRADE (Collisioni base con i blocchi della città) ---
    let relX = player.x - mapX;
    let relY = player.y - mapY;

    // Controllo se il giocatore esce dai confini di Via Petrarca prima del sottopasso
    if (relY > 530) {
        if (relX < 320 || relX > 480) {
            mapX = oldMapX;
            mapY = oldMapY; // Rimbalza contro i palazzi di Via Petrarca
        }
    }

    if (isPlayerMoving) {
        steps += Math.floor(Math.random() * 3) + 1;
        document.getElementById('step-count').innerText = String(steps).padStart(5, '0');
        
        if (steps % 15 === 0 && alcohol > 0) {
            alcohol--;
            document.getElementById('alcohol-level').innerText = alcohol + '%';
        }
    }

    // --- MECCANICA: TRIGGER CARICAMENTO SOTTOPASSO ---
    if (relY > 460 && relY < 500 && !inLoadingZone) {
        triggerUnderpass();
    }

    // --- MECCANICA: INCONTRO PUSHER ---
    let distToPusher = Math.hypot(relX - entities.pusher.x, relY - entities.pusher.y);
    if (distToPusher < 30 && !isDrunk) {
        isDrunk = true;
        player.emoji = '🤪';
        // Applica l'effetto distorsione alcolica visiva allo schermo di gioco
        canvas.style.filter = 'blur(3px) contrast(150%)';
    }

    // --- MECCANICA: RISSA COI MARANZA ---
    if (entities.maranza.attivo) {
        let distToMaranza = Math.hypot(relX - entities.maranza.x, relY - entities.maranza.y);
        if (distToMaranza < 25) {
            startRissa();
        }
    }
}

function triggerUnderpass() {
    inLoadingZone = true;
    document.getElementById('loading-screen').classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        if (keys.up) mapY += 80;
        if (keys.down) mapY -= 80;
        inLoadingZone = false;
    }, 1200);
}

function startRissa() {
    inRissa = true;
    player.emoji = '💥'; // Diventa un'esplosione fumettistica
    alert("RISSA CON I MARANZA! Premi ripetutamente A per difenderti!");
}

// Tasto A per risolvere la Rissa o interagire
document.getElementById('btn-a').addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (inRissa) {
        inRissa = false;
        entities.maranza.attivo = false; // Maranza sconfitto
        player.emoji = '😎';
        steps += 300; // Lo sforzo fisico dà un botto di passi sullo smartwatch!
        alert("Maranza respinto! Hai guadagnato 300 passi!");
    } else {
        // Se sei vicino a uno chalet, bevi ed azzeri i malus
        let relX = player.x - mapX;
        let relY = player.y - mapY;
        let distChalet = Math.hypot(relX - entities.chalet1.x, relY - entities.chalet1.y);
        if (distChalet < 40) {
            alcohol = 100;
            isDrunk = false;
            canvas.style.filter = 'none'; // Il bagno dello chalet ti ripulisce la vista
            alert("Pit-stop completato nei bagni dello Chalet!");
        }
    }
});

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
    drawMap();
    drawPlayer();
    requestAnimationFrame(loop);
}

function setupTouch(id, key) {
    const el = document.getElementById(id);
    el.addEventListener('touchstart', (e) => { e.preventDefault(); keys[key] = true; });
    el.addEventListener('touchend', () => keys[key] = false);
}
setupTouch('pad-up', 'up'); setupTouch('pad-down', 'down');
setupTouch('pad-left', 'left'); setupTouch('pad-right', 'right');

loop();
