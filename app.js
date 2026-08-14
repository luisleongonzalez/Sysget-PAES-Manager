/* ═══════════════════════════════════════════════════════════
   PAES MANAGER - APP.JS
   Lógica de la aplicación web
═══════════════════════════════════════════════════════════ */

// ──────────────────────────────────────────────────────────
// ESTADO GLOBAL
// ──────────────────────────────────────────────────────────
const state = {
  descargados: JSON.parse(localStorage.getItem('paes_descargados') || '[]'),
  ensayos:     JSON.parse(localStorage.getItem('paes_ensayos') || '[]'),
  paginasUsadas: JSON.parse(localStorage.getItem('paes_paginas_usadas') || '{}'),
  catalogoRaw: [],        // datos crudos del JSON
  anioActivoDescarga: 'all',
  anioActivoMezcla: 'all',
  clavesYEscalas: {},     // claves y escalas desde JSON
  alumnosEnSession: [],   // alumnos de la sesión en creación
  sesionActivaDocente: null,
  sesionActivaDocenteData: null,
  enviosActivos: [],
  evaluacionPersonalizada: null  // configuración del generador: { activa, numPreguntas, duracionMinutos, uidClavijero, ... }
};

// Íconos y colores por materia
const MATERIA_META = {
  historia:   { icon: '📜', color: '#1a6bc4', nombre: 'Historia y CC.SS' },
  matematica: { icon: '📐', color: '#7c3aed', nombre: 'Matemática' },
  m1:         { icon: '📐', color: '#7c3aed', nombre: 'Mat. M1' },
  m2:         { icon: '🧮', color: '#9333ea', nombre: 'Mat. M2' },
  lectora:    { icon: '📖', color: '#0891b2', nombre: 'Comp. Lectora' },
  biologia:   { icon: '🧬', color: '#059669', nombre: 'Biología' },
  quimica:    { icon: '⚗️', color: '#dc2626', nombre: 'Química' },
  fisica:     { icon: '⚡', color: '#f59e0b', nombre: 'Física' },
  tp:         { icon: '🔧', color: '#64748b', nombre: 'Ciencias T.P.' },
  desconocida:{ icon: '📄', color: '#94a3b8', nombre: 'Prueba' },
};

function getMeta(materia) {
  return MATERIA_META[materia] || MATERIA_META.desconocida;
}

// Cargar catálogo histórico desde JSON
async function cargarCatalogo() {
  try {
    const r = await fetch('catalogo_historico.json');
    if (!r.ok) throw new Error('No se pudo cargar el catálogo');
    state.catalogoRaw = await r.json();
    return state.catalogoRaw;
  } catch(e) {
    console.warn('catalogo_historico.json no encontrado:', e.message);
    return [];
  }
}

// Cargar claves y escalas extraídas desde JSON
async function cargarClavesYEscalas() {
  try {
    const r = await fetch('claves_y_escalas.json');
    if (!r.ok) throw new Error('No se pudo cargar las claves y escalas');
    state.clavesYEscalas = await r.json();
    rellenarSelectorClavijeros();
    return state.clavesYEscalas;
  } catch(e) {
    console.warn('claves_y_escalas.json no encontrado:', e.message);
    return {};
  }
}

// Rellenar el selector de pruebas en la pestaña 'Enviar'
function rellenarSelectorClavijeros() {
  const select = document.getElementById('select-prueba-envio');
  if (!select) return;
  
  if (Object.keys(state.clavesYEscalas).length === 0) {
    select.innerHTML = '<option value="">No hay clavijeros disponibles</option>';
    return;
  }
  
  let html = '<option value="">-- Seleccionar Prueba --</option>';
  for (const uid in state.clavesYEscalas) {
    const item = state.clavesYEscalas[uid];
    const meta = getMeta(item.materia);
    html += `<option value="${uid}">${meta.nombre} (Proceso ${item.anio})</option>`;
  }
  select.innerHTML = html;
}

function getPruebas(anio = 'all') {
  return state.catalogoRaw.filter(x => {
    const arch = x.archivo.toLowerCase();
    const esPrueba = x.tipo === 'prueba' && !arch.includes('temario') && !arch.includes('revista') && !arch.includes('marcadas');
    return esPrueba && (anio === 'all' || String(x.anio) === String(anio));
  });
}

function getClavijeros(anio = 'all') {
  return state.catalogoRaw.filter(x => {
    const arch = x.archivo.toLowerCase();
    const esClav = x.tipo === 'clavijero' && !arch.includes('temario') && !arch.includes('revista');
    return esClav && (anio === 'all' || String(x.anio) === String(anio));
  });
}

// ──────────────────────────────────────────────────────────
// RENDERIZAR GRILLAS DINÁMICAS
// ──────────────────────────────────────────────────────────

