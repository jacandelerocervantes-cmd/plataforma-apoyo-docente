// supabase/functions/batchGradeActivities/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SignJWT, JWTPayload } from 'https://deno.land/x/jose@v4.14.4/index.ts';

// Variables de entorno
const GOOGLE_CLIENT_EMAIL = Deno.env.get("GOOGLE_CLIENT_EMAIL");
const GOOGLE_PRIVATE_KEY = Deno.env.get("GOOGLE_PRIVATE_KEY")?.replace(/\\n/g, '\n');
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY"); 
const GEMINI_MODEL = "gemini-2.5-flash"; 

// --- FUNCIONES DE ASISTENCIA ---

// Función REAL para obtener un Token JWT de Google (necesario para la API de Drive)
async function getGoogleToken() {
    if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
        throw new Error("Credenciales de Google Service Account (email/key) no configuradas.");
    }

    const now = Math.floor(Date.now() / 1000);
    const expirationTime = now + 3600;
    
    // Scopes de acceso: Drive para ver el archivo y el contenido
    const SCOPES = [
        "https://www.googleapis.com/auth/drive.readonly"
    ].join(' ');

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

    const assertion = await new SignJWT({ scope: SCOPES } as JWTPayload)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt(now).setExpirationTime(expirationTime).setIssuer(GOOGLE_CLIENT_EMAIL)
    .setSubject(GOOGLE_CLIENT_EMAIL).setAudience("https://oauth2.googleapis.com/token").sign(privateKey);

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

// Función para descargar el contenido del archivo de Drive
async function fetchDriveFileContent(fileId: string, accessToken: string): Promise<string> {
    // Usaremos exportar como texto plano, asumiendo que el archivo es un Doc/PDF/etc.
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;

    const response = await fetch(exportUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Drive API Error (${response.status}): ${errorText}`);
    }

    return response.text();
}


// --- LÓGICA PRINCIPAL DEL EDGE FUNCTION ---

serve(async (req) => {
    try {
        const { materiaId, unit, rubric } = await req.json();
        const authHeader = req.headers.get("Authorization")!;
        
        if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY no configurada.");

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } }
        );

        const googleToken = await getGoogleToken(); // Obtiene el token REAL para Drive

        // 1. Obtener actividades pendientes con ID de Drive
        const { data: activities, error: fetchError } = await supabaseClient
            .from('actividades')
            .select('id, name, drive_file_id') // Seleccionamos el ID de Drive
            .eq('materia_id', materiaId)
            .eq('unit', unit)
            .is('grade', null)
            .not('drive_file_id', 'is', null); // Solo las que tienen archivo de Drive
        
        if (fetchError) throw fetchError;

        const updates: Promise<any>[] = [];
        let successCount = 0;

        // 2. Iterar, descargar de Drive, calificar con Gemini
        for (const activity of activities) {
            
            if (!activity.drive_file_id) continue;

            try {
                // A. DESCARGA REAL DEL ARCHIVO DE DRIVE
                const studentWorkContent = await fetchDriveFileContent(
                    activity.drive_file_id, 
                    googleToken
                );
                
                // B. LLAMADA REAL A LA API DE GEMINI
                const systemPrompt = `You are a teacher grading assistant. Evaluate the student's work based on the 'rubric' and assign a single numeric grade from 0 to 100. Your response MUST be strict JSON with the fields: { "grade": number (integer), "feedback": "text based on the rubric" }. DO NOT include any text outside the JSON object.`;
                
                const userPrompt = `RÚBRICA: ${rubric}\n\nTRABAJO DEL ESTUDIANTE (Archivo de Drive): ${studentWorkContent}`;

                const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
                        config: { systemInstruction: systemPrompt, responseMimeType: "application/json" }
                    }),
                });

                if (!geminiResponse.ok) { throw new Error(`Gemini API HTTP Error: ${geminiResponse.status}.`); }
                
                const result = await geminiResponse.json();
                const jsonText = result.candidates[0].content.parts[0].text;
                const parsedJson = JSON.parse(jsonText); 

                // C. AGREGAR ACTUALIZACIÓN
                updates.push(
                    supabaseClient
                        .from('actividades')
                        .update({ 
                            grade: parseFloat(parsedJson.grade), 
                            feedback: parsedJson.feedback 
                        })
                        .eq('id', activity.id)
                );
                successCount++;

            } catch (aiError) {
                // Manejo de error si la IA o Drive fallan para un solo archivo
                updates.push(
                    supabaseClient
                        .from('actividades')
                        .update({ 
                            feedback: `Error al calificar con IA: ${aiError instanceof Error ? aiError.message.substring(0, 200) : 'Error desconocido'}` 
                        })
                        .eq('id', activity.id)
                );
            }
        }
        
        // 3. Ejecutar todas las actualizaciones
        await Promise.all(updates);

        return new Response(
            JSON.stringify({ 
                data: { 
                    success: true, 
                    message: `Calificación por lote completada. ${successCount} de ${activities.length} actividades procesadas por IA.`
                } 
            }),
            { headers: { 'Content-Type': 'application/json' }, status: 200 },
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: `Error fatal en el lote: ${(error as Error).message}` }), 
            { status: 500 }
        );
    }
});