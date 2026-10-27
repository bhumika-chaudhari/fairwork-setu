#!/usr/bin/env python3
"""
Test Suite for FairWork Setu Model 8: Multi-Dialect Symptom Triage, Generic Prescriptions & Welfare Grounding.
Verifies all 10 clinical queries end-to-end against ml_service.health_service and ai_models_service.
"""

import sys
from pathlib import Path

# Add ml_service to path
ML_SERVICE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ML_SERVICE_DIR))

from health_service import AskHealthPayload, ask_health_assistant, classify_health_intent, get_clinical_triage_response
from ai_models_service import ai_models_service

def run_tests():
    print("=" * 70)
    print("🧪 FAIRWORK SETU MODEL 8: MULTI-DIALECT HEALTH & WELFARE RAG TEST SUITE")
    print("=" * 70)

    # Test 1: Cold, Cough & Sore Throat
    q1 = "mere ko thoda jukam hai aur naak beh rahi hai"
    r1 = ask_health_assistant(AskHealthPayload(question=q1))
    ans1 = r1["answer"].lower()
    assert "lukewarm water" in ans1 or "steam inhalation" in ans1 or "gargle" in ans1, "Failed Q1 self-care"
    assert "paracetamol" in ans1 and "cetirizine" in ans1, "Failed Q1 generic medicines"
    assert "₹5" in r1["answer"] and "₹8" in r1["answer"], "Failed Q1 pricing"
    assert r1.get("isEmergency") is False, "Q1 should not be emergency"
    print("✅ Test 1 Passed: Cold/Cough triage with Jan Aushadhi generic options & shift care verified.")

    # Test 2: Dehydration & Heat Stress
    q2 = "dhoop mein delivery karte waqt dehydration lagra hai"
    r2 = ask_health_assistant(AskHealthPayload(question=q2))
    ans2 = r2["answer"].lower()
    assert "shade" in ans2 and ("ors" in ans2 or "electrolyte" in ans2), "Failed Q2 shift protocol"
    assert "₹4" in r2["answer"] or "₹5" in r2["answer"], "Failed Q2 ORS pricing"
    assert "108" in r2["answer"] and "heat stroke" in ans2, "Failed Q2 heat stroke warning"
    assert r2.get("isEmergency") is False, "Q2 should not be emergency"
    print("✅ Test 2 Passed: Dehydration protocol with ORS pricing & 108 heat-stroke alert verified.")

    # Test 3: Viral Fever & Body Ache
    q3 = "kal raat se tez bukhar aur badan dard hai"
    r3 = ask_health_assistant(AskHealthPayload(question=q3))
    ans3 = r3["answer"].lower()
    assert "paracetamol 500mg" in ans3, "Failed Q3 paracetamol"
    assert "aspirin" in ans3 and "dengue" in ans3, "Failed Q3 critical Dengue NSAID warning"
    assert "uphc" in ans3 or "primary health centre" in ans3, "Failed Q3 clinic referral"
    assert r3.get("isEmergency") is False, "Q3 should not be emergency"
    print("✅ Test 3 Passed: Viral fever triage with Dengue NSAID safety warning verified.")

    # Test 4: Digestive Upset, Acidity & Food Poisoning
    q4 = "subah se pet me marod aur loose motion ho rahe hain"
    r4 = ask_health_assistant(AskHealthPayload(question=q4))
    ans4 = r4["answer"].lower()
    assert "ors" in ans4 and ("khichdi" in ans4 or "curd" in ans4 or "bland" in ans4), "Failed Q4 diet & hydration"
    assert "pantoprazole" in ans4 or "omeprazole" in ans4 or "antacid" in ans4, "Failed Q4 antacid"
    assert "blood" in ans4, "Failed Q4 red flags"
    assert r4.get("isEmergency") is False, "Q4 should not be emergency"
    print("✅ Test 4 Passed: Digestive distress with Jan Aushadhi antacids & red flags verified.")

    # Test 5: Musculoskeletal Strain & Rider Ergonomics
    q5 = "din bhar bike chalane se kamar aur gardan me dard hai"
    r5 = ask_health_assistant(AskHealthPayload(question=q5))
    ans5 = r5["answer"].lower()
    assert "cargo" in ans5 or "carrier" in ans5 or "bungee" in ans5, "Failed Q5 rider ergonomics"
    assert "diclofenac" in ans5 or "pain relief gel" in ans5, "Failed Q5 pain relief"
    assert "₹20" in r5["answer"] or "₹25" in r5["answer"], "Failed Q5 pain gel price"
    assert r5.get("isEmergency") is False, "Q5 should not be emergency"
    print("✅ Test 5 Passed: Musculoskeletal ergonomics & Jan Aushadhi pain gel verified.")

    # Test 6: Minor Wounds, Burns & Silencer Injuries
    q6 = "bike ke silencer se pair jal gaya fafola pad gaya"
    r6 = ask_health_assistant(AskHealthPayload(question=q6))
    ans6 = r6["answer"].lower()
    assert "water" in ans6 and "toothpaste" in ans6, "Failed Q6 burn cooling & contraindications"
    assert "silver sulfadiazine" in ans6, "Failed Q6 silver sulfadiazine ointment"
    assert "tetanus" in ans6 or "tt" in ans6, "Failed Q6 tetanus reminder"
    assert r6.get("isEmergency") is False, "Q6 should not be emergency"
    print("✅ Test 6 Passed: Silencer burn protocol with Silver Sulfadiazine & TT booster verified.")

    # Test 7: Generic Medicines & Jan Aushadhi Savings
    q7 = "How can I get generic medicines at 50% discount?"
    r7 = ask_health_assistant(AskHealthPayload(question=q7))
    ans7 = r7["answer"]
    assert "Jan Aushadhi" in ans7 or "PMBJP" in ans7, "Failed Q7 Jan Aushadhi mention"
    assert "Paracetamol" in ans7 and "Cetirizine" in ans7 and "ORS" in ans7, "Failed Q7 price catalog"
    assert "janaushadhi.gov.in" in ans7 or "1800-180-8080" in ans7, "Failed Q7 locator/helpline"
    assert r7.get("isEmergency") is False, "Q7 should not be emergency"
    print("✅ Test 7 Passed: Generic medicines index with exact PMBJP comparison & store locator verified.")

    # Test 8: Critical Red-Flag Emergency (Instant Bypass)
    q8 = "seene mein bahut tez dard ho raha hai aur saans nahi aa rahi"
    r8 = ask_health_assistant(AskHealthPayload(question=q8))
    ans8 = r8["answer"]
    assert r8.get("isEmergency") is True, "Failed Q8 emergency flag"
    assert "108" in ans8 and "112" in ans8, "Failed Q8 emergency dialer numbers"
    print("✅ Test 8 Passed: Critical emergency bypass with instant 108/112 dialer verified.")

    # Test 9: PM-SYM Pension Age Eligibility (Grounded Policy)
    q9 = "Meri umar 44 saal hai, PM-SYM pension mil sakta hai?"
    r9 = ask_health_assistant(AskHealthPayload(question=q9))
    ans9 = r9["answer"].lower()
    assert "18" in ans9 and "40" in ans9, "Failed Q9 age bracket"
    assert "not eligible" in ans9 or "ineligib" in ans9 or "❌" in r9["answer"], "Failed Q9 ineligibility"
    assert "national pension system" in ans9 or "nps" in ans9 or "ppf" in ans9, "Failed Q9 age 40+ alternatives"
    assert r9.get("isEmergency") is False, "Q9 should not be emergency"
    print("✅ Test 9 Passed: Grounded PM-SYM age eligibility & age-40+ alternatives verified.")

    # Test 10: Platform Account Deactivation Protection (Rajasthan Gig Act)
    q10 = "Can a platform deactivate my account without notice?"
    r10 = ask_health_assistant(AskHealthPayload(question=q10))
    ans10 = r10["answer"].lower()
    assert "rajasthan" in ans10 and ("13" in ans10 or "14" in ans10), "Failed Q10 statutory reference"
    assert "14" in ans10 and "notice" in ans10, "Failed Q10 14-day notice requirement"
    assert "tribunal" in ans10 or "grievance" in ans10 or "appeal" in ans10, "Failed Q10 appellate mechanism"
    assert r10.get("isEmergency") is False, "Q10 should not be emergency"
    print("✅ Test 10 Passed: Statutory 14-day notice protection & appellate tribunal verified.")

    print("\n" + "=" * 70)
    print("🎉 ALL 10/10 MODEL 8 MULTI-DIALECT TRIAGE & GROUNDING TESTS PASSED (100%)!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
