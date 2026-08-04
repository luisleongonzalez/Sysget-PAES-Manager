"""
=======================================================
MEZCLADOR DE PRUEBAS PAES - GENERADOR DE ENSAYO
=======================================================
Mezcla preguntas de múltiples pruebas PAES (PDF) para
generar una nueva prueba sin preguntas repetidas.

Requiere: pip install PyMuPDF reportlab
=======================================================
"""

import os
import sys
import json
import random
import argparse
from pathlib import Path
from datetime import datetime

# ──────────────────────────────────────────────────────
# INSTALACIÓN AUTOMÁTICA DE DEPENDENCIAS
# ──────────────────────────────────────────────────────
def instalar_dependencias():
    import subprocess
    deps = ["PyMuPDF", "reportlab", "Pillow"]
    for dep in deps:
        try:
            __import__(dep.replace("-", "_").split("==")[0])
        except ImportError:
            print(f"Instalando {dep}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", dep, "-q"])

instalar_dependencias()

import fitz  # PyMuPDF
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

# ──────────────────────────────────────────────────────
# CONFIGURACIÓN
# ──────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).parent
PRUEBAS_DIR = BASE_DIR / "pruebas_paes" / "pruebas"
OUTPUT_DIR  = BASE_DIR / "ensayos_generados"
REGISTRO_FILE = BASE_DIR / "preguntas_usadas.json"

VERDE  = "\033[92m"
ROJO   = "\033[91m"
AMARI  = "\033[93m"
CYAN   = "\033[96m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

# ──────────────────────────────────────────────────────
# CATÁLOGO DE PRUEBAS DISPONIBLES (con metadata)
# ──────────────────────────────────────────────────────
def cargar_catalogo():
    try:
        with open(BASE_DIR / 'catalogo_historico.json', 'r', encoding='utf-8') as f:
            datos = json.load(f)
    except FileNotFoundError:
        print(f"{ROJO}Error: No se encontró 'catalogo_historico.json'. Ejecuta 'python scrape_paes.py' primero.{RESET}")
        return {}
    
    cat = {}
    for item in datos:
        archivo = item["archivo"].lower()
        if item["tipo"] == "prueba" and "temario" not in archivo and "revista" not in archivo:
            materia = item["materia"]
            anio = item["anio"]
            
            uid = f"{materia}_{anio}"
            # Para evitar sobreescribir si hay múltiples (ej. oficial vs marcadas)
            if uid in cat:
                if "marcadas" not in archivo:  # Preferimos la versión limpia
                    cat[uid]["archivo"] = item["archivo"]
            else:
                cat[uid] = {
                    "nombre": f"{materia.capitalize()} ({anio})",
                    "archivo": item["archivo"],
                    "anio": anio,
                    "materia": materia
                }
    return cat

CATALOGO = cargar_catalogo()

# ──────────────────────────────────────────────────────
# GESTOR DE PREGUNTAS USADAS (anti-repetición)
# ──────────────────────────────────────────────────────

class GestorPreguntas:
    """Registra qué páginas/preguntas ya se usaron para evitar repeticiones."""
    
    def __init__(self, archivo_registro=REGISTRO_FILE):
        self.archivo = archivo_registro
        self.registro = self._cargar()
    
    def _cargar(self):
        if self.archivo.exists():
            with open(self.archivo, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}
    
    def _guardar(self):
        with open(self.archivo, "w", encoding="utf-8") as f:
            json.dump(self.registro, f, ensure_ascii=False, indent=2)
    
    def paginas_usadas(self, prueba_id):
        return set(self.registro.get(prueba_id, []))
    
    def registrar_paginas(self, prueba_id, paginas):
        if prueba_id not in self.registro:
            self.registro[prueba_id] = []
        self.registro[prueba_id] = list(set(self.registro[prueba_id] + paginas))
        self._guardar()
    
    def reset_prueba(self, prueba_id):
        if prueba_id in self.registro:
            del self.registro[prueba_id]
            self._guardar()
    
    def reset_todo(self):
        self.registro = {}
        self._guardar()
        print(f"{VERDE}✓ Registro de preguntas usadas reiniciado.{RESET}")
    
    def mostrar_estado(self):
        print(f"\n{BOLD}Estado de preguntas usadas:{RESET}")
        if not self.registro:
            print("  (Ninguna pregunta usada aún)")
            return
        for prueba_id, paginas in self.registro.items():
            nombre = CATALOGO.get(prueba_id, {}).get("nombre", prueba_id)
            print(f"  • {nombre}: {len(paginas)} páginas ya usadas")


