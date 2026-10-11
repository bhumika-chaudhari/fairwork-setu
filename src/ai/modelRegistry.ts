export type AIStatus = 'idle' | 'processing' | 'success' | 'error';

export type AIResponse<T> = {
  model: string;
  version: string;
  status: 'success';
  confidence: number;
  latencyMs: number;
  output: T;
  explanation: string;
};

export type SpeechToTextOutput = {
  transcript: string;
  language: string;
  confidence: number;
};

export type ExtractedEntity = {
  text: string;
  type: 'AMOUNT' | 'EXPENSE_CATEGORY' | 'WORK_TYPE' | 'DATE';
  confidence: number;
};

export type InformationExtractionOutput = {
  income: number;
  expense: number;
  expenseCategory: string;
  date: string;
  workType: string;
  entities: ExtractedEntity[];
};

export type ExpenseClassifierOutput = {
  category: string;
  confidence: number;
  alternatives: { category: string; confidence: number }[];
};

export type IncomeForecastOutput = {
  nextWeekIncomeMin: number;
  nextWeekIncomeMax: number;
  trend: 'stable' | 'up' | 'down';
  confidence: number;
  basedOnDays: number;
};

export type AnomalyAlertOutput = {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  confidence: number;
  recommendedAction: string;
};

export type JobMatchOutput = {
  jobId: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  explanation: string;
};

export type StabilityFactor = { factor: string; score: number };

export type StabilityScoreOutput = {
  score: number;
  level: string;
  factors: StabilityFactor[];
  confidence: number;
};

export type RagSource = { title: string; url: string; relevance: number };

export type RagSearchOutput = {
  answer: string;
  sources: RagSource[];
};

export type SkillPassportOutput = {
  summary: string;
  skills: string[];
  readinessScore: number;
};

export type TranslationOutput = {
  sourceLanguage: string;
  targetLanguage: string;
  translatedText: string;
  confidence: number;
};

export type ModelName =
  | 'speechToText'
  | 'informationExtraction'
  | 'expenseClassifier'
  | 'incomeForecaster'
  | 'anomalyDetector'
  | 'jobMatcher'
  | 'stabilityScorer'
  | 'ragSearch'
  | 'skillPassportGenerator'
  | 'translationAssistant';

export type ModelMeta = {
  id: ModelName;
  model: string;
  version: string;
  titleKey: string;
  labelKey: string;
};

export const MODEL_REGISTRY: Record<ModelName, ModelMeta> = {
  speechToText: {
    id: 'speechToText',
    model: 'Whisper-Small',
    version: 'v1.2',
    titleKey: 'ai.speechToText.title',
    labelKey: 'ai.speechToText.label',
  },
  informationExtraction: {
    id: 'informationExtraction',
    model: 'IndicBERT-NER',
    version: 'v1.1',
    titleKey: 'ai.informationExtraction.title',
    labelKey: 'ai.informationExtraction.label',
  },
  expenseClassifier: {
    id: 'expenseClassifier',
    model: 'Expense-BERT',
    version: 'v1.0',
    titleKey: 'ai.expenseClassifier.title',
    labelKey: 'ai.expenseClassifier.label',
  },
  incomeForecaster: {
    id: 'incomeForecaster',
    model: 'Random Forest Regressor',
    version: 'v1.0',
    titleKey: 'ai.incomeForecaster.title',
    labelKey: 'ai.incomeForecaster.label',
  },
  anomalyDetector: {
    id: 'anomalyDetector',
    model: 'Isolation Forest',
    version: 'v1.0',
    titleKey: 'ai.anomalyDetector.title',
    labelKey: 'ai.anomalyDetector.label',
  },
  jobMatcher: {
    id: 'jobMatcher',
    model: 'SentenceTransformer + Cosine Similarity',
    version: 'v1.3',
    titleKey: 'ai.jobMatcher.title',
    labelKey: 'ai.jobMatcher.label',
  },
  stabilityScorer: {
    id: 'stabilityScorer',
    model: 'Gradient Boosting',
    version: 'v1.0',
    titleKey: 'ai.stabilityScorer.title',
    labelKey: 'ai.stabilityScorer.label',
  },
  ragSearch: {
    id: 'ragSearch',
    model: 'SentenceTransformer + FAISS',
    version: 'v1.1',
    titleKey: 'ai.ragSearch.title',
    labelKey: 'ai.ragSearch.label',
  },
  skillPassportGenerator: {
    id: 'skillPassportGenerator',
    model: 'LLM Summarization',
    version: 'v1.0',
    titleKey: 'ai.skillPassport.title',
    labelKey: 'ai.skillPassport.label',
  },
  translationAssistant: {
    id: 'translationAssistant',
    model: 'IndicTrans2',
    version: 'v2.0',
    titleKey: 'ai.translation.title',
    labelKey: 'ai.translation.label',
  },
};

export type ModelInputMap = {
  speechToText: { source: 'mic' | 'retry' };
  informationExtraction: { transcript: string };
  expenseClassifier: { expense: number; hint: string };
  incomeForecaster: { days: number };
  anomalyDetector: { lookbackDays: number };
  jobMatcher: { jobId: string };
  stabilityScorer: Record<string, never>;
  ragSearch: { query: string };
  skillPassportGenerator: { name: string; city: string; years: number };
  translationAssistant: { sourceLanguage: string; targetLanguage: string; text: string };
};

export type ModelOutputMap = {
  speechToText: SpeechToTextOutput;
  informationExtraction: InformationExtractionOutput;
  expenseClassifier: ExpenseClassifierOutput;
  incomeForecaster: IncomeForecastOutput;
  anomalyDetector: AnomalyAlertOutput;
  jobMatcher: JobMatchOutput;
  stabilityScorer: StabilityScoreOutput;
  ragSearch: RagSearchOutput;
  skillPassportGenerator: SkillPassportOutput;
  translationAssistant: TranslationOutput;
};
