¡Perfecto! Continuamos.

Ya hemos preparado la base de datos para tu estructura detallada de unidades y ponderaciones. Ahora vamos a la Fase 2, que es la más visible: actualizar la interfaz para que puedas gestionar toda esta nueva información.

Aquí te proporciono los códigos completos y finales de materia.html y materia.js. Estos archivos incluyen la nueva pestaña "Unidades" y toda la lógica necesaria para que funcione, además de mantener todas las funcionalidades que ya teníamos.

Por favor, reemplaza el contenido completo de tus archivos existentes con estos.

materia.html (Completo y Final)
Este código añade la nueva pestaña "Unidades" y su correspondiente panel con los formularios para crear unidades y actualizar sus URLs.

HTML

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Detalle de Materia</title>
    <link rel="stylesheet" href="dashboard.css">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header class="main-header">
        <h1 id="materia-name-header">Cargando materia...</h1>
        <a href="/dashboard.html" class="btn btn-secondary">Volver al Dashboard</a>
    </header>

    <main class="container">
        <nav class="tabs">
            <a href="#" class="tab active" data-tab="asistencia">Asistencia</a>
            <a href="#" class="tab" data-tab="alumnos">Alumnos</a>
            <a href="#" class="tab" data-tab="actividades">Actividades</a>
            <a href="#" class="tab" data-tab="evaluaciones">Evaluaciones</a>
            <a href="#" class="tab" data-tab="material">Material Didáctico</a>
            <a href="#" class="tab" data-tab="unidades">Unidades</a>
        </nav>

        <div id="asistencia-content" class="tab-content active">
            <div class="attendance-panel">
                <div class="control-panel form-card">
                    <h2>Control de Asistencia por QR</h2>
                    <div class="input-group">
                        <label for="unit-number">Seleccionar Unidad</label>
                        <input type="number" id="unit-number" value="1" min="1">
                    </div>
                    <button id="generate-qr-btn" class="btn btn-primary">Generar QR para Asistencia</button>
                    <div id="qr-session-active" class="hidden">
                        <div id="qrcode-container"></div>
                        <div id="timer">05:00</div>
                        <div class="qr-actions">
                            <button id="renew-qr-btn" class="btn btn-secondary">Renovar (5 min)</button>
                            <button id="cancel-qr-btn" class="btn btn-danger">Cancelar Sesión</button>
                        </div>
                    </div>
                </div>

                <div class="realtime-list list-card">
                    <h2>Asistencias Registradas (En Vivo)</h2>
                    <ul id="realtime-attendance-list">
                    </ul>
                </div>
            </div>
            <div class="manual-attendance-panel list-card" style="margin-top: 2rem;">
                <h2>Tomar Asistencia Manualmente</h2>
                <div id="manual-attendance-student-list">
                    </div>
                <button id="save-manual-attendance-btn" class="btn btn-primary" style="margin-top: 1rem;">Guardar Asistencia Manual</button>
            </div>
        </div>

        <div id="alumnos-content" class="tab-content">
            <section class="form-card">
                <h2>Añadir Alumno Manualmente</h2>
                <form id="add-student-form">
                    <div class="form-row">
                        <div class="input-group">
                            <label for="first_name">Nombre(s)</label>
                            <input type="text" id="first_name" required>
                        </div>
                        <div class="input-group">
                            <label for="last_name">Apellidos</label>
                            <input type="text" id="last_name" required>
                        </div>
                        <div class="input-group">
                            <label for="student_id">Matrícula</label>
                            <input type="text" id="student_id" required>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Añadir Alumno</button>
                </form>
            </section>

            <section class="list-card">
                <h2>Alumnos Inscritos</h2>
                <ul id="student-list" class="student-list">
                </ul>
            </section>
        </div>
        
        <div id="actividades-content" class="tab-content">
            <div class="activities-panel" style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem;">
                <section class="form-card">
                    <h2>Añadir Nueva Actividad</h2>
                    <form id="add-activity-form">
                        <div class="input-group">
                            <label for="activity-title">Título de la Actividad</label>
                            <input type="text" id="activity-title" required>
                        </div>
                        <div class="input-group">
                            <label for="activity-unit">Unidad</label>
                            <input type="number" id="activity-unit" value="1" min="1" required>
                        </div>
                        <div class="input-group">
                            <label for="activity-description">Descripción / Instrucciones</label>
                            <textarea id="activity-description" rows="4"></textarea>
                        </div>
                        <div class="input-group">
                            <label for="activity-due-date">Fecha de Entrega</label>
                            <input type="date" id="activity-due-date">
                        </div>
                        <button type="submit" class="btn btn-primary">Guardar Actividad</button>
                    </form>
                </section>

                <section class="list-card">
                    <h2>Actividades de la Materia</h2>
                    <div id="activities-list">
                    </div>
                </section>
            </div>
            <div id="grading-panel" class="hidden">
                <div class="list-card">
                    <div class="grading-header">
                        <button id="back-to-activities-btn" class="btn btn-secondary">&larr; Volver</button>
                        <h2 id="grading-activity-title">Calificando Actividad</h2>
                    </div>
                    <form id="grading-form">
                        <table class="grading-table">
                            <thead>
                                <tr>
                                    <th>Alumno</th>
                                    <th>Matrícula</th>
                                    <th>Calificación</th>
                                    <th>Comentarios</th>
                                </tr>
                            </thead>
                            <tbody id="grading-student-list">
                            </tbody>
                        </table>
                        <button type="submit" class="btn btn-primary" style="margin-top: 1rem;">Guardar Calificaciones</button>
                    </form>
                </div>
            </div>
        </div>

        <div id="evaluaciones-content" class="tab-content">
            <div class="evaluations-panel" style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem;">
                <section class="form-card">
                    <h2>Añadir Nueva Evaluación</h2>
                    <form id="add-evaluation-form">
                        <div class="input-group">
                            <label for="evaluation-title">Título de la Evaluación</label>
                            <input type="text" id="evaluation-title" required>
                        </div>
                        <div class="input-group">
                            <label for="evaluation-unit">Unidad</label>
                            <input type="number" id="evaluation-unit" value="1" min="1" required>
                        </div>
                        <div class="input-group">
                            <label for="evaluation-description">Descripción / Temario</label>
                            <textarea id="evaluation-description" rows="4"></textarea>
                        </div>
                        <div class="input-group">
                            <label for="evaluation-date">Fecha de la Evaluación</label>
                            <input type="date" id="evaluation-date">
                        </div>
                        <button type="submit" class="btn btn-primary">Guardar Evaluación</button>
                    </form>
                </section>

                <section class="list-card">
                    <h2>Evaluaciones de la Materia</h2>
                    <div id="evaluations-list">
                    </div>
                </section>
            </div>

            <div id="evaluation-grading-panel" class="hidden">
                <div class="list-card">
                    <div class="grading-header">
                        <button id="back-to-evaluations-btn" class="btn btn-secondary">&larr; Volver</button>
                        <h2 id="evaluation-grading-title">Calificando Evaluación</h2>
                    </div>
                    <form id="evaluation-grading-form">
                        <table class="grading-table">
                            <thead>
                                <tr>
                                    <th>Alumno</th>
                                    <th>Matrícula</th>
                                    <th>Calificación</th>
                                    <th>Comentarios</th>
                                </tr>
                            </thead>
                            <tbody id="evaluation-grading-student-list">
                            </tbody>
                        </table>
                        <button type="submit" class="btn btn-primary" style="margin-top: 1rem;">Guardar Calificaciones</button>
                    </form>
                </div>
            </div>
        </div>

        <div id="material-content" class="tab-content">
            <section class="list-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h2>Material Didáctico</h2>
                    <button id="add-material-btn" class="btn btn-primary">Añadir Material desde Drive</button>
                </div>
                <div id="materials-list">
                </div>
            </section>
        </div>

        <div id="unidades-content" class="tab-content">
            <section class="form-card">
                <h2>Crear Nueva Unidad</h2>
                <form id="create-unit-form">
                    <div class="form-row">
                        <div class="input-group">
                            <label for="unit_number_input">Número de Unidad</label>
                            <input type="number" id="unit_number_input" min="1" required>
                        </div>
                        <div class="input-group">
                            <label for="unit_ponderation">Ponderación (%)</label>
                            <input type="number" id="unit_ponderation" min="0" max="100" step="0.1" required placeholder="Ej: 25">
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Crear Unidad</button>
                </form>
            </section>
    
            <section class="list-card">
                <h2>Unidades de la Materia</h2>
                <div id="units-list">
                    </div>
            </section>
        </div>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="https://cdn.jsdelivr.net/npm/qrcode-generator/qrcode.js"></script>
    
    <script src="materia.js"></script>

    <script async defer src="https://apis.google.com/js/api.js" onload="gapiLoaded()"></script>
    <script async defer src="https://accounts.google.com/gsi/client" onload="gisLoaded()"></script>
