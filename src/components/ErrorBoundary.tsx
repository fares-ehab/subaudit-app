import React, { useState } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RefreshCw, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

// --- Error Reporting Service ---
// In a real production app, you would integrate a service like Sentry or LogRocket here.
const reportErrorToService = (error: Error, errorInfo: React.ErrorInfo, errorId: string, userFeedback?: string) => {
  console.log("--- Reporting Error to Service ---");
  console.log("Error ID:", errorId);
  console.log("User Feedback:", userFeedback || "N/A");
  console.error("Uncaught error:", error, errorInfo);
  console.log("---------------------------------");
};

// --- The UI component to display when an error occurs ---
const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  const [errorId] = useState(Math.random().toString(36).substr(2, 9).toUpperCase());
  const [isReporting, setIsReporting] = useState(false);
  const [userFeedback, setUserFeedback] = useState("");

  // Report the error automatically when the component mounts
  React.useEffect(() => {
    reportErrorToService(error, { componentDidCatch: () => {} } as any, errorId);
  }, [error, errorId]);

  const handleReportIssue = () => {
    reportErrorToService(error, { componentDidCatch: () => {} } as any, errorId, userFeedback);
    toast.success("Thank you for your feedback!");
    setIsReporting(false);
    setUserFeedback("");
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">We've logged the issue. Please try again, and if the problem persists, report the issue.</p>
          <div className="mb-6 bg-gray-100 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Error ID: <span className="font-mono font-medium text-gray-800">{errorId}</span></p>
          </div>
          <div className="space-y-3">
            <button onClick={resetErrorBoundary} className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4" /><span>Try Again</span>
            </button>
            <button onClick={() => setIsReporting(true)} className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2">
              <span>Report Issue</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* --- User Feedback Modal --- */}
      <AnimatePresence>
        {isReporting && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900">Report an Issue</h3>
                        <p className="text-sm text-gray-600 mt-1">Help us fix this faster! Please describe what you were doing when the error occurred.</p>
                        <textarea 
                            value={userFeedback}
                            onChange={(e) => setUserFeedback(e.target.value)}
                            rows={4}
                            className="w-full mt-4 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="For example: I was trying to add a new subscription..."
                        />
                         <div className="mt-2 bg-gray-50 p-2 rounded-lg text-xs text-gray-500">
                            <strong>Error ID:</strong> {errorId} (This will be sent with your report)
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 rounded-b-xl">
                        <button onClick={() => setIsReporting(false)} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button onClick={handleReportIssue} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
                            <Send size={16}/><span>Submit Report</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </>
  );
};

// --- The main Error Boundary component for your app ---
const AppErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ErrorBoundary>
  );
};

export default AppErrorBoundary;
