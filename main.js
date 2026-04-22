import { addPlayer, removePlayer, checkPlayerExists, checkNameInUse, listenToMatch } from './api.js';
import { renderLists, updateButtonsVisibility, showModal, hideModal, showError } from './ui.js';

// ==========================================
// 1. CONFIGURACIÓN DE FECHAS (LUNES A DOMINGO)
// ==========================================
const now = new Date();
const dayOfWeek = now.getDay(); // 0 es Domingo, 1 es Lunes...

// Si hoy es Domingo (0), restamos 6 días para llegar al Lunes. 
// Si es Lunes a Sábado, restamos la diferencia.
const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

const thisMonday = new Date(now);
thisMonday.setDate(now.getDate() + daysToMonday);

// El partido es el Miércoles (+2 días desde el Lunes)
const thisWednesday = new Date(thisMonday);
thisWednesday.setDate(thisMonday.getDate() + 2);

const dd = String(thisWednesday.getDate()).padStart(2, '0');
const mm = String(thisWednesday.getMonth() + 1).padStart(2, '0');
const yyyy = thisWednesday.getFullYear();

const matchId = `partido_${dd}_${mm}_${yyyy}`;
document.getElementById('fecha-label').innerText = `${dd}/${mm}`;

// Generamos un hash a partir de la fecha para obtener un minuto "random" 
// pero idéntico y predecible en todos los celulares (0 a 59)
function getSeededRandomMinute(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 60; 
}

const openingMinute = getSeededRandomMinute(matchId);

// Evaluamos en tiempo real si el sistema está bloqueado
function checkIsLocked() {
    const currentTime = new Date();
    if (currentTime.getDay() === 1) { // Solo bloqueamos los Lunes
        const hour = currentTime.getHours();
        const min = currentTime.getMinutes();
        if (hour < 9) return true; // Antes de las 09:00
        if (hour === 9 && min < openingMinute) return true; // Entre las 09:00 y el minuto secreto
    }
    return false;
}

// ==========================================
// 2. ORQUESTACIÓN DE ACCIONES
// ==========================================
async function handleGuardarNombre(esSuplente = false) {
    if (checkIsLocked()) {
        alert(`Las inscripciones de hoy abren exactamente a las 09:${String(openingMinute).padStart(2, '0')} hs.`);
        return;
    }
    
    const input = document.getElementById('input-nombre');
    let name = input.value.trim();

    if (name === '') {
        showError("¡Tenés que poner un nombre!");
        return;
    }

    const nameExists = await checkNameInUse(matchId, name);
    if (nameExists) {
        showError("Ya hay alguien anotado con ese nombre. ¡Agregale un apodo o tu apellido!");
        return;
    }

    let uid = 'jugador_' + Date.now() + Math.random().toString(36).substr(2, 5);
    localStorage.setItem('futbol_uid', uid);
    localStorage.setItem('futbol_name', name);
    
    hideModal();
    await addPlayer(matchId, uid, name, esSuplente);
}

async function handleConfirmarBaja() {
    if (checkIsLocked()) return;
    if (confirm("¿Estás seguro de que querés darte de baja del partido?")) {
        const uid = localStorage.getItem('futbol_uid');
        await removePlayer(matchId, uid);
        localStorage.setItem(`baja_${matchId}`, 'true'); 
        alert("Te has dado de baja.");
    }
}

async function handleVolverASumarme(esSuplente = false) {
    if (checkIsLocked()) return;
    const uid = localStorage.getItem('futbol_uid');
    
    // Si no tiene UID, significa que esperó con la app abierta a que se desbloquee. Le mostramos el modal.
    if (!uid) {
        showModal();
        return;
    }

    const name = localStorage.getItem('futbol_name');
    localStorage.removeItem(`baja_${matchId}`);
    await addPlayer(matchId, uid, name, esSuplente);
}

async function checkAutoRegister() {
    if (checkIsLocked()) return; 

    let uid = localStorage.getItem('futbol_uid');
    let name = localStorage.getItem('futbol_name');

    if (!name || !uid) {
        showModal();
        return; 
    }

    const seDioDeBaja = localStorage.getItem(`baja_${matchId}`);
    if (seDioDeBaja !== 'true') {
        const isRegistered = await checkPlayerExists(matchId, uid);
        if (!isRegistered) {
            await addPlayer(matchId, uid, name, false);
        }
    }
}

// ==========================================
// 3. TIEMPO REAL Y EVENTOS
// ==========================================
let currentPlayers = []; 

listenToMatch(matchId, (players) => {
    currentPlayers = players;
    actualizarPantalla();
});

function actualizarPantalla() {
    const isLocked = checkIsLocked();
    const myUid = localStorage.getItem('futbol_uid');
    const myName = localStorage.getItem('futbol_name') || '';
    const seDioDeBaja = localStorage.getItem(`baja_${matchId}`);
    
    const myPlayer = currentPlayers.find(p => p.id === myUid);
    const { espacioJugadores, espacioArqueros } = renderLists(currentPlayers, myUid); // Pasamos myUid

    const isArquero = ['pepe', 'franco', 'zadu'].includes(myName.toLowerCase());
    const hayEspacio = isArquero ? espacioArqueros : espacioJugadores;

    updateButtonsVisibility(myPlayer, seDioDeBaja, hayEspacio, isLocked);
}

// Reloj interno: Chequea la hora cada 5 segundos por si se llegó al minuto de apertura
setInterval(actualizarPantalla, 5000);

// Asignación de listeners
document.getElementById('btn-guardar-nombre').addEventListener('click', () => handleGuardarNombre(false));
document.getElementById('btn-guardar-suplente').addEventListener('click', () => handleGuardarNombre(true));

document.getElementById('btn-baja').addEventListener('click', handleConfirmarBaja);
document.getElementById('btn-sumarme').addEventListener('click', () => handleVolverASumarme(false));
document.getElementById('btn-sumarme-suplente').addEventListener('click', () => handleVolverASumarme(true));
document.getElementById('btn-bajar-suplente').addEventListener('click', () => handleVolverASumarme(true));
document.getElementById('btn-subir-titular').addEventListener('click', () => handleVolverASumarme(false));

document.getElementById('input-nombre').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleGuardarNombre(false);
});

// Arranque
checkAutoRegister();