import type { EmployeeTrainingRecord, MergedData } from '../types';

// Use environment variable for proxy server URL, with fallback to localhost
const PROXY_SERVER_URL = import.meta.env.VITE_PROXY_SERVER_URL || 'http://localhost:3002';

// FIX: Corrected a syntax error in the function declaration. It should be `const functionName = ...`.
const _create_summary = (data: (EmployeeTrainingRecord | MergedData)[], isMerged: boolean) => {
    const totalRecords = data.length;
    const completedCount = data.filter(d => d.course_completion_status === 'Completed').length;
    const completionRate = totalRecords > 0 ? (completedCount / totalRecords) * 100 : 0;

    const departments = [...new Set(data.map(d => d.department))].filter(Boolean);
    const departmentCompletion = departments.map(dept => {
        const deptRecords = data.filter(d => d.department === dept);
        const deptCompleted = deptRecords.filter(d => d.course_completion_status === 'Completed').length;
        const deptRate = deptRecords.length > 0 ? (deptCompleted / deptRecords.length) * 100 : 0;
        return { department: dept, completionRate: Math.round(deptRate), total: deptRecords.length };
    });

    let summary: any = {
        totalEnrollments: totalRecords,
        overallCompletionRate: Math.round(completionRate),
        departmentPerformance: departmentCompletion.sort((a,b) => (b.completionRate as number) - (a.completionRate as number)),
    };

    if(isMerged) {
        const mergedData = data as MergedData[];
        const regions = [...new Set(mergedData.map(d => d.Region))].filter(Boolean);
        const regionCompletion = regions.map(region => {
            const regionRecords = mergedData.filter(d => d.Region === region);
            const regionCompleted = regionRecords.filter(d => d.course_completion_status === 'Completed').length;
            const regionRate = regionRecords.length > 0 ? (regionCompleted / regionRecords.length) * 100 : 0;
            return { region, completionRate: Math.round(regionRate), total: regionRecords.length };
        });

        const trainers = [...new Set(mergedData.map(d => d.Trainer))].filter(Boolean);
        const trainerCompletion = trainers.map(trainer => {
            const trainerRecords = mergedData.filter(d => d.Trainer === trainer);
            const trainerCompleted = trainerRecords.filter(d => d.course_completion_status === 'Completed').length;
            const trainerRate = trainerRecords.length > 0 ? (trainerCompleted / trainerRecords.length) * 100 : 0;
            return { trainer, completionRate: Math.round(trainerRate), total: trainerRecords.length };
        });

        const ams = [...new Set(mergedData.map(d => d.AM))].filter(Boolean);
        const amCompletion = ams.map(am => {
            const amRecords = mergedData.filter(d => d.AM === am);
            const amCompleted = amRecords.filter(d => d.course_completion_status === 'Completed').length;
            const amRate = amRecords.length > 0 ? (amCompleted / amRecords.length) * 100 : 0;
            return { am, completionRate: Math.round(amRate), total: amRecords.length };
        });
        
        summary = {
            ...summary,
            regionPerformance: regionCompletion.sort((a,b) => (b.completionRate as number) - (a.completionRate as number)),
            trainerEffectiveness: trainerCompletion.sort((a,b) => (b.completionRate as number) - (a.completionRate as number)),
            areaManagerPerformance: amCompletion.sort((a,b) => (b.completionRate as number) - (a.completionRate as number)),
        }
    }

    return summary;
}


export const generateDashboardInsights = async (data: (EmployeeTrainingRecord | MergedData)[], isMerged: boolean): Promise<string> => {
    
    const summary = _create_summary(data, isMerged);

    const prompt = `
        As an expert data analyst specializing in Learning & Development, analyze the following employee training data summary.

        Data Summary:
        ${JSON.stringify(summary, null, 2)}

        Based on this summary, provide:
        1. **A brief, high-level overview** of the training program's health.
        2. **Key Insights & Observations:** Identify top-performing and lowest-performing groups (departments, regions, trainers, AMs if available). Point out any significant trends or patterns you can infer from the provided summary data.
        3. **Actionable Recommendations:** Suggest 2-3 specific, actionable steps the company could take to improve training completion rates, especially for underperforming segments.

        Format your response clearly with headings for each section. Be concise and professional. Use markdown formatting.
    `;

    try {
        console.log('🤖 Calling proxy server for AI insights...');
        
        // First check if the proxy server is running
        try {
            const healthCheck = await fetch(`${PROXY_SERVER_URL}/health`);
            if (!healthCheck.ok) {
                throw new Error('Proxy server health check failed');
            }
            console.log('✅ Proxy server is running');
        } catch (healthError) {
            return "🚨 **Proxy Server Not Running**\n\nThe backend server is not running. Please:\n\n1. **Open a new terminal**\n2. **Run:** `npm run server`\n3. **Or run both servers:** `npm run dev:full`\n\nThe server should start on http://localhost:3001\n\n**Why do we need this?** The Gemini API cannot be called directly from the browser due to CORS restrictions.";
        }

        // Call the proxy server
        const response = await fetch(`${PROXY_SERVER_URL}/api/gemini`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            
            if (response.status === 401) {
                return "❌ **API Key Error**\n\nYour Gemini API key appears to be invalid. Please check:\n- The key is correctly set in `.env.local`\n- The key has proper permissions for the Generative AI API\n- You have enabled the Generative AI API in Google Cloud Console";
            }
            if (response.status === 429) {
                return "⚠️ **API Quota Exceeded**\n\nYou've reached your API usage limit. Please check your Google Cloud Console for quota details or wait before trying again.";
            }
            if (response.status === 400) {
                return "⚠️ **Bad Request**\n\nThe request format might be incorrect. This could be due to:\n- Invalid prompt format\n- Request size too large\n- Model parameters not supported";
            }
            
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Successfully generated insights via proxy');
        return data.insights || "No insights generated. Please try again.";
        
    } catch (error) {
        console.error("❌ Error calling insights API:", error);
        
        if (error instanceof Error) {
            if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
                return "🌐 **Connection Error**\n\nCannot connect to the proxy server. Please ensure:\n\n1. **Backend server is running:** `npm run server`\n2. **Server is accessible:** http://localhost:3001/health\n3. **No firewall blocking the connection**\n\n**Alternative:** Run both servers with `npm run dev:full`";
            }
        }
        
        return `❌ **Error Generating Insights**\n\nAn unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}\n\n**Troubleshooting:**\n- Ensure the proxy server is running on port 3001\n- Check your API key configuration in .env.local\n- Try restarting both servers`;
    }
};