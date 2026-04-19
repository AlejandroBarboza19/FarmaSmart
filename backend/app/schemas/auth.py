# backend/app/schemas/auth.py

from pydantic import BaseModel, EmailStr
from app.models.usuario import RolUsuario


# ── Lo que ENTRA al endpoint POST /auth/login ──────────────────
class LoginRequest(BaseModel):
    email:    EmailStr  # pydantic valida que sea un email válido
    password: str


# ── Lo que SALE del endpoint POST /auth/login ──────────────────
class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"  # estándar OAuth2


# ── Datos del usuario que viajan DENTRO del JWT ────────────────
# Esto es el payload — lo que puedes leer cuando decodificas el token.
# No pongas información sensible aquí (no password, no datos bancarios).
class TokenPayload(BaseModel):
    sub:         int  # user_id  (sub = subject, nombre estándar en JWT)
    farmacia_id: int
    rol:         RolUsuario
    exp:         int  # expiración en unix timestamp (lo agrega python-jose)


# ── Datos del usuario autenticado para usar en los endpoints ───
# Cuando un endpoint recibe un request con token válido,
# este es el objeto que obtiene con Depends(get_current_user).
class UsuarioActual(BaseModel):
    id:          int
    farmacia_id: int
    nombre:      str
    email:       str
    rol:         RolUsuario

    class Config:
        from_attributes = True  # permite crear este schema desde un modelo SQLAlchemy
        
# Schema para registrar una farmacia nueva + su usuario ADMIN
class RegistroRequest(BaseModel):
    # datos de la farmacia
    farmacia_nombre:        str
    farmacia_identificador: str  # slug único ej: "farmacia-san-jose"

    # datos del usuario ADMIN
    nombre:   str
    email:    EmailStr
    password: str