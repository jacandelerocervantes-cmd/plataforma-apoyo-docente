// --- CONFIGURACIÓN DE SUPABASE ---
const supabaseUrl = 'https://pyurfviezihdfnxfgnxw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dXJmdmllemloZGZueGZnbnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTAwMzksImV4cCI6MjA3NDU2NjAzOX0.-0SeMLWmNPCk4i8qg0-tHhpftBj2DMH5t-bO87Cef2c';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// --- LÓGICA DE LA APLICACIÓN ---
const loginForm = document.getElementById('login-form');
const googleLoginButton = document.getElementById('google-login-btn');
const errorMessageDiv = document.getElementById('error-message');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorMessageDiv.style.display = 'none';
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { data: { session }, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        errorMessageDiv.textContent = `Error de inicio de sesión: ${error.message}`;
        errorMessageDiv.style.display = 'block';
    } else if (session) {
        window.location.href = '/dashboard.html';
    }
});

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

supabaseClient.auth.getSession().then(({ data: { session } }) => {
    if (session) {
        window.location.href = '/dashboard.html';
    }
});