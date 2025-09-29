// 1. Configuración del cliente de Supabase (CON PERSISTENCIA EXPLÍCITA)
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

// --- ELEMENTOS DEL DOM ---
const loginForm = document.getElementById('login-form');
const googleLoginButton = document.getElementById('google-login-btn');
const errorMessageDiv = document.getElementById('error-message');

// --- LÓGICA DE LOGIN ---

async function setupUserDrive(session) {
    const googleAccessToken = session.provider_token; 
    
    if (!googleAccessToken) {
        console.warn("No se encontró el token de acceso de Google para el usuario de Email/Password. Drive no se configurará automáticamente.");
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
        await setupUserDrive(session);
        window.location.href = '/dashboard.html'; 
    }
});

// Inicio de sesión con Google (OAuth)
googleLoginButton.addEventListener('click', async () => {
    errorMessageDiv.style.display = 'none';
    
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            scopes: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/documents',
            redirectTo: window.location.origin + '/dashboard.html'
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