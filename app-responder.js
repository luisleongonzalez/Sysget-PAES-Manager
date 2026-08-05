// ──────────────────────────────────────────────────────────
// HOJA DE RESPUESTAS DEL ALUMNO - LÓGICA (Fase 2 Local)
// ──────────────────────────────────────────────────────────

const state = {
  token: null,
  envio: null,
  sesion: null,
  respuestas: {},
  numPreguntas: 0,
  focusCurrentQuestion: 1,
  viewMode: 'focus' // 'focus' (Estilo PreUNAB por defecto) | 'sheet'
};

// Toast notification helper
let toastTimeout;
function showToast(msg, duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  clearTimeout(toastTimeout);
  toast.textContent = msg;
  toast.className = 'toast visible';
  toastTimeout = setTimeout(() => {
    toast.className = 'toast';
  }, duration);
}

document.addEventListener('DOMContentLoaded', () => {
  inicializarHoja();
});

async function inicializarHoja() {
  // Configurar indicador visual de base de datos
  const dbBadge = document.getElementById('student-db-badge');
  const dbText = document.getElementById('student-db-text');
  if (dbBadge && dbText) {
    if (PAES_DB.isFirebase()) {
      dbBadge.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
      dbBadge.style.color = '#10b981';
      dbBadge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      dbBadge.querySelector('span').style.backgroundColor = '#10b981';
      dbText.textContent = 'Conectado a Firebase';
    } else {
      dbBadge.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
      dbBadge.style.color = '#f59e0b';
      dbBadge.style.borderColor = 'rgba(245, 158, 11, 0.3)';
      dbBadge.querySelector('span').style.backgroundColor = '#f59e0b';
      dbText.textContent = 'Modo Local (Sin Configurar)';
    }
  }

  const params = new URLSearchParams(window.location.search);
  state.token = params.get('token');
  
  if (!state.token) {
    mostrarPantalla('error-screen', 'Falta el token de acceso en la URL.');
    return;
  }
  
  try {
    const data = await PAES_DB.obtenerEnvioYPrueba(state.token);
    
    if (!data) {
      mostrarPantalla('error-screen', 'El token proporcionado no es válido, expiró o la sesión fue eliminada.');
      return;
    }
    
    state.envio = data.envio;
    state.sesion = data.sesion;
    
    // Validar estado del envío
    if (state.envio.estado === 'completado') {
      renderResumenYRetroalimentacion();
      mostrarPantalla('completado-screen');
      return;
    }
    
    // Cargar estado
    state.numPreguntas = state.sesion.numPreguntas;
    state.respuestas = state.envio.respuestas || {};

    const prevCount = Object.keys(state.respuestas).filter(k => state.respuestas[k] !== '').length;
    if (prevCount > 0) {
      setTimeout(() => {
        showToast(`💾 Sesión restaurada: Se cargaron ${prevCount} respuestas guardadas previamente.`, 4000);
      }, 600);
    }
    
    // Configurar interfaz
    document.getElementById('exam-title').textContent = state.sesion.titulo;
    document.getElementById('student-display-name').textContent = `Alumno: ${state.envio.alumnoNombre}`;
    
    // Obtener URL del PDF de la prueba (de la sesión o desde el catálogo)
    let pdfUrl = state.sesion.pdfUrl;
    if ((!pdfUrl || pdfUrl.toLowerCase().includes('temario')) && state.sesion.materia_anio) {
      try {
        const res = await fetch('catalogo_historico.json');
        const catalogo = await res.json();
        const [mat, anioStr] = state.sesion.materia_anio.split('_');
        const itemPrueba = catalogo.find(x => 
          x.tipo === 'prueba' && 
          x.materia === mat && 
          String(x.anio) === String(anioStr) &&
          !x.archivo.toLowerCase().includes('temario') &&
          !x.archivo.toLowerCase().includes('revista') &&
          !x.archivo.toLowerCase().includes('marcadas')
        );
        if (itemPrueba) pdfUrl = itemPrueba.url;
      } catch (err) {
        console.warn("No se pudo cargar catalogo_historico.json:", err);
      }
    }
    
    if (pdfUrl) {
      const pdfContainer = document.getElementById('btn-ver-pdf-container');
      const pdfLink      = document.getElementById('link-ver-pdf');
      const pdfIframe    = document.getElementById('pdf-iframe');

      // demre.cl bloquea iframes con X-Frame-Options → usar Google Docs Viewer
      const embedUrl = pdfUrl.includes('demre.cl') || pdfUrl.endsWith('.pdf')
        ? 'https://docs.google.com/viewer?url=' + encodeURIComponent(pdfUrl) + '&embedded=true'
        : pdfUrl;

      if (pdfContainer && pdfLink) {
        pdfLink.href = pdfUrl;           // link "pestaña nueva" → URL real
        pdfContainer.style.display = 'flex';
      }
      // Guardar URL embebible en dataset del iframe → split mode siempre la encuentra
      if (pdfIframe) pdfIframe.dataset.pdfUrl = embedUrl;
    }
    
    // Registrar fecha de inicio de la prueba si es la primera vez que abre
    if (!state.envio.fechaInicio) {
      state.envio.fechaInicio = new Date().toISOString();
    }
    
    renderPreguntasGrid();
    cambiarModoVista(state.viewMode || 'focus');
    actualizarProgreso();
    iniciarRelojConteoRegresivo();
    mostrarPantalla('exam-screen');
  } catch (e) {
    console.error("Error al inicializar la hoja:", e);
    mostrarPantalla('error-screen', `Error de base de datos: ${e.message}`);
  }
}