function renderPruebasGrid(anio = 'all') {
  const grid = document.getElementById('pruebas-grid');
  if (!grid) return;

  const pruebas = getPruebas(anio);
  if (!pruebas.length) {
    grid.innerHTML = '<p style="color:var(--text-muted); padding:1rem">No hay pruebas para este filtro.</p>';
    return;
  }

  grid.innerHTML = pruebas.map(p => {
    const meta = getMeta(p.materia);
    const uid  = `${p.materia}_${p.anio}`;
    const yaDesc = state.descargados.includes(uid);
    const badgeHtml = yaDesc
      ? '<span class="status-badge status-done">✓ Descargado</span>'
      : '<span class="status-badge status-pending">⏳ Pendiente</span>';
    return `
    <div class="prueba-card" data-id="${uid}" data-anio="${p.anio}" data-tipo="prueba">
      <div class="prueba-card-header" style="--color: ${meta.color}">
        <div class="prueba-icon">${meta.icon}</div>
        <div class="prueba-info">
          <h3>${meta.nombre}</h3>
          <span class="prueba-date">Proceso ${p.anio}</span>
        </div>
        <div class="prueba-status" id="status-${uid}">${badgeHtml}</div>
      </div>
      <div class="prueba-card-body">
        <p style="font-size:12px;color:var(--text-muted);word-break:break-all">${p.archivo}</p>
        <div class="prueba-actions">
          <a href="${p.url}" target="_blank" class="btn-sm btn-download"
             onclick="marcarDescargado('${uid}')">⬇ Descargar PDF</a>
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderClavijeros(anio = 'all') {
  const grid = document.getElementById('clavijeros-grid');
  if (!grid) return;

  const clavs = getClavijeros(anio);
  if (!clavs.length) {
    grid.innerHTML = '<p style="color:var(--text-muted); padding:1rem">No hay clavijeros para este filtro.</p>';
    return;
  }

  grid.innerHTML = clavs.map(c => {
    const meta = getMeta(c.materia);
    return `
    <div class="clav-item">
      <span class="clav-icon">🔑</span>
      <div class="clav-info">
        <strong>${meta.nombre}</strong>
        <span>Proceso ${c.anio}</span>
      </div>
      <a href="${c.url}" target="_blank" class="btn-sm btn-download">⬇ PDF</a>
    </div>`;
  }).join('');
}

function renderSelectorMezcla(anio = 'all') {
  const sel = document.getElementById('prueba-selector');
  if (!sel) return;

  const pruebas = getPruebas(anio);
  // Deduplicar por materia+anio
  const visto = new Set();
  const unicas = pruebas.filter(p => {
    const k = `${p.materia}_${p.anio}`;
    if (visto.has(k)) return false;
    visto.add(k);
    return true;
  });

  sel.innerHTML = unicas.map((p, i) => {
    const meta = getMeta(p.materia);
    const uid  = `${p.materia}_${p.anio}`;
    const checked = (i < 3) ? 'checked' : '';
    return `
    <label class="selector-item" data-id="${uid}" data-anio="${p.anio}">
      <input type="checkbox" value="${uid}" class="sel-check" ${checked}>
      <div class="sel-icon" style="--color: ${meta.color}">${meta.icon}</div>
      <div class="sel-info">
        <strong>${meta.nombre}</strong>
        <span>Proceso ${p.anio}</span>
      </div>
      <div class="sel-pages">
        <input type="number" class="pages-input" value="10" min="1" max="50"
               id="pages-${uid}" placeholder="págs">
        <span>pág.</span>
      </div>
    </label>`;
  }).join('');

  // Re-bind listeners
  initEventListeners();
  actualizarComando();
}

// ──────────────────────────────────────────────────────────
// FILTROS POR AÑO
// ──────────────────────────────────────────────────────────
function filtrarAnio(anio, btn) {
  document.querySelectorAll('#year-filters .year-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  state.anioActivoDescarga = anio;
  renderPruebasGrid(anio);
  renderClavijeros(anio);
}

function filtrarAnioMezcla(anio, btn) {
  const parent = btn?.closest('.year-filters');
  if (parent) parent.querySelectorAll('.year-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  state.anioActivoMezcla = anio;
  renderSelectorMezcla(anio);
}



// ──────────────────────────────────────────────────────────
// SISTEMA DE ROLES Y NAVEGACIÓN SIMPLIFICADA
// ──────────────────────────────────────────────────────────

function setRole(role) {
  state.currentRole = role;
  localStorage.setItem('paes_user_role', role);
  renderNavbar();

  if (role === 'landing') {
    showSection('landing');
    const subtabs = document.getElementById('subtabs-evaluaciones');
    if (subtabs) subtabs.style.display = 'none';
  } else if (role === 'docente' || role === 'admin') {
    setAppView('evaluaciones');
  }
}

function renderNavbar() {
  const nav = document.getElementById('main-nav');
  const roleIndicator = document.getElementById('header-role-indicator');
  const roleBadge = document.getElementById('nav-role-badge');
  const role = state.currentRole || 'landing';

  if (!nav) return;

  if (role === 'landing') {
    if (roleIndicator) roleIndicator.style.display = 'none';
    nav.innerHTML = `
      <a href="#landing" class="nav-link active" onclick="showSection('landing')">Inicio</a>
      <a href="#landing" class="nav-link" onclick="document.getElementById('landing-token-input')?.focus()">🎓 Alumnos</a>
      <a href="#landing" class="nav-link" onclick="setRole('docente')">👨‍🏫 Profesores</a>
      <a href="#landing" class="nav-link" onclick="setRole('admin')">⚙️ Admin</a>
    `;
  } else if (role === 'docente') {
    if (roleIndicator) {
      roleIndicator.style.display = 'flex';
      if (roleBadge) {
        roleBadge.className = 'role-badge-nav docente';
        roleBadge.innerHTML = '👨‍🏫 Docente';
      }
    }
    nav.innerHTML = `
      <a href="#mezcla" class="nav-link active" id="nav-evaluaciones" onclick="setAppView('evaluaciones')">📚 Evaluaciones</a>
      <a href="#enviar" class="nav-link" id="nav-enviar" onclick="setAppView('enviar')">📤 Enviar Evaluación</a>
      <a href="#resultados" class="nav-link" id="nav-resultados" onclick="setAppView('resultados')">📊 Resultados</a>
    `;
  } else if (role === 'admin') {
    if (roleIndicator) {
      roleIndicator.style.display = 'flex';
      if (roleBadge) {
        roleBadge.className = 'role-badge-nav admin';
        roleBadge.innerHTML = '⚙️ Administrador';
      }
    }
    nav.innerHTML = `
      <a href="#mezcla" class="nav-link active" id="nav-evaluaciones" onclick="setAppView('evaluaciones')">📚 Evaluaciones</a>
      <a href="#enviar" class="nav-link" id="nav-enviar" onclick="setAppView('enviar')">📤 Enviar Evaluación</a>
      <a href="#resultados" class="nav-link" id="nav-resultados" onclick="setAppView('resultados')">📊 Resultados</a>
      <a href="#admin-panel" class="nav-link" id="nav-admin" onclick="setAppView('admin')">⚙️ Sistema</a>
    `;
  }
}

function setAppView(view) {
  const subtabs = document.getElementById('subtabs-evaluaciones');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  if (view === 'evaluaciones') {
    if (subtabs) subtabs.style.display = 'flex';
    const navEval = document.getElementById('nav-evaluaciones');
    if (navEval) navEval.classList.add('active');
    const sub = state.currentSubModulo || 'mezcla';
    showSubModulo(sub);
  } else {
    if (subtabs) subtabs.style.display = 'none';
    if (view === 'enviar') {
      const navEnv = document.getElementById('nav-enviar');
      if (navEnv) navEnv.classList.add('active');
      showSection('enviar');
    }
    if (view === 'resultados') {
      const navRes = document.getElementById('nav-resultados');
      if (navRes) navRes.classList.add('active');
      showSection('resultados');
    }
    if (view === 'admin') {
      const navAdm = document.getElementById('nav-admin');
      if (navAdm) navAdm.classList.add('active');
      showSection('admin-panel');
    }
  }
}

function showSubModulo(subId) {
  state.currentSubModulo = subId;
  document.querySelectorAll('.subtab-pill').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.getElementById('subtab-' + subId);
  if (activeBtn) activeBtn.classList.add('active');

  showSection(subId);
}

function irAResponderToken() {
  const input = document.getElementById('landing-token-input');
  if (!input) return;
  const token = input.value.trim();
  if (!token) {
    input.focus();
    if (typeof mostrarToast === 'function') {
      mostrarToast('⚠️ Por favor ingresa tu código de evaluación o token.');
    } else {
      alert('Por favor ingresa tu código de evaluación o token.');
    }
    return;
  }
  window.location.href = `responder.html?token=${encodeURIComponent(token)}`;
}

// ──────────────────────────────────────────────────────────
// NAVEGACIÓN ENTRE SECCIONES & ROUTING CON HASH
// ──────────────────────────────────────────────────────────
function toggleNavMobile() {
  const nav = document.getElementById('main-nav');
  const btn = document.getElementById('nav-mobile-toggle');
  if (!nav || !btn) return;
  const isOpen = nav.classList.toggle('is-open');
  btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function showSection(id, pushState = true) {
  const subtabs = document.getElementById('subtabs-evaluaciones');
  const evaluacionesSections = ['mezcla', 'descarga', 'ensayos', 'biblioteca', 'generar', 'ayuda'];

  if (evaluacionesSections.includes(id)) {
    if (state.currentRole === 'landing') {
      state.currentRole = 'docente';
      renderNavbar();
    }
    if (subtabs) subtabs.style.display = 'flex';
    document.querySelectorAll('.subtab-pill').forEach(btn => btn.classList.remove('active'));
    const pill = document.getElementById('subtab-' + id);
    if (pill) pill.classList.add('active');
    
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const navEval = document.getElementById('nav-evaluaciones');
    if (navEval) navEval.classList.add('active');
  } else if (id === 'landing') {
    if (subtabs) subtabs.style.display = 'none';
  } else {
    if (subtabs) subtabs.style.display = 'none';
  }

  // Ocultar todas las secciones
  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));

  // Mostrar la seleccionada
  const section = document.getElementById(id);
  if (section) {
    section.classList.remove('hidden');
    section.style.animation = 'none';
    section.offsetHeight; // reflow
    section.style.animation = '';
  }

  // Activar nav link
  const navLink = document.getElementById('nav-' + id);
  if (navLink) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    navLink.classList.add('active');
    navLink.setAttribute('aria-current', 'page');
  }

  // Cerrar menú móvil si está abierto
  const mainNav = document.getElementById('main-nav');
  const navToggle = document.getElementById('nav-mobile-toggle');
  if (mainNav) mainNav.classList.remove('is-open');
  if (navToggle) navToggle.setAttribute('aria-expanded', 'false');

  // Actualizar Hash en la URL
  if (pushState && location.hash !== '#' + id) {
    history.pushState(null, null, '#' + id);
  }

  // Acciones por sección
  if (id === 'descarga') {
    renderPruebasGrid(state.anioActivoDescarga);
    renderClavijeros(state.anioActivoDescarga);
  }
  if (id === 'ensayos') renderEnsayos();
  if (id === 'mezcla') actualizarComando();
  if (id === 'generar' && typeof renderGeneradorEvaluacion === 'function') renderGeneradorEvaluacion();

  // Scroll al contenido
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Escuchar navegación Atrás/Adelante del navegador
window.addEventListener('popstate', () => {
  const section = location.hash.replace('#', '') || 'landing';
  showSection(section, false);
});


// ──────────────────────────────────────────────────────────
// MARCA DESCARGADOS
// ──────────────────────────────────────────────────────────
function marcarDescargado(id) {
  if (!state.descargados.includes(id)) {
    state.descargados.push(id);
    localStorage.setItem('paes_descargados', JSON.stringify(state.descargados));
  }

  // Actualizar badge de estado
  const statusEl = document.getElementById('status-' + id);
  if (statusEl) {
    statusEl.innerHTML = '<span class="status-badge status-done">✓ Descargado</span>';
  }

  const [mat] = id.split('_');
  showToast('📥 Descarga iniciada: ' + (getMeta(mat)?.nombre || id));
}

// ──────────────────────────────────────────────────────────
// GENERADOR DE COMANDO PYTHON
// ──────────────────────────────────────────────────────────
function actualizarComando() {
  const checks = document.querySelectorAll('.sel-check:checked');
  if (checks.length === 0) {
    document.getElementById('cmd-preview').innerHTML =
      '<div class="cmd-placeholder"><span>⚠️</span><p>Selecciona al menos una prueba</p></div>';
    document.getElementById('btn-copiar').style.display = 'none';
    return;
  }

  const titulo     = document.getElementById('titulo-ensayo')?.value || 'Ensayo PAES';
  const aleatorio  = document.getElementById('aleatorio')?.checked;
  const registrar  = document.getElementById('registrar')?.checked;

  const pruebas = [];
  checks.forEach(chk => {
    const id = chk.value;
    const pagesEl = document.getElementById('pages-' + id);
    const pages = pagesEl ? parseInt(pagesEl.value) || 10 : 10;
    pruebas.push({ id, pages });
  });

  // Construir comando
  const pruebasArg = pruebas.map(p => p.id).join(' ');
  const paginasArg = pruebas[0]?.pages || 10;  // simplificado: misma para todas

  let cmd = `python mezclar_paes.py ^\n`;
  cmd += `  --rapido ${pruebasArg} ^\n`;
  cmd += `  --paginas ${paginasArg} ^\n`;
  cmd += `  --titulo "${titulo}"`;

  if (!aleatorio) cmd += ' ^\n  # (sin aleatoriedad: edita el script)';
  if (!registrar) cmd += '\n# (sin registrar: quita el flag en el script)';

  // También comandos individuales por prueba con páginas distintas
  const hasDifPages = pruebas.some(p => p.pages !== pruebas[0].pages);

  let cmdPrev = `# Comando para PowerShell / Terminal\n# Carpeta: ${window.location.pathname || 'c:\\Proyectos\\Proyecto PAES WEB'}\n\n`;

  if (!hasDifPages) {
    cmdPrev += cmd;
  } else {
    // Modo interactivo recomendado si hay diferentes paginas
    cmdPrev += `# Como las pruebas tienen distintas páginas,\n# usa el modo interactivo:\n\npython mezclar_paes.py\n\n# O edita el archivo config_ensayo.json:`;
    const configJson = JSON.stringify({
      titulo,
      aleatorio,
      registrar,
      pruebas: pruebas.map(p => ({ id: p.id, paginas: p.pages }))
    }, null, 2);
    cmdPrev += `\n# config_ensayo.json:\n${configJson}`;
  }

  document.getElementById('cmd-preview').textContent = cmdPrev;
  document.getElementById('btn-copiar').style.display = 'block';

  // Mostrar resumen
  mostrarResumen(pruebas, titulo);
}

function generarComando() {
  actualizarComando();
  const resCard = document.getElementById('resumen-card');
  if (resCard) resCard.style.display = 'block';
  showToast('✅ Comando generado. ¡Cópialo y ejecútalo!');
}

/**
 * Genera el archivo PDF ensamblado directamente en el navegador usando PDF-lib
 * sin necesidad de ejecutar scripts Python en la terminal.
 */
async function generarPDFDirectoNavegador() {
  const checks = document.querySelectorAll('.sel-check:checked');
  if (checks.length === 0) {
    showToast('⚠️ Selecciona al menos una prueba para mezclar');
    return;
  }

  if (typeof PDFLib === 'undefined') {
    showToast('❌ La librería PDF-Lib aún no ha cargado. Verifica tu conexión.');
    return;
  }

  const btn = document.getElementById('btn-generar-pdf-directo');
  const btnOriginalText = btn ? btn.textContent : '';
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Procesando PDF en navegador...';
  }

  const titulo = document.getElementById('titulo-ensayo')?.value.trim() || 'Ensayo PAES Mezclado';
  const aleatorio = document.getElementById('aleatorio')?.checked;
  const registrar = document.getElementById('registrar')?.checked;

  try {
    showToast('⏳ Descargando y combinando páginas PDF...');
    const mergedPdf = await PDFLib.PDFDocument.create();
    
    let paginasProcesadasTotales = 0;
    const paginasReg = state.paginasUsadas || {};

    for (const chk of checks) {
      const id = chk.value;
      const pagesEl = document.getElementById('pages-' + id);
      const cantPaginasDeseadas = pagesEl ? parseInt(pagesEl.value) || 10 : 10;

      const [mat, anioStr] = id.split('_');
      const itemPrueba = (state.catalogoRaw || []).find(x => x.tipo === 'prueba' && x.materia === mat && String(x.anio) === String(anioStr));

      if (!itemPrueba || !itemPrueba.url) {
        console.warn(`[PDF Mixer] No se encontró URL para la prueba ${id}`);
        continue;
      }

      // Obtener buffer del PDF (intentar primero la ruta local en pruebas_paes/pruebas/)
      let pdfBytes;
      const nombreArchivoLocal = itemPrueba.archivo || (itemPrueba.url ? itemPrueba.url.split('/').pop() : '');
      const rutaLocal = `pruebas_paes/pruebas/${nombreArchivoLocal}`;

      try {
        const resLocal = await fetch(rutaLocal);
        if (resLocal.ok) {
          pdfBytes = await resLocal.arrayBuffer();
        } else {
          throw new Error('Local file not found');
        }
      } catch (errLocal) {
        console.warn(`[PDF Mixer] Archivo local ${rutaLocal} no disponible. Intentando descarga remota...`);
        try {
          const response = await fetch(itemPrueba.url);
          pdfBytes = await response.arrayBuffer();
        } catch (errFetch) {
          console.warn(`[PDF Mixer] Direct fetch bloqueado por CORS. Usando proxy para ${itemPrueba.url}`);
          try {
            const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(itemPrueba.url);
            const resProxy = await fetch(proxyUrl);
            pdfBytes = await resProxy.arrayBuffer();
          } catch (errProxy) {
            const proxy2Url = 'https://corsproxy.io/?' + encodeURIComponent(itemPrueba.url);
            const resProxy2 = await fetch(proxy2Url);
            pdfBytes = await resProxy2.arrayBuffer();
          }
        }
      }

      const srcPdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
      const totalPaginasSrc = srcPdfDoc.getPageCount();

      // Determinar qué páginas incluir (omitir portada/página 0 si se desea o tomar N páginas)
      let paginasAIncluir = [];
      for (let p = 1; p < totalPaginasSrc; p++) {
        const keyPage = `${id}_p${p}`;
        if (!paginasReg[keyPage]) {
          paginasAIncluir.push(p);
        }
      }

      // Si todas las páginas ya fueron usadas, tomar las primeras N
      if (paginasAIncluir.length === 0) {
        for (let p = 1; p < totalPaginasSrc; p++) paginasAIncluir.push(p);
      }

      // Mezclar aleatoriamente si el checkbox está activo
      if (aleatorio) {
        paginasAIncluir.sort(() => Math.random() - 0.5);
      }

      // Seleccionar la cantidad deseada
      const paginasSeleccionadas = paginasAIncluir.slice(0, cantPaginasDeseadas);

      // Copiar páginas al PDF destino
      const copiedPages = await mergedPdf.copyPages(srcPdfDoc, paginasSeleccionadas);
      copiedPages.forEach((page, index) => {
        mergedPdf.addPage(page);
        paginasProcesadasTotales++;
        
        if (registrar) {
          const pReal = paginasSeleccionadas[index];
          paginasReg[`${id}_p${pReal}`] = true;
        }
      });
    }

    if (paginasProcesadasTotales === 0) {
      showToast('❌ No se pudieron extraer páginas de las pruebas seleccionadas');
      return;
    }

    // Guardar páginas usadas si corresponde
    if (registrar) {
      state.paginasUsadas = paginasReg;
      localStorage.setItem('paes_paginas_usadas', JSON.stringify(paginasReg));
    }

    // Exportar y descargar el PDF resultante
    const finalPdfBytes = await mergedPdf.save();
    const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = downloadUrl;
    const nombreArchivo = `${titulo.replace(/[^\w\s-]/gi, '').replace(/\s+/g, '_')}.pdf`;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Guardar en la lista de ensayos generados localmente
    const nuevoEnsayo = {
      id: 'ensayo_' + Date.now(),
      titulo: titulo,
      fecha: new Date().toLocaleDateString('es-CL'),
      paginas: paginasProcesadasTotales,
      url: downloadUrl,
      nombreArchivo: nombreArchivo
    };
    state.ensayos.unshift(nuevoEnsayo);
    localStorage.setItem('paes_ensayos', JSON.stringify(state.ensayos));
    renderEnsayosGrid();

    actualizarComando();
    showToast(`🎉 ¡PDF "${nombreArchivo}" generado y descargado con éxito!`);

  } catch (err) {
    console.error('[PDF Mixer Error]:', err);
    showToast(`❌ Error al generar el PDF: ${err.message}`);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = btnOriginalText;
    }
  }
}

