
import React, { useState, useEffect } from 'react';
import type { EmployeeTrainingRecord, MergedData } from '../types';
import { generateDashboardInsights } from '../services/geminiService';
import { Spinner } from './Spinner';

interface GeminiInsightsProps {
  data: (EmployeeTrainingRecord | MergedData)[];
  isMerged: boolean;
}

// Helper to format the markdown-like text from Gemini
const FormattedInsightText: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    return (
        <div className="prose prose-invert max-w-none prose-p:my-1 prose-p:text-brand-text-secondary prose-headings:text-brand-text-primary prose-strong:text-brand-text-primary">
            {lines.map((line, index) => {
                if (line.startsWith('**') && line.endsWith('**')) {
                    return <h4 key={index} className="font-bold mt-4 mb-2 text-brand-primary">{line.replace(/\*\*/g, '')}</h4>;
                }
                 if (line.startsWith('*')) {
                    return <p key={index} className="ml-4 list-item list-disc">{line.substring(1).trim()}</p>;
                }
                if (line.match(/^\d\.\s/)) {
                    return <p key={index} className="ml-4">{line}</p>;
                }
                return <p key={index}>{line}</p>;
            })}
        </div>
    );
};


const GeminiInsights: React.FC<GeminiInsightsProps> = ({ data, isMerged }) => {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      setIsLoading(true);
      setError(null);
      
      // Try to load pre-generated insights first (for GitHub Pages)
      try {
        const response = await fetch('/insights.json');
        if (response.ok) {
          const preGenerated = await response.json();
          setInsights(preGenerated.insights);
          setIsLoading(false);
          console.log('✅ Loaded pre-generated insights from GitHub Actions');
          return;
        }
      } catch (e) {
        console.log('ℹ️ No pre-generated insights found');
      }
      
      // If no pre-generated insights, show a helpful message instead of trying live generation
      setIsLoading(false);
      setInsights(`## 🤖 AI Insights Coming Soon!

**Pre-generated insights are not available yet.**

### How to Generate Insights:

**Option 1: Automatic (Recommended)**
- Insights will be automatically generated when you push code changes to GitHub
- The GitHub Actions workflow runs daily at midnight UTC
- Check the **Actions** tab in your repository to see the workflow status

**Option 2: Manual Trigger**
1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Select **Generate AI Insights** workflow
4. Click **Run workflow** → **Run workflow**
5. Wait 1-2 minutes for completion
6. Refresh this page to see the insights

**Option 3: Live Generation (Advanced)**
If you want real-time insights generation:
- Set up a proxy server (see AI_SETUP_GUIDE.md)
- Or use Vercel serverless functions

### ℹ️ Why Pre-Generated?
Pre-generated insights are:
- ✅ **Faster** - Load instantly from your site
- ✅ **Free** - No external services needed
- ✅ **Reliable** - Always available once generated

**Note:** The first insights generation happens automatically after you push this update to GitHub!`);
    };

    if (data.length > 0) {
      fetchInsights();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isMerged]);

  return (
    <div>
      <div className="flex items-center mb-8">
        <div className="p-3 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">AI-Powered Insights</h3>
          <p className="text-slate-600 dark:text-slate-400">Intelligent analysis by Gemini AI</p>
        </div>
      </div>
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <Spinner />
            <div className="absolute inset-0 animate-ping">
              <div className="w-8 h-8 border-2 border-brand-primary/30 rounded-full"></div>
            </div>
          </div>
          <p className="mt-6 text-slate-600 dark:text-slate-400 text-lg font-medium">Generating insights with Gemini AI...</p>
          <p className="mt-2 text-slate-500 dark:text-slate-500 text-sm">This may take a few moments</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
          </div>
        </div>
      )}
      {insights && !isLoading && (
        <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-6 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30">
          <FormattedInsightText text={insights} />
        </div>
      )}
    </div>
  );
};

export default GeminiInsights;
