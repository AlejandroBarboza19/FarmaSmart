from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
import shutil
import uuid
import os

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin  # Importamos ambos
from app.schemas.perfil import (
    ActualizarPerfilRequest, CambiarPasswordRequest,
    ActualizarFarmaciaRequest, PerfilResponse, FarmaciaResponse
)
from app.models.usuario import Usuario
from app.models.farmacia import Farmacia
from passlib.context import CryptContext

router = APIRouter(prefix="/perfil", tags=["Perfil"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── SECCIÓN: PERFIL PERSONAL (Accesible por cualquier usuario/empleado) ──

@router.get("/me", response_model=PerfilResponse)
def obtener_perfil(usuario: Usuario = Depends(get_current_user)):
    """Retorna la información del usuario autenticado."""
    return usuario

@router.put("/me", response_model=PerfilResponse)
def actualizar_perfil(
    datos: ActualizarPerfilRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """Actualiza nombre y email del usuario actual."""
    usuario.nombre = datos.nombre
    usuario.email = datos.email
    db.commit()
    db.refresh(usuario)
    return usuario

@router.put("/me/password")
def cambiar_password(
    datos: CambiarPasswordRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """Cambia la contraseña validando la actual."""
    if not pwd_context.verify(datos.password_actual, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Contraseña actual incorrecta"
        )
    usuario.password_hash = pwd_context.hash(datos.password_nueva)
    db.commit()
    return {"detail": "Contraseña actualizada correctamente"}

@router.post("/me/foto")
def subir_foto(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """Sube y actualiza la foto de perfil del usuario."""
    ext = file.filename.split(".")[-1]
    nombre_archivo = f"{uuid.uuid4()}.{ext}"
    ruta_carpeta = "static/fotos"
    ruta_completa = os.path.join(ruta_carpeta, nombre_archivo)
    
    os.makedirs(ruta_carpeta, exist_ok=True)
    
    with open(ruta_completa, "wb") as f:
        shutil.copyfileobj(file.file, f)
        
    usuario.foto_url = f"/{ruta_completa}"
    db.commit()
    return {"foto_url": usuario.foto_url}


# ── SECCIÓN: CONFIGURACIÓN DE FARMACIA (SOLO ADMINISTRADORES) ──

@router.get("/farmacia", response_model=FarmaciaResponse)
def obtener_farmacia(
    db: Session = Depends(get_db),
    # Si el usuario no es ADMIN, get_current_admin lanza 403 automáticamente
    admin: Usuario = Depends(get_current_admin)
):
    """Obtiene los datos de la farmacia vinculada al administrador."""
    farmacia = db.query(Farmacia).filter(Farmacia.id == admin.farmacia_id).first()
    if not farmacia:
        raise HTTPException(status_code=404, detail="Farmacia no encontrada")
    return farmacia

@router.put("/farmacia", response_model=FarmaciaResponse)
def actualizar_farmacia(
    datos: ActualizarFarmaciaRequest,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_current_admin)
):
    """Actualiza la configuración global de la farmacia."""
    farmacia = db.query(Farmacia).filter(Farmacia.id == admin.farmacia_id).first()
    if not farmacia:
        raise HTTPException(status_code=404, detail="Farmacia no encontrada")
    
    # Actualización dinámica de campos
    farmacia.nombre = datos.nombre
    farmacia.direccion = datos.direccion
    farmacia.telefono = datos.telefono
    farmacia.iva = datos.iva
    
    db.commit()
    db.refresh(farmacia)
    return farmacia 