import json

# Cargar catálogo de biblioteca
with open('biblioteca_paes.json', 'r', encoding='utf-8') as f:
    biblioteca = json.load(f)

# Cargar los 4 JSONs extraídos
mat_urls = json.load(open('urls_paes_oficiales.json', encoding='utf-8'))
len_urls = json.load(open('urls_paes_oficiales (1).json', encoding='utf-8'))
his_urls = json.load(open('urls_paes_oficiales (2).json', encoding='utf-8'))
cie_urls = json.load(open('urls_paes_oficiales (3).json', encoding='utf-8'))

print(f"[Info] Catálogo total: {len(biblioteca)} ítems")
print(f"[Info] Enlaces cargados -> Mat: {len(mat_urls)}, Leng: {len(len_urls)}, Hist: {len(his_urls)}, Cien: {len(cie_urls)}")

# Punteros para cada asignatura
idx_mat = 0
idx_len = 0
idx_his = 0
idx_cie = 0

con_url = 0

for item in biblioteca:
    asig = item.get("asignatura", "").lower()
    
    if asig == "matematica":
        if idx_mat < len(mat_urls):
            item["url"] = mat_urls[idx_mat]["paginaUrl"]
            idx_mat += 1
            con_url += 1
    elif asig == "lenguaje":
        if idx_len < len(len_urls):
            item["url"] = len_urls[idx_len]["paginaUrl"]
            idx_len += 1
            con_url += 1
    elif asig == "historia":
        if idx_his < len(his_urls):
            item["url"] = his_urls[idx_his]["paginaUrl"]
            idx_his += 1
            con_url += 1
    elif asig in ["biologia", "fisica", "quimica", "tp"]:
        if idx_cie < len(cie_urls):
            item["url"] = cie_urls[idx_cie]["paginaUrl"]
            idx_cie += 1
            con_url += 1

print(f"[OK] Se vincularon enlaces directos a {con_url} de {len(biblioteca)} materiales.")

# Guardar biblioteca actualizada
with open('biblioteca_paes.json', 'w', encoding='utf-8') as f:
    json.dump(biblioteca, f, indent=2, ensure_ascii=False)

print("[Éxito] biblioteca_paes.json actualizado al 100%.")
