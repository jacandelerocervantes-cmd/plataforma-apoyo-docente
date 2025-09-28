// supabase/functions/readSheetsData/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Esta es una simulación de la lógica que obtendría datos de Google Sheets o de la base de datos.

serve(async (req) => {
    // 1. Obtener la data (subject_id y data_type) del cuerpo de la petición.
    const { subject_id, data_type } = await req.json();

    // 2. Ejecutar la lógica de simulación
    let simulatedData: any = {};
    if (data_type === 'asistencias') {
        // Simula la lectura de la asistencia por matrícula
        simulatedData = {
            'A00123456': [true, true, false, true, true, true, true, false, true, true],
            'A00987654': [true, false, true, false, true, true, false, true, true, true],
        };
    } else {
        // Simula la lectura de calificaciones (actividades/evaluaciones)
        simulatedData = [
            { matricula: 'A00123456', grade: 95.5, name: 'Tarea Final' },
            { matricula: 'A00987654', grade: 88.0, name: 'Tarea Final' },
        ];
    }

    // 3. Devolver la respuesta en el formato que espera el frontend
    return new Response(
        JSON.stringify({
            data: {
                success: true,
                data: simulatedData,
                message: `Simulated reading of ${data_type} data for ${subject_id}.`,
            },
        }),
        {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        },
    );
});