function mostrarPantalla(id, errorMsg = '') {
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('error-screen').style.display = 'none';
  document.getElementById('completado-screen').style.display = 'none';
  document.getElementById('exam-screen').style.display = 'none';
  
  if (id === 'error-screen' && errorMsg) {
    document.getElementById('error-message').textContent = errorMsg;
  }
  
  document.getElementById(id).style.display = 'block';
}

function renderPreguntasGrid() {
  const container = document.getElementById('grid-contenedor-preguntas');
  if (!container) return;
  
  let html = '';
  for (let q = 1; q <= state.numPreguntas; q++) {
    const qStr = String(q);
    const selectedVal = state.respuestas[qStr] || '';
    const isAnswered = selectedVal !== '';
    
    html += `
      <div class="question-row ${isAnswered ? 'answered' : ''}" id="row-${q}">
        <span class="question-num">${q}</span>
        <div class="options-container">
          <button class="option-btn ${selectedVal === 'A' ? 'selected' : ''}" onclick="marcarAlternativa(${q}, 'A')">A</button>
          <button class="option-btn ${selectedVal === 'B' ? 'selected' : ''}" onclick="marcarAlternativa(${q}, 'B')">B</button>
          <button class="option-btn ${selectedVal === 'C' ? 'selected' : ''}" onclick="marcarAlternativa(${q}, 'C')">C</button>
          <button class="option-btn ${selectedVal === 'D' ? 'selected' : ''}" onclick="marcarAlternativa(${q}, 'D')">D</button>
          <button class="option-btn ${selectedVal === 'E' ? 'selected' : ''}" onclick="marcarAlternativa(${q}, 'E')">E</button>
          <button class="option-btn omit-btn ${selectedVal === 'Omitir' || selectedVal === '' ? '' : ''}" onclick="marcarAlternativa(${q}, '')">Borrar</button>
        </div>
      </div>`;
  }
  
  container.innerHTML = html;
}

let autoSaveTimer = null;
function autoGuardarBorrador() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    if (state.token && state.respuestas && state.envio?.estado !== 'completado') {
      PAES_DB.guardarBorrador(state.token, state.respuestas);
    }
  }, 400);
}

