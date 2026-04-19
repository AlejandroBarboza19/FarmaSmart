# backend/main.py

from fastapi import FastAPI
from app.api import auth, ventas
from app.core.database import engine
from app.models import usuario, farmacia, producto, lote, venta, detalle_venta  # importar modelos para que SQLAlchemy los registre

app = FastAPI(
    title="FarmaSmart API",
    version="1.0.0"
)

# ── Registrar routers ──────────────────────────────────────────
app.include_router(auth.router)
app.include_router(ventas.router)

# ── Health check ───────────────────────────────────────────────
@app.get("/")
def health_check():
    return {"status": "ok", "app": "FarmaSmart API"}