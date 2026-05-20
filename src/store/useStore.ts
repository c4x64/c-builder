import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import type { Connection, Edge, EdgeChange, Node, NodeChange } from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';

export type WidgetType = 'Button' | 'Label' | 'Slider' | 'TextField';
export type ProjectType = 'gui' | 'cli' | 'library';

export interface Widget {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  name: string;
  properties: Record<string, unknown>;
}

export interface Project {
  id: string;
  name: string;
  type: string;
  plugin: string;
  uiLibrary: string;
  createdAt: number;
  widgets: Widget[];
  nodes: Node[];
  edges: Edge[];
  importedLibraries?: Array<{ url: string; functions: Record<string, { label: string; category: string; data: object }> }>;
}

const STORAGE_KEY = 'cb_projects';

const loadProjects = (): Project[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
};

const saveProjects = (projects: Project[]) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

interface AppState {
  // GitHub Auth
  githubToken: string | null;
  githubUser: { login: string; avatar_url: string } | null;
  authError: string | null;
  setAuthError: (msg: string | null) => void;
  setGithubAuth: (token: string, user: { login: string; avatar_url: string }) => void;
  clearGithubAuth: () => void;

  // Projects
  projects: Project[];
  openProjectId: string | null;
  createProject: (name: string, type: string, plugin?: string) => void;
  openProject: (id: string) => void;
  closeProject: () => void;
  deleteProject: (id: string) => void;

  // Active project editor state (derived from open project, written back on change)
  widgets: Widget[];
  selectedWidgetId: string | null;
  addWidget: (type: WidgetType, x: number, y: number) => void;
  updateWidget: (id: string, updates: Partial<Widget>) => void;
  moveWidget: (id: string, x: number, y: number) => void;
  selectWidget: (id: string | null) => void;
  deleteWidget: (id: string) => void;

  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: string, data: unknown) => void;
  addNodeAt: (type: string, data: unknown, position: { x: number; y: number }) => void;
  updateLogicNodeData: (id: string, data: Record<string, unknown>) => void;
  deleteNode: (id: string) => void;

  // Imported library functions (persisted per project, keyed by URL)
  importedLibraries: Array<{ url: string; functions: Record<string, { label: string; category: string; data: object }> }>;
  importLibrary: (url: string, functions: Record<string, { label: string; category: string; data: object }>) => void;
  removeImportedLibrary: (url: string) => void;

  // UI library (none, raylib, or custom)
  uiLibrary: string;
  setUiLibrary: (lib: string) => void;
}

// Persist active project's state back to the projects list
const persist = (projects: Project[], id: string | null, widgets: Widget[], nodes: Node[], edges: Edge[], importedLibraries?: Array<{ url: string; functions: Record<string, { label: string; category: string; data: object }> }>, uiLibrary?: string) => {
  if (!id) return projects;
  const updated = projects.map(p => p.id === id ? {
    ...p, widgets, nodes, edges,
    ...(importedLibraries !== undefined ? { importedLibraries } : {}),
    ...(uiLibrary !== undefined ? { uiLibrary } : {}),
  } : p);
  saveProjects(updated);
  return updated;
};