function marcarAlternativa(pregunta, alternativa) {
  const qStr = String(pregunta);
  
  if (alternativa === '') {
    // Borrar respuesta
    delete state.respuestas[qStr];
  } else {
    state.respuestas[qStr] = alternativa;
  }
  
  // Actualizar visualmente la fila de alternativas en modo lista
  const row = document.getElementById(`row-${pregunta}`);
  if (row) {
    if (alternativa === '') {
      row.classList.remove('answered');
    } else {
      row.classList.add('answered');
    }
    
    // Desmarcar todos los botones de la fila
    row.querySelectorAll('.option-btn').forEach(btn => {
      btn.classList.remove('selected');
      if (btn.textContent === alternativa) {
        btn.classList.add('selected');
      }
    });
  }
  
  // Si estamos en modo enfocado, actualizar la tarjeta activa
  if (state.viewMode === 'focus') {
    renderFocusQuestion();
  }

  actualizarProgreso();
  autoGuardarBorrador();
}

function actualizarProgreso() {
  const respondidas = Object.keys(state.respuestas).filter(k => state.respuestas[k] !== '').length;
  const total = state.numPreguntas;
  const rawPct = total > 0 ? (respondidas / total) * 100 : 0;
  const pctRound = Math.round(rawPct);
  
  const fill = document.getElementById('progress-fill');
  const text = document.getElementById('progress-display-text');
  const badge = document.getElementById('progress-percentage-badge');
  
  if (fill) fill.style.width = `${pctRound}%`;
  if (text) text.textContent = `Respondidas: ${respondidas} de ${total} (${pctRound}%)`;
  if (badge) badge.textContent = `${rawPct.toFixed(2).replace('.', ',')}%`;
}

// ──────────────────────────────────────────────────────────
// MODO ENFOCADO PREGUNTA A PREGUNTA (ESTILO PREUNAB)
// ──────────────────────────────────────────────────────────
function cambiarModoVista(modo) {
  state.viewMode = modo;
  const btnSheet = document.getElementById('btn-mode-sheet');
  const btnFocus = document.getElementById('btn-mode-focus');
  const gridSheet = document.getElementById('grid-contenedor-preguntas');
  const focusBox = document.getElementById('focus-question-container');

  if (modo === 'focus') {
    if (btnSheet) { btnSheet.style.background = 'transparent'; btnSheet.style.color = '#94a3b8'; }
    if (btnFocus) { btnFocus.style.background = 'rgba(124,58,237,0.3)'; btnFocus.style.color = '#fff'; }
    if (gridSheet) gridSheet.style.display = 'none';
    if (focusBox) focusBox.style.display = 'block';
    renderFocusQuestion();
  } else {
    if (btnSheet) { btnSheet.style.background = 'rgba(124,58,237,0.3)'; btnSheet.style.color = '#fff'; }
    if (btnFocus) { btnFocus.style.background = 'transparent'; btnFocus.style.color = '#94a3b8'; }
    if (gridSheet) gridSheet.style.display = 'flex';
    if (focusBox) focusBox.style.display = 'none';
  }
}

