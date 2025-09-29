// 1. Configuración del cliente de Supabase (CON PERSISTENCIA EXPLÍCITA)
const supabaseUrl = 'https://pyurfviezihdfnxfgnxw.supabase.co'; // Reemplaza con tu URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dXJmdmllemloZGZueGZnbnd4dyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjg4NzI0NTc0LCJleHAiOjE5MDQyODQ0NzR9.Dl8jv1kYk3jX1KXoXoXoXoXoXoXoXoXoXoXoXoXoXoXoXoXoXo';     // Reemplaza con tu Anon Key

// FORZAR LA PERSISTENCIA DE SESIÓN
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        storage: window.localStorage, // Forzar el uso de localStorage
    }
});

// URL CORREGIDA para la función de Drive
const SETUP_DRIVE_FUNCTION_URL = 'https://pyurfviezihdfnxfgnxw.supabase.co/functions/v1/setup-drive-folder'; 

// --- ELEMENTOS DEL DOM ---
const loginForm = document.getElementById('login-form');
const googleLoginButton = document.getElementById('google-login-btn');
const errorMessageDiv = document.getElementById('error-message');

// --- LÓGICA DE LOGIN ---

/**
 * Llama a nuestra Edge Function para crear la carpeta raíz en Google Drive.
 * Se utiliza SOLO para el flujo de Email/Password aquí.
 * @param {Object} session - El objeto de sesión de Supabase.
 */
async function setupUserDrive(session) {
    const googleAccessToken = session.provider_token; // Será null para email/password
    
    // Si no hay token de Google, no se puede hacer nada con Drive.
    if (!googleAccessToken) {
        console.warn("No se encontró el token de acceso de Google para el usuario de Email/Password. Drive no se configurará automáticamente.");
        return;
    }

    try {
        const response = await fetch(SETUP_DRIVE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                // Para login con Email/Password, el token usado aquí es el token de Supabase JWT,
                // que la Edge Function puede usar para autenticar al usuario, pero no para Drive.
                // Es necesario que el usuario complete el OAuth en el dashboard después.
                'Authorization': `Bearer ${googleAccessToken}`, 
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Error del servidor: ${response.status}`);
        }

        console.log("Respuesta de la función setupDrive (Email/Password):", data);
        
    } catch (error) {
        console.error("Error al llamar a la función setupDrive (Email/Password):", error.message);
    }
}


// Inicio de sesión con email/password
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    errorMessageDiv.style.display = 'none';

    const { data: { session }, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        errorMessageDiv.textContent = `Error de inicio de sesión: ${error.message}`;
        errorMessageDiv.style.display = 'block';
    } else if (session) {
        // Ejecutar el setup de Drive (aunque fallará sin token de Google, mantiene la lógica)
        await setupUserDrive(session);
        // Redirigimos al dashboard
        window.location.href = '/Dashboard.html';
    }
});

// Inicio de sesión con Google (OAuth)
googleLoginButton.addEventListener('click', async () => {
    errorMessageDiv.style.display = 'none';
    
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // SCopes requeridos para Drive y Sheets
            scopes: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/documents',
        }
    });
    
    if (error) {
        errorMessageDiv.textContent = `Error de Google OAuth: ${error.message}`;
        errorMessageDiv.style.display = 'block';
    }
});

// Chequeo de sesión para prevenir que el usuario ya logueado vea el login
supabaseClient.auth.getSession().then(({ data: { session } }) => {
    if (session) {
        window.location.href = '/dashboard.html';
    }
});