from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.engine import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.project import UserLookupResponse
from app.services import project_service

router = APIRouter()


@router.get("/search", response_model=UserLookupResponse | None)
async def search_users(
    email: str = Query(min_length=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user = await project_service.search_user_by_email(db, email)
    return UserLookupResponse.from_orm(user) if user else None
