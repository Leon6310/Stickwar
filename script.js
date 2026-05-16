const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const bgMusic = document.getElementById("bgMusic");

const screens = {
  menu: document.getElementById("mainMenu"), setup: document.getElementById("setupScreen"),
  shop: document.getElementById("shopScreen"), settings: document.getElementById("settingsMenu"),
  spin: document.getElementById("spinScreen"), game: document.getElementById("gameScreen"),
  gameOver: document.getElementById("gameOverScreen")
};

const ui = {
  gold: document.getElementById("goldDisplay"), mapSelect: document.getElementById("mapSelect"),
  diffSelect: document.getElementById("diffSelect"), menuGems: document.getElementById("menuGems"),
  shopGems: document.getElementById("shopGems"), cheatInput: document.getElementById("cheatInput"),
  promoInput: document.getElementById("promoInput"), btnCheatOff: document.getElementById("btnCheatOff"),
  gemRewardText: document.getElementById("gemRewardText"), pauseOverlay: document.getElementById("pauseOverlay"),
  btns: { sword: document.getElementById("btnSword"), archer: document.getElementById("btnArcher"), ninja: document.getElementById("btnNinja"), knight: document.getElementById("btnKnight"), mage: document.getElementById("btnMage"), titan: document.getElementById("btnTitan") }
};

let gold, frameCount, gameOver, isPaused, animationId, difficultyMult, currentMap;
let playerUnits, enemyUnits, projectiles, particles;
let playerCastle, enemyCastle;
let godMode = false;

// --- DATEN LADEN ---
let gems = parseInt(localStorage.getItem("stickwar_gems")) || 0;
let unlockedSkins = JSON.parse(localStorage.getItem("stickwar_skins")) || ["default"];
let activeSkin = localStorage.getItem("stickwar_activeSkin") || "default";
let usedCodes = JSON.parse(localStorage.getItem("stickwar_codes")) || [];
let lastSpinDate = localStorage.getItem("stickwar_lastSpin") || "";

const PROMO_CODES = { "EPICSTART": 100, "GEMS2024": 250, "STICKGODS": 500, "NINJA": 150, "WINTER24": 300, "YOUTUBE": 200, "TITANPOWER": 400, "DEVGIFT": 1000 };

function updateGemsDisplay() {
  ui.menuGems.innerText = gems; ui.shopGems.innerText = gems;
  localStorage.setItem("stickwar_gems", gems); localStorage.setItem("stickwar_skins", JSON.stringify(unlockedSkins));
  localStorage.setItem("stickwar_activeSkin", activeSkin); localStorage.setItem("stickwar_codes", JSON.stringify(usedCodes));
  updateInventoryUI();
}

function showScreen(screen) { Object.values(screens).forEach(s => s.classList.add("hidden")); screen.classList.remove("hidden"); }

document.getElementById("btnToSetup").addEventListener("click", () => showScreen(screens.setup));
document.getElementById("btnSetupToMenu").addEventListener("click", () => showScreen(screens.menu));
document.getElementById("btnToShop").addEventListener("click", () => { updateInventoryUI(); showScreen(screens.shop); });
document.getElementById("btnShopToMenu").addEventListener("click", () => showScreen(screens.menu));
document.getElementById("btnOpenSettings").addEventListener("click", () => showScreen(screens.settings));
document.getElementById("btnCloseSettings").addEventListener("click", () => showScreen(screens.menu));
document.getElementById("btnToSpin").addEventListener("click", () => showScreen(screens.spin));
document.getElementById("btnSpinToMenu").addEventListener("click", () => showScreen(screens.menu));
document.getElementById("btnBackToMenu").addEventListener("click", () => { bgMusic.pause(); showScreen(screens.menu); });
document.getElementById("btnPauseGame").addEventListener("click", () => { if (!gameOver) { isPaused = true; ui.pauseOverlay.classList.remove("hidden"); } });
document.getElementById("btnResume").addEventListener("click", () => { isPaused = false; ui.pauseOverlay.classList.add("hidden"); animate(); });
document.getElementById("btnQuitMatch").addEventListener("click", () => { isPaused = false; ui.pauseOverlay.classList.add("hidden"); bgMusic.pause(); showScreen(screens.menu); });

