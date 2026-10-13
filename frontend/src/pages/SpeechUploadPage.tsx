import React, { useState } from 'react';
import { 
  Upload, 
  FileAudio, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  ArrowRight, 
  Sparkles, 
  Loader2 
} from 'lucide-react';
import { api } from '../services/api';
import { SpeechCategory, AnalysisResult } from '../types';
import { AudioPlayer } from '../components/AudioPlayer';
import { formatTimeShort } from '../utils/formatters';

interface SpeechUploadPageProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
}

export const SpeechUploadPage: React.FC<SpeechUploadPageProps> = ({ onAnalysisComplete }) => {
  // Upload states
  const [refFile, setRefFile] = useState<File | null>(null);
  const [refAudioId, setRefAudioId] = useState<string>('');
  const [refMeta, setRefMeta] = useState<any>(null);
  const [uploadingRef, setUploadingRef] = useState(false);

  const [partFile, setPartFile] = useState<File | null>(null);
  const [partAudioId, setPartAudioId] = useState<string>('');
  const [partMeta, setPartMeta] = useState<any>(null);
  const [uploadingPart, setUploadingPart] = useState(false);

  // Configuration
  const [transcript, setTranscript] = useState(
    'We must remember that speech is not mere words, but the living expression of thought and character.'
  );
  const [category, setCategory] = useState<SpeechCategory>('Persuasive Oratory');

  // Execution states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sample Presets for Instant 1-Click Testing
  const handleLoadPreset = (presetName: string) => {
    setErrorMessage(null);
    setTranscript(
      'We must remember that speech is not mere words, but the living expression of thought and character.'
    );
    setCategory('Persuasive Oratory');
    setRefAudioId('sample_reference.wav');
    setRefMeta({
      filename: 'sample_reference.wav',
      duration_seconds: 8.29,
      format: 'WAV',
      size_bytes: 365612,
      url: api.getAudioStreamUrl('sample_reference.wav'),
    });

    if (presetName === 'pause') {
      setPartAudioId('sample_excessive_pause.wav');
      setPartMeta({
        filename: 'sample_excessive_pause.wav',
        duration_seconds: 10.09,
        format: 'WAV',
        size_bytes: 445012,
        url: api.getAudioStreamUrl('sample_excessive_pause.wav'),
      });
    } else if (presetName === 'fast') {
      setPartAudioId('sample_fast_delivery.wav');
      setPartMeta({
        filename: 'sample_fast_delivery.wav',
        duration_seconds: 7.05,
        format: 'WAV',
        size_bytes: 311012,
        url: api.getAudioStreamUrl('sample_fast_delivery.wav'),
      });
    } else if (presetName === 'monotone') {
      setPartAudioId('sample_monotone_pitch.wav');
      setPartMeta({
        filename: 'sample_monotone_pitch.wav',
        duration_seconds: 8.29,
        format: 'WAV',
        size_bytes: 365612,
        url: api.getAudioStreamUrl('sample_monotone_pitch.wav'),
      });
    } else {
      setPartAudioId('sample_slow_delivery.wav');
      setPartMeta({
        filename: 'sample_slow_delivery.wav',
        duration_seconds: 11.76,
        format: 'WAV',
        size_bytes: 518012,
        url: api.getAudioStreamUrl('sample_slow_delivery.wav'),
      });
    }
  };

  const handleFileUpload = async (file: File, isRef: boolean) => {
    setErrorMessage(null);
    if (!file.name.match(/\.(wav|mp3|ogg|m4a|flac)$/i)) {
      setErrorMessage('Unsupported audio file format. Please upload WAV or MP3 audio.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('Audio file exceeds 50MB size limit.');
      return;
    }

    try {
      if (isRef) {
        setUploadingRef(true);
        setRefFile(file);
        const res = await api.uploadAudio(file);
        setRefAudioId(res.audio_id);
        setRefMeta(res);
      } else {
        setUploadingPart(true);
        setPartFile(file);
        const res = await api.uploadAudio(file);
        setPartAudioId(res.audio_id);
        setPartMeta(res);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload audio file');
    } finally {
      if (isRef) setUploadingRef(false);
      else setUploadingPart(false);
    }
  };

  const handleSubmitAnalysis = async () => {
    setErrorMessage(null);
    if (!refAudioId) {
      setErrorMessage('Please upload or select an ideal reference audio baseline.');
      return;
    }
    if (!partAudioId) {
      setErrorMessage('Please upload or select the participant recording to evaluate.');
      return;
    }
    if (!transcript.trim()) {
      setErrorMessage('Spoken transcript cannot be empty.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await api.runAnalysis({
        reference_audio_id: refAudioId,
        participant_audio_id: partAudioId,
        transcript: transcript.trim(),
        speech_category: category,
      });
      onAnalysisComplete(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Analysis execution failed. Please verify files and transcript.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Speech Upload & Analysis Setup
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload paired reference and participant speech recordings for contrastive evaluation under Track C rubric.
        </p>
      </div>

      {/* Preset Quick Loader */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-slate-200">
            Quick Test Presets (Zero Upload Required):
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleLoadPreset('pause')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            Excessive Pause Sample
          </button>
          <button
            onClick={() => handleLoadPreset('fast')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            Fast Delivery Sample
          </button>
          <button
            onClick={() => handleLoadPreset('monotone')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            Monotone Pitch Sample
          </button>
          <button
            onClick={() => handleLoadPreset('slow')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            Slow Delivery Sample
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-rose-950/60 border border-rose-800/80 rounded-xl p-4 text-xs text-rose-300 flex items-start space-x-3 shadow-sm">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Dual Audio Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reference Audio Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase text-sky-400">
              Reference Speech Baseline
            </span>
            {refMeta && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          </div>

          <div
            className="border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-950/40"
            onClick={() => document.getElementById('ref-upload-input')?.click()}
          >
            <input
              id="ref-upload-input"
              type="file"
              accept=".wav,.mp3"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0], true);
              }}
            />
            <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-xs font-medium text-slate-200">
              {uploadingRef ? 'Uploading...' : 'Upload Reference Audio (WAV/MP3)'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Drag & drop or click to browse
            </p>
          </div>

          {refMeta && (
            <div className="space-y-3">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
                <div className="text-slate-300 truncate">File: {refMeta.filename}</div>
                <div className="text-slate-400">
                  Duration: {formatTimeShort(refMeta.duration_seconds)} • Format: {refMeta.format || 'WAV'}
                </div>
              </div>
              <AudioPlayer
                label="Preview Reference Baseline"
                src={refMeta.url || api.getAudioStreamUrl(refAudioId)}
                duration={refMeta.duration_seconds}
              />
            </div>
          )}
        </div>

        {/* Participant Audio Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase text-amber-400">
              Participant Audio Recording
            </span>
            {partMeta && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          </div>

          <div
            className="border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-950/40"
            onClick={() => document.getElementById('part-upload-input')?.click()}
          >
            <input
              id="part-upload-input"
              type="file"
              accept=".wav,.mp3"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0], false);
              }}
            />
            <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-xs font-medium text-slate-200">
              {uploadingPart ? 'Uploading...' : 'Upload Participant Audio (WAV/MP3)'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Drag & drop or click to browse
            </p>
          </div>

          {partMeta && (
            <div className="space-y-3">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
                <div className="text-slate-300 truncate">File: {partMeta.filename}</div>
                <div className="text-slate-400">
                  Duration: {formatTimeShort(partMeta.duration_seconds)} • Format: {partMeta.format || 'WAV'}
                </div>
              </div>
              <AudioPlayer
                label="Preview Participant Recording"
                src={partMeta.url || api.getAudioStreamUrl(partAudioId)}
                duration={partMeta.duration_seconds}
              />
            </div>
          )}
        </div>
      </div>

      {/* Transcript & Speech Category Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 shadow-sm">
        <h3 className="text-sm font-semibold text-white">
          Transcript & Category Specification
        </h3>

        {/* Speech Category */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">
            Speech Competition Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                'Persuasive Oratory',
                'Interpretive Reading',
                'Declamation',
                'Extemporaneous Speech',
              ] as SpeechCategory[]
            ).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`py-2 px-3 rounded-lg text-xs font-medium text-center border transition-all ${
                  category === cat
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Spoken Transcript Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 flex justify-between">
            <span>Spoken Speech Transcript (Required for DTW Alignment)</span>
            <span className="text-slate-500 font-mono text-[11px]">
              {transcript.trim().split(/\s+/).filter(Boolean).length} words
            </span>
          </label>
          <textarea
            rows={3}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-600 font-serif leading-relaxed"
            placeholder="Enter the verbatim transcript of the spoken performance..."
          />
          <p className="text-[11px] text-slate-500">
            * Both reference and participant speech recordings must recite the same transcript to enable temporal grounding.
          </p>
        </div>
      </div>

      {/* Execute Analysis Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmitAnalysis}
          disabled={isAnalyzing}
          className={`flex items-center space-x-2 px-8 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-xl ${
            isAnalyzing
              ? 'bg-blue-700 text-blue-200 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 hover:shadow-blue-500/40 hover:-translate-y-0.5'
          }`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Running Feature Extraction & Alignment...</span>
            </>
          ) : (
            <>
              <span>Run Contrastive Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