</body>
</html>
materia.js (Completo y Final)
Este archivo ahora incluye toda la lógica para crear, mostrar y actualizar las nuevas unidades y sus URLs.

JavaScript

// --- CONFIGURACIÓN DE SUPABASE Y GOOGLE ---
const supabaseUrl = 'https://pyurfviezihdfnxfgnxw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dXJmdmllemloZGZueGZnbnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTAwMzksImV4cCI6MjA3NDU2NjAzOX0.-0SeMLWmNPCk4i8qg0-tHhpftBj2DMH5t-bO87Cef2c';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Estos valores los reemplazará Render durante el despliegue
const GOOGLE_API_KEY = '__GOOGLE_API_KEY__';
const GOOGLE_CLIENT_ID = '__GOOGLE_CLIENT_ID__';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// --- INICIO DE LA LÓGICA DE LA APLICACIÓN ---

// --- ESTADO Y VARIABLES GLOBALES ---
let currentMateriaId = null;
let activeSessionId = null;
let timerInterval = null;
let realtimeChannel = null;
let currentGradingActivityId = null;
let currentGradingEvaluationId = null;

// --- ELEMENTOS DEL DOM ---
const materiaNameHeader = document.getElementById('materia-name-header');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const generateQRBtn = document.getElementById('generate-qr-btn');
const qrSessionActiveDiv = document.getElementById('qr-session-active');
const qrcodeContainer = document.getElementById('qrcode-container');
const timerElement = document.getElementById('timer');
const renewQRBtn = document.getElementById('renew-qr-btn');
const cancelQRBtn = document.getElementById('cancel-qr-btn');
const unitNumberInput = document.getElementById('unit-number');
const realtimeAttendanceList = document.getElementById('realtime-attendance-list');
const addStudentForm = document.getElementById('add-student-form');
const studentList = document.getElementById('student-list');
const addActivityForm = document.getElementById('add-activity-form');
const activitiesList = document.getElementById('activities-list');
const activitiesPanel = document.querySelector('.activities-panel');
const gradingPanel = document.getElementById('grading-panel');
const gradingActivityTitle = document.getElementById('grading-activity-title');
const gradingStudentList = document.getElementById('grading-student-list');
const backToActivitiesBtn = document.getElementById('back-to-activities-btn');
const gradingForm = document.getElementById('grading-form');
const addEvaluationForm = document.getElementById('add-evaluation-form');
const evaluationsList = document.getElementById('evaluations-list');
const evaluationsPanel = document.querySelector('.evaluations-panel');
const evaluationGradingPanel = document.getElementById('evaluation-grading-panel');
const evaluationGradingTitle = document.getElementById('evaluation-grading-title');
const evaluationGradingStudentList = document.getElementById('evaluation-grading-student-list');
const backToEvaluationsBtn = document.getElementById('back-to-evaluations-btn');
const evaluationGradingForm = document.getElementById('evaluation-grading-form');
const addMaterialBtn = document.getElementById('add-material-btn');
const materialsList = document.getElementById('materials-list');
const manualAttendanceList = document.getElementById('manual-attendance-student-list');
const saveManualAttendanceBtn = document.getElementById('save-manual-attendance-btn');

