# app/api/lotes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta

from app.core.database import get_db
# ✅ PONER ESTO
from app.core.security import get_current_user
from app.models.usuario import Usuario
import app.models as models
import app.schemas as schemas

router = APIRouter(
    prefix="/lotes",
    tags=["Lotes"]
)

@router.get("/medicamento/{producto_id}", response_model=List[schemas.LoteOut])
def listar_lotes(
    producto_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    producto = db.query(models.Producto).filter(
        models.Producto.id == producto_id,
        models.Producto.activo == True
    ).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Medicamento no encontrado")

    return (
        db.query(models.Lote)
        .filter(
            models.Lote.producto_id == producto_id,
            models.Lote.activo == True
        )
        .order_by(models.Lote.fecha_vencimiento.asc())
        .all()
    )

@router.get("/proximos-vencer", response_model=List[schemas.LoteOut])
def lotes_proximos_vencer(
    dias: int = 90,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    hoy = date.today()
    limite = hoy + timedelta(days=dias)
    return (
        db.query(models.Lote)
        .filter(
            models.Lote.activo == True,
            models.Lote.cantidad_disponible > 0,
            models.Lote.fecha_vencimiento >= hoy,
            models.Lote.fecha_vencimiento <= limite
        )
        .order_by(models.Lote.fecha_vencimiento.asc())
        .all()
    )

@router.post("/", response_model=schemas.LoteOut, status_code=201)
def crear_lote(
    datos: schemas.LoteCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    producto = db.query(models.Producto).filter(
        models.Producto.id == datos.producto_id,
        models.Producto.activo == True
    ).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Medicamento no encontrado")

    lote_existe = db.query(models.Lote).filter(
        models.Lote.producto_id == datos.producto_id,
        models.Lote.numero_lote == datos.numero_lote
    ).first()
    if lote_existe:
        raise HTTPException(
            status_code=400,
            detail=f"El lote {datos.numero_lote} ya existe para este medicamento"
        )

    nuevo_lote = models.Lote(**datos.model_dump())
    db.add(nuevo_lote)
    producto.stock_actual += datos.cantidad_recibida
    _verificar_alertas(producto, db, usuario.farmacia_id)
    db.commit()
    db.refresh(nuevo_lote)
    return nuevo_lote

@router.put("/{id}", response_model=schemas.LoteOut)
def actualizar_lote(
    id: int,
    cantidad_disponible: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    lote = db.query(models.Lote).filter(
        models.Lote.id == id,
        models.Lote.activo == True
    ).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    if cantidad_disponible < 0:
        raise HTTPException(status_code=400, detail="La cantidad no puede ser negativa")

    diferencia = cantidad_disponible - lote.cantidad_disponible
    lote.cantidad_disponible = cantidad_disponible
    lote.producto.stock_actual += diferencia
    _verificar_alertas(lote.producto, db, usuario.farmacia_id)
    db.commit()
    db.refresh(lote)
    return lote

@router.delete("/{id}", status_code=204)
def eliminar_lote(
    id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    lote = db.query(models.Lote).filter(
        models.Lote.id == id,
        models.Lote.activo == True
    ).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")

    lote.producto.stock_actual -= lote.cantidad_disponible
    lote.activo = False
    db.commit()
    return None

# ─── Helper ───────────────────────────────────────────────
def _verificar_alertas(producto: models.Producto, db: Session, farmacia_id: int):
    hoy = date.today()
    limite_vencimiento = hoy + timedelta(days=90)

    if producto.stock_actual <= producto.stock_minimo:
        alerta_existe = db.query(models.Alerta).filter(
            models.Alerta.producto_id == producto.id,
            models.Alerta.tipo == models.TipoAlerta.STOCK_MINIMO,
            models.Alerta.leida == False
        ).first()
        if not alerta_existe:
            db.add(models.Alerta(
                farmacia_id=farmacia_id,
                producto_id=producto.id,
                tipo=models.TipoAlerta.STOCK_MINIMO,
                mensaje=f"{producto.nombre_comercial}: stock bajo "
                        f"({producto.stock_actual} uds, mínimo {producto.stock_minimo})"
            ))

    lotes_por_vencer = db.query(models.Lote).filter(
        models.Lote.producto_id == producto.id,
        models.Lote.activo == True,
        models.Lote.cantidad_disponible > 0,
        models.Lote.fecha_vencimiento >= hoy,
        models.Lote.fecha_vencimiento <= limite_vencimiento
    ).all()

    for lote in lotes_por_vencer:
        alerta_existe = db.query(models.Alerta).filter(
            models.Alerta.lote_id == lote.id,
            models.Alerta.tipo == models.TipoAlerta.PROXIMO_VENCER,
            models.Alerta.leida == False
        ).first()
        if not alerta_existe:
            dias_restantes = (lote.fecha_vencimiento - hoy).days
            db.add(models.Alerta(
                farmacia_id=farmacia_id,
                producto_id=producto.id,
                lote_id=lote.id,
                tipo=models.TipoAlerta.PROXIMO_VENCER,
                mensaje=f"Lote {lote.numero_lote} de {producto.nombre_comercial} "
                        f"vence en {dias_restantes} días"
            ))