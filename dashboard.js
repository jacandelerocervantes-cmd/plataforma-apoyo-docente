// --- CONFIGURACIÓN DE SUPABASE ---
// ⚠️ Reemplaza con tus claves si no son las correctas
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

let isDashboardInitialized = false; 

// --- FUNCIÓN DE INTEGRACIÓN DE DRIVE CON GAS ---

/**
 * Llama al Web App de Google Apps Script para crear la carpeta Drive inicial.
 * Esto evita el problema de la verificación de Scopes de Drive en Supabase.
 */
async function setupUserDrive(session) {
    const userEmail = session.user.email; 

    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            mode: 'cors', 
            headers: {
                'Content-Type': 'application/json',
                // Se envía el email del usuario para identificación en el servidor GAS
                'X-User-Email': userEmail 
            },
            body: JSON.stringify({ userEmail: userEmail })
        });

        const data = await response.json();

        if (response.ok && !data.error) {
            console.log("✅ Drive Folder Setup Success (via GAS):", data);
            // Si todo sale bien, la carpeta 'Plataforma de Apoyo Docente' está en el Drive del usuario.
        } else {
            // Un error del servidor de GAS o un error reportado por GAS
            throw new Error(data.error || "GAS Server Error. Check GAS logs for details.");
        }
        
    } catch (error) {
        // Un error de red o de código
        console.error("❌ ERROR setting up Drive via GAS:", error.message);
    }
}


// --- LÓGICA DE INICIALIZACIÓN ---

function initializeDashboard(session) {
    if (isDashboardInitialized) return; 
    
    const user = session.user;
    const displayName = user.user_metadata?.full_name || user.email;
    teacherNameElement.textContent = displayName;

    // 1. Intentar crear la carpeta de Drive. 
    // Solo se debe hacer si el usuario se autenticó con Google (para asegurar que tiene una cuenta de Google activa).
    const isGoogleUser = user.app_metadata.provider === 'google';
    if (isGoogleUser) {
        setupUserDrive(session); 
    }
    
    // 2. Cargar las materias
    loadMaterias();
    isDashboardInitialized = true; 
}


// --- MANEJO DE LA SESIÓN: LISTENER CRÍTICO Y ROBUSTO ---

supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log(`Evento de Auth: ${event}, Sesión: ${!!session}`);

    if (session) {
        // Inicializa después de un breve retraso para asegurar que el DOM esté listo
        setTimeout(() => initializeDashboard(session), 100); 
    } else {
        // Redirige solo si la acción fue cerrar sesión o si la sesión no es válida.
        if (event === 'SIGNED_OUT') {
             window.location.href = '/index.html'; 
        }
    }
});


// --- LÓGICA DE EVENTOS DEL DOM ---

document.addEventListener('DOMContentLoaded', async () => {
    
    // Iniciar la verificación de sesión para el caso de usuario que regresa
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        initializeDashboard(session);
    }
    
    // Configuración del botón de Cerrar Sesión
    logoutButton.addEventListener('click', async () => {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            console.error("Error al cerrar sesión:", error);
        } 
        // La redirección es manejada por onAuthStateChange
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
            alert(`Error al crear la materia: ${error.message || 'Verifica la consola para más detalles.'}`);
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