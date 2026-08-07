import json
import re

# Cargar biblioteca_paes.json
with open('biblioteca_paes.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

modificados = 0

for item in data:
    # 1. Limpiar ID
    if item.get("id", "").startswith("ua-"):
        item["id"] = item["id"].replace("ua-", "paes-")
        modificados += 1

    # 2. Limpiar Título
    titulo = item.get("titulo", "")
    nuevo_titulo = titulo.replace("UAutónoma", "PAES Manager").replace("UAutonoma", "PAES Manager").replace(" UA", " PAES")
    if nuevo_titulo != titulo:
        item["titulo"] = nuevo_titulo
        modificados += 1

    # 3. Limpiar Descripción
    desc = item.get("descripcion", "")
    nueva_desc = desc
    nueva_desc = re.sub(r'extraído del portal UA\.?', 'oficial de estudio PAES.', nueva_desc, flags=re.IGNORECASE)
    nueva_desc = re.sub(r'extraído de la UA\.?', 'oficial de estudio PAES.', nueva_desc, flags=re.IGNORECASE)
    nueva_desc = re.sub(r'extraído del portal UA', 'oficial de estudio PAES', nueva_desc, flags=re.IGNORECASE)
    nueva_desc = re.sub(r'Video clase oficial UAutónoma PAES', 'Clase explicativa oficial PAES', nueva_desc, flags=re.IGNORECASE)
    nueva_desc = re.sub(r'Video clase oficial UAutonoma PAES', 'Clase explicativa oficial PAES', nueva_desc, flags=re.IGNORECASE)
    nueva_desc = re.sub(r'UAutónoma', 'PAES Manager', nueva_desc, flags=re.IGNORECASE)
    nueva_desc = re.sub(r'UAutonoma', 'PAES Manager', nueva_desc, flags=re.IGNORECASE)
    
    if nueva_desc != desc:
        item["descripcion"] = nueva_desc
        modificados += 1

print(f"[OK] Se aplicó el sello propio PAES Manager en {modificados} atributos de materiales.")

with open('biblioteca_paes.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("[Éxito] biblioteca_paes.json rebranded a PAES Manager.")
