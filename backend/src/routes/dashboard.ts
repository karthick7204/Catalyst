import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get('/dashboard', async (req: FastifyRequest, reply: FastifyReply) => {
    reply.type('text/html');
    return reply.send(renderDashboardHtml());
  });

  // Redirect root to dashboard
  fastify.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    return reply.redirect('/dashboard');
  });
}

function renderDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Catalyst | AI Coding Agent Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#f0fdf4',
              500: '#22c55e',
              600: '#16a34a',
              700: '#15803d',
              900: '#14532d',
            }
          }
        }
      }
    }
  </script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    body { font-family: 'Inter', sans-serif; }
    pre, code { font-family: 'JetBrains Mono', monospace; }
    
    .diff-line-add { background-color: rgba(34, 197, 94, 0.15); color: #86efac; }
    .diff-line-del { background-color: rgba(239, 68, 68, 0.15); color: #fca5a5; }
    .diff-line-chunk { background-color: rgba(59, 130, 246, 0.1); color: #93c5fd; }
  </style>
</head>
<body class="bg-[#0b0f17] text-slate-100 min-h-screen flex flex-col">

  <!-- Top Navigation Bar -->
  <header class="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <i class="fa-solid fa-bolt text-slate-950 font-black text-lg"></i>
        </div>
        <div>
          <span class="font-bold text-lg tracking-tight text-white">Catalyst</span>
          <span class="text-xs px-2 py-0.5 ml-2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">Production Agent</span>
        </div>
      </div>

      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Engine Online (Gemini + MCP)</span>
        </div>

        <button onclick="fetchJobs()" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition">
          <i class="fa-solid fa-arrows-rotate" id="refresh-icon"></i>
          <span>Refresh</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Main Content Layout -->
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

    <!-- Left Column: Tasks / Bug List -->
    <div class="lg:col-span-4 flex flex-col space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider">Linear Bug Tasks</h2>
        <span id="job-count" class="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">0</span>
      </div>

      <div id="jobs-list" class="space-y-2.5 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
        <div class="p-8 text-center text-slate-500 text-sm">
          <i class="fa-solid fa-circle-notch fa-spin text-xl mb-2 text-emerald-500"></i>
          <p>Loading agent tasks...</p>
        </div>
      </div>
    </div>

    <!-- Right Column: Selected Task Detail & Diff Review -->
    <div class="lg:col-span-8 flex flex-col space-y-4">
      <div id="detail-panel" class="bg-slate-900/70 border border-slate-800 rounded-xl p-6 min-h-[600px] flex flex-col justify-center items-center text-slate-500">
        <i class="fa-solid fa-code-pull-request text-4xl mb-3 text-slate-600"></i>
        <p class="text-sm">Select a task from the left to review the proposed fix and diff</p>
      </div>
    </div>

  </main>

  <script>
    let currentJobs = [];
    let selectedJobId = null;

    async function fetchJobs() {
      const icon = document.getElementById('refresh-icon');
      if (icon) icon.classList.add('fa-spin');
      try {
        const res = await fetch('/api/jobs');
        const data = await res.json();
        currentJobs = data.jobs || [];
        document.getElementById('job-count').innerText = currentJobs.length;
        renderJobsList();
        
        if (currentJobs.length > 0) {
          if (!selectedJobId || !currentJobs.find(j => j.id === selectedJobId)) {
            selectJob(currentJobs[0].id);
          } else {
            renderJobDetail(selectedJobId);
          }
        }
      } catch (err) {
        console.error('Failed to fetch jobs', err);
      } finally {
        if (icon) setTimeout(() => icon.classList.remove('fa-spin'), 400);
      }
    }

    function getStatusBadge(status) {
      switch (status) {
        case 'AWAITING_APPROVAL':
          return '<span class="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">Awaiting Approval</span>';
        case 'PR_CREATED':
          return '<span class="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">PR Created</span>';
        case 'FIXING':
        case 'CLONING':
        case 'ANALYZING':
          return '<span class="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center space-x-1"><i class="fa-solid fa-circle-notch fa-spin text-[10px]"></i><span>' + status + '</span></span>';
        case 'FAILED':
          return '<span class="px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">Failed</span>';
        case 'REJECTED':
          return '<span class="px-2 py-0.5 rounded text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">Rejected</span>';
        default:
          return '<span class="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-400">' + status + '</span>';
      }
    }

    function renderJobsList() {
      const container = document.getElementById('jobs-list');
      if (currentJobs.length === 0) {
        container.innerHTML = '<div class="p-6 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-lg">No tasks captured yet. Trigger one with Linear!</div>';
        return;
      }

      container.innerHTML = currentJobs.map(job => {
        const isSelected = job.id === selectedJobId;
        const timeAgo = new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return \`
          <div onclick="selectJob('\${job.id}')" class="cursor-pointer p-4 rounded-xl border transition \${isSelected ? 'bg-slate-800/90 border-emerald-500/50 shadow-md shadow-emerald-500/5' : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'}">
            <div class="flex items-center justify-between mb-1.5">
              <span class="font-mono text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <i class="fa-solid fa-hashtag text-[10px] text-slate-500"></i>
                <span>\${job.linearIssueIdentifier}</span>
              </span>
              \${getStatusBadge(job.status)}
            </div>
            <h3 class="text-sm font-semibold text-white line-clamp-1 mb-1">\${job.linearIssueTitle}</h3>
            <div class="flex items-center justify-between text-xs text-slate-400">
              <span class="truncate max-w-[200px] flex items-center space-x-1">
                <i class="fa-brands fa-github text-slate-500"></i>
                <span>\${job.githubRepo}</span>
              </span>
              <span class="text-slate-500">\${timeAgo}</span>
            </div>
          </div>
        \`;
      }).join('');
    }

    function selectJob(id) {
      selectedJobId = id;
      renderJobsList();
      renderJobDetail(id);
    }

    function renderDiffHtml(diffText) {
      if (!diffText || diffText.includes('No changes detected.')) {
        return '<div class="p-4 text-slate-500 text-xs italic">No diff available.</div>';
      }

      const lines = diffText.split('\\n');
      return lines.map((line, idx) => {
        let cls = 'text-slate-300';
        let prefix = ' ';
        if (line.startsWith('+') && !line.startsWith('+++')) {
          cls = 'diff-line-add';
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          cls = 'diff-line-del';
        } else if (line.startsWith('@@')) {
          cls = 'diff-line-chunk font-semibold';
        } else if (line.startsWith('diff --git')) {
          cls = 'text-amber-400 font-bold';
        }
        
        const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return \`<div class="px-4 py-0.5 text-xs font-mono \${cls}">\${escaped || ' '}</div>\`;
      }).join('');
    }

    function renderJobDetail(id) {
      const job = currentJobs.find(j => j.id === id);
      const container = document.getElementById('detail-panel');
      if (!job) return;

      const isAwaiting = job.status === 'AWAITING_APPROVAL';
      const isPR = job.status === 'PR_CREATED' && job.prUrl;

      container.className = "bg-slate-900/90 border border-slate-800 rounded-xl p-6 flex flex-col space-y-6 shadow-xl";
      container.innerHTML = \`
        <!-- Header & Action Row -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div class="flex items-center space-x-2.5 mb-1.5">
              <span class="font-mono text-sm font-bold text-emerald-400">\${job.linearIssueIdentifier}</span>
              \${getStatusBadge(job.status)}
              <a href="\${job.linearIssueUrl}" target="_blank" class="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 underline decoration-slate-700 ml-2">
                <span>View on Linear</span>
                <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
              </a>
            </div>
            <h1 class="text-xl font-bold text-white">\${job.linearIssueTitle}</h1>
            <p class="text-xs text-slate-400 mt-1 flex items-center space-x-2">
              <span>Target Repo: <b class="text-slate-200">\${job.githubRepo}</b></span>
              <span>•</span>
              <span>Branch: <code class="text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded text-[11px]">\${job.fixBranch}</code></span>
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-3 shrink-0">
            \${isAwaiting ? \`
              <button onclick="handleApproval('\${job.id}', 'reject')" class="px-4 py-2 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 rounded-lg text-sm font-semibold transition border border-slate-700 hover:border-rose-500/40">
                Reject
              </button>
              <button onclick="handleApproval('\${job.id}', 'approve')" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-sm transition shadow-lg shadow-emerald-600/30 flex items-center space-x-2">
                <i class="fa-solid fa-check"></i>
                <span>Approve & Push PR</span>
              </button>
            \` : ''}

            \${isPR ? \`
              <a href="\${job.prUrl}" target="_blank" class="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition shadow-lg shadow-blue-600/30 flex items-center space-x-2">
                <i class="fa-brands fa-github text-base"></i>
                <span>View Pull Request</span>
              </a>
            \` : ''}
          </div>
        </div>

        <!-- CLI Checkout Helper Box -->
        <div class="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between text-xs">
          <div class="flex items-center space-x-2 font-mono text-slate-300 truncate">
            <span class="text-slate-500 select-none">$</span>
            <span class="truncate">git fetch origin \${job.fixBranch} && git checkout \${job.fixBranch}</span>
          </div>
          <button onclick="copyToClipboard('git fetch origin \${job.fixBranch} && git checkout \${job.fixBranch}')" class="text-slate-400 hover:text-white px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded transition shrink-0 ml-3">
            <i class="fa-regular fa-copy"></i>
            <span>Copy</span>
          </button>
        </div>

        <!-- Fix Summary & Root Cause -->
        <div class="bg-slate-950/40 border border-slate-800 rounded-lg p-4">
          <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <i class="fa-solid fa-wand-magic-sparkles text-emerald-400"></i>
            <span>AI Root Cause & Fix Summary</span>
          </h3>
          <div class="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
            \${job.fixSummary || 'Analysis in progress...'}
          </div>
        </div>

        <!-- Proposed Code Changes (Git Diff) -->
        <div class="flex-1 flex flex-col">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <i class="fa-solid fa-code-compare text-blue-400"></i>
              <span>Proposed Code Diff</span>
            </h3>
            <span class="text-xs text-slate-500 font-mono">\${job.diffContent ? (job.diffContent.split('\\n').length + ' lines') : '0 lines'}</span>
          </div>

          <div class="bg-[#050810] border border-slate-800 rounded-lg overflow-x-auto max-h-[420px] py-2">
            \${renderDiffHtml(job.diffContent)}
          </div>
        </div>
      \`;
    }

    async function handleApproval(jobId, action) {
      const job = currentJobs.find(j => j.id === jobId);
      if (!job) return;

      if (!confirm(\`Are you sure you want to \${action.toUpperCase()} this fix proposal?\`)) {
        return;
      }

      try {
        const res = await fetch(\`/api/approvals/\${jobId}\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            token: job.approvalToken
          })
        });

        const data = await res.json();
        if (data.success) {
          alert(data.message || 'Action executed successfully!');
          fetchJobs();
        } else {
          alert('Error: ' + data.message);
        }
      } catch (err) {
        alert('Failed to submit approval: ' + err.message);
      }
    }

    function copyToClipboard(text) {
      navigator.clipboard.writeText(text);
      alert('Copied git command to clipboard!');
    }

    // Auto-fetch every 3.5 seconds
    fetchJobs();
    setInterval(fetchJobs, 3500);
  </script>
</body>
</html>`;
}

