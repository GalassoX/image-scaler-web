# Nítida — Frontend

Interfaz en React + Vite para subir imágenes, procesarlas contra el backend
de upscaling y compararlas con un slider antes/después.

## Correr en local

```bash
npm install
cp .env.example .env   # y ajusta VITE_API_URL si tu backend corre en otro puerto
npm run dev
```

Se abre en `http://localhost:5173`.

## Desplegar en Vercel

1. Sube esta carpeta a un repo de GitHub (puede ser el mismo repo del backend,
   en una subcarpeta `frontend/`, o uno aparte).
2. En Vercel: **Add New** → **Project** → conecta el repo.
   - Si el frontend está en una subcarpeta, indica esa carpeta como **Root Directory**.
3. Vercel detecta Vite automáticamente. Framework Preset: **Vite**.
4. En **Environment Variables**, agrega:
   - `VITE_API_URL` = la URL de tu backend en Render (ej. `https://tu-servicio.onrender.com`)
5. Deploy.

## Notas

- El slider antes/después usa `ResizeObserver` para recortar la imagen
  "original" con el ancho real del contenedor, así que funciona bien en
  cualquier tamaño de pantalla.
- Límite de archivo en el frontend: 10MB, igual que el backend.
- Cuando actualices `VITE_API_URL` en Vercel, necesitas re-desplegar para
  que tome el nuevo valor (las env vars de Vite se inyectan en build time).