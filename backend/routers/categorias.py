from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas

router = APIRouter(
    prefix="/categorias",
    tags=["Categorías"]
)

# GET /categorias/ — listar todas
@router.get("/", response_model=List[schemas.CategoriaOut])
def listar_categorias(db: Session = Depends(get_db)):
    return db.query(models.Categoria).all()

# POST /categorias/ — crear nueva
@router.post("/", response_model=schemas.CategoriaOut, status_code=201)
def crear_categoria(datos: schemas.CategoriaCreate, db: Session = Depends(get_db)):
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
def editar_categoria(id: int, datos: schemas.CategoriaCreate, db: Session = Depends(get_db)):
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
def eliminar_categoria(id: int, db: Session = Depends(get_db)):
    cat = db.query(models.Categoria).filter(models.Categoria.id == id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    db.delete(cat)
    db.commit()
    return None