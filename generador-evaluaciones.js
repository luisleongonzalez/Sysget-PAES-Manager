/**
 * SYSGET SUITE · PAES MANAGER
 * Generador de Evaluaciones Personalizadas por Eje y Habilidades DEMRE
 * Sello Corporativo SysGet Software Educativo
 */

let asigGeneradorActual = 'matematica';

const estructuraEjesGenerador = {
  matematica: {
    niveles: [
      { id: 'm1_invierno', nombre: 'Competencia matemática M1 - Invierno 2026' },
      { id: 'm1_regular', nombre: 'Competencia matemática M1 - Regular 2026' },
      { id: 'm2_invierno', nombre: 'Competencia matemática M2 - Avanzada' }
    ],
    ejes: [
      {
        id: 'num',
        nombre: 'Números',
        items: [
          'Conjunto de los números reales (N, Z, Q, R)',
          'Porcentaje y cálculos financieros básicos',
          'Potencias y raíces enésimas'
        ]
      },
      {
        id: 'alg',
        nombre: 'Álgebra y Funciones',
        items: [
          'Expresiones algebraicas y productos notables',
          'Proporcionalidad directa e inversa',
          'Ecuaciones e inecuaciones de primer grado',
          'Sistemas de ecuaciones lineales (2x2)',
          'Función lineal y afín',
          'Función cuadrática y parábolas'
        ]
      },
      {
        id: 'geo',
        nombre: 'Geometría',
        items: [
          'Figuras geométricas y perímetros/áreas',
          'Cuerpos geométricos y volúmenes',
          'Transformaciones isométricas',
          'Semejanza y proporcionalidad de figuras planas'
        ]
      },
      {
        id: 'est',
        nombre: 'Probabilidad y Estadística',
        items: [
          'Representación de datos a través de tablas y gráficos',
          'Medidas de tendencia central y posición (Cuartiles/Percentiles)',
          'Reglas de las probabilidades y eventos independientes'
        ]
      }
    ]
  },

  lenguaje: {
    niveles: [
      { id: 'leng_regular', nombre: 'Competencia Lectora PAES 2026' },
      { id: 'leng_intensivo', nombre: 'Competencia Lectora - Módulo Intensivo' }
    ],
    ejes: [
      {
        id: 'textos_lit',
        nombre: 'Textos Literarios',
        items: [
          'Narraciones y cuentos hispanoamericanos',
          'Obras dramáticas y conflicto teatral'
        ]
      },
      {
        id: 'textos_nolit',
        nombre: 'Textos No Literarios',
        items: [
          'Textos argumentativos y columnas de opinión',
          'Textos expositivos y artículos de divulgación',
          'Textos periodísticos y medios masivos de comunicación'
        ]
      },
      {
        id: 'hab_leng',
        nombre: 'Habilidades Lectoras DEMRE',
        items: [
          'Localizar información explícita',
          'Interpretar y relacionar ideas del texto',
          'Evaluar posición del autor y calidad argumentativa'
        ]
      }
    ]
  },

  historia: {
    niveles: [
      { id: 'his_regular', nombre: 'Historia y Ciencias Sociales PAES 2026' }
    ],
    ejes: [
      {
        id: 'eje_historia',
        nombre: 'Eje PAES Historia',
        items: [
          'Historia: Mundo, América y Chile (Siglos XIX y XX)',
          'Formación ciudadana y derechos humanos',
          'Sistema económico y problemas de escasez'
        ]
      },
      {
        id: 'hab_historia',
        nombre: 'Habilidad PAES Historia',
        items: [
          'Pensamiento temporal y espacial',
          'Análisis de fuentes de información primarias/secundarias',
          'Pensamiento crítico y multicausalidad'
        ]
      }
    ]
  },

  ciencias: {
    niveles: [
      { id: 'cie_bio', nombre: 'Ciencias común + Biología electivo' },
      { id: 'cie_fis', nombre: 'Ciencias común + Física electivo' },
      { id: 'cie_qui', nombre: 'Ciencias común + Química electivo' },
      { id: 'cie_tp',  nombre: 'Ciencias módulo Técnico Profesional (TP)' }
    ],
    ejes: [
      {
        id: 'bio',
        nombre: 'Biología',
        items: [
          'Organización, estructura y actividad celular',
          'Procesos y funciones biológicas (Mitosis/Meiosis)',
          'Herencia y evolución genética',
          'Organismo y ambiente (Ecosistemas)'
        ]
      },
      {
        id: 'fis',
        nombre: 'Física',
        items: [
          'Ondas y espectro electromagnético',
          'Mecánica: Leyes de Newton y movimiento',
          'Energía y Tierra (Tectónica de placas)',
          'Electricidad y circuitos eléctricos'
        ]
      },
      {
        id: 'qui',
        nombre: 'Química',
        items: [
          'Estructura atómica y tabla periódica',
          'Química orgánica e hidrocarburos',
          'Reacciones químicas y estequiometría'
        ]
      }
    ]
  }
};