function updateInventoryUI() {
  const skins = ["default", "shadow", "gold", "blood", "ice", "toxic", "galaxy", "wood", "metal", "candy", "water", "fire", "radioactive", "yinyang"];
  skins.forEach(skin => {
    let el = document.getElementById("item_" + skin);
    if (!el) return;
    let btn = el.querySelector(".buy-btn");
    el.classList.remove("owned", "equipped");
    if (activeSkin === skin) { el.classList.add("equipped"); btn.innerText = "Ausgerüstet"; btn.disabled = true; }
    else if (unlockedSkins.includes(skin)) { el.classList.add("owned"); btn.innerText = "Ausrüsten"; btn.disabled = false; }
    else { btn.disabled = false; btn.innerText = "Kaufen"; }
  });
}

window.buyOrEquipSkin = function(skinId, cost) {
  if (unlockedSkins.includes(skinId)) { activeSkin = skinId; }
  else {
    if (gems >= cost) { gems -= cost; unlockedSkins.push(skinId); activeSkin = skinId; alert("Skin erfolgreich gekauft und ausgerüstet!"); }
    else { alert("Nicht genug Edelsteine!"); }
  }
  updateGemsDisplay();
};
updateGemsDisplay();

document.getElementById("btnDoSpin").addEventListener("click", () => {
  let today = new Date().toDateString();
  if (lastSpinDate === today) { alert("Du hast heute schon gedreht!"); return; }
  let spinBtn = document.getElementById("btnDoSpin"); spinBtn.disabled = true;
  let spinBox = document.getElementById("spinBox"); let resultText = document.getElementById("spinResultText");
  resultText.innerText = ""; let spinCount = 0;
  let spinInterval = setInterval(() => {
    spinBox.innerText = Math.floor(Math.random() * 200) + " 💎"; spinCount++;
    if (spinCount > 20) {
      clearInterval(spinInterval);
      let rand = Math.random(); let reward = 20; 
      if(rand > 0.6) reward = 50; if(rand > 0.9) reward = 100; if(rand > 0.98) reward = 500;
      spinBox.innerText = reward + " 💎"; resultText.innerText = `Glückwunsch! +${reward} Edelsteine!`;
      gems += reward; lastSpinDate = today; updateGemsDisplay(); spinBtn.disabled = false;
    }
  }, 100);
});

document.getElementById("btnRedeemPromo").addEventListener("click", () => {
  let code = ui.promoInput.value.toUpperCase().trim();
  if (usedCodes.includes(code)) { alert("Bereits eingelöst!"); return; }
  if (PROMO_CODES[code]) { gems += PROMO_CODES[code]; usedCodes.push(code); updateGemsDisplay(); alert(`Code akzeptiert! +${PROMO_CODES[code]} Edelsteine!`); ui.promoInput.value = ""; }
  else { alert("Ungültiger Code."); }
});

// NEUER CHEAT CODE: N3XUS
document.getElementById("btnCheat").addEventListener("click", () => {
  if (ui.cheatInput.value.toUpperCase() === "N3XUS") { godMode = true; alert("🌟 GOD MODE AKTIVIERT!"); ui.cheatInput.value = ""; ui.btnCheatOff.style.display = "inline-block"; }
  else { alert("Falscher Code!"); }
});
document.getElementById("btnCheatOff").addEventListener("click", () => { godMode = false; alert("❌ Godmode DEAKTIVIERT!"); ui.btnCheatOff.style.display = "none"; });

const MAPS = [
  { name: "Grasland", sky: ["#87CEEB", "#e0f6ff"], ground: "#27ae60" }, { name: "Verbrannte Wüste", sky: ["#f39c12", "#f1c40f"], ground: "#d35400" },
  { name: "Nachtwald", sky: ["#0a192f", "#112240"], ground: "#0f3a1e" }, { name: "Blutiger Vulkan", sky: ["#4a0e0e", "#1a0505"], ground: "#c0392b" }
];
MAPS.forEach((map, index) => { let option = document.createElement("option"); option.value = index; option.text = map.name; ui.mapSelect.appendChild(option); });

