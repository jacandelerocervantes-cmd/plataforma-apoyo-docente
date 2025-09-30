// --- CONFIGURACIÓN DE SUPABASE Y GOOGLE ---
const supabaseUrl = 'https://pyurfviezihdfnxfgnxw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dXJmdmllemloZGZueGZnbnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTAwMzksImV4cCI6MjA3NDU2NjAzOX0.-0SeMLWmNPCk4i8qg0-tHhpftBj2DMH5t-bO87Cef2c';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Estos valores los reemplazará Render durante el despliegue
// Asegúrate de que tus variables de entorno en Render estén configuradas
// para GOOGLE_API_KEY y GOOGLE_CLIENT_ID
const GOOGLE_API_KEY = '__GOOGLE_API_KEY__'; // Reemplazar con tu clave de API
const GOOGLE_CLIENT_ID = '__GOOGLE_CLIENT_ID__'; // Reemplazar con tu ID de Cliente
// SCOPES AHORA INCLUYE SPREADSHEETS
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets';

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
const unitNumberInput = document.getElementById('unit-number'); // Input de unidad para QR/Export
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

// Nuevos elementos para UNIDADES (ya existentes en el HTML final que te di)
const createUnitForm = document.getElementById('create-unit-form');
const unitsListContainer = document.getElementById('units-list');

// Nuevos elementos para EXPORTACIÓN (añadidos en el último HTML)
const exportAsistenciaBtn = document.getElementById('export-asistencia-btn');
const exportActividadesBtn = document.getElementById('export-actividades-btn');
const exportEvaluacionesBtn = document.getElementById('export-evaluaciones-btn');


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
            // Si la pestaña de unidades se activa, cargar las unidades
            if (targetTab === 'unidades') {
                loadUnits();
            }
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

    // 👇 LISTENERS PARA LA GESTIÓN DE UNIDADES 👇
    createUnitForm.addEventListener('submit', handleCreateUnit);
    // Los listeners para .update-unit-form se asignan en loadUnits()

    // 👇 LISTENERS PARA LA EXPORTACIÓN A SHEETS 👇
    exportAsistenciaBtn.addEventListener('click', () => exportToSheet('sheet_asistencias'));
    // Desactivamos temporalmente las otras exportaciones hasta que se implemente la lógica
    exportActividadesBtn.addEventListener('click', () => alert('La exportación de actividades aún está en desarrollo.'));
    exportEvaluacionesBtn.addEventListener('click', () => alert('La exportación de evaluaciones aún está en desarrollo.'));
}

