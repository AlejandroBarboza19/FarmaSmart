from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base

# Importar routers
from routers import medicamentos, lotes, alertas, categorias

# Importar modelos para que SQLAlchemy los registre y cree las tablas
import models  # noqa: F401

# Crear todas las tablas al iniciar (si no existen)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FarmaSmart API",
    description="API para gestión de inventario de farmacia",
    version="1.0.0"
)

# ─── CORS: permite que React (localhost:5173) llame al backend ───
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # URL de Vite en dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(medicamentos.router)
app.include_router(lotes.router)  
app.include_router(alertas.router)
app.include_router(categorias.router)

@app.get("/")
def root():
    return {"message": "Bienvenido a FarmaSmart API!"}

