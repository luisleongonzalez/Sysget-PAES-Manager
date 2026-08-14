---
name: modern-web-app-design
description: Guía y estándares avanzados para diseñar y construir aplicaciones web modernas, atractivas y profesionales usando React, Next.js, Tailwind CSS, TypeScript y componentes visuales de alto impacto (dashboards, glassmorphism, temas claro/oscuro, animación, jerarquía visual y UX responsiva). Utilizar cuando se creen o refactoricen páginas, componentes, pantallas, dashboards o interfaces UI/UX de aplicaciones web.
---
# 🚀 Skill: Diseñador de Aplicaciones Web Modernas (UI/UX & Web Apps)

Esta habilidad establece los estándares fundamentales de diseño web de última generación para aplicaciones desarrolladas con **React**, **Next.js**, **Tailwind CSS** y **TypeScript**. Su objetivo es garantizar que cada pantalla, dashboard, formulario o componente transmita una apariencia limpia, ultra moderna, ágil y de nivel producto comercial SaaS/Enterprise.

---

## 🎨 1. Principios de Estética Visual y Estilo Moderno

### A. Paleta de Colores y Jerarquía Cromática

- **Colores Neutros Pulidos**: Utilizar escalas neutras sofisticadas como `slate`, `zinc` o `neutral` de Tailwind para fondos y textos en lugar de colores primarios puros.
- **Accentos de Alto Impacto con Opacidad**: Usar acentos vibrantes (Indigo, Emerald, Violet, Cyan, Amber) combinados con opacidades bajas para fondos y bordes:
  - Fondo de Badge / Chip: `bg-indigo-500/10 dark:bg-indigo-500/20`
  - Texto de Badge: `text-indigo-600 dark:text-indigo-400 font-semibold`
  - Borde de Accent: `border-indigo-500/30`
- **Sistemas de Estado**:
  - Exitoso / Activo: `emerald` (ej. `bg-emerald-500/10 text-emerald-600 border-emerald-500/20`)
  - Advertencia / Pendiente: `amber` (ej. `bg-amber-500/10 text-amber-600 border-amber-500/20`)
  - Error / Inactivo: `rose` (ej. `bg-rose-500/10 text-rose-600 border-rose-500/20`)
  - Informativo: `sky` o `indigo`

### B. Profundidad, Elevación y Glassmorphism

- **Capas de Elevación**: Crear jerarquía física mediante bordes sutiles y sombras livianas en lugar de sombras pesadas o bordes gruesos:
  - Tarjetas estándar: `bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow`
  - Efecto Cristal (Glassmorphism): `bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800/80`
  - Modales y Menús Flotantes: `shadow-2xl shadow-slate-950/10 dark:shadow-black/50 border border-slate-200/90 dark:border-slate-800`

---

## 🧩 2. Patrones de Componentes Frecuentes en Web Apps

### A. Tarjetas KPI / Métricas (Stat Cards)

Toda métrica clave debe lucir limpia, legible y visualmente estructurada:

- **Cabecera**: Título en tamaño pequeño y texto atenuado (`text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400`), acompañado de un ícono encerrado en un contenedor cuadrado redondeado con fondo suave (`p-2.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400`).
- **Valor Principal**: Tipografía destacada, números legibles (`text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white`).
- **Pie de Tarjeta / Indicador**: Porcentaje de cambio o estado en un chip pequeño con ícono de flecha subida/bajada.

### B. Tablas de Datos Modernas

Las tablas no deben verse monolíticas ni aburridas:

- **Cabecera de Tabla**: `bg-slate-50/80 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800`.
- **Filas**: `hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors duration-150 border-b border-slate-100 dark:border-slate-800/60`.
- **Celdas de Usuario / Entidad**: Avatar redondeado (`w-9 h-9 rounded-full ring-2 ring-white dark:ring-slate-900`) + Nombre en negrita + Subtexto/Email en fuente atenuada.
- **Acciones**: Botones de acción discretos con íconos (`ghost buttons` con `hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg p-1.5`).

### C. Formularios Interactivos y Controles

- **Campos de Entrada (Inputs)**:
  - `w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all`
  - Incluir íconos dentro del input (ej. lupa en búsquedas, candado en contraseña) con relleno interno (`pl-10`).
- **Botones de Acción**:
  - Primario: `bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm shadow-indigo-600/20 hover:shadow-md transition-all active:scale-[0.98]`
  - Secundario: `bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium px-4 py-2.5 rounded-xl transition-all`

---

## ⚡ 3. Animaciones, Feedback y Micro-interacciones

1. **Estados Activos y Feedback Visual**:
   - Agregar respuesta táctil inmediata a clicks con clases como `active:scale-[0.98]` o `active:scale-95`.
   - Efecto de elevación en tarjetas interactivas: `hover:-translate-y-1 transition-transform duration-200 ease-out`.
2. **Cargando y Skeleton Loaders**:
   - Reemplazar spinners feos o pantallas en blanco por esqueletos animados de carga:
     ```tsx
     <div className="animate-pulse space-y-3">
       <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
       <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
     </div>
     ```
3. **Estados Vacíos Elegantes (Empty States)**:
   - Jamás dejar una tabla o lista vacía sin explicación.
   - Mostrar un ícono ilustrativo en un círculo de color suave + Título corto + Mensaje descriptivo + Botón de acción principal (ej. "Crear primer registro").

---

## 📱 4. Diseño Responsivo y Móvil Primero (Mobile-First)

- **Diseño Adaptativo de Navegación**:
  - En escritorio: Barra lateral fija (Sidebar) o navegación superior con enlaces limpios.
  - En móvil: Menú hamburguesa desplegable con fondo desenfocado o barra de navegación inferior (Bottom Navigation Bar) fácil de tocar con el pulgar.
- **Grillas Dinámicas**: Usar `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6` para que los paneles se reordenen de forma natural sin desbordamientos laterales.
- **Touch-Friendly Padding**: Botones e inputs con altura mínima recomendada de 44px (`py-2.5` o `h-11`) para facilitar la interacción en teléfonos móviles.

---

## 🛠️ 5. Lista de Verificación (Checklist UI/UX para Code Reviews)

Antes de dar por completada una vista o componente de la aplicación web, verificar:

- [ ] **¿La jerarquía tipográfica es evidente a primera vista?** (Títulos grandes, subtítulos claros, metadatos atenuados).
- [ ] **¿Los espacios (`padding`/`gap`) son consistentes?** (Usar múltiplos de 4: 8px, 12px, 16px, 24px, 32px).
- [ ] **¿El contraste de color cumple con accesibilidad tanto en modo claro como en modo oscuro?**
- [ ] **¿Hay respuesta visual en hover, focus y click en cada elemento interactivo?**
- [ ] **¿Los estados de carga (Skeleton/Spinners) y estados vacíos están implementados?**
- [ ] **¿La interfaz se ve impecable en pantallas móviles (375px) y pantallas ultra-wide?**
- [ ] **¿Los íconos son consistentes en estilo y tamaño?** (Usar la misma librería como `lucide-react`).
