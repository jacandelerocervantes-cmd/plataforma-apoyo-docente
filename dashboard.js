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

// --- FUNCIONES AUXILIARES DE DRIVE (NUEVA FUNCIÓN) ---

/**
 * Llama a la Edge Function para crear la carpeta raíz en Google Drive.
 * @param {Object} session - El objeto de sesión de Supabase.
 */
async function setupUserDrive(session) {
    // Necesitamos el 'provider_token' que es el token de acceso de Google.
    const googleAccessToken = session.provider_token;

    if (!googleAccessToken) {
        console.warn("No se encontró el token de acceso de Google. No se puede configurar Drive.");
        return;
    }

    try {
        const response = await fetch(SETUP_DRIVE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                // El token de Google se envía en el encabezado de Autorización de la función
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


// --- MANEJO DE LA SESIÓN (MODIFICADO) ---
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = '/index.html';
    } else {
        const user = session.user;
        const displayName = user.user_metadata?.full_name || user.email;
        teacherNameElement.textContent = displayName;

        // Lógica para configurar Drive solo después de un inicio de sesión con Google
        const isGoogleUser = user.app_metadata.provider === 'google';
        const hasProviderToken = session.provider_token; 
        
        // El provider_token solo está presente inmediatamente después de un login OAuth
        if (isGoogleUser && hasProviderToken) {
            console.log("Detectado inicio de sesión de Google. Configurando Drive...");
            await setupUserDrive(session);
        }

        loadMaterias();
    }
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