function mostrarResumen(pruebas, titulo) {
  const totalPags = pruebas.reduce((sum, p) => sum + p.pages, 0);
  let html = '';

  html += `<div class="resumen-item">
    <span class="resumen-item-name">Título</span>
    <span class="resumen-item-val">${titulo}</span>
  </div>`;

  pruebas.forEach(p => {
    const [mat] = p.id.split('_');
    const meta = getMeta(mat) || { nombre: p.id };
    html += `<div class="resumen-item">
      <span class="resumen-item-name">${meta.nombre}</span>
      <span class="resumen-item-val">${p.pages} páginas</span>
    </div>`;
  });

  html += `<div class="resumen-item" style="margin-top:8px; border-top: 2px solid var(--border-glow)">
    <span class="resumen-item-name"><strong>Total aproximado</strong></span>
    <span class="resumen-item-val" style="color: var(--gold)"><strong>~${totalPags + 2} páginas</strong></span>
  </div>`;

  const resContent = document.getElementById('resumen-content');
  const resCard    = document.getElementById('resumen-card');
  if (resContent) resContent.innerHTML = html;
  if (resCard) resCard.style.display = 'block';
}

function copiarComando() {
  const cmd = document.getElementById('cmd-preview')?.textContent;
  if (!cmd) return;

  navigator.clipboard.writeText(cmd).then(() => {
    showToast('📋 Comando copiado al portapapeles');
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = cmd;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('📋 Comando copiado');
  });
}

