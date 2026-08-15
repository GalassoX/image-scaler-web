import os

def get_env(key: str, default: str | None = None) -> str:
  env = os.getenv(key)

  if env is None:
    if default is None:
      raise RuntimeError(f"La variable de entorno {key} no está definida.")
    return default

  return env