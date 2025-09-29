// --- CONFIGURACIÓN DE SUPABASE ---
const supabaseUrl = 'https://pyurfviezihdfnxfgnxw.supabase.co'; // Reemplaza con tu URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dXJmdmllemloZGZueGZnbnd4dyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjg4NzI0NTc0LCJleHAiOjE5MDQyODQ1NzR9.Dl8jv1kYk3jX1KXoX1m8n2rQZ2p6kU1iU5rXH3b7m0';     // Reemplaza con tu Anon Key
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// --- ESTADO Y VARIABLES GLOBALES ---
let activeSession = null;

// --- ELEMENTOS DEL DOM ---
const materiaNameElement = document.getElementById('materia-name');
const attendanceForm = document.getElementById('attendance-form');
const studentMatriculaInput = document.getElementById('student-matricula');
const submitBtn = document.getElementById('submit-btn');
const messageContainer = document.getElementById('message-container');

// --- INICIALIZACIÓN DE LA PÁGINA ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Obtener el ID de la sesión desde la URL
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (!sessionId) {
        showMessage("error", "URL inválida. No se encontró una sesión de asistencia.");
        disableForm();
        return;
    }

    // 2. Validar la sesión de asistencia
    const { data: session, error } = await supabaseClient
        .from('attendance_sessions')
        .select(`
            *,
            materias (name)
        `)
        .eq('id', sessionId)
        .single();

    if (error || !session) {
        showMessage("error", "No se encontró una sesión de asistencia válida.");
        disableForm();
        return;
    }
    
    // 3. Verificar si la sesión ha expirado o está inactiva
    const now = new Date();
    const expiresAt = new Date(session.expires_at);

    if (!session.is_active || now > expiresAt) {
        showMessage("error", "El código QR para esta sesión ha expirado.");
        materiaNameElement.textContent = `Materia: ${session.materias.name}`;
        disableForm();
        return;
    }
    
    // Si todo está bien, guardamos la sesión y actualizamos la UI
    activeSession = session;
    materiaNameElement.textContent = `Materia: ${activeSession.materias.name}`;
});

// --- LÓGICA DEL FORMULARIO ---
attendanceForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    disableForm(); // Desactivar para evitar envíos múltiples

    const matricula = studentMatriculaInput.value.trim();

    // 1. Encontrar al estudiante por su matrícula
    const { data: student, error: studentError } = await supabaseClient
        .from('students')
        .select('id')
        .eq('student_id', matricula)
        .single();

    if (studentError || !student) {
        showMessage("error", "Matrícula no encontrada. Verifica que esté escrita correctamente.");
        enableForm();
        return;
    }
    const studentId = student.id;

    // 2. Verificar si el alumno ya registró asistencia para esta sesión
    const { data: existingAttendance, error: checkError } = await supabaseClient
        .from('attendance')
        .select('id')
        .eq('session_id', activeSession.id)
        .eq('student_id', studentId)
        .single();
    
    if (existingAttendance) {
        showMessage("success", "Tu asistencia ya ha sido registrada previamente.");
        return;
    }

    // 3. Insertar el nuevo registro de asistencia
    const { error: insertError } = await supabaseClient
        .from('attendance')
        .insert({
            materia_id: activeSession.materia_id,
            student_id: studentId,
            session_id: activeSession.id,
            unit_number: activeSession.unit_number,
            attendance_date: new Date().toISOString().slice(0, 10), // Fecha de hoy en formato YYYY-MM-DD
            status: 'Presente'
        });

    if (insertError) {
        showMessage("error", "Ocurrió un error al guardar tu asistencia. Inténtalo de nuevo.");
        console.error("Error de inserción:", insertError);
        enableForm();
    } else {
        showMessage("success", "¡Asistencia registrada con éxito!");
    }
});


// --- FUNCIONES AUXILIARES ---
function showMessage(type, text) {
    messageContainer.textContent = text;
    messageContainer.style.color = type === "success" ? "green" : "red";
}

function disableForm() {
    studentMatriculaInput.disabled = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Procesando...";
}

function enableForm() {
    studentMatriculaInput.disabled = false;
    submitBtn.disabled = false;
    submitBtn.textContent = "Registrar Asistencia";
}