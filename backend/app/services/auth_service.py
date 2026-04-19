# backend/app/services/auth_service.py

from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError

from app.models.usuario import Usuario, RolUsuario
from app.models.farmacia import Farmacia
from app.schemas.auth import LoginRequest, UsuarioActual, RegistroRequest
from app.core.security import verify_password, crear_token, verificar_token, hash_password

from app.core.database import get_db


# ── Registro ───────────────────────────────────────────────────

def registrar_farmacia(datos: RegistroRequest, db: Session) -> dict:
    """
    Crea una farmacia nueva y su usuario ADMIN en una sola transacción.
    Si algo falla, el rollback revierte ambas inserciones.
    """
    # Verificar que el identificador no esté en uso
    existe = db.query(Farmacia).filter(
        Farmacia.identificador == datos.farmacia_identificador
    ).first()

    if existe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Identificador de farmacia ya en uso"
        )

    try:
        # Crear farmacia
        farmacia = Farmacia(
            nombre=datos.farmacia_nombre,
            identificador=datos.farmacia_identificador
        )
        db.add(farmacia)
        db.flush()  # genera farmacia.id sin hacer commit todavía

        # Crear usuario ADMIN asociado a esa farmacia
        admin = Usuario(
            farmacia_id=farmacia.id,
            nombre=datos.nombre,
            email=datos.email,
            password_hash=hash_password(datos.password),
            rol=RolUsuario.ADMIN
        )
        db.add(admin)
        db.commit()
        db.refresh(farmacia)
        db.refresh(admin)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al registrar la farmacia"
        )

    return {"mensaje": "Farmacia registrada exitosamente"}


# ── Login ──────────────────────────────────────────────────────

def login(datos: LoginRequest, db: Session) -> dict:
    """
    Valida las credenciales del usuario y devuelve un token JWT.

    Siempre devuelve el mismo mensaje de error si algo falla —
    no le decimos al cliente si el email no existe o si la
    contraseña es incorrecta (evita enumeración de usuarios).
    """
    # Buscar usuario por email
    usuario = db.query(Usuario).filter(
        Usuario.email == datos.email
    ).first()

    # Verificar existencia, estado activo y contraseña en un solo bloque
    if not usuario or not usuario.activo or not verify_password(datos.password, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Generar token con los datos necesarios para el multi-tenant
    token = crear_token(
        user_id=usuario.id,
        farmacia_id=usuario.farmacia_id,
        rol=usuario.rol.value
    )

    return {
        "access_token": token,
        "token_type":   "bearer"
    }


# ── Dependencia get_current_user ───────────────────────────────

# Le dice a FastAPI que el token viene en el header Authorization: Bearer <token>


bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db:          Session = Depends(get_db)
) -> UsuarioActual:

    credenciales_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado",
        headers={"WWW-Authenticate": "Bearer"}
    )

    try:
        payload = verificar_token(credentials.credentials)
    except JWTError:
        raise credenciales_error

    usuario = db.query(Usuario).filter(
        Usuario.id == payload.sub
    ).first()

    if not usuario or not usuario.activo:
        raise credenciales_error

    return UsuarioActual(
        id=          usuario.id,
        farmacia_id= usuario.farmacia_id,
        nombre=      usuario.nombre,
        email=       usuario.email,
        rol=         usuario.rol
    )

# ── Dependencia solo_admin ─────────────────────────────────────

def solo_admin(usuario: UsuarioActual = Depends(get_current_user)) -> UsuarioActual:
    """
    Bloquea el acceso si el usuario no es ADMIN.

    Uso:
        @router.get("/ruta-solo-admin")
        def mi_endpoint(usuario: UsuarioActual = Depends(solo_admin)):
            ...
    """
    if usuario.rol != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso restringido a administradores"
        )
    return usuario