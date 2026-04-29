export interface ActividadPendienteItem {
  acr_id: number;
  consecutivo: string;
  proceso: string;
  cliente: string | null;
  acr_estado: string;
  actividad_descripcion: string;
  actividad_estado: string;
  acr_url: string;
}

export interface ActividadesPendientesData {
  responsable_nombre: string;
  tipo: 'ejecucion' | 'seguimiento';
  actividades: ActividadPendienteItem[];
}

export function buildActividadesPendientesHtml(data: ActividadesPendientesData): string {
  const { responsable_nombre, tipo, actividades } = data;

  const tipoLabel   = tipo === 'ejecucion' ? 'Ejecución' : 'Seguimiento';
  const tipoColor   = tipo === 'ejecucion' ? '#d97706'   : '#2563eb';
  const tipoColorBg = tipo === 'ejecucion' ? '#fffbeb'   : '#eff6ff';
  const tipoColorBd = tipo === 'ejecucion' ? '#fde68a'   : '#bfdbfe';

  const estadoColor = (estado: string) =>
    estado === 'Cerrada' ? '#16a34a' :
    estado === 'Parcial'  ? '#2563eb' :
    '#d97706';

  const actividadesHtml = actividades.map((a, i) => `
    <tr style="background-color:${i % 2 === 0 ? '#ffffff' : '#f8fafc'}">
      <td style="padding:14px 16px; border-bottom:1px solid #e2e8f0; vertical-align:top;">
        <div style="font-size:13px; font-weight:700; color:#1e3a8a; margin-bottom:3px;">${a.consecutivo}</div>
        <div style="font-size:12px; color:#64748b;">${a.proceso}${a.cliente ? ' · ' + a.cliente : ''}</div>
      </td>
      <td style="padding:14px 16px; border-bottom:1px solid #e2e8f0; vertical-align:top;">
        <div style="font-size:14px; color:#1e293b; line-height:1.5;">${a.actividad_descripcion}</div>
      </td>
      <td style="padding:14px 16px; border-bottom:1px solid #e2e8f0; vertical-align:top; text-align:center; white-space:nowrap;">
        <span style="display:inline-block; padding:3px 10px; border-radius:12px; font-size:12px; font-weight:700; color:${estadoColor(a.actividad_estado)}; background-color:${a.actividad_estado === 'Parcial' ? '#eff6ff' : '#fffbeb'}; border:1px solid ${a.actividad_estado === 'Parcial' ? '#bfdbfe' : '#fde68a'};">
          ${a.actividad_estado}
        </span>
      </td>
      <td style="padding:14px 16px; border-bottom:1px solid #e2e8f0; vertical-align:top; text-align:center;">
        <a href="${a.acr_url}" style="display:inline-block; background-color:#2563eb; color:#ffffff; padding:7px 16px; text-decoration:none; border-radius:5px; font-size:12px; font-weight:600; white-space:nowrap;">
          Ver ACR
        </a>
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>[ACR] Actividades Pendientes — ${tipoLabel}</title>
<style>
  body { margin:0; padding:0; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; background-color:#f5f5f5; }
</style>
</head>
<body>
<div style="max-width:700px; margin:20px auto; background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">

  <!-- HEADER -->
  <div style="background-color:#1e3a8a; padding:30px 30px 25px 30px; text-align:center; color:#ffffff; position:relative;">
    <div>
      <img src="https://i.imgur.com/JXCWaXF.png" alt="Solutions &amp; Payroll Logo" style="height:100px; width:auto;" />
    </div>
    <p style="margin:8px 0 0 0; font-size:20px; opacity:0.95; font-weight:400;">Sistema de Gestión de ACR</p>
    <div style="position:absolute; bottom:0; left:0; right:0; height:3px; background-color:#2563eb;"></div>
  </div>

  <!-- CONTENT -->
  <div style="padding:40px 35px;">

    <div style="font-size:16px; color:#1e293b; margin-bottom:20px; line-height:1.5;">
      Hola <strong>${responsable_nombre}</strong>,
    </div>

    <div style="display:inline-flex; align-items:center; gap:8px; background-color:${tipoColorBg}; border:1px solid ${tipoColorBd}; color:${tipoColor}; font-size:13px; font-weight:700; padding:6px 14px; border-radius:20px; margin-bottom:20px; letter-spacing:0.4px; text-transform:uppercase;">
      <span style="width:8px; height:8px; border-radius:50%; background-color:${tipoColor}; display:inline-block;"></span>
      Actividades Pendientes — ${tipoLabel}
    </div>

    <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid ${tipoColor}; padding:20px 24px; margin:0 0 25px 0; border-radius:6px; color:#334155; font-size:15px; line-height:1.6;">
      Tienes <strong>${actividades.length} actividad${actividades.length !== 1 ? 'es' : ''}</strong>
      de <strong>${tipoLabel.toLowerCase()}</strong> pendientes en el Plan de Acción de las siguientes ACRs.
      Por favor revisa y actualiza el estado de cada una a la brevedad posible.
    </div>

    <!-- TABLA DE ACTIVIDADES -->
    <table style="width:100%; border-collapse:collapse; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; font-size:14px;">
      <thead>
        <tr style="background-color:#1e3a8a; color:#ffffff;">
          <th style="padding:12px 16px; text-align:left; font-size:12px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; white-space:nowrap; width:120px;">ACR</th>
          <th style="padding:12px 16px; text-align:left; font-size:12px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase;">Actividad</th>
          <th style="padding:12px 16px; text-align:center; font-size:12px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; white-space:nowrap; width:90px;">Estado</th>
          <th style="padding:12px 16px; text-align:center; font-size:12px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; width:90px;">Acción</th>
        </tr>
      </thead>
      <tbody>
        ${actividadesHtml}
      </tbody>
    </table>

    <p style="color:#64748b; font-size:13px; text-align:center; margin-top:30px; padding:15px; background-color:#f8fafc; border-radius:6px; line-height:1.6;">
      Este es un mensaje automático del Sistema de Gestión ACR de <strong>Solutions &amp; Payroll</strong>.<br/>
      Por favor no responda directamente a este correo.
    </p>

  </div>

  <!-- FOOTER -->
  <div style="background-color:#f8fafc; padding:25px 35px; text-align:center; border-top:2px solid #e2e8f0;">
    <p style="margin:4px 0; color:#1e3a8a; font-weight:600; font-size:14px;">Solutions &amp; Payroll S.A.S.</p>
    <p style="margin:4px 0; color:#64748b; font-size:13px;">Sistema de Gestión de Acciones Correctivas y de Mejora</p>
    <p style="margin:8px 0 0 0; color:#94a3b8; font-size:12px;">Este correo fue generado automáticamente. No responder.</p>
  </div>

</div>
</body>
</html>`;
}

export function buildActividadesPendientesText(data: ActividadesPendientesData): string {
  const { responsable_nombre, tipo, actividades } = data;
  const tipoLabel = tipo === 'ejecucion' ? 'Ejecución' : 'Seguimiento';

  const lineas = [
    `[ACR] Actividades Pendientes — ${tipoLabel}`,
    `${'='.repeat(50)}`,
    ``,
    `Hola ${responsable_nombre},`,
    ``,
    `Tienes ${actividades.length} actividad${actividades.length !== 1 ? 'es' : ''} de ${tipoLabel.toLowerCase()} pendientes en el Plan de Acción.`,
    `Por favor revisa y actualiza el estado de cada una a la brevedad posible.`,
    ``,
    `${'─'.repeat(50)}`,
  ];

  actividades.forEach((a, i) => {
    lineas.push(``);
    lineas.push(`${i + 1}. ${a.consecutivo} | ${a.proceso}${a.cliente ? ' · ' + a.cliente : ''}`);
    lineas.push(`   Actividad: ${a.actividad_descripcion}`);
    lineas.push(`   Estado: ${a.actividad_estado}`);
    lineas.push(`   Ver ACR: ${a.acr_url}`);
  });

  lineas.push(``);
  lineas.push(`${'─'.repeat(50)}`);
  lineas.push(`Solutions & Payroll S.A.S. — Sistema de Gestión de ACR`);
  lineas.push(`Este correo fue generado automáticamente. No responder.`);

  return lineas.join('\n');
}
