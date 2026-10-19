"""
Unit and Integration Tests for FairWork Setu Account Existence Verification.
Tests POST /api/auth/check-account with registered, unregistered, and edge-case emails.
"""

import os
import sys
import unittest
from fastapi.testclient import TestClient

# Add ml_service to path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from main import app
from database import SessionLocal
from seed_demo_accounts import seed_demo_accounts


class TestAuthCheck(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        seed_demo_accounts()
        cls.client = TestClient(app)
        cls.db = SessionLocal()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_registered_demo_email_returns_exists_true(self):
        """Sadia Sakharkar's authorized email must return exists=True."""
        resp = self.client.post("/api/auth/check-account", json={"email": "sadia.sakharkar@cumminscollege.in"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["email"], "sadia.sakharkar@cumminscollege.in")
        self.assertTrue(data["exists"])
        self.assertTrue(data["registered"])

    def test_02_registered_demo_email_case_insensitive(self):
        """Check must be case-insensitive."""
        resp = self.client.post("/api/auth/check-account", json={"email": "SADIA.SAKHARKAR@CUMMINSCOLLEGE.IN"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["exists"])

    def test_03_unregistered_email_returns_exists_false(self):
        """Unregistered email must strictly return exists=False."""
        resp = self.client.post("/api/auth/check-account", json={"email": "unregistered.worker.999@example.com"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["email"], "unregistered.worker.999@example.com")
        self.assertFalse(data["exists"])
        self.assertFalse(data["registered"])

    def test_04_invalid_or_blank_email_handled_safely(self):
        """Blank or malformed emails must return exists=False without crashing."""
        for invalid in ["", "   ", "not-an-email", "@no-user.com"]:
            resp = self.client.post("/api/auth/check-account", json={"email": invalid})
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertFalse(data["exists"])


if __name__ == "__main__":
    unittest.main()