// ──────────────────────────────────────────────────────────
// RENDER ENSAYOS
// ──────────────────────────────────────────────────────────
function renderEnsayos() {
  const container = document.getElementById('ensayos-list');
  if (!container) return;

  if (state.ensayos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📂</div>
        <h3>No hay ensayos aún</h3>
        <p>Los ensayos generados con Python aparecerán aquí cuando los registres manualmente.</p>
        <button class="btn btn-primary" onclick="showSection('mezcla')">Ir a Mezclar</button>
      </div>`;
    return;
  }

  // Mostrar ensayos
  let html = '';
  state.ensayos.forEach((e, i) => {
    html += `
    <div class="config-card" style="margin-bottom: 1rem">
      <div style="display:flex; justify-content:space-between; align-items:start">
        <div>
          <h3 style="font-size:15px; margin-bottom:4px">${e.titulo}</h3>
          <span style="font-size:12px; color:var(--text-muted)">${e.fecha} · ${e.paginas} páginas</span>
        </div>
        <button onclick="eliminarEnsayo(${i})" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:18px">×</button>
      </div>
      <div style="margin-top:10px; font-size:13px; color:var(--text-secondary)">
        Pruebas: ${Object.keys(e.pruebas || {}).join(', ')}
      </div>
    </div>`;
  });
  container.innerHTML = html;
}

function eliminarEnsayo(idx) {
  state.ensayos.splice(idx, 1);
  localStorage.setItem('paes_ensayos', JSON.stringify(state.ensayos));
  renderEnsayos();
}

function resetHistorial() {
  if (!confirm('¿Deseas reiniciar el registro de páginas usadas? Esto permitirá reutilizar páginas en ensayos futuros.')) return;

  state.paginasUsadas = {};
  localStorage.setItem('paes_paginas_usadas', '{}');

  // También eliminar el archivo de registro (instrucción)
  showToast('🗑️ Registro reiniciado. También ejecuta: python mezclar_paes.py --reset');
}

// ──────────────────────────────────────────────────────────
// TOAST NOTIFICACIONES
// ──────────────────────────────────────────────────────────
let toastTimeout;

function showToast(msg, duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  clearTimeout(toastTimeout);
  toast.textContent = msg;
  toast.classList.add('visible');

  toastTimeout = setTimeout(() => {
    toast.classList.remove('visible');
  }, duration);
}

// ──────────────────────────────────────────────────────────
// ACTUALIZACIÓN EN TIEMPO REAL DEL COMANDO
// ──────────────────────────────────────────────────────────
function initEventListeners() {
  // Checkboxes y inputs de páginas → actualizar comando
  document.querySelectorAll('.sel-check, .pages-input').forEach(el => {
    el.addEventListener('change', () => {
      if (document.getElementById('mezcla') && !document.getElementById('mezcla').classList.contains('hidden')) {
        actualizarComando();
      }
    });
  });

  document.querySelectorAll('.pages-input').forEach(el => {
    el.addEventListener('input', () => {
      if (document.getElementById('mezcla') && !document.getElementById('mezcla').classList.contains('hidden')) {
        actualizarComando();
      }
    });
  });

  const tituloInput = document.getElementById('titulo-ensayo');
  if (tituloInput) {
    tituloInput.addEventListener('input', () => {
      if (document.getElementById('mezcla') && !document.getElementById('mezcla').classList.contains('hidden')) {
        actualizarComando();
      }
    });
  }
}

// ──────────────────────────────────────────────────────────
// RESTAURAR ESTADO DE DESCARGADOS
// ──────────────────────────────────────────────────────────
function restaurarEstado() {
  state.descargados.forEach(id => {
    const statusEl = document.getElementById('status-' + id);
    if (statusEl) {
      statusEl.innerHTML = '<span class="status-badge status-done">✓ Descargado</span>';
    }
  });
}

// ──────────────────────────────────────────────────────────
// ANIMACIÓN DE ENTRADA DEL HERO
// ──────────────────────────────────────────────────────────
function initHeroAnimations() {
  const cards = document.querySelectorAll('.card-float');
  cards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateX(40px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateX(0)';
    }, 600 + i * 150);
  });
}

// ──────────────────────────────────────────────────────────
// CONTADORES ANIMADOS
// ──────────────────────────────────────────────────────────
function animateCounter(el, target, duration = 1500) {
  if (!el) return;
  const start = Date.now();
  const step = () => {
    const elapsed = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ──────────────────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  restaurarEstado();
  initHeroAnimations();

  // Configurar badge visual de base de datos
  const dbBadge = document.getElementById('firebase-status-badge');
  const dbText = document.getElementById('firebase-status-text');
  const dbDot = document.getElementById('firebase-status-dot');
  if (dbBadge && dbText && dbDot) {
    if (PAES_DB.isFirebase()) {
      dbBadge.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
      dbBadge.style.color = '#10b981';
      dbBadge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      dbDot.style.backgroundColor = '#10b981';
      dbText.textContent = 'Conectado a Firebase';
    } else {
      dbBadge.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
      dbBadge.style.color = '#f59e0b';
      dbBadge.style.borderColor = 'rgba(245, 158, 11, 0.3)';
      dbDot.style.backgroundColor = '#f59e0b';
      dbText.textContent = 'Modo Local';
    }
  }

  // Cargar catálogo e iniciar renders
  cargarCatalogo().then(() => {
    renderPruebasGrid();
    renderClavijeros();
    renderSelectorMezcla();
  });
  
  // Cargar claves y escalas
  cargarClavesYEscalas();

  // Actualizar selectores al iniciar
  actualizarSelectorSesionesActivas();

  // Inicializar navegación y barra de roles
  renderNavbar();

  // Iniciar en sección correcta según hash de URL (permite compartir links directos)
  const initialSection = location.hash.replace('#', '');
  if (initialSection && document.getElementById(initialSection)) {
    showSection(initialSection, false);
  } else {
    showSection('landing', false);
  }
});

// ──────────────────────────────────────────────────────────
// LÓGICA DE ENVÍO Y GESTIÓN DE ALUMNOS (Fase 2)
// ──────────────────────────────────────────────────────────

function alSeleccionarClavijero(uid) {
  const infoBox = document.getElementById('info-clave-box');
  const infoText = document.getElementById('info-clave-text');
  const tituloInput = document.getElementById('titulo-sesion');
  
  if (!uid || !state.clavesYEscalas[uid]) {
    if (infoBox) infoBox.style.display = 'none';
    return;
  }
  
  const item = state.clavesYEscalas[uid];
  const meta = getMeta(item.materia);
  
  if (tituloInput && (!tituloInput.value || tituloInput.value.startsWith('Ensayo '))) {
    tituloInput.value = `Ensayo ${meta.nombre} - ${new Date().toLocaleDateString()}`;
  }
  
  if (infoBox && infoText) {
    const numPreguntas = Object.keys(item.claves).length;
    const numPilotos = item.pilotos.length;
    infoText.innerHTML = `
      <strong>Preguntas Totales:</strong> ${numPreguntas}<br>
      <strong>Preguntas Piloto (Omitidas en cálculo):</strong> ${numPilotos} (${item.pilotos.join(', ') || 'ninguna'})<br>
      <strong>Escala de Puntajes:</strong> ${Object.keys(item.escala).length > 0 ? 'Disponible (100 a 1000 pts)' : 'No disponible'}
    `;
    infoBox.style.display = 'block';
  }
}

function formatNombrePropio(nombre) {
  if (!nombre) return '';
  return nombre.toLowerCase().split(' ').map(word => {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

function agregarAlumnoLista() {
  const nombreInput = document.getElementById('nombre-alumno');
  const emailInput = document.getElementById('email-alumno');
  
  if (!nombreInput) return;
  const nombre = nombreInput.value.trim();
  const email = emailInput ? emailInput.value.trim() : '';
  
  if (!nombre) {
    showToast('⚠️ Por favor ingresa el nombre del alumno');
    return;
  }
  
  // Generar token único local
  const token = 'tok_' + Math.random().toString(36).substr(2, 9);
  
  state.alumnosEnSession.push({
    nombre,
    email,
    token,
    estado: 'pendiente',
    respuestas: {}
  });
  
  nombreInput.value = '';
  if (emailInput) emailInput.value = '';
  
  renderAlumnosLista();
  showToast('👤 Alumno agregado a la lista');
}

function renderAlumnosLista() {
  const tbody = document.getElementById('alumnos-list-body');
  const btnCopiarTodos = document.getElementById('btn-copiar-todos');
  const btnEmailTodos = document.getElementById('btn-email-todos');
  
  if (!tbody) return;
  
  if (state.alumnosEnSession.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="2" style="padding: 15px; text-align: center; color: var(--text-muted);">Agrega alumnos a la lista</td>
      </tr>`;
    if (btnCopiarTodos) btnCopiarTodos.style.display = 'none';
    if (btnEmailTodos) btnEmailTodos.style.display = 'none';
    return;
  }
  
  const baseUrl = window.location.href.split('#')[0].replace('index.html', '') + 'responder.html';
  
  tbody.innerHTML = state.alumnosEnSession.map((al, idx) => {
    const link = `${baseUrl}?token=${al.token}`;
    const mailTitle = al.email ? `Enviar correo a ${al.email}` : 'Enviar por correo';
    return `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
        <td style="padding: 8px 0; font-weight: 500; color: var(--text-primary);">
          ${al.nombre}
          ${al.email ? `<br><span style="font-size:11px; color:var(--text-muted);">${al.email}</span>` : ''}
        </td>
        <td style="padding: 8px 0; display: flex; gap: 4px; align-items: center;">
          <input type="text" readonly class="form-input" value="${link}" style="font-size:11px; padding: 4px 8px; height: auto; margin-bottom: 0; flex: 1; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: var(--text-primary);">
          <button class="btn-sm btn-download" title="Copiar link" onclick="copiarLinkIndividual('${link}')" style="padding: 4px 8px; margin: 0; cursor: pointer;">📋</button>
          <button class="btn-sm btn-download" title="${mailTitle}" onclick="enviarEmailAlumno(${idx})" style="padding: 4px 8px; margin: 0; cursor: pointer; background: rgba(59,130,246,0.2); border-color: rgba(59,130,246,0.4); color: #60a5fa;">📧</button>
          <button class="btn-sm btn-download" title="Eliminar alumno" onclick="eliminarAlumnoDeLista(${idx})" style="padding: 8px 0; margin: 0; background: rgba(220,38,38,0.2); border-color: rgba(220,38,38,0.3); color: #ef4444; cursor: pointer;">×</button>
        </td>
      </tr>`;
  }).join('');
  
  if (btnCopiarTodos) btnCopiarTodos.style.display = 'block';
  if (btnEmailTodos) btnEmailTodos.style.display = 'block';
}

function copiarLinkIndividual(link) {
  navigator.clipboard.writeText(link).then(() => {
    showToast('📋 Link copiado al portapapeles');
  });
}

function enviarEmailAlumno(idx) {
  const al = state.alumnosEnSession[idx];
  if (!al) return;
  
  const baseUrl = window.location.href.split('#')[0].replace('index.html', '') + 'responder.html';
  const link = `${baseUrl}?token=${al.token}`;
  
  const selectPrueba = document.getElementById('select-prueba-envio');
  const uidClavijero = selectPrueba ? selectPrueba.value : '';
  const infoClave = state.clavesYEscalas[uidClavijero];
  const metaClave = getMeta(infoClave ? infoClave.materia : '');
  
  const tituloInput = document.getElementById('titulo-sesion');
  const duracionInput = document.getElementById('duracion-sesion');
  const salaInput = document.getElementById('sala-sesion');
  
  const titulo = tituloInput ? (tituloInput.value.trim() || `Ensayo ${metaClave.nombre}`) : 'Evaluación PAES';
  const duracion = duracionInput ? (duracionInput.value || '150') : '150';
  const sala = salaInput ? (salaInput.value.trim() || 'SALA-1') : 'SALA-1';
  const fechaStr = new Date().toLocaleDateString('es-CL');
  const nombreFormateado = formatNombrePropio(al.nombre);
  
  const subject = encodeURIComponent(`🎓 [PAES] Citación a Evaluación en Línea: ${titulo}`);
  const body = encodeURIComponent(
    `Estimado/a ${nombreFormateado},\n\n` +
    `Junto con saludarte, se informa que se ha habilitado tu evaluación en línea para la preparación PAES.\n\n` +
    `📌 INFORMACIÓN DE LA EVALUACIÓN:\n` +
    `• Evaluación: ${titulo}\n` +
    `• Asignatura: ${metaClave.nombre || 'PAES Oficial'}\n` +
    `• Código de Sala: ${sala}\n` +
    `• Tiempo Límite: ${duracion > 0 ? duracion + ' minutos' : 'Sin límite de tiempo'}\n` +
    `• Fecha de Emisión: ${fechaStr}\n\n` +
    `🔗 ENLACE DE ACCESO ÚNICO Y PERSONAL:\n` +
    `Para responder tu prueba y consultar el cuadernillo de preguntas, ingresa al siguiente enlace:\n\n` +
    `👉 ${link}\n\n` +
    `3. Al finalizar, presiona el botón "Enviar Respuestas" para registrar tus resultados.\n\n` +
    `¡Te deseamos mucho éxito en tu evaluación!\n\n` +
    `Atentamente,\n` +
    `Departamento de Evaluación PAES Manager`
  );
  
  const mailtoUrl = al.email 
    ? `mailto:${al.email}?subject=${subject}&body=${body}`
    : `mailto:?subject=${subject}&body=${body}`;
    
  window.open(mailtoUrl, '_blank');
  showToast('📧 Abriendo borrador de correo individual...');
}

