from pydantic import BaseModel
from typing import List, Optional

class ResearchRequest(BaseModel):
    query: str
    country: Optional[str] = "all"  # Added to support Bangladesh/Global filtering

class ArticleSummary(BaseModel):
    title: Optional[str] = "Untitled Article"
    link: Optional[str] = ""
    author: Optional[str] = "Unknown"
    summary: str

class ResearchResponse(BaseModel):
    status: str
    # 'data' is Optional because it's empty while status is "processing"
    data: Optional[List[ArticleSummary]] = None 
    task_id: Optional[str] = None