# backend/app/api/auth.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth_service import login
from app.schemas.auth import RegistroRequest
from app.services.auth_service import registrar_farmacia
# ── Router ─────────────────────────────────────────────────────
# Agrupa todos los endpoints de autenticación bajo el prefijo /auth
router = APIRouter(prefix="/auth", tags=["Autenticación"])


# ── POST /auth/login ───────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
def endpoint_login(
    datos: LoginRequest,
    db:    Session = Depends(get_db)
):
    """
    Recibe email y password, devuelve un token JWT si las credenciales son válidas.

    Body esperado:
        { "email": "admin@farmademo.com", "password": "miPassword123" }

    Respuesta exitosa:
        { "access_token": "eyJ...", "token_type": "bearer" }
    """
    return login(datos, db)

@router.post("/registro", status_code=201)
def endpoint_registro(
    datos: RegistroRequest,
    db:    Session = Depends(get_db)
):
    return registrar_farmacia(datos, db)