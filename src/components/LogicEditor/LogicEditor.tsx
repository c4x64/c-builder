import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '../../store/useStore';
import { getPlugin } from '../../plugins/registry';
import CustomNode from './CustomNode';
import CustomEdge from './CustomEdge';
import { List, Settings, Search, Trash2, Copy, Clipboard, X } from 'lucide-react';

type NodeDef = { label: string; category: string; data: object };

const BASE_NODE_DEFS: Record<string, NodeDef> = {
  OnClicked: {
    label: 'On Clicked (Button)', category: 'Events',
    data: {
      type: 'event',
      outputs: [
        { id: 'exec', type: 'exec', label: 'Out' },
        { id: 'button_id', type: 'data', label: 'Button ID', dataType: 'int' },
      ],
    },
  },
  OnStart: {
    label: 'On Start', category: 'Events',
    data: {
      type: 'event',
      outputs: [{ id: 'exec', type: 'exec', label: 'Out' }],
    },
  },
  Print: {
    label: 'Print String', category: 'Functions',
    data: {
      type: 'function',
      properties: [
        { key: 'stringValue', label: 'String', type: 'text', default: 'Hello' },
      ],
      inputs: [
        { id: 'exec_in', type: 'exec', label: 'In' },
        { id: 'string', type: 'data', label: 'String', dataType: 'string' },
      ],
      outputs: [{ id: 'exec_out', type: 'exec', label: 'Out' }],
    },
  },
  Printf: {
    label: 'Printf', category: 'Functions',
    data: {
      type: 'function',
      properties: [
        { key: 'format', label: 'Format', type: 'text', default: '%d\\n' },
      ],
      inputs: [
        { id: 'exec_in', type: 'exec', label: 'In' },
        { id: 'format', type: 'data', label: 'Format', dataType: 'string' },
        { id: 'value', type: 'data', label: 'Value', dataType: 'int' },
      ],
      outputs: [{ id: 'exec_out', type: 'exec', label: 'Out' }],
    },
  },
  Scanf: {
    label: 'Read Integer', category: 'Functions',
    data: {
      type: 'function',
      properties: [
        { key: 'prompt', label: 'Prompt', type: 'text', default: '' },
      ],
      inputs: [
        { id: 'exec_in', type: 'exec', label: 'In' },
        { id: 'prompt', type: 'data', label: 'Prompt', dataType: 'string' },
      ],
      outputs: [
        { id: 'exec_out', type: 'exec', label: 'Out' },
        { id: 'value', type: 'data', label: 'Value', dataType: 'int' },
      ],
    },
  },
  Branch: {
    label: 'Branch', category: 'Control Flow',
    data: {
      type: 'function',
      inputs: [
        { id: 'exec_in', type: 'exec', label: 'In' },
        { id: 'condition', type: 'data', label: 'Condition', dataType: 'bool' },
      ],
      outputs: [
        { id: 'true', type: 'exec', label: 'True' },
        { id: 'false', type: 'exec', label: 'False' },
      ],
    },
  },
  ForLoop: {
    label: 'For Loop', category: 'Control Flow',
    data: {
      type: 'function',
      inputs: [
        { id: 'exec_in', type: 'exec', label: 'In' },
        { id: 'start', type: 'data', label: 'Start', dataType: 'int' },
        { id: 'end', type: 'data', label: 'End', dataType: 'int' },
      ],
      outputs: [
        { id: 'loop_body', type: 'exec', label: 'Loop Body' },
        { id: 'exec_out', type: 'exec', label: 'Completed' },
        { id: 'index', type: 'data', label: 'Index', dataType: 'int' },
      ],
    },
  },
  WhileLoop: {
    label: 'While Loop', category: 'Control Flow',
    data: {
      type: 'function',
      inputs: [
        { id: 'exec_in', type: 'exec', label: 'In' },
        { id: 'condition', type: 'data', label: 'Condition', dataType: 'bool' },
      ],
      outputs: [
        { id: 'loop_body', type: 'exec', label: 'Loop Body' },
        { id: 'exec_out', type: 'exec', label: 'Completed' },
      ],
    },
  },
  SetVar: {
    label: 'Set Variable', category: 'Variables',
    data: {
      type: 'variable',
      properties: [
        { key: 'varName', label: 'Variable Name', type: 'text', default: 'my_var' },
      ],
      inputs: [
        { id: 'exec_in', type: 'exec', label: 'In' },
        { id: 'value', type: 'data', label: 'Value', dataType: 'int' },
      ],
      outputs: [{ id: 'exec_out', type: 'exec', label: 'Out' }],
    },
  },
  GetVar: {
    label: 'Get Variable', category: 'Variables',
    data: {
      type: 'variable',
      properties: [
        { key: 'varName', label: 'Variable Name', type: 'text', default: 'my_var' },
      ],
      inputs: [],
      outputs: [{ id: 'value', type: 'data', label: 'Value', dataType: 'int' }],
    },
  },
  MathAdd: {
    label: 'Add', category: 'Math',
    data: {
      type: 'function',
      inputs: [
        { id: 'exec_in', type: 'exec', label: 'In' },
        { id: 'a', type: 'data', label: 'A', dataType: 'int' },
        { id: 'b', type: 'data', label: 'B', dataType: 'int' },
      ],
      outputs: [
        { id: 'exec_out', type: 'exec', label: 'Out' },
        { id: 'result', type: 'data', label: 'Result', dataType: 'int' },
      ],
    },
  },
  MathSub: {
    label: 'Subtract', category: 'Math',
    data: {
      type: 'function',
      inputs: [
        { id: 'exec_in', type: 'exec', label: 'In' },
        { id: 'a', type: 'data', label: 'A', dataType: 'int' },
        { id: 'b', type: 'data', label: 'B', dataType: 'int' },
      ],
      outputs: [
        { id: 'exec_out', type: 'exec', label: 'Out' },
        { id: 'result', type: 'data', label: 'Result', dataType: 'int' },
      ],
    },
  },
  MathMul: {
    label: 'Multiply', category: 'Math',
    data: {
      type: 'function',
      inputs: [
        { id: 'exec_in', type: 'exec', label: 'In' },
        { id: 'a', type: 'data', label: 'A', dataType: 'int' },
        { id: 'b', type: 'data', label: 'B', dataType: 'int' },
      ],
      outputs: [
        { id: 'exec_out', type: 'exec', label: 'Out' },
        { id: 'result', type: 'data', label: 'Result', dataType: 'int' },
      ],
    },
  },
  MathDiv: {
    label: 'Divide', category: 'Math',
    data: {
      type: 'function',
      inputs: [
        { id: 'exec_in', type: 'exec', label: 'In' },
        { id: 'a', type: 'data', label: 'A', dataType: 'int' },
        { id: 'b', type: 'data', label: 'B', dataType: 'int' },
      ],
      outputs: [
        { id: 'exec_out', type: 'exec', label: 'Out' },
        { id: 'result', type: 'data', label: 'Result', dataType: 'int' },
      ],
    },
  },
  MathMod: {
    label: 'Modulo', category: 'Math',
    data: {
      type: 'function',
      inputs: [
        { id: 'exec_in', type: 'exec', label: 'In' },
        { id: 'a', type: 'data', label: 'A', dataType: 'int' },
        { id: 'b', type: 'data', label: 'B', dataType: 'int' },
      ],
      outputs: [
        { id: 'exec_out', type: 'exec', label: 'Out' },
        { id: 'result', type: 'data', label: 'Result', dataType: 'int' },
      ],
    },
  },
  GreaterThan: {
    label: 'Greater Than', category: 'Comparison',
    data: {
      type: 'function',
      inputs: [
        { id: 'a', type: 'data', label: 'A', dataType: 'int' },
        { id: 'b', type: 'data', label: 'B', dataType: 'int' },
      ],
      outputs: [
        { id: 'result', type: 'data', label: 'Result', dataType: 'bool' },
      ],
    },
  },
  LessThan: {
    label: 'Less Than', category: 'Comparison',
    data: {
      type: 'function',
      inputs: [
        { id: 'a', type: 'data', label: 'A', dataType: 'int' },
        { id: 'b', type: 'data', label: 'B', dataType: 'int' },
      ],
      outputs: [
        { id: 'result', type: 'data', label: 'Result', dataType: 'bool' },
      ],
    },
  },
  Equals: {
    label: 'Equals', category: 'Comparison',
    data: {
      type: 'function',
      inputs: [
        { id: 'a', type: 'data', label: 'A', dataType: 'int' },
        { id: 'b', type: 'data', label: 'B', dataType: 'int' },
      ],
      outputs: [
        { id: 'result', type: 'data', label: 'Result', dataType: 'bool' },
      ],
    },
  },
  StringEquals: {
    label: 'String Equals', category: 'Comparison',
    data: {
      type: 'function',
      inputs: [
        { id: 'exec_in', type: 'exec', label: 'In' },
        { id: 'a', type: 'data', label: 'String A', dataType: 'string' },
        { id: 'b', type: 'data', label: 'String B', dataType: 'string' },
      ],
      outputs: [
        { id: 'exec_out', type: 'exec', label: 'Out' },
        { id: 'result', type: 'data', label: 'Equal', dataType: 'bool' },
      ],
    },
  },
  And: {
    label: 'And', category: 'Comparison',
    data: {
      type: 'function',
      inputs: [
        { id: 'a', type: 'data', label: 'A', dataType: 'bool' },
        { id: 'b', type: 'data', label: 'B', dataType: 'bool' },
      ],
      outputs: [
        { id: 'result', type: 'data', label: 'Result', dataType: 'bool' },
      ],
    },
  },
  Or: {
    label: 'Or', category: 'Comparison',
    data: {
      type: 'function',
      inputs: [
        { id: 'a', type: 'data', label: 'A', dataType: 'bool' },
        { id: 'b', type: 'data', label: 'B', dataType: 'bool' },
      ],
      outputs: [
        { id: 'result', type: 'data', label: 'Result', dataType: 'bool' },
      ],
    },
  },
  Not: {
    label: 'Not', category: 'Comparison',
    data: {
      type: 'function',
      inputs: [
        { id: 'a', type: 'data', label: 'Value', dataType: 'bool' },
      ],
      outputs: [
        { id: 'result', type: 'data', label: 'Result', dataType: 'bool' },
      ],
    },
  },
  Delay: {
    label: 'Delay (ms)', category: 'Functions',
    data: {
      type: 'function',
      inputs: [
        { id: 'exec_in', type: 'exec', label: 'In' },
        { id: 'ms', type: 'data', label: 'Milliseconds', dataType: 'int' },
      ],
      outputs: [{ id: 'exec_out', type: 'exec', label: 'Out' }],
    },
  },
  StrLen: {
    label: 'String Length', category: 'String',
    data: {
      type: 'function',
      inputs: [
        { id: 'str', type: 'data', label: 'String', dataType: 'string' },
      ],
      outputs: [
        { id: 'result', type: 'data', label: 'Length', dataType: 'int' },
      ],
    },
  },
  StrCat: {
    label: 'String Concat', category: 'String',
    data: {
      type: 'function',
      inputs: [
        { id: 'a', type: 'data', label: 'String A', dataType: 'string' },
        { id: 'b', type: 'data', label: 'String B', dataType: 'string' },
      ],
      outputs: [
        { id: 'result', type: 'data', label: 'Result', dataType: 'string' },
      ],
    },
  },
  StrToInt: {
    label: 'String to Int', category: 'String',
    data: {
      type: 'function',
      inputs: [
        { id: 'str', type: 'data', label: 'String', dataType: 'string' },
      ],
      outputs: [
        { id: 'result', type: 'data', label: 'Value', dataType: 'int' },
      ],
    },
  },
  Malloc: {
    label: 'Allocate Memory', category: 'Memory',
    data: {
      type: 'function',
      inputs: [
        { id: 'exec_in', type: 'exec', label: 'In' },
        { id: 'size', type: 'data', label: 'Size (bytes)', dataType: 'int' },
      ],
      outputs: [
        { id: 'exec_out', type: 'exec', label: 'Out' },
        { id: 'ptr', type: 'data', label: 'Pointer', dataType: 'int' },
      ],
    },
  },
  Free: {
    label: 'Free Memory', category: 'Memory',
    data: {
      type: 'function',
      inputs: [
        { id: 'exec_in', type: 'exec', label: 'In' },
        { id: 'ptr', type: 'data', label: 'Pointer', dataType: 'int' },
      ],
      outputs: [{ id: 'exec_out', type: 'exec', label: 'Out' }],
    },
  },
  GetTime: {
    label: 'Get Time (ms)', category: 'Functions',
    data: {
      type: 'function',
      outputs: [
        { id: 'ms', type: 'data', label: 'Millis', dataType: 'int' },
      ],
    },
  },
};

