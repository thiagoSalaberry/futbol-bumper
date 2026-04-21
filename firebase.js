import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCgdElL7rXE9IPoJ1L0gRodBhpxrKDyA4Q",
    authDomain: "futbol-bumper.firebaseapp.com",
    databaseURL: "https://futbol-bumper-default-rtdb.firebaseio.com",
    projectId: "futbol-bumper",
    storageBucket: "futbol-bumper.firebasestorage.app",
    messagingSenderId: "143778628269",
    appId: "1:143778628269:web:639c409695c9c116e7bc24",
    measurementId: "G-LCZ09GYXFG"
};

const app = initializeApp(firebaseConfig);

// Exportamos la base de datos para usarla en main.js
export const db = getDatabase(app);