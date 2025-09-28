// supabase/functions/writeSheetsData/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SignJWT, JWTPayload } from 'https://deno.land/x/jose@v4.14.4/index.ts';

// Lee las claves desde Supabase Secrets
const GOOGLE_CLIENT_EMAIL = Deno.env.get("GOOGLE_CLIENT_EMAIL");
const GOOGLE_PRIVATE_KEY = Deno.env.get("GOOGLE_PRIVATE_KEY")?.replace(/\\n/g, '\n'); 
const GOOGLE_SHEETS_API_URL = "https://sheets.googleapis.com/v4/spreadsheets";

// Función REAL para obtener un Token JWT de Google
async function getGoogleToken() {
    if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
        throw new Error("Credenciales de Google Service Account (email/key) no configuradas.");
    }

    const now = Math.floor(Date.now() / 1000);
    const expirationTime = now + 3600; // 1 hora
    
    // Scopes de acceso necesarios (lectura y escritura para escribir datos)
    const SCOPES = [
        "https://www.googleapis.com/auth/spreadsheets", // Lectura y escritura
        "https://www.googleapis.com/auth/drive.file"
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


serve(async (req) => {
    try {
        const { subject_id, unit, data_type, sheet_data } = await req.json();
        const authHeader = req.headers.get("Authorization")!;

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } }
        );

        // 1. Obtener el Sheet ID de la materia
        const { data: materia, error } = await supabaseClient
            .from('materias')
            .select('google_sheet_id')
            .eq('id', subject_id)
            .single();

        if (error || !materia || !materia.google_sheet_id) {
            console.error("WRITE FAILED: Sheet ID not found or DB error.");
            throw new Error("Sheet ID not found. Cannot connect to Google Sheet.");
        }

        const SHEET_ID = materia.google_sheet_id;
        const googleToken = await getGoogleToken();

        // 2. Definir la hoja y el rango para añadir la fila
        const sheetName = data_type === 'asistencias' ? 'Asistencia' : 'Calificaciones';
        const range = `${sheetName}!A1:Z`; // Rango amplio para asegurar que se puede añadir la fila
        
        // 3. ESTRUCTURAR LOS DATOS para Google Sheets (ejemplo)
        // Nota: En producción, 'sheet_data' debe ser un array de arrays [[col1, col2], [col1, col2]]
        const valuesToWrite = [
            [new Date().toISOString().split('T')[0], unit, JSON.stringify(sheet_data)] 
        ];

        // 4. LLAMADA REAL DE ESCRITURA (Append)
        const sheetsApiUrl = `${GOOGLE_SHEETS_API_URL}/${SHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED`;
        
        const sheetResponse = await fetch(sheetsApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${googleToken}`,
                'Content-Type': 'application/json',
            },
            // El body debe ser un objeto 'ValueRange' de Google Sheets API
            body: JSON.stringify({ values: valuesToWrite }),
        });
        
        if (!sheetResponse.ok) {
            const errorBody = await sheetResponse.json();
            throw new Error(`Google Sheets Write API Error: ${sheetResponse.status} - ${JSON.stringify(errorBody)}`);
        }
        
        return new Response(
            JSON.stringify({ data: { success: true, message: `Data successfully written to Sheet ID: ${SHEET_ID}. Type: ${data_type}` } }),
            { headers: { 'Content-Type': 'application/json' }, status: 200 }
        );
    } catch (error) {
        console.error("Error in writeSheetsData:", (error as Error).message);
        return new Response(
            JSON.stringify({ data: { success: false, message: `Fallo al escribir en la hoja de cálculo: ${(error as Error).message}` } }), 
            { headers: { 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});