# ──────────────────────────────────────────────────────
# EXTRACTOR DE PÁGINAS PDF
# ──────────────────────────────────────────────────────

class ExtractorPDF:
    """Extrae páginas de un PDF, respetando las que ya se usaron."""
    
    def __init__(self, ruta_pdf, prueba_id, gestor):
        self.ruta = ruta_pdf
        self.prueba_id = prueba_id
        self.gestor = gestor
        self._doc = None
        self._total_paginas = 0
    
    def abrir(self):
        self._doc = fitz.open(str(self.ruta))
        self._total_paginas = len(self._doc)
        return self._total_paginas
    
    def cerrar(self):
        if self._doc:
            self._doc.close()
    
    def paginas_disponibles(self, excluir_primeras=2):
        """Retorna páginas no usadas (excluyendo portada/índice)."""
        usadas = self.gestor.paginas_usadas(self.prueba_id)
        todas = set(range(excluir_primeras, self._total_paginas))
        disponibles = sorted(todas - usadas)
        return disponibles
    
    def seleccionar_paginas(self, n_paginas, aleatorio=True, excluir_primeras=2):
        """Selecciona N páginas no repetidas."""
        disponibles = self.paginas_disponibles(excluir_primeras)
        
        if not disponibles:
            print(f"  {ROJO}⚠ Sin páginas disponibles en {self.prueba_id}{RESET}")
            return []
        
        n_real = min(n_paginas, len(disponibles))
        
        if aleatorio:
            seleccionadas = sorted(random.sample(disponibles, n_real))
        else:
            seleccionadas = disponibles[:n_real]
        
        if n_real < n_paginas:
            print(f"  {AMARI}⚠ Solo hay {n_real} páginas disponibles (se pidieron {n_paginas}){RESET}")
        
        return seleccionadas
    
    def extraer_paginas_a_pdf(self, paginas, pdf_destino):
        """Copia páginas seleccionadas al PDF destino."""
        for num_pag in paginas:
            pdf_destino.insert_pdf(self._doc, from_page=num_pag, to_page=num_pag)


# ──────────────────────────────────────────────────────
# GENERADOR DE ENSAYO MEZCLADO
# ──────────────────────────────────────────────────────