function renderFocusQuestion() {
  const q = state.focusCurrentQuestion || 1;
  const qStr = String(q);
  const selectedVal = state.respuestas[qStr] || '';
  const total = state.numPreguntas;

  const txtHeader = document.getElementById('focus-question-header');
  const badgeStatus = document.getElementById('focus-status-badge');
  const optionsList = document.getElementById('focus-options-list');
  const btnPrev = document.getElementById('btn-focus-prev');
  const btnNext = document.getElementById('btn-focus-next');
  const gridJump = document.getElementById('focus-grid-jump');

  if (txtHeader) txtHeader.textContent = `PREGUNTA ${q} DE ${total}`;

  if (badgeStatus) {
    if (selectedVal) {
      badgeStatus.textContent = `Respondida (${selectedVal})`;
      badgeStatus.style.background = 'rgba(16, 185, 129, 0.15)';
      badgeStatus.style.color = '#34d399';
      badgeStatus.style.border = '1px solid rgba(16, 185, 129, 0.3)';
    } else {
      badgeStatus.textContent = 'Sin responder';
      badgeStatus.style.background = 'rgba(255, 255, 255, 0.05)';
      badgeStatus.style.color = '#94a3b8';
      badgeStatus.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    }
  }

  // Tarjetas de Opciones Estilo PreUNAB
  const opciones = ['A', 'B', 'C', 'D', 'E'];
  if (optionsList) {
    optionsList.innerHTML = opciones.map(opt => {
      const isSelected = selectedVal === opt;
      const bg = isSelected ? 'linear-gradient(135deg, rgba(124,58,237,0.35) 0%, rgba(109,40,217,0.45) 100%)' : 'rgba(255,255,255,0.03)';
      const border = isSelected ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.08)';
      const shadow = isSelected ? 'box-shadow: 0 0 16px rgba(124, 58, 237, 0.4);' : '';
      const colorLetter = isSelected ? '#ffffff' : '#a78bfa';
      const bgLetter = isSelected ? '#7c3aed' : 'rgba(167,139,250,0.12)';

      return `
        <div onclick="marcarAlternativa(${q}, '${opt}')" style="cursor:pointer; background:${bg}; border:${border}; ${shadow} border-radius:12px; padding:14px 18px; display:flex; align-items:center; gap:16px; transition:all 0.2s ease;">
          <div style="width:36px; height:36px; border-radius:10px; background:${bgLetter}; color:${colorLetter}; font-weight:800; font-size:16px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            ${opt}
          </div>
          <div style="font-size:15px; font-weight:600; color:${isSelected ? '#ffffff' : '#cbd5e1'};">
            Opción ${opt}
          </div>
          ${isSelected ? '<div style="margin-left:auto; color:#34d399; font-weight:700; font-size:16px;">✓</div>' : ''}
        </div>`;
    }).join('');
  }

  // Deshabilitar botones al inicio o fin
  if (btnPrev) btnPrev.disabled = q <= 1;
  if (btnNext) btnNext.disabled = q >= total;

  // Grilla Rápida Jump
  if (gridJump) {
    let jumpHtml = '';
    for (let i = 1; i <= total; i++) {
      const isCurrent = i === q;
      const isAns = !!state.respuestas[String(i)];
      const bg = isCurrent ? '#7c3aed' : (isAns ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)');
      const color = isCurrent ? '#ffffff' : (isAns ? '#34d399' : '#94a3b8');
      const border = isCurrent ? '1px solid #c084fc' : (isAns ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.08)');

      jumpHtml += `
        <button onclick="jumpToFocusQuestion(${i})" style="width:34px; height:34px; border-radius:8px; background:${bg}; color:${color}; border:${border}; font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s;">
          ${i}
        </button>`;
    }
    gridJump.innerHTML = jumpHtml;
  }
}

function navegarPreguntaFocus(delta) {
  const target = state.focusCurrentQuestion + delta;
  if (target >= 1 && target <= state.numPreguntas) {
    state.focusCurrentQuestion = target;
    renderFocusQuestion();
  }
}

function jumpToFocusQuestion(idx) {
  state.focusCurrentQuestion = idx;
  renderFocusQuestion();
}

function confirmarYEnviarPrueba() {
  const respondidas = Object.keys(state.respuestas).filter(k => state.respuestas[k] !== '').length;
  const total = state.numPreguntas;
  const omitidas = total - respondidas;
  
  let msg = `¿Estás seguro de que deseas enviar tus respuestas?\n\nRespondidas: ${respondidas}\nOmitidas/Sin responder: ${omitidas}`;
  if (omitidas > 0) {
    msg += `\n\n⚠️ Tienes ${omitidas} preguntas sin responder.`;
  }
  
  if (confirm(msg)) {
    enviarRespuestas();
  }
}

