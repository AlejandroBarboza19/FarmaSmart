# app/api/categorias.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
# ✅ PONER ESTO
from app.core.security import get_current_user
from app.models.usuario import Usuario
import app.models as models
import app.schemas as schemas

router = APIRouter(
    prefix="/categorias",
    tags=["Categorías"]
)

# GET /categorias/ — listar todas
@router.get("/", response_model=List[schemas.CategoriaOut])
def listar_categorias(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    return db.query(models.Categoria).all()

# POST /categorias/ — crear nueva
@router.post("/", response_model=schemas.CategoriaOut, status_code=201)
def crear_categoria(
    datos: schemas.CategoriaCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    existe = db.query(models.Categoria).filter(
        models.Categoria.nombre == datos.nombre
    ).first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe esa categoría")
    nueva = models.Categoria(**datos.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

# PUT /categorias/{id} — editar
@router.put("/{id}", response_model=schemas.CategoriaOut)
def editar_categoria(
    id: int,
    datos: schemas.CategoriaCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    cat = db.query(models.Categoria).filter(models.Categoria.id == id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    cat.nombre      = datos.nombre
    cat.descripcion = datos.descripcion
    db.commit()
    db.refresh(cat)
    return cat

# DELETE /categorias/{id} — eliminar
@router.delete("/{id}", status_code=204)
def eliminar_categoria(
    id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    cat = db.query(models.Categoria).filter(models.Categoria.id == id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    db.delete(cat)
    db.commit()
    return None