import { ref, set, get, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { db } from "./firebase.js";

export async function addPlayer(matchId, uid, name, esSuplenteVoluntario = false) {
    await set(ref(db, `partidos/${matchId}/${uid}`), {
        nombre: name,
        timestamp: Date.now(),
        esSuplenteVoluntario: esSuplenteVoluntario
    });
}

export async function removePlayer(matchId, uid) {
    await remove(ref(db, `partidos/${matchId}/${uid}`));
}

export async function checkPlayerExists(matchId, uid) {
    const snapshot = await get(ref(db, `partidos/${matchId}/${uid}`));
    return snapshot.exists();
}

export async function checkNameInUse(matchId, name) {
    const snapshot = await get(ref(db, `partidos/${matchId}`));
    const data = snapshot.val();
    if (!data) return false;

    const nombreIngresado = name.toLowerCase();
    return Object.values(data).some(p => p.nombre.toLowerCase() === nombreIngresado);
}

export function listenToMatch(matchId, callback) {
    onValue(ref(db, `partidos/${matchId}`), (snapshot) => {
        const data = snapshot.val();
        let players = [];
        if (data) {
            for (let key in data) {
                players.push({ id: key, ...data[key] });
            }
            players.sort((a, b) => a.timestamp - b.timestamp);
        }
        callback(players);
    });
}