const UNIT_TYPES = {
  sword:  { cost: 15,  hp: 60,  speed: 1.2, damage: 10, range: 45,  cooldown: 50,  color: "#ecf0f1", scale: 1 },
  archer: { cost: 25,  hp: 40,  speed: 1.0, damage: 15, range: 300, cooldown: 80,  color: "#2ecc71", scale: 1, isRanged: true },
  ninja:  { cost: 35,  hp: 45,  speed: 2.2, damage: 20, range: 40,  cooldown: 30,  color: "#34495e", scale: 0.9 },
  knight: { cost: 50,  hp: 150, speed: 0.8, damage: 25, range: 50,  cooldown: 70,  color: "#f1c40f", scale: 1 },
  mage:   { cost: 80,  hp: 70,  speed: 0.7, damage: 45, range: 250, cooldown: 90,  color: "#00bcd4", scale: 1, isRanged: true },
  titan:  { cost: 200, hp: 600, speed: 0.5, damage: 60, range: 70,  cooldown: 100, color: "#9b59b6", scale: 1.6 }
};

class Particle {
  constructor(x, y, color, isDust = false) {
    this.x = x; this.y = y; this.color = color; this.isDust = isDust;
    if (isDust) { this.vx = (Math.random() - 0.5) * 2; this.vy = Math.random() * -1.5; this.life = 0.6; this.decay = 0.04; this.size = Math.random() * 3 + 1; }
    else { this.vx = (Math.random() - 0.5) * 8; this.vy = (Math.random() - 0.5) * 8 - 2; this.life = 1.0; this.decay = Math.random() * 0.05 + 0.02; this.size = Math.random() * 4 + 2; }
  }
  update() { this.x += this.vx; this.y += this.vy; if (!this.isDust) this.vy += 0.2; this.life -= this.decay; }
  draw() { ctx.globalAlpha = Math.max(0, this.life); ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, this.size, this.size); ctx.globalAlpha = 1.0; }
}

class Castle {
  constructor(x, color, type) { this.x = x; this.y = 160; this.width = 110; this.height = 200; this.color = color; this.type = type; this.maxHp = 1000; this.hp = 1000; }
  draw() {
    ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, this.width, this.height);
    let flagColor = this.type === 'player' ? "#3498db" : "#e74c3c";
    ctx.fillStyle = "#7f8c8d"; ctx.fillRect(this.x + 10, this.y - 70, 4, 50); 
    ctx.fillStyle = flagColor; ctx.beginPath(); ctx.moveTo(this.x + 14, this.y - 70); ctx.lineTo(this.x + 45, this.y - 55); ctx.lineTo(this.x + 14, this.y - 40); ctx.fill();
    ctx.fillStyle = "red"; ctx.fillRect(this.x, this.y - 40, this.width, 8);
    ctx.fillStyle = "#2ecc71"; ctx.fillRect(this.x, this.y - 40, (this.hp / this.maxHp) * this.width, 8);
  }
}

