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
  const nombreNivel = nivelSelect ? nivelSelect.options[nivelSelect.selectedIndex].text : 'SysGet PAES Manager';
  
  let totalPreguntas = 65;
  let totalMinutos = 140;

  const selectedPreset = document.querySelector('input[name="gen-preset-preset"]:checked')?.value || '65';
  if (selectedPreset === '32') { totalPreguntas = 32; totalMinutos = 70; }
  else if (selectedPreset === '16') { totalPreguntas = 16; totalMinutos = 35; }
  else if (selectedPreset === 'custom') {
    totalPreguntas = parseInt(document.getElementById('gen-input-preg')?.value || '10');
    totalMinutos = parseInt(document.getElementById('gen-input-min')?.value || '20');
  }

  if (modo === 'online') {
    showSection('enviar');
    alert(`🎉 Evaluación SysGet Generada con Éxito\n\n📌 Prueba: ${nombreNivel}\n📊 Preguntas: ${totalPreguntas}\n⏱️ Tiempo: ${totalMinutos} minutos\n\nSoftware Educativo: SysGet PAES Manager`);
  } else {
    alert(`📄 Generando PDF Imprimible (SysGet Educational Suite)...\n\nPrueba: ${nombreNivel}\nPreguntas: ${totalPreguntas}\nTiempo oficial: ${totalMinutos} min\n\nEl documento PDF con membrete SysGet se abrirá a continuación.`);
    window.open('https://sysget-paes-manager.vercel.app/#biblioteca', '_blank');
  }
}
