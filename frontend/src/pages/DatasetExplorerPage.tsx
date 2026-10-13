import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  Play, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  FileAudio 
} from 'lucide-react';
import { api } from '../services/api';
import { DatasetRecord, DatasetValidationResult } from '../types';
import { AudioPlayer } from '../components/AudioPlayer';
import { getSeverityBadgeClass } from '../utils/formatters';

export const DatasetExplorerPage: React.FC = () => {
  const [records, setRecords] = useState<DatasetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [flawFilter, setFlawFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [validationResult, setValidationResult] = useState<DatasetValidationResult | null>(null);
  const [activeAudioSrc, setActiveAudioSrc] = useState<string | null>(null);
  const [activeAudioTitle, setActiveAudioTitle] = useState<string>('');
  
  // New entry form modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecId, setNewRecId] = useState('');
  const [newTranscriptId, setNewTranscriptId] = useState('txt_living_expression_01');
  const [newAudioFile, setNewAudioFile] = useState('sample_reference.wav');
  const [newTranscript, setNewTranscript] = useState('We must remember that speech is not mere words, but the living expression of thought and character.');
  const [newRecordingType, setNewRecordingType] = useState<'ideal' | 'flawed'>('flawed');
  const [newFlawType, setNewFlawType] = useState('excessive_speaking_rate');
  const [newSeverity, setNewSeverity] = useState('medium');
  const [newStart, setNewStart] = useState<number | undefined>(2.5);
  const [newEnd, setNewEnd] = useState<number | undefined>(4.2);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recs, val] = await Promise.all([
        api.getDataset(),
        api.validateDataset(),
      ]);
      setRecords(recs);
      setValidationResult(val);
    } catch (err) {
      console.error('Failed to load dataset records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (recId: string) => {
    if (!window.confirm(`Are you sure you want to remove dataset record "${recId}"?`)) return;
    try {
      await api.deleteDatasetRecord(recId);
      loadData();
    } catch (err) {
      console.error('Failed to delete record:', err);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecId.trim()) return;

    const newRecord: DatasetRecord = {
      recording_id: newRecId.trim(),
      transcript_id: newTranscriptId.trim(),
      audio_file: newAudioFile.trim(),
      transcript: newTranscript.trim(),
      speech_category: 'Persuasive Oratory',
      recording_type: newRecordingType,
      flaw_type: newRecordingType === 'ideal' ? 'none' : newFlawType,
      severity: newRecordingType === 'ideal' ? 'none' : newSeverity,
      speaker_id: 'spk_annotator_01',
      start: newRecordingType === 'ideal' ? null : newStart,
      end: newRecordingType === 'ideal' ? null : newEnd,
      alignment_method: 'acoustic_dtw',
      annotation_status: 'verified',
      metadata: { added_at: new Date().toISOString() },
    };

    try {
      await api.addDatasetRecord(newRecord);
      setShowAddModal(false);
      setNewRecId('');
      loadData();
    } catch (err) {
      console.error('Failed to save dataset record:', err);
    }
  };

  // Filter records
  const filteredRecords = records.filter((r) => {
    if (flawFilter !== 'all' && r.flaw_type !== flawFilter) return false;
    if (typeFilter !== 'all' && r.recording_type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.recording_id.toLowerCase().includes(q) ||
        r.transcript.toLowerCase().includes(q) ||
        r.flaw_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Contrastive Dataset Explorer
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Paired speech variations for acoustic benchmark evaluation & temporal flaw grounding.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Dataset Entry</span>
          </button>
          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            title="Reload dataset"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Validation Status Banner */}
      {validationResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center space-x-2">
            {validationResult.is_valid ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            )}
            <span className="font-semibold text-slate-200">
              Dataset Integrity Status:
            </span>
            <span className={validationResult.is_valid ? 'text-emerald-400' : 'text-amber-400'}>
              {validationResult.is_valid
                ? 'All referenced audio files verified on filesystem'
                : `${validationResult.missing_audio_files.length} audio file(s) missing`}
            </span>
          </div>
          <div className="text-slate-400 font-mono">
            {validationResult.valid_records_with_audio} / {validationResult.total_records} valid records
          </div>
        </div>
      )}

      {/* Active Audio Player if selected */}
      {activeAudioSrc && (
        <div className="bg-slate-900 border border-blue-500/50 rounded-xl p-4 shadow-md">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-blue-400">
              Playing Dataset Recording: {activeAudioTitle}
            </span>
            <button
              onClick={() => setActiveAudioSrc(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close Player
            </button>
          </div>
          <AudioPlayer label={activeAudioTitle} src={activeAudioSrc} />
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by ID, transcript, or flaw type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="ideal">Ideal Baselines</option>
            <option value="flawed">Flawed Deliveries</option>
          </select>

          <select
            value={flawFilter}
            onChange={(e) => setFlawFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Flaws</option>
            <option value="none">None (Ideal)</option>
            <option value="excessive_speaking_rate">Excessive Rate</option>
            <option value="unusually_slow_delivery">Slow Delivery</option>
            <option value="excessive_pause">Excessive Pause</option>
            <option value="reduced_pitch_variation">Monotone Pitch</option>
          </select>
        </div>
      </div>

      {/* Dataset Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Recording ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Flaw Category</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Ground-Truth Window</th>
                <th className="py-3 px-4">Audio File</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No matching dataset records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.recording_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-200">
                      {r.recording_id}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          r.recording_type === 'ideal'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {r.recording_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      {r.flaw_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4">
                      {r.severity !== 'none' ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold ${getSeverityBadgeClass(
                            r.severity
                          )}`}
                        >
                          {r.severity}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {r.start !== null && r.start !== undefined && r.end !== null && r.end !== undefined
                        ? `${r.start.toFixed(2)}s – ${r.end.toFixed(2)}s`
                        : 'Full Recording'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 truncate max-w-xs">
                      {r.audio_file}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setActiveAudioSrc(api.getAudioStreamUrl(r.audio_file));
                          setActiveAudioTitle(r.recording_id);
                        }}
                        className="p-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white transition-colors"
                        title="Listen to audio"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.recording_id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 hover:text-rose-300 text-slate-400 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Dataset Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Add Contrastive Dataset Entry</h3>
            
            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Recording ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. rec_sample_fast_006"
                  value={newRecId}
                  onChange={(e) => setNewRecId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Audio Filename</label>
                <input
                  type="text"
                  required
                  value={newAudioFile}
                  onChange={(e) => setNewAudioFile(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Recording Type</label>
                  <select
                    value={newRecordingType}
                    onChange={(e: any) => setNewRecordingType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none"
                  >
                    <option value="flawed">Flawed</option>
                    <option value="ideal">Ideal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {newRecordingType === 'flawed' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">Flaw Category</label>
                    <select
                      value={newFlawType}
                      onChange={(e) => setNewFlawType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none"
                    >
                      <option value="excessive_speaking_rate">Excessive Speaking Rate</option>
                      <option value="unusually_slow_delivery">Unusually Slow Delivery</option>
                      <option value="excessive_pause">Excessive Pause</option>
                      <option value="reduced_pitch_variation">Reduced Pitch Variation</option>
                      <option value="unusual_energy_variation">Unusual Energy Variation</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1">Start Time (sec)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newStart ?? ''}
                        onChange={(e) => setNewStart(parseFloat(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">End Time (sec)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newEnd ?? ''}
                        onChange={(e) => setNewEnd(parseFloat(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
