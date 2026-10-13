from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models import Product

Base.metadata.create_all(bind=engine)

SAMPLE_PRODUCTS = [
    {"name": "Classic White T-Shirt", "description": "Soft cotton crew neck tee.", "price_cents": 1999, "category": "Men", "stock": 50, "image_url": "/images/product1.jpg"},
    {"name": "Slim Fit Denim Jeans", "description": "Dark blue stretch denim.", "price_cents": 4999, "category": "Men", "stock": 30, "image_url": "/images/product2.jpg"},
    {"name": "Floral Summer Dress", "description": "Light knee-length dress.", "price_cents": 5999, "category": "Women", "stock": 25, "image_url": "/images/product3.jpg"},
    {"name": "High-Waist Leggings", "description": "Stretchy and comfortable.", "price_cents": 2999, "category": "Women", "stock": 40, "image_url": "/images/product4.jpg"},
    {"name": "Leather Belt", "description": "Genuine leather with metal buckle.", "price_cents": 2499, "category": "Accessories", "stock": 60, "image_url": "/images/product5.jpg"},
    {"name": "Canvas Sneakers", "description": "Everyday lace-up sneakers.", "price_cents": 3999, "category": "Footwear", "stock": 35, "image_url": "/images/product6.jpg"},
    {"name": "Hooded Sweatshirt", "description": "Warm fleece-lined hoodie.", "price_cents": 4499, "category": "Men", "stock": 20, "image_url": "/images/product7.jpg"},
    {"name": "Silk Scarf", "description": "Lightweight printed scarf.", "price_cents": 1899, "category": "Accessories", "stock": 45, "image_url": "/images/product8.jpg"},
]


def seed():
    db = SessionLocal()
    try:
        added = 0
        updated = 0

        for item in SAMPLE_PRODUCTS:
            product = db.scalar(select(Product).where(Product.name == item["name"]))

            if product is None:
                db.add(Product(**item))
                added += 1
            elif product.image_url != item["image_url"]:
                product.image_url = item["image_url"]
                updated += 1

        db.commit()
        print(f"Added {added} products, updated images for {updated}.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()