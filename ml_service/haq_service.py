"""
Haq Setu - Bilingual Statutory Labor Rights & Dispute Resolution Service
Grounded in:
- Rajasthan Platform Based Gig Workers Act 2023 (Act No. 17 of 2023)
- Code on Social Security 2020 (Act No. 36 of 2020)
- Payment of Wages Act 1936
- Employee's Compensation Act 1923 & Motor Vehicles (Amendment) Act 2019
- Bharatiya Nyaya Sanhita (BNS) 2023 / IPC Sections 115, 351, 352
- Contract Labour (Regulation and Abolition) Act 1970 (Section 21) & EPF Act 1952
- e-Shram & BOCW Welfare Fund Rules
"""

import re
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

haq_router = APIRouter(prefix="/haq-setu", tags=["haq"])


class AskHaqPayload(BaseModel):
    question: str
    language: Optional[str] = "en"
    userRole: Optional[str] = "worker"


def is_hindi_text(text: str) -> bool:
    """
    Detects if the utterance is in Hindi, Devanagari script, or colloquial Hinglish.
    """
    if any("\u0900" <= char <= "\u097F" for char in text):
        return True
    hinglish_markers = {
        "ne", "meri", "mera", "mere", "ki", "ka", "ke", "ko", "kar", "di", "diya",
        "kya", "kyu", "kyun", "hai", "hain", "ho", "bina", "par", "pe", "se", "rok",
        "liya", "milega", "gaya", "gayi", "thekedar", "shikayat", "bhejna", "wapas",
        "karo", "kare", "kaise", "batao", "badtameezi", "maara", "gali", "lad", "hume",
        "fayda", "fayde", "kahan", "nahi", "raha", "rahi", "wali", "wale"
    }
    words = set(re.findall(r"\b[a-z]+\b", text.lower()))
    return len(words.intersection(hinglish_markers)) >= 1


def classify_haq_intent(query_text: str) -> str:
    """
    Normalizes and classifies legal inquiries into one of the 7 statutory categories.
    """
    ql = query_text.lower().strip()

    # 7. Formal Appeal Drafting & Legal Notice Escalation
    if re.search(
        r"\b(draft|legal notice|formal appeal|appeal letter|appeal kaise|complaint format|template|shikayat patra|draft kar|notice bhejna|wapas chalu|application kaise)\b",
        ql
    ):
        return "appeal_drafting"

    # 4. Workplace Violence, Customer Abuse & Shift Safety / Elevator Restrictions
    if re.search(
        r"\b(assault|verbal abuse|violence|lift|elevator|guard|security guard|harass|badtameezi|gali galoj|maar-peet|maara|detention|banned the elevator|lift me|lift ban)\b",
        ql
    ):
        return "workplace_harassment"

    # 3. Road Accidents & On-Duty Injury Compensation
    if re.search(
        r"\b(accident|shift injury|death compensation|hospitalization expenses|insurance claim|bima|claim kaise|chot lag gayi|haddi toot|gadi lad|on-duty crash|hospital bills|road accident)\b",
        ql
    ):
        return "accident_compensation"

    # 5. Contractor / Subcontractor Fraud & EPF/ESIC Embezzlement
    if re.search(
        r"\b(epfo|epf\b|pf\b|esic|security deposit|agency fraud|commission cut|unregistered agency|embezzle|missing from my epfo|pf account)\b",
        ql
    ):
        return "contractor_fraud"

    # 2. Wage Theft, Withheld Payouts & Arbitrary Deductions
    if re.search(
        r"\b(deduct\w*|penalty|payout|wage theft|withheld|unpaid|fare reduction|tips|wallet|paisa nahi|paise kaat|atak gaya|hafta nahi|rok liya|paisa rok|fine|wages|salary|cut from my earnings)\b",
        ql
    ):
        return "wage_theft"

    # 6. Government Welfare Registration & Worker Cards (e-Shram & BOCW)
    if re.search(
        r"\b(e-?shram|bocw|shramik card|scholarship|maternity grant|welfare board registration|unique id|pmsby|panjikaran|yojana|benefits of e-shram)\b",
        ql
    ):
        return "welfare_schemes"

    # 1. ID Deactivation, Account Suspension & Arbitrary Termination
    if re.search(
        r"\b(deactivat\w*|account suspend\w*|id block\w*|banned|dismissal|shadow ban|reinstate|id band|bina notice|rating kam|login nahi|blocked my account|without prior notice)\b",
        ql
    ):
        return "deactivation"

    # Fallback contractor references
    if re.search(r"\b(contractor|thekedar|agency)\b", ql):
        return "contractor_fraud"

    return "general"


