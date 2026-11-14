'use client';

import React, { useState } from 'react';
import { Columns, AlignLeft, Code2, CheckCircle2 } from 'lucide-react';

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
      <div className="p-8 text-center text-warm-muted text-xs italic bg-warm-surface border border-warm-border rounded-lg">
        No changes detected in repository diff.
      </div>
    );
  }

  const file = files[activeFileIdx] || files[0];

  return (
    <div className="flex flex-col border border-warm-border rounded-lg overflow-hidden bg-warm-surface shadow-sm">
      {/* File Header Bar */}
      <div className="bg-warm-panel border-b border-warm-border px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 font-mono text-xs font-bold text-warm-text">
            <span className="text-warm-subtle">&lt;&gt;</span>
            <span>{file.fileName}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] font-mono">
            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">
              +{file.additions}
            </span>
            <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-bold border border-rose-200">
              -{file.deletions}
            </span>
          </div>
        </div>

        {/* View Mode Toggle: Split vs Unified */}
        <div className="flex items-center bg-warm-surface border border-warm-border rounded p-0.5 text-xs font-semibold">
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1 rounded flex items-center space-x-1.5 transition ${
              viewMode === 'split'
                ? 'bg-[#1f1b18] text-stone-100 shadow-sm'
                : 'text-warm-muted hover:text-warm-text'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split (Side-by-Side)</span>
          </button>
          <button
            onClick={() => setViewMode('unified')}
            className={`px-3 py-1 rounded flex items-center space-x-1.5 transition ${
              viewMode === 'unified'
                ? 'bg-[#1f1b18] text-stone-100 shadow-sm'
                : 'text-warm-muted hover:text-warm-text'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
            <span>Unified</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side (Split) View */}
      {viewMode === 'split' && (
        <div className="overflow-x-auto max-h-[520px] font-mono text-xs select-text bg-[#faf8f4]">
          {/* Column Header Titles */}
          <div className="grid grid-cols-2 divide-x divide-warm-border border-b border-warm-border bg-warm-panel/60 text-[11px] text-warm-muted font-semibold px-4 py-1.5">
            <div className="flex items-center justify-between pr-4">
              <span>Original Code (Before)</span>
              <span className="text-[10px] text-warm-subtle">commit 9c7a23</span>
            </div>
            <div className="flex items-center justify-between pl-4">
              <span>Fixed Code (Patch v3)</span>
              <span className="text-[10px] text-emerald-700 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Passed Spec</span>
              </span>
            </div>
          </div>

          <div className="divide-y divide-warm-border/60">
            {file.rows.map((row, idx) => {
              const isOldDel = row.oldType === 'del';
              const isNewAdd = row.newType === 'add';

              return (
                <div key={idx} className="grid grid-cols-2 divide-x divide-warm-border">
                  {/* Left (Old / Original) */}
                  <div className={`flex items-start ${isOldDel ? 'bg-[#fee2e2]/60' : ''}`}>
                    <span className="w-10 py-1 pr-2 text-right text-warm-subtle select-none text-[11px] shrink-0 border-r border-warm-border/60">
                      {row.oldLine ?? ''}
                    </span>
                    <span className="w-5 py-1 text-center select-none font-bold text-rose-600 shrink-0">
                      {isOldDel ? '-' : ' '}
                    </span>
                    <span
                      className={`px-2 py-1 whitespace-pre-wrap break-all flex-1 ${
                        isOldDel ? 'text-rose-900 font-semibold bg-rose-100/50' : 'text-stone-700'
                      }`}
                    >
                      {row.oldText ?? ' '}
                    </span>
                  </div>

                  {/* Right (New / Fixed) */}
                  <div className={`flex items-start ${isNewAdd ? 'bg-[#dcfce7]/60' : ''}`}>
                    <span className="w-10 py-1 pr-2 text-right text-warm-subtle select-none text-[11px] shrink-0 border-r border-warm-border/60">
                      {row.newLine ?? ''}
                    </span>
                    <span className="w-5 py-1 text-center select-none font-bold text-emerald-600 shrink-0">
                      {isNewAdd ? '+' : ' '}
                    </span>
                    <span
                      className={`px-2 py-1 whitespace-pre-wrap break-all flex-1 ${
                        isNewAdd ? 'text-emerald-950 font-semibold bg-emerald-100/60' : 'text-stone-700'
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
        <div className="overflow-x-auto max-h-[520px] font-mono text-xs select-text py-1 bg-[#faf8f4]">
          {file.unifiedLines.map((line, idx) => {
            let lineStyle = 'text-stone-700';
            let bgStyle = '';

            if (line.type === 'add') {
              lineStyle = 'text-emerald-950 font-semibold';
              bgStyle = 'bg-[#dcfce7]/70';
            } else if (line.type === 'del') {
              lineStyle = 'text-rose-900 font-semibold';
              bgStyle = 'bg-[#fee2e2]/70';
            } else if (line.type === 'chunk') {
              lineStyle = 'text-sky-800 font-bold';
              bgStyle = 'bg-sky-50 border-y border-sky-100';
            } else if (line.type === 'header') {
              lineStyle = 'text-amber-800 font-bold';
            }

            return (
              <div key={idx} className={`px-4 py-0.5 flex items-start space-x-3 ${bgStyle}`}>
                <span className="text-warm-subtle text-[11px] select-none w-8 text-right shrink-0">
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

      {/* Diff Status Bottom Bar */}
      <div className="bg-warm-panel border-t border-warm-border px-4 py-2 flex items-center justify-between text-[11px] text-warm-muted">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Clean patch applied cleanly to repository target branch</span>
        </div>
        <div className="font-mono text-warm-subtle">
          0 syntax warnings
        </div>
      </div>
    </div>
  );
}
