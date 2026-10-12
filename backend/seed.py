from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models import Product

Base.metadata.create_all(bind=engine)

SAMPLE_PRODUCTS = [
    {"name": "Classic White T-Shirt", "description": "Soft cotton crew neck tee.", "price_cents": 1999, "category": "Men", "stock": 50},
    {"name": "Slim Fit Denim Jeans", "description": "Dark blue stretch denim.", "price_cents": 4999, "category": "Men", "stock": 30},
    {"name": "Floral Summer Dress", "description": "Light knee-length dress.", "price_cents": 5999, "category": "Women", "stock": 25},
    {"name": "High-Waist Leggings", "description": "Stretchy and comfortable.", "price_cents": 2999, "category": "Women", "stock": 40},
    {"name": "Leather Belt", "description": "Genuine leather with metal buckle.", "price_cents": 2499, "category": "Accessories", "stock": 60},
    {"name": "Canvas Sneakers", "description": "Everyday lace-up sneakers.", "price_cents": 3999, "category": "Footwear", "stock": 35},
    {"name": "Hooded Sweatshirt", "description": "Warm fleece-lined hoodie.", "price_cents": 4499, "category": "Men", "stock": 20},
    {"name": "Silk Scarf", "description": "Lightweight printed scarf.", "price_cents": 1899, "category": "Accessories", "stock": 45},
]


def seed():
    db = SessionLocal()
    try:
        already_has_products = db.scalar(select(Product.id).limit(1))
        if already_has_products:
            print("Products already exist. Nothing added.")
            return

        for index, item in enumerate(SAMPLE_PRODUCTS, start=1):
            image_url = f"https://picsum.photos/seed/stylehub{index}/400/500"
            db.add(Product(image_url=image_url, **item))

        db.commit()
        print(f"Added {len(SAMPLE_PRODUCTS)} products.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()