class GeneradorEnsayo:
    """Genera un ensayo mezclando páginas de múltiples pruebas."""
    
    def __init__(self):
        self.gestor = GestorPreguntas()
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    def generar(self, configuracion):
        """
        configuracion: dict con {
            "pruebas": [{"id": "historia", "paginas": 10}, ...],
            "titulo": "Ensayo Personalizado",
            "aleatorio": True,
            "registrar": True  # Si se marcan como usadas
        }
        """
        titulo    = configuracion.get("titulo", "Ensayo PAES Mezclado")
        aleatorio = configuracion.get("aleatorio", True)
        registrar = configuracion.get("registrar", True)
        pruebas_config = configuracion.get("pruebas", [])
        
        if not pruebas_config:
            print(f"{ROJO}Error: No se especificaron pruebas.{RESET}")
            return None
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        nombre_archivo = f"ensayo_{timestamp}.pdf"
        ruta_salida = OUTPUT_DIR / nombre_archivo
        
        print(f"\n{BOLD}{CYAN}{'═'*60}{RESET}")
        print(f"{BOLD}{CYAN}  GENERANDO ENSAYO: {titulo}{RESET}")
        print(f"{BOLD}{CYAN}{'═'*60}{RESET}")
        
        # PDF de salida
        pdf_resultado = fitz.open()
        
        # ── PORTADA ──────────────────────────────────
        self._agregar_portada(pdf_resultado, titulo, pruebas_config)
        
        paginas_por_prueba = {}
        total_paginas = 1  # portada
        
        for item in pruebas_config:
            prueba_id = item["id"]
            n_paginas = item.get("paginas", 10)
            
            if prueba_id not in CATALOGO:
                print(f"\n{ROJO}✗ Prueba '{prueba_id}' no encontrada en catálogo.{RESET}")
                continue
            
            meta  = CATALOGO[prueba_id]
            ruta  = PRUEBAS_DIR / meta["archivo"]
            
            if not ruta.exists():
                print(f"\n{ROJO}✗ Archivo no encontrado: {meta['archivo']}{RESET}")
                print(f"  Ejecuta primero: python descargar_paes.py")
                continue
            
            print(f"\n{BOLD}  📄 {meta['nombre']}{RESET}")
            
            extractor = ExtractorPDF(ruta, prueba_id, self.gestor)
            total_doc = extractor.abrir()
            print(f"     Total páginas del PDF: {total_doc}")
            
            seleccionadas = extractor.seleccionar_paginas(n_paginas, aleatorio)
            
            if seleccionadas:
                print(f"     {VERDE}✓ Seleccionadas: {len(seleccionadas)} páginas → {seleccionadas}{RESET}")
                
                # Agregar separador de sección
                self._agregar_separador(pdf_resultado, meta["nombre"], meta["anio"])
                
                # Copiar páginas
                extractor.extraer_paginas_a_pdf(seleccionadas, pdf_resultado)
                
                paginas_por_prueba[prueba_id] = seleccionadas
                total_paginas += len(seleccionadas) + 1  # +1 separador
                
                # Registrar como usadas
                if registrar:
                    self.gestor.registrar_paginas(prueba_id, seleccionadas)
            
            extractor.cerrar()
        
        # Guardar PDF final
        pdf_resultado.save(str(ruta_salida))
        pdf_resultado.close()
        
        # Guardar metadatos del ensayo
        meta_ensayo = {
            "titulo": titulo,
            "fecha_generacion": datetime.now().isoformat(),
            "archivo": nombre_archivo,
            "paginas_totales": total_paginas,
            "pruebas_incluidas": {
                pid: {
                    "nombre": CATALOGO[pid]["nombre"],
                    "paginas_seleccionadas": pags
                }
                for pid, pags in paginas_por_prueba.items()
            }
        }
        
        meta_archivo = OUTPUT_DIR / f"ensayo_{timestamp}_meta.json"
        with open(meta_archivo, "w", encoding="utf-8") as f:
            json.dump(meta_ensayo, f, ensure_ascii=False, indent=2)
        
        print(f"\n{VERDE}{'═'*60}{RESET}")
        print(f"{VERDE}✓ ENSAYO GENERADO EXITOSAMENTE{RESET}")
        print(f"  Archivo: {ruta_salida}")
        print(f"  Páginas: {total_paginas}")
        print(f"{VERDE}{'═'*60}{RESET}\n")
        
        return str(ruta_salida)
    
    def _agregar_portada(self, pdf, titulo, pruebas_config):
        """Agrega una página de portada al ensayo."""
        nueva_pag = pdf.new_page(width=595, height=842)  # A4
        
        # Fondo azul oscuro
        nueva_pag.draw_rect(fitz.Rect(0, 0, 595, 842), color=None, fill=(0.08, 0.18, 0.38))
        
        # Banda decorativa
        nueva_pag.draw_rect(fitz.Rect(0, 200, 595, 210), color=None, fill=(0.95, 0.68, 0.05))
        nueva_pag.draw_rect(fitz.Rect(0, 630, 595, 635), color=None, fill=(0.95, 0.68, 0.05))
        
        # Texto ENSAYO PAES
        nueva_pag.insert_text(
            (297, 180), "ENSAYO PAES",
            fontsize=40, color=(1, 1, 1),
            fontname="helv",
            rotate=0
        )
        nueva_pag.insert_text(
            (297, 230), titulo,
            fontsize=20, color=(0.95, 0.90, 0.20),
            fontname="helv"
        )
        nueva_pag.insert_text(
            (297, 280), f"PAES de Invierno - Proceso de Admisión 2026",
            fontsize=14, color=(0.80, 0.90, 1.0),
            fontname="helv"
        )
        nueva_pag.insert_text(
            (297, 320), f"Generado el {datetime.now().strftime('%d/%m/%Y %H:%M')}",
            fontsize=12, color=(0.7, 0.7, 0.8),
            fontname="helv"
        )
        
        # Lista de pruebas incluidas
        y = 380
        nueva_pag.insert_text((297, y), "Pruebas incluidas:", fontsize=13, color=(0.95, 0.68, 0.05), fontname="helv")
        y += 30
        for item in pruebas_config:
            meta = CATALOGO.get(item["id"], {})
            nombre = meta.get("nombre", item["id"])
            nueva_pag.insert_text((297, y), f"• {nombre} ({item.get('paginas', '?')} págs.)", fontsize=11, color=(0.9, 0.9, 0.9), fontname="helv")
            y += 22
        
        # Footer
        nueva_pag.insert_text((297, 780), "Fuente: DEMRE - Universidad de Chile | demre.cl", fontsize=9, color=(0.5, 0.6, 0.7), fontname="helv")
    
    def _agregar_separador(self, pdf, nombre_seccion, anio):
        """Agrega una página divisora entre secciones."""
        nueva_pag = pdf.new_page(width=595, height=842)
        
        nueva_pag.draw_rect(fitz.Rect(0, 0, 595, 842), color=None, fill=(0.95, 0.97, 1.0))
        nueva_pag.draw_rect(fitz.Rect(0, 380, 595, 470), color=None, fill=(0.08, 0.18, 0.38))
        nueva_pag.draw_rect(fitz.Rect(0, 375, 595, 382), color=None, fill=(0.95, 0.68, 0.05))
        nueva_pag.draw_rect(fitz.Rect(0, 468, 595, 475), color=None, fill=(0.95, 0.68, 0.05))
        
        nueva_pag.insert_text((297, 415), "PAES DE INVIERNO", fontsize=16, color=(1, 1, 1), fontname="helv")
        nueva_pag.insert_text((297, 443), nombre_seccion.upper(), fontsize=20, color=(0.95, 0.90, 0.20), fontname="helv")
        nueva_pag.insert_text((297, 500), f"Proceso de Admisión {anio}", fontsize=14, color=(0.4, 0.4, 0.5), fontname="helv")
        nueva_pag.insert_text((297, 530), "demre.cl", fontsize=11, color=(0.6, 0.6, 0.7), fontname="helv")


