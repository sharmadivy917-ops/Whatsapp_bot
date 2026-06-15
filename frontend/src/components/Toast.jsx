import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, X, Info } from 'lucide-react';

let toastIdCounter = 0;
let addToastFn = null;

// Exported function for triggering toasts from anywhere
export function toast(message, type = 'success') {
  if (addToastFn) {
    addToastFn({ id: ++toastIdCounter, message, type });
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastFn = (newToast) => {
      setToasts((prev) => [...prev, newToast]);
      // Auto-remove after 3.5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 3500);
    };
    return () => { addToastFn = null; };
  }, []);

  function removeToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const icons = {
    success: <CheckCircle size={18} className="text-primary-500" />,
    error: <XCircle size={18} className="text-red-500" />,
    warning: <AlertCircle size={18} className="text-amber-500" />,
    info: <Info size={18} className="text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-primary-50 border-primary-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-slide-in-left ${bgColors[t.type] || bgColors.success}`}
        >
          {icons[t.type] || icons.success}
          <p className="text-sm text-gray-700 font-medium flex-1">{t.message}</p>
          <button
            onClick={() => removeToast(t.id)}
            className="p-0.5 rounded hover:bg-black/5 text-gray-400"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