// --- VERBESSERTE PROJEKTILE (Pfeile rotieren & haben Effekte) ---
class Projectile {
  constructor(x, y, target, damage, direction, type = "arrow", skin = "default") {
    this.startX = x; this.startY = y; this.x = x; this.y = y; this.prevX = x; this.prevY = y;
    this.target = target; this.damage = damage; this.direction = direction; this.type = type; this.skin = skin;
    this.speed = type === "magic" ? 4 : 8; this.active = true;
    this.targetX = target instanceof Castle ? (direction === 'right' ? target.x : target.x + target.width) : target.x;
    this.totalDist = Math.abs(this.targetX - this.startX); this.progress = 0;
  }
  update() {
    this.prevX = this.x; this.prevY = this.y; 
    let currentTargetX = this.target instanceof Castle ? (this.direction === 'right' ? this.target.x : this.target.x + this.target.width) : this.target.x;
    this.totalDist = Math.abs(currentTargetX - this.startX); 
    this.x += this.direction === 'right' ? this.speed : -this.speed;
    this.progress = Math.abs(this.x - this.startX) / this.totalDist;
    this.y = this.startY - Math.sin(this.progress * Math.PI) * (this.type === "magic" ? 30 : Math.min(120, this.totalDist / 2));
    
    // Partikeleffekte für die Schüsse der teuren Skins
    if (frameCount % 3 === 0) {
      if (this.skin === "fire") particles.push(new Particle(this.x, this.y, "#FF4500", true));
      if (this.skin === "water") particles.push(new Particle(this.x, this.y, "#00BFFF", true));
      if (this.skin === "radioactive") particles.push(new Particle(this.x, this.y, "#39FF14", true));
      if (this.skin === "yinyang") particles.push(new Particle(this.x, this.y, Math.random() > 0.5 ? "#FFFFFF" : "#000000", true));
      if (this.skin === "galaxy") particles.push(new Particle(this.x, this.y, Math.random() > 0.5 ? "#e0b0ff" : "#4b0082", true));
      if (this.type === "magic" && this.skin === "default") particles.push(new Particle(this.x, this.y, "#00bcd4", true));
    }

    if (this.progress >= 1 || Math.abs(this.x - currentTargetX) < 15) { 
      this.target.hp -= this.damage; 
      // Explosion beim Einschlag
      for(let i=0; i<8; i++) {
        let impactColor = this.skin === "default" ? (this.type === "magic" ? "#00bcd4" : "grey") : 
          (this.skin === "fire" ? "#FF4500" : (this.skin === "radioactive" ? "#39FF14" : (this.skin === "water" ? "#00BFFF" : "#fff")));
        particles.push(new Particle(this.x, this.y, impactColor));
      }
      this.active = false; 
    }
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Berechne den Winkel des Pfeils für eine realistische Flugbahn
    let angle = Math.atan2(this.y - this.prevY, this.x - this.prevX);
    ctx.rotate(angle);

    if (this.type === "magic") { 
      ctx.fillStyle = this.skin === "fire" ? "#FF8C00" : (this.skin === "radioactive" ? "#00FF00" : "#00bcd4");
      ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI*2); ctx.fill(); 
    } else { 
      // Echter Pfeil mit Schaft und Spitze
      ctx.fillStyle = "#bdc3c7"; 
      ctx.fillRect(-10, -1, 20, 2); 
      ctx.fillStyle = "#7f8c8d"; 
      ctx.beginPath(); ctx.moveTo(10, -4); ctx.lineTo(16, 0); ctx.lineTo(10, 4); ctx.fill();
    }
    
    ctx.restore();
  }
}

class Unit {
  constructor(x, typeName, team) {
    this.config = UNIT_TYPES[typeName]; this.typeName = typeName; this.team = team; this.direction = team === 'player' ? 'right' : 'left';
    this.x = x; this.y = 360; this.hp = this.config.hp; this.maxHp = this.config.hp;
    this.attackCooldown = 0; this.walkCycle = Math.random() * Math.PI; this.isAttacking = false; this.attackAnimTimer = 0;
  }

  update(enemies, allies, enemyCastle) {
    if (godMode && this.team === 'player') this.hp = this.maxHp;
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.isAttacking) { this.attackAnimTimer++; if (this.attackAnimTimer > 15) { this.isAttacking = false; this.attackAnimTimer = 0; } }

    if (this.team === 'player' && frameCount % 6 === 0) {
      if (activeSkin === "fire") particles.push(new Particle(this.x + (Math.random()-0.5)*15, this.y - Math.random()*40, "#FF4500", true));
      if (activeSkin === "water") particles.push(new Particle(this.x + (Math.random()-0.5)*15, this.y - Math.random()*20, "#00BFFF", true));
      if (activeSkin === "radioactive") particles.push(new Particle(this.x + (Math.random()-0.5)*20, this.y - Math.random()*50, "#39FF14", true));
      if (activeSkin === "yinyang") particles.push(new Particle(this.x + (Math.random()-0.5)*20, this.y - Math.random()*40, Math.random() > 0.5 ? "#FFFFFF" : "#000000", true));
      if (activeSkin === "galaxy") particles.push(new Particle(this.x + (Math.random()-0.5)*20, this.y - Math.random()*40, Math.random() > 0.5 ? "#e0b0ff" : "#4b0082", true));
    }

