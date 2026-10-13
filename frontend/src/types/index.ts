export type SpeechCategory = 
  | 'Interpretive Reading'
  | 'Declamation'
  | 'Extemporaneous Speech'
  | 'Persuasive Oratory';

export interface AudioUploadResponse {
  audio_id: string;
  filename: string;
  duration_seconds: float;
  sample_rate: number;
  channels: number;
  format: string;
  size_bytes: number;
  url: string;
  message: string;
}

export type float = number;

export interface FlawInterval {
  id: string;
  type: string;
  category_name: string;
  start: number;
  end: number;
  transcript_segment?: string;
  severity: 'low' | 'medium' | 'high';
  reference_value: number;
  participant_value: number;
  relative_deviation_percent: number;
  threshold_rule: string;
  evidence: string;
  explanation: string;
  recommendation: string;
  confidence?: number;
}

export interface TimeSeriesPoint {
  time: number;
  pitch_hz: number | null;
  rms_energy: number;
  speaking_rate_wpm: number | null;
  is_pause: boolean;
  spectral_centroid_hz: number | null;
}

export interface FeatureSummary {
  duration_seconds: number;
  estimated_wpm: number;
  total_pauses: number;
  total_pause_duration?: number;
  pause_time_ratio: number;
  mean_pitch_hz: number;
  std_pitch_hz: number;
  pitch_semitone_range: number;
  mean_rms_energy: number;
  std_rms_energy: number;
  mean_spectral_centroid_hz: number;
  mean_zero_crossing_rate: number;
}

export interface FeatureBundle {
  summary: FeatureSummary;
  timeseries: TimeSeriesPoint[];
}

export interface CategoryScoreDetail {
  category_key: string;
  category_name: string;
  max_score: number;
  score: number;
  percentage: number;
  deductions: number;
  formula: string;
  contributing_measurements: Record<string, any>;
  status: string;
}

export interface RubricConfig {
  version: string;
  total_max_score: number;
  weights: Record<string, number>;
  category_names: Record<string, string>;
  thresholds: Record<string, any>;
}

export interface RubricEvaluationResult {
  rubric_version: string;
  overall_score: number;
  category_scores: Record<string, number>;
  details: Record<string, CategoryScoreDetail>;
  methodology_notes: string[];
}

export interface AnalysisResult {
  analysis_id: string;
  status: string;
  created_at: string;
  transcript: string;
  speech_category: string;
  alignment_method: string;
  rubric_version: string;
  overall_score: number;
  category_scores: Record<string, number>;
  rubric_evaluation?: RubricEvaluationResult;
  reference_audio_id: string;
  participant_audio_id: string;
  reference_audio_url: string;
  participant_audio_url: string;
  reference_duration: number;
  participant_duration: number;
  features: {
    reference: FeatureBundle;
    participant: FeatureBundle;
  };
  flaws: FlawInterval[];
  warnings: string[];
}

export interface AnalysisHistoryItem {
  analysis_id: string;
  created_at: string;
  speech_category: string;
  overall_score: number;
  flaw_count: number;
  participant_duration: number;
  status: string;
}

export interface DatasetRecord {
  recording_id: string;
  transcript_id: string;
  reference_id?: string | null;
  audio_file: string;
  transcript: string;
  speech_category: string;
  recording_type: 'ideal' | 'flawed';
  flaw_type: string;
  severity: string;
  speaker_id: string;
  start?: number | null;
  end?: number | null;
  alignment_method: string;
  annotation_status: string;
  metadata: Record<string, any>;
  audio_file_exists?: boolean;
  audio_url?: string;
}

export interface DatasetValidationResult {
  total_records: number;
  valid_records_with_audio: number;
  missing_audio_files: Array<{ recording_id: string; expected_file: string }>;
  is_valid: boolean;
  last_updated: string;
}

export interface SystemHealthStats {
  status: string;
  service: string;
  version: string;
  sample_rate: number;
  capabilities: Record<string, boolean>;
  stats: {
    completed_analyses: number;
    dataset_recordings: number;
    total_flaws_detected: number;
  };
}
