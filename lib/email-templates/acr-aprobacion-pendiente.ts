export interface AcrAprobacionPendienteData {
  consecutivo: string;
  proceso: string;
  cliente: string;
  registrado_por: string;
  autorizado_por: string;
  /** Full URL to the ACR detail page, e.g. https://acr.solutionsandpayroll.com/dashboard/historial-acr/27 */
  acr_url: string;
}

export function buildAcrAprobacionPendienteHtml(data: AcrAprobacionPendienteData): string {
  const {
    consecutivo,
    proceso,
    cliente,
    registrado_por,
    autorizado_por,
    acr_url,
  } = data;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Nueva ACR Pendiente de Aprobación — ${consecutivo}</title>
<style>
  body { margin:0; padding:0; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; background-color:#f5f5f5; }
  .email-container { max-width:600px; margin:20px auto; background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08); }
  .header { background-color:#1e3a8a; padding:30px 30px 25px 30px; text-align:center; color:#ffffff; position:relative; }
  .logo-container img { height:100px; width:auto; }
  .header::after { content:''; position:absolute; bottom:0; left:0; right:0; height:3px; background-color:#f59e0b; }
  .header p { margin:8px 0 0 0; font-size:20px; opacity:0.95; font-weight:400; }
  .content { padding:40px 35px; }
  .greeting { font-size:16px; color:#1e293b; margin-bottom:25px; line-height:1.5; }
  .alert-badge { display:inline-flex; align-items:center; gap:8px; background-color:#fef3c7; border:1px solid #fcd34d; color:#92400e; font-size:13px; font-weight:700; padding:6px 14px; border-radius:20px; margin-bottom:20px; letter-spacing:0.4px; text-transform:uppercase; }
  .alert-badge .dot { width:8px; height:8px; border-radius:50%; background-color:#f59e0b; display:inline-block; }
  .message-box { background-color:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid #f59e0b; padding:24px; margin:25px 0; border-radius:6px; }
  .message-box p { margin:0 0 10px 0; color:#334155; font-size:15px; line-height:1.6; }
  .message-box p:last-child { margin-bottom:0; }
  .highlight { font-weight:600; color:#1e3a8a; }
  .acr-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:20px 0; }
  .acr-card { background-color:#ffffff; border:1px solid #e2e8f0; border-radius:6px; padding:14px 16px; }
  .acr-card.full { grid-column:1 / -1; }
  .acr-card-label { font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:6px; }
  .acr-card-value { font-size:15px; font-weight:600; color:#1e293b; }
  .status-pill { display:inline-block; padding:3px 12px; border-radius:12px; font-size:13px; font-weight:700; background-color:#fef3c7; color:#92400e; border:1px solid #fcd34d; }
  .button-container { text-align:center; margin:35px 0; }
  .button { display:inline-block; background-color:#f59e0b; color:#ffffff; padding:15px 40px; text-decoration:none; border-radius:6px; font-weight:600; font-size:15px; box-shadow:0 4px 12px rgba(245,158,11,0.3); }
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
      Hola <strong>${autorizado_por}</strong>,
    </div>

    <div class="alert-badge">
      <span class="dot"></span>
      Nueva ACR — Pendiente de Aprobación
    </div>

    <div class="message-box">
      <p>
        Le informamos que se ha creado una nueva <span class="highlight">ACR N.° ${consecutivo}</span>
        y está pendiente de su aprobación.
      </p>
      <p>
        Por favor, revise los detalles de la ACR y proceda con la aprobación o rechazo según corresponda.
      </p>

      <div class="acr-grid">
        <div class="acr-card">
          <div class="acr-card-label">Número de ACR</div>
          <div class="acr-card-value">${consecutivo}</div>
        </div>
        <div class="acr-card">
          <div class="acr-card-label">Estado de Aprobación</div>
          <div class="acr-card-value">
            <span class="status-pill">● Pendiente</span>
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
          <div class="acr-card-label">Registrado por</div>
          <div class="acr-card-value">${registrado_por}</div>
        </div>
      </div>
    </div>

    <!-- Botón -->
    <div class="button-container">
      <a href="${acr_url}" class="button" style="color:#ffffff !important;">✓ Ir a ACR</a>
    </div>

    <div class="notice-text">
      Para aprobar o rechazar esta ACR, ingrese al detalle, haga clic en "Editar" y cambie el 
      <strong>Estado de autorización</strong> a "Aprobada" o "Rechazada" según corresponda.
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
