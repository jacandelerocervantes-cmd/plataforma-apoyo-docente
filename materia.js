// --- CONFIGURACIÓN DE SUPABASE ---
const supabaseUrl = 'https://pyurfviezihdfnxfgnxw.supabase.co'; // Reemplaza con tu URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dXJmdmllemloZGZueGZnbnd4dyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjg4NzI0NTc0LCJleHAiOjE5MDQyODQ1NzR9.Dl8jv1kYk3jX1KXoX1m8n2rQZ2p6kU1iU5rXH3b7m0';     // Reemplaza con tu Anon Keyy
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
// --- CONFIGURACIÓN DE GOOGLE API ---
// 👇 REEMPLAZA ESTOS VALORES 👇
const GOOGLE_API_KEY = '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCmWOD7X6qC67Gg\nGEnekAL45Y9BOWNw+Ex/fjzXZfOP/HAp8GgPhThPMmPtzMyQLXaqEDE6eLkBctrx\ny5S7kltkjeZzdhpOc6x7Fm6mV9rhY9Kds5Bp7X9eUR8md9gPfh+SpuV59ONNb6kp\n25dccsp686tc4HvN/l2wKnNiKku7mZ5UvWSYJmE3phfQMAtgX3LcqmI5qYYx47g3\nDNzzjuKmwV14UuEbu/88yjC+rJvJHk4yjyeWBrAv5dcMj7ggmnIU5hr9rmkVw/VM\nDvhheBVGv5Y5q+9/Z23Y+dh1FAXhWyYMqr3k8uinoK8Edw7SzHeVH41w9yZtYQAD\nPuDVICCBAgMBAAECggEAG1vbVuSfU+yFWI4eGh2H650/4Cua5BHmbQKbaZbSRgBw\nBynLx5+yyO3B+zK3g1AC6AoFOrdvwCH+ig2gXvA9mU5wVFWckoIaYF0qYi/pZzAG\njBrkGdPuopnHfIlx7uxgr3tFGzeQaeQ/R4ve+1zC2hF5AevG2PSovohg1UidD5O6\nx9M8ehrqq3wQqosKq/+UOw6sKhhlXLOrHhBt+mmc5/1MpJijv0OBc3dXNEdCUue7\nzJ40NAfC3B1VGH6fNtlMmJ9AHhbB1BBIOwB6E52eYa+MrC47vFcLNE26rXLlYiC7\nP5GreaqZga2N63nW2Q7WMO1KpeadvJ79i+JHrrq15QKBgQDVjLPupKz3d91+2mgS\nlTFuUg9kOaEAGdAkJ5GpncuGrIhhKo23IQk5nff9ZsGn8eWDu66/Rg7x/85K8f/o\nPY7+9kDuf6LTUprMW/w8GH4Icm8sNr7kYoBheFhrRJc1cglCYbC8ZSEWymGvQUT0\navOR38qdiQwFaXeSfXnWUGlCvQKBgQDHahj/jAsswqhh5GKL5BsW0fEx75vCe69h\nK22vfoE8h4hl3vrEOQyRNzoFg56Unw5/lTAhSwK8bWYvmA9RNvLhlDOeBfRDmJXj\na2FpsljL7hQ73ukgZ0a84GK/499yo0uD6S5QrN3QyfQO5Y/4E6vcTYZlSC272cFe\nZYC+wRozFQKBgHeRs8HAVNSvOcboVXNqM+Y4bkPI/LvIuEE2IpodLzM18ZquL/FE\nvxyStaMd4Pq/N6pd8QdKG94mRAS0oXwQ07sweMTRlILMcr5QFtgzQoZKRLM16AaK\nnKV2s9ND8YJMWqDfgAzMdw2CvdVaL1jHdZ/M9W7lqGRzXC8asJhuJ7HlAoGAPdzZ\nMnXUhadBq1S5iaJTEQpCI/asQHI0XxWk6lt5Zji5hLje3H7COk6CrnE9geeyDLxQ\neROXHrNljwBCSDSetoJOXQiF1W6BmVKXnr2YNHOATW6Cre28ER4fJF5h1GN6Ksrs\n9lQaYAo2r2Rh/FjF6QsX1VXF8k/EYC9m+EZZhV0CgYBGKbY7urzgfZ84hInZ5OFK\nZink8b9ef8VR2OaiYz2tnfOC4GPW5MMLDr3NPDXUzlYXLyKbO3dIEfpdJOG2echt\nWHvsPzUGtg5YFyqUFtCASamthCJvk4gIbnpHX2P95cVeprj1PTRCJET1UhTtSLRm\njeN9SUdcMScX6rLQd9NNbw==\n-----END PRIVATE KEY-----\n'; // La Clave de API de navegador que creaste
const GOOGLE_CLIENT_ID = 'plataforma-docente-service@integral-server-452521-p8.iam.gserviceaccount.com'; // El ID de Cliente OAuth 2.0
// ------------------------------------
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
let tokenClient;
let gapiInited = false;
let gisInited = false;

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

// Pestaña de Asistencia
const generateQRBtn = document.getElementById('generate-qr-btn');
const qrSessionActiveDiv = document.getElementById('qr-session-active');
const qrcodeContainer = document.getElementById('qrcode-container');
const timerElement = document.getElementById('timer');
const renewQRBtn = document.getElementById('renew-qr-btn');
const cancelQRBtn = document.getElementById('cancel-qr-btn');
const unitNumberInput = document.getElementById('unit-number');
const realtimeAttendanceList = document.getElementById('realtime-attendance-list');

