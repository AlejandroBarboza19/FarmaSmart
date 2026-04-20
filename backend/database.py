from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLite: crea el archivo farmasmart.db en la carpeta backend/
SQLALCHEMY_DATABASE_URL = "sqlite:///./farmasmart.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # Esto es OBLIGATORIO en SQLite para evitar errores con múltiples hilos
    connect_args={"check_same_thread": False}
)

# Fábrica de sesiones (cada request abre y cierra una sesión)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base de la que heredarán todos los modelos
Base = declarative_base()

# Dependencia para inyectar la sesión en cada endpoint
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()