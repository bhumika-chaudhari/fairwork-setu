/**
 * Haq Setu Service Layer
 * Manages case assessment, appeal generation, verified legal sources library,
 * and grievance persistence (Local-First with FastAPI backend sync when available).
 */

import type {
  HaqCase,
  DeactivationWizardData,
  CaseAssessment,
  AppealDraft,
  LegalSource,
  PlatformSupportChannel,
} from '../types/haq';

const BASE_URL = (
  import.meta.env.VITE_ML_API_URL ||
  (typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8000'
    : '')
).replace(/\/$/, '');

const STORAGE_KEY = 'haq_setu_cases';

// =========================================================================
// 1. VERIFIED LEGAL SOURCES LIBRARY
// =========================================================================
export const VERIFIED_LEGAL_SOURCES: LegalSource[] = [
  {
    id: 'raj-gig-act-2023',
    jurisdiction: 'Rajasthan',
    title: 'The Rajasthan Platform Based Gig Workers (Registration and Welfare) Act, 2023',
    authority: 'Government of Rajasthan (Act No. 18 of 2023)',
    officialUrl: 'https://labour.rajasthan.gov.in',
    relevantProvision: 'Section 16 & 17: Grievance Redressal and Opportunity to be Heard',
    effectiveDate: 'September 2023',
    lastVerifiedDate: 'October 2024',
    reviewStatus: 'Gazette Published',
    workerScope: 'All platform gig workers registered in Rajasthan',
    summary:
      'India’s landmark legislation establishing a dedicated Gig Workers Welfare Board, mandatory registration of aggregators and workers, a Social Security and Welfare Fund funded by a fee on platform transactions, and statutory rights to grievance redressal.',
    keyRights: [
      'Right to be registered with the Welfare Board upon onboarding',
      'Right to access social security benefits funded by transaction cess',
      'Right to a formal hearing before unilateral termination or deactivation',
      'Right to petition the Appellate Authority against aggregator unfair actions',
    ],
  },
  {
    id: 'karn-gig-bill-2024',
    jurisdiction: 'Karnataka',
    title: 'Karnataka Platform-based GIG Workers (Social Security and Welfare) Bill, 2024',
    authority: 'Labour Department, Government of Karnataka',
    officialUrl: 'https://labour.karnataka.gov.in',
    relevantProvision: 'Clause 14: Fair Contract Terms & Notice Period before Termination',
    effectiveDate: 'Introduced in Assembly (July 2024)',
    lastVerifiedDate: 'October 2024',
    reviewStatus: 'Draft Bill',
    workerScope: 'Delivery, ride-hailing, and home-service gig workers in Karnataka',
    summary:
      'Proposes minimum 14-day notice before contract termination or permanent deactivation, mandatory disclosure of algorithmic scoring criteria, fair dispute resolution tribunals, and welfare cess.',
    keyRights: [
      'Prohibition of abrupt algorithmic deactivation without human review',
      'Mandatory written explanation detailing the breach of terms before deactivation',
      'Internal Dispute Resolution Committee mandated for every aggregator',
      'Appeals mechanism to the state Labour Commissioner',
    ],
  },
  {
    id: 'code-social-security-2020',
    jurisdiction: 'National (India)',
    title: 'The Code on Social Security, 2020 (Central Act No. 36 of 2020)',
    authority: 'Ministry of Labour and Employment, Government of India',
    officialUrl: 'https://labour.gov.in/sites/default/files/SS_Code_Gazette.pdf',
    relevantProvision: 'Chapter IX, Section 114: Framing of Welfare Schemes for Gig and Platform Workers',
    effectiveDate: 'Enacted by Parliament (Rules under progressive rollout)',
    lastVerifiedDate: 'October 2024',
    reviewStatus: 'Gazette Published',
    workerScope: 'Nationwide platform workers and informal gig delivery partners',
    summary:
      'The first national legal recognition defining "gig worker" and "platform worker" in Indian law, empowering the Central and State Governments to formulate targeted social security schemes covering health, accident, maternity, and old-age protection.',
    keyRights: [
      'Formal legal definition separating platform workers from general contractors',
      'National Social Security Board for Gig Workers with worker representation',
      'Contribution mandate requiring aggregators to contribute 1-2% of annual turnover',
      'Registration on national worker registries (e-Shram)',
    ],
  },
  {
    id: 'eshram-registry-guidelines',
    jurisdiction: 'National (India)',
    title: 'e-Shram National Database of Unorganised Workers (NDUW)',
    authority: 'Ministry of Labour & Employment, Govt. of India',
    officialUrl: 'https://eshram.gov.in',
    relevantProvision: 'Universal Account Number (UAN) Identity & Social Protection Portability',
    effectiveDate: 'August 2021',
    lastVerifiedDate: 'October 2024',
    reviewStatus: 'Official Portal',
    workerScope: 'All unorganised, migrant, and gig workers aged 16-59 years',
    summary:
      'Digital registration portal granting a unique 12-digit UAN card. Connects informal and gig workers directly to central welfare schemes, accidental death/disability insurance under PMSBY, and portability across state lines.',
    keyRights: [
      'Verified government identity as an unorganised/gig worker',
      'Accidental insurance coverage of up to ₹2,00,000 for death/permanent disability',
      'Direct-to-bank emergency relief during civil disruptions or extreme weather',
      'Proof of occupational status when applying for municipal permits',
    ],
  },
  {
    id: 'principles-natural-justice',
    jurisdiction: 'National (India)',
    title: 'Doctrine of Natural Justice & Contractual Fairness (Audi Alteram Partem)',
    authority: 'Supreme Court of India (Constitutional Precedents on Contractual Good Faith)',
    officialUrl: 'https://main.sci.gov.in',
    relevantProvision: 'Right to Notice and Opportunity to be Heard (Fair Procedure in Commercial Contracts)',
    effectiveDate: 'Established Constitutional Jurisprudence',
    lastVerifiedDate: 'October 2024',
    reviewStatus: 'Verified by Legal Literacy Desk',
    workerScope: 'Contractual workers and commercial delivery partners across India',
    summary:
      'Under Indian contract law and constitutional jurisprudence, arbitrary deprivation of livelihood without reasonable notice, opportunity to respond, or disclosure of reasons violates fundamental fairness and the implied covenant of good faith.',
    keyRights: [
      'Right to receive specific notice stating reasons for adverse platform action',
      'Right to inspect records or complaints cited as the basis for account suspension',
      'Right to submit a formal counter-explanation before a final decision is locked',
      'Protection against punitive penalties imposed without contractual basis',
    ],
  },
];

