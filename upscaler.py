import os
import threading
import environ

import numpy as np
import torch
from basicsr.archs.rrdbnet_arch import RRDBNet
from PIL import Image
from realesrgan import RealESRGANer


MODEL_URL = environ.get_env("MODEL_PTH_URL")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "weights")
MODEL_PATH = os.path.join(MODEL_DIR, "RealESRGAN_x4plus.pth")


class ImageUpscaler:
  """
  Envuelve Real-ESRGAN para cargarlo una sola vez y reutilizarlo
  en cada request. Pensado para correr en CPU (plan gratuito de Render).
  """

  def __init__(self):
    self._model = None
    self._lock = threading.Lock()

  def is_loaded(self) -> bool:
    return self._model is not None

  def load_model(self):
    if self._model is not None:
      return

    os.makedirs(MODEL_DIR, exist_ok=True)
    if not os.path.exists(MODEL_PATH):
      self._download_weights()

    # Arquitectura usada por RealESRGAN_x4plus
    arch = RRDBNet(
      num_in_ch=3,
      num_out_ch=3,
      num_feat=64,
      num_block=23,
      num_grow_ch=32,
      scale=4,
    )

    self._model = RealESRGANer(
      scale=4,
      model_path=MODEL_PATH,
      model=arch,
      tile=256,  # procesa por partes para no saturar la memoria en CPU
      tile_pad=10,
      pre_pad=0,
      half=False,  # half precision requiere GPU; en CPU debe ir en False
      device=torch.device("cpu"),
    )

  def _download_weights(self):
    import urllib.request

    urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)

  def upscale(self, image: Image.Image, scale: int = 4) -> Image.Image:
    if self._model is None:
      raise RuntimeError("El modelo no está cargado. Llama a load_model() primero.")

    with self._lock:  # evita que dos requests procesen a la vez en CPU
      img_array = np.array(image)
      # El modelo base está entrenado para x4; si piden x2, hacemos x4 y reescalamos
      output, _ = self._model.enhance(img_array, outscale=scale)

    return Image.fromarray(output)