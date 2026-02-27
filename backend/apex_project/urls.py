"""
Apex Cloud Mining — Root URL Configuration
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('django-admin/', admin.site.urls),

    # ==============================
    # JWT AUTH ENDPOINTS (IMPORTANT)
    # ==============================
    path('api/v1/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # ==============================
    # API v1 Apps
    # ==============================
    path('api/v1/auth/',     include('apps.users.urls')),
    path('api/v1/mining/',   include('apps.mining.urls')),
    path('api/v1/payments/', include('apps.payments.urls')),
    path('api/v1/referrals/',include('apps.referrals.urls')),
    path('api/v1/admin/',    include('apps.admin_panel.urls')),

    # ==============================
    # API Docs
    # ==============================
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

# Media files
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
