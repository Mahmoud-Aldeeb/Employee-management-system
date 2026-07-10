import { X } from "lucide-react";

const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-3xl",
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div className="fixed inset-0" />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} my-8 animate-fade-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