// --- INICIALIZACIÓN DE LA PÁGINA ---
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    currentMateriaId = params.get('id');

    if (!currentMateriaId) {
        alert("ID de materia no encontrado.");
        window.location.href = '/dashboard.html';
        return;
    }

    loadMateriaDetails();
    loadEnrolledStudents();
    loadActivities();
    loadEvaluations();
    loadMaterials();
    setupEventListeners();
    loadStudentsForManualAttendance();
    loadUnits(); // Cargar las nuevas unidades
});

// --- FUNCIONES DE CONFIGURACIÓN Y CARGA INICIAL ---
async function loadMateriaDetails() {
    const { data: materia, error } = await supabaseClient.from('materias').select('name').eq('id', currentMateriaId).single();
    if (error || !materia) {
        console.error("No se pudo cargar la materia", error);
        materiaNameHeader.textContent = "Error al cargar la materia";
    } else {
        materiaNameHeader.textContent = `Materia: ${materia.name}`;
    }
}

function setupEventListeners() {
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            tabs.forEach(item => item.classList.remove('active'));
            tab.classList.add('active');
            const targetTab = tab.getAttribute('data-tab');
            tabContents.forEach(content => {
                content.style.display = 'none'; // Ocultar todos
                if (content.id === `${targetTab}-content`) {
                    content.style.display = 'block'; // Mostrar solo el activo
                }
            });
        });
    });

    generateQRBtn.addEventListener('click', createNewAttendanceSession);
    renewQRBtn.addEventListener('click', renewSession);
    cancelQRBtn.addEventListener('click', cancelSession);
    addStudentForm.addEventListener('submit', handleAddStudent);
    addActivityForm.addEventListener('submit', handleAddActivity);
    backToActivitiesBtn.addEventListener('click', showActivitiesPanel);
    gradingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSaveGrades(currentGradingActivityId);
    });
    addEvaluationForm.addEventListener('submit', handleAddEvaluation);
    backToEvaluationsBtn.addEventListener('click', showEvaluationsPanel);
    evaluationGradingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSaveEvaluationGrades(currentGradingEvaluationId);
    });
    addMaterialBtn.addEventListener('click', () => {
        if (gapiInited && gisInited) {
            tokenClient.requestAccessToken({ prompt: '' });
        } else {
            alert("La API de Google no ha cargado completamente. Intente de nuevo en unos segundos.");
        }
    });
    saveManualAttendanceBtn.addEventListener('click', handleSaveManualAttendance);
}

