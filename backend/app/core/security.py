# backend/app/core/security.py

from datetime import datetime, timezone, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings
from app.schemas.auth import TokenPayload

# ── Configuración de JWT ───────────────────────────────────────
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.usuario import Usuario
from jose import JWTError


# ── Configuración de bcrypt ────────────────────────────────────
# CryptContext maneja el hashing de contraseñas.
# schemes=["bcrypt"] indica que usamos bcrypt como algoritmo.
# deprecated="auto" migra automáticamente hashes viejos si cambias algoritmo.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Funciones de contraseña ────────────────────────────────────

def hash_password(password: str) -> str:
    """
    Convierte una contraseña en texto plano a un hash bcrypt.
    Ejemplo: "miPassword123" → "$2b$12$xxx..."
    Úsala al crear o actualizar usuarios.
    """
    return pwd_context.hash(password)


def verify_password(password_plano: str, password_hash: str) -> bool:
    """
    Compara una contraseña en texto plano con su hash almacenado.
    Devuelve True si coinciden, False si no.
    Nunca compares contraseñas directamente con ==.
    """
    return pwd_context.verify(password_plano, password_hash)


# ── Funciones de JWT ───────────────────────────────────────────

def crear_token(user_id: int, farmacia_id: int, rol: str) -> str:
    """
    Genera un token JWT firmado con los datos del usuario.
    El token expira según ACCESS_TOKEN_EXPIRE_MINUTES del .env.

    El payload contiene:
      sub         → user_id
      farmacia_id → para el aislamiento multi-tenant
      rol         → para control de acceso por rol
      exp         → timestamp de expiración (lo agrega jwt.encode)
    """
    expiracion = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub":         str(user_id),
        "farmacia_id": farmacia_id,
        "rol":         rol,
        "exp":         expiracion
    }

    token = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return token


def verificar_token(token: str) -> TokenPayload:
    """
    Decodifica y valida un token JWT.
    Lanza JWTError si:
      - El token está mal formado
      - La firma no coincide con SECRET_KEY
      - El token ya expiró

    Devuelve un TokenPayload con los datos del usuario si todo está bien.
    """
    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM]
    )

    return TokenPayload(
        sub=int(payload["sub"]),
        farmacia_id=payload["farmacia_id"],
        rol=payload["rol"],
        exp=payload["exp"]
    )
    


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Usuario:
    """
    Obtiene el usuario autenticado a partir del token JWT.
    """
    try:
        payload = verificar_token(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    usuario = db.query(Usuario).filter(Usuario.id == payload.sub).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    return usuario

def get_current_admin(user: Usuario = Depends(get_current_user)) -> Usuario:
    """
    Verifica que el usuario autenticado sea ADMIN.
    """
    if user.rol != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores"
        )
    return user