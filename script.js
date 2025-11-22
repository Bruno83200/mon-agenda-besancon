/* 
   Fichier : script.js
   Correction : Version propre et vérifiée
*/

console.log("Le script démarre bien !"); // Vérification dans la console (F12)

// ==========================================
// 1. DATE ET HEURE
// ==========================================
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    };
    const dateEl = document.getElementById('dateTime');
    if(dateEl) {
        dateEl.textContent = now.toLocaleDateString('fr-FR', options);
    }
}
// On lance la date tout de suite
updateDateTime();
setInterval(updateDateTime, 60000);


// ==========================================
// 2. CITATION DU JOUR
// ==========================================
const quotes = [
    { text: "La vie, c'est comme une bicyclette, il faut avancer pour ne pas perdre l'équilibre.", author: "Albert Einstein" },
    { text: "Le bonheur n'est pas chose aisée. Il est très difficile de le trouver en nous, il est impossible de le trouver ailleurs.", author: "Bouddha" },
    { text: "Il faut toujours viser la lune, car même en cas d'échec, on atterrit dans les étoiles.", author: "Oscar Wilde" },
    { text: "Le succès n'est pas la clé du bonheur. Le bonheur est la clé du succès.", author: "Albert Schweitzer" },
    { text: "La seule façon de faire du bon travail est d'aimer ce que vous faites.", author: "Steve Jobs" },
    { text: "On ne voit bien qu'avec le cœur. L'essentiel est invisible pour les yeux.", author: "Antoine de Saint-Exupéry" },
    { text: "Rien ne sert de courir, il faut partir à point.", author: "Jean de La Fontaine" }
];

function displayDailyQuote() {
    const quoteContainer = document.getElementById('dailyQuote');
    if (!quoteContainer) return;
    
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    const index = dayOfYear % quotes.length;
    const quote = quotes[index];

    quoteContainer.innerHTML = `
        <span class="quote-text">« ${quote.text} »</span>
        <span class="quote-author">- ${quote.author}</span>
    `;
}
displayDailyQuote();


// ==========================================
// 3. FLUX RSS (ACTUS & HOROSCOPE)
// ==========================================
async function loadRSS(url, containerID, isHoroscope = false) {
    const container = document.getElementById(containerID);
    if (!container) return;

    // Utilisation de RSS2JSON pour lire les flux facilement
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.status !== 'ok' || !data.items) throw new Error('Erreur API');

        let html = '';
        const limit = isHoroscope ? 1 : 4; 

        data.items.forEach((item, index) => {
            if (index < limit) {
                const title = item.title;
                const link = item.link;
                let description = item.description || item.content || '';
                const pubDate = item.pubDate;

                // Nettoyage basique du texte pour éviter les images géantes
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = description;
                // On enlève les images du flux pour garder le design propre
                const images = tempDiv.querySelectorAll('img');
                images.forEach(img => img.remove());
                
                let cleanDesc = tempDiv.textContent || tempDiv.innerText || '';
                const maxLength = isHoroscope ? 300 : 120;
                
                if (cleanDesc.length > maxLength) {
                    cleanDesc = cleanDesc.substring(0, maxLength) + '...';
                }

                let dateHtml = '';
                if (!isHoroscope && pubDate) {
                    // Gestion de la date pour safari/chrome
                    const safeDate = pubDate.replace(/-/g, '/'); 
                    const d = new Date(safeDate);
                    const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour:'2-digit', minute:'2-digit' });
                    dateHtml = `<div class="rss-date">${dateStr}</div>`;
                }

                html += `
                    <div class="rss-item">
                        <h3><a href="${link}" target="_blank">${title}</a></h3>
                        ${dateHtml}
                        <div class="rss-description">${cleanDesc}</div>
                    </div>
                `;
            }
        });
        container.innerHTML = html;
    } catch (error) {
        console.error(`Erreur pour ${containerID}:`, error);
        container.innerHTML = `<div class="error">Flux indisponible.</div>`;
    }
}


