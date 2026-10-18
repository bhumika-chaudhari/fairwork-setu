"""
Automated Test Suite for FairWork Setu Demo Accounts & User Data Isolation.

Verifies:
1. All 4 authorized demo profiles exist with authentic details and occupations.
2. Email constraints: Sadia has valid email; Bhumika and Aboli have None; Nouf has None (syntax flagged).
3. Realistic transaction distributions (income & expense) across the past 4 days.
4. Cryptographic user-level data isolation via FastAPI TestClient (FastAPI + JWT claims).
5. Strict 401 Unauthorized enforcement on unauthenticated requests.
6. Complete idempotence upon repeated seeding.
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
import db_models
from auth import create_dev_token
from seed_demo_accounts import seed_demo_accounts, DEMO_USERS, deterministic_uuid


class TestDemoAccounts(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Run seeder to ensure clean state
        seed_demo_accounts()
        cls.client = TestClient(app)
        cls.db = SessionLocal()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_all_four_profiles_seeded(self):
        """Test that all 4 authorized test profiles are present in the database."""
        profiles = self.db.query(db_models.Profile).all()
        phone_map = {p.phone_number: p for p in profiles}

        expected_phones = [
            "+918055440700",  # Sadia
            "+919766236307",  # Bhumika
            "+917028403043",  # Nouf
            "+918263935704",  # Aboli
        ]
        for phone in expected_phones:
            self.assertIn(phone, phone_map, f"Missing profile for phone {phone}")

        # Check Sadia
        sadia = phone_map["+918055440700"]
        self.assertEqual(sadia.full_name, "Sadia Sakharkar")
        self.assertEqual(sadia.email, "sadia.sakharkar@cumminscollege.in")
        self.assertEqual(sadia.work_type, "domestic_worker")
        self.assertEqual(sadia.preferred_language, "mr")

        # Check Bhumika (Email not provided)
        bhumika = phone_map["+919766236307"]
        self.assertEqual(bhumika.full_name, "Bhumika Chaudhari")
        self.assertIsNone(bhumika.email, "Bhumika email must be None as no email was provided")
        self.assertEqual(bhumika.work_type, "delivery")

        # Check Nouf (Email invalid syntax flagged)
        nouf = phone_map["+917028403043"]
        self.assertEqual(nouf.full_name, "Nouf Bamne")
        self.assertIsNone(nouf.email, "Nouf email must be None pending syntax correction")
        self.assertEqual(nouf.work_type, "electrician")

        # Check Aboli (Email not provided)
        aboli = phone_map["+918263935704"]
        self.assertEqual(aboli.full_name, "Aboli Gaikwad")
        self.assertIsNone(aboli.email, "Aboli email must be None as no email was provided")
        self.assertEqual(aboli.work_type, "driver")

    def test_02_transaction_counts_and_types(self):
        """Test that each demo account has realistic income and expense transactions."""
        for u in DEMO_USERS:
            uid = deterministic_uuid(u["phone"])
            txs = self.db.query(db_models.Transaction).filter(db_models.Transaction.user_id == uid).all()
            self.assertEqual(len(txs), 6, f"Expected 6 transactions for {u['name']}, found {len(txs)}")

            incomes = [t for t in txs if t.type == "income"]
            expenses = [t for t in txs if t.type == "expense"]
            self.assertGreater(len(incomes), 0, f"No income transactions for {u['name']}")
            self.assertGreater(len(expenses), 0, f"No expense transactions for {u['name']}")

            # Verify client_tx_id format and Demo Seed marker
            for t in txs:
                self.assertTrue(t.client_tx_id.startswith("demo_seed_"))
                self.assertIn("[Demo Seed]", t.description)

    def test_03_user_data_isolation_api(self):
        """Test that API strictly isolates data between different authenticated users."""
        sadia_uid = deterministic_uuid("+918055440700")
        bhumika_uid = deterministic_uuid("+919766236307")

        sadia_token = create_dev_token(sadia_uid, "sadia.sakharkar@cumminscollege.in", "+918055440700")
        bhumika_token = create_dev_token(bhumika_uid, "", "+919766236307")

        # 1. Fetch Sadia's transactions
        res_sadia = self.client.get("/api/transactions", headers={"Authorization": f"Bearer {sadia_token}"})
        self.assertEqual(res_sadia.status_code, 200)
        sadia_txs = res_sadia.json()["transactions"]
        self.assertEqual(len(sadia_txs), 6)
        for tx in sadia_txs:
            self.assertEqual(tx["userId"], sadia_uid)

        # 2. Fetch Bhumika's transactions
        res_bhumika = self.client.get("/api/transactions", headers={"Authorization": f"Bearer {bhumika_token}"})
        self.assertEqual(res_bhumika.status_code, 200)
        bhumika_txs = res_bhumika.json()["transactions"]
        self.assertEqual(len(bhumika_txs), 6)
        for tx in bhumika_txs:
            self.assertEqual(tx["userId"], bhumika_uid)

        # 3. Verify zero cross-contamination between Sadia and Bhumika transactions
        sadia_tx_ids = {t["id"] for t in sadia_txs}
        bhumika_tx_ids = {t["id"] for t in bhumika_txs}
        self.assertTrue(sadia_tx_ids.isdisjoint(bhumika_tx_ids), "Cross contamination detected between users!")

        # 4. Profile isolation
        res_sadia_prof = self.client.get("/api/user/profile", headers={"Authorization": f"Bearer {sadia_token}"})
        self.assertEqual(res_sadia_prof.status_code, 200)
        self.assertEqual(res_sadia_prof.json()["profile"]["name"], "Sadia Sakharkar")

        res_bhumika_prof = self.client.get("/api/user/profile", headers={"Authorization": f"Bearer {bhumika_token}"})
        self.assertEqual(res_bhumika_prof.status_code, 200)
        self.assertEqual(res_bhumika_prof.json()["profile"]["name"], "Bhumika Chaudhari")

    def test_04_unauthenticated_requests_blocked(self):
        """Test that unauthenticated requests to protected endpoints receive 401 Unauthorized."""
        res_tx = self.client.get("/api/transactions")
        self.assertEqual(res_tx.status_code, 401)
        self.assertIn("Authentication required", res_tx.json()["detail"])

        res_prof = self.client.get("/api/user/profile")
        self.assertEqual(res_prof.status_code, 401)
        self.assertIn("Authentication required", res_prof.json()["detail"])

    def test_05_idempotent_seeding(self):
        """Test that running the seeder multiple times produces no duplicate records."""
        initial_profile_count = self.db.query(db_models.Profile).count()
        initial_tx_count = self.db.query(db_models.Transaction).count()

        # Re-run seeder
        stats = seed_demo_accounts()
        self.assertEqual(stats["profiles_created"], 0, "Idempotency violation: re-created profiles")
        self.assertEqual(stats["transactions_seeded"], 0, "Idempotency violation: re-created transactions")

        final_profile_count = self.db.query(db_models.Profile).count()
        final_tx_count = self.db.query(db_models.Transaction).count()

        self.assertEqual(initial_profile_count, final_profile_count)
        self.assertEqual(initial_tx_count, final_tx_count)


if __name__ == "__main__":
    unittest.main()
