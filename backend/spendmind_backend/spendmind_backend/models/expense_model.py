from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field
MoodType = Literal["stressed", "bored", "happy", "lonely", "tired", "social", "great", "good", "okay", "low"]
ClassificationType = Literal["essential", "routine", "discretionary", "uncertain"]
class ClassificationOverride(BaseModel):
    classification: ClassificationType
    reason: Optional[str] = Field(None, max_length=240)
class ExpenseCreate(BaseModel):
    user_id: Optional[str] = Field(None, description="Legacy client field; backend derives the user from JWT")
    amount: float = Field(..., gt=0, description="Amount spent, in INR")
    category: str = Field(..., description="e.g. food, shopping, transport")
    date: Optional[str] = Field(None, description="ISO date string; defaults to now")
    notes: Optional[str] = Field(None, description="Free-text notes, e.g. 'midnight Swiggy order'")
    mood: Optional[MoodType] = Field(None, description="User's emotional state at time of spend")
    source: Optional[str] = Field("manual", description="manual | sms | whatsapp | voice")
    classification_override: Optional[ClassificationOverride] = Field(None, description="Future user correction for expense classification")
class ExpenseOut(BaseModel):
    id: str
    user_id: str
    amount: float
    category: str
    date: str
    notes: Optional[str] = None
    mood: Optional[str] = None
    source: str = "manual"
    insight: Optional[dict] = None
    expense_classification: Optional[dict] = None
    behavioral_significance: Optional[dict] = None
    classification_override: Optional[ClassificationOverride] = None
class ExpenseWithInsight(BaseModel):
    expense: ExpenseOut
    insight: dict
class MoodLog(BaseModel):
    user_id: Optional[str] = None
    mood: MoodType
    timestamp: Optional[str] = None
    day: Optional[str] = None
    day_rating: Optional[int] = Field(None, ge=1, le=5)
    triggers: Optional[str] = None
    tomorrow: Optional[str] = None
class SMSImportRequest(BaseModel):
    user_id: Optional[str] = None
    sms_text: str
class SMSImportPreview(BaseModel):
    amount: Optional[float]
    merchant: Optional[str]
    bank: Optional[str]
    transaction_type: Optional[str]
    category_guess: Optional[str]
    date: Optional[str]
    raw_text: str
    confidence: float
    duplicate: bool = False
class SMSImportConfirm(BaseModel):
    user_id: Optional[str] = None
    amount: float
    category: str
    merchant: Optional[str] = None
    date: Optional[str] = None
    notes: Optional[str] = None
    classification_override: Optional[ClassificationOverride] = None
class AuthVerifyRequest(BaseModel):
    id_token: str
class AuthSignupRequest(BaseModel):
    email: str = Field(..., description="User's email address")
    password: str = Field(..., min_length=6, description="User's password")
class AuthSigninRequest(BaseModel):
    email: str
    password: str
class AuthGoogleRequest(BaseModel):
    credential: str = Field(..., description="Google ID token")
class UserOut(BaseModel):
    uid: str
    email: str
    provider: str
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
class ErrorResponse(BaseModel):
    error: bool = True
    message: str
    code: int
