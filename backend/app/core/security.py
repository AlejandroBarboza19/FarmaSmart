# backend/app/core/security.py

from datetime import datetime, timezone, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings
from app.schemas.auth import TokenPayload


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