async function enviarRespuestas() {
  try {
    mostrarPantalla('loading-screen');
    await PAES_DB.enviarRespuestas(state.token, state.respuestas);
    state.envio.estado = 'completado';
    state.envio.respuestas = state.respuestas;
    renderResumenYRetroalimentacion();
    mostrarPantalla('completado-screen');
    showToast('📤 Respuestas enviadas con éxito!');
  } catch (e) {
    mostrarPantalla('exam-screen');
    showToast(`❌ Error al enviar respuestas: ${e.message}`);
  }
}

// ──────────────────────────────────────────────────────────
// RETROALIMENTACIÓN PEDAGÓGICA (MATEMÁTICA PASO A PASO + ARGUMENTACIÓN)
// ──────────────────────────────────────────────────────────

let explicacionesCache = null;
async function cargarExplicacionesJSON() {
  if (explicacionesCache) return explicacionesCache;
  try {
    const res = await fetch('explicaciones_paes.json');
    if (res.ok) {
      explicacionesCache = await res.json();
      return explicacionesCache;
    }
  } catch (err) {
    console.warn("No se pudo cargar explicaciones_paes.json:", err);
  }
  return null;
}

function generarExplicacionPedagogica(qNum, materia, claveCorrecta, opcionAlumno, datosExp) {
  const isMath = ['m1', 'm2', 'matematica'].includes(materia);
  const esCorrecta = opcionAlumno === claveCorrecta;
  const esOmitida = !opcionAlumno || opcionAlumno === '';

  if (datosExp) {
    if (isMath) {
      const opAnalisis = datosExp.analisis_opciones || {};
      const diagOp = !esCorrecta && !esOmitida ? (opAnalisis[opcionAlumno] || '') : '';

      return `
        <div style="font-size: 13px; line-height: 1.5; color: #d1d5db;">
          <div style="margin-bottom: 6px; font-weight: 700; color: #c084fc; font-size: 14px;">
            📘 Eje Temático: ${datosExp.eje} — <span style="color:#a78bfa; font-weight:600;">${datosExp.subtema}</span>
          </div>
          <div style="background: rgba(124, 58, 237, 0.12); border-left: 4px solid #7c3aed; padding: 10px 14px; margin-bottom: 12px; border-radius: 6px; font-size: 13px; color: #e9d5ff;">
            <strong>📌 Definición / Propiedad Clave:</strong><br>${datosExp.definicion}
          </div>
          <div style="font-weight: 700; color: #f3f4f6; margin-bottom: 6px; font-size: 13px;">🧮 Resolución Paso a Paso:</div>
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: #e5e7eb; background: rgba(15, 23, 42, 0.4); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
            <div><strong style="color:#a78bfa;">1. Planteamiento:</strong> ${datosExp.paso1}</div>
            <div><strong style="color:#a78bfa;">2. Desarrollo Matemático:</strong> ${datosExp.paso2}</div>
            <div><strong style="color:#a78bfa;">3. Conclusión:</strong> ${datosExp.paso3}</div>
          </div>
          ${diagOp ? `
          <div style="margin-top: 10px; background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 10px 14px; border-radius: 6px; font-size: 12.5px; color: #fca5a5;">
            <strong>⚠️ Diagnóstico del Error en Opción (${opcionAlumno}):</strong><br>${diagOp}
          </div>
          ` : ''}
        </div>
      `;
    } else {
      const opAnalisis = datosExp.analisis_opciones || {};
      const diagOp = !esCorrecta && !esOmitida ? (opAnalisis[opcionAlumno] || '') : '';

      return `
        <div style="font-size: 13px; line-height: 1.5; color: #d1d5db;">
          <div style="margin-bottom: 6px; font-weight: 700; color: #38bdf8; font-size: 14px;">
            🎯 Eje / Habilidad: ${datosExp.eje} — <span style="color:#7dd3fc; font-weight:600;">${datosExp.habilidad}</span>
          </div>
          <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; padding: 10px 14px; margin-bottom: 10px; border-radius: 6px; font-size: 13px; color: #a7f3d0;">
            <strong>✅ Justificación de la Respuesta Correcta (${claveCorrecta}):</strong><br>${datosExp.justificacion}
          </div>
          ${diagOp ? `
          <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 10px 14px; border-radius: 6px; font-size: 12.5px; color: #fca5a5;">
            <strong>⚠️ Argumentación del Error en Opción (${opcionAlumno}):</strong><br>${diagOp}
          </div>
          ` : ''}
        </div>
      `;
    }
  }

  // Fallback si no está en la base de datos JSON
  if (isMath) {
    return `
      <div style="font-size: 13px; line-height: 1.5; color: #d1d5db;">
        <div style="margin-bottom: 6px; font-weight: 700; color: #a78bfa;">📘 Eje Evaluado: Matemática PAES</div>
        <div style="background: rgba(124, 58, 237, 0.08); border-left: 3px solid #7c3aed; padding: 8px 12px; margin-bottom: 10px; border-radius: 4px; font-size: 12px; color: #e9d5ff;">
          <strong>Definición / Propiedad:</strong> Despeje de ecuaciones algebraicas y orden de operaciones.
        </div>
        <div style="font-weight: 600; color: #f3f4f6; margin-bottom: 4px;">🧮 Resolución Paso a Paso:</div>
        <ol style="margin: 0; padding-left: 20px; font-size: 12px; color: #9ca3af;">
          <li><strong>Paso 1:</strong> Identificar términos conocidos y aislar la incógnita.</li>
          <li><strong>Paso 2:</strong> Simplificar los términos agrupados aplicando propiedades numéricas.</li>
          <li><strong>Paso 3:</strong> Verificar que la solución despejada corresponde a la opción (${claveCorrecta}).</li>
        </ol>
      </div>
    `;
  } else {
    return `
      <div style="font-size: 13px; line-height: 1.5; color: #d1d5db;">
        <div style="margin-bottom: 6px; font-weight: 700; color: #38bdf8;">🎯 Habilidad Evaluada: Análisis e Interpretación</div>
        <div style="background: rgba(16, 185, 129, 0.08); border-left: 3px solid #10b981; padding: 8px 12px; margin-bottom: 8px; border-radius: 4px; font-size: 12px; color: #a7f3d0;">
          <strong>Justificación Opción (${claveCorrecta}):</strong> Corresponde rigurosamente a la evidencia presentada en el texto/estímulo.
        </div>
      </div>
    `;
  }
}