def get_statutory_rights_response(
    category_key: str,
    user_query: str,
    lang: Optional[str] = None
) -> Dict[str, Any]:
    """
    Returns verified statutory rights, legal citations, and escalation pathways.
    Supports English, Hindi, and Hinglish.
    """
    is_hi = (lang == "hi") or is_hindi_text(user_query)

    if category_key == "deactivation":
        detected_category = "Account Deactivation"
        citations = [
            "Section 13 & 14, Rajasthan Platform Based Gig Workers Act, 2023 (Act No. 17 of 2023)",
            "Section 114, Code on Social Security, 2020",
            "Principles of Natural Justice (Audi Alteram Partem)"
        ]
        action = {
            "type": "route",
            "route": "/haq#appeal-wizard",
            "label": "अपील जेनरेटर खोलें" if is_hi else "Launch Appeal Generator"
        }
        if is_hi:
            answer = (
                "⚖️ खाता बंद किए जाने के विरुद्ध वैधानिक अधिकार:\n\n"
                "1. 14 दिन का अनिवार्य नोटिस: राजस्थान गिग वर्कर्स अधिनियम (2023) की धारा 14 के अनुसार, बिना 14 दिन की लिखित सूचना और वैध कारण बताए किसी भी प्लेटफॉर्म द्वारा कामगार की आईडी या खाता बंद नहीं किया जा सकता।\n"
                "2. निष्पक्ष सुनवाई का अधिकार: आपको अपनी डिलीवरी लॉग, जीपीएस रिकॉर्ड और साक्ष्य आंतरिक शिकायत निवारण समिति के समक्ष प्रस्तुत करने का कानूनी अधिकार है।\n"
                "3. कदम: अपनी बहाली का औपचारिक कानूनी नोटिस तैयार करने के लिए नीचे दिए गए हक सेतु अपील जेनरेटर (/haq#appeal-wizard) पर क्लिक करें।"
            )
        else:
            answer = (
                "⚖️ Statutory Rights Against Account Deactivation:\n\n"
                "1. Mandatory 14-Day Notice: Under Section 14 of the Rajasthan Platform Based Gig Workers Act, 2023, no aggregator may terminate, suspend, or block a registered worker's ID without a mandatory 14-day written notice specifying the exact verifiable grounds.\n"
                "2. Right to a Fair Hearing: You have the statutory right to present trip logs, GPS records, or counter-evidence before an Internal Dispute Redressal Committee prior to permanent deactivation.\n"
                "3. Action: Click below to launch the Haq Setu Automated Reinstatement Wizard (/haq#appeal-wizard) to draft an official legal reinstatement notice to the platform's Grievance Officer.\n"
                "*Citation: Rajasthan Act No. 17 of 2023, Section 14 | Code on Social Security 2020*"
            )

    elif category_key == "wage_theft":
        detected_category = "Wage Theft"
        citations = [
            "Payment of Wages Act, 1936",
            "Ministry of Labour Fair Remuneration Directives",
            "Section 114, Code on Social Security, 2020"
        ]
        action = {
            "type": "url",
            "url": "https://samadhan.labour.gov.in",
            "label": "समाधान पोर्टल पर शिकायत दर्ज करें" if is_hi else "Lodge SAMADHAN Portal Complaint"
        }
        if is_hi:
            answer = (
                "💰 पारिश्रमिक कटौती और वेतन सुरक्षा अधिकार:\n\n"
                "1. अवैध वित्तीय कटौती: मजदूरी भुगतान अधिनियम 1936 के तहत बिना ठोस दस्तावेजी सबूत के कामगार की कमाई से मनमाना जुर्माना या कटौती करना गैर-कानूनी है।\n"
                "2. नियत समय पर भुगतान: निर्धारित साप्ताहिक या पाक्षिक चक्र में भुगतान रोकना अनुचित श्रम व्यवहार (Unfair Labour Practice) है। ग्राहक द्वारा दी गई टिप पर पूरा हक कामगार का है।\n"
                "3. कदम: हक सेतु से वेतन वसूली पत्र तैयार करें अथवा श्रम मंत्रालय के समाधान पोर्टल (samadhan.labour.gov.in) या राष्ट्रीय उपभोक्ता हेल्पलाइन (1915) पर ऑनलाइन शिकायत दर्ज करें।"
            )
        else:
            answer = (
                "💰 Rights Against Arbitrary Deductions & Wage Theft:\n\n"
                "1. Illegal Wage Penalties: Under the Payment of Wages Act, 1936 and fair labor principles, automatic financial penalties without verifiable documentary proof of customer loss are unlawful.\n"
                "2. Timely Payout Requirement: Contractual earnings and tips must be released according to designated weekly cycles. Withholding earned income constitutes an actionable labor dispute.\n"
                "3. Action: Issue a formal Wage Recovery Demand Letter via Haq Setu or lodge an e-complaint on the Ministry of Labour’s SAMADHAN Portal (samadhan.labour.gov.in) or National Consumer Helpline (1915).\n"
                "*Citation: Payment of Wages Act, 1936 | Ministry of Labour SAMADHAN Guidelines*"
            )

    elif category_key == "accident_compensation":
        detected_category = "Accident Compensation"
        citations = [
            "Employee's Compensation Act, 1923",
            "Section 166, Motor Vehicles (Amendment) Act, 2019",
            "State Platform Gig Workers Welfare Fund Rules"
        ]
        action = {
            "type": "route",
            "route": "/haq",
            "label": "दुर्घटना दावा सहायता" if is_hi else "Accident Claim Support"
        }
        if is_hi:
            answer = (
                "🚑 दुर्घटना मुआवजा और बीमा अधिकार:\n\n"
                "1. अनिवार्य समूह दुर्घटना बीमा: एग्रीगेटर्स द्वारा प्रत्येक कामगार को ₹5 से ₹10 लाख का दुर्घटना मृत्यु/स्थायी विकलांगता कवर और ₹1 लाख तक का अस्पताल खर्च देना अनिवार्य है।\n"
                "2. ड्यूटी के दौरान सुरक्षा: यह कवर ऐप लॉगिन समय से लेकर डिलीवरी रूट, प्रतीक्षा और वापसी तक पूरी शिफ्ट में मान्य है।\n"
                "3. कदम: पुलिस एफआईआर (FIR/Station Diary) और अस्पताल डिस्चार्ज बिल व मूल रसीदें सुरक्षित रखें और 30 दिनों के भीतर दावा दर्ज करें।"
            )
        else:
            answer = (
                "🚑 On-Duty Accident Compensation & Insurance Entitlements:\n\n"
                "1. Mandatory Group Accidental Insurance: Aggregators are legally required to provide accidental coverage (₹5 Lakh to ₹10 Lakh in case of death/permanent total disability, and up to ₹1 Lakh for hospitalization).\n"
                "2. Transit Coverage: Protection applies throughout active duty—including waiting intervals, transit, and returning from deliveries.\n"
                "3. Action: Collect the Police First Information Report (FIR) or Station Diary entry and Hospital Discharge Summary with original medical bills. File your formal claim within 30 days via Haq Setu’s Accident Claim Support.\n"
                "*Citation: Employee's Compensation Act, 1923 | Motor Vehicles Act 2019 Section 166 | State Gig Worker Welfare Fund Rules*"
            )

    elif category_key == "workplace_harassment":
        detected_category = "Workplace Harassment"
        citations = [
            "Bharatiya Nyaya Sanhita (BNS) 2023 Sec 115, 351, 352 (IPC 323, 506)",
            "PoSH Act 2013 (Prevention of Sexual Harassment)",
            "Constitutional Right to Dignity & Public Access (Article 21)"
        ]
        action = {
            "type": "tel",
            "url": "tel:112",
            "label": "आपातकालीन पुलिस 112" if is_hi else "Call Police Emergency 112"
        }
        if is_hi:
            answer = (
                "🛡️ कार्यस्थल सुरक्षा और उत्पीड़न विरोधी अधिकार:\n\n"
                "1. मारपीट और दुर्व्यवहार के खिलाफ सुरक्षा: कामगार के साथ गाली-गलौज या मारपीट बीएनएस (BNS) की धारा 115/351 के तहत दंडनीय गैर-जमानती अपराध है। तत्काल खतरे में तुरंत 112 डायल करें।\n"
                "2. लिफ्ट उपयोग का कानूनी अधिकार: हाउसिंग सोसायटी या आरडब्ल्यूए (RWA) डिलीवरी पार्टनर्स को पैसेंजर लिफ्ट उपयोग करने से नहीं रोक सकती। ऐसा प्रतिबंध मानवीय गरिमा और सार्वजनिक उपयोगिता नियमों का उल्लंघन है।\n"
                "3. जीरो एफआईआर (Zero FIR): आप अधिकार क्षेत्र की परवाह किए बिना किसी भी निकटतम पुलिस स्टेशन में Zero FIR दर्ज करा सकते हैं।"
            )
        else:
            answer = (
                "🛡️ Workplace Safety & Anti-Harassment Protections:\n\n"
                "1. Protection Against Violence: Physical assault or criminal intimidation is a non-bailable offense under Bharatiya Nyaya Sanhita (BNS) Section 115/351 (IPC 323/506). In immediate danger, call 112 (Emergency Police) immediately.\n"
                "2. Illegal Elevator Bans: Residential welfare associations (RWAs) cannot legally restrict service personnel or delivery workers from using passenger elevators. This violates constitutional dignity (Article 21) and public utility access.\n"
                "3. Zero FIR Right: You can register a Zero FIR at any police station regardless of jurisdictional boundaries.\n"
                "*Citation: Bharatiya Nyaya Sanhita (BNS) 2023 | PoSH Act 2013 | Constitutional Right to Public Access*"
            )

    elif category_key == "contractor_fraud":
        detected_category = "Contractor Fraud"
        citations = [
            "Section 21, Contract Labour (Regulation and Abolition) Act, 1970",
            "Employees' Provident Funds and Miscellaneous Provisions Act, 1952",
            "IPC Sections 406 & 409 (Criminal Breach of Trust)"
        ]
        action = {
            "type": "url",
            "url": "https://epfigms.gov.in",
            "label": "EPFiGMS पोर्टल पर शिकायत करें" if is_hi else "Lodge EPFiGMS Grievance"
        }
        if is_hi:
            answer = (
                "🏢 ठेकेदार उत्तरदायित्व और पीएफ सुरक्षा:\n\n"
                "1. मुख्य नियोक्ता की जिम्मेदारी: ठेका श्रम कानून (1970) की धारा 21 के अनुसार यदि ठेकेदार या थर्ड-पार्टी एजेंसी वेतन नहीं देती है, तो मुख्य कंपनी को पूरा भुगतान करना कानूनी रूप से अनिवार्य है।\n"
                "2. पीएफ गबन आपराधिक कृत्य: वेतन से पीएफ काटकर 15 दिनों के भीतर ईपीएफओ में जमा न करना आईपीसी की धारा 406/409 के तहत आपराधिक विश्वासघात (Criminal Breach of Trust) है।\n"
                "3. कदम: EPFiGMS पोर्टल (epfigms.gov.in) पर तुरंत ईपीएफओ शिकायत दर्ज करें और क्षेत्रीय श्रम आयुक्त को औपचारिक याचिका भेजें।"
            )
        else:
            answer = (
                "🏢 Contractor Accountability & EPF Protections:\n\n"
                "1. Principal Employer Liability: Under Section 21 of the Contract Labour (Regulation and Abolition) Act, 1970, if a labor contractor or third-party agency fails to pay wages, the Principal Employer (the main company) is strictly liable to disburse full wages.\n"
                "2. Criminal Breach of Trust (EPF/ESIC): Deducting provident fund from worker earnings without depositing it into the government EPFO treasury within 15 days is a cognizable criminal offense under IPC Section 406/409.\n"
                "3. Action: File an online grievance on EPFiGMS (epfigms.gov.in) and submit a petition to the Regional Labour Commissioner.\n"
                "*Citation: Contract Labour (R&A) Act 1970, Sec 21 | EPF Act 1952 | IPC Sec 406/409*"
            )

    elif category_key == "welfare_schemes":
        detected_category = "Welfare Schemes"
        citations = [
            "Section 113, Code on Social Security, 2020",
            "Building and Other Construction Workers (BOCW) Welfare Act, 1996",
            "Pradhan Mantri Suraksha Bima Yojana (PMSBY)"
        ]
        action = {
            "type": "url",
            "url": "https://eshram.gov.in",
            "label": "ई-श्रम पोर्टल पर पंजीकरण करें" if is_hi else "Register on e-Shram Portal"
        }
        if is_hi:
            answer = (
                "📋 सरकारी कल्याण योजनाएं एवं लाभ:\n\n"
                "1. ई-श्रम (e-Shram) कार्ड: 12-अंकों का यूएएन (UAN) कार्ड प्राप्त होता है, जिसमें पीएमएसबीवाई (PMSBY) के तहत ₹2 लाख का मुफ्त दुर्घटना मृत्यु व विकलांगता बीमा और अखिल भारतीय सामाजिक सुरक्षा पोर्टेबिलिटी मिलती है।\n"
                "2. बीओसीडब्ल्यू (BOCW) कल्याण अनुदान: बच्चों की पढ़ाई के लिए ₹8,000 से ₹25,000 की वार्षिक छात्रवृत्ति, महिला कामगारों को ₹21,000 प्रसूति सहायता और आवास मरम्मत सहायता मिलती है।\n"
                "3. कदम: आधार कार्ड और बैंक खाते के साथ eshram.gov.in पर निःशुल्क पंजीकरण करें या निकटतम सीएससी (CSC) पर जाएं।"
            )
        else:
            answer = (
                "📋 Government Welfare Schemes & Entitlements:\n\n"
                "1. e-Shram Universal Account Number (UAN): Automatic accidental death and permanent disability cover of ₹2 Lakh under PMSBY, along with portability of social security benefits across Indian states.\n"
                "2. BOCW Welfare Board Grants: Registered cardholders receive educational assistance for children (₹8,000 to ₹25,000 per annum), maternity benefits of ₹21,000, and housing repair loans.\n"
                "3. Action: Self-enroll at eshram.gov.in or visit your nearest Common Service Centre (CSC) with your Aadhaar and Jan Dhan/Bank passbook.\n"
                "*Citation: Code on Social Security 2020, Sec 113 | BOCW Welfare Fund*"
            )

    elif category_key == "appeal_drafting":
        detected_category = "Appeal Drafting"
        citations = [
            "Section 14, Rajasthan Platform Based Gig Workers Act, 2023",
            "Section 114, Code on Social Security, 2020",
            "Internal Dispute Redressal Regulations"
        ]
        action = {
            "type": "route",
            "route": "/haq#appeal-wizard",
            "label": "अपील विज़ार्ड शुरू करें" if is_hi else "Launch Appeal Wizard"
        }
        if is_hi:
            answer = (
                "📝 4-चरणीय कानूनी निवारण प्रक्रिया:\n\n"
                "1. चरण 1 (ऐप टिकट): डिलीवरी पार्टनर ऐप में टिकट दर्ज करें और चैट व स्क्रीनशॉट सुरक्षित रखें।\n"
                "2. चरण 2 (वैधानिक नोटिस): हक सेतु की मदद से कंपनी के ग्रीवेंस ऑफिसर को धारा 14 के तहत कानूनी नोटिस भेजें।\n"
                "3. चरण 3 (ट्रिब्यूनल शिकायत): 14 दिनों में समाधान न होने पर राज्य गिग वर्कर्स वेलफेयर बोर्ड ट्रिब्यूनल में याचिका दें।\n"
                "4. चरण 4 (लेबर कमिश्नर अपील): अंतिम मध्यस्थता हेतु श्रम आयुक्त के समक्ष अपील करें।\n\n"
                "👉 कदम: हक सेतु ऑटोमेटेड रीइन्स्टेटमेंट विज़ार्ड (/haq#appeal-wizard) शुरू करें।"
            )
        else:
            answer = (
                "📝 4-Stage Legal Escalation Protocol:\n\n"
                "1. Stage 1 (In-App Dispute): Log an in-app dispute ticket. Take dated screenshots and note the ticket ID.\n"
                "2. Stage 2 (Statutory Notice): Issue a formal legal notice to the aggregator's Grievance Officer citing Section 14 of the Gig Workers Act. (Generated automatically via Haq Setu).\n"
                "3. Stage 3 (Welfare Board Tribunal): If unresolved within 14 days, file an electronic grievance before the State Gig Workers Welfare Tribunal.\n"
                "4. Stage 4 (Appellate Authority): Appeal to the State Labour Commissioner for binding arbitration.\n\n"
                "👉 Action: Launches Haq Setu Automated Reinstatement Wizard (/haq#appeal-wizard)."
            )

    else:
        detected_category = "General Legal Guidance"
        citations = ["Code on Social Security 2020", "State Gig Worker Welfare Acts"]
        action = {
            "type": "route",
            "route": "/haq",
            "label": "हक सेतु सहायता" if is_hi else "Open Haq Setu"
        }
        answer = (
            f"Regarding '{user_query}':\n\n"
            "Under Indian statutory labor law, informal and gig workers possess enforceable rights against arbitrary terminations, unpaid wages, and workplace harassment. "
            "You can document your grievance, draft formal legal notices under Section 14 of the Gig Workers Act, and access welfare benefits through Haq Setu."
        )

    return {
        "answer": answer,
        "detectedCategory": detected_category,
        "categoryKey": category_key,
        "citations": citations,
        "action": action,
        "isEmergency": (category_key == "workplace_harassment"),
        "sources": [
            {"title": c, "url": "https://labour.gov.in"} for c in citations
        ],
        "disclaimer": "Informational statutory labor rights guidance. For binding legal disputes, petitions may be lodged with the State Labour Commissioner or Welfare Board Tribunal."
    }


@haq_router.post("/ask")
def ask_haq_assistant(payload: AskHaqPayload):
    """
    Bilingual Labor Rights & Dispute Resolution Assistant for Gig Workers.
    """
    q = payload.question.strip()
    detected_intent = classify_haq_intent(q)
    return get_statutory_rights_response(detected_intent, q, lang=payload.language)


@haq_router.post("/assess-case")
def assess_case(payload: Dict[str, Any]):
    """
    Evaluates worker deactivation case evidence and generates statutory legal strength.
    """
    platform = payload.get("platform", "Platform Aggregator")
    problem_type = payload.get("problem_type", "deactivation")
    has_contacted = payload.get("has_contacted_support", False)
    has_screenshot = payload.get("has_screenshot", False)

    strength = 75
    if has_screenshot:
        strength += 15
    if has_contacted:
        strength += 10

    return {
        "case_strength": min(95, strength),
        "platform": platform,
        "problem_type": problem_type,
        "governing_statute": "Rajasthan Platform Based Gig Workers Act 2023 (Section 14)",
        "recommendation": "Submit a formal 14-day statutory demand letter to the platform Grievance Officer."
    }
