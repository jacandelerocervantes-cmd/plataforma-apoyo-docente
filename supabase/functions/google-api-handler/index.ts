// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { google } from "npm:googleapis@126.0.1";
// @ts-ignore
import { JWT } from "npm:google-auth-library@9.0.0";

// --- Lógica de Autenticación de Google ---
const initializeApis = () => {
  const credentials = {
    client_email: Deno.env.get("GOOGLE_CLIENT_EMAIL"),
    private_key: Deno.env.get("GOOGLE_PRIVATE_KEY")?.replace(/\\n/g, "\n"),
  };

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error("Credenciales de Google no encontradas en las variables de entorno.");
  }

  const auth = new JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/forms.body',
      'https://www.googleapis.com/auth/forms.responses.readonly',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/documents',
    ],
  );

  return {
    drive: google.drive({ version: 'v3', auth }),
    sheets: google.sheets({ version: 'v4', auth }),
    forms: google.forms({ version: 'v1', auth }),
  };
};

console.log("Función 'google-api-handler' inicializada.");

// --- Servidor de la Función ---
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });
  }

  try {
    const { action, params } = await req.json();
    const { drive, sheets, forms } = initializeApis();
    let resultData: unknown = {};

    console.log(`Acción recibida: ${action}`);

    switch (action) {
      case "createSubjectFolders": {
        const { subjectName, semester, units = 3 } = params;
        if (!subjectName || !semester) throw new Error("Faltan parámetros: subjectName y semester.");
        
        const semesterFolder = await drive.files.create({ resource: { name: semester, mimeType: 'application/vnd.google-apps.folder' }, fields: 'id' });
        const subjectFolder = await drive.files.create({ resource: { name: subjectName, mimeType: 'application/vnd.google-apps.folder', parents: [semesterFolder.data.id] }, fields: 'id' });
        
        for (let i = 1; i <= units; i++) {
          await drive.files.create({ resource: { name: `Unidad ${i}`, mimeType: 'application/vnd.google-apps.folder', parents: [subjectFolder.data.id] } });
        }
        
        const mainSheet = await sheets.spreadsheets.create({ resource: { properties: { title: `Calificaciones - ${subjectName}` } } });
        await drive.files.update({ fileId: mainSheet.data.spreadsheetId, addParents: subjectFolder.data.id, removeParents: 'root' });

        resultData = { success: true, message: "Estructura creada con éxito.", folderId: subjectFolder.data.id };
        break;
      }
      // Aquí irían los otros 'case' para las demás funciones (gradeWithGemini, etc.)
      default:
        throw new Error(`Acción desconocida: ${action}`);
    }

    return new Response(JSON.stringify(resultData), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
});