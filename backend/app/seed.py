from sqlalchemy.orm import Session

from .main import seed


def seed_demo_data(db: Session):
    seed(db)