function abrirDraftCorreosTodos() {
  if (state.alumnosEnSession.length === 0) return;
  
  const baseUrl = window.location.href.split('#')[0].replace('index.html', '') + 'responder.html';
  
  const selectPrueba = document.getElementById('select-prueba-envio');
  const uidClavijero = selectPrueba ? selectPrueba.value : '';
  const infoClave = state.clavesYEscalas[uidClavijero];
  const metaClave = getMeta(infoClave ? infoClave.materia : '');
  
  const tituloInput = document.getElementById('titulo-sesion');
  const duracionInput = document.getElementById('duracion-sesion');
  const salaInput = document.getElementById('sala-sesion');
  
  const titulo = tituloInput ? (tituloInput.value.trim() || `Ensayo ${metaClave.nombre}`) : 'Evaluación PAES';
  const duracion = duracionInput ? (duracionInput.value || '150') : '150';
  const sala = salaInput ? (salaInput.value.trim() || 'SALA-1') : 'SALA-1';
  const fechaStr = new Date().toLocaleDateString('es-CL');
  
  const emailsValidos = state.alumnosEnSession.filter(a => a.email && a.email.includes('@')).map(a => a.email).join(',');
  const listaLinksText = state.alumnosEnSession.map(a => `• ${a.nombre}:\n  ${baseUrl}?token=${a.token}`).join('\n\n');
  
  const subject = encodeURIComponent(`🎓 [PAES] Enlaces de Evaluación en Línea: ${titulo}`);
  const body = encodeURIComponent(
    `Estimados Estudiantes,\n\n` +
    `Se ha habilitado la sesión de evaluación en línea correspondiente a la preparación PAES.\n\n` +
    `📌 DETALLES DE LA SESIÓN:\n` +
    `• Evaluación: ${titulo}\n` +
    `• Asignatura: ${metaClave.nombre || 'PAES Oficial'}\n` +
    `• Código de Sala: ${sala}\n` +
    `• Tiempo Límite: ${duracion > 0 ? duracion + ' minutos' : 'Sin límite'}\n` +
    `• Fecha: ${fechaStr}\n\n` +
    `🔗 ENLACES ÚNICOS DE ACCESO POR ALUMNO:\n` +
    `Por favor ubica tu nombre e ingresa únicamente a tu enlace personal asignado:\n\n` +
    `${listaLinksText}\n\n` +
    `⚠️ RECOMENDACIÓN: Al abrir tu enlace podrás activar la pantalla dividida (PDF + Hoja de Respuestas) para rendir tu prueba cómodamente.\n\n` +
    `¡Éxito a todos en su evaluación!\n\n` +
    `Atentamente,\n` +
    `Equipo Docente - PAES Manager`
  );
  
  const mailtoUrl = emailsValidos 
    ? `mailto:${emailsValidos}?subject=${subject}&body=${body}`
    : `mailto:?subject=${subject}&body=${body}`;
    
  window.open(mailtoUrl, '_blank');
  showToast('📧 Abriendo borrador de correo grupal...');
}

function eliminarAlumnoDeLista(idx) {
  state.alumnosEnSession.splice(idx, 1);
  renderAlumnosLista();
}

function copiarTodosLosLinks() {
  const baseUrl = window.location.href.split('#')[0].replace('index.html', '') + 'responder.html';
  const linksText = state.alumnosEnSession.map(al => `${al.nombre}: ${baseUrl}?token=${al.token}`).join('\n');
  
  navigator.clipboard.writeText(linksText).then(() => {
    showToast('📋 Todos los links fueron copiados al portapapeles');
  });
}

// Crear sesión en base de datos (Fase 3: Firebase o Fallback Local)
async function crearSesionEvaluacion() {
  const selectPrueba = document.getElementById('select-prueba-envio');
  const tituloInput = document.getElementById('titulo-sesion');
  const exigenciaInput = document.getElementById('exigencia-sesion');
  const salaInput = document.getElementById('sala-sesion');
  const btnCrear = document.getElementById('btn-crear-sesion');
  
  if (!selectPrueba || !selectPrueba.value) {
    showToast('⚠️ Debes seleccionar una prueba/clavijero');
    return;
  }
  
  const uidClavijero = selectPrueba.value;
  const infoClave = state.clavesYEscalas[uidClavijero];
  const metaClave = getMeta(infoClave ? infoClave.materia : '');
  
  let titulo = tituloInput ? tituloInput.value.trim() : '';
  if (!titulo) {
    titulo = `Ensayo ${metaClave.nombre} (${new Date().toLocaleDateString()})`;
    if (tituloInput) tituloInput.value = titulo;
  }
  
  const duracionInput = document.getElementById('duracion-sesion');
  const exigencia = exigenciaInput ? parseInt(exigenciaInput.value) || 60 : 60;
  const sala = salaInput ? salaInput.value.trim() : 'SALA-1';
  const sesionId = 'ses_' + Math.random().toString(36).substr(2, 9);
  
  // ── Respetar configuración personalizada del Generador de Evaluaciones ──
  const evalPersonal = state.evaluacionPersonalizada && state.evaluacionPersonalizada.activa
    ? state.evaluacionPersonalizada
    : null;

  // Duración: si viene del generador usar la personalizada, si no usar el input
  const duracion = evalPersonal
    ? evalPersonal.duracionMinutos
    : (duracionInput ? (parseInt(duracionInput.value) || 0) : 150);

  // Número de preguntas y claves: recortar el clavijero al subconjunto personalizado
  let numPreguntas;
  let clavesFinales;

  if (evalPersonal && evalPersonal.numPreguntas < Object.keys(infoClave.claves).length) {
    numPreguntas = evalPersonal.numPreguntas;
    // Ordenar claves numéricamente y tomar las primeras N
    const todasLasClaves = Object.keys(infoClave.claves).sort((a, b) => parseInt(a) - parseInt(b));
    const clavesSubset = todasLasClaves.slice(0, numPreguntas);
    clavesFinales = {};
    clavesSubset.forEach(k => { clavesFinales[k] = infoClave.claves[k]; });
  } else {
    numPreguntas = Object.keys(infoClave.claves).length;
    clavesFinales = infoClave.claves;
  }

  // Pilotos: filtrar solo los que caen dentro del subconjunto de preguntas
  const clavesKeys = new Set(Object.keys(clavesFinales));
  const pilotosFinales = infoClave.pilotos.map(String).filter(p => clavesKeys.has(p));

  const [mat, anioStr] = uidClavijero.split('_');
  const itemPrueba = (state.catalogoRaw || []).find(x => 
    x.tipo === 'prueba' && 
    x.materia === mat && 
    String(x.anio) === String(anioStr) &&
    !x.archivo.toLowerCase().includes('temario') &&
    !x.archivo.toLowerCase().includes('revista') &&
    !x.archivo.toLowerCase().includes('marcadas')
  );
  const pdfUrl = itemPrueba ? itemPrueba.url : null;

  // Limpiar la evaluación personalizada una vez consumida
  if (evalPersonal) state.evaluacionPersonalizada.activa = false;
  
  // Guardar la sesión con los valores correctos
  const nuevaSesion = {
    id: sesionId,
    titulo: titulo,
    materia_anio: uidClavijero,
    pdfUrl: pdfUrl,
    duracionMinutos: duracion,
    numPreguntas: numPreguntas,
    claves: clavesFinales,
    pilotos: pilotosFinales,
    escala: infoClave.escala,
    escalaExigencia: exigencia,
    sala: sala,
    fechaCreacion: new Date().toISOString()
  };
  
  try {
    if (btnCrear) {
      btnCrear.disabled = true;
      btnCrear.textContent = '⏳ Creando sesión...';
    }
    
    await PAES_DB.crearSesion(nuevaSesion, state.alumnosEnSession);
    
    showToast(PAES_DB.isFirebase() ? '🔑 Sesión habilitada en Firebase con éxito!' : '🔑 Sesión creada localmente!');
    
    // Mostrar banner de éxito con acciones rápidas sin borrar la lista de alumnos
    const infoBox = document.getElementById('info-clave-box');
    const infoText = document.getElementById('info-clave-text');
    if (infoBox && infoText) {
      infoBox.style.display = 'block';
      infoBox.style.background = 'rgba(16, 185, 129, 0.15)';
      infoBox.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      infoText.innerHTML = `
        <div style="color: #34d399; font-weight: 700; font-size: 14px; margin-bottom: 4px;">🎉 ¡Sesión Habilitada con Éxito en Firebase!</div>
        <div style="color: var(--text-primary); font-size: 13px;">La sesión <strong>"${titulo}"</strong> ya está activa. Usa la tabla de la derecha para copiar los links o enviar correos a los alumnos.</div>
        <div style="margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-outline" onclick="mostrarQRSesion('${sesionId}', '${titulo.replace(/'/g, "\\'")}')" style="padding: 8px 14px; font-size: 12px; border-color: rgba(99,102,241,0.4); color: #a5b4fc; font-weight: 600;">📱 Ver Código QR de Sala</button>
          <button class="btn btn-primary" onclick="irAResultadosSesion('${sesionId}')" style="padding: 8px 14px; font-size: 12px; font-weight: 600;">📊 Ir a Ver Resultados en Tiempo Real ➡️</button>
          <button class="btn btn-outline" onclick="nuevaListaEvaluacion()" style="padding: 8px 14px; font-size: 12px;">➕ Crear Otra Sesión</button>
        </div>
      `;
    }
    
    // En modo local llamamos explícitamente a actualizarSelectorSesionesActivas
    if (!PAES_DB.isFirebase()) {
      actualizarSelectorSesionesActivas();
    }
    
  } catch (error) {
    console.error("Error al crear sesión:", error);
    showToast(`❌ Error al crear sesión: ${error.message}`);
  } finally {
    if (btnCrear) {
      btnCrear.disabled = false;
      btnCrear.textContent = PAES_DB.isFirebase() ? '🔑 Habilitar Sesión en Firebase' : '🔑 Habilitar Sesión Local';
    }
  }
}

function irAResultadosSesion(sesionId) {
  const selectSesionResultados = document.getElementById('select-sesiones-activas');
  if (selectSesionResultados) {
    selectSesionResultados.value = sesionId;
    cargarResultadosSesion(sesionId);
  }
  showSection('resultados');
}

function nuevaListaEvaluacion() {
  const tituloInput = document.getElementById('titulo-sesion');
  if (tituloInput) tituloInput.value = '';
  state.alumnosEnSession = [];
  renderAlumnosLista();
  const infoBox = document.getElementById('info-clave-box');
  if (infoBox) infoBox.style.display = 'none';
  showToast('✨ Formulario listo para una nueva evaluación');
}

