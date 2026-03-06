# backend/models/article.py
from enum import Enum
from pydantic import BaseModel
from typing import List, Optional


class TaskStatus(str, Enum):
    success = "success"
    processing = "processing"
    pending = "pending"
    error = "error"


class BackendArticle(BaseModel):
    title: str
    link: str
    author: str
    summary: str


class BackendResponse(BaseModel):
    status: TaskStatus
    data: Optional[List[BackendArticle]] = None
    task_id: Optional[str] = None
    message: Optional[str] = None