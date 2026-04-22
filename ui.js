export function renderLists(players, myUid) { // Agregamos myUid aquí
    let arqueros = [];
    let jugadores = [];
    let suplentes = [];
    const arquerosValidos = ['pepe', 'franco', 'zadu'];

    players.forEach(p => {
        if (p.esSuplenteVoluntario) {
            suplentes.push(p);
            return;
        }

        let n = p.nombre.toLowerCase();
        if (arquerosValidos.includes(n)) {
            if (arqueros.length < 2) arqueros.push(p);
            else suplentes.push(p);
        } else {
            if (jugadores.length < 14) jugadores.push(p);
            else suplentes.push(p);
        }
    });

    // Renderizado de Titulares
    let htmlTitulares = '';
    for (let i = 1; i <= 16; i++) {
        let p = null;
        let isMe = false;
        let suffix = '';

        if (i === 1 || i === 2) {
            p = arqueros[i-1];
            suffix = ' 🧤';
        } else {
            p = jugadores[i-3];
        }

        if (p && p.id === myUid) isMe = true;

        htmlTitulares += `<li class="${isMe ? 'mi-nombre' : ''}">
            ${i}. ${p ? p.nombre + suffix : suffix || ''}
        </li>`;
    }
    document.getElementById('lista-titulares').innerHTML = htmlTitulares;

    // Renderizado de Suplentes
    let htmlSuplentes = '';
    if (suplentes.length === 0) {
        htmlSuplentes = '<li><i>Sin suplentes por ahora</i></li>';
    } else {
        suplentes.forEach((s, index) => {
            const isMe = s.id === myUid;
            let badge = s.esSuplenteVoluntario ? ' 🏃‍♂️' : '';
            htmlSuplentes += `<li class="${isMe ? 'mi-nombre' : ''}">
                ${index + 1}. ${s.nombre}${badge}
            </li>`;
        });
    }
    document.getElementById('lista-suplentes').innerHTML = htmlSuplentes;

    return {
        espacioJugadores: jugadores.length < 14,
        espacioArqueros: arqueros.length < 2
    };
}

export function updateButtonsVisibility(myPlayer, seDioDeBaja, hayEspacio, isLocked) {
    const btnBaja = document.getElementById('btn-baja');
    const btnSumarme = document.getElementById('btn-sumarme');
    const btnSumarmeSuplente = document.getElementById('btn-sumarme-suplente');
    const btnBajar = document.getElementById('btn-bajar-suplente');
    const btnSubir = document.getElementById('btn-subir-titular');
    const lockMessage = document.getElementById('lock-message');

    // Apagamos todos por defecto
    [btnBaja, btnSumarme, btnSumarmeSuplente, btnBajar, btnSubir].forEach(btn => btn.style.display = 'none');

    // Si está bloqueado por horario, mostramos el mensaje y cortamos acá (nadie toca nada)
    if (isLocked) {
        lockMessage.style.display = 'block';
        return; 
    } else {
        lockMessage.style.display = 'none';
    }

    if (myPlayer) {
        btnBaja.style.display = 'block';
        if (myPlayer.esSuplenteVoluntario) {
            if (hayEspacio) btnSubir.style.display = 'block';
        } else {
            btnBajar.style.display = 'block';
        }
    } else if (seDioDeBaja === 'true' || !localStorage.getItem('futbol_uid')) {
        // Si se bajó, O si es un usuario totalmente nuevo:
        if (hayEspacio) btnSumarme.style.display = 'block';
        btnSumarmeSuplente.style.display = 'block';
    }
}

export function showModal() {
    document.getElementById('modal-nombre').style.display = 'flex';
    document.getElementById('input-nombre').focus();
}

export function hideModal() {
    document.getElementById('modal-nombre').style.display = 'none';
}

export function showError(msg) {
    document.getElementById('error-nombre').innerText = msg;
}