import type { Job, WelfareScheme } from '../data/mockData';

export interface SchemeExplanation {
  whatItIs: string;
  whoIsEligible: string;
  keyBenefits: string;
  howToApply: string;
  requiredDocuments: string;
  officialSource: string;
}

/**
 * Verified, comprehensive explanations for Government Welfare Schemes.
 * Strictly uses authentic government portal facts (PM-JAY, e-Shram, DFS).
 */
export const SCHEME_CONTEXTUAL_DATA: Record<string, { en: SchemeExplanation; hi: SchemeExplanation; mr: SchemeExplanation; gu: SchemeExplanation }> = {
  ws001: {
    // Ayushman Bharat (PM-JAY)
    en: {
      whatItIs:
        'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana is the flagship national public health insurance scheme designed to protect informal workers and low-income families from catastrophic medical expenses.',
      whoIsEligible:
        'Eligible unorganized workers, informal gig laborers, and rural or urban families identified in the SECC database or active e-Shram registrations. There is no cap on family size or age of members.',
      keyBenefits:
        'Provides comprehensive cashless and paperless hospitalization coverage of up to 5 lakh rupees per family per year. It covers over 1,900 secondary and tertiary medical treatments, surgical procedures, medicines, and pre- and post-hospitalization costs at over 27,000 empaneled government and private hospitals across India.',
      howToApply:
        'You can check your eligibility online at pmjay.gov.in, call the toll-free helpline 14555, or visit any Common Services Center (CSC) or the Ayushman Mitra helpdesk at an empaneled public hospital to generate your Ayushman Card.',
      requiredDocuments:
        'Aadhaar Card, active Ration Card or Family ID, and your mobile number.',
      officialSource:
        'Verified source: National Health Authority, Government of India, portal pmjay.gov.in.',
    },
    hi: {
      whatItIs:
        'आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना भारत सरकार की राष्ट्रीय स्वास्थ्य सुरक्षा योजना है, जो गरीब और असंगठित क्षेत्र के कामगारों को मुफ्त इलाज की सुविधा देती है।',
      whoIsEligible:
        'ई-श्रम कार्ड धारक, ग्रामीण और शहरी असंगठित कामगार और सामाजिक-आर्थिक जाति जनगणना में सूचीबद्ध परिवार। परिवार के सदस्यों की संख्या पर कोई सीमा नहीं है।',
      keyBenefits:
        'प्रत्येक पात्र परिवार को प्रति वर्ष 5 लाख रुपये तक का कैशलेस और मुफ्त इलाज देश भर के 27,000 से अधिक सरकारी और निजी अस्पतालों में मिलता है। इसमें गंभीर बीमारियां, ऑपरेशन और दवाइयां शामिल हैं।',
      howToApply:
        'नजदीकी जन सेवा केंद्र (सीएससी) या सरकारी अस्पताल के आयुष्मान मित्र काउंटर पर जाएं, अथवा टोल-फ्री नंबर 14555 पर कॉल करें।',
      requiredDocuments:
        'आधार कार्ड, राशन कार्ड और मोबाइल नंबर।',
      officialSource:
        'आधिकारिक पोर्टल: राष्ट्रीय स्वास्थ्य प्राधिकरण, pmjay.gov.in।',
    },
    mr: {
      whatItIs:
        'आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना ही असंघटित कामगार आणि दुर्बल घटकांसाठीची मोफत आरोग्य संरक्षण योजना आहे.',
      whoIsEligible:
        'ई-श्रम कामगार, बांधकाम, चालक आणि घरगुती कामगार तसेच आर्थिकदृष्ट्या मागास कुटुंबातील सर्व सदस्य.',
      keyBenefits:
        'प्रत्येक कुटुंबाला दरवर्षी 5 लाख रुपयांपर्यंतचे मोफत आणि कॅशलेस उपचार सरकारी व खाजगी नोंदणीकृत रुग्णालयांत मिळतात.',
      howToApply:
        'आपल्या जवळच्या आपले सरकार सेवा केंद्रात किंवा शासकीय रुग्णालयातील आयुष्मान मित्राकडे जाऊन कार्ड काढा, अथवा 14555 वर संपर्क करा.',
      requiredDocuments:
        'आधार कार्ड, रेशन कार्ड आणि चालू मोबाइल नंबर.',
      officialSource:
        'अधिकृत सरकारी संकेतस्थळ: pmjay.gov.in.',
    },
    gu: {
      whatItIs:
        'આયુષ્માન ભારત પ્રધાનમંત્રી જન આરોગ્ય યોજના એ ગરીબ અને અસંગઠિત ક્ષેત્રના શ્રમિકો માટે ભારત સરકારની રાષ્ટ્રીય સ્વાસ્થ્ય સુરક્ષા યોજના છે.',
      whoIsEligible:
        'ઈ-શ્રમ કાર્ડ ધારકો, ગ્રામીણ અને શહેરી અસંગઠિત શ્રમિકો અને એસઈસીસી ડેટાબેઝમાં નોંધાયેલા પરિવારો.',
      keyBenefits:
        'દરેક પાત્ર પરિવારને પ્રતિ વર્ષ ₹5 લાખ સુધીની મફત અને કેશલેસ સારવાર દેશની 27,000 થી વધુ સરકારી અને ખાનગી હોસ્પિટલોમાં મળે છે.',
      howToApply:
        'નજીકના સામાન્ય સેવા કેન્દ્ર (CSC) અથવા સરકારી હોસ્પિટલના આયુષ્માન મિત્ર કાઉન્ટર પર જઈને આયુષ્માન કાર્ડ કઢાવો, અથવા 14555 પર કૉલ કરો.',
      requiredDocuments:
        'આધાર કાર્ડ, રેશન કાર્ડ અને ચાલુ મોબાઈલ નંબર.',
      officialSource:
        'સત્તાવાર પોર્ટલ: રાષ્ટ્રીય સ્વાસ્થ્ય સત્તામંડળ, pmjay.gov.in.',
    },
  },
  ws002: {
    // PM Shram Yogi Maan-dhan (PM-SYM)
    en: {
      whatItIs:
        'Pradhan Mantri Shram Yogi Maan-dhan is an old-age social security pension scheme created specifically for unorganized workers like drivers, delivery partners, domestic workers, street vendors, and carpenters.',
      whoIsEligible:
        'Unorganized workers aged 18 to 40 years whose monthly income is 15,000 rupees or less, and who are not covered under EPFO, ESIC, or NPS government schemes.',
      keyBenefits:
        'An assured minimum monthly pension of 3,000 rupees after attaining the age of 60 years. If the worker passes away during the pension receipt period, the spouse receives 50% as family pension.',
      howToApply:
        'Enroll at any nearest Common Services Center (CSC) or self-enroll directly via the e-Shram and Maandhan portal at maandhan.in.',
      requiredDocuments:
        'Aadhaar Card, an active savings bank account or Jan Dhan account with IFSC code, and initial contribution amount.',
      officialSource:
        'Ministry of Labour and Employment, Government of India, portal eshram.gov.in and maandhan.in.',
    },
    hi: {
      whatItIs:
        'प्रधानमंत्री श्रम योगी मान-धन योजना असंगठित क्षेत्र के कामगारों जैसे ड्राइवर, डिलीवरी वर्कर, घरेलू सहायिका और कारीगरों के लिए एक वृद्धावस्था पेंशन योजना है।',
      whoIsEligible:
        '18 से 40 वर्ष की आयु के असंगठित कामगार जिनकी मासिक आय 15,000 रुपये से कम है और जो ईपीएफओ या ईएसआईसी के सदस्य नहीं हैं।',
      keyBenefits:
        '60 वर्ष की आयु पूरी होने के बाद आजीवन 3,000 रुपये प्रति माह की निश्चित पेंशन। कामगार की मृत्यु की स्थिति में जीवनसाथी को 50 प्रतिशत पारिवारिक पेंशन मिलती है।',
      howToApply:
        'नजदीकी सीएससी सेंटर पर जाएं या eshram.gov.in पर ऑनलाइन पंजीकरण करें।',
      requiredDocuments:
        'आधार कार्ड, बैंक खाता पासबुक और मोबाइल नंबर।',
      officialSource:
        'श्रम एवं रोजगार मंत्रालय, eshram.gov.in।',
    },
    mr: {
      whatItIs:
        'प्रधानमंत्री श्रम योगी मान-धन योजना ही असंघटित कामगारांसाठी मासिक निवृत्तीवेतन देणारी सामाजिक सुरक्षा योजना आहे.',
      whoIsEligible:
        '18 ते 40 वयोगटातील कामगार ज्यांचे मासिक उत्पन्न 15,000 रुपयांपेक्षा कमी आहे.',
      keyBenefits:
        'वयाच्या 60 वर्षानंतर दरमहा 3,000 रुपये निश्चित पेन्शन आयुष्यभरासाठी दिली जाते.',
      howToApply:
        'नजीकच्या सीएससी केंद्रात किंवा eshram.gov.in वर जाऊन नोंदणी करा.',
      requiredDocuments:
        'आधार कार्ड, बँक खाते पासबुक आणि मोबाइल नंबर.',
      officialSource:
        'कामगार आणि रोजगार मंत्रालय, eshram.gov.in.',
    },
    gu: {
      whatItIs:
        'પ્રધાનમંત્રી શ્રમ યોગી માન-ધન યોજના એ ડ્રાઈવર, ડિલિવરી વર્કર, ઘરકામ અને કારીગરો જેવા અસંગઠિત શ્રમિકો માટે વૃદ્ધાવસ્થા પેન્શન યોજના છે.',
      whoIsEligible:
        '18 થી 40 વર્ષની વયના અસંગઠિત શ્રમિકો જેમની માસિક આવક ₹15,000 કે તેથી ઓછી હોય અને જેઓ EPFO કે ESIC ના સભ્યો ન હોય.',
      keyBenefits:
        '60 વર્ષની ઉંમર પછી આજીવન દર મહિને ₹3,000 નું નિશ્ચિત પેન્શન. શ્રમિકના મૃત્યુના કિસ્સામાં જીવનસાથીને 50% કૌટુંબિક પેન્શન મળે છે.',
      howToApply:
        'નજીકના CSC કેન્દ્ર પર જાઓ અથવા eshram.gov.in અને maandhan.in પર નોંધણી કરાવો.',
      requiredDocuments:
        'આધાર કાર્ડ, બચત બેંક ખાતું અથવા જન ધન ખાતું અને મોબાઈલ નંબર.',
      officialSource:
        'શ્રમ અને રોજગાર મંત્રાલય, eshram.gov.in.',
    },
  },
  ws003: {
    // PM Jeevan Jyoti Bima Yojana (PMJJBY)
    en: {
      whatItIs:
        'Pradhan Mantri Jeevan Jyoti Bima Yojana is an affordable government life insurance scheme offering financial security to low-income and informal worker families in the event of death.',
      whoIsEligible:
        'Any individual aged 18 to 50 years who holds an active savings bank or post office account and consents to annual auto-debit.',
      keyBenefits:
        'Provides a risk cover of 2 lakh rupees payable to the nominee upon the death of the insured member due to any cause. The annual premium is nominal at 436 rupees per year, debited automatically.',
      howToApply:
        'Contact your bank branch, post office, or enable it directly via your mobile banking net banking app.',
      requiredDocuments:
        'Aadhaar Card linked to your bank account and an auto-debit consent authorization form.',
      officialSource:
        'Department of Financial Services, Ministry of Finance, portal financialservices.gov.in.',
    },
    hi: {
      whatItIs:
        'प्रधानमंत्री जीवन ज्योति बीमा योजना एक सरकारी जीवन बीमा योजना है जो बहुत कम खर्च में परिवार को आर्थिक सुरक्षा प्रदान करती है।',
      whoIsEligible:
        '18 से 50 वर्ष की आयु के सभी बैंक या डाकघर बचत खाता धारक।',
      keyBenefits:
        'किसी भी कारण से मृत्यु होने पर नॉमिनी को 2 लाख रुपये की बीमा राशि मिलती है। इसका वार्षिक प्रीमियम केवल 436 रुपये है।',
      howToApply:
        'अपनी बैंक शाखा या डाकघर में जाएं और ऑटो-डेबिट फॉर्म जमा करें।',
      requiredDocuments:
        'आधार कार्ड और बैंक खाता विवरण।',
      officialSource:
        'वित्तीय सेवा विभाग, financialservices.gov.in।',
    },
    mr: {
      whatItIs:
        'प्रधानमंत्री जीवन ज्योती विमा योजना ही परवडणारी शासकीय जीवन विमा योजना आहे.',
      whoIsEligible:
        '18 ते 50 वयोगटातील बँक खातेदार नागरिक.',
      keyBenefits:
        'कोणत्याही कारणाने मृत्यू झाल्यास वारसाला 2 लाख रुपयांचे विमा संरक्षण मिळते. वार्षिक हप्ता फक्त 436 रुपये आहे.',
      howToApply:
        'आपल्या बँक शाखेत संपर्क करा आणि स्वयं-कपात संमती पत्र द्या.',
      requiredDocuments:
        'आधार कार्ड आणि बँक पासबुक.',
      officialSource:
        'वित्त मंत्रालय, financialservices.gov.in.',
    },
    gu: {
      whatItIs:
        'પ્રધાનમંત્રી જીવન જ્યોતિ વીમા યોજના એ સામાન્ય ખર્ચે શ્રમિક પરિવારોને આર્થિક સુરક્ષા આપતી જીવન વીમા યોજના છે.',
      whoIsEligible:
        '18 થી 50 વર્ષની વયના તમામ બેંક અથવા પોસ્ટ ઓફિસ બચત ખાતા ધારકો.',
      keyBenefits:
        'કોઈપણ કારણસર મૃત્યુ થવા પર વારસદારને ₹2 લાખની વીમા રકમ મળે છે. વાર્ષિક પ્રીમિયમ માત્ર ₹436 છે.',
      howToApply:
        'તમારી બેંક શાખા અથવા પોસ્ટ ઓફિસમાં સંપર્ક કરી ઓટો-ડેબિટ ફોર્મ ભરો.',
      requiredDocuments:
        'આધાર કાર્ડ અને બેંક ખાતાની વિગત.',
      officialSource:
        'નાણાકીય સેવા વિભાગ, financialservices.gov.in.',
    },
  },
};

