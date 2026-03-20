// 12 march horizontal format
import React, { useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ChatAssistant from '../components/ChatAssistant'; 
import { logUserAction } from '../services/api'; // INSTANT ADMIN NOTIFICATION HOOK

const Report = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};

  // --- 1. ULTIMATE UNPACKER (HANDLES LIVE & DASHBOARD HISTORY) ---
  // If coming from Dashboard History, data is buried in full_data.
  const rootPayload = state.full_data || state;
  const aiPayload = rootPayload.feedback || rootPayload.report || rootPayload || {};

  // Find the critical arrays
  const rawAnswers = rootPayload.answers || rootPayload.questions || [];
  const rawReviews = aiPayload.question_reviews || rootPayload.question_reviews || [];

  // Find the text metadata
  const rawTopic = state.topic || rootPayload.selectedDomain || rootPayload.domain || aiPayload.topic || "Standard Evaluation";
  const rawScore = state.total_score || aiPayload.score || rootPayload.score || 0;
  const rawSummary = state.summary || aiPayload.summary || rootPayload.summary || "No summary available.";
  const rawRoadmap = aiPayload.roadmap || rootPayload.roadmap || "No roadmap data found.";
  const rawSilentKillers = aiPayload.silent_killers || rootPayload.silent_killers || [];
  
  const targetDomain = rawTopic.replace(/_/g, " ").toUpperCase();
  
  // SECURE EXTRACTION: ALWAYS KEEP FLAG COUNT AND TIME TAKEN
  const integrity = state.feedback?.integrity || state.integrity || rootPayload.integrity || aiPayload.integrity || { score: 100, count: 0 };
  const timeTaken = state.feedback?.timeTaken || state.timeTaken || rootPayload.timeTaken || aiPayload.timeTaken || "N/A";

  // --- SILENT KILLER CATCHER (DEBUG LOGS) ---
  useEffect(() => {
      console.group("🕵️ SILENT KILLER CATCHER (DEBUG LOGS)");
      console.log("1. Raw Location State Received:", state);
      console.log("2. Extracted Answers (User Input Array):", rawAnswers);
      console.log("3. Extracted Reviews (AI Feedback Array):", rawReviews);
      console.log("4. Extracted Roadmap:", rawRoadmap);
      console.log("5. Extracted Silent Killers:", rawSilentKillers);
      console.groupEnd();
  }, [state, rawAnswers, rawReviews, rawRoadmap, rawSilentKillers]);

  // --- HELPER: SMART TEXT FORMATTER (HTML) ---
  const renderFormattedText = (text, isBold = false) => {
    if (!text) return <span className="text-gray-400 italic">No data provided.</span>;

    let safeText = text;
    if (Array.isArray(text)) safeText = text.join('\n');
    else if (typeof text === 'object') safeText = JSON.stringify(text, null, 2);
    else safeText = String(text);

    const lines = safeText.split(/\n/).filter(line => line.trim().length > 0);

    if (lines.length > 1) {
        return (
            <ul className={`list-disc ml-4 space-y-1 ${isBold ? 'font-bold text-slate-800' : 'font-medium text-slate-700'}`}>
                {lines.map((line, idx) => (
                    <li key={idx} className="pl-1">
                        {line.replace(/^-|\*|•/, '').trim()}
                    </li>
                ))}
            </ul>
        );
    }
    
    return <p className={`${isBold ? 'font-bold text-slate-800' : 'font-medium text-slate-700'}`}>{safeText}</p>;
  };

  // --- HELPER: PDF TEXT FORMATTER ---
  const formatTextForPDF = (text) => {
    if (!text) return "N/A";

    let safeText = text;
    if (Array.isArray(text)) safeText = text.join('\n');
    else if (typeof text === 'object') safeText = JSON.stringify(text);
    else safeText = String(text);

    const items = safeText.split('\n').filter(item => item.trim() !== '');
    if (items.length > 1) {
      return items.map(item => `• ${item.replace(/^[-*•]\s*/, '')}`).join('\n');
    }
    return safeText;
  };

  // --- 2. FORENSIC DATA RECONCILER (ABSOLUTE MERGE PROTOCOL) ---
  const processedData = useMemo(() => {
    // Determine the max size of our arrays to make sure we drop NOTHING.
    const maxLen = Math.max(rawAnswers.length, rawReviews.length);
    const finalReviews = [];

    for (let i = 0; i < maxLen; i++) {
        const ans = rawAnswers[i] || {};
        const rev = rawReviews[i] || {};
        
        finalReviews.push({
            question: ans.question || rev.question || "Question data missing",
            user_answer: ans.answer || rev.user_answer || "No response provided",
            score: rev.score || 0,
            feedback: rev.feedback || "Analysis pending or timed out.",
            ideal_answer: rev.ideal_answer || "N/A"
        });
    }

    return {
        score: rawScore,
        summary: rawSummary,
        roadmap: rawRoadmap,
        silent_killers: rawSilentKillers,
        question_reviews: finalReviews
    };
  }, [rawAnswers, rawReviews, rawScore, rawSummary, rawRoadmap, rawSilentKillers]);

  // --- 3. PDF GENERATION LOGIC & ADMIN TELEMETRY ---
  const handleDownload = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Page Config
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    const safeBottom = pageHeight - margin - 20;
    let cursorY = margin + 10;

    const drawPageBorder = () => {
        doc.setDrawColor(200);
        doc.setLineWidth(0.5);
        doc.rect(margin, margin, contentWidth, pageHeight - (margin * 2));
    };

    const checkPageBreak = (heightNeeded) => {
      if (cursorY + heightNeeded > safeBottom) {
        doc.addPage();
        drawPageBorder();
        cursorY = margin + 15;
        return true;
      }
      return false;
    };

    // --- TRUNCATION FIX: DYNAMIC LINE-BY-LINE WRAPPER ---
    const addWrappedText = (text, fontSize = 11, fontType = 'normal', color = [60, 60, 60]) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontType);
        doc.setTextColor(...color);
        
        const lines = doc.splitTextToSize(text || "N/A", contentWidth - 10);
        const lineHeight = fontSize * 0.4 * 1.5; // 1.5 spacing multiplier
        
        // Check page break PER LINE so nothing ever gets cut off at the bottom
        lines.forEach(line => {
            if (checkPageBreak(lineHeight)) {
                // Re-apply styles after a page break
                doc.setFontSize(fontSize);
                doc.setFont('helvetica', fontType);
                doc.setTextColor(...color);
            }
            doc.text(line, margin + 5, cursorY);
            cursorY += lineHeight;
        });
        cursorY += 2; // Bottom padding for block
    };

    // --- PAGE 1: EXECUTIVE SUMMARY ---
    drawPageBorder();

    // 1. Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 33, 33);
    doc.text(`${targetDomain} REPORT`, margin + 5, cursorY);
    cursorY += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`SESSION ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`, margin + 5, cursorY);
    doc.text(`DATE: ${new Date().toLocaleDateString()}`, pageWidth - margin - 35, cursorY);
    cursorY += 15;

    // 2. Scorecard Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin + 5, cursorY, contentWidth - 10, 45, 3, 3, 'FD');
    
    // Score
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    const scoreColor = processedData.score >= 80 ? [34, 197, 94] : processedData.score >= 50 ? [234, 179, 8] : [239, 68, 68];
    doc.setTextColor(...scoreColor);
    doc.text(`${processedData.score}`, margin + 15, cursorY + 20);
    doc.setFontSize(12);
    doc.text("/ 100", margin + 35, cursorY + 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("COMPETENCY SCORE", margin + 15, cursorY + 30);

    // PDF: PRINT TIME AND INTEGRITY
    doc.setFontSize(14);
    doc.setTextColor(integrity.count > 0 ? 220 : 34, integrity.count > 0 ? 38 : 197, 60);
    doc.text(`FLAGS: ${integrity.count}`, pageWidth - margin - 40, cursorY + 15, { align: 'right' });
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text("SESSION INTEGRITY", pageWidth - margin - 40, cursorY + 25, { align: 'right' });
    
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text(`TIME ELAPSED: ${timeTaken}`, pageWidth - margin - 40, cursorY + 35, { align: 'right' });
    
    cursorY += 55;

    // 4. Silent Killers (Red Flags)
    if (processedData.silent_killers && processedData.silent_killers.length > 0) {
        checkPageBreak(20);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38);
        doc.text(`CRITICAL FLAGS`, margin + 5, cursorY);
        cursorY += 8;

        processedData.silent_killers.forEach(flag => {
            doc.setFillColor(254, 242, 242);
            doc.rect(margin + 5, cursorY, 2, 2, 'F'); // Bullet
            addWrappedText(`•  ${flag}`, 11, 'normal', [185, 28, 28]);
        });
        cursorY += 10;
    }

    // 5. Roadmap
    if (processedData.roadmap) {
        checkPageBreak(20);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235);
        doc.text("OPTIMIZATION ROADMAP", margin + 5, cursorY);
        cursorY += 8;
        addWrappedText(formatTextForPDF(processedData.roadmap), 11, 'normal', [30, 58, 138]);
        cursorY += 10;
    }

    // --- PAGE 2+: DETAILED Q&A ---
    doc.addPage();
    drawPageBorder();
    cursorY = margin + 15;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(`DETAILED ANALYSIS: ${targetDomain}`, margin + 5, cursorY);
    cursorY += 15;

    processedData.question_reviews.forEach((item, index) => {
        checkPageBreak(60);

        // Header for Question Block
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85);
        doc.text(`Query ${index + 1}`, margin + 5, cursorY);
        doc.setFontSize(10);

        // Smart normalize PDF score to avoid 900/100 or 9/100 outputs in PDF
        const normalizedScore = item.score > 10 ? (item.score > 100 ? item.score / 10 : item.score) : item.score * 10;

        doc.text(`Score: ${normalizedScore}/100`, pageWidth - margin - 25, cursorY);
        cursorY += 6;

        // Use the new Truncation-Proof wrapped text for the question
        addWrappedText(item.question || "Question Text Missing", 10, 'italic', [80, 80, 80]);
        cursorY += 4;

        // Content Setup
        const formattedIdealAnswer = formatTextForPDF(item.ideal_answer);
        const formattedFeedback = formatTextForPDF(item.feedback);
        const formattedUserAnswer = formatTextForPDF(item.user_answer) || "No Answer";

        // Stacked Full-Width Content Table
        autoTable(doc, {
            startY: cursorY,
            margin: { left: margin + 2, right: margin + 2 },
            tableWidth: contentWidth - 4,
            theme: 'grid',
            headStyles: { fillColor: [255, 255, 255], textColor: 0, fontSize: 0, cellPadding: 0, minCellHeight: 0 }, // Hide header
            bodyStyles: { fontSize: 9, cellPadding: 5, lineColor: [226, 232, 240], overflow: 'linebreak' },
            columnStyles: { 0: { cellWidth: contentWidth - 4 } },
            body: [
                [{ content: 'CANDIDATE RESPONSE', styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [100, 116, 139] } }],
                [formattedUserAnswer],
                [{ content: 'IDEAL TECHNICAL RESPONSE', styles: { fontStyle: 'bold', fillColor: [239, 246, 255], textColor: [59, 130, 246] } }],
                [formattedIdealAnswer],
                [{ content: 'PROFESSIONAL AUDIT', styles: { fontStyle: 'bold', fillColor: [250, 245, 255], textColor: [168, 85, 247] } }],
                [formattedFeedback]
            ],
            didDrawPage: () => drawPageBorder(),
        });

        cursorY = doc.lastAutoTable.finalY + 10;
    });

    const filename = `${targetDomain.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

    // ================= INSTANT ADMIN TRACKER =================
    try {
        const currentEmail = localStorage.getItem('userEmail') || 'Unknown Candidate';
        await logUserAction({
            email: currentEmail,
            action: "PDF_DOWNLOADED",
            details: `Candidate downloaded the final report for topic: ${targetDomain} (Score: ${processedData.score})`
        });
        console.log("✅ Admin notified of PDF download.");
    } catch (err) {
        console.error("❌ Failed to notify admin of download, but PDF still generated.");
    }
  };

  // ====================================================================
  // 🔥 AUTO-REFRESH DASHBOARD TRIGGER 🔥
  // ====================================================================
  const handleBackToDashboard = () => {
      // Drop the signal flag so Dashboard knows to hard-refresh ONCE
      sessionStorage.setItem('just_finished_interview', 'true');
      
      // Navigate back to dashboard
      navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center relative font-sans">
      
      {/* NAVIGATION BAR */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-8">
        <button 
            onClick={handleBackToDashboard} // <-- UPDATED CLICK HANDLER HERE
            className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-2 transition-colors"
        >
            <i className="fa-solid fa-arrow-left"></i> Dashboard
        </button>
        <button 
            onClick={handleDownload}
            className="bg-slate-900 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 hover:scale-105"
        >
            <i className="fa-solid fa-file-pdf"></i> Download Official Report
        </button>
      </div>

      {/* REPORT PREVIEW CARD */}
      <div className="w-full max-w-[210mm] bg-white shadow-2xl rounded-none md:rounded-lg p-8 md:p-12 border border-slate-200 relative">
            
            {/* 1. HEADER - DYNAMIC */}
            <div className="border-b border-gray-200 pb-8 mb-8 flex flex-col md:flex-row justify-between items-start gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2 break-words">
                        {targetDomain}
                    </h1>
                    <h2 className="text-xl font-bold text-blue-600 uppercase tracking-wide">
                        ASSESSMENT REPORT
                    </h2>
                    <div className="flex flex-col gap-1 mt-4">
                        <p className="text-gray-400 font-mono text-xs font-bold tracking-widest">
                            SESSION ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                        </p>
                        <p className="text-gray-400 font-mono text-xs font-bold tracking-widest">
                            DATE: {new Date().toLocaleDateString()}
                        </p>
                        <p className="text-blue-500 font-mono text-xs font-bold tracking-widest mt-1">
                            TIME ELAPSED: {timeTaken}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-6xl font-black tracking-tighter ${
                        processedData.score >= 80 ? 'text-green-600' : 
                        processedData.score >= 50 ? 'text-yellow-500' : 'text-red-600'
                    }`}>
                        {processedData.score}<span className="text-2xl text-gray-300">/100</span>
                    </div>
                    <p className="font-bold text-slate-400 text-xs uppercase tracking-widest mt-1">Competency Score</p>
                </div>
            </div>

            {/* 2. INTEGRITY STATUS */}
            <div className={`mb-10 p-4 rounded-lg border flex items-center gap-4 ${integrity.count > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-sm ${integrity.count > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    <i className={`fa-solid ${integrity.count > 0 ? 'fa-triangle-exclamation' : 'fa-shield-check'}`}></i>
                </div>
                <div>
                    <h3 className={`font-bold uppercase text-sm ${integrity.count > 0 ? 'text-red-700' : 'text-green-700'}`}>
                        Integrity Status: {integrity.count > 0 ? `${integrity.count} FLAGS TRIGGERED` : "Verified"}
                    </h3>
                    <p className="text-slate-600 text-sm mt-1">
                        {integrity.count > 0 
                        ? `Focus lost ${integrity.count} times. Integrity Score: ${integrity.score}%`
                        : "Candidate maintained verified focus throughout the session."}
                    </p>
                </div>
            </div>

            {/* 3. EXECUTIVE SUMMARY */}
            <div className="mb-12">
                <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest mb-4 border-b border-gray-100 pb-2">
                    Executive Summary
                </h3>
                <div className="text-lg text-slate-700 leading-relaxed font-medium">
                    {renderFormattedText(processedData.summary, false)}
                </div>
            </div>

            {/* 4. ANALYSIS GRID (RED FLAGS & ROADMAP) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                
                {/* Red Flags */}
                <div className="bg-red-50/50 p-6 rounded-xl border border-red-100">
                    <h3 className="font-bold text-red-600 uppercase text-xs tracking-widest mb-4 flex items-center gap-2 break-words">
                        <i className="fa-solid fa-flag"></i> Critical Flags
                    </h3>
                    <ul className="space-y-3">
                        {processedData.silent_killers && processedData.silent_killers.length > 0 ? (
                            processedData.silent_killers.map((killer, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <i className="fa-solid fa-xmark text-red-500 mt-1.5 text-sm"></i>
                                    <span className="text-slate-800 text-sm font-medium leading-snug">{killer}</span>
                                </li>
                            ))
                        ) : (
                            <li className="flex items-center gap-2 text-green-600 text-sm font-bold">
                                <i className="fa-solid fa-check-circle"></i> No critical flags detected.
                            </li>
                        )}
                    </ul>
                </div>

                {/* Roadmap */}
                <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                    <h3 className="font-bold text-blue-600 uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-map"></i> Optimization Roadmap
                    </h3>
                    <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {renderFormattedText(processedData.roadmap, false)}
                    </div>
                </div>
            </div>

            {/* 5. QUESTION BREAKDOWN */}
            <div>
                <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest mb-6 border-b border-gray-100 pb-2 break-words">
                    Forensic Analysis: {targetDomain} ({processedData.question_reviews.length} Qs)
                </h3>
                <div className="space-y-8">
                    {processedData.question_reviews.map((review, i) => {
                        // SMART SCORE NORMALIZER
                        // Checks if score is out of 10, out of 100, or a bloated 1000 format and pins it exactly to 100
                        const scoreOutOf100 = review.score > 10 ? (review.score > 100 ? review.score / 10 : review.score) : review.score * 10;
                        const scoreOutOf10 = scoreOutOf100 / 10; // Used safely for color coding below

                        return (
                            <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow break-inside-avoid">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                    <h4 className="font-bold text-slate-800 text-sm">Query {i + 1}</h4>
                                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                                        scoreOutOf10 >= 8 ? 'bg-green-100 text-green-700' : 
                                        scoreOutOf10 >= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        Rating: {scoreOutOf100}/100
                                    </span>
                                </div>
                                <div className="p-6">
                                    <p className="text-slate-900 font-bold text-md mb-6 whitespace-pre-wrap break-words">{review.question}</p>
                                    
                                    {/* STACKED FULL-WIDTH LAYOUT */}
                                    <div className="flex flex-col gap-6">
                                        {/* User Answer */}
                                        <div className="w-full">
                                            <div className="text-xs font-bold text-slate-400 uppercase mb-2">Candidate Response</div>
                                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-600 text-sm leading-relaxed font-mono break-words">
                                                {renderFormattedText(review.user_answer || "No response captured.", true)}
                                            </div>
                                        </div>
                                        
                                        {/* Ideal Answer */}
                                        <div className="w-full">
                                            <div className="text-xs font-bold text-blue-500 uppercase mb-2">Ideal Technical Response</div>
                                            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 text-slate-800 text-sm leading-relaxed font-mono break-words">
                                                {renderFormattedText(review.ideal_answer, true)}
                                            </div>
                                        </div>

                                        {/* Feedback */}
                                        <div className="w-full">
                                            <div className="text-xs font-bold text-purple-500 uppercase mb-2">Professional Audit</div>
                                            <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100 text-slate-700 text-sm italic font-medium break-words flex items-start gap-3">
                                                <i className="fa-solid fa-magnifying-glass-chart text-purple-500 mt-1"></i>
                                                <div className="w-full">
                                                    {renderFormattedText(review.feedback, false)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
      </div>

      {/* FLOATING CHAT ASSISTANT */}
      <div className="fixed bottom-6 right-6 z-50">
         <ChatAssistant context={{ 
             page: "Report Analysis", 
             score: processedData.score, 
             topic: targetDomain 
         }} />
      </div>

    </div>
  );
};

export default Report;