    let target = enemies.length > 0 ? enemies[0] : enemyCastle;
    let targetX = target instanceof Castle ? (this.direction === 'right' ? target.x : target.x + target.width) : target.x;
    let distanceToTarget = Math.abs(this.x - targetX);
    let allyBlocking = false;

    for (let ally of allies) {
      if (ally === this || ally.config.isRanged || this.typeName === 'ninja') continue; 
      let distToAlly = (this.direction === 'right') ? ally.x - this.x : this.x - ally.x;
      if (distToAlly > 0 && distToAlly < (30 * this.config.scale)) { allyBlocking = true; break; }
    }

    if (distanceToTarget <= this.config.range) {
      this.walkCycle = 0; 
      if (this.attackCooldown === 0) {
        this.isAttacking = true; this.attackCooldown = godMode && this.team === 'player' ? 5 : this.config.cooldown;
        
        // Pfeile und Magie bekommen den Skin der Einheit mitgeliefert!
        let skinToPass = this.team === 'player' ? activeSkin : "default";

        if (this.typeName === 'archer') projectiles.push(new Projectile(this.x, this.y - 25, target, this.config.damage, this.direction, "arrow", skinToPass));
        else if (this.typeName === 'mage') projectiles.push(new Projectile(this.x, this.y - 35, target, this.config.damage, this.direction, "magic", skinToPass));
        else target.hp -= this.config.damage;
      }
    } else if (!allyBlocking) {
      let prevCycle = this.walkCycle; this.x += this.direction === 'right' ? this.config.speed : -this.config.speed; this.walkCycle += 0.15 * this.config.speed;
      if (Math.floor(prevCycle / Math.PI) < Math.floor(this.walkCycle / Math.PI)) particles.push(new Particle(this.x, this.y, "rgba(200, 200, 200, 0.5)", true));
    } else { this.walkCycle = 0; }
  }

  draw() {
    let dir = this.direction === 'right' ? 1 : -1; let scale = this.config.scale;
    let bobbing = Math.abs(Math.sin(this.walkCycle)) * 3 * scale;
    let swing = Math.sin(this.walkCycle); let swing2 = Math.cos(this.walkCycle);
    
    ctx.save(); ctx.translate(this.x, this.y);
    ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(0, 0, 15 * scale, 5 * scale, 0, 0, Math.PI*2); ctx.fill();
    ctx.translate(0, -bobbing);

    if (!godMode || this.team === 'enemy') {
      ctx.fillStyle = "red"; ctx.fillRect(-15, -65 * scale, 30, 4);
      ctx.fillStyle = "#2ecc71"; ctx.fillRect(-15, -65 * scale, (this.hp / this.maxHp) * 30, 4);
    }

    ctx.scale(scale, scale);

    let baseColor = this.team === 'player' ? "#2980b9" : "#c0392b";
    let headColor = this.config.color;
    
    if (this.team === 'player') {
      if (activeSkin === "shadow") { baseColor = "#111"; headColor = "#333"; }
      if (activeSkin === "gold") { baseColor = "#f1c40f"; headColor = "#f39c12"; }
      if (activeSkin === "blood") { baseColor = "#8b0000"; headColor = "#ff0000"; }
      if (activeSkin === "ice") { baseColor = "#0088ff"; headColor = "#00ffff"; }
      if (activeSkin === "toxic") { baseColor = "#228b22"; headColor = "#adff2f"; }
      if (activeSkin === "wood") { baseColor = "#A0522D"; headColor = "#8B4513"; }
      if (activeSkin === "metal") { baseColor = "#808080"; headColor = "#C0C0C0"; }
      if (activeSkin === "candy") { baseColor = "#FFC0CB"; headColor = "#FF69B4"; }
      if (activeSkin === "water") { baseColor = "#00BFFF"; headColor = "#1E90FF"; }
      if (activeSkin === "fire") { baseColor = "#FF8C00"; headColor = "#FF4500"; }
      if (activeSkin === "radioactive") { baseColor = "#00FF00"; headColor = "#39FF14"; }
      if (activeSkin === "yinyang") { baseColor = "#000000"; headColor = "#FFFFFF"; }
      if (activeSkin === "galaxy") { baseColor = "#4b0082"; headColor = "#e0b0ff"; }
    }

    if (this.typeName === 'knight' || this.typeName === 'titan') {
      ctx.fillStyle = baseColor; ctx.fillRect(-7, -35, 14, 25);
    } else {
      ctx.strokeStyle = baseColor; ctx.lineWidth = 5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(0, -35); ctx.lineTo(0, -15); ctx.stroke();
    }

    let hipY = -15; ctx.strokeStyle = baseColor; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, hipY); ctx.lineTo(swing * 8, -7); ctx.lineTo(swing * 8 + (swing > 0 ? swing*6 : swing*2), 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, hipY); ctx.lineTo(-swing * 8, -7); ctx.lineTo(-swing * 8 + (-swing > 0 ? -swing*6 : -swing*2), 0); ctx.stroke();

    ctx.fillStyle = headColor; ctx.beginPath(); ctx.arc(0, -42, 8, 0, Math.PI * 2); ctx.fill(); 
    if (this.typeName === 'ninja') { ctx.fillStyle = "black"; ctx.fillRect(-8, -44, 16, 4); }

    ctx.fillStyle = (activeSkin === "shadow" || activeSkin === "blood" || activeSkin === "toxic" || activeSkin === "galaxy" || activeSkin === "yinyang") && this.team === 'player' ? "#fff" : "black";
    let eyeOffsetX = dir * 3;
    ctx.beginPath(); ctx.arc(eyeOffsetX - 2, -43, 1.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeOffsetX + 2, -43, 1.5, 0, Math.PI*2); ctx.fill();

    let weaponAngle = this.isAttacking ? ((this.attackAnimTimer < 7) ? -60 * dir : 45 * dir) : 0;
    
    ctx.save(); ctx.translate(dir * 2, -25); ctx.rotate(weaponAngle * Math.PI / 180);
    ctx.strokeStyle = baseColor; ctx.lineWidth = 3.5;
    let handX = dir * 10; let handY = swing2 * 8;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(dir * 5, swing2 * 4); ctx.lineTo(handX, handY); ctx.stroke();

    ctx.translate(handX, handY); ctx.strokeStyle = "#bdc3c7"; ctx.lineWidth = 3; 

    if (this.typeName === 'archer') {
      ctx.strokeStyle = "#8e44ad"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(dir * 5, 0, 15, -Math.PI/2, Math.PI/2, dir === -1); ctx.stroke();
      ctx.strokeStyle = "white"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(dir * 5, -15); ctx.lineTo(dir * 5, 15); ctx.stroke();
    } else if (this.typeName === 'knight') {
      ctx.fillStyle = "#7f8c8d"; ctx.beginPath(); ctx.arc(dir * 4, 0, 12, -Math.PI/2, Math.PI/2, dir === -1); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(dir * 20, -20); ctx.stroke();
    } else if (this.typeName === 'mage') {
      ctx.strokeStyle = "#8d6e63"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(dir * 12, -25); ctx.stroke();
      ctx.fillStyle = "#00bcd4"; ctx.beginPath(); ctx.arc(dir * 12, -25, 5, 0, Math.PI*2); ctx.fill();
    } else if (this.typeName === 'titan') {
      ctx.strokeStyle = "#5d4037"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(dir * 25, -25); ctx.stroke();
    } else { ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(dir * 18, -18); ctx.stroke(); }
    
    ctx.restore(); ctx.restore(); 
  }
}

