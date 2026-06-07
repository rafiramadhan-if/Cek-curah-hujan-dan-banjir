// ===========================
// SIAGA PWK — script.js
// ===========================

// ── RAIN ANIMATION ──
function createRain() {
  const container = document.getElementById('rainContainer');
  const count = 80;
  for (let i = 0; i < count; i++) {
    const drop = document.createElement('div');
    drop.classList.add('raindrop');
    const left   = Math.random() * 100;
    const height = Math.random() * 60 + 20;
    const delay  = Math.random() * 4;
    const dur    = Math.random() * 1.5 + 0.8;
    const opacity= Math.random() * 0.5 + 0.1;
    drop.style.cssText = `
      left: ${left}%;
      height: ${height}px;
      animation-delay: ${delay}s;
      animation-duration: ${dur}s;
      opacity: ${opacity};
    `;
    container.appendChild(drop);
  }
}

// ── CLOCK ──
function updateClock() {
  const el = document.getElementById('navTime');
  const now = new Date();
  const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  const h = String(wib.getUTCHours()).padStart(2, '0');
  const m = String(wib.getUTCMinutes()).padStart(2, '0');
  const s = String(wib.getUTCSeconds()).padStart(2, '0');
  el.textContent = `${h}:${m}:${s} WIB`;
  const upd = document.getElementById('lastUpdate');
  upd.textContent = `${h}:${m} WIB`;
}

// ── FORECAST DATA ──
const forecasts = [
  { time: 'SEKARANG', icon: '⛈', temp: '24°', desc: 'Badai Petir', rain: '85%' },
  { time: '+1 JAM',   icon: '🌧', temp: '23°', desc: 'Hujan Lebat', rain: '90%' },
  { time: '+2 JAM',   icon: '🌧', temp: '23°', desc: 'Hujan Lebat', rain: '88%' },
  { time: '+3 JAM',   icon: '🌦', temp: '24°', desc: 'Hujan Sedang', rain: '70%' },
  { time: '+4 JAM',   icon: '🌦', temp: '25°', desc: 'Gerimis', rain: '45%' },
  { time: '+5 JAM',   icon: '🌥', temp: '26°', desc: 'Berawan', rain: '20%' },
  { time: '+6 JAM',   icon: '⛅', temp: '27°', desc: 'Cerah Berawan', rain: '10%' },
];

function renderForecast() {
  const row = document.getElementById('forecastRow');
  row.innerHTML = forecasts.map(f => `
    <div class="forecast-item">
      <div class="fc-time">${f.time}</div>
      <div class="fc-icon">${f.icon}</div>
      <div class="fc-temp">${f.temp}</div>
      <div class="fc-desc">${f.desc}</div>
      <div class="fc-rain">🌧 ${f.rain}</div>
    </div>
  `).join('');
}

// ── SIMULATE LIVE DATA ──
function simulateLiveData() {
  const rand = arr => arr[Math.floor(Math.random() * arr.length)];
  document.getElementById('tempDisplay').textContent  = rand([22,23,24,25]) + '°';
  document.getElementById('humidity').textContent     = rand([82,85,87,89,91]) + '%';
  document.getElementById('wind').textContent         = rand([35,40,45,50,55]);
  document.getElementById('rain').textContent         = rand([20,25,28,32,35]);
  document.getElementById('visibility').textContent   = rand([1,2,3]);
}

// ── STATUS LEVEL ──
const levels = [
  { level:'SIAGA 2',  desc:'Potensi banjir di wilayah dataran rendah',        color:'rgba(249,115,22,0.08)', border:'rgba(249,115,22,0.3)', textColor:'#f97316' },
  { level:'BAHAYA',   desc:'Banjir aktif di Sungai Serayu, evakuasi segera',   color:'rgba(239,68,68,0.08)',  border:'rgba(239,68,68,0.3)',  textColor:'#ef4444' },
  { level:'WASPADA',  desc:'Hujan lebat, pantau kondisi sungai terdekat',       color:'rgba(234,179,8,0.08)', border:'rgba(234,179,8,0.3)',  textColor:'#eab308' },
];
let levelIdx = 1;
function cycleStatus() {
  const card  = document.getElementById('statusMain');
  const lvlEl = document.getElementById('statusLevel');
  const dscEl = document.getElementById('statusDesc');
  const l = levels[levelIdx % levels.length];
  card.style.background  = l.color;
  card.style.borderColor = l.border;
  lvlEl.style.color      = l.textColor;
  lvlEl.style.textShadow = `0 0 20px ${l.textColor}80`;
  lvlEl.textContent      = l.level;
  dscEl.textContent      = l.desc;
  levelIdx++;
}