async function renderResumenYRetroalimentacion() {
  if (!state.sesion || !state.envio) return;

  const explicacionesDb = await cargarExplicacionesJSON();
  const uid = state.sesion.materia_anio || '';
  const datosPruebaExp = explicacionesDb ? explicacionesDb[uid] : null;

  const claves = state.sesion.claves || {};
  const pilotos = (state.sesion.pilotos || []).map(String);
  const escala = state.sesion.escala || {};
  const respuestas = state.envio.respuestas || {};
  const totalPreguntas = state.sesion.numPreguntas || Object.keys(claves).length;
  const materia = (state.sesion.materia_anio || '').split('_')[0] || 'general';

  let buenas = 0;
  let malas = 0;
  let omitidas = 0;

  for (let q = 1; q <= totalPreguntas; q++) {
    const qStr = String(q);
    if (pilotos.includes(qStr)) continue;

    const resp = respuestas[qStr];
    const corr = claves[qStr];

    if (!resp || resp === '') {
      omitidas++;
    } else if (resp === corr) {
      buenas++;
    } else {
      malas++;
    }
  }

  let puntajePAES = escala[String(buenas)];
  if (puntajePAES === undefined) {
    const pct = totalPreguntas > 0 ? (buenas / totalPreguntas) : 0;
    puntajePAES = Math.round(100 + pct * 900);
  }

  const elPuntaje = document.getElementById('resumen-puntaje');
  const elBuenas = document.getElementById('resumen-buenas');
  const elMalas = document.getElementById('resumen-malas');
  const elOmitidas = document.getElementById('resumen-omitidas');

  if (elPuntaje) elPuntaje.textContent = `${puntajePAES} pts`;
  if (elBuenas) elBuenas.textContent = buenas;
  if (elMalas) elMalas.textContent = malas;
  if (elOmitidas) elOmitidas.textContent = omitidas;

  const container = document.getElementById('contenedor-retroalimentacion');
  if (!container) return;

  let html = '';
  for (let q = 1; q <= totalPreguntas; q++) {
    const qStr = String(q);
    const corr = claves[qStr] || 'A';
    const resp = respuestas[qStr] || '';
    const esPiloto = pilotos.includes(qStr);
    const esCorrecta = resp === corr;
    const esOmitida = !resp || resp === '';

    let badgeClass = 'rgba(16, 185, 129, 0.15)';
    let badgeBorder = 'rgba(16, 185, 129, 0.4)';
    let badgeColor = '#10b981';
    let badgeText = '✓ Correcta';

    if (esOmitida) {
      badgeClass = 'rgba(245, 158, 11, 0.15)';
      badgeBorder = 'rgba(245, 158, 11, 0.4)';
      badgeColor = '#f59e0b';
      badgeText = '– Omitida';
    } else if (!esCorrecta) {
      badgeClass = 'rgba(239, 68, 68, 0.15)';
      badgeBorder = 'rgba(239, 68, 68, 0.4)';
      badgeColor = '#ef4444';
      badgeText = '✗ Incorrecta';
    }

    const expPregunta = datosPruebaExp && datosPruebaExp.preguntas ? datosPruebaExp.preguntas[qStr] : null;
    const explicacionHtml = generarExplicacionPedagogica(q, materia, corr, resp, expPregunta);

    html += `
      <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 8px;">
          <span style="font-weight: 700; font-size: 14px; color: #f3f4f6;">Pregunta #${q} ${esPiloto ? '<span style="font-size:11px; color:#9ca3af;">(Piloto - No suma puntaje)</span>' : ''}</span>
          <span style="font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 99px; background: ${badgeClass}; border: 1px solid ${badgeBorder}; color: ${badgeColor};">
            ${badgeText}
          </span>
        </div>
        <div style="display: flex; gap: 15px; margin-bottom: 10px; font-size: 13px;">
          <div><strong style="color:#9ca3af;">Tu Respuesta:</strong> <span style="color:${esCorrecta ? '#10b981' : (esOmitida ? '#f59e0b' : '#ef4444')}; font-weight:700;">${esOmitida ? 'Sin responder' : resp}</span></div>
          <div><strong style="color:#9ca3af;">Clave Correcta:</strong> <span style="color:#10b981; font-weight:700;">${corr}</span></div>
        </div>
        ${explicacionHtml}
      </div>
    `;
  }

  container.innerHTML = html;
}

