/**
 * FairWork Setu - Structured Notification Template Library
 * Contains personality-driven message templates across 5 categories, 5 tones,
 * and 3 languages (English, Hindi, Marathi).
 * 
 * Setu's personality:
 * - Playful like Swiggy/Zomato (culturally warm, humorous, Indian worker idioms)
 * - Useful like Google Pay (fast, clear financial nudges)
 * - Genuinely caring (respectful of gig & informal workers' hard daily lives)
 */

import type {
  NotificationCategory,
  NotificationTone,
  NotificationLanguage,
  NotificationTemplate,
} from '../types/notification';

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  // =========================================================================
  // CATEGORY A: MONEY — PLAYFUL FINANCIAL NUDGES
  // =========================================================================
  {
    id: 'money_evening_expense_playful_1',
    category: 'money',
    tone: 'playful',
    dedupKeyPrefix: 'money_daily_expense',
    deepLink: '/dhan?action=add-expense',
    title: {
      en: 'Setu Dhan • Where did the cash go? 👀',
      hi: 'सेतू धन • पैसा आया, पर गया कहाँ? 👀',
      mr: 'सेतू धन • पैसे आले, पण गेले कुठे? 👀',
    },
    body: {
      en: 'Money came in, but where did it go? 👀 Log today’s expense in 10 seconds, boss!',
      hi: 'पैसा आया, पर गया कहाँ? 👀 आज का खर्चा ऐड कर दो, बॉस!',
      mr: 'पैसे आले, पण गेले कुठे? 👀 आजचा खर्च फक्त १० सेकंदात नोंदवा, बॉस!',
    },
    actionLabel: {
      en: 'Add Expense (10s)',
      hi: 'खर्चा जोड़ें (10s)',
      mr: 'खर्च नोंदवा (10s)',
    },
  },
  {
    id: 'money_evening_expense_playful_2',
    category: 'money',
    tone: 'playful',
    dedupKeyPrefix: 'money_daily_expense',
    deepLink: '/dhan?action=add-expense',
    title: {
      en: 'Setu Dhan • Hisaab-Kitab Time! 💸',
      hi: 'सेतू धन • हिसाब-किताब का समय! 💸',
      mr: 'सेतू धन • हिशोब-किताबाची वेळ! 💸',
    },
    body: {
      en: 'Time to square up today’s earnings and expenses, boss? 💸 Ledger is waiting!',
      hi: 'आज की कमाई का हिसाब हो जाए, बॉस? 💸 सिर्फ 10 सेकंड लगेंगे!',
      mr: 'आजच्या कमाईचा हिशोब होऊन जाऊ द्या, बॉस? 💸 फक्त १० सेकंद लागतील!',
    },
    actionLabel: {
      en: 'Log Today’s Cash',
      hi: 'आज का हिसाब लिखें',
      mr: 'आजचा हिशोब लिहा',
    },
  },
  {
    id: 'money_savings_nudge_caring_1',
    category: 'money',
    tone: 'caring',
    dedupKeyPrefix: 'money_savings_nudge',
    deepLink: '/dhan',
    title: {
      en: 'Setu Dhan • Future You Says Thank You 💚',
      hi: 'सेतू धन • कल का आप शुक्रिया बोलेगा 💚',
      mr: 'सेतू धन • उद्याचा तुम्ही थँक यू म्हणाल 💚',
    },
    body: {
      en: 'Even if you tuck away ₹50 today, tomorrow’s Setu and your family will thank you. 💚',
      hi: '₹50 भी बचाओगे, तो कल का सेतू तुम्हें थैंक यू बोलेगा। 💚',
      mr: 'आज ₹५० जरी वाचवले, तरी उद्याचा सेतू तुम्हाला थँक यू म्हणेल. 💚',
    },
    actionLabel: {
      en: 'Check Savings Goal',
      hi: 'बचत लक्ष्य देखें',
      mr: 'बचत उद्दिष्ट पाहा',
    },
  },
  {
    id: 'money_small_expense_witty_1',
    category: 'money',
    tone: 'witty',
    dedupKeyPrefix: 'money_daily_expense',
    deepLink: '/dhan?action=add-expense',
    title: {
      en: 'Setu Dhan • Chai, Petrol or Parts? ☕',
      hi: 'सेतू धन • चाय, पेट्रोल या स्पेयर पार्ट्स? ☕',
      mr: 'सेतू धन • चहा, पेट्रोल की स्पेअर पार्ट्स? ☕',
    },
    body: {
      en: 'Tiny expense, huge clarity for your cashflow. Log it in 10 seconds before tea gets cold!',
      hi: 'छोटा सा खर्च, बड़े काम का रिकॉर्ड। चाय ठंडी होने से पहले 10 सेकंड में लिखें!',
      mr: 'छोटासा खर्च, मोठा फायदा! चहा थंड होण्यापूर्वी १० सेकंदात नोंदवून घ्या.',
    },
    actionLabel: {
      en: 'Quick Record',
      hi: 'तुरंत लिखें',
      mr: 'झटपट नोंदवा',
    },
  },
  {
    id: 'money_professional_1',
    category: 'money',
    tone: 'professional',
    dedupKeyPrefix: 'money_daily_expense',
    deepLink: '/dhan',
    title: {
      en: 'Setu Financial Ledger • Daily Close',
      hi: 'सेतू वित्तीय बहीखाता • दैनिक प्रविष्टि',
      mr: 'सेतू आर्थिक वहीखाते • दैनिक नोंद',
    },
    body: {
      en: 'Please record today’s income and business expenses to maintain your automated cashflow forecast.',
      hi: 'स्वचालित वित्तीय पूर्वानुमान अद्यतित रखने के लिए कृपया आज की कमाई और व्यय दर्ज करें।',
      mr: 'स्वयंचलित आर्थिक अंदाज अचूक राहण्यासाठी कृपया आजची कमाई आणि खर्च नोंदवा.',
    },
    actionLabel: {
      en: 'Open Ledger',
      hi: 'बहीखाता खोलें',
      mr: 'वहीखाते उघडा',
    },
  },
  {
    id: 'money_motivational_1',
    category: 'money',
    tone: 'motivational',
    dedupKeyPrefix: 'money_savings_nudge',
    deepLink: '/dhan',
    title: {
      en: 'Setu Dhan • Every Rupee Unlocks Freedom 🚀',
      hi: 'सेतू धन • हर रुपया तरक्की की ओर 🚀',
      mr: 'सेतू धन • प्रत्येक रुपया प्रगतीकडे 🚀',
    },
    body: {
      en: 'Your hard-earned savings target is within reach! Check this week’s progress right now.',
      hi: 'आपकी मेहनत की बचत का लक्ष्य बहुत पास है! इस हफ्ते की प्रगति अभी देखें।',
      mr: 'तुमच्या कष्टाच्या बचतीचे उद्दिष्ट खूप जवळ आहे! या आठवड्याची प्रगती लगेच पाहा.',
    },
    actionLabel: {
      en: 'View Progress',
      hi: 'प्रगति देखें',
      mr: 'प्रगती पाहा',
    },
  },

  // =========================================================================
  // CATEGORY B: WORK — YOUR OPPORTUNITY BUDDY
  // =========================================================================
  {
    id: 'work_job_match_playful_1',
    category: 'work',
    tone: 'playful',
    requiresRealEvent: true,
    dedupKeyPrefix: 'work_job_match',
    deepLink: '/kaam?tab=jobs',
    title: {
      en: 'Setu Kaam • Oye! Matching gig spotted 👀',
      hi: 'सेतू काम • ओए! एक नया काम मिला है 👀',
      mr: 'सेतू काम • अरे वा! जुळणारे काम मिळाले 👀',
    },
    body: {
      en: 'Oye {name}! 👀 Found a new gig matching your skills in {trade}. Take a look before it fills up!',
      hi: 'ओए {name}! 👀 आपके हुनर से मैच करता एक नया काम मिला है। किसी और से पहले चेक कर लो!',
      mr: 'अरे {name}! 👀 तुमच्या कौशल्यांशी जुळणारे एक नवीन काम उपलब्ध आहे. लगेच तपासा!',
    },
    actionLabel: {
      en: 'Check Matching Job',
      hi: 'मैचिंग जॉब देखें',
      mr: 'जुळणारे काम पाहा',
    },
  },
  {
    id: 'work_customer_booking_caring_1',
    category: 'work',
    tone: 'caring',
    requiresRealEvent: true,
    dedupKeyPrefix: 'work_customer_booking',
    deepLink: '/kaam?tab=requests',
    title: {
      en: 'Setu Kaam • Customer Booking Request 🔔',
      hi: 'सेतू काम • ग्राहक की सेवा रिक्वेस्ट 🔔',
      mr: 'सेतू काम • ग्राहकाची सेवा विनंती 🔔',
    },
    body: {
      en: 'A verified customer in {locality} requested your {trade} service. Confirm your slot to secure pay!',
      hi: '{locality} से एक ग्राहक ने आपकी {trade} सेवा की रिक्वेस्ट भेजी है। काम पक्का करने के लिए टैप करें!',
      mr: '{locality} मधून एका ग्राहकाने तुमच्या {trade} सेवेची विनंती केली आहे. काम निश्चित करण्यासाठी टॅप करा!',
    },
    actionLabel: {
      en: 'View Request',
      hi: 'रिक्वेस्ट देखें',
      mr: 'विनंती पाहा',
    },
  },
  {
    id: 'work_check_jobs_motivational_1',
    category: 'work',
    tone: 'motivational',
    dedupKeyPrefix: 'work_check_jobs',
    deepLink: '/kaam?tab=jobs',
    title: {
      en: 'Setu Kaam • New Opportunities Waiting 🚀',
      hi: 'सेतू काम • नए अवसर आपकी राह देख रहे हैं 🚀',
      mr: 'सेतू काम • नवीन संधी तुमची वाट पाहत आहेत 🚀',
    },
    body: {
      en: 'On the lookout for new orders? Fresh verified gigs matching your location are live now!',
      hi: 'काम की तलाश जारी है? चलो, अपने शहर के ताज़ा और सत्यापित काम चेक करें!',
      mr: 'कामाचा शोध सुरू आहे? चला, तुमच्या भागातील नवीन आणि खात्रीशीर कामे पाहूया!',
    },
    actionLabel: {
      en: 'Browse Gigs',
      hi: 'काम चेक करें',
      mr: 'कामे पाहा',
    },
  },
  {
    id: 'work_professional_1',
    category: 'work',
    tone: 'professional',
    dedupKeyPrefix: 'work_check_jobs',
    deepLink: '/kaam',
    title: {
      en: 'Setu Marketplace • Verified Gigs Available',
      hi: 'सेतू मार्केटप्लेस • सत्यापित काम उपलब्ध',
      mr: 'सेतू मार्केटप्लेस • खात्रीशीर कामे उपलब्ध',
    },
    body: {
      en: 'New verified trade listings have been posted in your operational area. Review opportunities.',
      hi: 'आपके कार्यक्षेत्र में नए सत्यापित काम पोस्ट किए गए हैं। कृपया विवरण देखें।',
      mr: 'तुमच्या भागात नवीन खात्रीशीर कामांची नोंद झाली आहे. कृपया तपशील पाहा.',
    },
    actionLabel: {
      en: 'Review Listings',
      hi: 'विवरण देखें',
      mr: 'तपशील पाहा',
    },
  },

  // =========================================================================
  // CATEGORY C: HEALTH — CARING, NEVER PREACHY
  // =========================================================================
  {
    id: 'health_hydration_playful_1',
    category: 'health',
    tone: 'playful',
    dedupKeyPrefix: 'health_hydration',
    deepLink: '/sehat',
    title: {
      en: 'Setu Sehat • Boss, water break? 💧',
      hi: 'सेतू सेहत • बॉस, पानी पिया या बस काम? 💧',
      mr: 'सेतू सेहत • बॉस, पाणी प्यायले का? 💧',
    },
    body: {
      en: 'Boss, did you drink water or just work work work? 💧 Keep that bottle close and stay sharp!',
      hi: 'बॉस, पानी पिया या बस काम ही काम? 💧 पानी की बोतल साथ रखो और तरोताज़ा रहो!',
      mr: 'बॉस, पाणी प्यायले की फक्त कामच काम? 💧 पाण्याची बाटली जवळ ठेवा आणि ताजेतवाने राहा!',
    },
    actionLabel: {
      en: 'Health Tips',
      hi: 'सेहत टिप्स देखें',
      mr: 'आरोग्य टिप्स पाहा',
    },
  },
  {
    id: 'health_rest_caring_1',
    category: 'health',
    tone: 'caring',
    dedupKeyPrefix: 'health_rest',
    deepLink: '/sehat',
    title: {
      en: 'Setu Sehat • You Are Not a Machine 💚',
      hi: 'सेतू सेहत • आप मशीन नहीं हो 💚',
      mr: 'सेतू सेहत • तुम्ही मशीन नाही आहात 💚',
    },
    body: {
      en: 'A short 5-minute rest in the shade is important. You are human, not a machine. Take care! 💚',
      hi: 'थोड़ा आराम भी ज़रूरी है, दोस्त। आप मशीन नहीं हो। 5 मिनट की छाँव लीजिए। 💚',
      mr: 'थोड्या विश्रांतीची गरज प्रत्येकाला असते. तुम्ही मशीन नाही आहात. ५ मिनिटे सावलीत बसा. 💚',
    },
    actionLabel: {
      en: 'Wellness Guide',
      hi: 'आराम गाइड',
      mr: 'मार्गदर्शन पाहा',
    },
  },
  {
    id: 'health_heat_safety_witty_1',
    category: 'health',
    tone: 'witty',
    dedupKeyPrefix: 'health_heat',
    deepLink: '/sehat',
    title: {
      en: 'Setu Sehat • Sun is in Full Form ☀️',
      hi: 'सेतू सेहत • धूप अपने पूरे फॉर्म में है ☀️',
      mr: 'सेतू सेहत • ऊन खूप कडक आहे ☀️',
    },
    body: {
      en: 'Afternoon sun is blazing! Park in the shade, sip ORS or water, and keep your helmet cool.',
      hi: 'धूप बहुत तेज़ है! छाँव में गाड़ी पार्क करें, पानी पिएँ और बीच-बीच में छोटा ब्रेक लें।',
      mr: 'दुपारचे ऊन खूप कडक आहे! सावलीत थांबा, पाणी प्या आणि मध्ये थोडा ब्रेक घेत राहा.',
    },
    actionLabel: {
      en: 'Heat Protocol',
      hi: 'धूप से बचाव',
      mr: 'उन्हापासून रक्षण',
    },
  },
  {
    id: 'health_schemes_professional_1',
    category: 'health',
    tone: 'professional',
    dedupKeyPrefix: 'health_schemes',
    deepLink: '/sehat',
    title: {
      en: 'Setu Sehat • Ayushman PM-JAY & Free Clinics',
      hi: 'सेतू सेहत • आयुष्मान भारत और सरकारी क्लिनिक',
      mr: 'सेतू सेहत • आयुष्मान भारत आणि सरकारी दवाखाने',
    },
    body: {
      en: 'Verified zero-cost public dispensaries and Ayushman coverage are available in your district.',
      hi: 'आपके ज़िले में सत्यापित मुफ़्त सरकारी औषधालय और आयुष्मान भारत सुविधाएँ उपलब्ध हैं।',
      mr: 'तुमच्या जिल्ह्यात मोफत सरकारी दवाखाने आणि आयुष्मान भारत सुविधा उपलब्ध आहेत.',
    },
    actionLabel: {
      en: 'Locate Clinics',
      hi: 'क्लिनिक खोजें',
      mr: 'दवाखाने शोधा',
    },
  },

  // =========================================================================
  // CATEGORY D: SKILLS — TINY MOTIVATION
  // =========================================================================
  {
    id: 'skills_microlearning_playful_1',
    category: 'skills',
    tone: 'playful',
    dedupKeyPrefix: 'skills_microlearning',
    deepLink: '/kaushal',
    title: {
      en: 'Setu Kaushal • 5 Minutes for Future You ✨',
      hi: 'सेतू कौशल • 5 मिनट कुछ नया सीखें? ✨',
      mr: 'सेतू कौशल • ५ मिनिटे नवीन काहीतरी शिकूया? ✨',
    },
    body: {
      en: 'Spend 5 minutes learning a new trick today? Future you will thank you with higher daily rates! ✨',
      hi: 'आज 5 मिनट कुछ नया सीखें? फ्यूचर वाला आप खुश होगा और कमाई भी बढ़ेगी! ✨',
      mr: 'आज ५ मिनिटे नवीन काहीतरी शिकूया का? भविष्यातील तुम्ही नक्कीच खुश व्हाल! ✨',
    },
    actionLabel: {
      en: 'Start 5-Min Tip',
      hi: '5 मिनट सीखें',
      mr: '५ मिनिटात शिका',
    },
  },
  {
    id: 'skills_course_unlock_motivational_1',
    category: 'skills',
    tone: 'motivational',
    requiresRealEvent: true,
    dedupKeyPrefix: 'skills_course_unlock',
    deepLink: '/kaushal',
    title: {
      en: 'Setu Kaushal • Skill Upgrade Waiting 🚀',
      hi: 'सेतू कौशल • नया हुनर = नए मौके 🚀',
      mr: 'सेतू कौशल • नवीन कौशल्य = नवीन संधी 🚀',
    },
    body: {
      en: 'One new certified skill in {skillName} can unlock up to 35% higher earning gigs. Ready?',
      hi: 'एक नया हुनर = काम के नए मौके! {skillName} का अगला लेवल अनलॉक करने के लिए तैयार?',
      mr: 'एक नवीन कौशल्य = कामाच्या नवीन संधी! {skillName} चा पुढचा टप्पा गाठायला तयार?',
    },
    actionLabel: {
      en: 'View Skill Passport',
      hi: 'कौशल्य पासपोर्ट देखें',
      mr: 'कौशल्य पासपोर्ट पाहा',
    },
  },
  {
    id: 'skills_professional_1',
    category: 'skills',
    tone: 'professional',
    dedupKeyPrefix: 'skills_microlearning',
    deepLink: '/kaushal',
    title: {
      en: 'Setu Skills • Government NSDC / PMKVY Courses',
      hi: 'सेतू कौशल • सरकारी NSDC / PMKVY कोर्स',
      mr: 'सेतू कौशल • सरकारी NSDC / PMKVY कोर्सेस',
    },
    body: {
      en: 'Certified vocational training pathways aligned with your trade are available for enrollment.',
      hi: 'आपके व्यवसाय से संबंधित प्रमाणित व्यावसायिक प्रशिक्षण कार्यक्रम उपलब्ध हैं।',
      mr: 'तुमच्या व्यवसायाशी संबंधित अधिकृत व्यावसायिक प्रशिक्षण कोर्सेस उपलब्ध आहेत.',
    },
    actionLabel: {
      en: 'Browse Modules',
      hi: 'कोर्स देखें',
      mr: 'कोर्सेस पाहा',
    },
  },

  // =========================================================================
  // CATEGORY E: RIGHTS — YOUR PERSONAL ADVOCATE
  // =========================================================================
  {
    id: 'rights_advocate_playful_1',
    category: 'rights',
    tone: 'playful',
    dedupKeyPrefix: 'rights_knowledge',
    deepLink: '/haq',
    title: {
      en: 'Haq Setu • Know Your Legal Power, Boss! 💪',
      hi: 'हक़ सेतू • अपने हक़ जानना भी ज़रूरी है, बॉस! 💪',
      mr: 'हक्क सेतू • आपले हक्क जाणून घेणे गरजेचे आहे, बॉस! 💪',
    },
    body: {
      en: 'Knowing your rights is as important as daily earnings, boss! 💪 Code on Social Security 2020 explained simply.',
      hi: 'अपने हक़ जानना भी ज़रूरी है, बॉस! 💪 आपकी मेहनत, आपका हक़ — पूरी जानकारी अपने पास रखें।',
      mr: 'आपले हक्क जाणून घेणे हे कमाईइतकेच महत्त्वाचे आहे, बॉस! 💪 माहिती जवळ ठेवा, निर्धास्त राहा.',
    },
    actionLabel: {
      en: 'Read My Rights',
      hi: 'हक़ पढ़ें',
      mr: 'हक्क वाचा',
    },
  },
  {
    id: 'rights_deactivation_caring_1',
    category: 'rights',
    tone: 'caring',
    dedupKeyPrefix: 'rights_deactivation',
    deepLink: '/haq?view=deactivation_wizard',
    title: {
      en: 'Haq Setu • Account Blocked or Notice? 🛡️',
      hi: 'हक़ सेतू • अकाउंट ब्लॉक या नोटिस आया? 🛡️',
      mr: 'हक्क सेतू • खाते ब्लॉक किंवा नोटीस आली? 🛡️',
    },
    body: {
      en: 'Sudden platform deactivation without explanation is unfair. Review your legal review options on Setu.',
      hi: 'प्लेटफ़ॉर्म ने बिना सूचना अकाउंट ब्लॉक किया? अपने कानूनी अधिकार और अपील के विकल्प समझें।',
      mr: 'अचानक खाते ब्लॉक झाले का? तुमचे कायदेशीर अधिकार आणि दाद मागण्याचे पर्याय समजून घ्या.',
    },
    actionLabel: {
      en: 'Deactivation Help',
      hi: 'मदद प्राप्त करें',
      mr: 'मदत मिळवा',
    },
  },
  {
    id: 'rights_professional_1',
    category: 'rights',
    tone: 'professional',
    dedupKeyPrefix: 'rights_knowledge',
    deepLink: '/haq?view=rights',
    title: {
      en: 'Haq Setu • Statutory Entitlements',
      hi: 'हक़ सेतू • वैधानिक सामाजिक सुरक्षा अधिकार',
      mr: 'हक्क सेतू • कायदेशीर सामाजिक सुरक्षा अधिकार',
    },
    body: {
      en: 'Explore statutory provisions under the Code on Social Security 2020 covering gig and platform workers.',
      hi: 'गिग और प्लेटफ़ॉर्म श्रमिकों के लिए सामाजिक सुरक्षा संहिता 2020 के कानूनी प्रावधान देखें।',
      mr: 'गिग आणि असंघटित कामगारांसाठी सामाजिक सुरक्षा संहिता २०२० अंतर्गत कायदेशीर तरतुदी पाहा.',
    },
    actionLabel: {
      en: 'View Legal Code',
      hi: 'कानूनी संहिता देखें',
      mr: 'कायदेशीर संहिता पाहा',
    },
  },
];

