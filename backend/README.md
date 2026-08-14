# Image Upscaler API

Backend en FastAPI que usa Real-ESRGAN para mejorar la resolución de imágenes.

## Variables de entorno
* **MODEL_PTH_URL**: URL donde esta alojado el modelo a usar (Referencia: https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth)

## Correr en local

```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

La API queda disponible en `http://localhost:8000`.
Docs automáticas (Swagger) en `http://localhost:8000/docs`.

La primera vez que arranca descarga el modelo (~65MB) en la carpeta `weights/`.
Después de eso, ya lo reutiliza.

## Probar el endpoint

```bash
curl -X POST "http://localhost:8000/upscale?scale=4" \
  -F "file=@tu_imagen.jpg" \
  --output resultado.png
```

## Desplegar en Render

1. Sube esta carpeta a un repo de GitHub.
2. En Render: **New +** → **Web Service** → conecta el repo.
3. Configuración:
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free (ten en cuenta el cold start y que las requests
     tardan más en CPU, como hablamos antes)
4. Una vez desplegado, tu URL será algo como
   `https://tu-servicio.onrender.com`. Esa es la URL que usará el frontend.

## Notas

- El endpoint acepta `scale=2` o `scale=4` como query param.
- Límite de subida: 10MB (ajustable en `main.py` con `MAX_FILE_SIZE_MB`).
- CORS está abierto a `*` por simplicidad; cuando tengas el dominio final
  del frontend en Vercel, restringe `allow_origins` a ese dominio.