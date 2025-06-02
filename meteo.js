/**
 * Application Météo pour Transports en Commun
 * 
 * Ce script charge la configuration depuis un fichier conf.json externe,
 * récupère les données météo depuis l'API OpenWeatherMap et les affiche.
 */

// Variables globales pour stocker les éléments du DOM
const elements = {
    city: document.getElementById('weather-city'),
    temperature: document.getElementById('weather-temp'),
    description: document.getElementById('weather-desc'),
    humidity: document.getElementById('weather-humidity'),
    wind: document.getElementById('weather-wind'),
    icon: document.getElementById('weather-icon'),
    lastUpdate: document.getElementById('last-update'),
    weatherContainer: document.getElementById('weather-container'),
    errorContainer: document.getElementById('error-container')
};

// Configuration par défaut (utilisée en cas d'échec du chargement du fichier conf.json)
let config = {
    city: "Montpellier,FR", // Ville par défaut
    updateInterval: 3600000, // 1 heure en millisecondes
    units: "metric",
    lang: "fr",
    apiKey: "" // Sera chargé depuis conf.json
};

/**
 * Charge le fichier de configuration conf.json
 * @returns {Promise} Une promesse résolue avec la configuration chargée
 */
async function loadConfig() {
    try {
        console.log("Chargement du fichier de configuration...");
        
        const response = await fetch('conf.json');
        
        if (!response.ok) {
            throw new Error(`Erreur lors du chargement de la configuration: ${response.status}`);
        }
        
        const loadedConfig = await response.json();
        
        // Fusion de la configuration chargée avec les valeurs par défaut
        config = {
            ...config, // Garde les valeurs par défaut pour les propriétés manquantes
            ...loadedConfig // Écrase avec les valeurs du fichier de configuration
        };
        
        console.log("Configuration chargée avec succès:", config);
        return config;
    } catch (error) {
        console.error("Erreur lors du chargement de la configuration:", error);
        console.warn("Utilisation des paramètres par défaut");
        return config; // Retourne la configuration par défaut en cas d'erreur
    }
}

/**
 * Récupère les données météo depuis l'API OpenWeatherMap
 * @returns {Promise} Une promesse résolue avec les données météo
 */
async function getWeatherData() {
    try {
        showLoading();
        hideError();
        
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${config.city}&units=${config.units}&lang=${config.lang}&appid=${config.apiKey}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`La ville "${config.city}" n'a pas été trouvée`);
            }
            throw new Error(`Erreur API: ${response.status}`);
        }
        
        const data = await response.json();
        displayWeather(data);
        return true;
    } catch (error) {
        console.error("Erreur:", error);
        displayError(`Impossible de récupérer les données météo: ${error.message}`);
        return false;
    } finally {
        hideLoading();
    }
}

/**
 * Affiche les données météo dans l'interface utilisateur
 * @param {Object} data Les données météo reçues de l'API
 */
function displayWeather(data) {
    const { 
        name: city,
        main: { temp, humidity },
        weather: [{ description, icon }],
        wind: { speed },
        sys: { country }
    } = data;
    
    elements.weatherContainer.classList.remove('hidden');
    elements.city.textContent = `${city}, ${country}`;
    elements.temperature.textContent = `${Math.round(temp)}°C`;
    elements.description.textContent = description;
    elements.humidity.textContent = `Humidité: ${humidity}%`;
    elements.wind.textContent = `Vent: ${speed} m/s`;
    elements.icon.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    elements.icon.alt = description;
    
    const now = new Date();
    elements.lastUpdate.textContent = `Dernière mise à jour: ${now.toLocaleTimeString()}`;
}

/**
 * Affiche un message d'erreur dans l'interface
 * @param {string} message Le message d'erreur à afficher
 */
function displayError(message) {
    elements.weatherContainer.classList.add('hidden');
    elements.errorContainer.textContent = message;
    elements.errorContainer.classList.remove('hidden');
}

/**
 * Masque le message d'erreur
 */
function hideError() {
    elements.errorContainer.classList.add('hidden');
}

/**
 * Affiche un indicateur de chargement
 */
function showLoading() {
    elements.weatherContainer.classList.add('loading');
}

/**
 * Masque l'indicateur de chargement
 */
function hideLoading() {
    elements.weatherContainer.classList.remove('loading');
}

/**
 * Configure la mise à jour périodique des données météo
 */
function setupPeriodicUpdate() {
    setInterval(getWeatherData, config.updateInterval);
    console.log(`Mise à jour configurée toutes les ${config.updateInterval/1000} secondes`);
}

/**
 * Initialise l'application
 * - Charge la configuration depuis conf.json
 * - Récupère et affiche les données météo
 * - Configure la mise à jour périodique
 */
async function initApp() {
    try {
        // Charge la configuration depuis conf.json
        await loadConfig();
        
        // Récupère et affiche les données météo
        await getWeatherData();
        
        // Configure la mise à jour périodique
        setupPeriodicUpdate();
        
        console.log("Application initialisée avec succès");
    } catch (error) {
        console.error("Erreur lors de l'initialisation:", error);
        displayError("Erreur lors de l'initialisation de l'application");
    }
}

// Initialisation de l'application au chargement du document
document.addEventListener('DOMContentLoaded', initApp);