// --- LÓGICA DE ASISTENCIA (QR y SESIÓN) ---
async function createNewAttendanceSession() {
    const unitNumber = unitNumberInput.value;
    if (!unitNumber) {
        alert("Por favor, especifica un número de unidad.");
        return;
    }

    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    const { data: session, error } = await supabaseClient
        .from('attendance_sessions').insert({ materia_id: currentMateriaId, unit_number: unitNumber, expires_at: fiveMinutesFromNow }).select().single();

    if (error) {
        console.error("Error creando la sesión:", error);
        alert("No se pudo crear la sesión de asistencia.");
        return;
    }

    activeSessionId = session.id;
    realtimeAttendanceList.innerHTML = '';
    generateAndShowQR(activeSessionId);
    startTimer(session.expires_at);
    listenForRealtimeAttendance();
    generateQRBtn.classList.add('hidden');
    qrSessionActiveDiv.classList.remove('hidden');
}

function generateAndShowQR(sessionId) {
    const studentPageUrl = `${window.location.origin}/student_attendance.html?session_id=${sessionId}`;
    qrcodeContainer.innerHTML = '';
    try {
        const qr = qrcode(0, 'L');
        qr.addData(studentPageUrl);
        qr.make();
        qrcodeContainer.innerHTML = qr.createImgTag(5, 10);
    } catch (e) {
        console.error("Error al generar QR:", e);
        qrcodeContainer.textContent = "Error al generar QR.";
    }
}

