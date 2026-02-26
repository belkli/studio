'use client';

/**
 * @fileoverview Signature Canvas component for digital form signing.
 * SDD-P4 (Parent) and SDD-P5 (Ministry) require digital signatures
 * on official forms, with SHA-256 hash audit trail.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';

interface SignatureCanvasProps {
    onSave: (signatureDataUrl: string) => void;
    onClear?: () => void;
    width?: number;
    height?: number;
    disabled?: boolean;
    className?: string;
}

export function SignatureCanvas({
    onSave,
    onClear,
    width = 500,
    height = 200,
    disabled = false,
    className = '',
}: SignatureCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set up canvas for high-DPI displays
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        // Set drawing style
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw signature line
        ctx.beginPath();
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.moveTo(20, height - 40);
        ctx.lineTo(width - 20, height - 40);
        ctx.stroke();

        // Reset drawing style
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 2;
    }, [width, height]);

    const getPosition = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            const canvas = canvasRef.current;
            if (!canvas) return { x: 0, y: 0 };

            const rect = canvas.getBoundingClientRect();
            if ('touches' in e) {
                return {
                    x: e.touches[0].clientX - rect.left,
                    y: e.touches[0].clientY - rect.top,
                };
            }
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        },
        []
    );

    const startDrawing = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            if (disabled) return;
            e.preventDefault();
            const ctx = canvasRef.current?.getContext('2d');
            if (!ctx) return;

            const { x, y } = getPosition(e);
            ctx.beginPath();
            ctx.moveTo(x, y);
            setIsDrawing(true);
            setHasSignature(true);
        },
        [disabled, getPosition]
    );

    const draw = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            if (!isDrawing || disabled) return;
            e.preventDefault();
            const ctx = canvasRef.current?.getContext('2d');
            if (!ctx) return;

            const { x, y } = getPosition(e);
            ctx.lineTo(x, y);
            ctx.stroke();
        },
        [isDrawing, disabled, getPosition]
    );

    const stopDrawing = useCallback(() => {
        setIsDrawing(false);
    }, []);

    const handleClear = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

        // Redraw signature line
        ctx.beginPath();
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.moveTo(20, height - 40);
        ctx.lineTo(width - 20, height - 40);
        ctx.stroke();
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 2;

        setHasSignature(false);
        onClear?.();
    }, [width, height, onClear]);

    const handleSave = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !hasSignature) return;

        const dataUrl = canvas.toDataURL('image/png');
        onSave(dataUrl);
    }, [hasSignature, onSave]);

    return (
        <div className={`flex flex-col items-center gap-3 ${className}`}>
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className={`touch-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-crosshair'}`}
                />
                {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-gray-400 text-sm" dir="rtl">חתום/י כאן</p>
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={handleClear}
                    disabled={!hasSignature || disabled}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    נקה
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={!hasSignature || disabled}
                    className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    אשר חתימה
                </button>
            </div>
        </div>
    );
}