/**
 * Generate a complete, conversational, spoken explanation for a Welfare Scheme.
 */
export function buildSchemeSpeechText(schemeId: string, lang: string = 'en'): { title: string; speech: string } {
  const normalizedLang = lang.startsWith('hi') ? 'hi' : lang.startsWith('mr') ? 'mr' : lang.startsWith('gu') ? 'gu' : 'en';
  const schemeData = SCHEME_CONTEXTUAL_DATA[schemeId] || SCHEME_CONTEXTUAL_DATA.ws001;
  const content = schemeData[normalizedLang] || schemeData.en;

  if (normalizedLang === 'gu') {
    return {
      title: schemeId === 'ws001' ? 'આયુષ્માન ભારત (PM-JAY)' : schemeId === 'ws002' ? 'શ્રમ યોગી માન-ધન (PM-SYM)' : 'જીવન જ્યોતિ વીમા (PMJJBY)',
      speech: `${content.whatItIs} પાત્રતા: ${content.whoIsEligible} મુખ્ય લાભ: ${content.keyBenefits} કેવી રીતે અરજી કરવી: ${content.howToApply} જરૂરી દસ્તાવેજો: ${content.requiredDocuments} ${content.officialSource}`,
    };
  }

  if (normalizedLang === 'hi') {
    return {
      title: schemeId === 'ws001' ? 'आयुष्मान भारत (PM-JAY)' : schemeId === 'ws002' ? 'श्रम योगी मान-धन (PM-SYM)' : 'जीवन ज्योति बीमा (PMJJBY)',
      speech: `${content.whatItIs} पात्रता: ${content.whoIsEligible} मुख्य लाभ: ${content.keyBenefits} आवेदन कैसे करें: ${content.howToApply} आवश्यक दस्तावेज: ${content.requiredDocuments} ${content.officialSource}`,
    };
  }

  if (normalizedLang === 'mr') {
    return {
      title: schemeId === 'ws001' ? 'आयुष्मान भारत योजना' : schemeId === 'ws002' ? 'श्रम योगी मान-धन योजना' : 'जीवन ज्योती विमा योजना',
      speech: `${content.whatItIs} कोण पात्र आहे? ${content.whoIsEligible} मुख्य फायदे: ${content.keyBenefits} अर्ज कसा करावा? ${content.howToApply} आवश्यक कागदपत्रे: ${content.requiredDocuments} ${content.officialSource}`,
    };
  }

  return {
    title:
      schemeId === 'ws001'
        ? 'Ayushman Bharat (PM-JAY)'
        : schemeId === 'ws002'
        ? 'PM Shram Yogi Maan-dhan'
        : 'PM Jeevan Jyoti Bima Yojana',
    speech: `Here is the verified explanation. What it is: ${content.whatItIs} Who is eligible: ${content.whoIsEligible} Key benefits: ${content.keyBenefits} How to apply: ${content.howToApply} Required documents: ${content.requiredDocuments} Official source: ${content.officialSource}`,
  };
}

