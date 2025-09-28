// supabase/functions/writeSheetsData/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Esta función simula la escritura de datos consolidados en Google Sheets.

serve(async (req) => {
    // 1. Obtener los parámetros de la petición
    const { subject_id, unit, data_type, sheet_data } = await req.json();

    // 2. Lógica de simulación (simplemente registramos que se recibió la petición)
    console.log(`[MOCK WRITE] Received data for: ${data_type}`);
    console.log(`Payload: ${JSON.stringify(sheet_data)}`);

    // 3. Devolver el éxito al frontend
    return new Response(
        JSON.stringify({
            data: {
                success: true,
                message: `Simulated writing of ${data_type} data for Unit ${unit} in ${subject_id}.`,
            },
        }),
        {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        },
    );
});