// ──────────────────────────────────────────────────────────
// RELOJ CON CUENTA REGRESIVA Y AUTO-ENVÍO
// ──────────────────────────────────────────────────────────

let timerInterval = null;

function iniciarRelojConteoRegresivo() {
  const duracion = state.sesion.duracionMinutos;
  
  // Si duracion es 0 o no existe → sin límite de tiempo
  if (!duracion || duracion <= 0) return;
  
  const timerBox  = document.getElementById('exam-timer-box');
  const timerText = document.getElementById('exam-timer-text');
  if (!timerBox || !timerText) return;
  
  timerBox.style.display = 'block';
  
  // Calcular tiempo restante desde el momento en que abrió la prueba
  const fechaInicio = new Date(state.envio.fechaInicio || new Date().toISOString());
  const limiteSeg   = duracion * 60;
  
  function tick() {
    const ahora      = new Date();
    const transcurrido = Math.floor((ahora - fechaInicio) / 1000);
    const restante   = limiteSeg - transcurrido;
    
    if (restante <= 0) {
      // ¡Tiempo agotado! → Auto-envío
      clearInterval(timerInterval);
      timerText.textContent = '⌛ ¡TIEMPO FINALIZADO!';
      timerBox.style.background = 'rgba(239, 68, 68, 0.35)';
      timerBox.style.borderColor = 'rgba(239, 68, 68, 0.8)';
      
      // Bloquear todos los botones de alternativas
      document.querySelectorAll('.option-btn').forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.4';
        btn.style.cursor  = 'not-allowed';
      });
      
      // Auto-envío silencioso
      setTimeout(() => {
        showToast('⌛ Tiempo finalizado. Enviando respuestas automáticamente...');
        enviarRespuestas();
      }, 1500);
      
      return;
    }
    
    // Formato HH:MM:SS
    const hh  = String(Math.floor(restante / 3600)).padStart(2, '0');
    const mm  = String(Math.floor((restante % 3600) / 60)).padStart(2, '0');
    const ss  = String(restante % 60).padStart(2, '0');
    timerText.textContent = `⏱️ Tiempo Restante: ${hh}:${mm}:${ss}`;
    
    // Cambio de color según urgencia
    if (restante <= 300) {               // Últimos 5 minutos → rojo brillante pulsante
      timerBox.style.background   = 'rgba(239, 68, 68, 0.25)';
      timerBox.style.borderColor  = 'rgba(239, 68, 68, 0.7)';
      timerBox.style.animation    = 'pulse-danger 1s infinite';
      timerText.style.color       = '#ff4444';
    } else if (restante <= 600) {        // Últimos 10 minutos → naranja
      timerBox.style.background   = 'rgba(245, 158, 11, 0.15)';
      timerBox.style.borderColor  = 'rgba(245, 158, 11, 0.5)';
      timerText.style.color       = '#fbbf24';
    }
  }
  
  tick(); // Primera llamada inmediata
  timerInterval = setInterval(tick, 1000);
}

