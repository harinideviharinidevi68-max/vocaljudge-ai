import { 
  AnalysisResult, 
  AnalysisHistoryItem, 
  AudioUploadResponse, 
  DatasetRecord, 
  DatasetValidationResult, 
  RubricConfig, 
  SystemHealthStats 
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export const api = {
  async getHealth(): Promise<SystemHealthStats> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  },

  async uploadAudio(file: File): Promise<AudioUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/audio/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Audio upload failed');
    }
    return res.json();
  },

  async runAnalysis(data: {
    reference_audio_id: string;
    participant_audio_id: string;
    transcript: string;
    speech_category: string;
  }): Promise<AnalysisResult> {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Analysis execution failed');
    }
    return res.json();
  },

  async getAnalysis(analysisId: string): Promise<AnalysisResult> {
    const res = await fetch(`${API_BASE}/analysis/${analysisId}`);
    if (!res.ok) throw new Error(`Failed to load analysis ${analysisId}`);
    return res.json();
  },

  async deleteAnalysis(analysisId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/analysis/${analysisId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete analysis ${analysisId}`);
  },

  async getHistory(): Promise<AnalysisHistoryItem[]> {
    const res = await fetch(`${API_BASE}/history`);
    if (!res.ok) throw new Error('Failed to load history');
    return res.json();
  },

  async getDataset(params?: Record<string, string>): Promise<DatasetRecord[]> {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/dataset${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to load dataset records');
    return res.json();
  },

  async addDatasetRecord(record: DatasetRecord): Promise<DatasetRecord> {
    const res = await fetch(`${API_BASE}/dataset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to add dataset record');
    }
    return res.json();
  },

  async deleteDatasetRecord(recordingId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/dataset/${recordingId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete dataset record ${recordingId}`);
  },

  async validateDataset(): Promise<DatasetValidationResult> {
    const res = await fetch(`${API_BASE}/dataset/validate`);
    if (!res.ok) throw new Error('Failed to validate dataset');
    return res.json();
  },

  async getRubric(): Promise<RubricConfig> {
    const res = await fetch(`${API_BASE}/rubric`);
    if (!res.ok) throw new Error('Failed to load rubric');
    return res.json();
  },

  getAudioStreamUrl(audioIdOrPath: string): string {
    if (audioIdOrPath.startsWith('http://') || audioIdOrPath.startsWith('https://')) {
      return audioIdOrPath;
    }
    const origin = API_BASE.replace(/\/api\/?$/, '');
    if (audioIdOrPath.startsWith('/api/')) {
      return `${origin}${audioIdOrPath}`;
    }
    if (audioIdOrPath.endsWith('.wav') || audioIdOrPath.endsWith('.mp3')) {
      return `${API_BASE}/audio/dataset/${audioIdOrPath}`;
    }
    return `${API_BASE}/audio/stream/${audioIdOrPath}`;
  }
};