// =========================================================================
// 2. VERIFIED PLATFORM SUPPORT CHANNELS
// =========================================================================
export const PLATFORM_SUPPORT_DIRECTORY: PlatformSupportChannel[] = [
  {
    platform: 'Zomato',
    supportEmail: 'delivery-support@zomato.com',
    grievanceDeskUrl: 'https://www.zomato.com/contact',
    inAppPath: 'Zomato Delivery Partner App -> Profile -> Help & Support -> Account & Profile -> Account Blocked',
    helpline: 'In-app SOS / Ticket system',
    notes:
      'State your Rider ID / Registered Phone Number clearly. Request human review by the Partner Grievance Desk rather than automated chat bots.',
  },
  {
    platform: 'Swiggy',
    supportEmail: 'deliverypartnersupport@swiggy.in',
    grievanceDeskUrl: 'https://www.swiggy.com/contact-us',
    inAppPath: 'Swiggy Delivery Partner App -> Help Center -> Tickets -> Create New Ticket -> Account Issues',
    helpline: 'Partner care in-app call back',
    notes:
      'Keep your Delivery Executive (DE) ID ready. Swiggy guidelines require providing evidence if the deactivation was triggered by a customer cancellation dispute or selfie verification mismatch.',
  },
  {
    platform: 'Other Platform',
    supportEmail: 'support@platform.com',
    grievanceDeskUrl: 'https://consumerhelpline.gov.in',
    inAppPath: 'Partner application -> Settings / Account -> Help Desk / Grievance Officer',
    notes:
      'If the aggregator does not provide an internal grievance officer, workers can log an unaddressed dispute on the National Consumer Helpline (NCH) at 1915 or through the state Labour Commissionerate portal.',
  },
];

