// supabase/functions/google-api-handler/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SignJWT, JWTPayload } from 'https://deno.land/x/jose@v4.14.4/index.ts';

// Lee las claves desde Supabase Secrets
const GOOGLE_CLIENT_EMAIL = Deno.env.get("GOOGLE_CLIENT_EMAIL");
const GOOGLE_PRIVATE_KEY = Deno.env.get("GOOGLE_PRIVATE_KEY")?.replace(/\\n/g, '\n');
const GOOGLE_SHEETS_API_URL = "https://sheets.googleapis.com/v4/spreadsheets";
const GOOGLE_FORMS_API_URL = "https://forms.googleapis.com/v1/forms";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY"); 
const GEMINI_MODEL = "gemini-2.5-flash"; 

// Función REAL para obtener un Token JWT de Google Service Account
async function getGoogleToken() {
    if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
        throw new Error("Credenciales de Google Service Account (email/key) no configuradas.");
    }

    const now = Math.floor(Date.now() / 1000);
    const expirationTime = now + 3600; // 1 hora
    
    // Scopes de acceso necesarios para la creación
    const SCOPES = [
        "https://www.googleapis.com/auth/spreadsheets", // Lectura/Escritura en Sheets
        "https://www.googleapis.com/auth/forms",       // Creación de Forms
        "https://www.googleapis.com/auth/drive.file"   // Creación de archivos en Drive
    ].join(' ');

    // 1. Procesar y convertir la clave PEM a un objeto CryptoKey
    const pkcs8Key = GOOGLE_PRIVATE_KEY
        .replace(/-----BEGIN PRIVATE KEY-----/g, '').replace(/-----END PRIVATE KEY-----/g, '').replace(/\s/g, '');
    
    const pkcs8Der = Uint8Array.from(atob(pkcs8Key), c => c.charCodeAt(0));

    const privateKey = await crypto.subtle.importKey(
        "pkcs8",
        pkcs8Der,
        { name: "RSASSA-PKCS1-V1_5", hash: "SHA-256" },
        false,
        ["sign"]
    );

    // 2. Crear y firmar el JWT (Assertion)
    const assertion = await new SignJWT({
        scope: SCOPES,
    } as JWTPayload)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(expirationTime)
    .setIssuer(GOOGLE_CLIENT_EMAIL)
    .setSubject(GOOGLE_CLIENT_EMAIL)
    .setAudience("https://oauth2.googleapis.com/token")
    .sign(privateKey);

    // 3. Intercambiar el JWT por el Token de Acceso
    const params = new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        assertion: assertion,
    });
    
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
    });

    const data = await response.json();
    if (data.error) throw new Error(`Google Token Error: ${data.error_description || data.error}`);
    
    return data.access_token;
}
// ----------------------------------------------------------------------


