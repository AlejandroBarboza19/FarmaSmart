# backend/app/core/database.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

# ── Motor de conexión ──────────────────────────────────────────
# create_engine crea el pool de conexiones a MySQL.
# pool_pre_ping=True verifica que la conexión esté viva antes de usarla,
# evita errores si MySQL cerró la conexión por inactividad.
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True
)

# ── Fábrica de sesiones ────────────────────────────────────────
# Cada request HTTP abre una sesión, hace su trabajo y la cierra.
# autocommit=False → los cambios no se guardan hasta que llames session.commit()
# autoflush=False  → SQLAlchemy no envía SQL a la BD antes del commit
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False
)

# ── Clase base para los modelos ────────────────────────────────
# Todos los modelos (Usuario, Producto, etc.) heredan de Base.
# SQLAlchemy la usa para saber qué tablas existen.
class Base(DeclarativeBase):
    pass

# ── Dependencia para FastAPI ───────────────────────────────────
# Esta función se inyecta en cada endpoint con Depends(get_db).
# Abre una sesión, la entrega al endpoint, y la cierra al terminar
# sin importar si hubo error o no (eso hace el finally).
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()