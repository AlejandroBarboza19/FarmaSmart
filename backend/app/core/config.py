# backend/app/core/config.py

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Configuración central de la aplicación.
    Lee automáticamente las variables desde el archivo .env
    Si una variable obligatoria no existe, la app falla al iniciar (comportamiento esperado).
    """

    # ── Base de datos ──────────────────────────────────────────
    DB_HOST: str                        # ej: localhost
    DB_PORT: int = 3306                 # puerto por defecto de MySQL
    DB_USER: str                        # ej: root
    DB_PASSWORD: str                    # contraseña de MySQL
    DB_NAME: str                        # ej: farmasmart

    # ── Seguridad / JWT ────────────────────────────────────────
    SECRET_KEY: str                     # clave para firmar los tokens JWT
                                        # generala con: python -c "import secrets; print(secrets.token_hex(32))"
    ALGORITHM: str = "HS256"            # algoritmo de firma del token
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 480 min = 8 horas (un turno de trabajo)

    # ── Propiedad calculada ────────────────────────────────────
    @property
    def DATABASE_URL(self) -> str:
        """
        Construye la URL de conexión para SQLAlchemy.
        Formato: mysql+pymysql://usuario:password@host:puerto/nombre_db
        pymysql es el driver que SQLAlchemy usa para conectarse a MySQL.
        """
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            f"?charset=utf8mb4"
        )

    class Config:
        env_file = ".env"               # archivo donde están las variables de entorno
        env_file_encoding = "utf-8"


# Instancia global — se importa en todos los módulos que necesiten configuración
# Ejemplo de uso: from app.core.config import settings
settings = Settings()