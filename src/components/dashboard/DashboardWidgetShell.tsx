'use client';

import React, { useState } from 'react';
import {
  GripVertical,
  X,
  Plus,
  RotateCcw,
  Check,
  LayoutGrid,
  Sparkles,
} from 'lucide-react';

export interface DashboardWidgetDef {
  id: string;
  title: string;
  description: string;
  group: 'kpi' | 'panel';
  colSpanClass?: string;
  icon: React.ReactNode;
}

interface WidgetCardWrapperProps {
  id: string;
  title: string;
  group: 'kpi' | 'panel';
  editMode: boolean;
  className?: string;
  onRemove: (id: string) => void;
  onDropWidget: (sourcePayload: string, targetId: string, targetGroup: 'kpi' | 'panel') => void;
  children: React.ReactNode;
}

export const WidgetCardWrapper: React.FC<WidgetCardWrapperProps> = ({
  id,
  title,
  group,
  editMode,
  className = '',
  onRemove,
  onDropWidget,
  children,
}) => {
  const [isOver, setIsOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  if (!editMode) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        setIsDragging(true);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', `board:${group}:${id}`);
      }}
      onDragEnd={() => {
        setIsDragging(false);
        setIsOver(false);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!isOver) setIsOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOver(false);
        const payload = e.dataTransfer.getData('text/plain');
        if (payload) {
          onDropWidget(payload, id, group);
        }
      }}
      className={`relative group/widget transition-all duration-200 ${className} ${
        isDragging ? 'opacity-45 scale-[0.98]' : ''
      } ${
        isOver
          ? 'ring-2 ring-[#2d6a4f] ring-offset-2 ring-offset-[#e9ecef] rounded-[8px]'
          : 'ring-2 ring-dashed ring-[#52b788]/75 rounded-[8px]'
      }`}
    >
      {/* Floating Drag Handle Pill (Top Left) */}
      <div
        className="absolute -top-2.5 left-2.5 z-30 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1b4332] text-white text-[10px] font-semibold shadow-md cursor-grab active:cursor-grabbing select-none"
        title={`Drag to reorder ${title}`}
      >
        <GripVertical className="w-3 h-3 text-[#b7e4c7]" />
        <span className="max-w-[130px] truncate">{title}</span>
      </div>

      {/* Floating Remove Button (Top Right - iOS/Android Widget Style) */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(id);
        }}
        className="absolute -top-2.5 -right-2.5 z-30 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md border-2 border-white transition-transform hover:scale-110 active:scale-95 cursor-pointer"
        title={`Remove ${title} widget`}
        aria-label={`Remove ${title} widget`}
      >
        <X className="w-3.5 h-3.5 stroke-[2.8]" />
      </button>

      {/* Block inner card clicks during edit mode so drag/delete stays smooth */}
      <div className="pointer-events-none select-none h-full">{children}</div>
    </div>
  );
};

interface WidgetDropZoneProps {
  group: 'kpi' | 'panel';
  label: string;
  onDropWidget: (sourcePayload: string, targetId: string | null, targetGroup: 'kpi' | 'panel') => void;
}

export const WidgetDropZone: React.FC<WidgetDropZoneProps> = ({
  group,
  label,
  onDropWidget,
}) => {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        if (!isOver) setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const payload = e.dataTransfer.getData('text/plain');
        if (payload) {
          onDropWidget(payload, null, group);
        }
      }}
      className={`col-span-full rounded-[8px] border-2 border-dashed p-5 text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
        isOver
          ? 'border-[#2d6a4f] bg-[#d8f3dc]/75 text-[#1b4332] scale-[1.01]'
          : 'border-[#adb5bd] bg-white/75 text-[#6c757d]'
      }`}
    >
      <LayoutGrid className="w-5 h-5 text-[#2d6a4f]" />
      <p className="text-xs font-semibold">{label}</p>
      <p className="text-[11px] opacity-80">Drag any widget from the right panel and drop it here</p>
    </div>
  );
};

interface WidgetGallerySidebarProps {
  isOpen: boolean;
  allWidgets: DashboardWidgetDef[];
  activeIds: string[];
  onAddWidget: (id: string, group: 'kpi' | 'panel') => void;
  onRemoveWidget: (id: string, group: 'kpi' | 'panel') => void;
  onResetLayout: () => void;
  onClose: () => void;
}

export const WidgetGallerySidebar: React.FC<WidgetGallerySidebarProps> = ({
  isOpen,
  allWidgets,
  activeIds,
  onAddWidget,
  onRemoveWidget,
  onResetLayout,
  onClose,
}) => {
  if (!isOpen) return null;

  const kpiWidgets = allWidgets.filter((w) => w.group === 'kpi');
  const panelWidgets = allWidgets.filter((w) => w.group === 'panel');

  const renderSection = (heading: string, items: DashboardWidgetDef[]) => (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#6c757d] px-0.5">
        {heading}
      </p>
      <div className="space-y-2">
        {items.map((w) => {
          const isAdded = activeIds.includes(w.id);
          return (
            <div
              key={w.id}
              draggable={!isAdded}
              onDragStart={(e) => {
                if (isAdded) return;
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('text/plain', `gallery:${w.group}:${w.id}`);
              }}
              className={`p-2.5 rounded-[8px] border transition-all flex items-center justify-between gap-2.5 ${
                isAdded
                  ? 'bg-[#f8f9fa] border-[#dee2e6] opacity-75'
                  : 'bg-white border-[#ced4da] hover:border-[#2d6a4f] hover:bg-[#d8f3dc]/40 cursor-grab active:cursor-grabbing shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="text-[#495057] shrink-0 flex items-center gap-1">
                  {!isAdded && <GripVertical className="w-3.5 h-3.5 text-[#adb5bd]" />}
                  {w.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#212529] truncate">{w.title}</p>
                  <p className="text-[10px] text-[#6c757d] truncate">{w.description}</p>
                </div>
              </div>

              {isAdded ? (
                <button
                  type="button"
                  onClick={() => onRemoveWidget(w.id, w.group)}
                  className="px-2 py-1 rounded-[6px] text-[10px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer shrink-0"
                  title="Remove from dashboard"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onAddWidget(w.id, w.group)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] text-[10px] font-semibold bg-[#2d6a4f] hover:bg-[#1b4332] text-white transition cursor-pointer shrink-0"
                  title="Add to dashboard"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="fixed top-[66px] right-0 bottom-0 z-40 w-[300px] sm:w-[320px] max-w-[88vw] bg-white border-l border-[#ced4da] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="px-4 py-3.5 bg-[#1b4332] text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-[#95d5b2] shrink-0" />
          <div className="min-w-0">
            <h3 style={{ color: '#ffffff' }} className="text-sm font-semibold text-white leading-tight truncate">
              Widget Gallery
            </h3>
            <p style={{ color: '#d8f3dc' }} className="text-[10px] text-[#d8f3dc] truncate">
              Drag cards onto dashboard or click + Add
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#d8f3dc] hover:bg-white/15 hover:text-white transition cursor-pointer shrink-0"
          title="Close widget drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Widget List */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-5 [scrollbar-width:thin]">
        {renderSection('KPI Stat Cards', kpiWidgets)}
        {renderSection('Dashboard Panels', panelWidgets)}
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-3 border-t border-[#dee2e6] bg-[#f8f9fa] flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onResetLayout}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[8px] bg-white hover:bg-[#e9ecef] text-[#343a40] border border-[#ced4da] text-xs font-semibold transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[8px] bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-semibold transition cursor-pointer shadow-xs"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Done</span>
        </button>
      </div>
    </aside>
  );
};
