"""
Transactions CRUD & Offline Batch Synchronization Router for FairWork Setu.
Enforces strict user-level isolation using validated JWT claims.
Safely ignores synthetic demo records (tx_demo_*, sample_*) during sync.
"""

import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import and_

from database import get_db
from auth import get_current_user
from db_models import Transaction, Profile

logger = logging.getLogger("setu.transactions_router")

transactions_router = APIRouter(prefix="/api/transactions", tags=["transactions"])


# ---------------------------------------------------------------------------
# PYDANTIC SCHEMAS
# ---------------------------------------------------------------------------

class TransactionCreatePayload(BaseModel):
    clientTxId: Optional[str] = None
    type: str = Field(..., description="'income' or 'expense'")
    amount: float = Field(..., gt=0, description="Transaction amount (must be positive)")
    category: str = Field(..., description="Category key (e.g. travel_fuel, food, work_earnings)")
    description: Optional[str] = ""
    workRef: Optional[str] = None
    source: Optional[str] = "manual"
    timestamp: str = Field(..., description="ISO 8601 timestamp string")


class TransactionUpdatePayload(BaseModel):
    type: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = None
    description: Optional[str] = None
    workRef: Optional[str] = None
    timestamp: Optional[str] = None


class BatchSyncPayload(BaseModel):
    transactions: List[TransactionCreatePayload] = Field(default_factory=list)


def parse_iso_datetime(dt_str: str) -> datetime:
    try:
        # Handle ISO strings like 2026-10-19T10:30:00.000Z
        clean_str = dt_str.replace("Z", "+00:00")
        return datetime.fromisoformat(clean_str)
    except Exception:
        return datetime.utcnow()


# ---------------------------------------------------------------------------
# ENDPOINTS
# ---------------------------------------------------------------------------

@transactions_router.get("")
def list_transactions(
    type: Optional[str] = Query(None, description="'income', 'expense', or 'all'"),
    category: Optional[str] = Query(None, description="Category filter"),
    startDate: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    endDate: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    limit: int = Query(200, ge=1, le=1000),
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches the authenticated user's transactions with optional filters.
    Strictly isolated to user['sub'].
    """
    user_id = user["sub"]
    query = db.query(Transaction).filter(Transaction.user_id == user_id)

    if type and type != "all":
        query = query.filter(Transaction.type == type)

    if category and category != "all":
        query = query.filter(Transaction.category == category)

    if startDate:
        try:
            start_dt = datetime.fromisoformat(startDate)
            query = query.filter(Transaction.timestamp >= start_dt)
        except ValueError:
            pass

    if endDate:
        try:
            end_dt = datetime.fromisoformat(endDate + "T23:59:59")
            query = query.filter(Transaction.timestamp <= end_dt)
        except ValueError:
            pass

    txs = query.order_by(Transaction.timestamp.desc()).limit(limit).all()
    return {
        "status": "success",
        "count": len(txs),
        "transactions": [t.to_dict() for t in txs]
    }


@transactions_router.post("")
def create_transaction(
    payload: TransactionCreatePayload,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates a new transaction for the authenticated user."""
    user_id = user["sub"]

    # Ensure profile exists in DB
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        profile = Profile(id=user_id, full_name="Worker")
        db.add(profile)
        db.commit()

    # Reject demo transactions from being committed as genuine user records
    if payload.clientTxId and (
        payload.clientTxId.startswith("tx_demo_") or payload.clientTxId.startswith("sample_")
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Synthetic demo transactions cannot be committed to user storage."
        )

    ts = parse_iso_datetime(payload.timestamp)

    # Check for existing idempotency key
    if payload.clientTxId:
        existing = db.query(Transaction).filter(
            and_(Transaction.user_id == user_id, Transaction.client_tx_id == payload.clientTxId)
        ).first()
        if existing:
            return {"status": "exists", "transaction": existing.to_dict()}

    new_tx = Transaction(
        user_id=user_id,
        client_tx_id=payload.clientTxId,
        type=payload.type,
        amount=payload.amount,
        category=payload.category,
        description=payload.description or "",
        work_ref=payload.workRef,
        source=payload.source or "manual",
        timestamp=ts,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)

    return {"status": "success", "transaction": new_tx.to_dict()}


@transactions_router.post("/batch-sync")
def batch_sync_transactions(
    payload: BatchSyncPayload,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Idempotent batch synchronization for transactions recorded offline.
    Silently filters out synthetic demo records (tx_demo_*, sample_*).
    Prevents duplicate insertions using clientTxId uniqueness.
    """
    user_id = user["sub"]

    # Ensure profile exists
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        profile = Profile(id=user_id, full_name="Worker")
        db.add(profile)
        db.commit()

    synced_count = 0
    skipped_count = 0

    for item in payload.transactions:
        cid = item.clientTxId or ""

        # Filter out all synthetic demo records
        if cid.startswith("tx_demo_") or cid.startswith("sample_") or "[Dev Sample]" in (item.description or ""):
            skipped_count += 1
            continue

        # Check for existing transaction with same clientTxId
        if cid:
            existing = db.query(Transaction).filter(
                and_(Transaction.user_id == user_id, Transaction.client_tx_id == cid)
            ).first()
            if existing:
                skipped_count += 1
                continue

        ts = parse_iso_datetime(item.timestamp)
        new_tx = Transaction(
            user_id=user_id,
            client_tx_id=cid if cid else None,
            type=item.type,
            amount=item.amount,
            category=item.category,
            description=item.description or "",
            work_ref=item.workRef,
            source=item.source or "quick",
            timestamp=ts,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(new_tx)
        synced_count += 1

    db.commit()
    logger.info(f"Batch sync for user {user_id}: {synced_count} synced, {skipped_count} skipped/demo.")

    # Return refreshed transaction list
    txs = db.query(Transaction).filter(Transaction.user_id == user_id).order_by(Transaction.timestamp.desc()).limit(200).all()
    return {
        "status": "success",
        "message": f"Successfully synced {synced_count} transactions ({skipped_count} skipped)",
        "syncedCount": synced_count,
        "skippedCount": skipped_count,
        "transactions": [t.to_dict() for t in txs]
    }



@transactions_router.put("/{tx_id}")
def update_transaction(
    tx_id: str,
    payload: TransactionUpdatePayload,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates a transaction, verifying ownership."""
    user_id = user["sub"]
    tx = db.query(Transaction).filter(and_(Transaction.id == tx_id, Transaction.user_id == user_id)).first()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found or unauthorized."
        )

    if payload.type:
        tx.type = payload.type
    if payload.amount is not None:
        tx.amount = payload.amount
    if payload.category:
        tx.category = payload.category
    if payload.description is not None:
        tx.description = payload.description
    if payload.workRef is not None:
        tx.work_ref = payload.workRef
    if payload.timestamp:
        tx.timestamp = parse_iso_datetime(payload.timestamp)
    tx.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(tx)
    return {"status": "success", "transaction": tx.to_dict()}


@transactions_router.delete("/{tx_id}")
def delete_transaction(
    tx_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a transaction, verifying ownership."""
    user_id = user["sub"]
    deleted = db.query(Transaction).filter(and_(Transaction.id == tx_id, Transaction.user_id == user_id)).delete()
    db.commit()
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found or unauthorized."
        )
    return {"status": "success", "deleted": True}


@transactions_router.delete("")
def clear_all_transactions(
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clears all transactions for the authenticated user."""
    user_id = user["sub"]
    count = db.query(Transaction).filter(Transaction.user_id == user_id).delete()
    db.commit()
    return {"status": "success", "clearedCount": count}
