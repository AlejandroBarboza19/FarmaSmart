# backend/main.py  — agrega la línea marcada con ★
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, ventas, productos, empleados   # ★ importar empleados
from app.models import usuario, farmacia, producto, lote, venta, detalle_venta
from app.api import perfil

app = FastAPI(title="FarmaSmart API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(ventas.router)
app.include_router(productos.router)
app.include_router(empleados.router)   # ★ registrar router
app.include_router(perfil.router, prefix="/api")

@app.get("/")
def health_check():
    return {"status": "ok", "app": "FarmaSmart API"}

