// --- CONFIGURACIÓN DE SUPABASE ---
const supabaseUrl = 'https://pyurfviezihdfnxfgnxw.supabase.co'; // Reemplaza con tu URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dXJmdmllemloZGZueGZnbnd4dyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjg4NzI0NTc0LCJleHAiOjE5MDQyODQ1NzR9.Dl8jv1kYk3jX1KXoX1m8n2rQZ2p6kU1iU5rXH3b7m0';     // Reemplaza con tu Anon Key
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
const SETUP_DRIVE_FUNCTION_URL = 'https://pyurfviezihdfnxfgnxw.supabase.co/functions/v1/setup-drive-folder';

// --- ELEMENTOS DEL DOM (SIN CAMBIOS) ---
const logoutButton = document.getElementById('logout-button');
const createMateriaForm = document.getElementById('create-materia-form');
const materiasGrid = document.getElementById('materias-grid');
const teacherNameElement = document.getElementById('teacher-name');

// --- FUNCIONES AUXILIARES DE DRIVE (SIN CAMBIOS) ---

/**
 * Llama a la Edge Function para crear la carpeta raíz en Google Drive.
 * @param {Object} session - El objeto de sesión de Supabase.
 */
async function setupUserDrive(session) {
    // ... (El cuerpo de la función setupUserDrive permanece igual)
    const googleAccessToken = session.provider_token;
    console.log("Intento de configuración de Drive. Token de Google (provider_token) presente:", !!googleAccessToken); 

    if (!googleAccessToken) {
        console.warn("No se encontró el token de acceso de Google. No se puede configurar Drive.");
        return;
    }

    try {
        const response = await fetch(SETUP_DRIVE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${googleAccessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Error del servidor: ${response.status}`);
        }

        console.log("✅ RESPUESTA EXITOSA DE LA FUNCIÓN setupDrive:", data);
        
    } catch (error) {
        console.error("❌ ERROR AL LLAMAR A LA FUNCIÓN setupDrive:", error.message);
    }
}


// --- MANEJO DE LA SESIÓN (CORRECCIÓN FINAL: USANDO LISTENER) ---

function initializeDashboard(session) {
    const user = session.user;
    const displayName = user.user_metadata?.full_name || user.email;
    teacherNameElement.textContent = displayName;

    // Lógica para configurar Drive
    const isGoogleUser = user.app_metadata.provider === 'google';
    const hasProviderToken = session.provider_token; // Solo está presente en el login inicial
    
    console.log(`Debug de sesión: esGoogleUser=${isGoogleUser}, tieneProviderToken=${!!hasProviderToken}`);

    if (isGoogleUser && hasProviderToken) {
        console.log("Detectado inicio de sesión de Google. Configurando Drive...");
        setupUserDrive(session);
    } else {
        console.warn("No se llama a setupDrive. (Token de Drive no presente en la sesión)");
    }

    loadMaterias();
}

// Escucha los cambios de estado de autenticación (evento clave después de OAuth)
supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log(`Evento de Auth: ${event}`);
    
    if (session) {
        // Ejecuta la inicialización solo en los estados clave de inicio de sesión
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            initializeDashboard(session);
        }
    } else {
        // Si el evento es SIGNED_OUT, redirigir al login
        window.location.href = '/index.html';
    }
});


// --- Listeners y Funciones Auxiliares (Permanecen fuera del listener) ---

document.addEventListener('DOMContentLoaded', async () => {
    // El código aquí solo establece los listeners del DOM, la inicialización
    // se hace en onAuthStateChange para evitar la carrera.
    
    // Este código es solo para usuarios que ya tienen sesión activa en Local Storage
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        initializeDashboard(session);
    }
    
    logoutButton.addEventListener('click', async () => {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            console.error("Error al cerrar sesión:", error);
        } // La redirección se maneja en onAuthStateChange
    });

    createMateriaForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        // ... (Tu lógica de creación de materia)
        const name = document.getElementById('name').value;
        const semester = document.getElementById('semester').value;
        const year = document.getElementById('year').value;
        const units = document.getElementById('units').value;

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
            alert(`Error al crear la materia: ${error.message || 'Verifica la consola para más detalles.'}`);
        } else {
            createMateriaForm.reset();
            loadMaterias();
        }
    });
});


// --- LÓGICA DE MATERIAS (SIN CAMBIOS) ---

async function loadMaterias() {
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