# ──────────────────────────────────────────────────────
# INTERFAZ DE LÍNEA DE COMANDOS
# ──────────────────────────────────────────────────────

def menu_interactivo():
    gestor = GestorPreguntas()
    generador = GeneradorEnsayo()
    
    print(f"""
{CYAN}{BOLD}
==============================================================
         GENERADOR DE ENSAYOS PAES - MEZCLADOR               
         Proceso de Admisión 2026                            
==============================================================
{RESET}""")
    
    while True:
        print(f"\n{BOLD}¿Qué deseas hacer?{RESET}")
        print("  1. Generar nuevo ensayo mezclado")
        print("  2. Ver estado de preguntas usadas")
        print("  3. Reiniciar registro de preguntas")
        print("  4. Ver pruebas disponibles")
        print("  5. Salir")
        
        opcion = input(f"\n{CYAN}Opción:{RESET} ").strip()
        
        if opcion == "1":
            generar_ensayo_interactivo(generador)
        elif opcion == "2":
            gestor.mostrar_estado()
        elif opcion == "3":
            confirm = input(f"{AMARI}¿Seguro? Esto reinicia el registro. (s/N): {RESET}").strip().lower()
            if confirm == "s":
                gestor.reset_todo()
        elif opcion == "4":
            mostrar_catalogo()
        elif opcion == "5":
            print(f"\n{VERDE}¡Hasta luego!{RESET}")
            break
        else:
            print(f"{ROJO}Opción no válida.{RESET}")


