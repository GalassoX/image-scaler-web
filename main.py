import sys
from torchvision.transforms import functional
sys.modules["torchvision.transforms.functional_tensor"] = functional

import io
import logging

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from PIL import Image

from upscaler import ImageUpscaler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("upscale-api")

MAX_FILE_SIZE_MB = 10
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}

app = FastAPI(title="Image Upscaler API")

# En producción, reemplaza "*" por el dominio real de tu frontend en Vercel
app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_methods=["POST", "GET"],
  allow_headers=["*"],
)

# El modelo se carga UNA sola vez al iniciar el servidor, no en cada request.
# Esto es clave para no matar el rendimiento en el plan gratuito de Render.
upscaler = ImageUpscaler()


@app.on_event("startup")
async def startup_event():
  logger.info("Cargando modelo Real-ESRGAN...")
  upscaler.load_model()
  logger.info("Modelo cargado y listo.")


@app.get("/")
async def health_check():
  return {"status": "ok", "model_loaded": upscaler.is_loaded()}


@app.post("/upscale")
async def upscale_image(file: UploadFile = File(...), scale: int = 4):
  if file.content_type not in ALLOWED_CONTENT_TYPES:
    raise HTTPException(
      status_code=400,
      detail=f"Tipo de archivo no permitido. Usa: {', '.join(ALLOWED_CONTENT_TYPES)}",
    )

  if scale not in (2, 4):
    raise HTTPException(status_code=400, detail="El parámetro 'scale' debe ser 2 o 4.")

  contents = await file.read()
  if len(contents) > MAX_FILE_SIZE_BYTES:
    raise HTTPException(
      status_code=413,
      detail=f"El archivo supera el límite de {MAX_FILE_SIZE_MB}MB.",
    )

  try:
    input_image = Image.open(io.BytesIO(contents)).convert("RGB")
  except Exception:
    raise HTTPException(status_code=400, detail="No se pudo leer la imagen enviada.")

  try:
    output_image = upscaler.upscale(input_image, scale=scale)
  except Exception as exc:
    logger.exception("Error durante el upscaling")
    raise HTTPException(status_code=500, detail="Error procesando la imagen.") from exc

  buffer = io.BytesIO()
  output_image.save(buffer, format="PNG")
  buffer.seek(0)

  return StreamingResponse(
    buffer,
    media_type="image/png",
    headers={"Content-Disposition": "inline; filename=upscaled.png"},
  )