# 📌 Registro de Estado y Continuación — Proyecto PAES WEB (Sysget-PAES-Manager)

**Fecha de Última Actualización:** 05 de Agosto, 2026  
**Ubicación Local del Proyecto:** `C:\Proyectos\Proyecto PAES WEB`  
**Repositorio GitHub:** `https://github.com/leontestvirtual1-sketch/Sysget-PAES-Manager`  
**Despliegue Producción (Vercel):** `https://sysget-paes-manager.vercel.app` (o subdominio asignado en Vercel)  
**Base de Datos Nube:** 🟢 Firebase Firestore (`proyecto-paes-web-ia`)  

---

## 🚀 Resumen Ejecutivo y Novedades de la Versión Actual

### 1. 🌐 Despliegue en la Nube y CI/CD Automático
- **Repositorio en GitHub:** Proyecto alojado de forma segura en `leontestvirtual1-sketch/Sysget-PAES-Manager`. Credenciales de Firebase y correos aislados sin exposición en el código.
- **Despliegue Continuo en Vercel:** Vinculado mediante GitHub Integration. Cada `git push` a la rama `main` activa una compilación y despliegue automático en tiempo real en Vercel.
- **Configuración `vercel.json`:** Ajustes de rutas limpias (ej. `/responder`), cabeceras de seguridad y optimizaciones de caché para los archivos de gran tamaño (`explicaciones_paes.json` y `catalogo_historico.json`).

### 2. 📊 Estandarización de Puntuación PAES (Sin Notas 1.0 - 7.0)
- **Escala Oficial DEMRE (100 a 1000 puntos):** Se eliminó por completo el parámetro de "Exigencia (%)" y la escala de notas del sistema escolar chileno (1.0 a 7.0).
- **Indicadores Clave (KPIs):** El panel del docente muestra en tiempo real:
  - Alumnos Completados vs Total.
  - Promedio de Puntaje PAES del Grupo.
  - Puntaje Máximo Obtenido en la Sesión.
- **Exportación Excel (CSV):** La descarga en CSV ahora reporta el **Puntaje PAES** y el **% Logro** de cada estudiante.

### 3. 🗑️ Gestión y Eliminación Reactiva de Sesiones
- **Panel de Gestión en Tiempo Real:** Reescritura completa del modal de eliminación utilizando `escucharSesiones()` de Firestore (`onSnapshot`).
- **Eliminación Individual y Masiva:** Cada fila cuenta con su propio botón **🗑️ Borrar** instantáneo (con confirmación de seguridad), manteniendo la opción de eliminación por lotes vía checkbox.
- **Limpieza Automática:** Si la sesión eliminada estaba activa en el panel de resultados, la vista se resetea de inmediato.

### 4. 💾 Auto-Guardado en Tiempo Real y Restauración de Sesión (Portal Alumno)
- **Persistencia Inmediata (`guardarBorrador`):** Cada alternativa seleccionada por el alumno se guarda al instante en Firestore/LocalStorage.
- **Restauración de Estado:** Si el alumno cierra la pestaña, pierde conexión o recarga la página, al reingresar se restauran automáticamente todas sus respuestas previamente marcadas.

### 5. 💡 Solucionario y Retroalimentación Pedagógica en el Portal Alumno
- **Matemáticas (M1, M2, Matemática):** Al finalizar la prueba, el alumno visualiza la **Definición / Propiedad Clave** utilizada y el desarrollo **Paso a Paso** (Planteamiento, Desarrollo y Conclusión), además del **Diagnóstico del Error** específico si se equivocó en alguna opción.
- **Demás Materias (Competencia Lectora, Ciencias, Historia, etc.):** Muestra la **Habilidad Evaluada**, la **Justificación de la Respuesta Correcta** y la **Argumentación Pedagógica del Error**.

### 6. 📧 Formato de Correo Compatible con Outlook (Windows) y Dispositivos Móviles
- **HTML Estructurado en Tablas Inline:** Maquetación compatible con el motor de renderizado de Microsoft Word/Outlook en Windows.
- **Respaldo con Código Token:** Casilla destacada en verde con el código personal (`PAES-tok_...`) en tipografía `Courier New`, permitiendo al alumno ingresar manualmente si Outlook inhabilita los hipervínculos por políticas corporativas.

---

## 🛠️ Comandos de Desarrollo y Despliegue

### Para ejecutar en entorno local:
```powershell
cd "C:\Proyectos\Proyecto PAES WEB"
python -m http.server 8080
# Abrir en navegador: http://localhost:8080
```

### Para publicar cambios en Producción (Vercel):
```powershell
git -C "C:\Proyectos\Proyecto PAES WEB" add .
git -C "C:\Proyectos\Proyecto PAES WEB" commit -m "Descripción del cambio"
git -C "C:\Proyectos\Proyecto PAES WEB" push
# Vercel actualizará la web pública automáticamente en 30 segundos
```

---

## 📁 Estructura del Proyecto

```
Proyecto PAES WEB/
├── .gitignore                  ← Excluye PDFs pesados (152MB) y scripts temporales
├── vercel.json                 ← Configuración de Vercel (URLs limpias y caché)
├── index.html                  ← Panel docente (descarga, mezcla, envío, resultados)
├── responder.html              ← Portal de evaluación del alumno + Solucionario
├── styles.css                  ← Estilos UI Dark Mode Premium (glassmorphism)
├── app.js                      ← Lógica del docente y gestión de resultados PAES
├── app-responder.js            ← Lógica del alumno, auto-guardado y retroalimentación
├── firebase-config.js          ← Interfaz PAES_DB IIFE (Firestore + LocalStorage)
├── email-service.js            ← Generador de plantillas HTML de correo para Outlook
├── catalogo_historico.json     ← Catálogo de pruebas oficiales del DEMRE
├── claves_y_escalas.json       ← Claves oficiales y tablas de conversión (100-1000 pts)
├── explicaciones_paes.json     ← Base de datos de retroalimentación y solucionario paso a paso
├── mezclar_paes.py             ← Motor de mezcla de páginas PDF de ensayos PAES
└── LOG_ESTADO_PROYECTO.md      ← Este documento de registro de estado
```

---

## 💬 Cómo continuar en próximas sesiones

Al iniciar una nueva conversación con el Asistente AI, simplemente indica:
> *"Continuemos con el proyecto PAES WEB basándote en LOG_ESTADO_PROYECTO.md"*
