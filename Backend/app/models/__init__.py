# Import all models here so SQLAlchemy's mapper can resolve all forward references
# regardless of which model is imported first.
from app.models import user, project, task, chat, knowledge  # noqa: F401
