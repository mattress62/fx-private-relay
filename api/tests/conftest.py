"""Shared fixtures for API tests."""

from django.contrib.auth.models import User
from django.contrib.sites.models import Site

import pytest
from allauth.socialaccount.models import SocialApp
from model_bakery import baker
from rest_framework.test import APIClient

from emails.tests.models_tests import make_free_test_user, make_premium_test_user


@pytest.fixture
def free_user(db: None) -> User:
    return make_free_test_user()


@pytest.fixture
def free_api_client(free_user: User) -> APIClient:
    """Return an APIClient for a newly created free user."""
    client = APIClient()
    client.force_authenticate(user=free_user)
    return client


@pytest.fixture
def premium_user(db: None) -> User:
    premium_user = make_premium_test_user()
    premium_profile = premium_user.profile
    premium_profile.subdomain = "premium"
    premium_profile.save()
    return premium_user


@pytest.fixture
def prem_api_client(premium_user: User) -> APIClient:
    """Return an APIClient for a newly created premium user."""
    client = APIClient()
    client.force_authenticate(user=premium_user)
    return client


@pytest.fixture
def fxa_social_app(db: None) -> SocialApp:
    app: SocialApp = baker.make(SocialApp, provider="fxa", sites=[Site.objects.first()])
    return app
