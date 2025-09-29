// --- CONFIGURACIÓN DE SUPABASE ---
const supabaseUrl = 'https://pyurfviezihdfnxfgnxw.supabase.co'; // Reemplaza con tu URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dXJmdmllemloZGZueGZnbnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTAwMzksImV4cCI6MjA3NDU2NjAzOX0.-0SeMLWmNPCk4i8qg0-tHhpftBj2DMH5t-bO87Cef2c';     

// FORZAR LA PERSISTENCIA DE SESIÓN
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        storage: window.localStorage, 
    }
});

const SETUP_DRIVE_FUNCTION_URL = 'https://pyurfviezihdfnxfgnxw.supabase.co/functions/v1/setup-drive-folder'; 

// --- ESTADO GLOBAL Y ELEMENTOS DEL DOM ---
const logoutButton = document.getElementById('logout-button');
const createMateriaForm = document.getElementById('create-materia-form');
const materiasGrid = document.getElementById('materias-grid');
const teacherNameElement = document.getElementById('teacher-name');

let isDashboardInitialized = false; 

// --- FUNCIONES AUXILIARES DE DRIVE ---

async function setupUserDrive(session) {
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


// --- LÓGICA DE INICIALIZACIÓN ---

function initializeDashboard(session) {
    if (isDashboardInitialized) return; 
    
    const user = session.user;
    const displayName = user.user_metadata?.full_name || user.email;
    teacherNameElement.textContent = displayName;

    const isGoogleUser = user.app_metadata.provider === 'google';
    const hasProviderToken = session.provider_token; 
    
    console.log(`Debug de sesión: esGoogleUser=${isGoogleUser}, tieneProviderToken=${!!hasProviderToken}`);

    if (isGoogleUser && hasProviderToken) {
        console.log("Detectado inicio de sesión de Google. Configurando Drive...");
        setupUserDrive(session);
    } else {
        console.warn("No se llama a setupDrive. (Token de Drive no presente en la sesión)");
    }

    loadMaterias();
    isDashboardInitialized = true; 
}


// --- MANEJO DE LA SESIÓN: LISTENER CRÍTICO CORREGIDO ---

supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log(`Evento de Auth: ${event}, Sesión: ${!!session}`);

    if (session) {
        // La sesión es válida (SIGNED_IN o INITIAL_SESSION)
        setTimeout(() => initializeDashboard(session), 100); 
    } else {
        // Solo redirige cuando el evento es explícitamente SIGNED_OUT
        if (event === 'SIGNED_OUT') {
             // ✅ USANDO MINÚSCULAS
             window.location.href = '/index.html'; 
        }
    }
});


// --- LÓGICA DE EVENTOS DEL DOM ---

document.addEventListener('DOMContentLoaded', async () => {
    
    // Iniciar la verificación de sesión para el caso de usuario que regresa (no OAuth)
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        initializeDashboard(session);
    }
    
    // Setup Listeners
    logoutButton.addEventListener('click', async () => {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            console.error("Error al cerrar sesión:", error);
        } 
    });

    createMateriaForm.addEventListener('submit', async (event) => {
        event.preventDefault();

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


// --- LÓGICA DE MATERIAS ---

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