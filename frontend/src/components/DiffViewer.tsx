'use client';

import React, { useState } from 'react';
import { Columns, AlignLeft } from 'lucide-react';

interface DiffViewerProps {
  diffText?: string | null;
}

interface DiffRow {
  oldLine: number | null;
  oldText: string | null;
  oldType: 'del' | 'context' | 'empty';
  newLine: number | null;
  newText: string | null;
  newType: 'add' | 'context' | 'empty';
}

interface ParsedFile {
  fileName: string;
  rows: DiffRow[];
  unifiedLines: Array<{ text: string; type: 'add' | 'del' | 'chunk' | 'context' | 'header' }>;
  additions: number;
  deletions: number;
}

function parseGitDiff(diffText: string): ParsedFile[] {
  if (!diffText || diffText.includes('No changes detected.')) return [];

  const files: ParsedFile[] = [];
  const rawFiles = diffText.split(/^diff --git /m).filter(Boolean);

  for (const rawFile of rawFiles) {
    const lines = rawFile.split('\n');
    let fileName = 'modified file';
    const matchName = lines[0]?.match(/a\/(.+?)\s+b\/(.+)/);
    if (matchName) {
      fileName = matchName[2];
    }

    let additions = 0;
    let deletions = 0;
    const rows: DiffRow[] = [];
    const unifiedLines: Array<{ text: string; type: 'add' | 'del' | 'chunk' | 'context' | 'header' }> = [];

    let currentOldLine = 1;
    let currentNewLine = 1;

    let pendingDels: string[] = [];
    let pendingAdds: string[] = [];

    const flushPending = () => {
      const max = Math.max(pendingDels.length, pendingAdds.length);
      for (let i = 0; i < max; i++) {
        const oldText = pendingDels[i] !== undefined ? pendingDels[i] : null;
        const newText = pendingAdds[i] !== undefined ? pendingAdds[i] : null;

        rows.push({
          oldLine: oldText !== null ? currentOldLine++ : null,
          oldText,
          oldType: oldText !== null ? 'del' : 'empty',
          newLine: newText !== null ? currentNewLine++ : null,
          newText,
          newType: newText !== null ? 'add' : 'empty'
        });
      }
      pendingDels = [];
      pendingAdds = [];
    };

    for (const line of lines) {
      if (line.startsWith('@@')) {
        flushPending();
        unifiedLines.push({ text: line, type: 'chunk' });
        const matchHunk = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
        if (matchHunk) {
          currentOldLine = parseInt(matchHunk[1], 10);
          currentNewLine = parseInt(matchHunk[2], 10);
        }
      } else if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('index ')) {
        unifiedLines.push({ text: line, type: 'header' });
      } else if (line.startsWith('-')) {
        deletions++;
        pendingDels.push(line.slice(1));
        unifiedLines.push({ text: line, type: 'del' });
      } else if (line.startsWith('+')) {
        additions++;
        pendingAdds.push(line.slice(1));
        unifiedLines.push({ text: line, type: 'add' });
      } else if (line.startsWith(' ') || line === '') {
        flushPending();
        const content = line.startsWith(' ') ? line.slice(1) : line;
        rows.push({
          oldLine: currentOldLine++,
          oldText: content,
          oldType: 'context',
          newLine: currentNewLine++,
          newText: content,
          newType: 'context'
        });
        unifiedLines.push({ text: line, type: 'context' });
      }
    }
    flushPending();

    files.push({
      fileName,
      rows,
      unifiedLines,
      additions,
      deletions
    });
  }

  return files;
}

