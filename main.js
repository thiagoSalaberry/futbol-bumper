import { ref, set, get, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { db } from "./firebase.js";

// ==========================================
// LÓGICA DE FECHAS
// ==========================================
function getNextWednesday() {
    const d = new Date();
    const day = d.getDay();
    let daysUntilWed = (3 - day + 7) % 7;
    if (daysUntilWed === 0 && d.getHours() >= 22) daysUntilWed = 7;
    d.setDate(d.getDate() + daysUntilWed);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return { label: `${dd}/${mm}`, id: `${dd}_${mm}` };
}

const fechaPartido = getNextWednesday();
document.getElementById('fecha-label').innerText = fechaPartido.label;
const matchId = `partido_${fechaPartido.id}`;

// ==========================================
// ACCIONES Y FUNCIONES
// ==========================================
async function guardarNombre() {
    const input = document.getElementById('input-nombre');
    const errorP = document.getElementById('error-nombre');
    let name = input.value.trim();

    if (name === '') {
        errorP.innerText = "¡Tenés que poner un nombre!";
        return;
    }

    const snapshot = await get(ref(db, `partidos/${matchId}`));
    const data = snapshot.val();
    let nameExists = false;
    
    if (data) {
        const nombreIngresado = name.toLowerCase();
        for (let key in data) {
            if (data[key].nombre.toLowerCase() === nombreIngresado) {
                nameExists = true;
                break;
            }
        }
    }

    if (nameExists) {
        errorP.innerText = "Ya hay alguien anotado con ese nombre. ¡Agregale un apodo o tu apellido!";
        return;
    }

    let uid = 'jugador_' + Date.now() + Math.random().toString(36).substr(2, 5);
    localStorage.setItem('futbol_uid', uid);
    localStorage.setItem('futbol_name', name);
    
    document.getElementById('modal-nombre').style.display = 'none';
    
    await set(ref(db, `partidos/${matchId}/${uid}`), {
        nombre: name,
        timestamp: Date.now()
    });
}

async function confirmarBaja() {
    const confirmacion = confirm("¿Estás seguro de que querés darte de baja del partido?");
    if (confirmacion) {
        const uid = localStorage.getItem('futbol_uid');
        await remove(ref(db, `partidos/${matchId}/${uid}`));
        localStorage.setItem(`baja_${matchId}`, 'true'); 
        alert("Te has dado de baja. Si cambiás de opinión, podés volver a sumarte.");
    }
}

async function volverASumarme() {
    const uid = localStorage.getItem('futbol_uid');
    const name = localStorage.getItem('futbol_name');
    localStorage.removeItem(`baja_${matchId}`);
    await set(ref(db, `partidos/${matchId}/${uid}`), {
        nombre: name,
        timestamp: Date.now()
    });
}

async function autoRegister() {
    let uid = localStorage.getItem('futbol_uid');
    let name = localStorage.getItem('futbol_name');

    if (!name || !uid) {
        document.getElementById('modal-nombre').style.display = 'flex';
        document.getElementById('input-nombre').focus();
        return; 
    }

    const seDioDeBaja = localStorage.getItem(`baja_${matchId}`);
    const playerRef = ref(db, `partidos/${matchId}/${uid}`);
    const snapshot = await get(playerRef);
    
    if (!snapshot.exists() && seDioDeBaja !== 'true') {
        await set(playerRef, {
            nombre: name.trim(),
            timestamp: Date.now()
        });
    }
}

// ==========================================
// RENDERIZADO EN TIEMPO REAL
// ==========================================
const matchRef = ref(db, `partidos/${matchId}`);
onValue(matchRef, (snapshot) => {
    const data = snapshot.val();
    let players = [];
    
    if (data) {
        for (let key in data) {
            players.push({ id: key, ...data[key] });
        }
        players.sort((a, b) => a.timestamp - b.timestamp);
    }

    const myUid = localStorage.getItem('futbol_uid');
    const isMeRegistered = players.some(p => p.id === myUid);
    const seDioDeBaja = localStorage.getItem(`baja_${matchId}`);

    if (isMeRegistered) {
        document.getElementById('btn-baja').style.display = 'block';
        document.getElementById('btn-sumarme').style.display = 'none';
    } else if (seDioDeBaja === 'true') {
        document.getElementById('btn-baja').style.display = 'none';
        document.getElementById('btn-sumarme').style.display = 'block';
    } else {
        document.getElementById('btn-baja').style.display = 'none';
        document.getElementById('btn-sumarme').style.display = 'none';
    }

    let arqueros = [];
    let jugadores = [];
    let suplentes = [];
    const arquerosValidos = ['pepe', 'franco', 'zadu'];

    players.forEach(p => {
        let n = p.nombre.toLowerCase();
        if (arquerosValidos.includes(n)) {
            if (arqueros.length < 2) arqueros.push(p);
            else suplentes.push(p);
        } else {
            if (jugadores.length < 14) jugadores.push(p);
            else suplentes.push(p);
        }
    });

    let htmlTitulares = '';
    for (let i = 1; i <= 16; i++) {
        if (i === 1 || i === 2) {
            let arq = arqueros[i-1];
            htmlTitulares += `<li>${i}. ${arq ? arq.nombre + ' 🧤' : '🧤'}</li>`;
        } else {
            let jug = jugadores[i-3];
            htmlTitulares += `<li>${i}. ${jug ? jug.nombre : ''}</li>`;
        }
    }
    document.getElementById('lista-titulares').innerHTML = htmlTitulares;

    let htmlSuplentes = '';
    if (suplentes.length === 0) {
        htmlSuplentes = '<li><i>Sin suplentes por ahora</i></li>';
    } else {
        suplentes.forEach((s, index) => {
            htmlSuplentes += `<li>${index + 1}. ${s.nombre}</li>`;
        });
    }
    document.getElementById('lista-suplentes').innerHTML = htmlSuplentes;
});

// ==========================================
// ASIGNACIÓN DE EVENTOS (LISTENERS)
// ==========================================
document.getElementById('btn-guardar-nombre').addEventListener('click', guardarNombre);
document.getElementById('btn-baja').addEventListener('click', confirmarBaja);
document.getElementById('btn-sumarme').addEventListener('click', volverASumarme);

document.getElementById('input-nombre').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        guardarNombre();
    }
});

// Ejecutamos el registro al entrar
autoRegister();