// Pestaña de Alumnos
const addStudentForm = document.getElementById('add-student-form');
const studentList = document.getElementById('student-list');

// Pestaña de Actividades
const addActivityForm = document.getElementById('add-activity-form');
const activitiesList = document.getElementById('activities-list');
const activitiesPanel = document.querySelector('.activities-panel');
const gradingPanel = document.getElementById('grading-panel');
const gradingActivityTitle = document.getElementById('grading-activity-title');
const gradingStudentList = document.getElementById('grading-student-list');
const backToActivitiesBtn = document.getElementById('back-to-activities-btn');
const gradingForm = document.getElementById('grading-form');

// Pestaña de Evaluaciones
const addEvaluationForm = document.getElementById('add-evaluation-form');
const evaluationsList = document.getElementById('evaluations-list');
const evaluationsPanel = document.querySelector('.evaluations-panel');
const evaluationGradingPanel = document.getElementById('evaluation-grading-panel');
const evaluationGradingTitle = document.getElementById('evaluation-grading-title');
const evaluationGradingStudentList = document.getElementById('evaluation-grading-student-list');
const backToEvaluationsBtn = document.getElementById('back-to-evaluations-btn');
const evaluationGradingForm = document.getElementById('evaluation-grading-form');

// Pestaña de Material Didáctico
const addMaterialBtn = document.getElementById('add-material-btn');
const materialsList = document.getElementById('materials-list');


// --- INICIALIZACIÓN DE LA PÁGINA ---
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    currentMateriaId = params.get('id');

    if (!currentMateriaId) {
        alert("ID de materia no encontrado.");
        window.location.href = '/dashboard.html';
        return;
    }

    // Cargar toda la información inicial
    loadMateriaDetails();
    loadEnrolledStudents();
    loadActivities();
    loadEvaluations();
    loadMaterials();
    setupEventListeners();
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
    // Listener para el cambio de pestañas
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            tabs.forEach(item => item.classList.remove('active'));
            tab.classList.add('active');
            const targetTab = tab.getAttribute('data-tab');
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${targetTab}-content`) {
                    content.classList.add('active');
                }
            });
             tabContents.forEach(content => {
                content.style.display = content.classList.contains('active') ? 'block' : 'none';
            });
        });
    });

    // Listeners de Asistencia
    generateQRBtn.addEventListener('click', createNewAttendanceSession);
    renewQRBtn.addEventListener('click', renewSession);
    cancelQRBtn.addEventListener('click', cancelSession);

    // Listener de Alumnos
    addStudentForm.addEventListener('submit', handleAddStudent);

    // Listeners de Actividades
    addActivityForm.addEventListener('submit', handleAddActivity);
    backToActivitiesBtn.addEventListener('click', showActivitiesPanel);
    gradingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSaveGrades(currentGradingActivityId);
    });
    
    // Listeners de Evaluaciones
    addEvaluationForm.addEventListener('submit', handleAddEvaluation);
    backToEvaluationsBtn.addEventListener('click', showEvaluationsPanel);
    evaluationGradingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSaveEvaluationGrades(currentGradingEvaluationId);
    });
    
    // Listener de Material Didáctico
    addMaterialBtn.addEventListener('click', () => {
        // Solicitar un token de acceso y luego mostrar el selector
        if (gapiInited && gisInited) {
            tokenClient.requestAccessToken({ prompt: '' });
        } else {
            alert("La API de Google no ha cargado completamente. Intente de nuevo en unos segundos.");
        }
    });
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
            <button class="btn btn-secondary" style="margin-top: 10px; font-size: 0.8rem; padding: 0.4rem 0.8rem;">Calificar</button>
        `;
        activityElement.querySelector('button').addEventListener('click', () => showGradingPanel(activity));
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
    activitiesPanel.classList.remove('hidden');
}

async function showGradingPanel(activity) {
    currentGradingActivityId = activity.id;
    activitiesPanel.classList.add('hidden');
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
            <button class="btn btn-secondary" style="margin-top: 10px; font-size: 0.8rem; padding: 0.4rem 0.8rem;">Calificar</button>
        `;
        evalElement.querySelector('button').addEventListener('click', () => showEvaluationGradingPanel(evaluation));
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
    evaluationsPanel.classList.remove('hidden');
}

async function showEvaluationGradingPanel(evaluation) {
    currentGradingEvaluationId = evaluation.id;
    evaluationsPanel.classList.add('hidden');
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
    gapi.load('client:picker', () => {
        gapiInited = true;
    });
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: async (resp) => {
            if (resp.error !== undefined) {
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
        const picker = new google.picker.PickerBuilder()
            .setAppId(null)
            .setOAuthToken(accessToken)
            .addView(view)
            .setCallback(pickerCallback)
            .build();
        picker.setVisible(true);
    }
}

async function pickerCallback(data) {
    if (data.action === google.picker.Action.PICKED) {
        const materialsToInsert = [];
        for (const doc of data.docs) {
            const unit = prompt(`¿A qué unidad pertenece el material "${doc.name}"?`, "1");
            if (unit) { // Proceed only if the user provides a unit
                materialsToInsert.push({
                    materia_id: currentMateriaId,
                    unit_number: parseInt(unit),
                    title: doc.name,
                    description: doc.description,
                    drive_file_link: doc.url,
                });
            }
        }

        if (materialsToInsert.length > 0) {
            const { error } = await supabaseClient
                .from('materials').insert(materialsToInsert);
            
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
