"""
Test Suite for Model 8 / Haq Setu: Bilingual Statutory Labor Rights & Dispute Resolution
Verifies all 11 benchmark queries across English, Hindi, and Hinglish.
"""

import sys
import unittest
from pathlib import Path

# Add ml_service to path
sys.path.insert(0, str(Path(__file__).parent))

from haq_service import classify_haq_intent, get_statutory_rights_response, is_hindi_text


class TestHaqStatutoryTriage(unittest.TestCase):
    BENCHMARK_CASES = [
        {
            "id": 1,
            "query": "Can a platform deactivate my account without prior notice?",
            "expected_category": "deactivation",
            "expected_lang": "en",
            "expected_citation": "Rajasthan Platform Based Gig Workers Act, 2023",
            "expected_action_route": "/haq#appeal-wizard"
        },
        {
            "id": 2,
            "query": "Company ne bina notice meri ID block kar di",
            "expected_category": "deactivation",
            "expected_lang": "hi",
            "expected_citation": "राजस्थान गिग वर्कर्स अधिनियम",
            "expected_action_route": "/haq#appeal-wizard"
        },
        {
            "id": 3,
            "query": "The platform deducted ₹2,000 fake penalty from my payout",
            "expected_category": "wage_theft",
            "expected_lang": "en",
            "expected_citation": "Payment of Wages Act, 1936",
            "expected_action_url": "https://samadhan.labour.gov.in"
        },
        {
            "id": 4,
            "query": "Thekedar ne 15 din ka kaam karwake paisa rok liya",
            "expected_category": "wage_theft",
            "expected_lang": "hi",
            "expected_citation": "मजदूरी भुगतान अधिनियम 1936",
            "expected_action_url": "https://samadhan.labour.gov.in"
        },
        {
            "id": 5,
            "query": "I had an accident during my delivery shift, how to claim insurance?",
            "expected_category": "accident_compensation",
            "expected_lang": "en",
            "expected_citation": "Employee's Compensation Act, 1923",
            "expected_action_route": "/haq"
        },
        {
            "id": 6,
            "query": "Delivery ke time bike ka accident hua, claim kaise milega?",
            "expected_category": "accident_compensation",
            "expected_lang": "hi",
            "expected_citation": "अनिवार्य समूह दुर्घटना बीमा",
            "expected_action_route": "/haq"
        },
        {
            "id": 7,
            "query": "Gated society security guard assaulted me and banned the elevator",
            "expected_category": "workplace_harassment",
            "expected_lang": "en",
            "expected_citation": "Bharatiya Nyaya Sanhita (BNS) 2023",
            "expected_action_url": "tel:112",
            "is_emergency": True
        },
        {
            "id": 8,
            "query": "Society guard ne lift me jaane se roka aur badtameezi ki",
            "expected_category": "workplace_harassment",
            "expected_lang": "hi",
            "expected_citation": "बीएनएस (BNS)",
            "expected_action_url": "tel:112",
            "is_emergency": True
        },
        {
            "id": 9,
            "query": "Contractor deducted PF but it is missing from my EPFO account",
            "expected_category": "contractor_fraud",
            "expected_lang": "en",
            "expected_citation": "Contract Labour (Regulation and Abolition) Act, 1970",
            "expected_action_url": "https://epfigms.gov.in"
        },
        {
            "id": 10,
            "query": "What are the benefits of e-Shram card for gig delivery riders?",
            "expected_category": "welfare_schemes",
            "expected_lang": "en",
            "expected_citation": "Code on Social Security, 2020",
            "expected_action_url": "https://eshram.gov.in"
        },
        {
            "id": 11,
            "query": "Help me draft a legal notice to reinstate my blocked ID",
            "expected_category": "appeal_drafting",
            "expected_lang": "en",
            "expected_citation": "Rajasthan Platform Based Gig Workers Act, 2023",
            "expected_action_route": "/haq#appeal-wizard"
        }
    ]

    def test_all_11_benchmark_queries(self):
        passed = 0
        for case in self.BENCHMARK_CASES:
            query = case["query"]
            cat = classify_haq_intent(query)
            self.assertEqual(cat, case["expected_category"], f"Failed classification for query: {query}")

            is_hi = is_hindi_text(query)
            expected_hi = (case["expected_lang"] == "hi")
            self.assertEqual(is_hi, expected_hi, f"Failed language detection for query: {query}")

            res = get_statutory_rights_response(cat, query)
            self.assertIn("answer", res)
            self.assertIn("citations", res)
            self.assertIn("action", res)

            # Check citation presence
            citations_str = " ".join(res["citations"]) + " " + res["answer"]
            self.assertIn(case["expected_citation"], citations_str, f"Missing citation in: {query}")

            # Check action target
            if "expected_action_route" in case:
                self.assertEqual(res["action"].get("route"), case["expected_action_route"])
            if "expected_action_url" in case:
                self.assertEqual(res["action"].get("url"), case["expected_action_url"])

            # Check emergency flag
            if case.get("is_emergency"):
                self.assertTrue(res.get("isEmergency"), f"Expected emergency flag for query: {query}")

            passed += 1

        print(f"\n[PASS] Verified {passed}/11 Model 8 Haq Setu statutory benchmark cases with 100% precision.")


if __name__ == "__main__":
    unittest.main()