// ── CARD ANIMATION ──
function animateCards() {
  const cards = document.querySelectorAll('.card, .tip-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });
  cards.forEach(c => observer.observe(c));
}

// ══════════════════════════════════════
// ── LEAFLET MAP ──
// ══════════════════════════════════════

let map, activeLayers = { rain: true, flood: false, wind: false, thunder: false };
let rainLayer, floodLayer, windLayer, thunderLayer;

// Wilayah kecamatan Purwokerto + sekitar (polygon sederhana)
const rainZones = [
  {
    name: 'Sokaraja',
    color: '#ef4444',
    opacity: 0.45,
    level: 'EKSTREM',
    rain: '52mm',
    coords: [[-7.390,109.255],[-7.375,109.300],[-7.405,109.310],[-7.420,109.270],[-7.390,109.255]],
  },
  {
    name: 'Purwokerto Selatan',
    color: '#ef4444',
    opacity: 0.4,
    level: 'BERAT',
    rain: '45mm',
    coords: [[-7.425,109.220],[-7.440,109.245],[-7.455,109.230],[-7.445,109.205],[-7.425,109.220]],
  },
  {
    name: 'Rawalo',
    color: '#f97316',
    opacity: 0.38,
    level: 'BERAT',
    rain: '38mm',
    coords: [[-7.470,109.150],[-7.455,109.185],[-7.490,109.200],[-7.510,109.165],[-7.470,109.150]],
  },
  {
    name: 'Kalibagor',
    color: '#f97316',
    opacity: 0.35,
    level: 'SEDANG',
    rain: '32mm',
    coords: [[-7.410,109.270],[-7.395,109.310],[-7.430,109.330],[-7.450,109.295],[-7.410,109.270]],
  },
  {
    name: 'Purwokerto Timur',
    color: '#eab308',
    opacity: 0.32,
    level: 'SEDANG',
    rain: '24mm',
    coords: [[-7.400,109.245],[-7.390,109.265],[-7.415,109.280],[-7.430,109.255],[-7.400,109.245]],
  },
  {
    name: 'Banyumas Kota',
    color: '#eab308',
    opacity: 0.30,
    level: 'SEDANG',
    rain: '22mm',
    coords: [[-7.450,109.175],[-7.435,109.200],[-7.460,109.215],[-7.475,109.190],[-7.450,109.175]],
  },
  {
    name: 'Purwokerto Utara',
    color: '#22c55e',
    opacity: 0.25,
    level: 'RINGAN',
    rain: '12mm',
    coords: [[-7.380,109.220],[-7.365,109.250],[-7.395,109.260],[-7.410,109.230],[-7.380,109.220]],
  },
  {
    name: 'Baturraden',
    color: '#22c55e',
    opacity: 0.22,
    level: 'RINGAN',
    rain: '10mm',
    coords: [[-7.340,109.210],[-7.325,109.240],[-7.355,109.255],[-7.370,109.225],[-7.340,109.210]],
  },
  {
    name: 'Sumpiuh',
    color: '#eab308',
    opacity: 0.30,
    level: 'SEDANG',
    rain: '26mm',
    coords: [[-7.510,109.345],[-7.495,109.375],[-7.525,109.390],[-7.540,109.360],[-7.510,109.345]],
  },
];

// Titik banjir aktif
const floodPoints = [
  { lat:-7.4097, lng:109.2442, name:'Sungai Serayu — Sokaraja',       level:'BAHAYA',  info:'Tinggi: 8.5m, meluap 1.2m', color:'#ef4444' },
  { lat:-7.4321, lng:109.2301, name:'Jalan Gerilya — Pwt Selatan',     level:'BAHAYA',  info:'Genangan: 30cm, arus deras',  color:'#ef4444' },
  { lat:-7.4012, lng:109.2650, name:'Sungai Logawa — Kalibagor',       level:'WASPADA', info:'Tinggi: 6.2m, mendekati batas',color:'#f97316' },
  { lat:-7.4550, lng:109.1800, name:'Rawalo — Sungai Tajum',           level:'WASPADA', info:'Tinggi: 5.8m, siaga 2',       color:'#f97316' },
  { lat:-7.3900, lng:109.2300, name:'Purwokerto Utara — Drainase',     level:'SIAGA',   info:'Genangan: 10cm, terpantau',   color:'#eab308' },
];

// Titik petir
const thunderPoints = [
  { lat:-7.390, lng:109.255, name:'Deteksi Petir — Sokaraja',     info:'Frekuensi: 12x/jam', color:'#facc15' },
  { lat:-7.430, lng:109.220, name:'Deteksi Petir — Pwt Selatan',  info:'Frekuensi: 8x/jam',  color:'#facc15' },
  { lat:-7.465, lng:109.185, name:'Deteksi Petir — Rawalo',       info:'Frekuensi: 5x/jam',  color:'#facc15' },
];

// Wind zones
const windZones = [
  { name:'Sokaraja', color:'#8b5cf6', opacity:0.25, level:'45 km/h', coords:[[-7.390,109.255],[-7.375,109.300],[-7.405,109.310],[-7.420,109.270],[-7.390,109.255]] },
  { name:'Sumpiuh',  color:'#8b5cf6', opacity:0.20, level:'38 km/h', coords:[[-7.510,109.345],[-7.495,109.375],[-7.525,109.390],[-7.540,109.360],[-7.510,109.345]] },
];

function createPulseIcon(color) {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:20px;height:20px;">
        <div style="position:absolute;inset:0;background:${color};border-radius:50%;animation:markerPulse 1.5s ease-in-out infinite;opacity:0.4;"></div>
        <div style="position:absolute;inset:3px;background:${color};border-radius:50%;border:2px solid rgba(255,255,255,0.8);box-shadow:0 0 10px ${color};"></div>
      </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function createThunderIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="font-size:22px;line-height:1;filter:drop-shadow(0 0 6px #facc15);animation:markerPulse 0.8s ease-in-out infinite;">⚡</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function initMap() {
  // Center Purwokerto
  map = L.map('map', {
    center: [-7.4211, 109.2350],
    zoom: 12,
    zoomControl: true,
  });

  // Dark OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map);

  // Rain overlay layer group
  rainLayer = L.layerGroup();
  rainZones.forEach(zone => {
    const poly = L.polygon(zone.coords, {
      color: zone.color,
      fillColor: zone.color,
      fillOpacity: zone.opacity,
      weight: 1.5,
      opacity: 0.7,
    });
    poly.bindPopup(`
      <div class="popup-content">
        <div class="popup-title">🌧 ${zone.name}</div>
        <div class="popup-badge ${zone.level==='EKSTREM'||zone.level==='BERAT'?'red':zone.level==='SEDANG'?'orange':'blue'}">${zone.level}</div>
        <div class="popup-stat">Curah hujan: <span>${zone.rain}/jam</span></div>
      </div>
    `, { maxWidth: 200 });
    rainLayer.addLayer(poly);
  });
  rainLayer.addTo(map);

  // Flood marker layer group
  floodLayer = L.layerGroup();
  floodPoints.forEach(pt => {
    const marker = L.marker([pt.lat, pt.lng], { icon: createPulseIcon(pt.color) });
    marker.bindPopup(`
      <div class="popup-content">
        <div class="popup-title">🌊 ${pt.name}</div>
        <div class="popup-badge ${pt.level==='BAHAYA'?'red':pt.level==='WASPADA'?'orange':'yellow'}">${pt.level}</div>
        <div class="popup-stat">${pt.info}</div>
      </div>
    `, { maxWidth: 200 });
    floodLayer.addLayer(marker);
  });

  // Wind overlay
  windLayer = L.layerGroup();
  windZones.forEach(zone => {
    const poly = L.polygon(zone.coords, {
      color: zone.color,
      fillColor: zone.color,
      fillOpacity: zone.opacity,
      weight: 1,
      dashArray: '6,4',
    });
    poly.bindPopup(`
      <div class="popup-content">
        <div class="popup-title">💨 ${zone.name}</div>
        <div class="popup-badge blue">ANGIN KENCANG</div>
        <div class="popup-stat">Kecepatan: <span>${zone.level}</span></div>
      </div>
    `, { maxWidth: 200 });
    windLayer.addLayer(poly);
  });

  // Thunder markers
  thunderLayer = L.layerGroup();
  thunderPoints.forEach(pt => {
    const marker = L.marker([pt.lat, pt.lng], { icon: createThunderIcon() });
    marker.bindPopup(`
      <div class="popup-content">
        <div class="popup-title">${pt.name}</div>
        <div class="popup-badge yellow">PETIR AKTIF</div>
        <div class="popup-stat">${pt.info}</div>
      </div>
    `, { maxWidth: 200 });
    thunderLayer.addLayer(marker);
  });
}

function toggleLayer(name, btn) {
  const layerMap = { rain: rainLayer, flood: floodLayer, wind: windLayer, thunder: thunderLayer };
  const layer = layerMap[name];

  if (activeLayers[name]) {
    map.removeLayer(layer);
    activeLayers[name] = false;
    btn.classList.remove('active');
  } else {
    layer.addTo(map);
    activeLayers[name] = true;
    btn.classList.add('active');
  }
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  createRain();
  renderForecast();
  updateClock();
  animateCards();
  initMap();

  setInterval(updateClock, 1000);
  setInterval(simulateLiveData, 5000);
  setInterval(cycleStatus, 8000);
});
