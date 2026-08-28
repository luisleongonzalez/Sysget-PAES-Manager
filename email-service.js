/* PAES MANAGER - EMAIL SERVICE (EmailJS) */
(function () {
  "use strict";
  const CFG_KEYS = {
    pub:  "paes_emailjs_public_key",
    svc:  "paes_emailjs_service_id",
    tpl:  "paes_emailjs_template_id",
    from: "paes_emailjs_from_name",
  };

  const EmailService = {
    get publicKey()  { return localStorage.getItem(CFG_KEYS.pub)  || ""; },
    get serviceId()  { return localStorage.getItem(CFG_KEYS.svc)  || ""; },
    get templateId() { 
      const val = localStorage.getItem(CFG_KEYS.tpl);
      if (!val || val === "template_id" || val.includes("YOUR_")) {
        localStorage.setItem(CFG_KEYS.tpl, "nerqwi7");
        return "nerqwi7";
      }
      return val; 
    },
    get fromName()   { return localStorage.getItem(CFG_KEYS.from) || "PAES Manager - Evaluaciones"; },

    isConfigured() { return !!(this.publicKey && this.serviceId && this.templateId); },

    save(pk, sid, tid, fn) {
      localStorage.setItem(CFG_KEYS.pub,  pk.trim());
      localStorage.setItem(CFG_KEYS.svc,  sid.trim());
      localStorage.setItem(CFG_KEYS.tpl,  (tid || "nerqwi7").trim());
      localStorage.setItem(CFG_KEYS.from, (fn || "PAES Manager").trim());
    },

    buildHTML({ nombreAlumno, titulo, asignatura, sala, duracion, fechaStr, link, folio }) {
      const durTexto = duracion > 0 ? duracion + " minutos" : "Sin limite de tiempo";
      // Token limpio (sin prefijo PAES-)
      const tokenCorto = folio.replace("PAES-", "");
      return "<!DOCTYPE html>" +
        "<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->" +
        "<html lang='es'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>" +
        "<style>body{margin:0;padding:0;background:#f4f6f8}a{color:#2563eb}</style></head>" +
        "<body style='margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif'>" +
        "<!--[if mso]><table width='600' align='center' cellpadding='0' cellspacing='0'><tr><td><![endif]-->" +
        "<table width='100%' cellpadding='0' cellspacing='0' border='0' style='max-width:580px;margin:24px auto'>" +
        "<tr><td>" +
        // ── CARD WRAPPER
        "<table width='100%' cellpadding='0' cellspacing='0' border='0' style='background:#ffffff;border:1px solid #e2e8f0'>" +
        // ── HEADER (dark bg)
        "<tr><td bgcolor='#1e293b' style='background-color:#1e293b;padding:28px 28px 20px;text-align:center'>" +
        "<div style='font-size:36px;margin-bottom:8px'>&#127891;</div>" +
        "<h1 style='margin:0;font-size:20px;font-weight:800;color:#ffffff;font-family:Arial,sans-serif'>Citacion a Evaluacion en Linea</h1>" +
        "<p style='margin:6px 0 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif'>PAES Manager &mdash; Sistema de Evaluaciones Digitales</p>" +
        "</td></tr>" +
        // ── BADGE
        "<tr><td style='padding:18px 28px 0;text-align:center'>" +
        "<span style='display:inline-block;background:#dbeafe;color:#1d4ed8;padding:5px 18px;font-size:12px;font-weight:700;text-transform:uppercase;font-family:Arial,sans-serif;border:1px solid #bfdbfe'>&#10003; Evaluacion Habilitada</span>" +
        "</td></tr>" +
        // ── BODY
        "<tr><td style='padding:22px 28px 8px'>" +
        "<p style='margin:0 0 18px;font-size:15px;color:#334155;line-height:1.7;font-family:Arial,sans-serif'>Estimado/a <strong>" + nombreAlumno + "</strong>,<br>Se informa que se ha habilitado tu evaluacion en linea para la preparacion PAES. A continuacion encontraras todos los detalles y tu enlace unico de acceso.</p>" +
        // ── INFO TABLE
        "<table width='100%' cellpadding='0' cellspacing='0' border='0' style='border-collapse:collapse;border:1px solid #e2e8f0;font-size:13px;font-family:Arial,sans-serif'>" +
        "<tr><td width='38%' bgcolor='#f8fafc' style='background-color:#f8fafc;padding:10px 14px;border-bottom:1px solid #f1f5f9;font-weight:700;color:#64748b'>Evaluacion</td>" +
        "<td style='padding:10px 14px;border-bottom:1px solid #f1f5f9;color:#0f172a;font-weight:600'><strong>" + titulo + "</strong></td></tr>" +
        "<tr><td width='38%' bgcolor='#f8fafc' style='background-color:#f8fafc;padding:10px 14px;border-bottom:1px solid #f1f5f9;font-weight:700;color:#64748b'>Asignatura</td>" +
        "<td style='padding:10px 14px;border-bottom:1px solid #f1f5f9;color:#0f172a'>" + asignatura + "</td></tr>" +
        "<tr><td width='38%' bgcolor='#f8fafc' style='background-color:#f8fafc;padding:10px 14px;border-bottom:1px solid #f1f5f9;font-weight:700;color:#64748b'>Codigo de Sala</td>" +
        "<td style='padding:10px 14px;border-bottom:1px solid #f1f5f9;color:#0f172a;font-family:Courier New,monospace'>" + sala + "</td></tr>" +
        "<tr><td width='38%' bgcolor='#f8fafc' style='background-color:#f8fafc;padding:10px 14px;border-bottom:1px solid #f1f5f9;font-weight:700;color:#64748b'>Tiempo Limite</td>" +
        "<td style='padding:10px 14px;border-bottom:1px solid #f1f5f9;color:#0f172a'>" + durTexto + "</td></tr>" +
        "<tr><td width='38%' bgcolor='#f8fafc' style='background-color:#f8fafc;padding:10px 14px;font-weight:700;color:#64748b'>Fecha de Emision</td>" +
        "<td style='padding:10px 14px;color:#0f172a'>" + fechaStr + "</td></tr>" +
        "</table>" +
        // ── CTA BUTTON (table-based for Outlook)
        "<table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin:24px 0 8px'>" +
        "<tr><td align='center'>" +
        "<!--[if mso]><v:roundrect xmlns:v='urn:schemas-microsoft-com:vml' xmlns:w='urn:schemas-microsoft-com:office:word' href='" + link + "' style='height:48px;v-text-anchor:middle;width:260px;' arcsize='10%' strokecolor='#1d4ed8' fillcolor='#2563eb'><w:anchorlock/><center style='color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold'>Ingresar a mi Evaluacion</center></v:roundrect><![endif]-->" +
        "<!--[if !mso]><!-->" +
        "<a href='" + link + "' style='display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 36px;font-size:15px;font-weight:700;font-family:Arial,sans-serif;border:2px solid #1d4ed8'>Ingresar a mi Evaluacion</a>" +
        "<!--<![endif]-->" +
        "</td></tr>" +
        "<tr><td align='center' style='padding-top:8px;font-size:11px;color:#94a3b8;font-family:Arial,sans-serif;word-break:break-all'>" + link + "</td></tr>" +
        "</table>" +
        // ── TOKEN BOX
        "<table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin:16px 0;border:2px dashed #86efac'>" +
        "<tr><td bgcolor='#f0fdf4' style='background-color:#f0fdf4;padding:16px;text-align:center'>" +
        "<p style='margin:0 0 8px;font-size:11px;font-weight:700;color:#166534;text-transform:uppercase;font-family:Arial,sans-serif'>&#128273; Tu Codigo de Acceso Personal</p>" +
        "<p style='margin:0;font-size:20px;font-weight:800;color:#15803d;letter-spacing:2px;font-family:Courier New,monospace;background:#dcfce7;padding:8px 16px;display:inline-block'>" + tokenCorto + "</p>" +
        "<p style='margin:8px 0 0;font-size:12px;color:#166534;font-family:Arial,sans-serif'>Si el boton no funciona, entrega este codigo a tu docente</p>" +
        "</td></tr></table>" +
        // ── INSTRUCTIONS
        "<table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin:0 0 20px;border:1px solid #e2e8f0'>" +
        "<tr><td bgcolor='#f8fafc' style='background-color:#f8fafc;padding:14px 18px'>" +
        "<p style='margin:0 0 10px;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;font-family:Arial,sans-serif'>Instrucciones Importantes</p>" +
        "<ol style='margin:0;padding-left:18px;font-size:13px;color:#475569;line-height:1.8;font-family:Arial,sans-serif'>" +
        "<li>Este enlace es <strong>unico e individual</strong> &mdash; asociado exclusivamente a tu nombre.</li>" +
        "<li>Activa el modo <strong>Ver PDF y Hoja en Misma Pantalla</strong> para responder sin cambiar de ventana.</li>" +
        "<li>Al finalizar, presiona <strong>Enviar Respuestas</strong> para registrar tus resultados.</li>" +
        "</ol>" +
        "</td></tr></table>" +
        "<p style='text-align:center;font-size:11px;color:#cbd5e1;font-family:Courier New,monospace;margin:0 0 20px'>Folio: " + folio + "</p>" +
        "</td></tr>" +
        // ── FOOTER
        "<tr><td bgcolor='#f8fafc' style='background-color:#f8fafc;padding:16px 28px;text-align:center;border-top:1px solid #e2e8f0'>" +
        "<p style='margin:0;font-size:11px;color:#94a3b8;line-height:1.6;font-family:Arial,sans-serif'>Este correo fue emitido automaticamente por PAES Manager.<br>&#161;Te deseamos el mayor de los exitos en tu evaluacion!</p>" +
        "</td></tr>" +
        "</table>" + // end card
        "</td></tr></table>" + // end outer wrapper
        "<!--[if mso]></td></tr></table><![endif]-->" +
        "</body></html>";
    },

    async send({ toEmail, toName, subject, htmlBody }) {
      if (!this.isConfigured()) return { ok: false, reason: "not_configured" };
      try {
        await emailjs.init(this.publicKey);
        await emailjs.send(this.serviceId, this.templateId, {
          to_email:  toEmail,
          to_name:   toName,
          // from_name: se configura en el template de EmailJS como nombre del servicio
          subject:   subject,
          html_body: htmlBody,
        });
        return { ok: true };
      } catch (e) {
        console.error("[EmailService] Error:", e);
        return { ok: false, reason: (e && (e.text || e.message)) || "Error desconocido" };
      }
    },

    _buildLink(token) {
      const baseUrl = window.location.href.split("#")[0].replace("index.html", "") + "responder.html";
      return baseUrl + "?token=" + token;
    },

    _fallbackMailto(al, sesionData, link, subject) {
      const body = encodeURIComponent(
        "Estimado/a " + formatNombrePropio(al.nombre) + ",\n\n" +
        "Tu enlace de evaluacion en linea:\n\n" + link + "\n\n" +
        "Evaluacion: " + sesionData.titulo + "\nFecha: " + new Date().toLocaleDateString("es-CL") + "\n\n" +
        "Mucho exito!\n\nEquipo Docente - PAES Manager"
      );
      const url = al.email
        ? "mailto:" + al.email + "?subject=" + encodeURIComponent(subject) + "&body=" + body
        : "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + body;
      window.open(url, "_blank");
    },

    async enviarAlumno(al, sesionData) {
      const link     = this._buildLink(al.token);
      const htmlBody = this.buildHTML({
        nombreAlumno: formatNombrePropio(al.nombre),
        titulo:    sesionData.titulo,
        asignatura: sesionData.asignatura || "PAES Oficial",
        sala:      sesionData.sala || "SALA-1",
        duracion:  sesionData.duracionMinutos || 0,
        fechaStr:  new Date().toLocaleDateString("es-CL"),
        link,
        folio: "PAES-" + al.token,
      });
      const subject = "[PAES] Citacion a Evaluacion en Linea: " + sesionData.titulo;
      if (!al.email || !al.email.includes("@")) {
        this._fallbackMailto(al, sesionData, link, subject);
        return { ok: "mailto", nombre: al.nombre };
      }
      const result = await this.send({ toEmail: al.email, toName: formatNombrePropio(al.nombre), subject, htmlBody });
      return Object.assign({}, result, { nombre: al.nombre });
    },
    clear() {
      localStorage.removeItem(CFG_KEYS.pub);
      localStorage.removeItem(CFG_KEYS.svc);
      localStorage.removeItem(CFG_KEYS.tpl);
      localStorage.removeItem(CFG_KEYS.from);
    },
  };

  window.EmailService = EmailService;

  // ─── Config UI ────────────────────────────────────────────
  window.abrirConfigEmailJS = function () {
    if (EmailService.isConfigured()) {
      const opcion = confirm(
        "EmailJS está actualmente CONFIGURADO en este navegador.\n\n" +
        "• Presiona [Aceptar] si deseas MODIFICAR las credenciales.\n" +
        "• Presiona [Cancelar] si deseas BORRAR las credenciales y desactivar el envío."
      );
      if (!opcion) {
        if (confirm("¿Confirmas que deseas BORRAR las credenciales y desactivar el envío automático?")) {
          EmailService.clear();
          showToast("🗑️ Credenciales de correo eliminadas correctamente");
        }
        return;
      }
    }

    const pk  = prompt("Paso 1/4 - Public Key de EmailJS\n(emailjs.com > Account > General > Public Key):", EmailService.publicKey);
    if (pk === null) return;
    const sid = prompt("Paso 2/4 - Service ID\n(Email Services > tu servicio Gmail > Service ID):", EmailService.serviceId);
    if (sid === null) return;
    const tid = prompt("Paso 3/4 - Template ID\n(Email Templates > tu plantilla > Template ID):", EmailService.templateId);
    if (tid === null) return;
    const fn  = prompt("Paso 4/4 - Nombre del Remitente (aparece en De:):", EmailService.fromName);
    if (fn === null) return;
    EmailService.save(pk, sid, tid, fn);
    showToast("✅ Configuración de correos guardada correctamente");
  };

  // ─── Enviar a un alumno individual ────────────────────────
  window.enviarEmailAlumnoDirecto = async function (idx) {
    const al = state.alumnosEnSession[idx];
    if (!al) return;
    const nombreFormat = formatNombrePropio(al.nombre);
    
    if (!confirm(`¿Deseas enviar el correo con la citación y enlace de evaluación a ${nombreFormat}?`)) {
      return;
    }

    const sesionData = _getSesionDatosParaEmail();
    showToast("Enviando correo a " + nombreFormat + "...");
    const result = await EmailService.enviarAlumno(al, sesionData);
    if (result.ok === true) {
      showToast("✅ Correo enviado a " + result.nombre);
    } else if (result.ok === "mailto") {
      showToast("📧 Abriendo borrador de correo para " + result.nombre);
    } else if (result.reason === "not_configured") {
      if (confirm("EmailJS no está configurado.\n¿Deseas configurarlo ahora para enviar correos directamente desde la app?")) {
        abrirConfigEmailJS();
      }
    } else {
      showToast("❌ Error al enviar a " + result.nombre + ": " + result.reason);
    }
  };

  // ─── Enviar a todos los alumnos ───────────────────────────
  window.enviarTodosLosCorreosDirecto = async function () {
    if (!state.alumnosEnSession || state.alumnosEnSession.length === 0) {
      showToast("No hay alumnos en la lista");
      return;
    }
    
    if (!EmailService.isConfigured()) {
      if (confirm("EmailJS no está configurado en este navegador.\n\n¿Deseas configurarlo ahora para enviar correos automáticos?\n(Si presionas Cancelar, NO se enviará ningún correo)")) {
        abrirConfigEmailJS();
      }
      return;
    }

    const totalAlumnos = state.alumnosEnSession.length;
    if (!confirm(`¿Confirmas el envío de correos de citación a los ${totalAlumnos} alumnos de la lista?`)) {
      return;
    }

    const sesionData = _getSesionDatosParaEmail();
    showToast("Enviando " + totalAlumnos + " correos...");
    let ok = 0, err = 0, sinEmail = 0;
    for (const al of state.alumnosEnSession) {
      const result = await EmailService.enviarAlumno(al, sesionData);
      if (result.ok === true)        ok++;
      else if (result.ok === "mailto") sinEmail++;
      else                             err++;
      await new Promise(function(r) { setTimeout(r, 400); });
    }
    const partes = [];
    if (ok > 0)       partes.push(ok + " enviado(s)");
    if (sinEmail > 0) partes.push(sinEmail + " sin email");
    if (err > 0)      partes.push(err + " con error");
    showToast(partes.join(" / "));
  };

  function _getSesionDatosParaEmail() {
    const sel  = document.getElementById("select-prueba-envio");
    const uid  = sel ? sel.value : "";
    const info = state.clavesYEscalas[uid];
    const meta = getMeta(info ? info.materia : "");
    const ti   = document.getElementById("titulo-sesion");
    const di   = document.getElementById("duracion-sesion");
    const si   = document.getElementById("sala-sesion");
    return {
      titulo:          ti ? (ti.value.trim() || ("Ensayo " + meta.nombre)) : "Evaluacion PAES",
      asignatura:      meta.nombre || "PAES Oficial",
      duracionMinutos: di ? (parseInt(di.value) || 0) : 0,
      sala:            si ? (si.value.trim() || "SALA-1") : "SALA-1",
    };
  }

})();