/**
 * Generate a contextual spoken explanation for a Job.
 */
export function buildJobSpeechText(
  job: Job,
  lang: string = 'en',
  t: (key: string, opts?: any) => string
): { title: string; speech: string } {
  const normalizedLang = lang.startsWith('hi') ? 'hi' : lang.startsWith('mr') ? 'mr' : lang.startsWith('gu') ? 'gu' : 'en';
  const jobTitle = t(job.titleKey);
  const employer = t(job.employerKey);
  const location = t(job.locationKey);
  const payType = t(job.payTypeKey);
  const skills = job.skillKeys.map((s) => t(s)).join(', ');

  if (normalizedLang === 'gu') {
    return {
      title: jobTitle,
      speech: `આ ${employer} તરફથી ${jobTitle} માટેની ચકાસાયેલ નોકરી છે, જે તમારા સ્થાનથી ${job.distance} દૂર ${location} માં છે. આ કામનું દૈનિક વેતન ₹${job.payMin} થી ₹${job.payMax} છે (${payType}). જરૂરી આવડત: ${skills}. સેતુ એઆઈ મેચ: આ કામ તમારી કુશળતા સાથે ${job.skillMatch} ટકા મેળ ખાય છે. તમે સીધા અરજી કરી શકો છો અથવા વ્હોટ્સએપ પર સંપર્ક કરી શકો છો.`,
    };
  }

  if (normalizedLang === 'hi') {
    return {
      title: jobTitle,
      speech: `यह ${employer} द्वारा ${jobTitle} का सत्यापित काम है, जो आपके स्थान से ${job.distance} दूर ${location} में है। इस काम का दैनिक भुगतान ₹${job.payMin} से ₹${job.payMax} के बीच है, जो ${payType} देय है। इसके लिए आवश्यक कौशल ${skills} हैं। सेतु एआई विश्लेषण: यह काम आपके अनुभव और प्राथमिकताओं से ${job.skillMatch} प्रतिशत मेल खाता है। आप सेतु से सीधे आवेदन कर सकते हैं या व्हाट्सएप पर नियोक्ता से बात कर सकते हैं।`,
    };
  }

  if (normalizedLang === 'mr') {
    return {
      title: jobTitle,
      speech: `हे ${employer} चे ${jobTitle} कामाचे पद आहे, जे ${job.distance} अंतरावर ${location} येथे आहे. या कामाचा मोबदला ₹${job.payMin} ते ₹${job.payMax} आहे. आवश्यक कौशल्ये: ${skills}. सेतु एआय मॅच: हे काम तुमच्या कौशल्यांशी ${job.skillMatch} टक्के जुळते. तुम्ही थेट अप्लाय करू शकता किंवा व्हॉट्सॲपवर संपर्क करू शकता.`,
    };
  }

  return {
    title: jobTitle,
    speech: `Here are the job details. This is an opening for ${jobTitle} at ${employer}, located ${job.distance} away in ${location}. The pay rate is ${job.payMin} to ${job.payMax} rupees per ${payType}. Required skills include ${skills}. AI match explanation: This job has a ${job.skillMatch} percent match score based on your verified trade experience and location proximity. You can apply directly through your Setu profile or chat with the employer directly on WhatsApp.`,
  };
}