const CATEGORIES = ['Events', 'Functions', 'Control Flow', 'Variables', 'Math', 'Comparison', 'String', 'Memory'];

// Parse C function declarations from source text
function parseCFunctions(source: string): NodeDef[] {
  const defs: NodeDef[] = [];

  // Match declarations like: return_type func_name(param_type1 param_name1, param_type2 *param_name2, ...);
  // Handles const, pointers, struct, void params, etc.
  const re = /^(?:static\s+|inline\s+)?(?:const\s+)?(\w+(?:\s+\w+)*)\s+(\w+)\s*\(([^)]*)\)\s*;/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const returnType = m[1].trim();
    const funcName = m[2];
    if (['return', 'if', 'while', 'for', 'switch', 'case', 'else'].includes(funcName)) continue;

    const rawParams = m[3].split(',').map(s => s.trim()).filter(Boolean);
    const inputs: { id: string; type: 'data'; label: string; dataType: string }[] = [];
    for (let i = 0; i < rawParams.length; i++) {
      const p = rawParams[i];
      if (p === 'void') continue;
      // Peel off trailing pointer asterisks and the param name
      // e.g. "const char *name" → "const char *" + "name"
      //      "int value"       → "int" + "value"
      //      "struct foo *bar" → "struct foo *" + "bar"
      const trimmed = p.replace(/\s+/g, ' ').trim();
      const parts = trimmed.split(/\s+/);
      // The param name is the last token that doesn't start with * and isn't a type keyword
      // Type keywords include: void, char, int, float, double, long, short, unsigned, signed, const, struct, size_t, FILE, etc.
      const typeKeywords = new Set([
        'void','char','int','float','double','long','short','unsigned','signed','const','struct','size_t',
        'FILE','uint8_t','uint16_t','uint32_t','uint64_t','int8_t','int16_t','int32_t','int64_t',
        'ssize_t','off_t','pid_t','uid_t','gid_t','mode_t','dev_t','ino_t','nlink_t','blksize_t','blkcnt_t',
        'time_t','clock_t','bool','wchar_t','uintptr_t','intptr_t',
      ]);

      let label = `arg${i}`;
      let rawType = trimmed;
      // Try to find the parameter name: last word not in typeKeywords and not starting with *
      for (let j = parts.length - 1; j >= 1; j--) {
        const word = parts[j].replace(/^\*+/, '').replace(/\*+$/, '');
        if (word && !typeKeywords.has(word)) {
          label = word;
          rawType = parts.slice(0, j).join(' ');
          // Append any trailing * from the name token
          const nameToken = parts[j];
          const leadingStars = nameToken.match(/^(\*+)/);
          const trailingStars = nameToken.match(/(\*+)$/);
          if (leadingStars) rawType += leadingStars[1];
          if (trailingStars) label += trailingStars[1];
          break;
        }
      }

      // Determine the data type for pin coloring
      const typeLower = rawType.toLowerCase();
      let dataType = 'int';
      if (typeLower.includes('char') || typeLower.includes('string')) dataType = 'string';
      else if (typeLower.includes('float') || typeLower.includes('double')) dataType = 'float';
      else if (typeLower.includes('bool') || typeLower === '_bool') dataType = 'bool';

      inputs.push({ id: `param_${i}`, type: 'data' as const, label, dataType });
    }

    const outputs: { id: string; type: string; label: string; dataType?: string }[] = [];
    const rtLower = returnType.toLowerCase();
    if (rtLower !== 'void') {
      let dataType = 'int';
      if (rtLower.includes('char') || rtLower.includes('string')) dataType = 'string';
      else if (rtLower.includes('float') || rtLower.includes('double')) dataType = 'float';
      else if (rtLower.includes('bool') || rtLower === '_bool') dataType = 'bool';
      outputs.push({ id: 'result', type: 'data', label: 'Result', dataType });
    }

    defs.push({
      label: funcName,
      category: 'Library',
      data: { type: 'function', inputs, outputs },
    });
  }
  return defs;
}