// =========================================================================
// 3. CASE ASSESSMENT ENGINE
// =========================================================================
export async function assessDeactivationCase(
  data: DeactivationWizardData,
  averageDailyIncome = 850
): Promise<CaseAssessment> {
  // Attempt backend API call first
  try {
    const res = await fetch(`${BASE_URL}/haq-setu/assess-case`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: data.platform === 'Other platform' ? (data.customPlatformName || 'Other Platform') : data.platform,
        problem_type: data.problemType,
        date_occurred: data.dateNotRemembered ? 'Approximate / Unknown' : data.dateOccurred,
        reason_given: data.reasonGiven,
        reason_category: data.reasonCategory || 'other',
        has_screenshot: Boolean(data.screenshotName),
        pasted_text_length: (data.pastedNoticeText || '').length,
        has_contacted_support: data.hasContactedSupport,
        has_submitted_appeal: data.hasSubmittedAppeal,
        ticket_number: data.ticketNumber || '',
        requested_outcome: data.requestedOutcome,
        average_daily_income: averageDailyIncome,
      }),
    });
    if (res.ok) {
      const serverData = await res.json();
      return serverData;
    }
  } catch {
    // Graceful fallback to client deterministic assessment engine
  }

  // Client-Side Deterministic Assessment Engine
  const effectivePlatform =
    data.platform === 'Other platform'
      ? data.customPlatformName || 'Other Delivery/Ride Platform'
      : data.platform;

  const dateText = data.dateNotRemembered
    ? 'Date not specifically recalled by worker'
    : data.dateOccurred || 'Recent days';

  const summaryWhatYouToldUs: string[] = [
    `Platform affected: ${effectivePlatform}.`,
    `Problem reported: ${formatProblemType(data.problemType)}.`,
    `Occurred on: ${dateText}.`,
    `Notice status: ${
      data.reasonGiven === 'yes_message'
        ? 'Received a message/notice from the platform.'
        : data.reasonGiven === 'no_reason'
        ? 'No reason was provided by the platform.'
        : 'Worker is not sure if a formal notice was issued.'
    }`,
    `Evidence: ${
      data.screenshotName
        ? `Screenshot provided locally (${data.screenshotName}).`
        : data.pastedNoticeText
        ? 'Notice text pasted for appeal drafting.'
        : data.userDescription
        ? 'Worker provided personal written account.'
        : 'No screenshot or message attached (proceeding with factual appeal).'
    }`,
    `Previous steps: ${
      data.hasContactedSupport
        ? `Already contacted support${data.ticketNumber ? ` (Ticket: ${data.ticketNumber})` : ''}.`
        : 'Support has not been formally contacted yet.'
    }`,
    `Outcome requested: ${formatOutcome(data.requestedOutcome)}.`,
  ];

  const whatWeKnow: string[] = [
    `The worker has reported loss of access to ${effectivePlatform} starting around ${dateText}.`,
    'No automated decision can legally supersede verified proof of lawful performance and contractual good faith.',
    `Under natural justice principles (Audi Alteram Partem), gig workers have a legitimate expectation of an opportunity to respond before livelihood termination.`,
  ];

  const whatNeedsConfirmation: string[] = [];
  if (data.reasonGiven === 'no_reason' || data.reasonGiven === 'not_sure') {
    whatNeedsConfirmation.push(
      'The exact internal clause or trigger used by the platform algorithm (e.g., customer rating dip, cancellation flag, KYC document expiry, or system glitch) has NOT been officially cited yet.'
    );
  }
  whatNeedsConfirmation.push(
    'Whether this action is an automated algorithmic security lock or a final decision reviewed by a human grievance officer.'
  );
  whatNeedsConfirmation.push(
    'Whether customer complaints or location discrepancies, if cited, were cross-verified against GPS and order fulfillment logs.'
  );

  // Dynamic tailored checklist
  const checklist: CaseAssessment['checklist'] = [];

  checklist.push({
    step: 1,
    title: 'Preserve all notices and delivery order records',
    detail:
      'Save the deactivation SMS, app screenshots, order history logs, and any recent customer tips or positive ratings before app cache clears.',
    urgency: 'high',
  });

  if (!data.hasContactedSupport) {
    checklist.push({
      step: 2,
      title: 'Submit formal written inquiry requesting specific clause & evidence',
      detail:
        `Send the prepared appeal to ${effectivePlatform} partner support. Request the specific order ID or policy clause cited, rather than accepting generic automated replies.`,
      urgency: 'high',
    });
  } else {
    checklist.push({
      step: 2,
      title: 'Escalate existing ticket with fresh factual appeal',
      detail:
        `Reference Ticket ${data.ticketNumber || '#Pending'} and demand escalation to the Partner Grievance Officer under formal review.`,
      urgency: 'high',
    });
  }

  if (data.reasonCategory === 'kyc_document') {
    checklist.push({
      step: 3,
      title: 'Verify and prepare renewed KYC credentials',
      detail:
        'Have clean, unblurred photos of your Aadhaar card, Driving License, RC book, and vehicle insurance ready for immediate re-verification.',
      urgency: 'high',
    });
  } else if (data.reasonCategory === 'customer_complaint') {
    checklist.push({
      step: 3,
      title: 'Compile trip timestamps and delivery proof',
      detail:
        'Note approximate delivery times, customer drop-off location coordinates, and partner app communication to counter mistaken or fraudulent complaints.',
      urgency: 'medium',
    });
  } else {
    checklist.push({
      step: 3,
      title: 'Request a 48-hour human review window',
      detail:
        'Ask platform support to assign a human review officer to inspect your lifetime delivery count, overall rating, and tenure.',
      urgency: 'medium',
    });
  }

  checklist.push({
    step: 4,
    title: 'Note down reference number and follow-up deadline',
    detail:
      'Always save the new ticket number, submission date, and agent name. Mark a follow-up reminder for 48 hours.',
    urgency: 'standard',
  });

  checklist.push({
    step: 5,
    title: 'Explore temporary alternative earnings on Kaam',
    detail:
      'While your appeal is under review, check nearby open shifts or secondary platform opportunities on Setu Kaam to maintain daily cash flow.',
    urgency: 'standard',
  });

  // Calculate estimated weekly financial impact
  const daysActive = 7;
  const estimatedWeeklyShortfall = Math.round(averageDailyIncome * daysActive);

  return {
    summaryWhatYouToldUs,
    whatWeKnow,
    whatNeedsConfirmation,
    checklist,
    applicableRights: [
      {
        title: 'Right to Notice and Fair Hearing (Audi Alteram Partem)',
        source: 'Principles of Natural Justice & Contract Law',
        url: 'https://main.sci.gov.in',
        provision: 'Right to know specific allegations and present defense before livelihood loss',
      },
      {
        title: 'Platform Worker Grievance Redressal Right',
        source: 'The Rajasthan Platform Based Gig Workers Act, 2023 (Model Provision)',
        url: 'https://labour.rajasthan.gov.in',
        provision: 'Section 16: Mandatory grievance officer & dispute hearing',
      },
      {
        title: 'Recognition of Gig Worker Identity & Social Security',
        source: 'Code on Social Security, 2020 (Central Act No. 36 of 2020)',
        url: 'https://labour.gov.in',
        provision: 'Section 114: Statutory status for gig and platform delivery workers',
      },
    ],
    estimatedShortfall: {
      weeklyIncomeBaseline: averageDailyIncome,
      daysImpacted: daysActive,
      estimatedLoss: estimatedWeeklyShortfall,
      disclaimer:
        'Estimated cash flow interruption based on your recorded daily earnings average. This is an informational projection to assist with emergency budgeting, not a guaranteed legal damage claim.',
    },
  };
}