/**
 * Selects an appropriate template matching category, user's preferred tone, and language.
 * Rotates messages if multiple templates match to avoid robotic repetition.
 */
export function selectNotificationTemplate(
  category: NotificationCategory,
  preferredTone: NotificationTone,
  lang: NotificationLanguage = 'en',
  vars: Record<string, string | number> = {}
): {
  template: NotificationTemplate;
  title: string;
  body: string;
  actionLabel: string;
  deepLink: string;
} {
  // 1. Try matching both category and preferred tone
  let matching = NOTIFICATION_TEMPLATES.filter(
    (t) => t.category === category && t.tone === preferredTone
  );

  // 2. Fallback to any template in category if preferred tone not present
  if (matching.length === 0) {
    matching = NOTIFICATION_TEMPLATES.filter((t) => t.category === category);
  }

  // 3. Fallback to first template in library if category empty
  const template = matching.length > 0 ? matching[Math.floor(Math.random() * matching.length)] : NOTIFICATION_TEMPLATES[0];

  // 4. Interpolate variables into title and body
  const rawTitle = template.title[lang] || template.title.en;
  const rawBody = template.body[lang] || template.body.en;
  const rawAction = template.actionLabel[lang] || template.actionLabel.en;

  const interpolate = (text: string) => {
    let out = text;
    for (const [key, val] of Object.entries(vars)) {
      out = out.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
    }
    // Clean remaining placeholders if any
    return out.replace(/\{[a-zA-Z0-9_]+\}/g, '');
  };

  return {
    template,
    title: interpolate(rawTitle),
    body: interpolate(rawBody),
    actionLabel: interpolate(rawAction),
    deepLink: template.deepLink,
  };
}
