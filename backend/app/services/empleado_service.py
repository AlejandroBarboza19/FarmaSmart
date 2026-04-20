# app/services/empleado_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.usuario import Usuario, RolUsuario
from app.schemas.empleado import EmpleadoCreate, EmpleadoUpdate
from app.core.security import hash_password   # ← usa hash_password, no get_password_hash


def listar_empleados(db: Session, farmacia_id: int):
    return (
        db.query(Usuario)
        .filter(Usuario.farmacia_id == farmacia_id)
        .order_by(Usuario.created_at.desc())
        .all()
    )


def obtener_empleado(db: Session, empleado_id: int, farmacia_id: int) -> Usuario:
    emp = db.query(Usuario).filter(
        Usuario.id          == empleado_id,
        Usuario.farmacia_id == farmacia_id,
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return emp


def crear_empleado(db: Session, datos: EmpleadoCreate, farmacia_id: int) -> Usuario:
    existe = db.query(Usuario).filter(
        Usuario.email       == datos.email,
        Usuario.farmacia_id == farmacia_id,
    ).first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe un empleado con ese correo")

    nuevo = Usuario(
        farmacia_id   = farmacia_id,
        nombre        = datos.nombre,
        email         = datos.email,
        password_hash = hash_password(datos.password),
        rol           = datos.rol,
        activo        = True,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


def actualizar_empleado(
    db: Session,
    empleado_id: int,
    farmacia_id: int,
    datos: EmpleadoUpdate,
    usuario_actual_id: int,
) -> Usuario:
    emp = obtener_empleado(db, empleado_id, farmacia_id)

    if emp.id == usuario_actual_id:
        if datos.rol is not None and datos.rol != RolUsuario.ADMIN:
            raise HTTPException(status_code=400, detail="No puedes cambiar tu propio rol")
        if datos.activo is False:
            raise HTTPException(status_code=400, detail="No puedes desactivarte a ti mismo")

    if datos.nombre  is not None: emp.nombre = datos.nombre
    if datos.email   is not None: emp.email  = datos.email
    if datos.rol     is not None: emp.rol    = datos.rol
    if datos.activo  is not None: emp.activo = datos.activo

    db.commit()
    db.refresh(emp)
    return emp


def cambiar_password(
    db: Session,
    empleado_id: int,
    farmacia_id: int,
    nueva_password: str,
) -> Usuario:
    emp = obtener_empleado(db, empleado_id, farmacia_id)
    emp.password_hash = hash_password(nueva_password)
    db.commit()
    return emp


def eliminar_empleado(
    db: Session,
    empleado_id: int,
    farmacia_id: int,
    usuario_actual_id: int,
) -> None:
    emp = obtener_empleado(db, empleado_id, farmacia_id)
    if emp.id == usuario_actual_id:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
    db.delete(emp)
    db.commit()