from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from datetime import date, timedelta
from database import get_db
import models, schemas

router = APIRouter(
    prefix="/lotes",
    tags=["Lotes"]
)

# ─── GET /lotes/medicamento/{producto_id} ─────────────────
# Lista todos los lotes de un medicamento, ordenados por FEFO
@router.get("/medicamento/{producto_id}", response_model=List[schemas.LoteOut])
def listar_lotes(producto_id: int, db: Session = Depends(get_db)):
    # Verificar que el medicamento existe
    producto = db.query(models.Producto).filter(
        models.Producto.id == producto_id,
        models.Producto.activo == True
    ).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Medicamento no encontrado")

    # FEFO: ordenar por fecha de vencimiento ascendente
    lotes = (
        db.query(models.Lote)
        .filter(
            models.Lote.producto_id == producto_id,
            models.Lote.activo == True
        )
        .order_by(models.Lote.fecha_vencimiento.asc())
        .all()
    )
    return lotes


# ─── GET /lotes/proximos-vencer ───────────────────────────
# Lotes que vencen en los próximos N días (default: 90)
@router.get("/proximos-vencer", response_model=List[schemas.LoteOut])
def lotes_proximos_vencer(
    dias: int = 90,
    db: Session = Depends(get_db)
):
    hoy = date.today()
    limite = hoy + timedelta(days=dias)

    lotes = (
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
    return lotes


# ─── POST /lotes/ ─────────────────────────────────────────
# Registrar nuevo lote y actualizar stock del medicamento
@router.post("/", response_model=schemas.LoteOut, status_code=201)
def crear_lote(datos: schemas.LoteCreate, db: Session = Depends(get_db)):
    # 1. Verificar que el medicamento existe
    producto = db.query(models.Producto).filter(
        models.Producto.id == datos.producto_id,
        models.Producto.activo == True
    ).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Medicamento no encontrado")

    # 2. Verificar que el número de lote no se repita para ese producto
    lote_existe = db.query(models.Lote).filter(
        models.Lote.producto_id == datos.producto_id,
        models.Lote.numero_lote == datos.numero_lote
    ).first()
    if lote_existe:
        raise HTTPException(
            status_code=400,
            detail=f"El lote {datos.numero_lote} ya existe para este medicamento"
        )

    # 3. Crear el lote
    nuevo_lote = models.Lote(**datos.model_dump())
    db.add(nuevo_lote)

    # 4. Actualizar stock del medicamento automáticamente
    producto.stock_actual += datos.cantidad_recibida

    # 5. Verificar si hay alerta de stock mínimo (por si acaso baja después)
    _verificar_alertas(producto, db)

    db.commit()
    db.refresh(nuevo_lote)
    return nuevo_lote


# ─── PUT /lotes/{id} ──────────────────────────────────────
# Actualizar cantidad disponible de un lote (ej: después de una venta)
@router.put("/{id}", response_model=schemas.LoteOut)
def actualizar_lote(
    id: int,
    cantidad_disponible: int,
    db: Session = Depends(get_db)
):
    lote = db.query(models.Lote).filter(
        models.Lote.id == id,
        models.Lote.activo == True
    ).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")

    if cantidad_disponible < 0:
        raise HTTPException(status_code=400, detail="La cantidad no puede ser negativa")

    # Recalcular stock del producto
    diferencia = cantidad_disponible - lote.cantidad_disponible
    lote.cantidad_disponible = cantidad_disponible
    lote.producto.stock_actual += diferencia

    # Verificar alertas después del cambio
    _verificar_alertas(lote.producto, db)

    db.commit()
    db.refresh(lote)
    return lote


# ─── DELETE /lotes/{id} ───────────────────────────────────
# Soft delete de un lote
@router.delete("/{id}", status_code=204)
def eliminar_lote(id: int, db: Session = Depends(get_db)):
    lote = db.query(models.Lote).filter(
        models.Lote.id == id,
        models.Lote.activo == True
    ).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")

    # Descontar del stock del medicamento
    lote.producto.stock_actual -= lote.cantidad_disponible
    lote.activo = False

    db.commit()
    return None


# ─── Helper: verificar y generar alertas automáticas ──────
def _verificar_alertas(producto: models.Producto, db: Session):
    """
    Crea alertas automáticamente si:
    - El stock actual <= stock mínimo
    - Hay lotes que vencen en menos de 90 días
    """
    hoy = date.today()
    limite_vencimiento = hoy + timedelta(days=90)

    # Alerta de stock mínimo
    if producto.stock_actual <= producto.stock_minimo:
        # Evitar duplicados: no crear si ya existe una no leída
        alerta_existe = db.query(models.Alerta).filter(
            models.Alerta.producto_id == producto.id,
            models.Alerta.tipo == models.TipoAlerta.STOCK_MINIMO,
            models.Alerta.leida == False
        ).first()
        if not alerta_existe:
            alerta = models.Alerta(
                producto_id=producto.id,
                tipo=models.TipoAlerta.STOCK_MINIMO,
                mensaje=f"{producto.nombre_comercial}: stock bajo "
                        f"({producto.stock_actual} uds, mínimo {producto.stock_minimo})"
            )
            db.add(alerta)

    # Alertas de lotes próximos a vencer
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
            alerta = models.Alerta(
                producto_id=producto.id,
                lote_id=lote.id,
                tipo=models.TipoAlerta.PROXIMO_VENCER,
                mensaje=f"Lote {lote.numero_lote} de {producto.nombre_comercial} "
                        f"vence en {dias_restantes} días"
            )
            db.add(alerta)