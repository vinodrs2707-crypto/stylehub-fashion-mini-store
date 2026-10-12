import stripe
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.config import STRIPE_SECRET_KEY
from app.database import get_db
from app.dependencies import get_current_user
from app.models import CartItem, Order, OrderItem, User
from app.schemas import CheckoutOut, OrderOut

stripe.api_key = STRIPE_SECRET_KEY

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/checkout", response_model=CheckoutOut, status_code=status.HTTP_201_CREATED)
def checkout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart_items = db.scalars(
        select(CartItem)
        .options(joinedload(CartItem.product))
        .where(CartItem.user_id == current_user.id)
        .order_by(CartItem.id)
    ).all()

    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your cart is empty",
        )

    for item in cart_items:
        if item.quantity > item.product.stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Not enough stock for {item.product.name}",
            )

    total_cents = sum(i.product.price_cents * i.quantity for i in cart_items)

    order = Order(user_id=current_user.id, total_cents=total_cents, currency="usd")
    order.items = [
        OrderItem(
            product_id=i.product_id,
            product_name=i.product.name,
            unit_price_cents=i.product.price_cents,
            quantity=i.quantity,
        )
        for i in cart_items
    ]
    db.add(order)
    db.flush()

    try:
        intent = stripe.PaymentIntent.create(
            amount=total_cents,
            currency="usd",
            automatic_payment_methods={"enabled": True},
            metadata={"order_id": str(order.id)},
        )
    except stripe.StripeError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Payment service error. Please try again.",
        )

    order.stripe_payment_intent_id = intent.id
    db.commit()

    return CheckoutOut(
        order_id=order.id,
        client_secret=intent.client_secret,
        total_cents=total_cents,
    )


@router.get("", response_model=list[OrderOut])
def list_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.scalars(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.user_id == current_user.id)
        .order_by(Order.id.desc())
    ).all()


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.scalar(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id, Order.user_id == current_user.id)
    )
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    return order