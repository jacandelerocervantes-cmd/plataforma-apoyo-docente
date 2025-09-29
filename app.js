// 1. Configuración del cliente de Supabase
const supabaseUrl = 'https://pyurfviezihdfnxfgnxw.supabase.co'; // Reemplaza con tu URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dXJmdmllemloZGZueGZnbnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTAwMzksImV4cCI6MjA3NDU2NjAzOX0.-0SeMLWmNPCk4i8qg0-tHhpftBj2DMH5t-bO87Cef2c';     // Reemplaza con tu Anon Key
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
const SETUP_DRIVE_FUNCTION_URL = 'https://pyurfviezihdfnxfgnxw/functions';

// --- ELEMENTOS DEL DOM ---
const loginForm = document.getElementById('login-form');
const googleLoginButton = document.getElementById('google-login-btn');
const errorMessageDiv = document.getElementById('error-message');

// --- LÓGICA DE LOGIN ---

// Inicio de sesión con Email y Contraseña
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = login-form.email.value;
    const password = loginForm.password.value;
    errorMessageDiv.style.display = 'none';

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        showError('Correo electrónico o contraseña incorrectos.');
    } else if (data.session) {
        console.log('Inicio de sesión exitoso:', data.session.user);
        // Llamamos a la función para configurar Drive
        await setupUserDrive(data.session);
        // Redirigimos al dashboard
        window.location.href = '/dashboard.html';
    }
});

// Inicio de sesión con Google
googleLoginButton.addEventListener('click', async () => {
    errorMessageDiv.style.display = 'none';
    
    // Al iniciar con Google, Supabase maneja la redirección.
    // La lógica para llamar a la función de Drive se debe manejar
    // en la página a la que se redirige (dashboard.html)
    // cuando la sesión se establece por primera vez.
    await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            scopes: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/documents'
        }
    });
});

/**
 * Llama a nuestra Edge Function para crear la carpeta raíz en Google Drive.
 * @param {Object} session - El objeto de sesión de Supabase que contiene el token de acceso.
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
                'Authorization': `Bearer ${googleAccessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            // Si la respuesta del servidor no es exitosa (ej. 401, 500)
            throw new Error(data.error || `Error del servidor: ${response.status}`);
        }

        console.log("Respuesta de la función setupDrive:", data);
        // Aquí podríamos guardar el 'data.folderId' en nuestra base de datos para usarlo después.
        
    } catch (error) {
        console.error("Error al llamar a la función setupDrive:", error.message);
    }
}


// --- FUNCIONES AUXILIARES ---
const showError = (message) => {
    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = 'block';
};