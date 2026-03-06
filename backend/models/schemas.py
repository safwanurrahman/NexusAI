from pydantic import BaseModel, model_validator
from typing import List, Optional

class ResearchRequest(BaseModel):
    query: str
    country: Optional[str] = "all"  # Added to support Bangladesh/Global filtering

    @model_validator(mode='after')
    def log_inbound(self):
        print(f"📋 [SCHEMA DEBUG] Validating Inbound Request: Query='{self.query}', Country='{self.country}'")
        return self

class ArticleSummary(BaseModel):
    title: Optional[str] = "Untitled Article"
    link: Optional[str] = ""
    author: Optional[str] = "Unknown"
    summary: str

    @model_validator(mode='after')
    def log_article(self):
        # We only print the first 30 chars of the summary to keep the console clean
        short_sum = (self.summary[:30] + '...') if self.summary else "Empty"
        print(f"📝 [SCHEMA DEBUG] Structured Article: '{self.title}' | Summary: {short_sum}")
        return self

class ResearchResponse(BaseModel):
    status: str
    # 'data' is Optional because it's empty while status is "processing"
    data: Optional[List[ArticleSummary]] = None 
    task_id: Optional[str] = None

    @model_validator(mode='after')
    def log_outbound(self):
        item_count = len(self.data) if self.data else 0
        print(f"📦 [SCHEMA DEBUG] Final Response Ready: Status={self.status}, Items={item_count}, TaskID={self.task_id}")
        return self

# =================================================================
# 📖 THE STORY OF THIS FILE (THE ORDER FORM)
# =================================================================
# * THE GATEKEEPER: Imagine a strict security guard standing at 
#   the entrance of the kitchen. schema.py is that guard. 
#   He ensures that no "garbage" data enters the system.
#
# * THE ORDER FORM (ResearchRequest): When a customer wants a 
#   search, they must fill out a specific form. If they forget 
#   the "Query," the guard throws the form back and says, 
#   "Incomplete!" 
#
# * THE PLATE DECORATOR (ArticleSummary): Once the Chef finishes 
#   cooking, this code ensures every "Summary" is served on a 
#   standard plate. It adds default values like "Untitled" if 
#   the title is missing, so the customer isn't confused.
#
# * THE FINAL RECEIPT (ResearchResponse): Before the food leaves 
#   the building, this code checks if everything is correct—the 
#   status, the data list, and the ID number. It’s the final 
#   quality check.
# =================================================================

# 🛡️ WHY WE "IMPORT" HEADERS? (Conceptual Relation)
# While this file doesn't use 'import requests' to send headers, 
# it defines the 'ResearchRequest' which is often the "Body" 
# of a request that HAS headers. 
# Think of the Headers as the "Envelope" and this Schema as the 
# "Letter" inside. The envelope tells the server where to go, 
# and this file ensures the letter is written in a language 
# the server can actually read.