function spawn(type) {
  if (gold >= UNIT_TYPES[type].cost || godMode) {
    if(!godMode) gold -= UNIT_TYPES[type].cost;
    playerUnits.push(new Unit(playerCastle.x + playerCastle.width + 10, type, "player")); updateUI();
  }
}
Object.keys(ui.btns).forEach(type => ui.btns[type].addEventListener("click", () => spawn(type)));

function updateUI() {
  ui.gold.innerText = Math.floor(gold);
  if(!godMode) Object.keys(ui.btns).forEach(type => ui.btns[type].disabled = gold < UNIT_TYPES[type].cost);
  else Object.keys(ui.btns).forEach(type => ui.btns[type].disabled = false);
}

function enemyAI() {
  let spawnRate = Math.floor(240 / difficultyMult);
  if (frameCount % Math.max(30, spawnRate) === 0) { 
    let rand = Math.random(); let type = 'sword';
    if (rand > 0.4) type = 'archer'; if (rand > 0.6) type = 'ninja';
    if (rand > 0.75) type = 'knight'; if (rand > 0.9) type = 'mage';
    if (frameCount > 2000 && rand > 0.95) type = 'titan';
    enemyUnits.push(new Unit(enemyCastle.x - 20, type, "enemy"));
  }
}

document.getElementById("btnStartGame").addEventListener("click", () => {
  difficultyMult = parseFloat(ui.diffSelect.value); currentMap = MAPS[parseInt(ui.mapSelect.value)];
  if (!godMode) gold = 100; else gold = 99999;
  frameCount = 0; gameOver = false; isPaused = false; ui.pauseOverlay.classList.add("hidden");
  playerUnits = []; enemyUnits = []; projectiles = []; particles = [];
  playerCastle = new Castle(20, "#34495e", "player"); enemyCastle = new Castle(870, "#2c3e50", "enemy"); 
  updateUI(); showScreen(screens.game); if (animationId) cancelAnimationFrame(animationId); animate();
});

