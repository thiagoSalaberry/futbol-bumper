// ==========================================
// LÓGICA DE FECHAS
// ==========================================
export function getNextWednesday() {
    const d = new Date();
    const day = d.getDay();
    let daysUntilWed = (3 - day + 7) % 7;
    if (daysUntilWed === 0 && d.getHours() >= 22) daysUntilWed = 7;
    d.setDate(d.getDate() + daysUntilWed);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return { label: `${dd}/${mm}`, id: `${dd}_${mm}` };
}

// ==========================================
// ACCIONES Y FUNCIONES
// ==========================================
export async function guardarNombre() {
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

export async function confirmarBaja() {
    const confirmacion = confirm("¿Estás seguro de que querés darte de baja del partido?");
    if (confirmacion) {
        const uid = localStorage.getItem('futbol_uid');
        await remove(ref(db, `partidos/${matchId}/${uid}`));
        localStorage.setItem(`baja_${matchId}`, 'true'); 
        alert("Te has dado de baja. Si cambiás de opinión, podés volver a sumarte.");
    }
}

export async function volverASumarme() {
    const uid = localStorage.getItem('futbol_uid');
    const name = localStorage.getItem('futbol_name');
    localStorage.removeItem(`baja_${matchId}`);
    await set(ref(db, `partidos/${matchId}/${uid}`), {
        nombre: name,
        timestamp: Date.now()
    });
}

export async function autoRegister() {
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