import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { google } from 'https://esm.sh/googleapis@105.0.0';

// El nombre de la carpeta raíz que crearemos en Google Drive.
const ROOT_FOLDER_NAME = 'Plataforma de Apoyo Docente';

// Configuración de CORS para permitir que tu app web llame a la función.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Manejar la solicitud OPTIONS pre-vuelo de CORS.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Obtener el token de acceso del usuario desde la solicitud.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized: No access token provided.');
    }
    const accessToken = authHeader.split('Bearer ')[1];

    // 2. Configurar un cliente de OAuth2 con el token del usuario.
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    // 3. Inicializar el cliente de la API de Google Drive.
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // 4. Buscar la carpeta raíz para ver si ya existe.
    const searchResponse = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${ROOT_FOLDER_NAME}' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    const files = searchResponse.data.files;
    if (files && files.length > 0) {
      // Si la carpeta ya existe, devolvemos su ID.
      const data = { message: 'Folder already exists.', folderId: files[0].id };
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      // 5. Si la carpeta no existe, la creamos.
      const fileMetadata = {
        name: ROOT_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      };
      const createResponse = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id',
      });
      
      const newFolderId = createResponse.data.id;
      const data = { message: 'Folder created successfully.', folderId: newFolderId };
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });
    }
  } catch (error) {
    console.error('Error en la función setup-drive-folder:', error.message);
    const data = { error: error.message || 'Internal Server Error.' };
    
    // Devolver un error más específico si el token es inválido
    if (error.message.includes('Unauthorized')) {
       return new Response(JSON.stringify({ error: 'Invalid or expired access token.' }), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 401,
       });
    }
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});