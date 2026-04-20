from pydantic import BaseModel, EmailStr
from typing import Optional

class ActualizarPerfilRequest(BaseModel):
    nombre: str
    email: EmailStr

class CambiarPasswordRequest(BaseModel):
    password_actual: str
    password_nueva: str

class ActualizarFarmaciaRequest(BaseModel):
    nombre: str
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    iva: float = 0.19

class PerfilResponse(BaseModel):
    id: int
    nombre: str
    email: str
    rol: str
    foto_url: Optional[str] = None
    farmacia_nombre: Optional[str] = None

    class Config:
        from_attributes = True

class FarmaciaResponse(BaseModel):
    id: int
    nombre: str
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    iva: float

    class Config:
        from_attributes = True