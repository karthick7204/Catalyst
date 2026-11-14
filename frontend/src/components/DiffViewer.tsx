'use client';

import React from 'react';

interface DiffViewerProps {
  diffText?: string | null;
}

export function DiffViewer({ diffText }: DiffViewerProps) {
  if (!diffText || diffText.includes('No changes detected.')) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs italic bg-[#050810] border border-slate-800 rounded-lg">
        No code changes detected in workspace.
      </div>
    );
  }

  const lines = diffText.split('\n');

  return (
    <div className="bg-[#050810] border border-slate-800 rounded-lg overflow-x-auto max-h-[460px] py-2 font-mono text-xs select-text">
      {lines.map((line, idx) => {
        let lineStyle = 'text-slate-300';
        let bgStyle = '';

        if (line.startsWith('+') && !line.startsWith('+++')) {
          lineStyle = 'text-emerald-300 font-medium';
          bgStyle = 'bg-emerald-500/15';
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          lineStyle = 'text-rose-300 font-medium';
          bgStyle = 'bg-rose-500/15';
        } else if (line.startsWith('@@')) {
          lineStyle = 'text-sky-300 font-semibold';
          bgStyle = 'bg-sky-500/10';
        } else if (line.startsWith('diff --git') || line.startsWith('index ')) {
          lineStyle = 'text-amber-400 font-bold';
        }

        return (
          <div key={idx} className={`px-4 py-0.5 flex items-start space-x-3 ${bgStyle}`}>
            <span className="text-slate-600 text-[11px] select-none w-8 text-right shrink-0">
              {idx + 1}
            </span>
            <span className={`${lineStyle} break-all whitespace-pre-wrap flex-1`}>
              {line || ' '}
            </span>
          </div>
        );
      })}
    </div>
  );
}

