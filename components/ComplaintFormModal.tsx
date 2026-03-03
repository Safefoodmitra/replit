"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
    X, 
    Camera, 
    Plus, 
    Loader2,
    SendHorizonal,
    MapPin,
    BookOpen,
    Briefcase,
    Wrench,
    Users,
    Tag,
    Info,
    ImageIcon,
    Upload,
    ChevronRight,
    LayoutTemplate,
    Edit2,
    Trash2,
    Columns,
    Rows,
    Layout,
    Grid,
    Maximize,
    StretchHorizontal,
    StretchVertical,
    ShieldCheck,
    ArrowLeft,
    ArrowRight,
    PlusCircle,
    ArrowUpDown,
    LayoutGrid,
    Move,
    Download,
    Highlighter,
    Type,
    Smile,
    RotateCw,
    GripVertical,
    GripHorizontal,
    Crop,
    Square,
    Circle,
    ArrowUp,
    Check,
    ChevronDown,
    Undo2,
    Redo2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import Cropper from 'cropperjs';

/**
 * Compresses an image to target size in KB (default 100KB).
 */
const compressImage = async (dataUrl: string, targetSizeKb: number = 100): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            const MAX_DIMENSION = 1200; 
            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                if (width > height) {
                    height *= MAX_DIMENSION / width;
                    width = MAX_DIMENSION;
                } else {
                    width *= MAX_DIMENSION / height;
                    height = MAX_DIMENSION;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
            }
            
            let quality = 0.9;
            let compressed = canvas.toDataURL('image/jpeg', quality);
            const targetLength = targetSizeKb * 1024 * 1.33; 
            
            while (compressed.length > targetLength && quality > 0.1) {
                quality -= 0.1;
                compressed = canvas.toDataURL('image/jpeg', quality);
            }
            
            resolve(compressed);
        };
        img.onerror = () => resolve(dataUrl);
    });
};

// --- Advanced Photo Editor Component ---

type EditorElement = {
    id: string;
    type: 'text' | 'rect' | 'circle' | 'arrow' | 'sticker';
    x: number;
    y: number;
    width?: number;
    height?: number;
    content?: string;
    color: string;
    fontSize?: number;
};

interface HistoryState {
    elements: EditorElement[];
    canvasData: string;
}

const EMOJIS = ['⚠️', '🔴', '📍', '✅', '❌', '🔥', '💧', '🪰', '❄️'];