let unsubSesiones = null;
function actualizarSelectorSesionesActivas() {
  if (unsubSesiones) {
    unsubSesiones();
    unsubSesiones = null;
  }
  
  unsubSesiones = PAES_DB.escucharSesiones(sesionesList => {
    const select = document.getElementById('select-sesiones-activas');
    if (!select) return;
    
    if (sesionesList.length === 0) {
      select.innerHTML = '<option value="">No hay sesiones activas</option>';
      return;
    }
    
    let html = '<option value="">-- Seleccionar Sesión --</option>';
    sesionesList.forEach(s => {
      html += `<option value="${s.id}">${s.titulo} (${s.numPreguntas} preguntas)</option>`;
    });
    
    const prevVal = select.value;
    select.innerHTML = html;
    if (prevVal && sesionesList.some(s => s.id === prevVal)) {
      select.value = prevVal;
    }
  });
}

// ──────────────────────────────────────────────────────────
// LÓGICA DE CORRECCIÓN AUTOMÁTICA Y RESULTADOS
// ──────────────────────────────────────────────────────────

function calcularNotaChilena(puntajeObtenido, puntajeMaximo, exigenciaPorcentaje = 60) {
  if (puntajeMaximo === 0) return 1.0;
  const exigenciaFraction = exigenciaPorcentaje / 100;
  const puntajeCorte = puntajeMaximo * exigenciaFraction;
  
  let nota = 1.0;
  if (puntajeObtenido < puntajeCorte) {
    // Escala del 1.0 al 4.0
    nota = 1.0 + 3.0 * (puntajeObtenido / puntajeCorte);
  } else {
    // Escala del 4.0 al 7.0
    nota = 4.0 + 3.0 * ((puntajeObtenido - puntajeCorte) / (puntajeMaximo - puntajeCorte));
  }
  return Math.round(nota * 10) / 10;
}

function corregirPrueba(respuestasAlumno, clavesPauta, pilotosArray) {
  let correctas = 0;
  let incorrectas = 0;
  let omitidas = 0;
  
  for (const numStr in clavesPauta) {
    const num = parseInt(numStr);
    const respCorrecta = clavesPauta[numStr];
    const respAlumno = respuestasAlumno[numStr] || '';
    
    // Si es piloto, no se cuenta para puntaje ni correctas/incorrectas
    if (pilotosArray.includes(num) || pilotosArray.includes(numStr)) {
      continue;
    }
    
    if (!respAlumno) {
      omitidas++;
    } else if (respAlumno === respCorrecta) {
      correctas++;
    } else {
      incorrectas++;
    }
  }
  
  return { correctas, incorrectas, omitidas };
}

let unsubEnvios = null;
function cargarResultadosSesion(sesionId) {
  if (!sesionId) {
    document.getElementById('resultados-table-body').innerHTML = `
      <tr>
        <td colspan="6" style="padding: 30px; text-align: center; color: var(--text-muted);">Selecciona una sesión para ver resultados</td>
      </tr>`;
    
    const statEntregados = document.getElementById('stat-entregados');
    const statPromedioPaes = document.getElementById('stat-promedio-paes');
    const statMaxPaes = document.getElementById('stat-max-paes');
    if (statEntregados) statEntregados.textContent = '0';
    if (statPromedioPaes) statPromedioPaes.textContent = '0 pts';
    if (statMaxPaes) statMaxPaes.textContent = '0 pts';
    
    const analisisBox = document.getElementById('analisis-items-box');
    if (analisisBox) analisisBox.style.display = 'none';
    
    const detailBox = document.getElementById('detalle-respuestas-alumno-box');
    if (detailBox) detailBox.style.display = 'none';
    
    state.sesionActivaDocente = null;
    state.sesionActivaDocenteData = null;
    state.enviosActivos = [];
    return;
  }
  
  state.sesionActivaDocente = sesionId;
  
  if (unsubEnvios) {
    unsubEnvios();
    unsubEnvios = null;
  }
  
  // Mostrar feedback de carga
  document.getElementById('resultados-table-body').innerHTML = `
    <tr>
      <td colspan="6" style="padding: 30px; text-align: center; color: var(--text-muted);"><span style="animation: spin 1s infinite linear; display:inline-block; margin-right:8px;">⏳</span> Cargando respuestas...</td>
    </tr>`;
  
  PAES_DB.obtenerSesion(sesionId).then(sesion => {
    if (!sesion) {
      showToast('⚠️ No se encontraron datos para la sesión seleccionada');
      return;
    }
    state.sesionActivaDocenteData = sesion;
    
    // Iniciar listener en tiempo real de los envíos de alumnos
    unsubEnvios = PAES_DB.escucharEnvios(sesionId, enviosList => {
      state.enviosActivos = enviosList;
      actualizarResultadosEnTiempoReal();
    });
  }).catch(err => {
    console.error("Error al obtener detalles de la sesión:", err);
    showToast(`❌ Error al cargar la sesión: ${err.message}`);
  });
}

