from pathlib import Path
base = Path("G:/Mi unidad/PAES_MANAGER_BIBLIOTECA")
total = 0
for d in sorted(base.iterdir()):
    if d.is_dir():
        count = len(list(d.rglob("*.*")))
        total += count
        print(f"  {d.name}: {count} archivos")
print(f"\nTOTAL EN GOOGLE DRIVE: {total} archivos")
