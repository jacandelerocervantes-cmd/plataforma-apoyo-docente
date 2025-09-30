// --- CONFIGURACIÓN DE SUPABASE ---
const supabaseUrl = 'https://pyurfviezihdfnxfgnxw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dXJmdmllemloZGZueGZnbnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTAwMzksImV4cCI6MjA3NDU2NjAzOX0.-0SeMLWmNPCk4i8qg0-tHhpftBj2DMH5t-bO87Cef2c';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// --- LÓGICA DEL DASHBOARD ---
const logoutButton = document.getElementById('logout-button');
const createMateriaForm = document.getElementById('create-materia-form');
const materiasGrid = document.getElementById('materias-grid');
const teacherNameElement = document.getElementById('teacher-name');

function initializeDashboard(session) {
    const user = session.user;
    const displayName = user.user_metadata?.full_name || user.email;
    teacherNameElement.textContent = displayName;
    loadMaterias();
}

supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
        initializeDashboard(session);
    } else if (event === 'SIGNED_OUT') {
        window.location.href = '/index.html';
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        initializeDashboard(session);
    } else {
        // Si no hay sesión al cargar, redirigir al login
        window.location.href = '/index.html';
    }

    logoutButton.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
    });

    createMateriaForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const semester = document.getElementById('semester').value;
    const year = document.getElementById('year').value;
    const units = document.getElementById('units').value;
    // Captura los nuevos valores
    const drive_folder_url = document.getElementById('drive_folder_url').value;
    const google_sheet_url = document.getElementById('google_sheet_url').value;

    const { error } = await supabaseClient.from('materias').insert({
        name,
        semester,
        year,
        units,
        drive_folder_url: drive_folder_url || null, // Guardar como null si está vacío
        google_sheet_url: google_sheet_url || null  // Guardar como null si está vacío
    });
    if (error) {
        alert(`Error al crear la materia: ${error.message}`);
    } else {
        alert("¡Materia creada con éxito!");
        createMateriaForm.reset();
        loadMaterias();
    }
    });

});

async function loadMaterias() {
    const { data: materias, error } = await supabaseClient.from('materias').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error("Error al cargar materias:", error);
        return;
    }
    materiasGrid.innerHTML = '';
    materias.forEach(materia => {
        const cardLink = document.createElement('a');
        cardLink.href = `materia.html?id=${materia.id}`;
        cardLink.classList.add('materia-card-link');
        cardLink.innerHTML = `<h3>${materia.name}</h3><p><strong>Semestre:</strong> ${materia.semester || 'N/A'}</p><p><strong>Año:</strong> ${materia.year || 'N/A'}</p>`;
        materiasGrid.appendChild(cardLink);
    });
}