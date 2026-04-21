# app/api/medicamentos.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List
from datetime import date, timedelta

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.usuario import Usuario
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/medicamentos", tags=["Medicamentos"])

DIAS_ALERTA_VENCIMIENTO = 20


@router.get("/", response_model=List[schemas.ProductoOut])
def listar_medicamentos(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    return (
        db.query(models.Producto)
        .filter(
            models.Producto.activo == True,
            models.Producto.farmacia_id == usuario.farmacia_id,
        )
        .offset(skip).limit(limit).all()
    )


@router.get("/buscar", response_model=List[schemas.ProductoOut])
def buscar_medicamentos(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    return (
        db.query(models.Producto)
        .filter(
            models.Producto.activo == True,
            models.Producto.farmacia_id == usuario.farmacia_id,
            or_(
                models.Producto.nombre_comercial.ilike(f"%{q}%"),
                models.Producto.nombre_generico.ilike(f"%{q}%"),
                models.Producto.codigo_ean.ilike(f"%{q}%"),
            )
        )
        .all()
    )


@router.get("/{id}", response_model=schemas.ProductoOut)
def obtener_medicamento(
    id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    producto = db.query(models.Producto).filter(
        models.Producto.id == id,
        models.Producto.activo == True,
        models.Producto.farmacia_id == usuario.farmacia_id,
    ).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Medicamento no encontrado")
    return producto


@router.post("/", response_model=schemas.ProductoOut, status_code=201)
def crear_medicamento(
    datos: schemas.ProductoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    # Verificar EAN único dentro de la farmacia
    existe = db.query(models.Producto).filter(
        models.Producto.codigo_ean == datos.codigo_ean,
        models.Producto.farmacia_id == usuario.farmacia_id,
    ).first()
    if existe:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe un medicamento con el código EAN {datos.codigo_ean}"
        )

    # Extraer datos del lote antes de crear el producto
    lote_data = datos.primer_lote
    producto_data = datos.model_dump(exclude={"primer_lote"})

    # Crear producto con stock_actual = cantidad del lote
    nuevo = models.Producto(
        **producto_data,
        farmacia_id=usuario.farmacia_id,
        stock_actual=lote_data.cantidad_recibida,
    )
    db.add(nuevo)
    db.flush()  # obtener id sin commit

    # Crear primer lote asociado
    primer_lote = models.Lote(
        producto_id=nuevo.id,
        numero_lote=lote_data.numero_lote,
        fecha_vencimiento=lote_data.fecha_vencimiento,
        fecha_ingreso=lote_data.fecha_ingreso,
        cantidad_recibida=lote_data.cantidad_recibida,
        cantidad_disponible=lote_data.cantidad_disponible,
        precio_compra=lote_data.precio_compra,
    )
    db.add(primer_lote)

    # Generar alerta si vence pronto
    hoy = date.today()
    dias_para_vencer = (lote_data.fecha_vencimiento - hoy).days
    if dias_para_vencer <= DIAS_ALERTA_VENCIMIENTO:
        nivel = "critico" if dias_para_vencer <= 7 else "atencion"
        alerta = models.Alerta(
            farmacia_id=usuario.farmacia_id,
            producto_id=nuevo.id,
            tipo="proximo_vencer",
            nivel=nivel,
            mensaje=f"{nuevo.nombre_comercial} — lote {lote_data.numero_lote} vence en {dias_para_vencer} día(s)",
        )
        db.add(alerta)

    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id}", response_model=schemas.ProductoOut)
def actualizar_medicamento(
    id: int,
    datos: schemas.ProductoUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    producto = db.query(models.Producto).filter(
        models.Producto.id == id,
        models.Producto.activo == True,
        models.Producto.farmacia_id == usuario.farmacia_id,
    ).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Medicamento no encontrado")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(producto, campo, valor)

    db.commit()
    db.refresh(producto)
    return producto


@router.delete("/{id}", status_code=204)
def eliminar_medicamento(
    id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    producto = db.query(models.Producto).filter(
        models.Producto.id == id,
        models.Producto.activo == True,
        models.Producto.farmacia_id == usuario.farmacia_id,
    ).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Medicamento no encontrado")

    producto.activo = False
    db.commit()
    return None
