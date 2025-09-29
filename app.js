// 1. Configuración del cliente de Supabase
const supabaseUrl = 'https://pyurfviezihdfnxfgnxw.supabase.co'; // Reemplaza con tu URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dXJmdmllemloZGZueGZnbnd4dyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjg4NzI0NTc0LCJleHAiOjE5MDQyODQ1NzR9.Dl8jv1kYk3jX1KXoX1m8n2rQZ2p6kU1iU5rXH3b7m0';     // Reemplaza con tu Anon Key
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 2. Selección de elementos del DOM
const loginForm = document.getElementById('login-form');
const googleLoginButton = document.getElementById('google-login-btn');
const errorMessageDiv = document.getElementById('error-message');

// Función para mostrar errores
const showError = (message) => {
    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = 'block';
};

// 3. Lógica para inicio de sesión con Email y Contraseña
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Evita que la página se recargue

    const email = loginForm.email.value;
    const password = loginForm.password.value;
    errorMessageDiv.style.display = 'none'; // Oculta errores previos

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        console.error('Error al iniciar sesión:', error.message);
        showError('Correo electrónico o contraseña incorrectos. Por favor, intente de nuevo.');
    } else {
        console.log('Inicio de sesión exitoso:', data.user);
        // Redirige a la página principal de la plataforma después del éxito
        window.location.href = '/dashboard.html'; // Cambia a la URL de tu página principal
    }
});

// 4. Lógica para inicio de sesión con Google
googleLoginButton.addEventListener('click', async () => {
    errorMessageDiv.style.display = 'none'; // Oculta errores previos
    
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // Estos son los 'scopes' que solicitan los permisos para las APIs
            // que necesitas.
            scopes: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/documents'
        }
    });
    
    if (error) {
        console.error('Error al iniciar sesión con Google:', error.message);
        showError('No se pudo iniciar sesión con Google. Intente más tarde.');
    } 
    // Nota: Supabase redirigirá automáticamente a la página de Google
    // y luego de vuelta a tu sitio. La gestión de la sesión se hace
    // en la página a la que eres redirigido.
});