serve(async (req) => {
    try {
        const payload = await req.json();
        const { action } = payload;
        const authHeader = req.headers.get("Authorization")!;
        
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } }
        );

        const googleToken = await getGoogleToken();

        // ----------------------------------------------------------------------
        // ACCIÓN 1: CREAR MATERIA (HOJA DE CÁLCULO)
        // ----------------------------------------------------------------------
        if (action === 'createSubjectFolders') {
            const { subjectName, semester, materiaId } = payload;
            
            // 1. LLAMADA REAL PARA CREAR HOJA DE CÁLCULO
            const sheetResponse = await fetch(GOOGLE_SHEETS_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${googleToken}`, 
                },
                body: JSON.stringify({
                    properties: {
                        title: `${subjectName} - ${semester} - Reportes Docente`,
                    }
                    // NOTA: Para crear en una carpeta específica de Drive, necesitarías enviar el 'folderId' 
                    // en el body del request a la API de Drive, no la de Sheets. Aquí asumimos la creación en el Drive de la S.A.
                }),
            });

            if (!sheetResponse.ok) {
                const errorBody = await sheetResponse.json();
                throw new Error(`Google Sheet API Error: ${sheetResponse.status} - ${JSON.stringify(errorBody)}`);
            }
            
            const sheetJson = await sheetResponse.json();
            const sheetId = sheetJson.spreadsheetId; 
            
            if (!sheetId) throw new Error("Could not retrieve Sheet ID after creation.");
            
            // 2. GUARDAR EL SHEET ID EN SUPABASE
            const { error } = await supabaseClient
                .from('materias')
                .update({ google_sheet_id: sheetId })
                .eq('id', materiaId);

            if (error) throw error;

            return new Response(
                JSON.stringify({ data: { success: true, sheetId: sheetId } }),
                { headers: { 'Content-Type': 'application/json' }, status: 200 },
            );
        }

        // ----------------------------------------------------------------------
        // ACCIÓN 2: CREAR FORMULARIO DE EVALUACIÓN (Google Forms)
        // ----------------------------------------------------------------------
        if (action === 'createGoogleForm') {
            const { evaluationTitle } = payload;
            
            // LLAMADA REAL para la creación de Formulario
            const formResponse = await fetch(`${GOOGLE_FORMS_API_URL}`, {
                 method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${googleToken}`, 
                },
                body: JSON.stringify({
                    info: { title: evaluationTitle },
                }),
            });

            if (!formResponse.ok) {
                const errorBody = await formResponse.json();
                throw new Error(`Google Forms API Error: ${formResponse.status} - ${JSON.stringify(errorBody)}`);
            }

            const formJson = await formResponse.json();
            // La URL para el estudiante es 'responderUri' en la respuesta de la API
            const formUrl = formJson.responderUri || `https://docs.google.com/forms/d/e/${formJson.formId}/viewform`;
            
            return new Response(
                JSON.stringify({ data: { success: true, formUrl: formUrl, message: 'Google Form creation request successful.' } }),
                { headers: { 'Content-Type': 'application/json' }, status: 200 },
            );
        }
        
        // ----------------------------------------------------------------------
        // ACCIÓN 3: CALIFICAR CON GEMINI (Implementación REAL)
        // ----------------------------------------------------------------------
        if (action === 'gradeWithGemini') {
            const { prompt, rubric } = payload;

            if (!GEMINI_API_KEY) {
                 throw new Error("GEMINI_API_KEY no configurada. No se puede conectar al modelo de IA.");
            }
            
            const systemPrompt = `You are a teacher grading assistant. Evaluate the student's work based on the 'rubric' and assign a single numeric grade from 0 to 100. Your response MUST be strict JSON with the fields: { "grade": number (integer), "feedback": "text based on the rubric" }. DO NOT include any text outside the JSON object.`;
            
            const userPrompt = `RÚBRICA: ${rubric}\n\nTRABAJO DEL ESTUDIANTE: ${prompt}`;

            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
                    config: { systemInstruction: systemPrompt, responseMimeType: "application/json" }
                }),
            });

            if (!geminiResponse.ok) {
                 throw new Error(`Gemini API HTTP Error: ${geminiResponse.status}.`);
            }
            
            const result = await geminiResponse.json();
            
            const jsonText = result.candidates[0].content.parts[0].text;
            const parsedJson = JSON.parse(jsonText);

            return new Response(
                JSON.stringify({
                    data: {
                        success: true,
                        grade: parsedJson.grade.toString(),
                        feedback: parsedJson.feedback,
                    }
                }),
                { headers: { 'Content-Type': 'application/json' }, status: 200 },
            );
        }


        // Si la acción no es reconocida
        return new Response(JSON.stringify({ error: "Action not recognized." }), { status: 400 });
        
    } catch (error) {
        // En caso de error, devuelve el mensaje de error al frontend
        return new Response(JSON.stringify({ error: `Fallo al procesar la solicitud de Google API: ${(error as Error).message}` }), { status: 500 });
    }
});