// Extract owner/repo/branch from a GitHub URL
function parseGithubUrl(url: string): { owner: string; repo: string; branch: string } | null {
  const m = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\/(?:tree|blob)\/([^/]+))?(?:\/|\.git)?$/);
  if (!m) return null;
  const [, owner, repoRaw, branch] = m;
  return { owner, repo: repoRaw.replace(/\.git$/, ''), branch: branch || '' };
}

const LogicEditor: React.FC = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, openProjectId, projects, updateLogicNodeData, deleteNode, importedLibraries, importLibrary, removeImportedLibrary, githubToken } = useStore();
  const openProject = projects.find(p => p.id === openProjectId);
  const plugin = getPlugin(openProject?.plugin ?? 'none');

  const [contextMenu, setContextMenu] = useState<{ type: 'pane' | 'node'; x: number; y: number; flowX: number; flowY: number; nodeId?: string } | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'nodes' | 'props'>('nodes');
  const [libUrl, setLibUrl] = useState('');
  const [libImportStatus, setLibImportStatus] = useState('');
  const [importing, setImporting] = useState(false);
  const [copiedNode, setCopiedNode] = useState<{ type: string; data: object } | null>(null);
  const flowRef = useRef<HTMLDivElement>(null);

  // Flatten all imported library functions into a single record
  const importedFunctionsFlat = useMemo(() => {
    const flat: Record<string, NodeDef> = {};
    importedLibraries.forEach(lib => {
      Object.entries(lib.functions).forEach(([key, def]) => {
        flat[key] = def;
      });
    });
    return flat;
  }, [importedLibraries]);

  // Build merged node defs from base + imported library (always visible) + plugin functions
  const allNodeDefs = useMemo(() => {
    const merged = { ...BASE_NODE_DEFS };
    // Imported library functions — always available regardless of plugin
    Object.entries(importedFunctionsFlat).forEach(([key, def]) => {
      merged[key] = def;
    });
    // Plugin-contributed functions (only when plugin is active)
    if (plugin.functions) {
      Object.entries(plugin.functions).forEach(([key, def]) => {
        merged[key] = def;
      });
    }
    return merged;
  }, [plugin, importedFunctionsFlat]);

  // Get unique categories from merged defs
  const categories = useMemo(() => {
    const cats = new Set<string>();
    CATEGORIES.forEach(c => cats.add(c));
    Object.values(allNodeDefs).forEach(d => cats.add(d.category));
    return Array.from(cats);
  }, [allNodeDefs]);

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  const edgeTypes = useMemo(() => ({ custom: CustomEdge }), []);

  const addNodeOfType = useCallback((type: string, flowX?: number, flowY?: number) => {
    const def = allNodeDefs[type];
    if (!def) return;
    const data = { label: def.label, ...def.data };
    const position = { x: flowX ?? 300, y: flowY ?? 200 };
    useStore.getState().addNodeAt(type, data, position);
    setContextMenu(null);
  }, [allNodeDefs]);

  // Pane right-click (add nodes)
  const onPaneContextMenu = useCallback((e: React.MouseEvent | MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!flowRef.current) return;
    const rect = flowRef.current.getBoundingClientRect();
    setContextMenu({
      type: 'pane',
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      flowX: e.clientX - rect.left,
      flowY: e.clientY - rect.top,
    });
  }, []);

  // Node right-click (delete, copy)
  const onNodeContextMenu = useCallback((e: React.MouseEvent, node: { id: string }) => {
    e.preventDefault();
    e.stopPropagation();
    if (!flowRef.current) return;
    const rect = flowRef.current.getBoundingClientRect();
    setContextMenu({
      type: 'node',
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      flowX: e.clientX - rect.left,
      flowY: e.clientY - rect.top,
      nodeId: node.id,
    });
  }, []);

  // Selected node for properties panel
  const selectedNode = nodes.find(n => n.selected) ?? null;

  // Get property fields for selected node
  const nodeDefEntry = selectedNode ? Object.entries(allNodeDefs).find(([, d]) => d.label === selectedNode.data.label) : null;
  const propFields = nodeDefEntry?.[1].data && 'properties' in nodeDefEntry[1].data
    ? (nodeDefEntry[1].data as { properties?: { key: string; label: string; type: string; default: string }[] }).properties ?? []
    : [];

  const handlePropChange = (key: string, value: string) => {
    if (!selectedNode) return;
    updateLogicNodeData(selectedNode.id, { [key]: value });
  };

  // Import library from URL (via server proxy to avoid CORS)
  // If the URL is a GitHub repo, auto-discover all .h files and import them
  const handleImportLib = async () => {
    const url = libUrl.trim();
    if (!url) return;
    setImporting(true);
    setLibImportStatus('Working...');
    try {
      const github = parseGithubUrl(url);
      if (github) {
        // --- GitHub repo: auto-discover all .h files ---
        setLibImportStatus('Fetching repo info...');
        const headers: Record<string, string> = githubToken ? { Authorization: `Bearer ${githubToken}` } : {};

        // Get default branch
        const repoRes = await fetch(`https://api.github.com/repos/${github.owner}/${github.repo}`, { headers });
        if (!repoRes.ok) throw new Error(`GitHub API: ${repoRes.status} ${repoRes.statusText}`);
        const repoData = await repoRes.json() as { default_branch?: string };
        const branch = github.branch || repoData.default_branch || 'main';

        // List all files recursively
        setLibImportStatus(`Listing files in ${github.owner}/${github.repo} (${branch})...`);
        const treeRes = await fetch(
          `https://api.github.com/repos/${github.owner}/${github.repo}/git/trees/${branch}?recursive=1`,
          { headers },
        );
        if (!treeRes.ok) throw new Error(`GitHub API: ${treeRes.status}`);
        const treeData = await treeRes.json() as { tree: Array<{ path: string; type: string }> };
        const hPaths = treeData.tree.filter(t => t.type === 'blob' && t.path.endsWith('.h'));

        if (hPaths.length === 0) {
          setLibImportStatus('No .h header files found in this repo');
          setImporting(false);
          return;
        }

        // Fetch and parse each .h file
        setLibImportStatus(`Found ${hPaths.length} .h files, importing...`);
        const allNewNodes: Record<string, NodeDef> = {};
        for (const { path } of hPaths) {
          const rawUrl = `https://raw.githubusercontent.com/${github.owner}/${github.repo}/${branch}/${path}`;
          const proxyRes = await fetch('/api/fetch-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: rawUrl }),
          });
          const body = await proxyRes.text();
          if (!body) continue;
          let proxyData: { text?: string; error?: string };
          try { proxyData = JSON.parse(body); } catch { continue; }
          if (!proxyRes.ok || proxyData.error || !proxyData.text) continue;
          const parsed = parseCFunctions(proxyData.text);
          parsed.forEach(d => {
            const key = `lib_${d.label}`;
            if (!(key in allNodeDefs) && !(key in allNewNodes)) allNewNodes[key] = d;
          });
        }

        const count = Object.keys(allNewNodes).length;
        if (count === 0) {
          setLibImportStatus('No parsable function declarations in repo headers');
          setImporting(false);
          return;
        }
        importLibrary(url, allNewNodes);
        setLibImportStatus(`✓ ${count} functions imported from ${hPaths.length} .h files`);
        setImporting(false);
        return;
      }

      // --- Single-file import (raw URL) ---
      const res = await fetch('/api/fetch-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const body = await res.text();
      if (!body) throw new Error(`Server returned empty body (HTTP ${res.status}). Run \`npm run server\` in another terminal.`);
      let data: { text?: string; error?: string };
      try { data = JSON.parse(body); } catch { throw new Error(`Server returned HTML (HTTP ${res.status}) — ${body.slice(0, 80)}. Run \`npm run server\` in another terminal.`); }
      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`);
      const text = data.text!;
      const parsed = parseCFunctions(text);
      if (parsed.length === 0) {
        setLibImportStatus('No function declarations — URL must point to a raw .h file');
        setImporting(false);
        return;
      }
      const newNodes: Record<string, NodeDef> = {};
      parsed.forEach(d => {
        const key = `lib_${d.label}`;
        if (!(key in allNodeDefs)) newNodes[key] = d;
      });
      importLibrary(url, newNodes);
      setLibImportStatus(`✓ ${parsed.length} functions from ${url.split('/').pop()}`);
    } catch (err: unknown) {
      setLibImportStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    setImporting(false);
  };

  const handleCopyNode = () => {
    if (!contextMenu || contextMenu.type !== 'node' || !contextMenu.nodeId) return;
    const src = nodes.find(n => n.id === contextMenu.nodeId);
    if (src) {
      setCopiedNode({ type: src.type ?? 'custom', data: { ...src.data } as object });
    }
    setContextMenu(null);
  };

  const handlePasteNode = () => {
    if (!copiedNode || !contextMenu || contextMenu.type !== 'pane') return;
    useStore.getState().addNodeAt(copiedNode.type, copiedNode.data, { x: contextMenu.flowX, y: contextMenu.flowY });
    setContextMenu(null);
  };

  const handleDeleteNodeFromMenu = () => {
    if (!contextMenu || contextMenu.type !== 'node' || !contextMenu.nodeId) return;
    deleteNode(contextMenu.nodeId);
    setContextMenu(null);
  };

  return (
    <div className="logic-layout" onContextMenu={e => e.preventDefault()}>
      <div className="logic-flow-area" ref={flowRef} onClick={() => setContextMenu(null)}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          colorMode="dark"
          onNodeContextMenu={onNodeContextMenu}
          onPaneContextMenu={onPaneContextMenu}
          deleteKeyCode={['Delete', 'Backspace']}
          defaultEdgeOptions={{ type: 'custom', interactionWidth: 20 }}
        >
          <Background color="#333" gap={20} />
          <Controls />
        </ReactFlow>

        {contextMenu && (
          <div
            style={{
              position: 'absolute',
              left: contextMenu.x,
              top: contextMenu.y,
              background: '#252526',
              border: '1px solid #555',
              borderRadius: 4,
              zIndex: 1000,
              minWidth: 180,
              maxHeight: 400,
              overflowY: 'auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.type === 'pane' && (
              <>
                <div style={{ padding: '6px 10px', fontSize: '0.7rem', color: '#888', borderBottom: '1px solid #444' }}>
                  Add Node
                </div>
                {categories.map(cat => {
                  const items = Object.entries(allNodeDefs).filter(([, d]) => d.category === cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat}>
                      <div style={{ padding: '4px 10px', fontSize: '0.7rem', color: '#666', textTransform: 'uppercase' }}>
                        {cat}
                      </div>
                      {items.map(([key, def]) => (
                        <div
                          key={key}
                          style={{ padding: '6px 16px', cursor: 'pointer', fontSize: '0.8rem', color: '#ccc' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#3c3c3c')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          onClick={() => addNodeOfType(key, contextMenu.flowX, contextMenu.flowY)}
                        >
                          {def.label}
                        </div>
                      ))}
                    </div>
                  );
                })}
                {copiedNode && (
                  <>
                    <div style={{ borderTop: '1px solid #444', marginTop: 4 }} />
                    <div
                      style={{ padding: '6px 16px', cursor: 'pointer', fontSize: '0.8rem', color: '#4fc3f7', display: 'flex', alignItems: 'center', gap: 6 }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#3c3c3c')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      onClick={handlePasteNode}
                    >
                      <Clipboard size={14} /> Paste Node
                    </div>
                  </>
                )}
              </>
            )}
            {contextMenu.type === 'node' && (
              <>
                <div style={{ padding: '6px 10px', fontSize: '0.7rem', color: '#888', borderBottom: '1px solid #444' }}>
                  Node Actions
                </div>
                <div
                  style={{ padding: '6px 16px', cursor: 'pointer', fontSize: '0.8rem', color: '#ccc', display: 'flex', alignItems: 'center', gap: 6 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#3c3c3c')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  onClick={handleCopyNode}
                >
                  <Copy size={14} /> Copy Node
                </div>
                <div
                  style={{ padding: '6px 16px', cursor: 'pointer', fontSize: '0.8rem', color: '#dc3545', display: 'flex', alignItems: 'center', gap: 6 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#3c3c3c')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  onClick={handleDeleteNodeFromMenu}
                >
                  <Trash2 size={14} /> Delete Node
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <aside className="sidebar sidebar-right">
        <div className="logic-sidebar-tabs">
          <button
            className={`logic-sidebar-tab ${sidebarTab === 'nodes' ? 'active' : ''}`}
            onClick={() => setSidebarTab('nodes')}
          >
            <List size={14} /> Nodes
          </button>
          <button
            className={`logic-sidebar-tab ${sidebarTab === 'props' ? 'active' : ''}`}
            onClick={() => setSidebarTab('props')}
          >
            <Settings size={14} /> Props
          </button>
        </div>

        {sidebarTab === 'nodes' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {categories.map(cat => {
              if (cat === 'Library') return null; // rendered separately below
              const items = Object.entries(allNodeDefs).filter(([, d]) => d.category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <div className="logic-browser-category">{cat}</div>
                  {items.map(([key, def]) => (
                    <div
                      key={key}
                      className="logic-browser-item"
                      onClick={() => addNodeOfType(key)}
                    >
                      + {def.label}
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Imported libraries — grouped by source */}
            {importedLibraries.map(lib => {
              const entries = Object.entries(lib.functions);
              if (entries.length === 0) return null;
              const shortName = lib.url.split('/').pop() || lib.url.slice(0, 30);
              return (
                <div key={lib.url}>
                  <div className="logic-browser-category" title={lib.url}>
                    📦 {shortName}
                  </div>
                  {entries.map(([key, def]) => (
                    <div
                      key={key}
                      className="logic-browser-item"
                      onClick={() => addNodeOfType(key)}
                    >
                      + {def.label}
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Library import */}
            <div className="logic-import-row">
              <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: 6, textTransform: 'uppercase' }}>
                <Search size={12} /> Import Library from URL
              </div>
              <input
                type="text"
                placeholder="https://raw.githubusercontent.com/..."
                value={libUrl}
                onChange={e => setLibUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleImportLib()}
              />
              <button className="logic-import-btn" onClick={handleImportLib} disabled={importing || !libUrl.trim()}>
                {importing ? 'Importing...' : 'Import'}
              </button>
              {libImportStatus && <div className="logic-import-status">{libImportStatus}</div>}

              {/* Imported libraries list with remove */}
              {importedLibraries.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: 4, textTransform: 'uppercase' }}>
                    Imported Libraries
                  </div>
                  {importedLibraries.map(lib => {
                    const shortUrl = lib.url.length > 50 ? lib.url.slice(0, 47) + '...' : lib.url;
                    const funcCount = Object.keys(lib.functions).length;
                    return (
                      <div key={lib.url} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0', borderBottom: '1px solid #222' }}>
                        <span style={{ flex: 1, fontSize: '0.75rem', color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={lib.url}>
                          {shortUrl}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: '#666' }}>{funcCount}</span>
                        <button
                          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 2, display: 'flex' }}
                          onClick={() => removeImportedLibrary(lib.url)}
                          title="Remove this library"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {sidebarTab === 'props' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {selectedNode ? (
              <>
                <div className="logic-prop-group">
                  <label>Node</label>
                  <div style={{ color: '#4fc3f7', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                    {String(selectedNode.data.label ?? '')}
                  </div>
                </div>
                {propFields.length > 0 ? propFields.map((field: { key: string; label: string; type: string; default: string }) => (
                  <div key={field.key} className="logic-prop-group">
                    <label>{field.label}</label>
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={String((selectedNode.data as Record<string, unknown>)[field.key] ?? field.default)}
                      onChange={e => handlePropChange(field.key, e.target.value)}
                    />
                  </div>
                )) : (
                  <div className="logic-prop-group" style={{ color: '#666', fontSize: '0.8rem' }}>
                    This node has no editable properties. Configure it by connecting data pins.
                  </div>
                )}
                <div className="logic-prop-group" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <button
                    style={{
                      width: '100%', background: '#c0392b', color: 'white', border: 'none',
                      padding: '6px', borderRadius: 3, cursor: 'pointer', fontSize: '0.8rem',
                    }}
                    onClick={() => { deleteNode(selectedNode.id); }}
                  >
                    Delete Node
                  </button>
                </div>
                {/* Show pin info */}
                <div className="logic-prop-group" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <label>Inputs</label>
                  {((selectedNode.data as Record<string, unknown>).inputs as { id: string; label: string; type: string; dataType?: string }[] | undefined)?.map(inp => (
                    <div key={inp.id} style={{ fontSize: '0.75rem', color: inp.type === 'exec' ? '#ccc' : inp.dataType === 'string' ? '#ce9178' : '#4fc3f7', marginBottom: 2 }}>
                      {inp.label} ({inp.dataType ?? inp.type})
                    </div>
                  )) ?? <div style={{ fontSize: '0.75rem', color: '#666' }}>None</div>}
                </div>
                <div className="logic-prop-group">
                  <label>Outputs</label>
                  {((selectedNode.data as Record<string, unknown>).outputs as { id: string; label: string; type: string; dataType?: string }[] | undefined)?.map(out => (
                    <div key={out.id} style={{ fontSize: '0.75rem', color: out.type === 'exec' ? '#ccc' : out.dataType === 'int' ? '#4fc3f7' : '#ce9178', marginBottom: 2 }}>
                      {out.label}{out.type === 'exec' ? ' (→)' : ` (${out.dataType})`}
                    </div>
                  )) ?? <div style={{ fontSize: '0.75rem', color: '#666' }}>None</div>}
                </div>
              </>
            ) : (
              <div style={{ padding: 20, color: '#666', textAlign: 'center', fontSize: '0.8rem' }}>
                Click a node to see its properties
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
};

export default LogicEditor;
