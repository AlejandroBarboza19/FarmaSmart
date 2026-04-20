from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from database import get_db
import models, schemas

router = APIRouter(
    prefix="/medicamentos",
    tags=["Medicamentos"]
)

# ─── GET /medicamentos/ ───────────────────────────────────
# Lista todos los medicamentos activos
@router.get("/", response_model=List[schemas.ProductoOut])
def listar_medicamentos(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    productos = (
        db.query(models.Producto)
        .filter(models.Producto.activo == True)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return productos


# ─── GET /medicamentos/buscar ─────────────────────────────
# Búsqueda en tiempo real por nombre o código EAN
# IMPORTANTE: debe ir ANTES de /{id} para que no haya conflicto
@router.get("/buscar", response_model=List[schemas.ProductoOut])
def buscar_medicamentos(
    q: str = Query(..., min_length=1, description="Texto a buscar"),
    db: Session = Depends(get_db)
):
    resultados = (
        db.query(models.Producto)
        .filter(
            models.Producto.activo == True,
            or_(
                models.Producto.nombre_comercial.ilike(f"%{q}%"),
                models.Producto.nombre_generico.ilike(f"%{q}%"),
                models.Producto.codigo_ean.ilike(f"%{q}%"),
            )
        )
        .all()
    )
    return resultados


# ─── GET /medicamentos/{id} ───────────────────────────────
# Detalle de un medicamento con sus lotes
@router.get("/{id}", response_model=schemas.ProductoOut)
def obtener_medicamento(id: int, db: Session = Depends(get_db)):
    producto = (
        db.query(models.Producto)
        .filter(models.Producto.id == id, models.Producto.activo == True)
        .first()
    )
    if not producto:
        raise HTTPException(status_code=404, detail="Medicamento no encontrado")
    return producto


# ─── POST /medicamentos/ ──────────────────────────────────
# Crear nuevo medicamento
@router.post("/", response_model=schemas.ProductoOut, status_code=201)
def crear_medicamento(
    datos: schemas.ProductoCreate,
    db: Session = Depends(get_db)
):
    # Verificar que el código EAN no exista ya
    existe = db.query(models.Producto).filter(
        models.Producto.codigo_ean == datos.codigo_ean
    ).first()
    if existe:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe un medicamento con el código EAN {datos.codigo_ean}"
        )

    nuevo = models.Producto(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


# ─── PUT /medicamentos/{id} ───────────────────────────────
# Actualizar medicamento (solo los campos enviados)
@router.put("/{id}", response_model=schemas.ProductoOut)
def actualizar_medicamento(
    id: int,
    datos: schemas.ProductoUpdate,
    db: Session = Depends(get_db)
):
    producto = db.query(models.Producto).filter(
        models.Producto.id == id,
        models.Producto.activo == True
    ).first()

    if not producto:
        raise HTTPException(status_code=404, detail="Medicamento no encontrado")

    # Solo actualiza los campos que llegaron (exclude_unset ignora los None)
    cambios = datos.model_dump(exclude_unset=True)
    for campo, valor in cambios.items():
        setattr(producto, campo, valor)

    db.commit()
    db.refresh(producto)
    return producto


# ─── DELETE /medicamentos/{id} ────────────────────────────
# Soft delete: no borra, solo desactiva
@router.delete("/{id}", status_code=204)
def eliminar_medicamento(id: int, db: Session = Depends(get_db)):
    producto = db.query(models.Producto).filter(
        models.Producto.id == id,
        models.Producto.activo == True
    ).first()

    if not producto:
        raise HTTPException(status_code=404, detail="Medicamento no encontrado")

    # Soft delete: activo = False en lugar de borrar el registro
    producto.activo = False
    db.commit()
    return None