from django.urls import path
from .views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    ForgotPasswordConfirmView,
    ForgotPasswordRequestView,
    MeView,
    SendVerificationCodeView,
    VerifyEmailView,
)

urlpatterns = [
    path("login", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("refresh", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("me", MeView.as_view(), name="me"),
    path("send-verification-code", SendVerificationCodeView.as_view(), name="send_verification_code"),
    path("verify-email", VerifyEmailView.as_view(), name="verify_email"),
    path("forgot-password/request", ForgotPasswordRequestView.as_view(), name="forgot_password_request"),
    path("forgot-password/confirm", ForgotPasswordConfirmView.as_view(), name="forgot_password_confirm"),
]