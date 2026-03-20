export interface AcrNotificacionData {
  consecutivo: string;
  tipo_accion: string;
  proceso: string;
  cliente: string;
  estado: string;
  cierre_estimado: string | null;
  responsable_nombre: string;
  /** 'proceso' = líder responsable del proceso, 'seguimiento' = responsable de seguimiento */
  rol: 'proceso' | 'seguimiento';
  /** Full URL to the ACR detail page, e.g. https://app.com/dashboard/historial-acr/42 */
  acr_url: string;
}

export function buildAcrNotificacionHtml(data: AcrNotificacionData): string {
  const {
    consecutivo,
    tipo_accion,
    proceso,
    cliente,
    estado,
    cierre_estimado,
    responsable_nombre,
    rol,
    acr_url,
  } = data;

  const rolLabel =
    rol === 'proceso' ? 'líder responsable del proceso' : 'responsable de seguimiento';

  const solicitudTexto =
    rol === 'proceso'
      ? 'Como <strong>líder responsable del proceso</strong>, le solicitamos verificar el estado actual de dicha ACR y gestionar los ajustes o cierres que correspondan a la brevedad posible.'
      : 'Como <strong>responsable de seguimiento</strong>, le solicitamos revisar el avance de las actividades del plan de acción y actualizar el estado correspondiente.';

  const estadoColor =
    estado === 'Cerrada' ? '#16a34a' :
    estado === 'Parcial'  ? '#2563eb' :
    '#d97706'; // Abierta / default

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Notificación de Acción Correctiva — ${consecutivo}</title>
<style>
  body { margin:0; padding:0; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; background-color:#f5f5f5; }
  .email-container { max-width:600px; margin:20px auto; background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08); }
  .header { background-color:#1e3a8a; padding:30px 30px 25px 30px; text-align:center; color:#ffffff; position:relative; }
  .logo-container img { height:100px; width:auto; }
  .header::after { content:''; position:absolute; bottom:0; left:0; right:0; height:3px; background-color:#2563eb; }
  .header p { margin:8px 0 0 0; font-size:20px; opacity:0.95; font-weight:400; }
  .content { padding:40px 35px; }
  .greeting { font-size:16px; color:#1e293b; margin-bottom:25px; line-height:1.5; }
  .alert-badge { display:inline-flex; align-items:center; gap:8px; background-color:#eff6ff; border:1px solid #bfdbfe; color:#1d4ed8; font-size:13px; font-weight:700; padding:6px 14px; border-radius:20px; margin-bottom:20px; letter-spacing:0.4px; text-transform:uppercase; }
  .alert-badge .dot { width:8px; height:8px; border-radius:50%; background-color:#2563eb; display:inline-block; }
  .message-box { background-color:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid #2563eb; padding:24px; margin:25px 0; border-radius:6px; }
  .message-box p { margin:0 0 10px 0; color:#334155; font-size:15px; line-height:1.6; }
  .message-box p:last-child { margin-bottom:0; }
  .highlight { font-weight:600; color:#1e3a8a; }
  .acr-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:20px 0; }
  .acr-card { background-color:#ffffff; border:1px solid #e2e8f0; border-radius:6px; padding:14px 16px; }
  .acr-card.full { grid-column:1 / -1; }
  .acr-card-label { font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:6px; }
  .acr-card-value { font-size:15px; font-weight:600; color:#1e293b; }
  .status-pill { display:inline-block; padding:3px 12px; border-radius:12px; font-size:13px; font-weight:700; background-color:#eff6ff; color:${estadoColor}; border:1px solid #bfdbfe; }
  .button-container { text-align:center; margin:35px 0; }
  .button { display:inline-block; background-color:#2563eb; color:#ffffff; padding:15px 40px; text-decoration:none; border-radius:6px; font-weight:600; font-size:15px; box-shadow:0 4px 12px rgba(37,99,235,0.3); }
  .notice-text { color:#64748b; font-size:14px; text-align:center; margin-top:25px; padding:15px; background-color:#f8fafc; border-radius:6px; line-height:1.6; }
  .footer { background-color:#f8fafc; padding:30px 35px; text-align:center; border-top:2px solid #e2e8f0; }
  .footer p { margin:8px 0; color:#64748b; font-size:13px; line-height:1.5; }
  .footer-brand { color:#1e3a8a; font-weight:600; font-size:14px; }
</style>
</head>
<body>
<div class="email-container">

  <!-- HEADER -->
  <div class="header">
    <div class="logo-container">
      <img src="https://i.imgur.com/JXCWaXF.png" alt="Solutions &amp; Payroll Logo" />
    </div>
    <p>Sistema de Gestión de ACR</p>
  </div>

  <!-- CONTENT -->
  <div class="content">

    <div class="greeting">
      Hola <strong>${responsable_nombre}</strong>,
    </div>

    <div class="alert-badge">
      <span class="dot"></span>
      Acción ${tipo_accion} — Recordatorio
    </div>

    <div class="message-box">
      <p>
        Le informamos que la <span class="highlight">ACR N.° ${consecutivo}</span>
        relacionada con el cliente <span class="highlight">${cliente || '—'}</span>,
        correspondiente al proceso de <span class="highlight">${proceso}</span>,
        continúa con estado <span class="highlight">${estado}</span> y requiere su atención.
      </p>
      <p>${solicitudTexto}</p>

      <div class="acr-grid">
        <div class="acr-card">
          <div class="acr-card-label">Número de ACR</div>
          <div class="acr-card-value">${consecutivo}</div>
        </div>
        <div class="acr-card">
          <div class="acr-card-label">Estado</div>
          <div class="acr-card-value">
            <span class="status-pill">● ${estado}</span>
          </div>
        </div>
        <div class="acr-card">
          <div class="acr-card-label">Cliente</div>
          <div class="acr-card-value">${cliente || '—'}</div>
        </div>
        <div class="acr-card">
          <div class="acr-card-label">Proceso</div>
          <div class="acr-card-value">${proceso}</div>
        </div>
        <div class="acr-card full">
          <div class="acr-card-label">Fecha estimada de cierre con verificación</div>
          <div class="acr-card-value">${cierre_estimado ?? 'No definida'}</div>
        </div>
        <div class="acr-card full">
          <div class="acr-card-label">Su rol en esta ACR</div>
          <div class="acr-card-value" style="text-transform:capitalize;">${rolLabel}</div>
        </div>
      </div>
    </div>

    <!-- Botón -->
    <div class="button-container">
      <a href="${acr_url}" class="button" style="color:#ffffff !important;">📂&nbsp; Ver detalle de la ACR</a>
    </div>

    <div class="notice-text">
      Por favor, revise la ACR lo antes posible para mantener el flujo de trabajo actualizado
      y garantizar el cumplimiento con el cliente.<br />
      <strong>Este recordatorio se envía automáticamente cada 15 días mientras la ACR permanezca abierta.</strong>
    </div>

  </div>

  <!-- FOOTER -->
  <div class="footer">
    <p class="footer-brand">Solutions &amp; Payroll</p>
    <p>Este es un mensaje automático, por favor no responder a este correo.</p>
    <p style="margin-top:15px;font-size:12px;color:#94a3b8;">
      © 2026 Solutions &amp; Payroll. Todos los derechos reservados.
    </p>
  </div>

</div>
</body>
</html>`;
}
