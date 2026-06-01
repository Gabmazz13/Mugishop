Instrucciones para subir el proyecto a GitHub (repo remoto: https://github.com/Gabmazz13/Mugishop)

Requisitos: Git instalado y configurado en tu PC. Opcional: GitHub CLI (`gh`) si querés crear el repo desde la línea.

1) Abrí PowerShell y ubicáte en la carpeta del proyecto:

```powershell
cd 'C:\Users\gabma\Documents\Mugi'
```

2) Inicializar repo local (si no lo hiciste) y hacer commit inicial:

```powershell
git init
git add .
git commit -m "Initial commit: template + webapp + scripts"
```

3) Agregar el remoto (usa la URL que compartiste) y pushear a `main`:

```powershell
git remote add origin https://github.com/Gabmazz13/Mugishop.git
git branch -M main
git push -u origin main
```

4) (Opcional) Si preferís crear el repo remoto desde la CLI y pushear en un solo paso (requiere `gh` y estar autenticado):

```powershell
# crea repo público y sube la carpeta actual
gh repo create Gabmazz13/Mugishop --public --source=. --remote=origin --push
```

5) Si no querés exponer archivos como el `.xlsx`, ya agregué `.gitignore` para excluir `*.xlsx`, `.venv/`, `node_modules/`, `.env`.

Problemas comunes y soluciones
- "git no reconocido": instalá Git desde https://git-scm.com/downloads y volvé a ejecutar los pasos.
- Permiso denegado al pushear: asegurate de estar logueado en GitHub y que la URL remota corresponde a tu cuenta (HTTPS te pedirá credenciales o token personal).

Si querés, puedo:
- generar automáticamente un ZIP listo para subir y marcar el commit manualmente, o
- preparar un `README` final y etiquetas, o
- guiarte en vivo paso a paso por la terminal (decime si preferís que te pase los comandos uno por uno).