function startTimer(expirationTime) {
    clearInterval(timerInterval);
    const expirationDate = new Date(expirationTime).getTime();
    timerInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = expirationDate - now;
        if (distance < 0) {
            clearInterval(timerInterval);
            timerElement.textContent = "EXPIRADO";
            deactivateSession();
            return;
        }
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

async function renewSession() {
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { data, error } = await supabaseClient.from('attendance_sessions').update({ expires_at: fiveMinutesFromNow, is_active: true }).eq('id', activeSessionId).select().single();
    if (error) {
        alert("Error al renovar la sesión.");
    } else {
        startTimer(data.expires_at);
    }
}

async function cancelSession() {
    clearInterval(timerInterval);
    await deactivateSession();
    
    if (realtimeChannel) {
        supabaseClient.removeChannel(realtimeChannel);
        realtimeChannel = null;
    }

    generateQRBtn.classList.remove('hidden');
    qrSessionActiveDiv.classList.add('hidden');
    qrcodeContainer.innerHTML = '';
    timerElement.textContent = '05:00';
    activeSessionId = null;
}

async function deactivateSession() {
    if (!activeSessionId) return;
    await supabaseClient.from('attendance_sessions').update({ is_active: false }).eq('id', activeSessionId);
}

function listenForRealtimeAttendance() {
    if (realtimeChannel) {
        supabaseClient.removeChannel(realtimeChannel);
    }
    
    realtimeChannel = supabaseClient.channel(`realtime-attendance:${activeSessionId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance', filter: `session_id=eq.${activeSessionId}` },
            async (payload) => {
                const newAttendance = payload.new;
                const { data: student, error } = await supabaseClient
                    .from('students').select('first_name, last_name').eq('id', newAttendance.student_id).single();

                if (student) {
                    const listItem = document.createElement('li');
                    listItem.textContent = `${student.first_name} ${student.last_name}`;
                    realtimeAttendanceList.appendChild(listItem);
                }
            }
        )
        .subscribe();
}

// --- LÓGICA DE GESTIÓN DE ACTIVIDADES Y CALIFICACIÓN ---

async function loadActivities() {
    const { data: activities, error } = await supabaseClient
        .from('activities').select('*').eq('materia_id', currentMateriaId).order('created_at', { ascending: false });

    if (error) {
        console.error("Error cargando actividades:", error);
        return;
    }

    activitiesList.innerHTML = '';
    if (activities.length === 0) {
        activitiesList.innerHTML = '<p>Aún no hay actividades creadas.</p>';
        return;
    }
    
    activities.forEach(activity => {
        const activityElement = document.createElement('div');
        activityElement.classList.add('activity-item');
        activityElement.innerHTML = `
            <h4>${activity.title} (Unidad ${activity.unit_number})</h4>
            <p>${activity.description || 'Sin descripción.'}</p>
            <small>Fecha de entrega: ${activity.due_date || 'No definida'}</small>
            <button class="btn btn-secondary btn-calificar" style="margin-top: 10px; font-size: 0.8rem; padding: 0.4rem 0.8rem;">Calificar</button>
        `;
        activityElement.querySelector('.btn-calificar').addEventListener('click', () => showGradingPanel(activity));
        activitiesList.appendChild(activityElement);
    });
}

async function handleAddActivity(event) {
    event.preventDefault();
    const title = document.getElementById('activity-title').value;
    const unit_number = document.getElementById('activity-unit').value;
    const description = document.getElementById('activity-description').value;
    const due_date = document.getElementById('activity-due-date').value;

    const { error } = await supabaseClient
        .from('activities').insert({ materia_id: currentMateriaId, title, unit_number, description, due_date: due_date || null });
    
    if (error) {
        console.error("Error al crear la actividad:", error);
        alert("Ocurrió un error al guardar la actividad.");
    } else {
        addActivityForm.reset();
        loadActivities();
    }
}

function showActivitiesPanel() {
    gradingPanel.classList.add('hidden');
    document.querySelector('.activities-panel').style.display = 'grid';
}

async function showGradingPanel(activity) {
    currentGradingActivityId = activity.id;
    document.querySelector('.activities-panel').style.display = 'none';
    gradingPanel.classList.remove('hidden');
    gradingActivityTitle.textContent = `Calificando: ${activity.title}`;
    loadStudentsForGrading(activity.id);
}

async function loadStudentsForGrading(activityId) {
    const { data: enrollments, error: enrollError } = await supabaseClient
        .from('enrollments').select(`students (*)`).eq('materia_id', currentMateriaId);

    if (enrollError) {
        console.error("Error cargando alumnos:", enrollError);
        return;
    }

    const { data: grades, error: gradeError } = await supabaseClient
        .from('grades').select(`student_id, grade, comments`).eq('activity_id', activityId);

    if (gradeError) {
        console.error("Error cargando calificaciones:", gradeError);
        return;
    }

    const gradesMap = new Map(grades.map(g => [g.student_id, g]));

    gradingStudentList.innerHTML = '';
    enrollments.forEach(enrollment => {
        const student = enrollment.students;
        const existingGrade = gradesMap.get(student.id);

        const row = document.createElement('tr');
        row.dataset.studentId = student.id;
        row.innerHTML = `
            <td>${student.first_name} ${student.last_name}</td>
            <td>${student.student_id}</td>
            <td><input type="number" class="grade-input" min="0" max="100" value="${existingGrade?.grade || ''}" placeholder="0-100"></td>
            <td><input type="text" class="comments-input" value="${existingGrade?.comments || ''}" placeholder="Comentarios..."></td>
        `;
        gradingStudentList.appendChild(row);
    });
}

async function handleSaveGrades(activityId) {
    const gradeRows = gradingStudentList.querySelectorAll('tr');
    const gradesToUpsert = [];

    gradeRows.forEach(row => {
        const studentId = row.dataset.studentId;
        const grade = row.querySelector('.grade-input').value;
        const comments = row.querySelector('.comments-input').value;

        if (grade) {
            gradesToUpsert.push({
                activity_id: activityId,
                student_id: studentId,
                grade: parseFloat(grade),
                comments: comments
            });
        }
    });

    if (gradesToUpsert.length === 0) {
        alert("No se han introducido nuevas calificaciones.");
        return;
    }

    const { error } = await supabaseClient
        .from('grades').upsert(gradesToUpsert, { onConflict: 'activity_id, student_id' });

    if (error) {
        console.error("Error guardando calificaciones:", error);
        alert("Ocurrió un error al guardar las calificaciones.");
    } else {
        alert("¡Calificaciones guardadas con éxito!");
        showActivitiesPanel();
    }
}

// --- LÓGICA DE GESTIÓN DE EVALUACIONES ---

async function loadEvaluations() {
    const { data: evaluations, error } = await supabaseClient
        .from('evaluations').select('*').eq('materia_id', currentMateriaId).order('created_at', { ascending: false });

    if (error) {
        console.error("Error cargando evaluaciones:", error);
        return;
    }

    evaluationsList.innerHTML = '';
    if (evaluations.length === 0) {
        evaluationsList.innerHTML = '<p>Aún no hay evaluaciones creadas.</p>';
        return;
    }
    
    evaluations.forEach(evaluation => {
        const evalElement = document.createElement('div');
        evalElement.classList.add('activity-item');
        evalElement.innerHTML = `
            <h4>${evaluation.title} (Unidad ${evaluation.unit_number})</h4>
            <p>${evaluation.description || 'Sin descripción.'}</p>
            <small>Fecha: ${evaluation.evaluation_date || 'No definida'}</small>
            <button class="btn btn-secondary btn-calificar-eval" style="margin-top: 10px; font-size: 0.8rem; padding: 0.4rem 0.8rem;">Calificar</button>
        `;
        evalElement.querySelector('.btn-calificar-eval').addEventListener('click', () => showEvaluationGradingPanel(evaluation));
        evaluationsList.appendChild(evalElement);
    });
}

async function handleAddEvaluation(event) {
    event.preventDefault();
    const title = document.getElementById('evaluation-title').value;
    const unit_number = document.getElementById('evaluation-unit').value;
    const description = document.getElementById('evaluation-description').value;
    const evaluation_date = document.getElementById('evaluation-date').value;

    const { error } = await supabaseClient
        .from('evaluations').insert({ materia_id: currentMateriaId, title, unit_number, description, evaluation_date: evaluation_date || null });
    
    if (error) {
        console.error("Error al crear la evaluación:", error);
        alert("Ocurrió un error al guardar la evaluación.");
    } else {
        addEvaluationForm.reset();
        loadEvaluations();
    }
}

function showEvaluationsPanel() {
    evaluationGradingPanel.classList.add('hidden');
    document.querySelector('.evaluations-panel').style.display = 'grid';
}

async function showEvaluationGradingPanel(evaluation) {
    currentGradingEvaluationId = evaluation.id;
    document.querySelector('.evaluations-panel').style.display = 'none';
    evaluationGradingPanel.classList.remove('hidden');
    evaluationGradingTitle.textContent = `Calificando: ${evaluation.title}`;
    loadStudentsForEvaluationGrading(evaluation.id);
}

async function loadStudentsForEvaluationGrading(evaluationId) {
    const { data: enrollments, error: enrollError } = await supabaseClient
        .from('enrollments').select(`students (*)`).eq('materia_id', currentMateriaId);
    if (enrollError) { console.error("Error cargando alumnos:", enrollError); return; }

    const { data: grades, error: gradeError } = await supabaseClient
        .from('evaluation_grades').select(`student_id, grade, comments`).eq('evaluation_id', evaluationId);
    if (gradeError) { console.error("Error cargando calificaciones de evaluación:", gradeError); return; }

    const gradesMap = new Map(grades.map(g => [g.student_id, g]));

    evaluationGradingStudentList.innerHTML = '';
    enrollments.forEach(enrollment => {
        const student = enrollment.students;
        const existingGrade = gradesMap.get(student.id);

        const row = document.createElement('tr');
        row.dataset.studentId = student.id;
        row.innerHTML = `
            <td>${student.first_name} ${student.last_name}</td>
            <td>${student.student_id}</td>
            <td><input type="number" class="grade-input" min="0" max="100" value="${existingGrade?.grade || ''}" placeholder="0-100"></td>
            <td><input type="text" class="comments-input" value="${existingGrade?.comments || ''}" placeholder="Comentarios..."></td>
        `;
        evaluationGradingStudentList.appendChild(row);
    });
}

async function handleSaveEvaluationGrades(evaluationId) {
    const gradeRows = evaluationGradingStudentList.querySelectorAll('tr');
    const gradesToUpsert = [];

    gradeRows.forEach(row => {
        const studentId = row.dataset.studentId;
        const grade = row.querySelector('.grade-input').value;
        const comments = row.querySelector('.comments-input').value;

        if (grade) {
            gradesToUpsert.push({
                evaluation_id: evaluationId,
                student_id: studentId,
                grade: parseFloat(grade),
                comments: comments
            });
        }
    });

    if (gradesToUpsert.length === 0) {
        alert("No se han introducido nuevas calificaciones.");
        return;
    }

    const { error } = await supabaseClient
        .from('evaluation_grades').upsert(gradesToUpsert, { onConflict: 'evaluation_id, student_id' });

    if (error) {
        console.error("Error guardando calificaciones:", error);
        alert("Ocurrió un error al guardar las calificaciones.");
    } else {
        alert("¡Calificaciones guardadas con éxito!");
        showEvaluationsPanel();
    }
}

// --- LÓGICA DE GESTIÓN DE ALUMNOS ---

async function loadEnrolledStudents() {
    const { data, error } = await supabaseClient.from('enrollments').select(`students (*)`).eq('materia_id', currentMateriaId);
    if (error) {
        console.error("Error cargando alumnos:", error);
        return;
    }
    studentList.innerHTML = '';
    data.forEach(enrollment => {
        const student = enrollment.students;
        const listItem = document.createElement('li');
        listItem.innerHTML = `<span>${student.first_name} ${student.last_name}</span><small>${student.student_id}</small>`;
        studentList.appendChild(listItem);
    });
}

async function handleAddStudent(event) {
    event.preventDefault();
    const firstName = document.getElementById('first_name').value;
    const lastName = document.getElementById('last_name').value;
    const studentId = document.getElementById('student_id').value;

    const { data: newStudent, error: studentError } = await supabaseClient.from('students').insert({ first_name: firstName, last_name: lastName, student_id: studentId }).select().single();
    
    if (studentError) {
        console.error("Error creando alumno:", studentError);
        alert("Error al crear el alumno. La matrícula ya podría existir.");
        return;
    }

    const { error: enrollmentError } = await supabaseClient.from('enrollments').insert({ materia_id: currentMateriaId, student_id: newStudent.id });

    if (enrollmentError) {
        console.error("Error inscribiendo alumno:", enrollmentError);
        alert("Error al inscribir el alumno en la materia.");
        return;
    }

    addStudentForm.reset();
    loadEnrolledStudents();
    loadStudentsForManualAttendance(); // Recargar la lista de asistencia manual
}

// --- LÓGICA DE GESTIÓN DE MATERIAL DIDÁCTICO ---

async function loadMaterials() {
    const { data: materials, error } = await supabaseClient
        .from('materials').select('*').eq('materia_id', currentMateriaId).order('created_at', { ascending: false });

    if (error) {
        console.error("Error cargando materiales:", error);
        return;
    }

    materialsList.innerHTML = '';
    if (materials.length === 0) {
        materialsList.innerHTML = '<p>No hay materiales didácticos para esta unidad.</p>';
        return;
    }

    materials.forEach(material => {
        const materialElement = document.createElement('div');
        materialElement.classList.add('activity-item');
        materialElement.innerHTML = `
            <h4>${material.title} (Unidad ${material.unit_number})</h4>
            <p>${material.description || 'Sin descripción.'}</p>
            <a href="${material.drive_file_link}" target="_blank" class="btn btn-secondary" style="font-size: 0.8rem;">Abrir Material</a>
        `;
        materialsList.appendChild(materialElement);
    });
}

// --- LÓGICA DE GOOGLE PICKER API ---

function gapiLoaded() {
    gapiInited = true;
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: async (resp) => {
            if (resp.error !== undefined) {
                console.error("Error al obtener token de acceso de Google:", resp);
                throw (resp);
            }
            showPicker(resp.access_token);
        },
    });
    gisInited = true;
}

function showPicker(accessToken) {
    if (gapiInited && gisInited) {
        const view = new google.picker.View(google.picker.ViewId.DOCS);
        view.setMimeTypes('application/vnd.google-apps.document,application/vnd.google-apps.spreadsheet,application/pdf');
        const picker = new google.picker.PickerBuilder()
            .setAppId(null)
            .setOAuthToken(accessToken)
            .setDeveloperKey(GOOGLE_API_KEY)
            .addView(view)
            .setCallback(pickerCallback)
            .build();
        picker.setVisible(true);
    } else {
        alert("La API de Google no ha cargado completamente. Intente de nuevo en unos segundos.");
    }
}

async function pickerCallback(data) {
    if (data.action === google.picker.Action.PICKED) {
        const materialsToInsert = [];
        for (const doc of data.docs) {
            const unit = prompt(`¿A qué unidad pertenece el material "${doc.name}"? (Ej: 1)`, "1");
            if (unit) {
                materialsToInsert.push({
                    materia_id: currentMateriaId,
                    unit_number: parseInt(unit),
                    title: doc.name,
                    description: doc.description || "Sin descripción.",
                    drive_file_link: doc.url,
                });
            }
        }

        if (materialsToInsert.length > 0) {
            const { error } = await supabaseClient.from('materials').insert(materialsToInsert);
            if (error) {
                console.error("Error guardando el material:", error);
                alert("No se pudieron guardar los materiales seleccionados.");
            } else {
                alert("¡Materiales añadidos con éxito!");
                loadMaterials();
            }
        }
    }
}

// --- LÓGICA DE ASISTENCIA MANUAL ---

async function loadStudentsForManualAttendance() {
    const { data, error } = await supabaseClient.from('enrollments').select(`students (*)`).eq('materia_id', currentMateriaId);
    if (error) {
        console.error("Error cargando alumnos para asistencia manual:", error);
        manualAttendanceList.innerHTML = "<p>No se pudieron cargar los alumnos.</p>";
        return;
    }
    if (data.length === 0) {
        manualAttendanceList.innerHTML = "<p>No hay alumnos inscritos en esta materia.</p>";
        return;
    }
    manualAttendanceList.innerHTML = '';
    data.forEach(enrollment => {
        const student = enrollment.students;
        const studentElement = document.createElement('div');
        studentElement.classList.add('manual-student-item');
        studentElement.style.padding = '0.5rem 0';
        studentElement.innerHTML = `
            <input type="checkbox" id="student-${student.id}" data-studentid="${student.id}" style="margin-right: 0.5rem;">
            <label for="student-${student.id}">${student.first_name} ${student.last_name} (${student.student_id})</label>
        `;
        manualAttendanceList.appendChild(studentElement);
    });
}

async function handleSaveManualAttendance() {
    const unitNumber = unitNumberInput.value;
    if (!unitNumber) {
        alert("Por favor, selecciona una unidad antes de guardar la asistencia.");
        return;
    }
    const checkboxes = manualAttendanceList.querySelectorAll('input[type="checkbox"]');
    const attendanceRecords = [];
    const today = new Date().toISOString().slice(0, 10);
    checkboxes.forEach(box => {
        if (box.checked) {
            attendanceRecords.push({
                materia_id: currentMateriaId,
                student_id: box.dataset.studentid,
                unit_number: unitNumber,
                attendance_date: today,
                status: 'Presente'
            });
        }
    });
    if (attendanceRecords.length === 0) {
        alert("No has seleccionado ningún alumno.");
        return;
    }
    const { error } = await supabaseClient.from('attendance').insert(attendanceRecords);
    if (error) {
        console.error("Error al guardar la asistencia manual:", error);
        alert("Hubo un error al guardar la asistencia. Es posible que para algunos alumnos ya exista un registro hoy.");
    } else {
        alert("¡Asistencia guardada con éxito!");
        checkboxes.forEach(box => box.checked = false);
    }
}

// --- LÓGICA DE GESTIÓN DE UNIDADES (NUEVO) ---

const createUnitForm = document.getElementById('create-unit-form');
const unitsListContainer = document.getElementById('units-list');

async function loadUnits() {
    const { data: units, error } = await supabaseClient
        .from('unidades')
        .select('*')
        .eq('materia_id', currentMateriaId)
        .order('unit_number', { ascending: true });

    if (error) {
        console.error('Error cargando unidades:', error);
        unitsListContainer.innerHTML = '<p>Error al cargar las unidades.</p>';
        return;
    }

    unitsListContainer.innerHTML = '';
    if (units.length === 0) {
        unitsListContainer.innerHTML = '<p>Aún no has creado ninguna unidad para esta materia.</p>';
        return;
    }

    units.forEach(unit => {
        const unitElement = document.createElement('div');
        unitElement.classList.add('activity-item');
        unitElement.innerHTML = `
            <h4>Unidad ${unit.unit_number} (Ponderación: ${unit.ponderation}%)</h4>
            <form class="update-unit-form" data-unit-id="${unit.id}">
                <div class="input-group">
                    <label>URL Sheet Asistencias</label>
                    <input type="url" name="sheet_asistencias_url" value="${unit.sheet_asistencias_url || ''}" placeholder="Pega la URL aquí">
                </div>
                <div class="input-group">
                    <label>URL Sheet Actividades</label>
                    <input type="url" name="sheet_actividades_url" value="${unit.sheet_actividades_url || ''}" placeholder="Pega la URL aquí">
                </div>
                <div class="input-group">
                    <label>URL Sheet Evaluaciones</label>
                    <input type="url" name="sheet_evaluaciones_url" value="${unit.sheet_evaluaciones_url || ''}" placeholder="Pega la URL aquí">
                </div>
                <div class="input-group">
                    <label>URL Sheet Promedio de Unidad</label>
                    <input type="url" name="sheet_promedio_unidad_url" value="${unit.sheet_promedio_unidad_url || ''}" placeholder="Pega la URL aquí">
                </div>
                <button type="submit" class="btn btn-secondary" style="font-size: 0.8rem;">Guardar URLs de Unidad</button>
            </form>
        `;
        unitsListContainer.appendChild(unitElement);
    });

    document.querySelectorAll('.update-unit-form').forEach(form => {
        form.addEventListener('submit', handleUpdateUnitURLs);
    });
}

async function handleCreateUnit(event) {
    event.preventDefault();
    const unitNumber = document.getElementById('unit_number_input').value;
    const ponderation = document.getElementById('unit_ponderation').value;

    const { error } = await supabaseClient
        .from('unidades')
        .insert({
            materia_id: currentMateriaId,
            unit_number: unitNumber,
            ponderation: ponderation
        });

    if (error) {
        console.error('Error creando unidad:', error);
        alert(`Error al crear la unidad: ${error.message}`);
    } else {
        alert('¡Unidad creada con éxito!');
        createUnitForm.reset();
        loadUnits();
    }
}

async function handleUpdateUnitURLs(event) {
    event.preventDefault();
    const form = event.target;
    const unitId = form.dataset.unitId;
    const formData = new FormData(form);
    const updates = {
        sheet_asistencias_url: formData.get('sheet_asistencias_url'),
        sheet_actividades_url: formData.get('sheet_actividades_url'),
        sheet_evaluaciones_url: formData.get('sheet_evaluaciones_url'),
        sheet_promedio_unidad_url: formData.get('sheet_promedio_unidad_url')
    };

    const { error } = await supabaseClient
        .from('unidades')
        .update(updates)
        .eq('id', unitId);

    if (error) {
        console.error('Error actualizando URLs de la unidad:', error);
        alert('Hubo un error al guardar las URLs.');
    } else {
        alert('URLs de la unidad guardadas con éxito.');
    }
}

createUnitForm.addEventListener('submit', handleCreateUnit);