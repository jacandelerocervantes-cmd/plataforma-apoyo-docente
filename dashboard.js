// --- CONFIGURACIÓN DE SUPABASE ---
const supabaseUrl = 'https://pyurfviezihdfnxfgnxw.supabase.co'; // Reemplaza con tu URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dXJmdmllemloZGZueGZnbnd4dyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjg4NzI0NTc0LCJleHAiOjE5MDQyODQ1NzR9.Dl8jv1kYk3jX1KXoX1m8n2rQZ2p6kU1iU5rXH3b7m0';     // Reemplaza con tu Anon Key
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// --- ELEMENTOS DEL DOM ---
const logoutButton = document.getElementById('logout-button');
const createMateriaForm = document.getElementById('create-materia-form');
const materiasGrid = document.getElementById('materias-grid');
const teacherNameElement = document.getElementById('teacher-name');

// --- MANEJO DE LA SESIÓN ---
// 1. Verificar si el usuario está logueado al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        // Si no hay sesión, redirigir a la página de login
        window.location.href = '/index.html';
    } else {
        // Si hay sesión, personaliza el saludo y carga las materias
        const user = session.user;
        const displayName = user.user_metadata?.full_name || user.email;
        teacherNameElement.textContent = displayName;

        loadMaterias();
    }
});

// 2. Funcionalidad de Cerrar Sesión
logoutButton.addEventListener('click', async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error("Error al cerrar sesión:", error);
    } else {
        // Redirigir a la página de login después de cerrar sesión
        window.location.href = '/index.html';
    }
});


// --- LÓGICA DE MATERIAS ---

// 3. Cargar y mostrar todas las materias
async function loadMaterias() {
    // Por ahora, traemos todas las materias. Más adelante lo aseguraremos con RLS.
    const { data: materias, error } = await supabaseClient
        .from('materias')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error al cargar materias:", error);
        return;
    }

    // Limpiar el grid antes de añadir las nuevas tarjetas
    materiasGrid.innerHTML = ''; 

    materias.forEach(materia => {
        const card = document.createElement('div');
        card.classList.add('materia-card');
        if (materia.is_suspended) {
            card.classList.add('suspended');
        }

        card.innerHTML = `
            <h3>${materia.name}</h3>
            <p><strong>Semestre:</strong> ${materia.semester || 'No especificado'}</p>
            <p><strong>Año:</strong> ${materia.year || 'No especificado'}</p>
            <p><strong>Unidades:</strong> ${materia.units || 'No especificado'}</p>
            <div class="card-actions">
                <button class="btn btn-secondary btn-suspend" data-id="${materia.id}" data-suspended="${materia.is_suspended}">
                    ${materia.is_suspended ? 'Reactivar' : 'Suspender'}
                </button>
                <button class="btn btn-danger btn-delete" data-id="${materia.id}">Eliminar</button>
            </div>
        `;
        materiasGrid.appendChild(card);
    });
}

// 4. Crear una nueva materia
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
        createMateriaForm.reset(); // Limpiar el formulario
        loadMaterias(); // Recargar la lista de materias
    }
});

// 5. Manejar clics en los botones de Suspender y Eliminar
materiasGrid.addEventListener('click', async (event) => {
    // Botón de eliminar
    if (event.target.classList.contains('btn-delete')) {
        const materiaId = event.target.dataset.id;
        const confirmed = confirm('¿Estás seguro de que quieres eliminar esta materia permanentemente?');
        if (confirmed) {
            const { error } = await supabaseClient.from('materias').delete().match({ id: materiaId });
            if (error) console.error("Error al eliminar:", error);
            else loadMaterias();
        }
    }
    // Botón de suspender/reactivar
    if (event.target.classList.contains('btn-suspend')) {
        const materiaId = event.target.dataset.id;
        const isSuspended = event.target.dataset.suspended === 'true';

        const { error } = await supabaseClient
            .from('materias')
            .update({ is_suspended: !isSuspended })
            .match({ id: materiaId });
        
        if (error) console.error("Error al actualizar:", error);
        else loadMaterias();
    }
});