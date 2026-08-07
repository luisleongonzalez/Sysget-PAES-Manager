import json

# Cargar biblioteca actual y URLs extraídas
with open('biblioteca_paes.json', 'r', encoding='utf-8') as f:
    biblioteca = json.load(f)

with open('urls_paes_oficiales.json', 'r', encoding='utf-8') as f:
    urls_extraidas = json.load(f)

print(f"[Info] Biblioteca total: {len(biblioteca)} items")
print(f"[Info] URLs de Matematica extraidas: {len(urls_extraidas)} items")

# Indice de URLs por orden de aparicion en matematica
idx_url = 0
actualizados = 0

for item in biblioteca:
    if item.get("asignatura") == "matematica":
        if idx_url < len(urls_extraidas):
            url_obj = urls_extraidas[idx_url]
            item["url"] = url_obj["paginaUrl"]
            idx_url += 1
            actualizados += 1

print(f"[OK] Se actualizaron {actualizados} materiales de Matematica con su enlace directo del visor UA.")

with open('biblioteca_paes.json', 'w', encoding='utf-8') as f:
    json.dump(biblioteca, f, indent=2, ensure_ascii=False)

print("[Exito] Archivo biblioteca_paes.json guardado.")