// ==========================================
// 4. MÉTÉO & SOLEIL
// ==========================================
async function loadWeather() {
    const container = document.getElementById('weatherContent');
    const ephemEl = document.getElementById('ephemeris');
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=47.2378&longitude=6.0241&current_weather=true&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto';

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (!data.current_weather) throw new Error('Pas de données météo');

        const current = data.current_weather;
        const daily = data.daily; 

        const weatherCodes = {
            0: { icon: '☀️', text: 'Ensoleillé' }, 1: { icon: '🌤️', text: 'Peu nuageux' },
            2: { icon: '⛅', text: 'Partiellement nuageux' }, 3: { icon: '☁️', text: 'Nuageux' },
            45: { icon: '🌫️', text: 'Brouillard' }, 61: { icon: '🌧️', text: 'Pluie' },
            63: { icon: '🌧️', text: 'Pluie' }, 95: { icon: '⛈️', text: 'Orage' }
        };

        const code = current.weathercode;
        const weatherInfo = weatherCodes[code] || { icon: '❓', text: 'Variable' };
        
        container.innerHTML = `
            <div class="weather-main">
                <span class="weather-icon">${weatherInfo.icon}</span>
                <div class="weather-temp">${Math.round(current.temperature)}°C</div>
                <div class="weather-desc">${weatherInfo.text}</div>
            </div>
            <div class="weather-details">
                <div class="weather-detail-item">Min <br><b>${Math.round(daily.temperature_2m_min[0])}°C</b></div>
                <div class="weather-detail-item">Vent <br><b>${Math.round(current.windspeed)} km/h</b></div>
                <div class="weather-detail-item">Max <br><b>${Math.round(daily.temperature_2m_max[0])}°C</b></div>
            </div>
        `;

        if (daily.sunrise && daily.sunset) {
            const sunrise = daily.sunrise[0].split('T')[1];
            const sunset = daily.sunset[0].split('T')[1];
            if(ephemEl) ephemEl.innerHTML = `☀️ Lever : ${sunrise} &nbsp;&nbsp;|&nbsp;&nbsp; 🌙 Coucher : ${sunset}`;
        }
    } catch (error) {
        if(container) container.innerHTML = '<div class="error">Météo indisponible</div>';
    }
}


// ==========================================
// 5. INITIALISATION (Lancement de tout)
// ==========================================
function initAll() {
    // Actus
    loadRSS('https://www.macommune.info/?feed=actualite-une', 'rssUneContent', false);
    loadRSS('https://www.macommune.info/?feed=actualite-loisirs', 'rssLoisirsContent', false);
    
    // Horoscopes
    loadRSS('https://www.mon-horoscope-du-jour.com/rss/rss_capricorne.php', 'horoCapricorne', true);
    loadRSS('https://www.mon-horoscope-du-jour.com/rss/rss_taureau.php', 'horoTaureau', true);
    loadRSS('https://www.mon-horoscope-du-jour.com/rss/rss_sagittaire.php', 'horoSagittaire', true);
    
    // Météo
    loadWeather();
}

// On lance tout immédiatement
initAll();
// On rafraîchit toutes les 15 minutes
setInterval(initAll, 900000);


// ==========================================
// 6. BLOC-NOTES
// ==========================================
const noteArea = document.getElementById('myNotes');
if(noteArea) {
    const savedNote = localStorage.getItem('monAgendaNote');
    if(savedNote) noteArea.value = savedNote;
    noteArea.addEventListener('input', () => {
        localStorage.setItem('monAgendaNote', noteArea.value);
    });
}


// ==========================================
// 7. RADIO
// ==========================================
const radioPlayer = document.getElementById('radioPlayer');
const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const statusText = document.getElementById('statusText');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
let isPlaying = false;
let currentQuality = 'midfi';

// Liens des flux audio
const streams = {
    midfi: 'https://icecast.radiofrance.fr/fbbesancon-midfi.mp3',
    hifi: 'https://icecast.radiofrance.fr/fbbesancon-hifi.aac'
};

if (radioPlayer) radioPlayer.volume = 0.7;

function togglePlay() {
    if (isPlaying) stopRadio();
    else playRadio();
}

function playRadio() {
    if (!radioPlayer.src || radioPlayer.src === '') {
        radioPlayer.src = streams[currentQuality];
    }
    radioPlayer.play().then(() => {
        isPlaying = true;
        playIcon.textContent = '⏸️';
        playBtn.classList.add('playing');
        statusText.textContent = '🎵 En direct : France Bleu';
    }).catch(err => {
        console.error("Erreur radio", err);
        statusText.textContent = '❌ Erreur de connexion';
    });
}

function stopRadio() {
    radioPlayer.pause();
    radioPlayer.src = ''; 
    isPlaying = false;
    playIcon.textContent = '▶️';
    playBtn.classList.remove('playing');
    statusText.textContent = '⏹️ Radio arrêtée';
}

function changeStream(quality) {
    currentQuality = quality;
    document.querySelectorAll('.stream-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    
    // Si la radio joue, on la redémarre avec la nouvelle qualité
    if (isPlaying) {
        stopRadio();
        setTimeout(playRadio, 500);
    }
}

if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        radioPlayer.volume = val / 100;
        volumeValue.textContent = val + '%';
    });
}