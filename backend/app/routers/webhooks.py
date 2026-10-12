import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.config import STRIPE_WEBHOOK_SECRET
from app.database import get_db
from app.models import CartItem, Order, Product

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook secret is not configured",
        )

    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(
            payload, signature, STRIPE_WEBHOOK_SECRET
        )
    except (ValueError, stripe.SignatureVerificationError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook request",
        )

    event_type = event["type"]
    intent = event["data"]["object"]

    if event_type in ("payment_intent.succeeded", "payment_intent.payment_failed"):
        order = db.scalar(
            select(Order).where(Order.stripe_payment_intent_id == intent["id"])
        )

        if order is not None and order.status != "paid":
            if event_type == "payment_intent.succeeded":
                order.status = "paid"

                for item in order.items:
                    product = db.get(Product, item.product_id)
                    if product is not None:
                        product.stock = max(0, product.stock - item.quantity)

                db.execute(delete(CartItem).where(CartItem.user_id == order.user_id))
            else:
                order.status = "failed"

            db.commit()

    return {"received": True}