function actualizarResultadosEnTiempoReal() {
  const sesion = state.sesionActivaDocenteData;
  const enviosDeSesion = state.enviosActivos || [];
  
  const tbody = document.getElementById('resultados-table-body');
  if (!tbody || !sesion) return;
  
  if (enviosDeSesion.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="padding: 30px; text-align: center; color: var(--text-muted);">No hay alumnos asignados a esta sesión</td>
      </tr>`;
    
    const statEntregados = document.getElementById('stat-entregados');
    const statPromedioPaes = document.getElementById('stat-promedio-paes');
    const statMaxPaes = document.getElementById('stat-max-paes');
    if (statEntregados) statEntregados.textContent = '0';
    if (statPromedioPaes) statPromedioPaes.textContent = '0 pts';
    if (statMaxPaes) statMaxPaes.textContent = '0 pts';
    
    const analisisBox = document.getElementById('analisis-items-box');
    if (analisisBox) analisisBox.style.display = 'none';
    return;
  }
  
  let totalCompletados = 0;
  let sumaPuntajePAES = 0;
  let maxPuntajePAES = 0;
  
  tbody.innerHTML = enviosDeSesion.map(e => {
    let puntajeBrutoStr = '—';
    let puntajePAESStr = '—';
    let logroStr = '—';
    let estadoHtml = '';
    let detalleBtn = '—';
    
    if (e.estado === 'completado') {
      totalCompletados++;
      const { correctas, incorrectas, omitidas } = corregirPrueba(e.respuestas, sesion.claves, sesion.pilotos);
      const totalPreguntasEvaluadas = sesion.numPreguntas - (sesion.pilotos ? sesion.pilotos.length : 0);
      
      const logroPct = totalPreguntasEvaluadas > 0 ? Math.round((correctas / totalPreguntasEvaluadas) * 100) : 0;
      
      // Buscar conversión PAES de 100 a 1000 pts
      let paes = 100;
      if (sesion.escala && sesion.escala[String(correctas)] !== undefined) {
        paes = sesion.escala[String(correctas)];
      }
      
      sumaPuntajePAES += paes;
      if (paes > maxPuntajePAES) maxPuntajePAES = paes;
      
      puntajeBrutoStr = `<strong>${correctas}</strong> / ${totalPreguntasEvaluadas}`;
      puntajePAESStr = `<strong style="font-size:15px; color:#60a5fa;">${paes} pts</strong>`;
      
      const logroColor = logroPct >= 70 ? '#10b981' : logroPct >= 50 ? '#f59e0b' : '#ef4444';
      logroStr = `<strong style="color: ${logroColor}">${logroPct}%</strong>`;
      
      estadoHtml = '<span class="status-badge status-done">✓ Entregado</span>';
      detalleBtn = `<button class="btn-sm btn-download" onclick="mostrarDetalleAlumno('${e.token}')" style="cursor: pointer;">Ver Respuestas</button>`;
    } else {
      estadoHtml = '<span class="status-badge status-pending" style="animation: pulse 2s infinite;">⏳ Pendiente</span>';
    }
    
    return `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
        <td style="padding: 12px 8px; font-weight: 500; color: var(--text-primary);">${e.alumnoNombre}</td>
        <td style="padding: 12px 8px;">${puntajeBrutoStr}</td>
        <td style="padding: 12px 8px;">${puntajePAESStr}</td>
        <td style="padding: 12px 8px;">${logroStr}</td>
        <td style="padding: 12px 8px;">${estadoHtml}</td>
        <td style="padding: 12px 8px; text-align: center;">${detalleBtn}</td>
      </tr>`;
  }).join('');
  
  // Actualizar stats de la sesión
  const statEntregados = document.getElementById('stat-entregados');
  const statPromedioPaes = document.getElementById('stat-promedio-paes');
  const statMaxPaes = document.getElementById('stat-max-paes');
  
  if (statEntregados) statEntregados.textContent = `${totalCompletados} / ${enviosDeSesion.length}`;
  if (statPromedioPaes) statPromedioPaes.textContent = totalCompletados > 0 ? `${Math.round(sumaPuntajePAES / totalCompletados)} pts` : '0 pts';
  if (statMaxPaes) statMaxPaes.textContent = totalCompletados > 0 ? `${maxPuntajePAES} pts` : '0 pts';

  // Renderizar la tabla de análisis de dificultad de preguntas
  actualizarAnalisisDeItems(sesion, enviosDeSesion);
}

// Genera un panel con las preguntas más erradas para análisis docente
function actualizarAnalisisDeItems(sesion, enviosDeSesion) {
  const panel = document.getElementById('analisis-items-box');
  const container = document.getElementById('grid-analisis-items');
  if (!panel || !container) return;

  const entregados = enviosDeSesion.filter(e => e.estado === 'completado');
  if (entregados.length === 0) {
    panel.style.display = 'none';
    return;
  }

  let html = '';
  const numPreguntas = sesion.numPreguntas;
  const pilotos = sesion.pilotos || [];

  for (let q = 1; q <= numPreguntas; q++) {
    const qStr = String(q);
    if (pilotos.includes(q) || pilotos.includes(qStr)) {
      continue; // omitir pilotos del análisis
    }

    const correctOption = sesion.claves[qStr];
    let correctosCount = 0;
    let incorrectosCount = 0;
    let omitidosCount = 0;

    entregados.forEach(e => {
      const ans = e.respuestas[qStr] || '';
      if (!ans) {
        omitidosCount++;
      } else if (ans === correctOption) {
        correctosCount++;
      } else {
        incorrectosCount++;
      }
    });

    const total = entregados.length;
    const errorRate = Math.round(((incorrectosCount + omitidosCount) / total) * 100);
    
    // Definir colores según tasa de error (Premium HSL tailored colors)
    let colorBg = 'rgba(16, 185, 129, 0.08)';
    let colorBorder = 'rgba(16, 185, 129, 0.2)';
    let colorText = '#10b981';
    let textDesc = 'Fácil';

    if (errorRate > 60) {
      colorBg = 'rgba(239, 68, 68, 0.08)';
      colorBorder = 'rgba(239, 68, 68, 0.2)';
      colorText = '#ef4444';
      textDesc = 'Crítica 🚨';
    } else if (errorRate >= 35) {
      colorBg = 'rgba(245, 158, 11, 0.08)';
      colorBorder = 'rgba(245, 158, 11, 0.2)';
      colorText = '#f59e0b';
      textDesc = 'Media ⚠️';
    }

    html += `
      <div style="background: ${colorBg}; border: 1px solid ${colorBorder}; border-radius: var(--radius-md); padding: 10px; text-align: center;">
        <strong style="display:block; font-size:13px; margin-bottom: 2px; color: ${colorText};">Pregunta ${q}</strong>
        <div style="font-size:18px; font-weight:800; margin: 4px 0; color: var(--text-primary);">${errorRate}% <span style="font-size:10px; font-weight:400; color:var(--text-secondary);">Error</span></div>
        <div style="font-size:11px; font-weight:600; color:${colorText};">${textDesc}</div>
        <div style="font-size:10px; color: var(--text-secondary); margin-top: 6px; border-top: 1px solid rgba(255,255,255,0.05); padding-top:4px;">
          🟢 ${correctosCount} · 🔴 ${incorrectosCount} · ⚪ ${omitidosCount}
        </div>
      </div>`;
  }

  container.innerHTML = html;
  panel.style.display = 'block';
}

function mostrarDetalleAlumno(token) {
  const envio = (state.enviosActivos || []).find(e => e.token === token);
  const sesion = state.sesionActivaDocenteData;
  if (!envio || !sesion) return;
  
  const detalleBox = document.getElementById('detalle-respuestas-alumno-box');
  const tituloDetalle = document.getElementById('detalle-alumno-titulo');
  const gridRespuestas = document.getElementById('grid-respuestas-detalle');
  
  if (!detalleBox || !tituloDetalle || !gridRespuestas) return;
  
  tituloDetalle.textContent = `Respuestas de ${envio.alumnoNombre}`;
  
  let gridHtml = '';
  for (let q = 1; q <= sesion.numPreguntas; q++) {
    const qStr = String(q);
    const respCorrecta = sesion.claves[qStr];
    const respAlumno = envio.respuestas[qStr] || '';
    const esPiloto = sesion.pilotos.includes(q) || sesion.pilotos.includes(qStr);
    
    let colorBg = 'rgba(255,255,255,0.05)';
    let colorBorder = 'rgba(255,255,255,0.1)';
    let colorText = 'var(--text-secondary)';
    let checkIcon = '';
    
    if (esPiloto) {
      colorBg = 'rgba(245,158,11,0.15)';
      colorBorder = '#f59e0b';
      colorText = '#f59e0b';
      checkIcon = '⚙️ Piloto';
    } else if (!respAlumno) {
      colorBg = 'rgba(255,255,255,0.05)';
      colorBorder = 'rgba(255,255,255,0.2)';
      colorText = 'var(--text-muted)';
      checkIcon = 'Omitida';
    } else if (respAlumno === respCorrecta) {
      colorBg = 'rgba(16,185,129,0.15)';
      colorBorder = '#10b981';
      colorText = '#10b981';
      checkIcon = '✅ Correcta';
    } else {
      colorBg = 'rgba(239,68,68,0.15)';
      colorBorder = '#ef4444';
      colorText = '#ef4444';
      checkIcon = `❌ Resp: ${respAlumno}`;
    }
    
    gridHtml += `
      <div style="background: ${colorBg}; border: 1px solid ${colorBorder}; border-radius: 8px; padding: 8px; text-align: center; color: ${colorText};">
        <strong style="display:block; font-size:14px; margin-bottom: 2px;">Preg ${q}</strong>
        <div style="font-size:11px; font-weight:600;">Pauta: ${respCorrecta || '—'}</div>
        <div style="font-size:10px; margin-top:2px;">${checkIcon}</div>
      </div>`;
  }
  
  gridRespuestas.innerHTML = gridHtml;
  detalleBox.style.display = 'block';
  
  // Hacer scroll al detalle
  detalleBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cerrarDetalleAlumno() {
  const detalleBox = document.getElementById('detalle-respuestas-alumno-box');
  if (detalleBox) detalleBox.style.display = 'none';
}

function exportarResultadosCSV() {
  const sesion = state.sesionActivaDocenteData;
  const enviosDeSesion = state.enviosActivos || [];
  
  if (!sesion) {
    showToast('⚠️ Debes seleccionar una sesión activa para exportar');
    return;
  }
  
  if (enviosDeSesion.length === 0) {
    showToast('⚠️ No hay envíos que exportar');
    return;
  }
  
  let csvContent = "\uFEFF"; // UTF-8 BOM
  csvContent += "Alumno,Email,Estado,Preguntas Correctas,Preguntas Incorrectas,Preguntas Omitidas,Puntaje PAES,% Logro\n";
  
  enviosDeSesion.forEach(e => {
    if (e.estado === 'completado') {
      const { correctas, incorrectas, omitidas } = corregirPrueba(e.respuestas, sesion.claves, sesion.pilotos);
      const totalPreguntasEvaluadas = sesion.numPreguntas - (sesion.pilotos ? sesion.pilotos.length : 0);
      const logroPct = totalPreguntasEvaluadas > 0 ? Math.round((correctas / totalPreguntasEvaluadas) * 100) : 0;
      
      let paes = 100;
      if (sesion.escala && sesion.escala[String(correctas)] !== undefined) {
        paes = sesion.escala[String(correctas)];
      }
      
      csvContent += `"${e.alumnoNombre}","${e.alumnoEmail || ''}","Completado",${correctas},${incorrectas},${omitidas},${paes},${logroPct}%\n`;
    } else {
      csvContent += `"${e.alumnoNombre}","${e.alumnoEmail || ''}","Pendiente",0,0,0,0,0%\n`;
    }
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `resultados_${sesion.titulo.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast('📊 Archivo CSV descargado con éxito');
}

// ──────────────────────────────────────────────────────────
// GESTIÓN Y ELIMINACIÓN DE SESIONES
// ──────────────────────────────────────────────────────────

let unsubGestionSesiones = null;

function abrirGestionSesiones() {
  const panel = document.getElementById('panel-gestionar-sesiones');
  const lista = document.getElementById('lista-sesiones-borrar');
  if (!panel || !lista) return;

  panel.style.display = 'block';
  lista.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:12px;">⏳ Cargando sesiones...</p>';

  // Cancelar listener previo si existía
  if (unsubGestionSesiones) {
    unsubGestionSesiones();
    unsubGestionSesiones = null;
  }

  // Suscribir en tiempo real — cualquier cambio (crear, borrar) recarga la lista
  unsubGestionSesiones = PAES_DB.escucharSesiones(sesionesList => {
    if (!sesionesList || sesionesList.length === 0) {
      lista.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:12px;">✅ No hay sesiones guardadas.</p>';
      return;
    }

    lista.innerHTML = sesionesList.map(s => {
      const fecha = new Date(s.fechaCreacion).toLocaleDateString('es-CL', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      const metaSesion = getMeta(s.materia_anio ? s.materia_anio.split('_')[0] : '');
      return `
        <div style="display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:10px 12px; transition: background 0.2s;"
             onmouseover="this.style.background='rgba(220,38,38,0.06)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
          <input type="checkbox" class="sesion-check" value="${s.id}"
                 style="width:18px;height:18px;accent-color:#ef4444;cursor:pointer;flex-shrink:0;">
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;color:var(--text-primary);font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.titulo}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${metaSesion.nombre || s.materia_anio || ''} · ${s.numPreguntas || '?'} preguntas · ${fecha}</div>
          </div>
          <button onclick="borrarSesionUnica('${s.id}', '${s.titulo.replace(/'/g, "\\'")}')"
                  title="Eliminar esta sesión"
                  style="background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.35);color:#f87171;border-radius:8px;padding:5px 10px;font-size:12px;font-weight:600;cursor:pointer;flex-shrink:0;white-space:nowrap;transition:background 0.2s;"
                  onmouseover="this.style.background='rgba(220,38,38,0.25)'" onmouseout="this.style.background='rgba(220,38,38,0.1)'">
            🗑️ Borrar
          </button>
        </div>`;
    }).join('');
  });
}

function cerrarGestionSesiones() {
  const panel = document.getElementById('panel-gestionar-sesiones');
  if (panel) panel.style.display = 'none';
  if (unsubGestionSesiones) {
    unsubGestionSesiones();
    unsubGestionSesiones = null;
  }
}

function seleccionarTodasSesiones(seleccionar) {
  document.querySelectorAll('.sesion-check').forEach(cb => { cb.checked = seleccionar; });
}

/**
 * Borra una única sesión directamente desde el botón de la fila (sin necesidad de checkbox).
 */
async function borrarSesionUnica(sesionId, titulo) {
  const confirmado = confirm(`⚠️ ¿Eliminar la sesión "${titulo}"?\n\nEsto borrará también todas las respuestas de los alumnos.\n\nEsta acción NO se puede deshacer.`);
  if (!confirmado) return;
  try {
    await PAES_DB.borrarSesion(sesionId);
    // Si la sesión eliminada era la activa en resultados, limpiar la vista
    if (state.sesionActivaDocente === sesionId) {
      cargarResultadosSesion('');
    }
    showToast(`✅ Sesión "${titulo}" eliminada correctamente`);
  } catch (e) {
    console.error('[PAES] Error al borrar sesión:', e);
    showToast(`❌ Error al eliminar: ${e.message}`);
  }
}

/**
 * Borra todas las sesiones marcadas con checkbox.
 */
async function confirmarBorrarSesiones() {
  const checks = [...document.querySelectorAll('.sesion-check:checked')];
  if (checks.length === 0) {
    showToast('⚠️ Selecciona al menos una sesión para eliminar');
    return;
  }

  const ids = checks.map(cb => cb.value);
  const confirmado = confirm(
    `⚠️ ¿Eliminar ${ids.length} sesión(es)?\n\nEsto borrará también todas las respuestas de los alumnos.\n\nEsta acción NO se puede deshacer.`
  );
  if (!confirmado) return;

  showToast('⏳ Eliminando sesiones...');

  let borrados = 0;
  let errores = 0;
  let primerError = '';

  for (const id of ids) {
    try {
      await PAES_DB.borrarSesion(id);
      borrados++;
      // Si era la sesión activa en resultados, limpiar vista
      if (state.sesionActivaDocente === id) {
        cargarResultadosSesion('');
      }
    } catch (e) {
      errores++;
      if (!primerError) primerError = e.message;
      console.error(`[PAES] Error al borrar sesión ${id}:`, e);
    }
  }

  if (errores === 0) {
    showToast(`✅ ${borrados} sesión(es) eliminada(s) correctamente`);
  } else if (borrados === 0) {
    showToast(`❌ Error al eliminar: ${primerError || 'Sin permisos en Firebase'}`);
    console.error('[PAES] Revisa las reglas de seguridad de Firestore. Deben permitir delete.');
  } else {
    showToast(`⚠️ ${borrados} eliminadas, ${errores} con error: ${primerError}`);
  }
}

// ──────────────────────────────────────────────────────────
// 1. IMPORTAR ALUMNOS DESDE CSV / EXCEL
// ──────────────────────────────────────────────────────────
function importarAlumnosCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    const lineas = text.split(/\r?\n/);
    let agregados = 0;

    lineas.forEach(linea => {
      const trimLine = linea.trim();
      if (!trimLine) return;

      // Omitir cabecera si existe
      if (trimLine.toLowerCase().startsWith('nombre') || trimLine.toLowerCase().startsWith('alumno')) return;

      // Separar por coma o punto y coma
      const partes = trimLine.split(/[,;]/);
      const nombre = partes[0] ? partes[0].trim().replace(/^["']|["']$/g, '') : '';
      const email = partes[1] ? partes[1].trim().replace(/^["']|["']$/g, '') : '';

      if (nombre && nombre.length >= 2) {
        const token = 'tok_' + Math.random().toString(36).substr(2, 9);
        state.alumnosEnSession.push({
          nombre: nombre,
          email: email,
          token: token,
          estado: 'pendiente',
          respuestas: {}
        });
        agregados++;
      }
    });

    // Resetear input para permitir cargar el mismo archivo
    event.target.value = '';

    if (agregados > 0) {
      renderAlumnosLista();
      showToast(`✅ ${agregados} alumno(s) importado(s) desde CSV`);
    } else {
      showToast('⚠️ No se encontraron nombres válidos en el archivo');
    }
  };
  reader.readAsText(file, 'UTF-8');
}

// ──────────────────────────────────────────────────────────
// 2. CÓDIGO QR PARA ACCESO EN SALA
// ──────────────────────────────────────────────────────────
let currentQRInstance = null;

function mostrarQRSesion(sesionId, titulo, token) {
  const modal = document.getElementById('modal-qr');
  const box = document.getElementById('qr-canvas-box');
  const txtTitulo = document.getElementById('qr-sesion-titulo');
  const txtUrl = document.getElementById('qr-url-text');
  if (!modal || !box) return;

  const baseUrl = window.location.href.split('#')[0].replace('index.html', '') + 'responder.html';
  const fullUrl = token ? `${baseUrl}?token=${token}` : baseUrl;

  if (txtTitulo) txtTitulo.textContent = `QR: ${titulo || 'Sesión PAES'}`;
  if (txtUrl) txtUrl.textContent = fullUrl;

  box.innerHTML = '';
  try {
    if (window.QRCode) {
      currentQRInstance = new QRCode(box, {
        text: fullUrl,
        width: 200,
        height: 200,
        colorDark: '#0f172a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      box.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fullUrl)}" alt="QR Code" width="200" height="200">`;
    }
  } catch (err) {
    box.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fullUrl)}" alt="QR Code" width="200" height="200">`;
  }

  modal.style.display = 'flex';
}

function cerrarModalQR() {
  const modal = document.getElementById('modal-qr');
  if (modal) modal.style.display = 'none';
}

function imprimirQR() {
  const box = document.getElementById('qr-canvas-box');
  const txtTitulo = document.getElementById('qr-sesion-titulo');
  const txtUrl = document.getElementById('qr-url-text');
  if (!box) return;

  const imgElem = box.querySelector('img') || box.querySelector('canvas');
  const imgSrc = imgElem ? (imgElem.src || imgElem.toDataURL()) : '';

  const printWin = window.open('', '_blank');
  printWin.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>QR Acceso - ${txtTitulo ? txtTitulo.textContent : 'PAES Manager'}</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
        h1 { color: #0f172a; font-size: 24px; margin-bottom: 8px; }
        p { color: #475569; font-size: 14px; margin-bottom: 24px; }
        img { border: 2px solid #cbd5e1; border-radius: 12px; padding: 16px; width: 260px; height: 260px; }
        .url { font-family: monospace; font-size: 12px; color: #64748b; margin-top: 16px; word-break: break-all; }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      <h1>${txtTitulo ? txtTitulo.textContent : 'PAES Manager'}</h1>
      <p>Escanea este código QR con la cámara de tu teléfono para acceder a la evaluación en línea</p>
      <img src="${imgSrc}">
      <div class="url">${txtUrl ? txtUrl.textContent : ''}</div>
    </body>
    </html>
  `);
  printWin.document.close();
}

// ──────────────────────────────────────────────────────────
// 3. GENERADOR DE REPORTE PDF DE RESULTADOS
// ──────────────────────────────────────────────────────────
function generarReportePDF() {
  const sesion = state.sesionActivaDocenteData;
  const enviosDeSesion = state.enviosActivos || [];

  if (!sesion) {
    showToast('⚠️ Debes seleccionar una sesión para generar el reporte PDF');
    return;
  }

  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) {
    showToast('⚠️ Cargando módulo de PDF... Intenta de nuevo en 2 segundos');
    return;
  }

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const fechaStr = new Date().toLocaleDateString('es-CL');

  // Encabezado
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(241, 245, 249);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('PAES Manager — Reporte de Evaluación', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(`Fecha de emisión: ${fechaStr} | Generado automáticamente`, 14, 24);

  // Metadata de la sesión
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(sesion.titulo || 'Resultados de Evaluación', 14, 42);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Sala: ${sesion.sala || 'SALA-1'}  |  Preguntas: ${sesion.numPreguntas || '?'}  |  Tiempo límite: ${sesion.duracionMinutos > 0 ? sesion.duracionMinutos + ' min' : 'Sin límite'}`, 14, 48);

  // Estadísticas del grupo
  const completados = enviosDeSesion.filter(e => e.estado === 'completado');
  let sumaPaes = 0, maxPaes = 0;

  const tableRows = [];

  enviosDeSesion.forEach(e => {
    if (e.estado === 'completado') {
      const { correctas, incorrectas, omitidas } = corregirPrueba(e.respuestas, sesion.claves, sesion.pilotos);
      const totalEvaluadas = sesion.numPreguntas - (sesion.pilotos ? sesion.pilotos.length : 0);
      const logroPct = totalEvaluadas > 0 ? Math.round((correctas / totalEvaluadas) * 100) : 0;
      let paes = 100;
      if (sesion.escala && sesion.escala[String(correctas)] !== undefined) {
        paes = sesion.escala[String(correctas)];
      }
      sumaPaes += paes;
      if (paes > maxPaes) maxPaes = paes;

      tableRows.push([
        e.alumnoNombre || 'Sin nombre',
        'Completado',
        `${correctas}/${totalEvaluadas}`,
        `${incorrectas}`,
        `${omitidas}`,
        `${paes} pts`,
        `${logroPct}%`
      ]);
    } else {
      tableRows.push([
        e.alumnoNombre || 'Sin nombre',
        'Pendiente',
        '-', '-', '-', '-', '-'
      ]);
    }
  });

  const promedioPaes = completados.length > 0 ? Math.round(sumaPaes / completados.length) : 0;

  // Cajas resumen KPI
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 54, 56, 18, 3, 3, 'FD');
  doc.roundedRect(77, 54, 56, 18, 3, 3, 'FD');
  doc.roundedRect(140, 54, 56, 18, 3, 3, 'FD');

  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(37, 99, 235);
  doc.text(`${completados.length} / ${enviosDeSesion.length}`, 20, 63);
  doc.text(`${promedioPaes} pts`, 83, 63);
  doc.text(`${maxPaes} pts`, 146, 63);

  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
  doc.text('ALUMNOS COMPLETADOS', 20, 68);
  doc.text('PROMEDIO PAES GRUPO', 83, 68);
  doc.text('PUNTAJE MÁXIMO PAES', 146, 68);

  // Tabla de resultados
  if (doc.autoTable) {
    doc.autoTable({
      startY: 78,
      head: [['Alumno', 'Estado', 'Correctas', 'Incorrectas', 'Omitidas', 'Puntaje PAES', '% Logro']],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 25 },
        2: { cellWidth: 22 },
        3: { cellWidth: 22 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25, fontStyle: 'bold' },
        6: { cellWidth: 20 }
      }
    });
  }

  // Pie de página
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Página ${i} de ${pageCount} — Sistema PAES Manager`, 105, 290, { align: 'center' });
  }


  doc.save(`reporte_PAES_${sesion.titulo.replace(/\s+/g, '_')}.pdf`);
  showToast('📄 Reporte PDF generado correctamente');
}

// ──────────────────────────────────────────────────────────
// TOGGLE TEMA CLARO / OSCURO
// ──────────────────────────────────────────────────────────

function toggleTema() {
  const body = document.body;
  const isLight = body.classList.toggle('light-theme');
  localStorage.setItem('paes_theme', isLight ? 'light' : 'dark');
}

// Aplicar tema guardado inmediatamente al cargar
(function aplicarTemaGuardado() {
  const savedTheme = localStorage.getItem('paes_theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
  }
})();
