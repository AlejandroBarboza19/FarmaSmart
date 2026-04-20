from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models.usuario import RolUsuario


class EmpleadoCreate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6)
    rol: RolUsuario = RolUsuario.EMPLEADO


class EmpleadoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=120)
    email: Optional[EmailStr] = None
    rol: Optional[RolUsuario] = None
    activo: Optional[bool] = None


class CambiarPasswordRequest(BaseModel):
    nueva_password: str = Field(..., min_length=6)


class EmpleadoResponse(BaseModel):
    id: int
    nombre: str
    email: str
    rol: RolUsuario
    activo: bool
    created_at: datetime

    class Config:
        from_attributes = True