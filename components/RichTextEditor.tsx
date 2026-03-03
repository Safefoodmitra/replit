
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, 
  // Added alias for TableIcon
  AlignRight, ImageIcon, Type, Table as TableIcon, Palette, Highlighter,
  Layout, Book, Maximize2, Minimize2, Type as FontIcon,
  Strikethrough, Quote, Code, Link2,
  RefreshCw, X
} from 'lucide-react';

interface RichTextEditorProps {
  label?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  isPageMode?: boolean; 
}

const COLORS = [
  '#000000', '#475569', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#ffffff'
];

const RichTextEditor: React.FC<RichTextEditorProps> = ({ label, value, onChange, placeholder, isPageMode = false }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<'text' | 'bg' | null>(null);

  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== value) {
      if (!isFocused) {
          contentRef.current.innerHTML = value;
      }
    }
  }, [value, isFocused]);

  const triggerChange = () => {
    if (contentRef.current) {
      onChange(contentRef.current.innerHTML);
    }
  };

  const execCmd = (command: string, val: string | undefined = undefined) => {
    document.execCommand(command, false, val);
    setShowColorPicker(null);
    triggerChange();
  };

  const insertTable = () => {
    const tableHtml = `<table style="width: 100%; border-collapse: collapse; margin: 15px 0; border: 1px solid #cbd5e1; table-layout: fixed;"><tr><td style="border: 1px solid #cbd5e1; padding: 10px;">&nbsp;</td><td style="border: 1px solid #cbd5e1; padding: 10px;">&nbsp;</td></tr><tr><td style="border: 1px solid #cbd5e1; padding: 10px;">&nbsp;</td><td style="border: 1px solid #cbd5e1; padding: 10px;">&nbsp;</td></tr></table><p><br></p>`;
    if (contentRef.current) {
      contentRef.current.focus();
      document.execCommand('insertHTML', false, tableHtml);
    }
    triggerChange();
  };

  return (
    <div className={`flex flex-col h-full ${isPageMode ? 'bg-transparent' : 'bg-white'} relative transition-colors duration-500`}>
      {label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 px-4 pt-4">{label}</label>}
      
      <div className={`flex flex-col flex-1 overflow-hidden ${isPageMode ? '' : 'border-2 border-slate-100 rounded-2xl mx-4 mb-4'} ${isFocused && !isPageMode ? 'border-indigo-500 ring-4 ring-indigo-50' : ''}`}>
        
        {/* Simple inline toolbar for small components, hidden in page mode as the workspace has a ribbon */}
        {!isPageMode && (
            <div className="flex flex-wrap items-center gap-1 p-1.5 bg-white border-b border-slate-200 select-none sticky top-0 z-20 shadow-sm overflow-x-auto hide-scrollbar">
            <button type="button" onClick={() => execCmd('bold')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors" title="Bold"><Bold size={16} /></button>
            <button type="button" onClick={() => execCmd('italic')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors" title="Italic"><Italic size={16} /></button>
            <button type="button" onClick={() => execCmd('underline')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors" title="Underline"><Underline size={16} /></button>
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <button type="button" onClick={() => execCmd('insertUnorderedList')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors" title="Bullet List"><List size={16} /></button>
            <button type="button" onClick={insertTable} className="p-2 rounded-lg hover:bg-slate-100 text-indigo-600 transition-colors" title="Insert Table"><TableIcon size={16} /></button>
            </div>
        )}

        {/* Editor Body */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar ${isPageMode ? 'py-1 flex justify-center' : ''}`}>
          <div 
            ref={contentRef}
            contentEditable
            onInput={triggerChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`
                outline-none text-base text-slate-700 leading-relaxed prose prose-slate max-w-none empty:before:content-[attr(placeholder)] empty:before:text-slate-300
                ${isPageMode 
                    ? 'page-a4 shadow-2xl transition-all duration-300 ring-1 ring-slate-200 mb-20' 
                    : 'p-8 min-h-[300px]'
                }
            `}
            style={{ listStylePosition: 'inside' }}
            placeholder={placeholder || "Start typing technical documentation..."}
          />
        </div>
      </div>
      
      <style jsx global>{`
        .prose table { border-collapse: collapse !important; width: 100% !important; border: 1px solid #cbd5e1 !important; margin: 1rem 0 !important; table-layout: fixed !important; }
        .prose td, .prose th { border: 1px solid #cbd5e1 !important; padding: 10px !important; min-width: 50px !important; word-break: break-word !important; }
        .page-a4 img { max-width: 100%; height: auto; border-radius: 4px; border: 1px solid #eee; }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
