from pydantic import BaseModel, ConfigDict


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    avatar_url: str | None
    is_active: bool
    created_at: str

    @classmethod
    def from_orm(cls, user) -> "UserResponse":
        return cls(
            id=str(user.id),
            name=user.name,
            email=user.email,
            avatar_url=user.avatar_url,
            is_active=user.is_active,
            created_at=user.created_at.isoformat(),
        )