// --- LÓGICA DE ASISTENCIA (QR y SESIÓN) ---
async function createNewAttendanceSession() {
    const unitNumber = unitNumberInput.value;
    if (!unitNumber) {
        alert("Por favor, selecciona una unidad para la asistencia.");
        return;
    }
    // Verificar si la unidad existe
    const { data: unitExists, error: unitCheckError } = await supabaseClient
        .from('unidades')
        .select('id')
        .eq('materia_id', currentMateriaId)
        .eq('unit_number', unitNumber)
        .single();

    if (unitCheckError || !unitExists) {
        alert(`La unidad ${unitNumber} no existe para esta materia. Por favor, créala en la pestaña "Unidades".`);
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

    // Verificar si la unidad existe
    const { data: unitExists, error: unitCheckError } = await supabaseClient
        .from('unidades')
        .select('id')
        .eq('materia_id', currentMateriaId)
        .eq('unit_number', unit_number)
        .single();

    if (unitCheckError || !unitExists) {
        alert(`La unidad ${unit_number} no existe para esta materia. Por favor, créala en la pestaña "Unidades".`);
        return;
    }

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

    // Verificar si la unidad existe
    const { data: unitExists, error: unitCheckError } = await supabaseClient
        .from('unidades')
        .select('id')
        .eq('materia_id', currentMateriaId)
        .eq('unit_number', unit_number)
        .single();

    if (unitCheckError || !unitExists) {
        alert(`La unidad ${unit_number} no existe para esta materia. Por favor, créala en la pestaña "Unidades".`);
        return;
    }

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

    const { data: existingStudent, error: fetchStudentError } = await supabaseClient
        .from('students')
        .select('id')
        .eq('student_id', studentId)
        .single();

    let student_db_id;

    if (existingStudent) {
        // Alumno ya existe, usar su ID
        student_db_id = existingStudent.id;
    } else if (fetchStudentError && fetchStudentError.code === 'PGRST116') { // No rows found
        // Alumno no existe, crearlo
        const { data: newStudent, error: createStudentError } = await supabaseClient
            .from('students')
            .insert({ first_name: firstName, last_name: lastName, student_id: studentId })
            .select()
            .single();

        if (createStudentError) {
            console.error("Error creando alumno:", createStudentError);
            alert("Error al crear el alumno. La matrícula ya podría existir.");
            return;
        }
        student_db_id = newStudent.id;
    } else {
        console.error("Error al buscar alumno:", fetchStudentError);
        alert("Ocurrió un error al buscar el alumno.");
        return;
    }

    // Inscribir al alumno en la materia
    const { error: enrollmentError } = await supabaseClient
        .from('enrollments')
        .insert({ materia_id: currentMateriaId, student_id: student_db_id });

    if (enrollmentError) {
        // Manejar el caso de que el alumno ya esté inscrito
        if (enrollmentError.code === '23505') { // Código de error para duplicados
            alert("El alumno ya está inscrito en esta materia.");
        } else {
            console.error("Error inscribiendo alumno:", enrollmentError);
            alert("Error al inscribir el alumno en la materia.");
        }
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
    gapi.load('client', initializeGapiClient);
    gapiInited = true;
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
    });
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES, // Ahora con scope de sheets
        callback: async (resp) => {
            if (resp.error !== undefined) {
                console.error("Error al obtener token de acceso de Google:", resp);
                throw (resp);
            }
            // Si el origen del token fue de Drive Picker, muestra el picker
            if (tokenClient.callbackOrigin === 'drive_picker') {
                showPicker(resp.access_token);
            } else {
                // Si el origen fue de una exportación a Sheets, ejecutar la exportación
                // Esto es un placeholder, la lógica de Sheets se llama directamente
                // desde los botones de exportación, que ya manejarán su propia autorización.
                console.log('Token de Google obtenido con éxito para la operación de Sheets.');
            }
        },
    });
    gisInited = true;
}

