// --- CONFIGURACIÓN DE SUPABASE ---
const supabaseUrl = 'https://pyurfviezihdfnxfgnxw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dXJmdmllemloZGZueGZnbnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTAwMzksImV4cCI6MjA3NDU2NjAzOX0.-0SeMLWmNPCk4i8qg0-tHhpftBj2DMH5t-bO87Cef2c';

// URL de tu Web App de Google Apps Script (GAS) para crear la carpeta de Drive
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbynqwAV6Uh9MUrWYPhLP9hHZoOkUnvIz2MVobRQcq1XXCSM5BAI4KhG_2DPY68hhhYJ/exec'; 

// FORZAR LA PERSISTENCIA DE SESIÓN
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        storage: window.localStorage,
    }
});

// --- ESTADO GLOBAL Y ELEMENTOS DEL DOM ---
const logoutButton = document.getElementById('logout-button');
const createMateriaForm = document.getElementById('create-materia-form');
const materiasGrid = document.getElementById('materias-grid');
const teacherNameElement = document.getElementById('teacher-name');

// --- LÓGICA DE INICIALIZACIÓN ---

function initializeDashboard(session) {
    const user = session.user;
    const displayName = user.user_metadata?.full_name || user.email;
    teacherNameElement.textContent = displayName;
    loadMaterias();
}


// --- MANEJO DE LA SESIÓN ---

supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
        initializeDashboard(session);
    } else {
        window.location.href = '/index.html';
    }
});


// --- LÓGICA DE EVENTOS DEL DOM ---

document.addEventListener('DOMContentLoaded', () => {
    // Configuración del botón de Cerrar Sesión
    logoutButton.addEventListener('click', async () => {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            console.error("Error al cerrar sesión:", error);
        }
    });

    // Configuración del formulario de Creación de Materia
    createMateriaForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // 1. Obtener datos del formulario
        const name = document.getElementById('name').value;
        const semester = document.getElementById('semester').value;
        const year = document.getElementById('year').value;
        const units = document.getElementById('units').value;

        // 2. Insertar en la base de datos
        // La columna user_id será llenada automáticamente por el DEFAULT auth.uid() en la DB.
        const { error } = await supabaseClient
            .from('materias')
            .insert({
                name: name,
                semester: semester,
                year: year,
                units: units
            });

        if (error) {
            console.error("Error al crear materia:", error);
            alert(`Error al crear la materia: ${error.message}`);
        } else {
            alert("¡Materia creada con éxito!");
            createMateriaForm.reset();
            loadMaterias();
        }
    });
});


// --- LÓGICA DE CARGA DE MATERIAS ---

async function loadMaterias() {
    // La política RLS (auth.uid() = user_id) asegura que solo se carguen las materias del usuario.
    const { data: materias, error } = await supabaseClient
        .from('materias')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error al cargar materias:", error);
        return;
    }

    materiasGrid.innerHTML = '';

    materias.forEach(materia => {
        const cardLink = document.createElement('a');
        cardLink.href = `materia.html?id=${materia.id}`;
        cardLink.classList.add('materia-card-link');

        if (materia.is_suspended) {
            cardLink.classList.add('suspended');
        }

        cardLink.innerHTML = `
            <h3>${materia.name}</h3>
            <p><strong>Semestre:</strong> ${materia.semester || 'No especificado'}</p>
            <p><strong>Año:</strong> ${materia.year || 'No especificado'}</p>
        `;
        materiasGrid.appendChild(cardLink);
    });
}