// =========================================================================
// 4. APPEAL GENERATOR ENGINE
// =========================================================================
export async function generateDeactivationAppeal(
  data: DeactivationWizardData,
  language = 'en',
  bilingual = true
): Promise<AppealDraft> {
  const effectivePlatform =
    data.platform === 'Other platform'
      ? data.customPlatformName || 'Platform Partner Support'
      : data.platform;

  // Attempt backend API call first
  try {
    const res = await fetch(`${BASE_URL}/haq-setu/generate-appeal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: effectivePlatform,
        problem_type: data.problemType,
        date_occurred: data.dateNotRemembered ? 'Recent date' : data.dateOccurred,
        reason_given: data.reasonGiven,
        reason_category: data.reasonCategory || 'other',
        pasted_text: data.pastedNoticeText || '',
        user_description: data.userDescription || '',
        ticket_number: data.ticketNumber || '',
        requested_outcome: data.requestedOutcome,
        worker_name: data.workerName || '[Worker Name]',
        worker_id: data.workerMaskedId || '[Partner ID]',
        language,
        bilingual,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback to client template engine
  }

  const channel = PLATFORM_SUPPORT_DIRECTORY.find((p) =>
    p.platform.toLowerCase().includes(effectivePlatform.toLowerCase())
  ) || PLATFORM_SUPPORT_DIRECTORY[2];

  const workerDisplay = data.workerName ? data.workerName.trim() : '[Your Full Name]';
  const idDisplay = data.workerMaskedId ? data.workerMaskedId.trim() : '[Partner ID / Registered Phone Number]';
  const ticketRef = data.ticketNumber ? ` (Reference Ticket: ${data.ticketNumber.trim()})` : '';
  const dateFormatted = data.dateNotRemembered
    ? 'recently'
    : data.dateOccurred
    ? `on ${data.dateOccurred}`
    : 'recently';

  const subject = `[Formal Appeal] Urgent Review Request: Account Access & Deactivation Reconsideration - ${idDisplay}`;

  const reasonExplanation =
    data.reasonGiven === 'yes_message' && data.pastedNoticeText
      ? `Regarding the notice received stating: "${data.pastedNoticeText.slice(0, 200)}${
          data.pastedNoticeText.length > 200 ? '...' : ''
        }", I wish to clarify my position respectfully.`
      : data.reasonGiven === 'no_reason'
      ? 'I was not provided with any clear explanation, specific order ID, or evidence regarding why this action was taken.'
      : 'The cause of this disruption remains unclear to me from the in-app notice.';

  const personalContext = data.userDescription
    ? `\nFactual Context:\n${data.userDescription.trim()}\n`
    : '';

  const outcomeSentence =
    data.requestedOutcome === 'clear_explanation'
      ? 'A detailed written explanation citing the specific order ID, time, and clause under which this decision was executed.'
      : data.requestedOutcome === 'correction_mistake'
      ? 'An immediate review to correct an apparent technical, GPS, or document verification error.'
      : data.requestedOutcome === 'reactivation'
      ? 'The immediate restoration and reactivation of my delivery partner account so I may resume lawful earnings.'
      : 'A comprehensive, human-reviewed re-examination of my lifetime partner performance and delivery record.';

  const body = `To: The Partner Support & Grievance Officer,
${effectivePlatform} Operations Desk

Subject: ${subject}

Dear Grievance Officer,

I am writing this formal appeal to urgently request human review and reconsideration of the account deactivation/suspension imposed on my delivery partner account ${dateFormatted}${ticketRef}.

Worker Identification:
- Partner / Registered Name: ${workerDisplay}
- Partner ID / Registered Contact: ${idDisplay}
- Platform: ${effectivePlatform}

Issue Summary:
My partner account was ${formatProblemType(data.problemType).toLowerCase()} ${dateFormatted}. ${reasonExplanation}
${personalContext}
As an independent delivery worker dependent on platform earnings for my family's livelihood, I have consistently strived to adhere to platform policies, maintain customer satisfaction, and perform my duties with integrity. 

Under established natural justice principles and fair commercial practice, I respectfully request:
1. ${outcomeSentence}
2. The specific evidence, customer complaint logs, or algorithmic audit logs relied upon for this deactivation.
3. An opportunity to provide supporting delivery timestamps or renewed verification documentation.
4. An official ticket / complaint reference number and the designated timeframe for response.

I stand ready to furnish any supporting records, photo verification, or clarifications required to resolve this issue amicably.

Thank you for your prompt and fair attention to this matter.

Yours sincerely,

${workerDisplay}
Contact: ${idDisplay}
Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  const bilingualExplanation =
    language.startsWith('hi') || language.startsWith('mr')
      ? `[Hindi / Marathi Summary for Worker's Reference]:
यह औपचारिक पत्र आपके खाते को दोबारा चालू करवाने और कंपनी से स्पष्ट कारण माँगने के लिए तैयार किया गया है।
इसमें लिखा है कि:
• आपका खाता ${dateFormatted} को बंद कर दिया गया था।
• आप कंपनी से अपील कर रहे हैं कि किसी इंसान द्वारा इसकी दोबारा निष्पक्ष जाँच की जाए।
• यदि कोई ग्राहक शिकायत या सिस्टम गलती है, तो आपको अपनी बात रखने और दस्तावेज दिखाने का मौका दिया जाए।
• इस ईमेल या पत्र को कंपनी के सपोर्ट डेस्क (${channel.supportEmail}) पर भेजें और टिकट नंबर अवश्य सुरक्षित रखें।`
      : undefined;

  return {
    subject,
    recipient: channel.supportEmail,
    body,
    bilingualExplanation,
    targetSupportEmail: channel.supportEmail,
    targetSupportPortal: channel.grievanceDeskUrl,
    language: 'en',
  };
}

// =========================================================================
// 5. LOCAL-FIRST CASE PERSISTENCE STORE
// =========================================================================
export function getSavedCases(): HaqCase[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse saved Haq cases:', err);
    return [];
  }
}

export function saveHaqCase(
  input: Omit<HaqCase, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): HaqCase {
  const existing = getSavedCases();
  const now = new Date().toISOString();
  const caseId = input.id || `HAQ-${Math.floor(1000 + Math.random() * 9000)}`;

  const newCase: HaqCase = {
    ...input,
    id: caseId,
    createdAt: input.id && existing.find((c) => c.id === input.id) ? existing.find((c) => c.id === input.id)!.createdAt : now,
    updatedAt: now,
  };

  const filtered = existing.filter((c) => c.id !== caseId);
  const updated = [newCase, ...filtered];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('haq_cases_changed'));
    }
  } catch (err) {
    console.error('Failed to save Haq case:', err);
  }

  // Attempt background sync to backend
  syncCaseToBackend(newCase).catch(() => {});

  return newCase;
}

export function updateHaqCase(
  id: string,
  updates: Partial<Omit<HaqCase, 'id' | 'createdAt'>>
): HaqCase | null {
  const existing = getSavedCases();
  const idx = existing.findIndex((c) => c.id === id);
  if (idx === -1) return null;

  const updatedCase: HaqCase = {
    ...existing[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  existing[idx] = updatedCase;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('haq_cases_changed'));
    }
  } catch (err) {
    console.error('Failed to update Haq case:', err);
  }

  syncCaseToBackend(updatedCase).catch(() => {});

  return updatedCase;
}

export function deleteHaqCase(id: string): boolean {
  const existing = getSavedCases();
  const filtered = existing.filter((c) => c.id !== id);
  if (filtered.length === existing.length) return false;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('haq_cases_changed'));
    }
    return true;
  } catch (err) {
    console.error('Failed to delete Haq case:', err);
    return false;
  }
}

async function syncCaseToBackend(caseItem: HaqCase): Promise<void> {
  try {
    await fetch(`${BASE_URL}/haq-setu/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseItem),
    });
  } catch {
    // Local-first: ignore network errors
  }
}

// Helper formatters
function formatProblemType(type: string): string {
  switch (type) {
    case 'permanently_deactivated':
      return 'Account permanently deactivated';
    case 'temporarily_suspended':
      return 'Account temporarily suspended';
    case 'cannot_login':
      return 'Cannot log in / Access denied';
    case 'warning_penalty':
      return 'Received penalty notice or rating warning';
    default:
      return 'Account issue under review';
  }
}

function formatOutcome(outcome: string): string {
  switch (outcome) {
    case 'clear_explanation':
      return 'Clear written explanation of the decision';
    case 'fair_review':
      return 'Fair human review of the case';
    case 'correction_mistake':
      return 'Correction of a technical or KYC mistake';
    case 'reactivation':
      return 'Immediate account reactivation';
    default:
      return 'Fair resolution';
  }
}
