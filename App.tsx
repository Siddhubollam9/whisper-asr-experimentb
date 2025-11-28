import React, { useState, useEffect } from 'react';
import { ICONS, MODEL_NAME_DISPLAY } from './constants';
import { ExperimentData, PageState } from './types';
import { Recorder } from './components/Recorder';
import { WerChart } from './components/WerChart';
import { transcribeAudio, analyzeErrors } from './services/geminiService';
import { calculateWER, getWerColor } from './services/werService';

const App = () => {
  const [experiments, setExperiments] = useState<ExperimentData[]>([]);
  const [page, setPage] = useState<PageState>(PageState.DASHBOARD);
  const [selectedExperiment, setSelectedExperiment] = useState<ExperimentData | null>(null);

  // New experiment form state
  const [tempAudio, setTempAudio] = useState<Blob | null>(null);
  const [referenceText, setReferenceText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [tempAudioUrl, setTempAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    // Load some dummy data if empty (Simulated previous Whisper runs)
    if (experiments.length === 0) {
       // Optional: Preload data could go here, but starting clean is fine.
    }
  }, []);

  const handleCreateExperiment = async () => {
    if (!tempAudio || !referenceText) return;

    setIsProcessing(true);
    const id = Date.now().toString();
    
    try {
      // 1. Transcribe
      const hypothesis = await transcribeAudio(tempAudio);
      
      // 2. Calculate WER
      const { wer } = calculateWER(referenceText, hypothesis);
      
      // 3. Analyze
      const analysis = await analyzeErrors(referenceText, hypothesis);

      const newExp: ExperimentData = {
        id,
        timestamp: Date.now(),
        audioBlob: tempAudio,
        audioUrl: tempAudioUrl!,
        referenceText,
        hypothesisText: hypothesis,
        wer,
        modelName: MODEL_NAME_DISPLAY,
        analysis,
        isLoading: false
      };

      setExperiments(prev => [newExp, ...prev]);
      setPage(PageState.DASHBOARD);
      
      // Reset form
      setTempAudio(null);
      setReferenceText("");
      setTempAudioUrl(null);

    } catch (e) {
      alert("Experiment failed. Check console.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAudioCapture = (blob: Blob) => {
    setTempAudio(blob);
    const url = URL.createObjectURL(blob);
    setTempAudioUrl(url);
  };

  const deleteExperiment = (id: string) => {
    setExperiments(prev => prev.filter(e => e.id !== id));
    if (selectedExperiment?.id === id) {
      setSelectedExperiment(null);
      setPage(PageState.DASHBOARD);
    }
  };

  const renderDashboard = () => {
    const avgWer = experiments.length 
      ? (experiments.reduce((acc, curr) => acc + curr.wer, 0) / experiments.length * 100).toFixed(1)
      : "0.0";

    return (
      <div className="space-y-8 animate-fade-in">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Samples</p>
              <h2 className="text-3xl font-bold text-white mt-1">{experiments.length}</h2>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
              <ICONS.FileAudio size={24} />
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Average WER</p>
              <h2 className="text-3xl font-bold text-white mt-1">{avgWer}%</h2>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
              <ICONS.Activity size={24} />
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
               <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">WER Distribution</p>
               <ICONS.BarChart2 size={18} className="text-slate-500"/>
            </div>
            <WerChart data={experiments} />
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-slate-100">Recent Experiments</h3>
          <button 
            onClick={() => setPage(PageState.NEW_EXPERIMENT)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            <ICONS.Plus size={18} />
            New Experiment
          </button>
        </div>

        {/* List */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {experiments.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <ICONS.BrainCircuit size={48} className="mx-auto mb-4 opacity-20" />
              <p>No experiments yet. Start by recording audio.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 text-sm border-b border-slate-700">
                  <th className="p-4 font-medium">ID</th>
                  <th className="p-4 font-medium">Reference Preview</th>
                  <th className="p-4 font-medium">WER</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {experiments.map((exp) => (
                  <tr 
                    key={exp.id} 
                    onClick={() => { setSelectedExperiment(exp); setPage(PageState.DETAILS); }}
                    className="hover:bg-slate-700/50 cursor-pointer transition-colors group"
                  >
                    <td className="p-4 text-slate-500 font-mono text-xs">#{exp.id.slice(-4)}</td>
                    <td className="p-4 text-slate-300 truncate max-w-xs">{exp.referenceText}</td>
                    <td className={`p-4 font-bold ${getWerColor(exp.wer)}`}>
                      {(exp.wer * 100).toFixed(1)}%
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteExperiment(exp.id); }}
                        className="p-2 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <ICONS.Trash2 size={16} />
                      </button>
                      <button className="p-2 text-slate-400 group-hover:text-indigo-400 ml-2">
                        <ICONS.ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  const renderNewExperiment = () => (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <button 
        onClick={() => setPage(PageState.DASHBOARD)} 
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
      >
        <ICONS.ArrowLeft size={18} /> Back to Dashboard
      </button>

      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">New ASR Experiment</h2>
          <p className="text-slate-400">Step 1: Provide audio input (Indian-English accent preferred).</p>
        </div>

        <Recorder onAudioCaptured={handleAudioCapture} />
        
        {tempAudioUrl && (
          <div className="bg-slate-900/50 p-4 rounded-lg flex items-center gap-4 border border-slate-700">
            <div className="bg-indigo-500/20 p-2 rounded-full text-indigo-400">
               <ICONS.CheckCircle size={20} />
            </div>
            <span className="text-slate-300 text-sm">Audio captured successfully</span>
            <audio src={tempAudioUrl} controls className="h-8 w-48 ml-auto" />
          </div>
        )}

        <div className="space-y-3">
          <label className="block text-slate-400 font-medium">Step 2: Enter Ground Truth (Reference Text)</label>
          <textarea
            value={referenceText}
            onChange={(e) => setReferenceText(e.target.value)}
            placeholder="Type exactly what was said in the audio..."
            className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
          />
        </div>

        <div className="pt-4 border-t border-slate-700 flex justify-end">
           <button
             disabled={!tempAudio || !referenceText || isProcessing}
             onClick={handleCreateExperiment}
             className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-all ${
               (!tempAudio || !referenceText || isProcessing) 
                 ? 'bg-slate-700 cursor-not-allowed text-slate-500' 
                 : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/25'
             }`}
           >
             {isProcessing ? (
               <>
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 Processing...
               </>
             ) : (
               <>
                 <ICONS.BrainCircuit size={20} />
                 Run Experiment
               </>
             )}
           </button>
        </div>
      </div>
    </div>
  );

  const renderDetails = () => {
    if (!selectedExperiment) return null;
    const { referenceText, hypothesisText, wer, analysis, audioUrl } = selectedExperiment;

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <button 
          onClick={() => setPage(PageState.DASHBOARD)} 
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
        >
          <ICONS.ArrowLeft size={18} /> Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-semibold text-white">Playback</h3>
                 <span className="text-xs px-2 py-1 bg-slate-700 rounded text-slate-300">ID: {selectedExperiment.id}</span>
               </div>
               <audio src={audioUrl} controls className="w-full" />
            </div>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ground Truth (Reference)</h4>
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 text-slate-300 leading-relaxed">
                  {referenceText}
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Model Output (Hypothesis)</span>
                  <span className="text-indigo-400 text-[10px] bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{selectedExperiment.modelName}</span>
                </h4>
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 text-slate-200 leading-relaxed font-mono text-sm">
                  {hypothesisText}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
             <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col items-center justify-center py-10">
                <div className="text-sm text-slate-400 font-medium uppercase mb-2">Word Error Rate</div>
                <div className={`text-5xl font-black ${getWerColor(wer)}`}>
                  {(wer * 100).toFixed(1)}%
                </div>
                <div className="mt-4 text-xs text-slate-500 text-center px-4">
                  Lower is better. <br/> 0% means perfect transcription.
                </div>
             </div>

             <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <h3 className="flex items-center gap-2 text-indigo-400 font-semibold mb-4">
                  <ICONS.BrainCircuit size={18} />
                  AI Analysis
                </h3>
                <div className="text-sm text-slate-300 leading-relaxed space-y-2">
                   {analysis ? analysis : "Analysis unavailable."}
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans pb-20">
      {/* Navbar */}
      <header className="bg-slate-800/50 backdrop-blur-lg border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <ICONS.Activity size={20} />
             </div>
             <div>
               <h1 className="font-bold text-white text-lg leading-tight">ASR Workbench</h1>
               <p className="text-[10px] text-slate-400 uppercase tracking-widest">Mini Project Experiment</p>
             </div>
          </div>
          <div className="text-xs text-slate-500 font-mono hidden md:block">
            Powered by Gemini 2.5 Flash
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {page === PageState.DASHBOARD && renderDashboard()}
        {page === PageState.NEW_EXPERIMENT && renderNewExperiment()}
        {page === PageState.DETAILS && renderDetails()}
      </main>
    </div>
  );
};

export default App;