/**
 * Generate a contextual spoken explanation for Financial Health (Dhan / Home).
 */
export function buildFinancialSpeechText(
  data: {
    todayIncome: number;
    weeklyIncome: number;
    todayExpense: number;
    netInHand: number;
    savingsSaved: number;
    savingsTarget: number;
    stabilityScore: number;
    forecastMin: number;
    forecastMax: number;
    hasTransactions?: boolean;
  },
  lang: string = 'en'
): { title: string; speech: string } {
  const normalizedLang = lang.startsWith('hi') ? 'hi' : lang.startsWith('mr') ? 'mr' : lang.startsWith('gu') ? 'gu' : 'en';

  if (!data.hasTransactions && data.todayIncome === 0 && data.todayExpense === 0 && data.weeklyIncome === 0) {
    if (normalizedLang === 'gu') {
      return {
        title: 'આજનો હિસાબ',
        speech: 'હજી સુધી કોઈ વ્યવહારો નોંધાયેલા નથી. આવક અથવા ખર્ચ નોંધવા માટે આવક ઉમેરો અથવા ખર્ચ ઉમેરો બટન દબાવો.',
      };
    }
    if (normalizedLang === 'hi') {
      return {
        title: 'आज का हिसाब',
        speech: 'आपके खाते में अभी कोई लेन-देन दर्ज नहीं है। अपनी दैनिक कमाई और खर्च जोड़ने के लिए आय जोड़ें या खर्च जोड़ें बटन दबाएं।',
      };
    }
    if (normalizedLang === 'mr') {
      return {
        title: 'आजचा हिशोब',
        speech: 'अद्याप कोणतेही व्यवहार नोंदवलेले नाहीत. कमाई आणि खर्च नोंदवण्यासाठी कमाई जोडा किंवा खर्च जोडा बटण दाबा.',
      };
    }
    return {
      title: "Today's Summary",
      speech: 'No transactions recorded yet. Tap Add Income or Add Expense to start tracking your daily earnings and expenses.',
    };
  }

  if (normalizedLang === 'gu') {
    return {
      title: 'આજનો હિસાબ',
      speech: `તમારો નાણાકીય સારાંશ: આજની આવક ₹${data.todayIncome} છે અને ₹${data.todayExpense} ખર્ચ બાદ કરતાં આજનો ચોખ્ખો શેષ ₹${data.netInHand} છે. અઠવાડિક કુલ આવક ₹${data.weeklyIncome} છે. બચત લક્ષ્ય ₹${data.savingsTarget} માંથી ₹${data.savingsSaved} જમા છે. આ માત્ર નોંધાયેલા વ્યવહારોનો હિસાબ છે.`,
    };
  }

  if (normalizedLang === 'hi') {
    return {
      title: 'आज का हिसाब',
      speech: `यहाँ आपका वित्तीय विवरण है। आज की आय ₹${data.todayIncome} है, और ₹${data.todayExpense} के खर्च के बाद आज का शुद्ध शेष ₹${data.netInHand} है। इस हफ्ते की कुल कमाई ₹${data.weeklyIncome} है। आपके आपातकालीन फंड में ₹${data.savingsTarget} के लक्ष्य में से ₹${data.savingsSaved} जमा हैं। कृपया ध्यान दें, यह लेन-देन आधारित वित्तीय गणना है, बैंक या नकद बैलेंस नहीं।`,
    };
  }

  if (normalizedLang === 'mr') {
    return {
      title: 'आजचा हिशोब',
      speech: `तुमचा आर्थिक सारांश: आजची कमाई ₹${data.todayIncome} असून ₹${data.todayExpense} खर्च वजा जाता आजची निव्वळ कमाई ₹${data.netInHand} आहे. आठवड्याची कमाई ₹${data.weeklyIncome} आहे. बचत उद्दिष्ट ₹${data.savingsTarget} पैकी ₹${data.savingsSaved} जमा आहेत. ही व्यवहारांची निव्वळ गणना आहे.`,
    };
  }

  return {
    title: "Today's Summary",
    speech: `Here is your financial summary. Today your recorded income is ${data.todayIncome} rupees, and after today's expenses of ${data.todayExpense} rupees, your net for today is ${data.netInHand} rupees. Your weekly total income is ${data.weeklyIncome} rupees. Your emergency savings currently stand at ${data.savingsSaved} rupees toward your goal of ${data.savingsTarget} rupees. Note: This reflects recorded transactions, not actual physical cash or bank balance.`,
  };
}
