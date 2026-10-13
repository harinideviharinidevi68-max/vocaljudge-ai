import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeDashboard } from './pages/HomeDashboard';
import { SpeechUploadPage } from './pages/SpeechUploadPage';
import { AnalysisResultsPage } from './pages/AnalysisResultsPage';
import { DatasetExplorerPage } from './pages/DatasetExplorerPage';
import { EvaluationRubricPage } from './pages/EvaluationRubricPage';
import { AnalysisHistoryPage } from './pages/AnalysisHistoryPage';
import { ProjectDocsPage } from './pages/ProjectDocsPage';
import { api } from './services/api';
import { AnalysisResult } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [systemHealthy, setSystemHealthy] = useState<boolean>(true);

  // Poll system health on mount
  useEffect(() => {
    api.getHealth()
      .then(() => setSystemHealthy(true))
      .catch(() => setSystemHealthy(false));
  }, []);

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setCurrentAnalysis(result);
    setActiveTab('results');
  };

  const handleViewAnalysis = async (analysisId: string) => {
    try {
      const result = await api.getAnalysis(analysisId);
      setCurrentAnalysis(result);
      setActiveTab('results');
    } catch (err) {
      console.error('Failed to open analysis:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemHealthy={systemHealthy}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'home' && (
          <HomeDashboard
            onStartAnalysis={() => setActiveTab('upload')}
            onOpenDataset={() => setActiveTab('dataset')}
            onViewAnalysis={handleViewAnalysis}
          />
        )}

        {activeTab === 'upload' && (
          <SpeechUploadPage
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}

        {activeTab === 'results' && currentAnalysis && (
          <AnalysisResultsPage
            analysis={currentAnalysis}
            onBackToUpload={() => setActiveTab('upload')}
          />
        )}

        {activeTab === 'dataset' && (
          <DatasetExplorerPage />
        )}

        {activeTab === 'rubric' && (
          <EvaluationRubricPage />
        )}

        {activeTab === 'history' && (
          <AnalysisHistoryPage
            onSelectAnalysis={(res) => {
              setCurrentAnalysis(res);
              setActiveTab('results');
            }}
          />
        )}

        {activeTab === 'docs' && (
          <ProjectDocsPage />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-400 no-print">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-medium text-slate-400">
            VocalJudge AI — Contrastive Speech Analytics & Temporal Flaw Grounding
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            Multimodal AI Hackathon 2026 • Track C • Built with FastAPI, Librosa, React & Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