/* Auto-inicializar siempre */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderGeneradorEvaluacion);
} else {
  renderGeneradorEvaluacion();
}
setTimeout(renderGeneradorEvaluacion, 300);

function cambiarAsignaturaGenerador(asig) {
  asigGeneradorActual = asig;

  document.querySelectorAll('.btn-gen-tab').forEach(b => {
    const isAct = b.dataset.asig === asig;
    b.classList.toggle('active', isAct);
    if (isAct) {
      b.style.background = 'rgba(37, 99, 235, 0.25)';
      b.style.borderColor = 'rgba(37, 99, 235, 0.6)';
      b.style.color = '#93c5fd';
    } else {
      b.style.background = 'rgba(255, 255, 255, 0.05)';
      b.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      b.style.color = '#94a3b8';
    }
  });

  renderGeneradorEvaluacion();
}

function renderGeneradorEvaluacion() {
  const configContainer = document.getElementById('gen-config-col');
  const personalContainer = document.getElementById('gen-personal-col');
  if (!configContainer || !personalContainer) return;

  const data = estructuraEjesGenerador[asigGeneradorActual] || estructuraEjesGenerador['matematica'];

  // Render Columna 1: Configurar
  configContainer.innerHTML = `
    <div style="background:rgba(15,23,42,0.7);border:1px solid rgba(99,152,255,0.15);border-radius:16px;padding:24px;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
      <h3 style="font-size:14px;font-weight:700;color:#93c5fd;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
        ⚙️ Configurar Evaluación
      </h3>

      <div style="margin-bottom:20px;">
        <label style="display:block;font-size:12px;font-weight:600;color:#cbd5e1;margin-bottom:8px;">Enfoque / Nivel PAES</label>
        <select id="gen-select-nivel" style="width:100%;padding:11px 14px;background:#0f172a;border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#f8fafc;font-size:13px;outline:none;">
          ${data.niveles.map(n => `<option value="${n.id}">${n.nombre}</option>`).join('')}
        </select>
      </div>

      <div>
        <label style="display:block;font-size:12px;font-weight:600;color:#cbd5e1;margin-bottom:12px;">Cantidad de preguntas y tiempo</label>
        <div style="display:flex;flex-direction:column;gap:10px;">
          
          <label style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(37,99,235,0.12);border:1px solid rgba(37,99,235,0.3);border-radius:10px;cursor:pointer;">
            <div style="display:flex;align-items:center;gap:10px;">
              <input type="radio" name="gen-preset-preset" value="65" checked onchange="toggleCustomTime(false)">
              <span style="font-weight:700;font-size:13px;color:#f8fafc;">65 preguntas</span>
            </div>
            <span style="font-size:12px;color:#93c5fd;font-weight:600;">⏱️ 140 minutos</span>
          </label>

          <label style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;cursor:pointer;">
            <div style="display:flex;align-items:center;gap:10px;">
              <input type="radio" name="gen-preset-preset" value="32" onchange="toggleCustomTime(false)">
              <span style="font-weight:700;font-size:13px;color:#f8fafc;">32 preguntas</span>
            </div>
            <span style="font-size:12px;color:#94a3b8;font-weight:600;">⏱️ 70 minutos</span>
          </label>

          <label style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;cursor:pointer;">
            <div style="display:flex;align-items:center;gap:10px;">
              <input type="radio" name="gen-preset-preset" value="16" onchange="toggleCustomTime(false)">
              <span style="font-weight:700;font-size:13px;color:#f8fafc;">16 preguntas</span>
            </div>
            <span style="font-size:12px;color:#94a3b8;font-weight:600;">⏱️ 35 minutos</span>
          </label>

          <label style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;cursor:pointer;">
            <div style="display:flex;align-items:center;gap:10px;">
              <input type="radio" name="gen-preset-preset" value="custom" onchange="toggleCustomTime(true)">
              <span style="font-weight:700;font-size:13px;color:#f8fafc;">Personalizado</span>
            </div>
            <div id="gen-custom-inputs" style="display:none;gap:6px;align-items:center;">
              <input type="number" id="gen-input-preg" value="10" min="1" max="80" style="width:55px;padding:4px 6px;background:#0f172a;border:1px solid rgba(255,255,255,0.2);border-radius:6px;color:#fff;font-size:12px;text-align:center;">
              <span style="color:#94a3b8;font-size:12px;">preg /</span>
              <input type="number" id="gen-input-min" value="20" min="1" max="200" style="width:55px;padding:4px 6px;background:#0f172a;border:1px solid rgba(255,255,255,0.2);border-radius:6px;color:#fff;font-size:12px;text-align:center;">
              <span style="color:#94a3b8;font-size:12px;">min</span>
            </div>
          </label>

        </div>
      </div>
    </div>
  `;

  // Render Columna 2: Personalizar Ejes
  personalContainer.innerHTML = `
    <div style="background:rgba(15,23,42,0.7);border:1px solid rgba(99,152,255,0.15);border-radius:16px;padding:24px;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
      <h3 style="font-size:14px;font-weight:700;color:#93c5fd;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;display:flex;align-items:center;gap:8px;">
        🎯 Personalizar Ejes y Habilidades DEMRE
      </h3>
      <p style="font-size:12px;color:#64748b;margin-bottom:16px;">SysGet Suite · Selecciona las categorías para formatear la evaluación.</p>

      <div style="display:flex;flex-direction:column;gap:14px;">
        ${data.ejes.map((eje, eIdx) => `
          <div style="border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;background:rgba(15,23,42,0.4);">
            <div style="background:rgba(255,255,255,0.04);padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
              <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-weight:700;font-size:13px;color:#cbd5e1;">
                <input type="checkbox" id="eje-master-${eIdx}" checked onchange="toggleMasterEje(${eIdx}, this.checked)">
                <span>${eje.nombre}</span>
              </label>
            </div>
            <div style="padding:12px 16px;display:flex;flex-direction:column;gap:8px;background:rgba(0,0,0,0.15);">
              ${eje.items.map((item, iIdx) => `
                <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:12px;color:#94a3b8;">
                  <input type="checkbox" class="eje-item-check-${eIdx}" checked>
                  <span>${item}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      <div style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap;">
        <button onclick="ejecutarGeneracionEvaluacion('online')" style="flex:1;min-width:180px;background:linear-gradient(135deg,#dc2626,#b91c1c);border:none;color:#fff;padding:14px;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 14px rgba(220,38,38,0.3);">
          <span>🚀 REALIZAR EN LÍNEA</span>
        </button>
        <button onclick="ejecutarGeneracionEvaluacion('pdf')" style="flex:1;min-width:180px;background:rgba(37,99,235,0.2);border:1px solid rgba(37,99,235,0.5);color:#93c5fd;padding:14px;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">
          <span>📄 GENERAR EVALUACIÓN PDF (SysGet)</span>
        </button>
      </div>
    </div>
  `;
}

function toggleCustomTime(showCustom) {
  const customDiv = document.getElementById('gen-custom-inputs');
  if (customDiv) customDiv.style.display = showCustom ? 'flex' : 'none';
}

function toggleMasterEje(eIdx, isChecked) {
  document.querySelectorAll(`.eje-item-check-${eIdx}`).forEach(cb => cb.checked = isChecked);
}

function ejecutarGeneracionEvaluacion(modo) {
  const nivelSelect = document.getElementById('gen-select-nivel');
  const nivelId = nivelSelect ? nivelSelect.value : 'm1_invierno';
  const nombreNivel = nivelSelect ? nivelSelect.options[nivelSelect.selectedIndex].text : 'Competencia matemática M1';
  
  let totalPreguntas = 65;
  let totalMinutos = 140;

  const selectedPreset = document.querySelector('input[name="gen-preset-preset"]:checked')?.value || '65';
  if (selectedPreset === '32') { totalPreguntas = 32; totalMinutos = 70; }
  else if (selectedPreset === '16') { totalPreguntas = 16; totalMinutos = 35; }
  else if (selectedPreset === 'custom') {
    totalPreguntas = parseInt(document.getElementById('gen-input-preg')?.value || '10') || 10;
    totalMinutos = parseInt(document.getElementById('gen-input-min')?.value || '20') || 20;
  }

  // Recopilar ejes seleccionados
  const ejesSeleccionados = [];
  document.querySelectorAll('input[type="checkbox"][id^="eje-master-"]:checked').forEach(cb => {
    const txt = cb.parentElement ? cb.parentElement.textContent.trim() : '';
    if (txt) ejesSeleccionados.push(txt);
  });

  if (modo === 'online') {
    // 1. Mapear nivel/asignatura al uidClavijero correspondiente
    const targetUid = mapearNivelAClavijero(asigGeneradorActual, nivelId);

    // 2. Guardar evaluación personalizada activa en el estado global
    state.evaluacionPersonalizada = {
      activa: true,
      asig: asigGeneradorActual,
      nivelId: nivelId,
      nombreNivel: nombreNivel,
      uidClavijero: targetUid,
      numPreguntas: totalPreguntas,
      duracionMinutos: totalMinutos,
      ejes: ejesSeleccionados
    };

    // 3. Cambiar a la sección Enviar
    showSection('enviar');

    // 4. Configurar automáticamente los campos de la sección Enviar
    configurarSeccionEnvioDesdeGenerador(state.evaluacionPersonalizada);

    // 5. Feedback visual al docente
    showToast(`🚀 Evaluación configurada: ${totalPreguntas} preguntas | ${totalMinutos} minutos`, 4000);
  } else {
    // Modo PDF Imprimible
    alert(`📄 Generando PDF Imprimible (SysGet Educational Suite)...\n\nPrueba: ${nombreNivel}\nPreguntas: ${totalPreguntas}\nTiempo oficial: ${totalMinutos} min\n\nEl documento PDF con membrete SysGet se abrirá a continuación.`);
    window.open('https://sysget-paes-manager.vercel.app/#biblioteca', '_blank');
  }
}

function mapearNivelAClavijero(asig, nivelId) {
  if (asig === 'matematica') {
    if (nivelId === 'm2_invierno') return 'm2_2026';
    if (nivelId === 'm1_regular') return 'm1_2026';
    return 'm1_2026';
  } else if (asig === 'lenguaje') {
    return 'lectora_2026';
  } else if (asig === 'historia') {
    return 'historia_2026';
  } else if (asig === 'ciencias') {
    if (nivelId === 'cie_bio') return 'biologia_2026';
    if (nivelId === 'cie_fis') return 'fisica_2026';
    if (nivelId === 'cie_qui') return 'quimica_2026';
    if (nivelId === 'cie_tp')  return 'tp_2026';
    return 'biologia_2026';
  }
  return 'm1_2026';
}

function configurarSeccionEnvioDesdeGenerador(evalConfig) {
  const selectPrueba  = document.getElementById('select-prueba-envio');
  const tituloInput   = document.getElementById('titulo-sesion');
  const duracionInput = document.getElementById('duracion-sesion');
  const infoBox       = document.getElementById('info-clave-box');
  const infoText      = document.getElementById('info-clave-text');

  if (selectPrueba && evalConfig.uidClavijero) {
    selectPrueba.value = evalConfig.uidClavijero;
  }
  if (tituloInput) {
    tituloInput.value = `Control: ${evalConfig.nombreNivel} (${evalConfig.numPreguntas} preg)`;
  }
  if (duracionInput) {
    duracionInput.value = evalConfig.duracionMinutos;
  }
  const numPregInput = document.getElementById('num-preguntas-sesion');
  if (numPregInput) {
    numPregInput.value = evalConfig.numPreguntas;
  }

  // Si ya habían alumnos en la lista, regenerar sus tokens para que correspondan a esta nueva evaluación
  if (state.alumnosEnSession && state.alumnosEnSession.length > 0) {
    state.alumnosEnSession.forEach(al => {
      al.token = 'tok_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36).slice(-4);
      al.estado = 'pendiente';
      al.respuestas = {};
    });
    if (typeof renderAlumnosLista === 'function') {
      renderAlumnosLista();
    }
  }

  if (infoBox && infoText) {
    infoBox.style.display = 'block';
    infoBox.style.background = 'rgba(124, 58, 237, 0.15)';
    infoBox.style.borderColor = 'rgba(124, 58, 237, 0.4)';
    infoText.innerHTML = `
      <div style="color:#c084fc; font-weight:700; font-size:13px; margin-bottom:4px;">
        🎯 Evaluación Personalizada SysGet Configurada
      </div>
      <div style="color:var(--text-primary); font-size:12.5px; line-height:1.5;">
        <strong>Asignatura:</strong> ${evalConfig.nombreNivel}<br>
        <strong>Cantidad de Preguntas:</strong> <span style="color:#34d399; font-weight:700;">${evalConfig.numPreguntas} preguntas</span><br>
        <strong>Tiempo Límite:</strong> <span style="color:#38bdf8; font-weight:700;">${evalConfig.duracionMinutos} minutos</span><br>
        <span style="color:#94a3b8; font-size:11.5px; display:block; margin-top:3px;">
          ✓ Los alumnos responderán exactamente estas ${evalConfig.numPreguntas} preguntas en su hoja digital.
        </span>
      </div>
      <div style="margin-top:8px;">
        <button class="btn btn-outline" onclick="cancelarPersonalizacionEvaluacion()" style="padding:4px 10px; font-size:11px; border-color:rgba(255,255,255,0.2); color:#cbd5e1;">
          🔄 Restablecer a Clavijero Completo (65 preg)
        </button>
      </div>
    `;
  }
}

function cancelarPersonalizacionEvaluacion() {
  if (state.evaluacionPersonalizada) {
    state.evaluacionPersonalizada.activa = false;
  }
  const selectPrueba = document.getElementById('select-prueba-envio');
  if (selectPrueba) {
    alSeleccionarClavijero(selectPrueba.value);
  }
  showToast('🔄 Restablecido a clavijero completo');
}