def mostrar_catalogo():
    print(f"\n{BOLD}Pruebas disponibles:{RESET}")
    for codigo, meta in CATALOGO.items():
        ruta = PRUEBAS_DIR / meta["archivo"]
        estado = f"{VERDE}✓ Descargada{RESET}" if ruta.exists() else f"{ROJO}✗ No descargada{RESET}"
        print(f"  {CYAN}{codigo:<20}{RESET} {meta['nombre']:<40} {estado}")


def generar_ensayo_interactivo(generador):
    print(f"\n{BOLD}Configurar ensayo{RESET}")
    
    titulo = input(f"Título del ensayo [{AMARI}Ensayo Personalizado{RESET}]: ").strip()
    if not titulo:
        titulo = "Ensayo Personalizado"
    
    mostrar_catalogo()
    
    print(f"\n{BOLD}Selecciona las pruebas a incluir:{RESET}")
    print("(Ingresa los códigos separados por coma, ej: historia,m1,lectora)")
    print(f"Códigos disponibles: {', '.join(CATALOGO.keys())}")
    
    codigos_str = input(f"{CYAN}Pruebas:{RESET} ").strip()
    codigos = [c.strip() for c in codigos_str.split(",") if c.strip() in CATALOGO]
    
    if not codigos:
        print(f"{ROJO}No se seleccionaron pruebas válidas.{RESET}")
        return
    
    pruebas_config = []
    for codigo in codigos:
        n_str = input(f"  Páginas de {CATALOGO[codigo]['nombre']} [10]: ").strip()
        try:
            n = int(n_str) if n_str else 10
        except ValueError:
            n = 10
        pruebas_config.append({"id": codigo, "paginas": n})
    
    aleatorio = input(f"¿Orden aleatorio? (S/n): ").strip().lower() != "n"
    registrar = input(f"¿Marcar páginas como usadas? (S/n): ").strip().lower() != "n"
    
    configuracion = {
        "titulo": titulo,
        "pruebas": pruebas_config,
        "aleatorio": aleatorio,
        "registrar": registrar
    }
    
    generador.generar(configuracion)


# ──────────────────────────────────────────────────────
# MODO RÁPIDO (sin interacción)
# ──────────────────────────────────────────────────────
def generar_rapido(pruebas_ids, paginas_por_prueba=10, titulo="Ensayo Rápido"):
    """Genera un ensayo sin interacción del usuario."""
    generador = GeneradorEnsayo()
    
    config = {
        "titulo": titulo,
        "pruebas": [{"id": pid, "paginas": paginas_por_prueba} for pid in pruebas_ids],
        "aleatorio": True,
        "registrar": True
    }
    
    return generador.generar(config)


# ──────────────────────────────────────────────────────
# ENTRY POINT
# ──────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Mezclador de Pruebas PAES")
    parser.add_argument("--rapido", nargs="+", metavar="PRUEBA",
                        help="Genera ensayo rápido con las pruebas indicadas")
    parser.add_argument("--paginas", type=int, default=10,
                        help="Páginas por prueba en modo rápido (default: 10)")
    parser.add_argument("--titulo", type=str, default="Ensayo PAES",
                        help="Título del ensayo")
    parser.add_argument("--reset", action="store_true",
                        help="Reinicia el registro de preguntas usadas")
    
    args = parser.parse_args()
    
    if args.reset:
        GestorPreguntas().reset_todo()
    elif args.rapido:
        generar_rapido(args.rapido, args.paginas, args.titulo)
    else:
        menu_interactivo()
