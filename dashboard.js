// --- CONFIGURACIÓN DE SUPABASE ---
const supabaseUrl = 'https://pyurfviezihdfnxfgnxw.supabase.co'; // Reemplaza con tu URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dXJmdmllemloZGZueGZnbnd4dyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjg4NzI0NTc0LCJleHAiOjE5MDQyODQ1NzR9.Dl8jv1kYk3jX1KXoX1m8n2rQZ2p6kU1iU5rXH3b7m0';     // Reemplaza con tu Anon Key
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
const SETUP_DRIVE_FUNCTION_URL = 'https://pyurfviezihdfnxfgnxw.supabase.co/functions/v1/setup-drive-folder';
// --- ELEMENTOS DEL DOM ---
const logoutButton = document.getElementById('logout-button');
const createMateriaForm = document.getElementById('create-materia-form');
const materiasGrid = document.getElementById('materias-grid');
const teacherNameElement = document.getElementById('teacher-name');

// --- FUNCIONES AUXILIARES DE DRIVE ---

/**
 * Llama a la Edge Function para crear la carpeta raíz en Google Drive.
 * @param {Object} session - El objeto de sesión de Supabase.
 */
async function setupUserDrive(session) {
    const googleAccessToken = session.provider_token;

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

        console.log("Respuesta de la función setupDrive:", data);
        
    } catch (error) {
        console.error("Error al llamar a la función setupDrive:", error.message);
    }
}


// --- MANEJO DE LA SESIÓN (CORREGIDO) ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar si hay un resultado de redirección (p. ej., después de un login con Google)
    // ESTA ES LA LÍNEA CLAVE PARA CORREGIR LA CONDICIÓN DE CARRERA:
    const { data: { session: redirectSession }, error: redirectError } = await supabaseClient.auth.getRedirectResult();

    // 2. Determinar la sesión actual (o la recién creada por el redirect)
    let currentSession;
    if (redirectSession) {
        currentSession = redirectSession;
    } else {
        const { data: { session } } = await supabaseClient.auth.getSession();
        currentSession = session;
    }

    // 3. Verificar si hay una sesión válida
    if (!currentSession) {
        window.location.href = '/index.html';
        return; 
    }

    // Si llegamos aquí, la sesión es válida
    const user = currentSession.user;
    const displayName = user.user_metadata?.full_name || user.email;
    teacherNameElement.textContent = displayName;

    // Lógica para configurar Drive solo si es un inicio de sesión de Google con token fresco
    const isGoogleUser = user.app_metadata.provider === 'google';
    const hasProviderToken = currentSession.provider_token; 
    
    if (isGoogleUser && hasProviderToken) {
        console.log("Detectado inicio de sesión de Google. Configurando Drive...");
        await setupUserDrive(currentSession);
    }

    loadMaterias();
});

logoutButton.addEventListener('click', async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error("Error al cerrar sesión:", error);
    } else {
        window.location.href = '/index.html';
    }
});

// --- LÓGICA DE MATERIAS ---

// Cargar y mostrar todas las materias como enlaces
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
        cardLink.href = `materia.html?id=${materia.id}`; // Pasamos el ID en la URL
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

// Crear una nueva materia
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
    } else {
        createMateriaForm.reset();
        loadMaterias();
    }
});