let modoDivididoActivo = false;

function toggleModoDividido() {
  const container = document.getElementById('main-mobile-container');
  const pdfPanel = document.getElementById('pdf-side-panel');
  const iframe = document.getElementById('pdf-iframe');
  const btnToggle = document.getElementById('btn-toggle-split');
  const pdfLink = document.getElementById('link-ver-pdf');
  
  modoDivididoActivo = !modoDivididoActivo;
  
  if (modoDivididoActivo) {
    // Usar dataset como fuente de verdad para la URL del PDF
    const storedUrl = iframe ? iframe.dataset.pdfUrl : '';
    const linkUrl   = pdfLink ? pdfLink.href : '';
    const urlToLoad = storedUrl || linkUrl;
    if (iframe && urlToLoad && urlToLoad !== 'about:blank' && !urlToLoad.endsWith('#')) {
      iframe.src = urlToLoad;
      if (!iframe.dataset.pdfUrl) iframe.dataset.pdfUrl = urlToLoad;
    }
    if (pdfPanel) pdfPanel.style.display = 'block';
    if (container) container.classList.add('split-layout-active');
    if (btnToggle) btnToggle.innerHTML = '📱 Ocultar PDF (Solo Hoja)';
  } else {
    // Al ocultar NO borrar el src, solo ocultar el panel
    if (pdfPanel) pdfPanel.style.display = 'none';
    if (container) container.classList.remove('split-layout-active');
    if (btnToggle) btnToggle.innerHTML = '📖 Ver PDF y Hoja en Misma Pantalla';
  }
}