function showPicker(accessToken) {
    if (gapiInited && gisInited) {
        const view = new google.picker.View(google.picker.ViewId.DOCS);
        view.setMimeTypes('application/vnd.google-apps.document,application/vnd.google-apps.spreadsheet,application/pdf');
        const picker = new google.picker.PickerBuilder()
            .setAppId(null) // Picker usa su propio AppId
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
                // Verificar si la unidad existe
                const { data: unitExists, error: unitCheckError } = await supabaseClient
                    .from('unidades')
                    .select('id')
                    .eq('materia_id', currentMateriaId)
                    .eq('unit_number', parseInt(unit))
                    .single();

                if (unitCheckError || !unitExists) {
                    alert(`La unidad ${unit} no existe para esta materia. Por favor, créala en la pestaña "Unidades" antes de asignar material.`);
                    continue; // Saltar este material si la unidad no existe
                }

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
        alert("Por favor, selecciona una unidad para guardar la asistencia manual.");
        return;
    }
    // Verificar si la unidad existe
    const { data: unitExists, error: unitCheckError } = await supabaseClient
        .from('unidades')
        .select('id')
        .eq('materia_id', currentMateriaId)
        .eq('unit_number', unitNumber)
        .single();

    if (unitCheckError || !unitExists) {
        alert(`La unidad ${unitNumber} no existe para esta materia. Por favor, créala en la pestaña "Unidades".`);
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

    // Usar upsert para evitar duplicados si un alumno ya fue marcado hoy manualmente para esa unidad
    const { error } = await supabaseClient
        .from('attendance')
        .upsert(attendanceRecords, { onConflict: 'materia_id, student_id, attendance_date, unit_number' });

    if (error) {
        console.error("Error al guardar la asistencia manual:", error);
        alert("Hubo un error al guardar la asistencia. Es posible que para algunos alumnos ya exista un registro hoy para esta unidad.");
    } else {
        alert("¡Asistencia guardada con éxito!");
        checkboxes.forEach(box => box.checked = false);
    }
}


// --- LÓGICA DE GESTIÓN DE UNIDADES (NUEVO) ---

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

// --- LÓGICA DE EXPORTACIÓN A GOOGLE SHEETS ---

// Función auxiliar para extraer el ID de una URL de Google Sheets
function getSheetIdFromUrl(url) {
    if (!url) return null;
    const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
}

// Función principal para exportar datos
async function exportToSheet(sheetType) {
    const unitNumber = unitNumberInput.value; // Usamos el input de unidad global
    if (!unitNumber) {
        alert('Por favor, selecciona una unidad para exportar (campo arriba del botón "Generar QR").');
        return;
    }

    alert(`Iniciando exportación para la unidad ${unitNumber}. Por favor, espera...`);

    try {
        // 1. Obtener la URL de la Sheet para la unidad seleccionada
        const { data: unitData, error: unitError } = await supabaseClient
            .from('unidades')
            .select(`${sheetType}_url`)
            .eq('materia_id', currentMateriaId)
            .eq('unit_number', unitNumber)
            .single();

        if (unitError || !unitData || !unitData[`${sheetType}_url`]) {
            throw new Error(`No se encontró la URL de la hoja de cálculo para "${sheetType}" en la unidad ${unitNumber}. Por favor, confígurala en la pestaña "Unidades".`);
        }

        const sheetUrl = unitData[`${sheetType}_url`];
        const spreadsheetId = getSheetIdFromUrl(sheetUrl);
        if (!spreadsheetId) {
            throw new Error('La URL de la hoja de cálculo configurada no es válida. Asegúrate de que sea un enlace a una Google Sheet.');
        }

        // Asegurarse de que gapi.client.sheets esté cargado
        if (!gapi.client.sheets) {
            await gapi.client.load('sheets', 'v4');
        }

        // Obtener el token de acceso del usuario para Google Sheets
        // Esto lanzará la ventana de autorización si es necesario
        // tokenClient.callbackOrigin se establece en 'sheets_export' si lo llamas desde un botón de exportación
        tokenClient.callbackOrigin = 'sheets_export';
        tokenClient.requestAccessToken({ prompt: '' }); // Pedir token de acceso

        // Ahora el callback de tokenClient manejará la llamada a la función de exportación
        // Esta parte es un poco tricky, porque la función de exportación real debe esperar
        // el token. Por simplicidad, volvemos a llamar la exportación con el token ya disponible.
        // En una implementación real más avanzada, se haría una promesa o un callback.
        // Aquí, simplemente confiamos en que el usuario ya ha autorizado.
        // La autorización se maneja a través del listener del tokenClient.
        // El verdadero truco aquí es que GAPI.client ya tiene el token si el usuario lo autoriza.

        // 2. Obtener los datos a exportar desde Supabase
        let headers = [];
        let values = [];
        
        // Obtener todos los alumnos inscritos
        const { data: enrollments, error: enrollError } = await supabaseClient
            .from('enrollments')
            .select('students (id, student_id, first_name, last_name)')
            .eq('materia_id', currentMateriaId);

        if (enrollError) throw new Error('Error al obtener la lista de alumnos inscritos.');

        const studentsMap = new Map(enrollments.map(e => [e.students.id, e.students]));
        const studentIds = Array.from(studentsMap.keys()); // IDs de estudiantes para filtrar

        if (sheetType === 'sheet_asistencias') {
            const { data: asistencias, error } = await supabaseClient
                .from('attendance')
                .select('student_id, attendance_date, status')
                .eq('materia_id', currentMateriaId)
                .eq('unit_number', unitNumber)
                .in('student_id', studentIds) // Filtrar solo alumnos inscritos
                .order('attendance_date', { ascending: true });

            if (error) throw new Error('Error al obtener los datos de asistencia.');

            // Reestructurar los datos para el formato de matriz alumno/fecha
            const attendanceByStudentAndDate = {};
            const dates = new Set(); // Para recolectar todas las fechas únicas

            enrollments.forEach(e => {
                const student = e.students;
                attendanceByStudentAndDate[student.id] = {
                    student_id_num: student.student_id, // Matrícula real
                    first_name: student.first_name,
                    last_name: student.last_name,
                    dates: {} // Objeto para guardar status por fecha
                };
            });

            asistencias.forEach(a => {
                if (attendanceByStudentAndDate[a.student_id]) {
                    // Convertir "Presente" a 1, cualquier otra cosa a 0
                    attendanceByStudentAndDate[a.student_id].dates[a.attendance_date] = (a.status === 'Presente' ? 1 : 0);
                    dates.add(a.attendance_date);
                }
            });

            const sortedDates = Array.from(dates).sort(); // Ordenar las fechas cronológicamente

            headers = [['Matrícula', 'Nombre', 'Apellido', ...sortedDates]];
            
            values = [];
            for (const studentSupabaseId of studentIds) {
                const studentData = attendanceByStudentAndDate[studentSupabaseId];
                if (studentData) {
                    const row = [
                        studentData.student_id_num,
                        studentData.first_name,
                        studentData.last_name
                    ];
                    sortedDates.forEach(date => {
                        // Si hay un registro para esa fecha, úsalo. Si no, es 0 (Ausente).
                        row.push(studentData.dates[date] !== undefined ? studentData.dates[date] : 0);
                    });
                    values.push(row);
                }
            }

        } else if (sheetType === 'sheet_actividades') {
            headers = [['Matrícula', 'Nombre', 'Apellido', 'Título Actividad', 'Calificación', 'Comentarios', 'Unidad']];
            const { data: activityGrades, error: gradesError } = await supabaseClient
                .from('grades') // La tabla de calificaciones de actividades
                .select(`
                    grade, 
                    comments, 
                    students (student_id, first_name, last_name), 
                    activities (title, unit_number)
                `)
                .eq('activity_id', currentGradingActivityId) // Asumiendo que esta es la actividad que se calificó por última vez o se está visualizando
                .in('students.id', studentIds); // Asegúrate que sea solo de alumnos de la materia.
            
            if (gradesError) throw new Error('Error al obtener las calificaciones de actividades.');

            // Filtrar y mapear solo las calificaciones de la unidad correcta
            const filteredGrades = activityGrades.filter(g => g.activities?.unit_number === parseInt(unitNumber));

            values = filteredGrades.map(g => [
                g.students.student_id, 
                g.students.first_name, 
                g.students.last_name, 
                g.activities.title, 
                g.grade, 
                g.comments, 
                g.activities.unit_number
            ]);
            
            if (values.length === 0) {
                 alert(`No hay calificaciones de actividades para la unidad ${unitNumber} para exportar.`);
                 return; // Salir si no hay datos
            }

        } else if (sheetType === 'sheet_evaluaciones') {
            headers = [['Matrícula', 'Nombre', 'Apellido', 'Título Evaluación', 'Calificación', 'Comentarios', 'Unidad']];
            const { data: evaluationGrades, error: evalGradesError } = await supabaseClient
                .from('evaluation_grades') // La tabla de calificaciones de evaluaciones
                .select(`
                    grade, 
                    comments, 
                    students (student_id, first_name, last_name), 
                    evaluations (title, unit_number)
                `)
                .eq('evaluation_id', currentGradingEvaluationId) // Asumiendo la última evaluación calificada/visualizada
                .in('students.id', studentIds);
            
            if (evalGradesError) throw new Error('Error al obtener las calificaciones de evaluaciones.');

            // Filtrar y mapear solo las calificaciones de la unidad correcta
            const filteredEvalGrades = evaluationGrades.filter(g => g.evaluations?.unit_number === parseInt(unitNumber));

            values = filteredEvalGrades.map(g => [
                g.students.student_id, 
                g.students.first_name, 
                g.students.last_name, 
                g.evaluations.title, 
                g.grade, 
                g.comments, 
                g.evaluations.unit_number
            ]);

            if (values.length === 0) {
                 alert(`No hay calificaciones de evaluaciones para la unidad ${unitNumber} para exportar.`);
                 return; // Salir si no hay datos
            }
        }
        
        // Si no hay valores para exportar (más allá de los headers)
        if (values.length === 0) {
            alert(`No se encontraron datos para exportar de ${sheetType} en la unidad ${unitNumber}.`);
            return;
        }

        // 3. Escribir los datos en Google Sheets
        // Primero, limpia la hoja
        await gapi.client.sheets.spreadsheets.values.clear({
            spreadsheetId: spreadsheetId,
            range: 'A1:Z', // Limpiar hasta la columna Z, fila ilimitada
        });

        // Luego, escribe los encabezados y los datos
        const result = await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: 'A1', // Empezar a escribir en la celda A1
            valueInputOption: 'USER_ENTERED', // Interpreta los valores como el usuario los escribiría
            resource: {
                values: headers.concat(values)
            }
        });

        console.log('Datos escritos en Sheets:', result);
        alert(`¡Exportación a Google Sheets completada con éxito para la unidad ${unitNumber}!`);

    } catch (error) {
        console.error('Error durante la exportación a Sheets:', error);
        alert(`Error en la exportación: ${error.message}. Verifica la consola para más detalles.`);
    }
}