export function DiffViewer({ diffText }: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const files = parseGitDiff(diffText || '');
  const [activeFileIdx, setActiveFileIdx] = useState(0);

  if (!files || files.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs italic bg-[#050810] border border-slate-800 rounded-lg">
        No changes detected in repository diff.
      </div>
    );
  }

  const file = files[activeFileIdx] || files[0];

  return (
    <div className="flex flex-col border border-slate-800 rounded-lg overflow-hidden bg-[#050810]">
      {/* File Header Bar */}
      <div className="bg-[#0b0f17] border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="font-mono text-xs font-semibold text-slate-200">
            {file.fileName}
          </span>
          <div className="flex items-center space-x-1.5 text-[11px] font-mono">
            <span className="text-emerald-400 font-medium">+{file.additions}</span>
            <span className="text-rose-400 font-medium">-{file.deletions}</span>
          </div>
        </div>

        {/* View Mode Toggle: Split vs Unified */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md p-0.5 text-xs font-medium">
          <button
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 rounded flex items-center space-x-1.5 transition ${
              viewMode === 'split' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split</span>
          </button>
          <button
            onClick={() => setViewMode('unified')}
            className={`px-2.5 py-1 rounded flex items-center space-x-1.5 transition ${
              viewMode === 'unified' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
            <span>Unified</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side (Split) View */}
      {viewMode === 'split' && (
        <div className="overflow-x-auto max-h-[580px] font-mono text-xs select-text">
          <div className="grid grid-cols-2 divide-x divide-slate-800 border-b border-slate-800 bg-[#090d14] text-[11px] text-slate-400 font-semibold px-4 py-1.5">
            <div>Original Code (Before)</div>
            <div className="pl-4">Fixed Code (After)</div>
          </div>

          <div className="divide-y divide-slate-900/60">
            {file.rows.map((row, idx) => {
              const isOldDel = row.oldType === 'del';
              const isNewAdd = row.newType === 'add';

              return (
                <div key={idx} className="grid grid-cols-2 divide-x divide-slate-800/80">
                  {/* Left (Old / Original) */}
                  <div className={`flex items-start ${isOldDel ? 'bg-rose-500/15' : ''}`}>
                    <span className="w-10 py-0.5 pr-2 text-right text-slate-600 select-none text-[11px] shrink-0 border-r border-slate-800/40">
                      {row.oldLine ?? ''}
                    </span>
                    <span
                      className={`px-3 py-0.5 whitespace-pre-wrap break-all flex-1 ${
                        isOldDel ? 'text-rose-300 font-medium' : 'text-slate-400'
                      }`}
                    >
                      {row.oldText ?? ' '}
                    </span>
                  </div>

                  {/* Right (New / Fixed) */}
                  <div className={`flex items-start ${isNewAdd ? 'bg-emerald-500/15' : ''}`}>
                    <span className="w-10 py-0.5 pr-2 text-right text-slate-600 select-none text-[11px] shrink-0 border-r border-slate-800/40">
                      {row.newLine ?? ''}
                    </span>
                    <span
                      className={`px-3 py-0.5 whitespace-pre-wrap break-all flex-1 ${
                        isNewAdd ? 'text-emerald-300 font-medium' : 'text-slate-400'
                      }`}
                    >
                      {row.newText ?? ' '}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unified View */}
      {viewMode === 'unified' && (
        <div className="overflow-x-auto max-h-[580px] font-mono text-xs select-text py-1">
          {file.unifiedLines.map((line, idx) => {
            let lineStyle = 'text-slate-300';
            let bgStyle = '';

            if (line.type === 'add') {
              lineStyle = 'text-emerald-300 font-medium';
              bgStyle = 'bg-emerald-500/15';
            } else if (line.type === 'del') {
              lineStyle = 'text-rose-300 font-medium';
              bgStyle = 'bg-rose-500/15';
            } else if (line.type === 'chunk') {
              lineStyle = 'text-sky-300 font-semibold';
              bgStyle = 'bg-sky-500/10';
            } else if (line.type === 'header') {
              lineStyle = 'text-amber-400 font-bold';
            }

            return (
              <div key={idx} className={`px-4 py-0.5 flex items-start space-x-3 ${bgStyle}`}>
                <span className="text-slate-600 text-[11px] select-none w-8 text-right shrink-0">
                  {idx + 1}
                </span>
                <span className={`${lineStyle} break-all whitespace-pre-wrap flex-1`}>
                  {line.text || ' '}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
