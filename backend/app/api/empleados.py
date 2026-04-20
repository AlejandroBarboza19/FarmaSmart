# app/api/empleados.py
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.services.auth_service import get_current_user, solo_admin   # ← correcto
from app.schemas.auth import UsuarioActual
from app.schemas.empleado import (
    EmpleadoCreate,
    EmpleadoUpdate,
    EmpleadoResponse,
    CambiarPasswordRequest,
)
from app.services.empleado_service import (
    listar_empleados,
    obtener_empleado,
    crear_empleado,
    actualizar_empleado,
    cambiar_password,
    eliminar_empleado,
)

router = APIRouter(prefix="/empleados", tags=["Empleados"])


# ── GET /empleados/ ────────────────────────────────────────────
@router.get("/", response_model=List[EmpleadoResponse])
def listar(
    db:      Session      = Depends(get_db),
    usuario: UsuarioActual = Depends(solo_admin),
):
    return listar_empleados(db, usuario.farmacia_id)


# ── GET /empleados/{id} ────────────────────────────────────────
@router.get("/{empleado_id}", response_model=EmpleadoResponse)
def detalle(
    empleado_id: int,
    db:          Session       = Depends(get_db),
    usuario:     UsuarioActual = Depends(solo_admin),
):
    return obtener_empleado(db, empleado_id, usuario.farmacia_id)


# ── POST /empleados/ ───────────────────────────────────────────
@router.post("/", response_model=EmpleadoResponse, status_code=status.HTTP_201_CREATED)
def crear(
    datos:   EmpleadoCreate,
    db:      Session       = Depends(get_db),
    usuario: UsuarioActual = Depends(solo_admin),
):
    return crear_empleado(db, datos, usuario.farmacia_id)


# ── PUT /empleados/{id} ────────────────────────────────────────
@router.put("/{empleado_id}", response_model=EmpleadoResponse)
def actualizar(
    empleado_id: int,
    datos:       EmpleadoUpdate,
    db:          Session       = Depends(get_db),
    usuario:     UsuarioActual = Depends(solo_admin),
):
    return actualizar_empleado(db, empleado_id, usuario.farmacia_id, datos, usuario.id)


# ── PATCH /empleados/{id}/password ────────────────────────────
@router.patch("/{empleado_id}/password", status_code=status.HTTP_204_NO_CONTENT)
def reset_password(
    empleado_id: int,
    datos:       CambiarPasswordRequest,
    db:          Session       = Depends(get_db),
    usuario:     UsuarioActual = Depends(solo_admin),
):
    cambiar_password(db, empleado_id, usuario.farmacia_id, datos.nueva_password)


# ── DELETE /empleados/{id} ─────────────────────────────────────
@router.delete("/{empleado_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(
    empleado_id: int,
    db:          Session       = Depends(get_db),
    usuario:     UsuarioActual = Depends(solo_admin),
):
    eliminar_empleado(db, empleado_id, usuario.farmacia_id, usuario.id)