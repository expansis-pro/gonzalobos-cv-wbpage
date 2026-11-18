// api/contact.js
// Vercel Function expuesta en https://gonzalobos.com/api/contact.
// Migrada desde functions/contact-handler.js (Firebase Cloud Functions).
// La API Key de Resend vive en las variables de entorno de Vercel; nunca llega al bundle de React.
// Sin dependencias: usa el fetch nativo de Node 18+.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const LIMITS = {
	user_name: 100,
	user_email: 254,
	user_company: 120,
	message: 5000,
};

// Campo trampa: los humanos no lo ven; los bots suelen rellenarlo.
// Debe coincidir con HONEYPOT_FIELD en src/components/ContactForm.jsx
const HONEYPOT_FIELD = 'hp_website';

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-zA-Z]{2,}$/;

// Elimina caracteres de control (conserva \n y \t solo si se permite multilínea).
const clean = (value, { multiline = false, max = 1000 } = {}) => {
	if (typeof value !== 'string') return '';
	let out = value.normalize('NFC');
	out = multiline
		? out.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
		: out.replace(/[\u0000-\u001F\u007F]+/g, ' '); // sin saltos de línea → evita inyección en el asunto
	out = out.trim();
	if (multiline) out = out.replace(/\n{3,}/g, '\n\n');
	return out.slice(0, max);
};

const escapeHtml = (str) =>
	str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const validateContact = (body) => {
	const raw = body && typeof body === 'object' ? body : {};
	const data = {
		user_name: clean(raw.user_name, { max: LIMITS.user_name }),
		user_email: clean(raw.user_email, { max: LIMITS.user_email }).toLowerCase(),
		user_company: clean(raw.user_company, { max: LIMITS.user_company }),
		message: clean(raw.message, { multiline: true, max: LIMITS.message }),
	};

	const errors = [];
	if (!data.user_name) errors.push('user_name es requerido');
	if (!data.user_email) errors.push('user_email es requerido');
	else if (!EMAIL_RE.test(data.user_email)) errors.push('user_email no tiene un formato válido');
	if (!data.message) errors.push('message es requerido');
	else if (data.message.length < 5) errors.push('message es demasiado corto');

	return { data, errors };
};

const buildEmail = ({ user_name, user_email, user_company, message }, { from, to }) => {
	const company = user_company || 'Sin empresa';
	const sentAt = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' });

	const rows = [
		['Nombre', user_name],
		['Email', user_email],
		['Empresa', company],
		['Fecha', sentAt],
	];

	const html = `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:24px;background:#eae7e2;font-family:Arial,Helvetica,sans-serif;color:#1a1816;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-top:6px solid #0d9488;">
    <tr><td style="padding:24px 28px 8px;">
      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#0d9488;">Portafolio Web · gonzalobos.com</p>
      <h1 style="margin:8px 0 0;font-size:20px;font-weight:900;text-transform:uppercase;">Nuevo mensaje de contacto</h1>
    </td></tr>
    <tr><td style="padding:16px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
        ${rows
					.map(
						([label, value]) => `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eae7e2;width:110px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#78716c;">${label}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eae7e2;">${escapeHtml(value)}</td>
        </tr>`,
					)
					.join('')}
      </table>
    </td></tr>
    <tr><td style="padding:8px 28px 24px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#78716c;">Mensaje</p>
      <div style="padding:16px;background:#f5f5f4;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</div>
    </td></tr>
    <tr><td style="padding:16px 28px;background:#1a1816;color:#d6d3d1;font-size:12px;">
      Responde directamente a este correo para contestar a ${escapeHtml(user_name)}.
    </td></tr>
  </table>
</body>
</html>`;

	const text = [
		'NUEVO MENSAJE DE CONTACTO — Portafolio Web (gonzalobos.com)',
		'',
		...rows.map(([label, value]) => `${label}: ${value}`),
		'',
		'Mensaje:',
		message,
		'',
		`— Responde a este correo para contestar a ${user_name}.`,
	].join('\n');

	return {
		from,
		to: to
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean),
		reply_to: user_email,
		subject: `[Portafolio Web] Nuevo mensaje de ${user_name} (${company})`,
		html,
		text,
	};
};

export default async function handler(req, res) {
	res.setHeader('Cache-Control', 'no-store');

	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ ok: false, error: 'Método no permitido' });
	}

	const contentType = String(req.headers['content-type'] || '').toLowerCase();
	if (!contentType.startsWith('application/json')) {
		return res.status(400).json({ ok: false, error: 'Content-Type debe ser application/json' });
	}

	// En Vercel, req.body es un getter que lanza si el JSON es inválido.
	let body;
	try {
		body = req.body;
	} catch {
		return res.status(400).json({ ok: false, error: 'JSON inválido' });
	}
	if (typeof body === 'string') {
		try {
			body = JSON.parse(body);
		} catch {
			return res.status(400).json({ ok: false, error: 'JSON inválido' });
		}
	}
	body = body && typeof body === 'object' ? body : {};

	// Honeypot: si viene relleno, respondemos 200 "ok" sin enviar nada (no damos pistas al bot).
	if (typeof body[HONEYPOT_FIELD] === 'string' && body[HONEYPOT_FIELD].trim() !== '') {
		console.warn('contact: honeypot activado, envío descartado');
		return res.status(200).json({ ok: true });
	}

	const { data, errors } = validateContact(body);
	if (errors.length) {
		return res.status(400).json({ ok: false, error: errors.join('; ') });
	}

	const apiKey = process.env.RESEND_API_KEY;
	const from = process.env.CONTACT_FROM_EMAIL;
	const to = process.env.CONTACT_TO_EMAIL;

	if (!apiKey || !from || !to) {
		console.error('contact: faltan RESEND_API_KEY, CONTACT_FROM_EMAIL o CONTACT_TO_EMAIL');
		return res.status(500).json({ ok: false, error: 'Configuración del servidor incompleta' });
	}

	try {
		const response = await fetch(RESEND_ENDPOINT, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(buildEmail(data, { from, to })),
			signal: AbortSignal.timeout(10000),
		});

		if (!response.ok) {
			const detail = await response.text().catch(() => '');
			console.error(`contact: Resend respondió ${response.status}`, detail);
			return res.status(500).json({ ok: false, error: 'No se pudo enviar el mensaje' });
		}

		const result = await response.json().catch(() => ({}));
		console.info('contact: email enviado', { id: result.id });
		return res.status(200).json({ ok: true });
	} catch (err) {
		console.error('contact: error de red con Resend', err);
		return res.status(500).json({ ok: false, error: 'No se pudo enviar el mensaje' });
	}
}
