
"""
Django settings for config project.
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from django.core.exceptions import ImproperlyConfigured
import dj_database_url


# --------------------------------------------------
# BASE DIRECTORY AND ENVIRONMENT
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")


# --------------------------------------------------
# SECURITY SETTINGS
# --------------------------------------------------

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "").strip()

if not SECRET_KEY:
    raise ImproperlyConfigured(
        "DJANGO_SECRET_KEY must be configured in the .env file "
        "or production environment variables."
    )

DEBUG = os.getenv("DJANGO_DEBUG", "True").strip().lower() in {
    "true",
    "1",
    "yes",
    "on",
}

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv(
        "DJANGO_ALLOWED_HOSTS",
        "localhost,127.0.0.1",
    ).split(",")
    if host.strip()
]

# Production must explicitly configure allowed hosts.
if not DEBUG and (
    not ALLOWED_HOSTS or "*" in ALLOWED_HOSTS
):
    raise ImproperlyConfigured(
        "Set DJANGO_ALLOWED_HOSTS to your actual production domain(s)."
    )


# --------------------------------------------------
# APPLICATIONS
# --------------------------------------------------

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "rest_framework",
    "corsheaders",
    "drf_spectacular",

    "accounts",
    "catalog",
    "stores",
    "cart",
    "orders",
    "payments",
    "shipments",
    "reviews",
    "wishlist",
    "coupons",
]


# --------------------------------------------------
# MIDDLEWARE
# --------------------------------------------------

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# --------------------------------------------------
# URLS AND APPLICATION ENTRY POINTS
# --------------------------------------------------

ROOT_URLCONF = "config.urls"

WSGI_APPLICATION = "config.wsgi.application"


# --------------------------------------------------
# TEMPLATES
# --------------------------------------------------

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# --------------------------------------------------
# CORS
# --------------------------------------------------

CORS_ALLOWED_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]

# Do not allow every origin by default.
CORS_ALLOW_CREDENTIALS = False


# --------------------------------------------------
# DATABASE
# --------------------------------------------------

# --------------------------------------------------
# DATABASE
# --------------------------------------------------

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

if DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            ssl_require=not DEBUG,
        )
    }
else:
    # Local development: keep using your existing PostgreSQL database.
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("DB_NAME", "trading_marketplace"),
            "USER": os.getenv("DB_USER", "postgres"),
            "PASSWORD": os.getenv("DB_PASSWORD", ""),
            "HOST": os.getenv("DB_HOST", "localhost"),
            "PORT": os.getenv("DB_PORT", "5432"),
            "CONN_MAX_AGE": 60,
        }
    }


# --------------------------------------------------
# CUSTOM USER MODEL
# --------------------------------------------------

AUTH_USER_MODEL = "accounts.User"


# --------------------------------------------------
# DJANGO REST FRAMEWORK
# --------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}


# --------------------------------------------------
# API DOCUMENTATION
# --------------------------------------------------

SPECTACULAR_SETTINGS = {
    "TITLE": "Trading Marketplace API",
    "DESCRIPTION": "API for the Trading Marketplace",
    "VERSION": "1.0.0",
    "COMPONENT_SPLIT_REQUEST": True,
    "ENUM_NAME_OVERRIDES": {
        "OrderStatusEnum": [
            ("PENDING", "Pending"),
            ("CONFIRMED", "Confirmed"),
            ("PROCESSING", "Processing"),
            ("SHIPPED", "Shipped"),
            ("DELIVERED", "Delivered"),
            ("CANCELLED", "Cancelled"),
            ("REFUNDED", "Refunded"),
        ],
    },
}


# --------------------------------------------------
# PASSWORD VALIDATION
# --------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        ),
    },
]


# --------------------------------------------------
# INTERNATIONALIZATION
# --------------------------------------------------

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# --------------------------------------------------
# STATIC AND MEDIA FILES
# --------------------------------------------------

STATIC_URL = "/static/"

STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"

MEDIA_ROOT = BASE_DIR / "media"


# --------------------------------------------------
# EMAIL
# --------------------------------------------------

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")

EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))

EMAIL_USE_TLS = (
    os.getenv("EMAIL_USE_TLS", "True").strip().lower()
    in {"true", "1", "yes", "on"}
)

EMAIL_USE_SSL = (
    os.getenv("EMAIL_USE_SSL", "False").strip().lower()
    in {"true", "1", "yes", "on"}
)

if EMAIL_USE_TLS and EMAIL_USE_SSL:
    raise ImproperlyConfigured(
        "EMAIL_USE_TLS and EMAIL_USE_SSL cannot both be enabled."
    )

EMAIL_TIMEOUT = 20

EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")

EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")

DEFAULT_FROM_EMAIL = os.getenv(
    "DEFAULT_FROM_EMAIL",
    EMAIL_HOST_USER or "webmaster@localhost",
)

SERVER_EMAIL = DEFAULT_FROM_EMAIL


# --------------------------------------------------
# PAYSTACK
# --------------------------------------------------

PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY", "")

PAYSTACK_BASE_URL = os.getenv(
    "PAYSTACK_BASE_URL",
    "https://api.paystack.co",
)

PAYSTACK_CURRENCY = os.getenv("PAYSTACK_CURRENCY", "GHS")


# --------------------------------------------------
# PRODUCTION-ONLY SECURITY SETTINGS
# --------------------------------------------------

if not DEBUG:
    # Redirect HTTP requests to HTTPS.
    # Your production host must have HTTPS configured first.
    SECURE_SSL_REDIRECT = True

    # Secure cookies should only be sent over HTTPS.
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    # Begin with a short HSTS period.
    # Increase this after HTTPS has been verified in production.
    SECURE_HSTS_SECONDS = 3600

    SECURE_HSTS_INCLUDE_SUBDOMAINS = False
    SECURE_HSTS_PRELOAD = False

    # Additional browser security headers.
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"
    SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"


# --------------------------------------------------
# DEFAULT PRIMARY KEY
# --------------------------------------------------

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