function endGame(playerWon) {
  gameOver = true; cancelAnimationFrame(animationId);
  if (playerWon) {
    document.getElementById("gameOverText").innerText = "SIEG!"; document.getElementById("gameOverText").style.color = "#2ecc71";
    let reward = Math.floor(10 * difficultyMult); gems += reward; updateGemsDisplay(); ui.gemRewardText.innerText = `+${reward} 💎 Edelsteine!`;
  } else {
    document.getElementById("gameOverText").innerText = "DEINE BURG FIEL!"; document.getElementById("gameOverText").style.color = "#e74c3c";
    ui.gemRewardText.innerText = "Kämpfe weiter!";
  }
  showScreen(screens.gameOver);
}

function animate() {
  if (gameOver) return;
  if (isPaused) { animationId = requestAnimationFrame(animate); return; }
  
  let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, currentMap.sky[0]); gradient.addColorStop(1, currentMap.sky[1]);
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = currentMap.ground; ctx.fillRect(0, 360, canvas.width, 40);

  playerCastle.draw(); enemyCastle.draw();

  frameCount++;
  if (godMode) gold = 99999; else if (frameCount % 30 === 0) { gold += (2 * (1 / difficultyMult)); updateUI(); }
  
  enemyAI();
  playerUnits.sort((a, b) => b.x - a.x); enemyUnits.sort((a, b) => a.x - b.x);

  for (let i = particles.length - 1; i >= 0; i--) { particles[i].update(); particles[i].draw(); if (particles[i].life <= 0) particles.splice(i, 1); }
  for (let i = projectiles.length - 1; i >= 0; i--) { projectiles[i].update(); projectiles[i].draw(); if (!projectiles[i].active) projectiles.splice(i, 1); }

  [playerUnits, enemyUnits].forEach((teamArr, index) => {
    let enemies = index === 0 ? enemyUnits : playerUnits; let targetCastle = index === 0 ? enemyCastle : playerCastle;
    for (let i = teamArr.length - 1; i >= 0; i--) {
      let unit = teamArr[i]; unit.update(enemies, teamArr, targetCastle); unit.draw();
      if (unit.hp <= 0) {
        for(let p = 0; p < 10; p++) { particles.push(new Particle(unit.x, unit.y - 20, "red")); particles.push(new Particle(unit.x, unit.y - 20, unit.config.color)); }
        teamArr.splice(i, 1);
      }
    }
  });

  if (playerCastle.hp <= 0) endGame(false); else if (enemyCastle.hp <= 0) endGame(true); else animationId = requestAnimationFrame(animate);
}
