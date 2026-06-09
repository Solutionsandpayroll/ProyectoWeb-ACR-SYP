const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const FIXED_TO = 'automatizacion2@solutionsandpayroll.com';

function parseBoolean(value, fallback) {
  if (value == null) return fallback;
  const normalized = String(value).trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function readEnvValue(name) {
  if (process.env[name]) return process.env[name];

  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (!fs.existsSync(fullPath)) continue;

    const lines = fs.readFileSync(fullPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;

      const key = trimmed.slice(0, idx).trim();
      if (key !== name) continue;

      let value = trimmed.slice(idx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      return value;
    }
  }

  return null;
}

function getConfig() {
  const host = readEnvValue('OUTLOOK_SMTP_HOST') || 'smtp.office365.com';
  const port = Number(readEnvValue('OUTLOOK_SMTP_PORT') || 587);
  const secure = parseBoolean(readEnvValue('OUTLOOK_SMTP_SECURE'), false);
  const user = readEnvValue('OUTLOOK_SMTP_USER');
  const pass = readEnvValue('OUTLOOK_SMTP_PASS');
  const legacyFrom = readEnvValue('OUTLOOK_SMTP_FROM');
  const fromName = readEnvValue('OUTLOOK_SMTP_FROM_NAME') || 'Solutions & Payroll';
  const fromAddress = readEnvValue('OUTLOOK_SMTP_FROM_ADDRESS') || user;

  if (!user || !pass) {
    throw new Error(
      'Faltan variables OUTLOOK_SMTP_USER / OUTLOOK_SMTP_PASS. Configuralas en .env.local o en variables de entorno.'
    );
  }

  if (!Number.isFinite(port) || port <= 0) {
    throw new Error('OUTLOOK_SMTP_PORT no es valido.');
  }

  if (!fromAddress) {
    throw new Error('OUTLOOK_SMTP_FROM_ADDRESS no es valido.');
  }

  return { host, port, secure, user, pass, fromName, fromAddress, legacyFrom };
}

async function main() {
  const cfg = getConfig();

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: {
      user: cfg.user,
      pass: cfg.pass,
    },
  });

  await transporter.verify();

  const now = new Date().toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'medium',
  });

  const fromHeader = cfg.legacyFrom
    ? (() => {
        const match = cfg.legacyFrom.match(/^(.*)<([^>]+)>$/);
        if (match) {
          return { name: match[1].trim().replace(/^"|"$/g, ''), address: match[2].trim() };
        }
        return { name: cfg.fromName, address: cfg.fromAddress };
      })()
    : { name: cfg.fromName, address: cfg.fromAddress };

  const info = await transporter.sendMail({
    from: fromHeader,
    to: FIXED_TO,
    subject: '[TEST] Outlook SMTP - ACR',
    text:
      `Prueba SMTP Outlook exitosa.\n\n` +
      `Fecha: ${now}\n` +
      `Host: ${cfg.host}:${cfg.port}\n` +
      `Usuario autenticado: ${cfg.user}\n` +
      `Destino fijo: ${FIXED_TO}\n`,
    html:
      '<h3>Prueba SMTP Outlook exitosa</h3>' +
      `<p><strong>Fecha:</strong> ${now}</p>` +
      `<p><strong>Host:</strong> ${cfg.host}:${cfg.port}</p>` +
      `<p><strong>Usuario autenticado:</strong> ${cfg.user}</p>` +
      `<p><strong>Destino fijo:</strong> ${FIXED_TO}</p>`,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        destination: FIXED_TO,
        messageId: info.messageId,
        response: info.response,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
