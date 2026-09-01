import React from 'react';

interface ModalProps {
  title: string;
  onClose?: () => void;
  children: React.ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="bg-slate-900 text-slate-100 rounded-lg shadow-xl w-[360px] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h2 className="text-sm font-semibold">{title}</h2>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-100 text-sm">
              ✕
            </button>
          )}
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
