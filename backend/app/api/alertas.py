from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.usuario import Usuario
import app.models as models
import app.schemas as schemas

router = APIRouter(
    prefix="/alertas",
    tags=["Alertas"]
)

DIAS_PROXIMO_VENCER = 90


@router.get("/", response_model=List[schemas.AlertaOut])
def listar_alertas(
    solo_no_leidas: bool = True,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    query = db.query(models.Alerta).filter(
        models.Alerta.farmacia_id == usuario.farmacia_id
    )

    if solo_no_leidas:
        query = query.filter(models.Alerta.leida == False)

    return query.order_by(models.Alerta.created_at.desc()).all()


@router.get("/resumen")
def resumen_alertas(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    base = db.query(models.Alerta).filter(
        models.Alerta.farmacia_id == usuario.farmacia_id,
        models.Alerta.leida == False
    )

    total = base.count()

    stock_minimo = db.query(models.Alerta).filter(
        models.Alerta.farmacia_id == usuario.farmacia_id,
        models.Alerta.leida == False,
        models.Alerta.tipo == models.TipoAlerta.STOCK_MINIMO
    ).count()

    proximos_vencer = db.query(models.Alerta).filter(
        models.Alerta.farmacia_id == usuario.farmacia_id,
        models.Alerta.leida == False,
        models.Alerta.tipo == models.TipoAlerta.PROXIMO_VENCER
    ).count()

    vencidos = db.query(models.Alerta).filter(
        models.Alerta.farmacia_id == usuario.farmacia_id,
        models.Alerta.leida == False,
        models.Alerta.tipo == models.TipoAlerta.VENCIDO
    ).count()

    return {
        "total": total,
        "stock_minimo": stock_minimo,
        "proximos_vencer": proximos_vencer,
        "vencidos": vencidos
    }


@router.post("/verificar", status_code=200)
def verificar_todas_las_alertas(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    hoy = date.today()
    limite_proximo_vencer = hoy + timedelta(days=DIAS_PROXIMO_VENCER)
    alertas_creadas = 0

    productos = db.query(models.Producto).filter(
        models.Producto.activo == True,
        models.Producto.farmacia_id == usuario.farmacia_id
    ).all()

    for producto in productos:
        if producto.stock_actual <= producto.stock_minimo:
            existe = db.query(models.Alerta).filter(
                models.Alerta.farmacia_id == usuario.farmacia_id,
                models.Alerta.producto_id == producto.id,
                models.Alerta.tipo == models.TipoAlerta.STOCK_MINIMO,
                models.Alerta.leida == False
            ).first()

            if not existe:
                db.add(models.Alerta(
                    farmacia_id=usuario.farmacia_id,
                    producto_id=producto.id,
                    tipo=models.TipoAlerta.STOCK_MINIMO,
                    mensaje=f"{producto.nombre_comercial}: stock bajo ({producto.stock_actual} uds, mínimo {producto.stock_minimo})"
                ))
                alertas_creadas += 1

        lotes_vencidos = [
            l for l in producto.lotes
            if l.activo and l.cantidad_disponible > 0 and l.fecha_vencimiento < hoy
        ]

        for lote in lotes_vencidos:
            existe = db.query(models.Alerta).filter(
                models.Alerta.farmacia_id == usuario.farmacia_id,
                models.Alerta.lote_id == lote.id,
                models.Alerta.tipo == models.TipoAlerta.VENCIDO,
                models.Alerta.leida == False
            ).first()

            if not existe:
                db.add(models.Alerta(
                    farmacia_id=usuario.farmacia_id,
                    producto_id=producto.id,
                    lote_id=lote.id,
                    tipo=models.TipoAlerta.VENCIDO,
                    mensaje=f"Lote {lote.numero_lote} de {producto.nombre_comercial} venció el {lote.fecha_vencimiento}"
                ))
                alertas_creadas += 1

        lotes_proximos_vencer = [
            l for l in producto.lotes
            if (
                l.activo
                and l.cantidad_disponible > 0
                and hoy <= l.fecha_vencimiento <= limite_proximo_vencer
            )
        ]

        for lote in lotes_proximos_vencer:
            existe = db.query(models.Alerta).filter(
                models.Alerta.farmacia_id == usuario.farmacia_id,
                models.Alerta.lote_id == lote.id,
                models.Alerta.tipo == models.TipoAlerta.PROXIMO_VENCER,
                models.Alerta.leida == False
            ).first()

            if not existe:
                db.add(models.Alerta(
                    farmacia_id=usuario.farmacia_id,
                    producto_id=producto.id,
                    lote_id=lote.id,
                    tipo=models.TipoAlerta.PROXIMO_VENCER,
                    mensaje=f"Lote {lote.numero_lote} de {producto.nombre_comercial} vence el {lote.fecha_vencimiento}"
                ))
                alertas_creadas += 1

    db.commit()
    return {"mensaje": f"Verificación completada. {alertas_creadas} alertas nuevas generadas."}


@router.put("/{id}/leer", response_model=schemas.AlertaOut)
def marcar_leida(
    id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    alerta = db.query(models.Alerta).filter(
        models.Alerta.id == id,
        models.Alerta.farmacia_id == usuario.farmacia_id
    ).first()

    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")

    alerta.leida = True
    db.commit()
    db.refresh(alerta)
    return alerta


@router.put("/leer-todas", status_code=200)
def marcar_todas_leidas(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    db.query(models.Alerta).filter(
        models.Alerta.farmacia_id == usuario.farmacia_id,
        models.Alerta.leida == False
    ).update({"leida": True})

    db.commit()
    return {"mensaje": "Todas las alertas marcadas como leídas"}