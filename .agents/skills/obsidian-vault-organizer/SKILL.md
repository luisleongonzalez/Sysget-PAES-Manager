---
name: obsidian-vault-organizer
description: Organiza, limpia y estructura un vault de Obsidian aplicando mejores prácticas (PARA, Zettelkasten simplificado, o híbrido). Úsalo siempre que el usuario pida "ordenar mi vault", "organizar mis notas de Obsidian", "limpiar Obsidian", "estructurar carpetas/tags en Obsidian", "consolidar notas duplicadas", "unificar convención de nombres", o cualquier tarea de mantenimiento/reestructuración de un vault de Obsidian, incluso si no usan la palabra "organizar" explícitamente (ej. "tengo el vault hecho un caos", "no encuentro nada en mis notas").
---

# 🗂️ Organización de Vaults en Obsidian

Skill para diagnosticar, planificar y ejecutar la organización de un vault de Obsidian usando el conector MCP de Obsidian (herramientas: `list-available-vaults`, `search-vault`, `read-note`, `create-note`, `edit-note`, `move-note`, `delete-note`, `create-directory`, `add-tags`, `remove-tags`, `rename-tag`).

---

## 🧭 Principio Rector

> **Nunca reestructures a ciegas.**  
> Siempre: **diagnosticar → proponer un plan → confirmar con el usuario → ejecutar en lotes pequeños y verificables.**  
> Mover o renombrar notas rompe enlaces internos si no se hace con cuidado; usar `move-note` (que preserva enlaces) en vez de borrar + crear (`delete-note` + `create-note`).

---

## 🔄 Flujo de Trabajo

### 1. Diagnóstico (siempre primero)
- Ejecutar `list-available-vaults` para confirmar con qué vault se trabaja.
- Ejecutar `search-vault` o explorar la estructura para entender el estado actual: carpetas existentes, convenciones de nombres, cantidad aproximada de notas, uso de tags, presencia (o ausencia) de notas MOC/índice.
- **Identificar problemas comunes:**
  - Notas sueltas en la raíz sin carpeta.
  - Tags duplicados o casi-duplicados (`#proyecto`, `#Proyecto`, `#proyectos`).
  - Nombres de archivo inconsistentes (fechas, mayúsculas, espacios vs guiones).
  - Carpetas por tipo de archivo en vez de por propósito (ej. `"notas"`, `"notas2"`).
  - Notas huérfanas (sin enlaces entrantes ni salientes).
  - Falta de una nota "hub" o índice por área.

---

### 2. Elegir un Sistema de Organización

No hay un único sistema correcto. Pregunta al usuario o infiere de su uso actual. Los tres más comunes:

#### a) PARA (Projects, Areas, Resources, Archive)
> *Recomendado por defecto si el usuario no tiene preferencia, porque es el más fácil de mantener a largo plazo.*
```text
00-Inbox/
01-Proyectos/       ← Con fecha de fin o resultado concreto
02-Areas/           ← Responsabilidades continuas (salud, finanzas, trabajo)
03-Recursos/        ← Temas de interés, referencia
04-Archivo/         ← Proyectos/áreas cerrados
```

#### b) Zettelkasten Simplificado
> *Mejor para quienes escriben notas atómicas de pensamiento/conocimiento y priorizan los enlaces sobre las carpetas.*
```text
00-Fleeting/        ← Notas rápidas sin procesar
01-Literature/      ← Notas de fuentes (libros, artículos)
02-Permanent/       ← Ideas propias, atómicas, enlazadas entre sí
03-MOCs/            ← Maps of Content (notas índice por tema)
```
*Aquí las carpetas importan menos que los enlaces `[[wikilinks]]` y los tags.*

#### c) Híbrido por Área de Vida/Trabajo
Carpetas de alto nivel por dominio (*Trabajo*, *Personal*, *Estudio*), y dentro de cada una una lógica simple (*Activo*/*Archivo*). Bueno para vaults pequeños o quienes prefieren pensar en "¿dónde vive esto?" antes que en metodología.

---

### 3. Convenciones a Fijar (y aplicar consistentemente)
- **Nombres de archivo:** Elegir un formato y mantenerlo (ej. `Título en Mayúsculas Iniciales.md`, o `AAAA-MM-DD Título.md` para notas diarias/reuniones). Evitar mezclar idiomas o mayúsculas al azar.
- **Tags vs Carpetas:** Las carpetas responden *"¿dónde vive esto?"* (una sola ubicación posible); los tags responden *"¿qué es esto?"* (puede tener varios). No dupliques la misma información en ambos.
- **Jerarquía de tags:** Usar `#area/subarea` en vez de tags planos si el vault es grande.
- **Notas índice (MOC):** Una nota por carpeta principal que enlaza a las notas relevantes, útil como punto de entrada.
- **Inbox:** Una carpeta de captura rápida que se revisa y vacía periódicamente, para no forzar a decidir la ubicación final en el momento de crear la nota.

---

### 4. Plan Antes de Ejecutar

Antes de mover o renombrar nada, presenta al usuario:
1. La estructura de carpetas propuesta.
2. Qué notas/tags se consolidan o renombran (con ejemplos concretos, no solo la regla general).
3. Qué se queda igual.

> [!IMPORTANT]
> **Espera confirmación explícita antes de ejecutar cambios masivos.**  
> Para vaults grandes, ejecuta y confirma por lotes (ej. una carpeta a la vez) en vez de todo de una sola vez.

---

### 5. Ejecución
- Usa `move-note` para reubicar (preserva backlinks); **evita** `delete-note` + `create-note` para simples reubicaciones.
- Usa `rename-tag` para consolidar variantes de tags en todo el vault de una sola vez, en vez de nota por nota.
- Usa `add-tags` / `remove-tags` para aplicar la nueva convención de tags.
- Crea carpetas con `create-directory` antes de mover notas hacia ellas.
- Al final, crea o actualiza las notas MOC/índice si el sistema elegido las usa.

---

### 6. Mantenimiento Continuo (recomendaciones para el usuario)
- Revisar la carpeta `Inbox` semanalmente.
- Revisar tags nuevos periódicamente para evitar duplicidades.
- Archivar proyectos/áreas cerrados en vez de borrarlos.

---

## ⚠️ Qué Evitar
- ❌ **No inventes una taxonomía compleja para un vault pequeño (<100 notas)**: la sobre-ingeniería es la causa más común de abandono del sistema.
- ❌ **No fuerces PARA o Zettelkasten si el uso real del usuario no encaja** (ej. alguien que solo toma apuntes de clase no necesita "Areas").
- ❌ **No renombres ni muevas en masa sin mostrar antes una muestra representativa del resultado.**
