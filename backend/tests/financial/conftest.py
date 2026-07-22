import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm.clsregistry import _MultipleClassMarker

from app.db.database import Base

import app.models  # noqa: F401 - registers all models

# Resolve the FinancialRatio name collision.
# app.models.__init__ registers BOTH app.models.financial.financial_ratio.FinancialRatio
# (financial_ratios table) and modules.financial.models.financial_ratio.FinancialRatio
# (fin_engine_ratios table) under the name "FinancialRatio".
# Company's relationship("FinancialRatio", ..., back_populates="company") can't resolve.
#
# Fix: remove the back_populates conflict, strip the duplicate from class registry,
# and let mapper configuration happen lazily.

for _m in list(Base.registry.mappers):
    if _m.class_.__name__ == "FinancialRatio" and _m.class_.__tablename__ == "financial_ratios":
        _m.class_.company = relationship("Company")
        break

from app.models.company.company import Company
Company.financial_ratios = relationship("FinancialRatio", viewonly=True, lazy="dynamic")

_marker = Base.registry._class_registry.get("FinancialRatio")
if isinstance(_marker, _MultipleClassMarker):
    for _ref in list(_marker.contents):
        _cls = _ref()
        if _cls is not None and _cls.__tablename__ == "financial_ratios":
            _marker.remove_item(_cls)
    _remaining = list(_marker.contents)
    if len(_remaining) == 1:
        Base.registry._class_registry["FinancialRatio"] = _remaining[0]()


@pytest.fixture(scope="module")
def db_engine():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture()
def db_session(db_engine):
    Session = sessionmaker(bind=db_engine)
    session = Session()
    yield session
    session.rollback()
    session.close()