export const useStore = create<AppState>((set, get) => ({
  // GitHub Auth
  githubToken: localStorage.getItem('gh_token'),
  githubUser: (() => { try { return JSON.parse(localStorage.getItem('gh_user') ?? 'null'); } catch { return null; } })(),
  authError: null,
  setAuthError: (msg) => set({ authError: msg }),
  setGithubAuth: (token, user) => {
    localStorage.setItem('gh_token', token);
    localStorage.setItem('gh_user', JSON.stringify(user));
    set({ githubToken: token, githubUser: user });
  },
  clearGithubAuth: () => {
    localStorage.removeItem('gh_token');
    localStorage.removeItem('gh_user');
    set({ githubToken: null, githubUser: null });
  },

  // Projects
  projects: loadProjects(),
  openProjectId: null,
  // Editor state
  widgets: [],
  selectedWidgetId: null,
  importedLibraries: [],
  uiLibrary: 'none',

  createProject: (name, type, plugin = 'none') => {
    const project: Project = {
      id: uuidv4(), name, type, plugin, uiLibrary: type === 'gui' ? 'raylib' : 'none', createdAt: Date.now(),
      widgets: [], nodes: [], edges: [],
    };
    const projects = [...get().projects, project];
    saveProjects(projects);
    set({ projects, openProjectId: project.id, widgets: [], nodes: [], edges: [], selectedWidgetId: null, importedLibraries: [], uiLibrary: project.uiLibrary });
  },
  openProject: (id) => {
    const project = get().projects.find(p => p.id === id);
    if (!project) return;
    const libs = project.importedLibraries ?? [];
    // backward compat: migrate old single-record format
    const oldLibs = (project as unknown as Record<string, unknown>).importedLibs as Record<string, { label: string; category: string; data: object }> | undefined;
    if (libs.length === 0 && oldLibs && Object.keys(oldLibs).length > 0) {
      libs.push({ url: 'legacy', functions: oldLibs });
    }
    set({
      openProjectId: id, widgets: project.widgets, nodes: project.nodes, edges: project.edges,
      selectedWidgetId: null, importedLibraries: libs, uiLibrary: project.uiLibrary ?? (project.type === 'gui' ? 'raylib' : 'none'),
    });
  },
  closeProject: () => {
    const { openProjectId, projects, widgets, nodes, edges, importedLibraries, uiLibrary } = get();
    const updated = persist(projects, openProjectId, widgets, nodes, edges, importedLibraries, uiLibrary);
    set({ openProjectId: null, projects: updated, widgets: [], nodes: [], edges: [], selectedWidgetId: null, importedLibraries: [], uiLibrary: 'none' });
  },
  deleteProject: (id) => {
    const projects = get().projects.filter(p => p.id !== id);
    saveProjects(projects);
    const wasOpen = get().openProjectId === id;
    set({ projects, ...(wasOpen ? { openProjectId: null, widgets: [], nodes: [], edges: [], importedLibraries: [], uiLibrary: 'none' } : {}) });
  },

  addWidget: (type, x, y) => {
    const id = uuidv4();
    const w: Widget = { id, type, x, y, name: `${type.toLowerCase()}_${id.slice(0, 4)}`, properties: { text: type, width: 100, height: 40, color: '#007bff' } };
    const widgets = [...get().widgets, w];
    const projects = persist(get().projects, get().openProjectId, widgets, get().nodes, get().edges);
    set({ widgets, projects });
  },
  updateWidget: (id, updates) => {
    const widgets = get().widgets.map(w => w.id === id ? { ...w, ...updates } : w);
    const projects = persist(get().projects, get().openProjectId, widgets, get().nodes, get().edges);
    set({ widgets, projects });
  },
  moveWidget: (id, x, y) => {
    const widgets = get().widgets.map(w => w.id === id ? { ...w, x, y } : w);
    const projects = persist(get().projects, get().openProjectId, widgets, get().nodes, get().edges);
    set({ widgets, projects });
  },
  selectWidget: (id) => set({ selectedWidgetId: id }),
  deleteWidget: (id) => {
    const widgets = get().widgets.filter(w => w.id !== id);
    const projects = persist(get().projects, get().openProjectId, widgets, get().nodes, get().edges);
    set({ widgets, projects, selectedWidgetId: get().selectedWidgetId === id ? null : get().selectedWidgetId });
  },

  nodes: [],
  edges: [],
  onNodesChange: (changes) => {
    const nodes = applyNodeChanges(changes, get().nodes);
    const projects = persist(get().projects, get().openProjectId, get().widgets, nodes, get().edges);
    set({ nodes, projects });
  },
  onEdgesChange: (changes) => {
    const edges = applyEdgeChanges(changes, get().edges);
    const projects = persist(get().projects, get().openProjectId, get().widgets, get().nodes, edges);
    set({ edges, projects });
  },
  onConnect: (connection) => {
    const edges = addEdge(connection, get().edges);
    const projects = persist(get().projects, get().openProjectId, get().widgets, get().nodes, edges);
    set({ edges, projects });
  },
  addNode: (type, data) => {
    const id = uuidv4();
    const nodes = [...get().nodes, { id, type, position: { x: 100, y: 100 }, data } as Node];
    const projects = persist(get().projects, get().openProjectId, get().widgets, nodes, get().edges);
    set({ nodes, projects });
  },
  addNodeAt: (type, data, position) => {
    const id = uuidv4();
    const nodes = [...get().nodes, { id, type, position, data } as Node];
    const projects = persist(get().projects, get().openProjectId, get().widgets, nodes, get().edges);
    set({ nodes, projects });
  },
  updateLogicNodeData: (id, data) => {
    const nodes = get().nodes.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n);
    const projects = persist(get().projects, get().openProjectId, get().widgets, nodes, get().edges);
    set({ nodes, projects });
  },
  deleteNode: (id) => {
    const nodes = get().nodes.filter(n => n.id !== id);
    const edges = get().edges.filter(e => e.source !== id && e.target !== id);
    const projects = persist(get().projects, get().openProjectId, get().widgets, nodes, edges);
    set({ nodes, edges, projects });
  },
  importLibrary: (url, functions) => {
    const libs = [...get().importedLibraries];
    const existing = libs.findIndex(l => l.url === url);
    if (existing >= 0) {
      libs[existing] = { url, functions: { ...libs[existing].functions, ...functions } };
    } else {
      libs.push({ url, functions });
    }
    const projects = persist(get().projects, get().openProjectId, get().widgets, get().nodes, get().edges, libs);
    set({ importedLibraries: libs, projects });
  },
  removeImportedLibrary: (url) => {
    const libs = get().importedLibraries.filter(l => l.url !== url);
    const projects = persist(get().projects, get().openProjectId, get().widgets, get().nodes, get().edges, libs);
    set({ importedLibraries: libs, projects });
  },
  setUiLibrary: (lib) => {
    const projects = persist(get().projects, get().openProjectId, get().widgets, get().nodes, get().edges, undefined, lib);
    set({ uiLibrary: lib, projects });
  },
}));
