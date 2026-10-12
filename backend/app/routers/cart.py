from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_user
from app.models import CartItem, Product, User
from app.schemas import (
    CartItemAdd,
    CartItemOut,
    CartItemUpdate,
    CartOut,
    ProductOut,
)

router = APIRouter(prefix="/cart", tags=["Cart"])


def build_cart(db: Session, user: User) -> CartOut:
    cart_items = db.scalars(
        select(CartItem)
        .options(joinedload(CartItem.product))
        .where(CartItem.user_id == user.id)
        .order_by(CartItem.id)
    ).all()

    items = [
        CartItemOut(
            id=item.id,
            quantity=item.quantity,
            product=ProductOut.model_validate(item.product),
            line_total_cents=item.product.price_cents * item.quantity,
        )
        for item in cart_items
    ]

    return CartOut(
        items=items,
        total_items=sum(i.quantity for i in items),
        total_cents=sum(i.line_total_cents for i in items),
    )


def get_user_item(db: Session, user: User, item_id: int) -> CartItem:
    item = db.scalar(
        select(CartItem).where(
            CartItem.id == item_id, CartItem.user_id == user.id
        )
    )
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found",
        )
    return item


@router.get("", response_model=CartOut)
def view_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return build_cart(db, current_user)


@router.post("/items", response_model=CartOut, status_code=status.HTTP_201_CREATED)
def add_to_cart(
    data: CartItemAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.get(Product, data.product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    item = db.scalar(
        select(CartItem).where(
            CartItem.user_id == current_user.id,
            CartItem.product_id == data.product_id,
        )
    )

    new_quantity = data.quantity + (item.quantity if item else 0)
    if new_quantity > product.stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {product.stock} in stock",
        )

    if item:
        item.quantity = new_quantity
    else:
        db.add(
            CartItem(
                user_id=current_user.id,
                product_id=data.product_id,
                quantity=data.quantity,
            )
        )
    db.commit()

    return build_cart(db, current_user)


@router.put("/items/{item_id}", response_model=CartOut)
def update_quantity(
    item_id: int,
    data: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = get_user_item(db, current_user, item_id)

    if data.quantity > item.product.stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {item.product.stock} in stock",
        )

    item.quantity = data.quantity
    db.commit()

    return build_cart(db, current_user)


@router.delete("/items/{item_id}", response_model=CartOut)
def remove_from_cart(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = get_user_item(db, current_user, item_id)
    db.delete(item)
    db.commit()

    return build_cart(db, current_user)