const PhotoEditor: React.FC<{ 
    imageUrl: string, 
    onSave: (editedUrl: string) => void, 
    onCancel: () => void 
}> = ({ imageUrl, onSave, onCancel }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cropperRef = useRef<Cropper | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [activeColor, setActiveColor] = useState('#ff0000');
    const [isRendering, setIsRendering] = useState(false);
    const [elements, setElements] = useState<EditorElement[]>([]);
    const [tool, setTool] = useState<'pen' | 'text' | 'rect' | 'circle' | 'arrow' | 'sticker'>('pen');
    const [isCropping, setIsCropping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [activeElementId, setActiveElementId] = useState<string | null>(null);
    const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);

    // History state
    const [history, setHistory] = useState<HistoryState[]>([]);
    const [historyStep, setHistoryStep] = useState(-1);

    const pushToHistory = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const newState: HistoryState = {
            elements: JSON.parse(JSON.stringify(elements)),
            canvasData: canvas.toDataURL()
        };

        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(newState);
        
        // Limit history to 20 steps for memory
        if (newHistory.length > 20) newHistory.shift();
        
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    }, [elements, history, historyStep]);

    // Initialize Canvas with Image
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        img.onload = () => {
            const maxWidth = window.innerWidth * 0.9;
            const maxHeight = window.innerHeight * 0.6;
            let scale = Math.min(maxWidth / img.width, maxHeight / img.height);
            
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Initial history entry
            pushToHistory();
        };
    }, [imageUrl]);

    const handleUndo = () => {
        if (historyStep <= 0) return;
        
        const prevStep = historyStep - 1;
        const state = history[prevStep];
        
        setElements(JSON.parse(JSON.stringify(state.elements)));
        setHistoryStep(prevStep);
        
        // Restore canvas
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const img = new Image();
                img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                };
                img.src = state.canvasData;
            }
        }
    };

    const handleRedo = () => {
        if (historyStep >= history.length - 1) return;
        
        const nextStep = historyStep + 1;
        const state = history[nextStep];
        
        setElements(JSON.parse(JSON.stringify(state.elements)));
        setHistoryStep(nextStep);

        // Restore canvas
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const img = new Image();
                img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                };
                img.src = state.canvasData;
            }
        }
    };

    // Cropper Logic
    const startCropping = () => {
        if (!imgRef.current) return;
        setIsCropping(true);
        cropperRef.current = new Cropper(imgRef.current, {
            viewMode: 1,
            autoCropArea: 1,
            responsive: true,
            restore: false,
        });
    };

    const applyCrop = () => {
        if (!cropperRef.current) return;
        const croppedCanvas = cropperRef.current.getCroppedCanvas();
        
        // To integrate crop with history, we essentially start over with a new base image
        onSave(croppedCanvas.toDataURL('image/jpeg', 0.9)); 
        cropperRef.current.destroy();
        setIsCropping(false);
    };

    const cancelCrop = () => {
        if (cropperRef.current) {
            cropperRef.current.destroy();
            setIsCropping(false);
        }
    };

    // Drawing Logic (Pen)
    const handleCanvasAction = (e: React.MouseEvent | React.TouchEvent, type: 'start' | 'move' | 'end') => {
        if (isCropping || tool !== 'pen') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

        if (type === 'start') {
            setIsDrawing(true);
            ctx.beginPath();
            ctx.moveTo(x, y);
        } else if (type === 'move' && isDrawing) {
            ctx.lineTo(x, y);
            ctx.strokeStyle = activeColor;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        } else if (type === 'end' && isDrawing) {
            setIsDrawing(false);
            pushToHistory();
        }
    };

    // Active Element Interaction
    const addElement = (e: React.MouseEvent) => {
        if (isCropping || tool === 'pen') return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newEl: EditorElement = {
            id: `el-${Date.now()}`,
            type: tool,
            x: x - (tool === 'text' ? 50 : 25),
            y: y - (tool === 'text' ? 15 : 25),
            color: activeColor,
            content: tool === 'text' ? 'TAP TO EDIT' : undefined,
            width: tool === 'text' ? undefined : 60,
            height: tool === 'text' ? undefined : 60,
            fontSize: tool === 'text' ? 24 : undefined
        };

        const nextElements = [...elements, newEl];
        setElements(nextElements);
        setTool('pen'); 
        
        // Push history after setting state
        // elements state won't be updated until next render, so we pass explicit value if possible
        // but pushToHistory uses elements from closure, so we need a slight delay or manual pass
        setTimeout(() => pushToHistory(), 10);
    };

    const handleElementDragStart = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setActiveElementId(id);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleElementDrag = (e: React.MouseEvent) => {
        if (!activeElementId || !dragStart) return;
        
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;

        setElements(prev => prev.map(el => 
            el.id === activeElementId 
                ? { ...el, x: el.x + dx, y: el.y + dy }
                : el
        ));
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleElementDragEnd = () => {
        if (activeElementId) {
            pushToHistory();
        }
        setDragStart(null);
        setActiveElementId(null);
    };

    const updateElementContent = (id: string, content: string) => {
        setElements(prev => prev.map(el => el.id === id ? { ...el, content } : el));
        pushToHistory();
    };

    const handleRotate = () => setRotation(prev => (prev + 90) % 360);

    const handleCommit = async () => {
        if (!containerRef.current) return;
        setIsRendering(true);
        
        try {
            const canvas = await html2canvas(containerRef.current, {
                useCORS: true,
                scale: 2,
                backgroundColor: null,
                logging: false,
            });
            onSave(canvas.toDataURL('image/jpeg', 0.9));
        } catch (err) {
            console.error("Editor commit failed", err);
        } finally {
            setIsRendering(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in select-none overflow-hidden">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-6 py-6 text-white shrink-0">
                <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-all">
                    <X size={28} strokeWidth={2.5} />
                </button>
                
                <div className="flex items-center gap-4 md:gap-8 overflow-x-auto hide-scrollbar px-4">
                    {!isCropping ? (
                        <>
                            <div className="flex gap-1 border-r border-white/10 pr-4">
                                <button 
                                    onClick={handleUndo} 
                                    disabled={historyStep <= 0}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-all disabled:opacity-20"
                                    title="Undo"
                                >
                                    <Undo2 size={22} />
                                </button>
                                <button 
                                    onClick={handleRedo} 
                                    disabled={historyStep >= history.length - 1}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-all disabled:opacity-20"
                                    title="Redo"
                                >
                                    <Redo2 size={22} />
                                </button>
                            </div>
                            <button onClick={startCropping} className="p-2 hover:bg-white/10 rounded-xl transition-all flex flex-col items-center gap-1 opacity-80 hover:opacity-100">
                                <Crop size={22} />
                                <span className="text-[8px] font-black uppercase">Crop</span>
                            </button>
                            <button onClick={handleRotate} className="p-2 hover:bg-white/10 rounded-xl transition-all flex flex-col items-center gap-1 opacity-80 hover:opacity-100">
                                <RotateCw size={22} />
                                <span className="text-[8px] font-black uppercase">Rotate</span>
                            </button>
                            <div className="h-8 w-px bg-white/10 mx-2" />
                            <button onClick={() => setTool('pen')} className={`p-2 rounded-xl transition-all flex flex-col items-center gap-1 ${tool === 'pen' ? 'bg-indigo-600' : 'hover:bg-white/10 opacity-80'}`}>
                                <Highlighter size={22} />
                                <span className="text-[8px] font-black uppercase">Pen</span>
                            </button>
                            <button onClick={() => setTool('text')} className={`p-2 rounded-xl transition-all flex flex-col items-center gap-1 ${tool === 'text' ? 'bg-indigo-600' : 'hover:bg-white/10 opacity-80'}`}>
                                <Type size={22} />
                                <span className="text-[8px] font-black uppercase">Text</span>
                            </button>
                            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-2 rounded-xl transition-all flex flex-col items-center gap-1 ${showEmojiPicker ? 'bg-indigo-600' : 'hover:bg-white/10 opacity-80'}`}>
                                <Smile size={22} />
                                <span className="text-[8px] font-black uppercase">Sticker</span>
                            </button>
                            <div className="h-8 w-px bg-white/10 mx-2" />
                            <button onClick={() => setTool('rect')} className={`p-2 rounded-xl transition-all flex flex-col items-center gap-1 ${tool === 'rect' ? 'bg-indigo-600' : 'hover:bg-white/10 opacity-80'}`}>
                                <Square size={20} />
                                <span className="text-[8px] font-black uppercase">Box</span>
                            </button>
                            <button onClick={() => setTool('circle')} className={`p-2 rounded-xl transition-all flex flex-col items-center gap-1 ${tool === 'circle' ? 'bg-indigo-600' : 'hover:bg-white/10 opacity-80'}`}>
                                <Circle size={20} />
                                <span className="text-[8px] font-black uppercase">Circle</span>
                            </button>
                            <button onClick={() => setTool('arrow')} className={`p-2 rounded-xl transition-all flex flex-col items-center gap-1 ${tool === 'arrow' ? 'bg-indigo-600' : 'hover:bg-white/10 opacity-80'}`}>
                                <ArrowUp size={20} className="rotate-45" />
                                <span className="text-[8px] font-black uppercase">Arrow</span>
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-4 animate-in slide-in-from-top-2">
                            <span className="text-xs font-black uppercase tracking-widest text-indigo-400 mr-4">Crop Workspace</span>
                            <button onClick={cancelCrop} className="px-6 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase">Cancel</button>
                            <button onClick={applyCrop} className="px-6 py-2 bg-indigo-600 rounded-full text-[10px] font-black uppercase shadow-lg">Apply Crop</button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {!isCropping && (
                        <div className="flex gap-1.5 p-1 bg-white/5 rounded-full border border-white/10">
                            {['#ff0000', '#ffff00', '#00ff00', '#ffffff', '#000000'].map(c => (
                                <button key={c} onClick={() => setActiveColor(c)} className={`w-6 h-6 rounded-full border-2 transition-all ${activeColor === c ? 'border-white scale-125 shadow-lg' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Emoji Picker Overlay */}
            {showEmojiPicker && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-white/10 p-4 rounded-[2rem] shadow-2xl flex gap-4 animate-in zoom-in-95">
                    {EMOJIS.map(e => (
                        <button 
                            key={e} 
                            onClick={() => {
                                setElements([...elements, { id: `st-${Date.now()}`, type: 'sticker', x: 100, y: 100, content: e, color: '' }]);
                                setShowEmojiPicker(false);
                                pushToHistory();
                            }}
                            className="text-3xl hover:scale-125 transition-transform"
                        >
                            {e}
                        </button>
                    ))}
                </div>
            )}

            {/* Main Editor Canvas Area */}
            <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden">
                <div 
                    ref={containerRef}
                    className="relative shadow-2xl transition-transform duration-300 origin-center"
                    style={{ 
                        transform: `rotate(${rotation}deg)`,
                        cursor: tool === 'pen' ? 'crosshair' : 'default'
                    }}
                    onMouseMove={handleElementDrag}
                    onMouseUp={handleElementDragEnd}
                    onMouseLeave={handleElementDragEnd}
                >
                    {/* Hidden Image for CropperJS attachment */}
                    <img 
                        ref={imgRef}
                        src={imageUrl} 
                        className={`max-w-full max-h-[60vh] rounded-xl pointer-events-none ${isCropping ? 'opacity-0' : 'opacity-100'}`}
                        alt="Editor Base" 
                    />

                    {/* Canvas Layer for Pen Drawing */}
                    {!isCropping && (
                        <canvas 
                            ref={canvasRef}
                            className="absolute inset-0 z-10 touch-none rounded-xl"
                            onMouseDown={(e) => handleCanvasAction(e, 'start')}
                            onMouseMove={(e) => handleCanvasAction(e, 'move')}
                            onMouseUp={(e) => handleCanvasAction(e, 'end')}
                            onTouchStart={(e) => handleCanvasAction(e, 'start')}
                            onTouchMove={(e) => handleCanvasAction(e, 'move')}
                            onTouchEnd={(e) => handleCanvasAction(e, 'end')}
                            onClick={(e) => tool !== 'pen' && addElement(e)}
                        />
                    )}

                    {/* Interaction Elements Layer (Text/Shapes) */}
                    {!isCropping && (
                        <div className="absolute inset-0 z-20 pointer-events-none">
                            {elements.map((el) => {
                                const isFocused = activeElementId === el.id;
                                
                                return (
                                    <div
                                        key={el.id}
                                        style={{ 
                                            left: el.x, 
                                            top: el.y, 
                                            position: 'absolute',
                                            pointerEvents: 'auto',
                                            cursor: isFocused ? 'grabbing' : 'grab'
                                        }}
                                        onMouseDown={(e) => handleElementDragStart(e, el.id)}
                                        className={`group/el ${isFocused ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-black rounded-lg' : ''}`}
                                    >
                                        {el.type === 'text' && (
                                            <div 
                                                contentEditable 
                                                suppressContentEditableWarning
                                                onBlur={(e) => updateElementContent(el.id, e.currentTarget.textContent || '')}
                                                style={{ color: el.color, fontSize: el.fontSize, fontWeight: '900' }}
                                                className="outline-none whitespace-nowrap bg-black/20 px-3 py-1 rounded backdrop-blur-sm shadow-xl uppercase tracking-tight"
                                            >
                                                {el.content}
                                            </div>
                                        )}
                                        {el.type === 'sticker' && (
                                            <div className="text-6xl drop-shadow-2xl">{el.content}</div>
                                        )}
                                        {el.type === 'rect' && (
                                            <div 
                                                style={{ 
                                                    width: el.width, 
                                                    height: el.height, 
                                                    borderColor: el.color,
                                                    borderWidth: 4,
                                                    borderStyle: 'solid'
                                                }}
                                                className="rounded-lg shadow-xl"
                                            />
                                        )}
                                        {el.type === 'circle' && (
                                            <div 
                                                style={{ 
                                                    width: el.width, 
                                                    height: el.height, 
                                                    borderColor: el.color,
                                                    borderWidth: 4,
                                                    borderStyle: 'solid'
                                                }}
                                                className="rounded-full shadow-xl"
                                            />
                                        )}
                                        {el.type === 'arrow' && (
                                            <div style={{ color: el.color }} className="relative">
                                                <ArrowUp size={48} strokeWidth={4} className="rotate-45" />
                                            </div>
                                        )}
                                        
                                        {/* Element Delete Action */}
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setElements(elements.filter(x => x.id !== el.id)); 
                                                pushToHistory();
                                            }}
                                            className="absolute -top-6 -right-6 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover/el:opacity-100 transition-all hover:scale-110 shadow-lg pointer-events-auto"
                                        >
                                            <X size={12} strokeWidth={4} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-8 md:p-12 flex justify-center shrink-0">
                <button 
                    onClick={handleCommit}
                    disabled={isRendering || isCropping}
                    className="w-16 h-16 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
                >
                    {isRendering ? <Loader2 size={28} className="animate-spin" /> : <Check size={32} strokeWidth={3} />}
                </button>
            </div>

            {/* Tool Instruction Help */}
            <div className="absolute bottom-10 left-10 hidden lg:block pointer-events-none">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-3xl space-y-1">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-2">Editor Protocol</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed">
                        • Drag elements to reposition<br/>
                        • Double-tap text to edit content<br/>
                        • Undo/Redo (Ctrl+Z / Ctrl+Y supported)
                    </p>
                </div>
            </div>
        </div>
    );
};

interface ComplaintFormModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
  onViewImage?: (url: string, label: string) => void;
  availableSops?: string[];
  availableDepartments?: string[];
  availableLocations?: string[];
  usageFrequencies?: Record<string, Record<string, number>>;
  initialPersistence?: {
      selections: Record<string, string[]>;
      locks: Record<string, boolean>;
  };
  userId?: string | null;
  initialData?: any; 
}

type MentionType = 'location' | 'sop' | 'asset' | 'staff' | 'category' | 'responsibility';

const MOCK_ASSETS = ["Walk-in Chiller 01", "Deep Freezer Alpha-9", "Oven-01", "Blast Chiller XT-500", "Dishwasher H-200"];
const MOCK_STAFF = ["Chef Alex Johnson", "Sous Chef Maria Garcia", "Operator Sam Wilson", "Manager John Miller", "QA Sarah Thompson"];
const FALLBACK_SOPS = ["Hygiene Maintenance", "Temperature Audit standard", "Pest Control Plan", "Allergen Matrix"];
const FALLBACK_LOCATIONS = ["La Mesa Kitchen", "La Mesa Restaurant", "IRD", "Receiving", "Main Store"];
const FALLBACK_DEPARTMENTS = ["Food Production", "Engineering", "F&B Service", "Kitchen Stewarding"];

// --- Collage Studio Types ---
type CollageLayout = 
    | '2-v' | '2-h' | '2-inset' | '2-persp' | '2-cine'
    | '3-anchor' | '3-header' | '3-pillar' | '3-focus' | '3-stair'
    | '4-grid' | '4-hero' | '4-ribbon' | '4-mosaic' | '4-window';

const CropModal: React.FC<{ 
    imageUrl: string, 
    onSave: (croppedUrl: string) => void, 
    onCancel: () => void 
}> = ({ imageUrl, onSave, onCancel }) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const cropperRef = useRef<Cropper | null>(null);

    useEffect(() => {
        if (imgRef.current) {
            cropperRef.current = new Cropper(imgRef.current, {
                viewMode: 1,
                dragMode: 'move',
                autoCropArea: 1,
                restore: false,
                guides: true,
                center: true,
                highlight: false,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false,
            });
        }
        return () => {
            if (cropperRef.current) {
                cropperRef.current.destroy();
            }
        };
    }, []);

    const handleSave = () => {
        if (cropperRef.current) {
            onSave(cropperRef.current.getCroppedCanvas().toDataURL('image/jpeg', 0.9));
        }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/90 flex flex-col items-center justify-center p-4">
            <div className="relative max-w-full max-h-[70vh]">
                <img ref={imgRef} src={imageUrl} alt="To crop" className="max-w-full max-h-[70vh] block" />
            </div>
            <div className="mt-8 flex gap-4">
                <button onClick={onCancel} className="px-8 py-3 bg-white/10 text-white rounded-xl text-sm font-bold">Cancel</button>
                <button onClick={handleSave} className="px-10 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg">Save Crop</button>
            </div>
        </div>
    );
};

const CollageStudio: React.FC<{ 
    initialImages: string[], 
    onSave: (dataUrl: string, finalImages: string[]) => void, 
    onClose: () => void 
}> = ({ initialImages, onSave, onClose }) => {
    const [images, setImages] = useState<string[]>(initialImages);
    const [rotations, setRotations] = useState<number[]>(new Array(initialImages.length).fill(0));
    const [croppingIndex, setCroppingIndex] = useState<number | null>(null);

    const count = images.length;
    const [layout, setLayout] = useState<CollageLayout>(
        count === 2 ? '2-v' : count === 3 ? '3-anchor' : '4-grid'
    );
    const [rounding, setRounding] = useState<'none' | 'soft' | 'full'>('none');
    const [border, setBorder] = useState<'none' | 'thin' | 'thick'>('thin');
    const [isRendering, setIsRendering] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    
    // Split Ratios for Resizing (Value from 10 to 90)
    const [mainSplitRatio, setMainSplitRatio] = useState(50);
    const [subSplitRatio, setSubSplitRatio] = useState(50);
    const [isResizing, setIsResizing] = useState<'main' | 'sub' | null>(null);

    const collageRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Re-calculate default layout if count changes significantly
    useEffect(() => {
        if (count === 2 && !layout.startsWith('2-')) setLayout('2-v');
        else if (count === 3 && !layout.startsWith('3-')) setLayout('3-anchor');
        else if (count >= 4 && !layout.startsWith('4-')) setLayout('4-grid');
    }, [count, layout]);

    const handleGenerate = async () => {
        if (!collageRef.current) return;
        setIsRendering(true);
        try {
            const canvas = await html2canvas(collageRef.current, {
                useCORS: true,
                scale: 2,
                backgroundColor: '#ffffff'
            });
            onSave(canvas.toDataURL('image/jpeg', 0.9), images);
        } catch (err) {
            console.error("Collage generation failed", err);
        } finally {
            setIsRendering(false);
        }
    };

    const handleAddMore = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const compressed = await compressImage(ev.target?.result as string, 100);
                setImages(prev => [...prev, compressed]);
                setRotations(prev => [...prev, 0]);
            };
            reader.readAsDataURL(file as Blob);
        });
        e.target.value = '';
    };

    const handleRemoveImage = (idx: number) => {
        if (images.length <= 2) {
            alert("A collage requires at least 2 images.");
            return;
        }
        setImages(prev => prev.filter((_, i) => i !== idx));
        setRotations(prev => prev.filter((_, i) => i !== idx));
    };

    const handleMove = (idx: number, direction: 'left' | 'right') => {
        const nextIdx = direction === 'left' ? idx - 1 : idx + 1;
        if (nextIdx < 0 || nextIdx >= images.length) return;
        
        const newImages = [...images];
        const newRots = [...rotations];
        
        [newImages[idx], newImages[nextIdx]] = [newImages[nextIdx], newImages[idx]];
        [newRots[idx], newRots[nextIdx]] = [newRots[nextIdx], newRots[idx]];
        
        setImages(newImages);
        setRotations(newRots);
    };

    const handleDragStart = (idx: number) => {
        if (isResizing) return;
        setDraggedIndex(idx);
    };

    const handleDragOver = (e: React.DragEvent, idx: number) => {
        if (isResizing) return;
        e.preventDefault();
        setDragOverIndex(idx);
    };

    const handleDrop = (targetIdx: number) => {
        if (draggedIndex === null || draggedIndex === targetIdx) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }
        const newImages = [...images];
        const newRots = [...rotations];

        [newImages[draggedIndex], newImages[targetIdx]] = [newImages[targetIdx], newImages[draggedIndex]];
        [newRots[draggedIndex], newRots[targetIdx]] = [newRots[targetIdx], newRots[draggedIndex]];

        setImages(newImages);
        setRotations(newRots);
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleRotateTile = (idx: number) => {
        const next = [...rotations];
        next[idx] = (next[idx] + 90) % 360;
        setRotations(next);
    };

    const handleCropSave = (idx: number, croppedUrl: string) => {
        setImages(prev => prev.map((img, i) => i === idx ? croppedUrl : img));
        setCroppingIndex(null);
    };

    // --- Resizing Logic ---
    const handleResizeStart = (type: 'main' | 'sub') => (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        setIsResizing(type);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent | TouchEvent) => {
            if (!isResizing || !collageRef.current) return;
            
            const rect = collageRef.current.getBoundingClientRect();
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

            if (isResizing === 'main') {
                const isHorizontal = layout === '2-h' || layout === '3-header';
                if (isHorizontal) {
                    const ratio = ((clientY - rect.top) / rect.height) * 100;
                    setMainSplitRatio(Math.min(90, Math.max(10, ratio)));
                } else {
                    const ratio = ((clientX - rect.left) / rect.width) * 100;
                    setMainSplitRatio(Math.min(90, Math.max(10, ratio)));
                }
            } else if (isResizing === 'sub') {
                const ratio = ((clientY - rect.top) / rect.height) * 100;
                setSubSplitRatio(Math.min(90, Math.max(10, ratio)));
            }
        };

        const handleMouseUp = () => setIsResizing(null);

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleMouseMove);
            window.addEventListener('touchend', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleMouseMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [isResizing, layout]);

    const getRoundingClass = () => {
        if (rounding === 'soft') return 'rounded-xl';
        if (rounding === 'full') return 'rounded-[2rem]';
        return 'rounded-none';
    };

    const getBorderClass = () => {
        if (border === 'thin') return 'p-1';
        if (border === 'thick') return 'p-3';
        return 'p-0';
    };

    const renderDraggableImage = (idx: number, containerClass: string) => {
        const rnd = getRoundingClass();
        const url = images[idx] || images[0];
        const rot = rotations[idx] || 0;
        const isDragging = draggedIndex === idx;
        const isDragOver = dragOverIndex === idx && !isDragging;

        return (
            <div 
                className={`relative group/tile overflow-hidden ${containerClass} ${rnd} ${isDragging ? 'opacity-30' : 'opacity-100'} ${isDragOver ? 'ring-4 ring-indigo-500 ring-inset scale-[0.98]' : ''} transition-all cursor-move`}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={() => { setDraggedIndex(null); setDragOverIndex(null); }}
                draggable={!isResizing}
            >
                <img 
                    src={url} 
                    style={{ transform: `rotate(${rot}deg)` }}
                    className="w-full h-full object-cover pointer-events-none transition-transform duration-300" 
                    alt={`Collage element ${idx}`}
                />
                
                {/* Tile Action Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 opacity-0 group-hover/tile:opacity-100 transition-opacity">
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleRotateTile(idx); }}
                        className="p-2 bg-white rounded-lg text-indigo-600 hover:scale-110 transition-transform shadow-lg"
                        title="Rotate 90°"
                    >
                        <RotateCw size={18} strokeWidth={2.5} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setCroppingIndex(idx); }}
                        className="p-2 bg-white rounded-lg text-indigo-600 hover:scale-110 transition-transform shadow-lg"
                        title="Crop Image"
                    >
                        <Crop size={18} strokeWidth={2.5} />
                    </button>
                    <div className="p-2 bg-slate-900 rounded-lg text-white opacity-50 cursor-grab active:cursor-grabbing">
                        <Move size={18} />
                    </div>
                </div>
            </div>
        );
    };

    const renderLayout = () => {
        const brd = getBorderClass();
        const main = mainSplitRatio;
        const sub = subSplitRatio;

        // --- 2 IMAGES ---
        if (count === 2 || layout.startsWith('2-')) {
            if (layout === '2-h') return (
                <div className={`grid w-full h-full bg-white relative ${brd}`} style={{ gridTemplateRows: `${main}% ${100-main}%`, gap: '8px' }}>
                    {renderDraggableImage(0, "h-full")}
                    <div 
                        onMouseDown={handleResizeStart('main')}
                        className="absolute left-0 right-0 h-4 -translate-y-1/2 cursor-ns-resize z-20 flex items-center justify-center group/resize"
                        style={{ top: `${main}%` }}
                    >
                        <div className="w-12 h-1.5 bg-slate-300 rounded-full group-hover/resize:bg-indigo-500 transition-colors flex items-center justify-center">
                            <GripHorizontal size={10} className="text-white" />
                        </div>
                    </div>
                    {renderDraggableImage(1, "h-full")}
                </div>
            );
            
            if (layout === '2-v' || layout === '2-persp') {
                return (
                    <div className={`grid w-full h-full bg-white relative ${brd}`} style={{ gridTemplateColumns: `${main}% ${100-main}%`, gap: '8px' }}>
                        {renderDraggableImage(0, "h-full")}
                        <div 
                            onMouseDown={handleResizeStart('main')}
                            className="absolute top-0 bottom-0 w-4 -translate-x-1/2 cursor-ew-resize z-20 flex items-center justify-center group/resize"
                            style={{ left: `${main}%` }}
                        >
                            <div className="h-12 w-1.5 bg-slate-300 rounded-full group-hover/resize:bg-indigo-500 transition-colors flex items-center justify-center">
                                <GripVertical size={10} className="text-white" />
                            </div>
                        </div>
                        {renderDraggableImage(1, "h-full")}
                    </div>
                );
            }

            if (layout === '2-inset') return (
                <div className={`relative w-full h-full bg-white ${brd}`}>
                    {renderDraggableImage(0, "w-full h-full")}
                    <div className="absolute bottom-4 right-4 w-1/3 h-1/3 shadow-2xl border-4 border-white rounded-xl overflow-hidden">
                        {renderDraggableImage(1, "w-full h-full")}
                    </div>
                </div>
            );
            if (layout === '2-cine') return (
                <div className={`flex flex-col justify-center gap-4 w-full h-full bg-slate-900 ${brd}`}>
                    {renderDraggableImage(0, "h-[35%]")}
                    {renderDraggableImage(1, "h-[35%]")}
                </div>
            );
            return null;
        }

        // --- 3 IMAGES ---
        if (count === 3 || layout.startsWith('3-')) {
            if (layout === '3-anchor') return (
                <div className={`grid w-full h-full bg-white relative ${brd}`} style={{ gridTemplateColumns: `${main}% ${100-main}%`, gap: '8px' }}>
                    {renderDraggableImage(0, "h-full")}
                    <div 
                        onMouseDown={handleResizeStart('main')}
                        className="absolute top-0 bottom-0 w-4 -translate-x-1/2 cursor-ew-resize z-20 flex items-center justify-center group/resize"
                        style={{ left: `${main}%` }}
                    >
                        <div className="h-12 w-1.5 bg-slate-300 rounded-full group-hover/resize:bg-indigo-500 transition-colors flex items-center justify-center">
                            <GripVertical size={10} className="text-white" />
                        </div>
                    </div>
                    <div className="grid h-full relative" style={{ gridTemplateRows: `${sub}% ${100-sub}%`, gap: '8px' }}>
                        {renderDraggableImage(1, "h-full")}
                        <div 
                            onMouseDown={handleResizeStart('sub')}
                            className="absolute left-0 right-0 h-4 -translate-y-1/2 cursor-ns-resize z-20 flex items-center justify-center group/resize"
                            style={{ top: `${sub}%` }}
                        >
                            <div className="w-10 h-1 bg-slate-200 rounded-full group-hover/resize:bg-indigo-400 transition-colors" />
                        </div>
                        {renderDraggableImage(2, "h-full")}
                    </div>
                </div>
            );

            if (layout === '3-header') return (
                <div className={`grid w-full h-full bg-white relative ${brd}`} style={{ gridTemplateRows: `${main}% ${100-main}%`, gap: '8px' }}>
                    <div className="h-full">{renderDraggableImage(0, "h-full")}</div>
                    <div 
                        onMouseDown={handleResizeStart('main')}
                        className="absolute left-0 right-0 h-4 -translate-y-1/2 cursor-ns-resize z-20 flex items-center justify-center group/resize"
                        style={{ top: `${main}%` }}
                    >
                        <div className="w-12 h-1.5 bg-slate-300 rounded-full group-hover/resize:bg-indigo-500 transition-colors" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 h-full">
                        {renderDraggableImage(1, "h-full")}
                        {renderDraggableImage(2, "h-full")}
                    </div>
                </div>
            );

            if (layout === '3-pillar') return (
                <div className={`grid grid-cols-3 gap-2 w-full h-full bg-white ${brd}`}>
                    {renderDraggableImage(0, "h-full")}
                    {renderDraggableImage(1, "h-full")}
                    {renderDraggableImage(2, "h-full")}
                </div>
            );
            if (layout === '3-focus') return (
                <div className={`grid grid-cols-12 gap-2 w-full h-full bg-white ${brd}`}>
                    {renderDraggableImage(1, "col-span-3 h-full")}
                    {renderDraggableImage(0, "col-span-6 h-full")}
                    {renderDraggableImage(2, "col-span-3 h-full")}
                </div>
            );
            if (layout === '3-stair') return (
                <div className={`grid grid-cols-3 grid-rows-3 gap-2 w-full h-full bg-white ${brd}`}>
                    <div className="col-span-2 row-span-2">{renderDraggableImage(0, "h-full")}</div>
                    <div className="col-span-1 row-span-1">{renderDraggableImage(1, "h-full")}</div>
                    <div className="col-span-1 row-span-2">{renderDraggableImage(2, "h-full")}</div>
                </div>
            );
            return null;
        }

        // --- 4+ IMAGES ---
        if (count >= 4 || layout.startsWith('4-')) {
            if (layout === '4-hero') return (
                <div className={`grid grid-rows-4 gap-2 w-full h-full bg-white ${brd}`}>
                    <div className="row-span-3 h-full">{renderDraggableImage(0, "h-full")}</div>
                    <div className="row-span-1 grid grid-cols-3 gap-2 h-full">
                        {renderDraggableImage(1, "h-full")}
                        {renderDraggableImage(2, "h-full")}
                        {renderDraggableImage(3, "h-full")}
                    </div>
                </div>
            );
            if (layout === '4-ribbon') return (
                <div className={`grid grid-rows-4 gap-2 w-full h-full bg-white ${brd}`}>
                    {renderDraggableImage(0, "h-full")}
                    {renderDraggableImage(1, "h-full")}
                    {renderDraggableImage(2, "h-full")}
                    {renderDraggableImage(3, "h-full")}
                </div>
            );
            if (layout === '4-mosaic') return (
                <div className={`grid grid-cols-10 grid-rows-10 gap-2 w-full h-full bg-white ${brd}`}>
                    <div className="col-span-6 row-span-6">{renderDraggableImage(0, "h-full")}</div>
                    <div className="col-span-4 row-span-4">{renderDraggableImage(1, "h-full")}</div>
                    <div className="col-span-4 row-span-6">{renderDraggableImage(2, "h-full")}</div>
                    <div className="col-span-6 row-span-4">{renderDraggableImage(3, "h-full")}</div>
                </div>
            );
            if (layout === '4-window') return (
                <div className={`grid grid-cols-4 gap-2 w-full h-full bg-white ${brd}`}>
                    {renderDraggableImage(0, "h-full")}
                    {renderDraggableImage(1, "h-full")}
                    {renderDraggableImage(2, "h-full")}
                    {renderDraggableImage(3, "h-full")}
                </div>
            );
            return ( // 4-grid (Default)
                <div className={`grid grid-cols-2 grid-rows-2 gap-2 w-full h-full bg-white ${brd}`}>
                    {renderDraggableImage(0, "h-full")}
                    {renderDraggableImage(1, "h-full")}
                    {renderDraggableImage(2, "h-full")}
                    {renderDraggableImage(3, "h-full")}
                </div>
            );
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 h-[90vh]">
                <div className="bg-[#2d3748] px-8 py-6 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><LayoutTemplate size={24}/></div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight leading-none">Photo Collage Studio</h3>
                            <p className="text-[10px] font-bold text-indigo-200 uppercase mt-1 tracking-widest">Multi-View Evidence Synthesis</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X size={28} /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10 flex flex-col items-center">
                    {/* Preview Area */}
                    <div className="relative group">
                        <div 
                            ref={collageRef}
                            className="w-full aspect-square max-w-[420px] border-[12px] border-slate-100 shadow-inner bg-slate-50 relative overflow-hidden rounded-[2.5rem]"
                        >
                            {renderLayout()}
                        </div>
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 whitespace-nowrap">
                                <Move size={12} /> Drag to swap positions
                            </div>
                            <div className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 whitespace-nowrap delay-75">
                                <Plus size={12} /> Use dividers or tile icons to adjust
                            </div>
                        </div>
                    </div>

                    {/* Source Images Control */}
                    <div className="w-full max-w-[500px] space-y-4 pt-4">
                        <div className="flex items-center justify-between px-1">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Source Identity Pool ({count})</h4>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm"
                            >
                                <PlusCircle size={14}/> Add Photo
                            </button>
                            <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handleAddMore} />
                        </div>
                        
                        <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1 hide-scrollbar snap-x">
                            {images.map((img, i) => (
                                <div key={i} className="relative group shrink-0 snap-start">
                                    <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden border-4 border-slate-100 shadow-md transition-all group-hover:border-indigo-400">
                                        <img src={img} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem] flex flex-col items-center justify-center gap-2">
                                        <div className="flex gap-1.5">
                                            <button onClick={() => handleMove(i, 'left')} disabled={i === 0} className="p-1.5 bg-white rounded-lg text-indigo-600 disabled:opacity-30 hover:scale-110 transition-transform"><ArrowLeft size={14}/></button>
                                            <button onClick={() => handleMove(i, 'right')} disabled={i === images.length - 1} className="p-1.5 bg-white rounded-lg text-indigo-600 disabled:opacity-30 hover:scale-110 transition-transform"><ArrowRight size={14}/></button>
                                        </div>
                                        <button onClick={() => handleRemoveImage(i)} className="p-1.5 bg-rose-500 rounded-lg text-white hover:scale-110 transition-transform shadow-lg"><Trash2 size={14}/></button>
                                    </div>
                                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm">{i+1}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Logic Controls */}
                    <div className="w-full max-w-[500px] space-y-8">
                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Edge Style</label>
                                <select 
                                    value={rounding} 
                                    onChange={e => setRounding(e.target.value as any)}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-3 text-xs font-black uppercase outline-none focus:border-indigo-400 transition-all shadow-sm"
                                >
                                    <option value="none">Industrial (Flat)</option>
                                    <option value="soft">Modern (Rounded)</option>
                                    <option value="full">Organic (Full)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Padding Gap</label>
                                <select 
                                    value={border} 
                                    onChange={e => setBorder(e.target.value as any)}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-3 text-xs font-black uppercase outline-none focus:border-indigo-400 transition-all shadow-sm"
                                >
                                    <option value="none">Zero Gap</option>
                                    <option value="thin">Precision (2px)</option>
                                    <option value="thick">Wide (8px)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Structure Matrix</label>
                                <div className="w-full h-[46px] bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center text-[9px] font-black uppercase text-indigo-600">
                                    <LayoutGrid size={16} className="mr-2" /> {count} Images
                                </div>
                            </div>
                        </div>

                        {/* Layout Selectors (Based on current count) */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Architectural Options (5 Variations)</h4>
                            <div className="flex gap-4 justify-center items-center overflow-x-auto hide-scrollbar p-2">
                                {count === 2 && [
                                    { id: '2-v', icon: Columns }, { id: '2-h', icon: Rows }, { id: '2-inset', icon: Layout }, { id: '2-persp', icon: StretchHorizontal }, { id: '2-cine', icon: Maximize }
                                ].map(lt => (
                                    <button 
                                        key={lt.id}
                                        onClick={() => { setLayout(lt.id as any); setMainSplitRatio(50); }}
                                        className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${layout === lt.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-110' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200'}`}
                                    >
                                        <lt.icon size={24} />
                                    </button>
                                ))}
                                {count === 3 && [
                                    { id: '3-anchor', icon: Grid }, { id: '3-header', icon: Rows }, { id: '3-pillar', icon: Columns }, { id: '3-focus', icon: LayoutTemplate }, { id: '3-stair', icon: Layout }
                                ].map(lt => (
                                    <button 
                                        key={lt.id}
                                        onClick={() => { setLayout(lt.id as any); setMainSplitRatio(layout === '3-anchor' ? 66 : 50); }}
                                        className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${layout === lt.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-110' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200'}`}
                                    >
                                        <lt.icon size={24} />
                                    </button>
                                ))}
                                {count >= 4 && [
                                    { id: '4-grid', icon: Grid }, { id: '4-hero', icon: Layout }, { id: '4-ribbon', icon: Rows }, { id: '4-mosaic', icon: LayoutTemplate }, { id: '4-window', icon: Columns }
                                ].map(lt => (
                                    <button 
                                        key={lt.id}
                                        onClick={() => setLayout(lt.id as any)}
                                        className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${layout === lt.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-110' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200'}`}
                                    >
                                        <lt.icon size={24} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3 shrink-0 pb-safe">
                    <button onClick={onClose} className="px-10 py-4 text-xs font-black uppercase text-slate-400 hover:text-slate-600 tracking-widest transition-all">Discard</button>
                    <button 
                        onClick={handleGenerate}
                        disabled={isRendering}
                        className="px-20 py-4 bg-indigo-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        {isRendering ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} strokeWidth={3} />}
                        Confirm & Save to Form
                    </button>
                </div>
            </div>

            {/* Sub-Modal: Cropper */}
            {croppingIndex !== null && (
                <CropModal 
                    imageUrl={images[croppingIndex]} 
                    onSave={(url) => handleCropSave(croppingIndex, url)} 
                    onCancel={() => setCroppingIndex(null)} 
                />
            )}
        </div>
    );
};

// --- ComplaintFormModal ---

const ComplaintFormModal: React.FC<ComplaintFormModalProps> = ({ 
    onClose, 
    onSave, 
    onViewImage,
    availableSops = [], 
    availableLocations = [],
    availableDepartments = [],
    usageFrequencies = {},
    initialPersistence,
    userId,
    initialData
}) => {
    // Correctly initialize evidenceItems from initialData.allEvidence
    const [evidenceItems, setEvidenceItems] = useState<{file: File | null, url: string, isCompressing?: boolean}[]>(
        initialData?.allEvidence 
            ? initialData.allEvidence.map((ev: any) => ({ file: ev.file || null, url: ev.url, isCompressing: false }))
            : []
    );

    // Identify if the thumbnail is a generated collage to re-hydrate state
    const [collageImage, setCollageImage] = useState<string | null>(
        initialData?.thumbnail?.startsWith('data:image/') ? initialData.thumbnail : null
    );

    const [concern, setConcern] = useState(initialData?.title || '');
    const [isDragging, setIsDragging] = useState(false);
    
    const [mentionType, setMentionType] = useState<MentionType | null>(null);
    const [mentionSearch, setMentionSearch] = useState("");
    const [cursorPos, setCursorPos] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const observationContainerRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState<{top: number, left: number, width: number} | null>(null);
    const cameraCaptureRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const [showMediaMenu, setShowMediaMenu] = useState(false);
    const [isCollageStudioOpen, setIsCollageStudioOpen] = useState(false);
    const [editingPhoto, setEditingPhoto] = useState<string | null>(null);
    const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);
    const mediaMenuRef = useRef<HTMLDivElement>(null);

    const initialSelections = useMemo(() => {
        if (initialData) {
            return {
                location: initialData.area ? [initialData.area] : [],
                sop: initialData.sop ? [initialData.sop] : [],
                asset: initialData.assets?.map((a: any) => a.name) || [],
                staff: initialData.people?.map((p: any) => p.name) || [],
                category: initialData.categories?.map((c: any) => c.name) || [],
                responsibility: initialData.mainKitchen ? [initialData.mainKitchen] : []
            };
        }
        return initialPersistence?.selections || { location: [], sop: [], asset: [], staff: [], category: [], responsibility: [] };
    }, [initialData, initialPersistence]);

    const [locks, setLocks] = useState<Record<string, boolean>>(initialPersistence?.locks || {
        location: false, sop: false, asset: false, staff: false, category: false, responsibility: false
    });
    const [selections, setSelections] = useState<Record<string, string[]>>(initialSelections);

    // --- Handlers ---

    const processFiles = (fileArray: File[], isCamera: boolean = false) => {
        const firstFile = fileArray[0];
        if (firstFile && firstFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const url = e.target?.result as string;
                setEditingPhotoIndex(null); // Signal it's a new upload
                setEditingPhoto(url);
            };
            reader.readAsDataURL(firstFile);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isCamera = e.target.getAttribute('capture') !== null;
        if (e.target.files?.length) processFiles(Array.from(e.target.files), isCamera);
        e.target.value = '';
        setShowMediaMenu(false);
    };

    const handleSaveEditedPhoto = async (editedUrl: string) => {
        const compressed = await compressImage(editedUrl, 100);
        if (editingPhotoIndex !== null) {
            // Update existing item
            setEvidenceItems(prev => prev.map((item, i) => i === editingPhotoIndex ? { ...item, url: compressed } : item));
        } else {
            // Add new item
            setEvidenceItems(prev => [...prev, { file: null, url: compressed, isCompressing: false }]);
        }
        setEditingPhoto(null);
        setEditingPhotoIndex(null);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        const pos = e.target.selectionStart || 0;
        setConcern(text);
        setCursorPos(pos);
        const textBeforeCursor = text.slice(0, pos);
        const lastSymbolMatch = textBeforeCursor.match(/([@#$+!*])(\w*)$/);
        if (lastSymbolMatch) {
            const sym = lastSymbolMatch[1];
            const types: Record<string, MentionType> = {
                '@': 'location', 
                '#': 'sop', 
                '$': 'asset', 
                '+': 'staff', 
                '!': 'category', 
                '*': 'responsibility'
            };
            setMentionType(types[sym]);
            setMentionSearch(lastSymbolMatch[2] || "");
        } else {
            setMentionType(null);
        }
    };

    const applyMention = (value: string, type: string) => {
        const textBeforeCursor = concern.slice(0, cursorPos);
        const textAfterCursor = concern.slice(cursorPos);
        const symbolMatch = textBeforeCursor.match(/([@#$+!*])\w*$/);
        let newText = concern;
        let finalPos = cursorPos;
        if (symbolMatch) {
            const prefix = textBeforeCursor.slice(0, symbolMatch.index);
            newText = `${prefix}${textAfterCursor}`.trim();
            finalPos = prefix.length;
        }
        setConcern(newText);
        setSelections(prev => ({ ...prev, [type]: [...new Set([...prev[type], value])] }));
        setMentionType(null);
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(finalPos, finalPos);
                setCursorPos(finalPos);
            }
        }, 0);
    };

    const handleSaveReport = () => {
        // ALWAYS save evidenceItems as the source list, even if a collage exists.
        // This ensures the collage can be re-edited later.
        onSave({
            id: initialData?.id,
            title: concern || 'New Observation', 
            sop: selections.sop.join(', ') || 'General',
            location: { area: selections.location.join(', ') || 'Unit' },
            responsibility: selections.responsibility.join(', ') || 'General',
            allEvidence: evidenceItems.map(item => ({ 
                file: item.file, 
                url: item.url, 
                type: item.file?.type.startsWith('video/') ? 'video' : 'image' 
            })),
            thumbnail: collageImage || (evidenceItems.length > 0 ? evidenceItems[0].url : null),
            staffInvolved: selections.staff,
            assetId: selections.asset,
            foodCategory: selections.category,
            persistence: { selections, locks }
        });
        onClose();
    };

    const handleSaveCollage = (dataUrl: string, finalImages: string[]) => {
        setCollageImage(dataUrl);
        // Sync back the final images used in the studio to the evidence items pool
        setEvidenceItems(finalImages.map(url => ({ file: null, url, isCompressing: false })));
        setIsCollageStudioOpen(false);
        setShowMediaMenu(false);
    };

    const handleRemoveCollage = () => {
        if(confirm("Remove collage? This will restore individual photos for editing.")) {
            setCollageImage(null);
        }
    };

    const mentionOptions = useMemo(() => {
        let options: string[] = [];
        if (mentionType === 'location') options = availableLocations.length ? availableLocations : FALLBACK_LOCATIONS;
        else if (mentionType === 'sop') options = availableSops.length ? availableSops : FALLBACK_SOPS;
        else if (mentionType === 'asset') options = MOCK_ASSETS;
        else if (mentionType === 'staff') options = MOCK_STAFF;
        else if (mentionType === 'category') options = ["Poultry", "Vegetables", "Dairy", "Frozen", "RTE"];
        else if (mentionType === 'responsibility') options = availableDepartments.length ? availableDepartments : FALLBACK_DEPARTMENTS;
        return options.filter(o => o.toLowerCase().includes(mentionSearch.toLowerCase()));
    }, [mentionType, mentionSearch, availableLocations, availableSops, availableDepartments]);

    useEffect(() => {
        if (mentionType && observationContainerRef.current) {
            const rect = observationContainerRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.top + 60,
                left: rect.left + 8,
                width: rect.width - 16,
            });
        } else {
            setDropdownPos(null);
        }
    }, [mentionType]);

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col relative animate-in zoom-in-95 border border-slate-200 overflow-hidden">
                {/* Drag Overlay */}
                {isDragging && (
                    <div className="absolute inset-0 z-[170] bg-indigo-600/90 backdrop-blur-sm flex flex-col items-center justify-center text-white m-2 rounded-[2.5rem] animate-in fade-in">
                        <Upload size={64} className="mb-4 animate-bounce" />
                        <h3 className="text-2xl font-black uppercase">Drop Evidence Here</h3>
                    </div>
                )}
                
                {/* Header */}
                <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 text-left">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg"><Plus size={20} strokeWidth={3} /></div>
                        <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">{initialData ? 'Update Observation' : 'New Observation'}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
                </div>

                {/* Body */}
                <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar space-y-4">
                    <div ref={observationContainerRef} className="relative bg-slate-50 border-2 border-slate-100 rounded-[2rem] shadow-inner flex flex-col min-h-[400px]">
                        {/* Control Bar */}
                        <div className="p-3 border-b border-slate-200/60 flex items-center justify-between gap-3 bg-white/50 backdrop-blur-md sticky top-0 z-20">
                            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm overflow-x-auto hide-scrollbar flex-1">
                                {[
                                    { t: 'location' as MentionType, i: MapPin, s: '@', l: 'Location' },
                                    { t: 'sop' as MentionType, i: BookOpen, s: '#', l: 'SOPs' },
                                    { t: 'responsibility' as MentionType, i: Briefcase, s: '*', l: 'Responsibility' },
                                    { t: 'asset' as MentionType, i: Wrench, s: '$', l: 'Asset' },
                                    { t: 'staff' as MentionType, i: Users, s: '+', l: 'Staff' },
                                    { t: 'category' as MentionType, i: Tag, s: '!', l: 'Vendor Name' }
                                ].map(({ t, i: Icon, s, l }) => (
                                    <button 
                                        key={t}
                                        type="button"
                                        title={`${l} (${s})`}
                                        onClick={() => {
                                            const ta = textareaRef.current;
                                            if (!ta) return;
                                            const cur = ta.selectionStart;
                                            const before = concern.substring(0, cur);
                                            const after = concern.substring(cur);
                                            setConcern(before + (before.endsWith(' ') || before === '' ? '' : ' ') + s + after);
                                            setMentionType(t);
                                            setTimeout(() => ta.focus(), 0);
                                        }}
                                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${mentionType === t ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:bg-indigo-50'}`}
                                    >
                                        <Icon size={18} />
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <div className="relative" ref={mediaMenuRef}>
                                    <button type="button" onClick={() => setShowMediaMenu(!showMediaMenu)} className={`w-11 h-11 rounded-2xl flex items-center justify-center border-2 transition-all ${showMediaMenu ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-400'}`}><Camera size={20}/></button>
                                    {showMediaMenu && (
                                        <div className="absolute top-full right-0 mt-3 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl p-1 animate-in zoom-in-95 text-left">
                                            <button onClick={() => cameraCaptureRef.current?.click()} className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-xl flex items-center gap-3 text-xs font-black uppercase text-slate-700 transition-colors"><Camera size={16}/> Camera</button>
                                            <button onClick={() => galleryInputRef.current?.click()} className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-xl flex items-center gap-3 text-xs font-black uppercase text-slate-700 transition-colors"><ImageIcon size={16}/> Gallery</button>
                                        </div>
                                    )}
                                </div>
                                <button onClick={handleSaveReport} disabled={!concern && !evidenceItems.length && !collageImage} className="w-11 h-11 bg-indigo-600 text-white rounded-2xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center disabled:opacity-40 disabled:scale-95"><SendHorizonal size={20}/></button>
                            </div>
                        </div>

                        {/* Evidence & Content */}
                        <div className="p-5 flex-1 flex flex-col gap-4 relative">
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(selections).map(([k, v]) => (v as string[]).map(val => (
                                        <span key={val} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-100 rounded-xl text-[10px] font-black uppercase text-indigo-600 shadow-sm animate-in zoom-in">
                                            <span>{val}</span>
                                            <button onClick={() => setSelections(p => ({...p, [k]: p[k as keyof typeof selections].filter(x => x !== val)}))}><X size={12} strokeWidth={4}/></button>
                                        </span>
                                    )))}
                                    
                                    {/* Display Collage if exists, otherwise display individual items */}
                                    {collageImage ? (
                                        <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-4 border-indigo-500 group cursor-zoom-in shadow-xl animate-in zoom-in" onClick={() => onViewImage?.(collageImage, 'Consolidated Collage')}>
                                            <img src={collageImage} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setIsCollageStudioOpen(true); }} 
                                                    className="p-1.5 bg-white rounded-lg text-indigo-600 hover:scale-110 transition-transform"
                                                    title="Edit Collage"
                                                >
                                                    <Edit2 size={16} strokeWidth={3} />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveCollage(); }} 
                                                    className="p-1.5 bg-rose-500 rounded-lg text-white hover:scale-110 transition-transform"
                                                    title="Remove Collage"
                                                >
                                                    <Trash2 size={16} strokeWidth={3} />
                                                </button>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-indigo-600/90 text-white text-[8px] font-black text-center py-0.5 uppercase tracking-tighter">Collage Active</div>
                                        </div>
                                    ) : (
                                        evidenceItems.map((item, i) => (
                                            <div key={i} className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-indigo-200 group cursor-zoom-in shadow-sm">
                                                <img src={item.url} className="w-full h-full object-cover" onClick={() => onViewImage?.(item.url, 'Evidence')} />
                                                {item.isCompressing && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 size={16} className="text-white animate-spin" /></div>}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setEditingPhotoIndex(i); setEditingPhoto(item.url); }}
                                                        className="p-1 bg-white rounded text-indigo-600 hover:bg-indigo-50"
                                                        title="Edit Image"
                                                    >
                                                        <Edit2 size={10} strokeWidth={3} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setEvidenceItems(p => p.filter((_, idx) => idx !== i)); }} 
                                                        className="p-1 bg-rose-500 rounded text-white hover:bg-rose-600"
                                                        title="Remove Image"
                                                    >
                                                        <X size={10} strokeWidth={3}/>
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Create Collage Button - Visually lined up below images */}
                                {!collageImage && evidenceItems.length >= 2 && (
                                    <button 
                                        type="button"
                                        onClick={() => setIsCollageStudioOpen(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all w-fit shadow-sm animate-in fade-in"
                                    >
                                        <LayoutTemplate size={14} />
                                        Create Multi-Photo Collage
                                    </button>
                                )}
                            </div>

                            <textarea 
                                ref={textareaRef}
                                value={concern}
                                onChange={handleTextChange}
                                placeholder="Describe observation... Use @ for Location, # for SOPs, $ for Asset, * for Responsibility, + for Staff, ! for Vendor Name..."
                                className="flex-1 w-full bg-transparent text-sm font-medium focus:outline-none resize-none placeholder:text-slate-300 text-left"
                            />
                        </div>

                        {/* Mention Suggestions Popup - rendered via portal to avoid overflow clipping */}
                        {mentionType && dropdownPos && typeof document !== 'undefined' && createPortal(
                            <div 
                                className="bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-top-2"
                                style={{
                                    position: 'fixed',
                                    top: dropdownPos.top,
                                    left: dropdownPos.left,
                                    width: dropdownPos.width,
                                    zIndex: 9999,
                                }}
                            >
                                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-left">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                                        Select {
                                            mentionType === 'location' ? 'Location' :
                                            mentionType === 'sop' ? 'SOPs' :
                                            mentionType === 'asset' ? 'Asset' :
                                            mentionType === 'responsibility' ? 'Responsibility (Department)' :
                                            mentionType === 'staff' ? 'Staff/Person' :
                                            mentionType === 'category' ? 'Vendor Name' : 'Registry'
                                        } Registry Node
                                    </span>
                                    <button onClick={() => setMentionType(null)}><X size={14}/></button>
                                </div>
                                <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                                    {mentionOptions.length > 0 ? mentionOptions.map((opt) => (
                                        <button 
                                            key={opt}
                                            type="button"
                                            onClick={() => applyMention(opt, mentionType)}
                                            className="w-full text-left px-5 py-3 hover:bg-indigo-50 rounded-xl text-xs font-black uppercase text-slate-700 transition-colors flex items-center justify-between"
                                        >
                                            {opt}
                                            <ChevronRight size={14} className="text-slate-300" />
                                        </button>
                                    )) : (
                                        <div className="p-10 text-center text-slate-300 text-xs font-bold uppercase italic">No registry nodes identified</div>
                                    )}
                                </div>
                            </div>,
                            document.body
                        )}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center gap-3 text-left">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 text-indigo-500 shadow-sm"><Info size={14}/></div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                        Use semantic tags (@, #, $) to map observations to active system nodes. Individual evidence images are processed for forensic clarity.
                    </p>
                </div>

                {/* Input refs */}
                <input ref={cameraCaptureRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
                <input ref={galleryInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />

                {/* Collage Studio Integration */}
                {isCollageStudioOpen && (
                    <CollageStudio 
                        initialImages={evidenceItems.map(item => item.url)} 
                        onSave={handleSaveCollage} 
                        onClose={() => setIsCollageStudioOpen(false)} 
                    />
                )}

                {/* Advanced Photo Editor Integration */}
                {editingPhoto && (
                    <PhotoEditor 
                        imageUrl={editingPhoto}
                        onSave={handleSaveEditedPhoto}
                        onCancel={() => { setEditingPhoto(null); setEditingPhotoIndex(null); }}
                    />
                )}
            </div>
        </div>
    );
};

export default ComplaintFormModal;