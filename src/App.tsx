import React, { useState, useEffect } from 'react';
import { Layout, GitBranch, Code, Play, GitFork, LogOut, Loader, FolderOpen, Monitor } from 'lucide-react';
import UIBuilder from './components/UIBuilder/UIBuilder';
import LogicEditor from './components/LogicEditor/LogicEditor';
import CodePreview from './components/CodePreview/CodePreview';
import ProjectsPage from './components/ProjectsPage';
import { useStore } from './store/useStore';
import type { ProjectType } from './store/useStore';
import { generateCCode } from './generator/cGenerator';
import { startOAuthFlow, exchangeCodeForToken, getAuthenticatedUser, compileOnGitHub } from './github';
import './App.css';

type ViewMode = 'UI' | 'LOGIC' | 'CODE';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('UI');
  const [compiling, setCompiling] = useState(false);
  const [compileMsg, setCompileMsg] = useState<string | null>(null);
  const [showUiLibMenu, setShowUiLibMenu] = useState(false);
  const [currentRepoName, setCurrentRepoName] = useState<string | null>(null);
  const [keepRepo, setKeepRepo] = useState(false);

  const { githubToken, githubUser, authError, setAuthError, setGithubAuth, clearGithubAuth,
          widgets, nodes, edges, openProjectId, projects, closeProject, uiLibrary, setUiLibrary } = useStore();

  const openProject = projects.find(p => p.id === openProjectId) ?? null;
  const projectType = openProject?.type as ProjectType | undefined;
  const hasUITab = uiLibrary !== 'none';

  // Clamp view to first available tab when UI tab is hidden
  if (!hasUITab && viewMode === 'UI') setViewMode('LOGIC');

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (!code) return;
    const savedState = sessionStorage.getItem('oauth_state');
    if (state !== savedState) return;
    sessionStorage.removeItem('oauth_state');
    window.history.replaceState({}, '', window.location.pathname);
    setAuthError(null);
    exchangeCodeForToken(code)
      .then(token => getAuthenticatedUser(token).then(user => setGithubAuth(token, user)))
      .catch(err => setAuthError(`Auth failed: ${err.message}`));
  }, [setGithubAuth, setAuthError]);

  const handleCompile = async () => {
    if (!githubToken || !githubUser) { setCompileMsg('Connect GitHub first.'); return; }
    setCompiling(true);
    setCompileMsg(null);
    try {
      const code = generateCCode(widgets, nodes, edges, projectType ?? 'gui', openProject?.plugin ?? 'none', uiLibrary);
      const prev = keepRepo ? undefined : currentRepoName ?? undefined;
      const { url, repoName } = await compileOnGitHub(githubToken, githubUser.login, code, openProject?.name ?? 'project', prev);
      setCurrentRepoName(repoName);
      setCompileMsg('✓ Building!');
      window.open(url, '_blank');
    } catch (err: unknown) {
      setCompileMsg(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setCompiling(false);
    }
  };

  // No open project → show projects homepage
  if (!openProjectId) return <ProjectsPage />;

  return (
    <div className="app-container">
      <header className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="icon-btn" title="Back to projects" onClick={closeProject}>
            <FolderOpen size={16} />
          </button>
          <div className="logo">
            {openProject?.name}
            <span className="project-name-badge">{openProject?.type}</span>
            <div style={{ position: 'relative' }}>
              <button
                className="icon-btn"
                style={{ fontSize: '0.7rem', color: '#888', gap: 3 }}
                onClick={() => setShowUiLibMenu(!showUiLibMenu)}
              >
                <Monitor size={12} /> {uiLibrary === 'none' ? 'none' : uiLibrary === 'raylib' ? 'Raylib' : uiLibrary === 'cimgui' ? 'cimgui' : uiLibrary.length > 18 ? uiLibrary.slice(0, 15) + '…' : uiLibrary}
              </button>
              {showUiLibMenu && (
                <div
                  style={{
                    position: 'absolute', top: '100%', left: 0, background: '#252526',
                    border: '1px solid #555', borderRadius: 4, zIndex: 1000, minWidth: 120,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  }}
                  onClick={() => setShowUiLibMenu(false)}
                >
                  {['none', 'raylib', 'cimgui'].map(lib => (
                    <div
                      key={lib}
                      style={{
                        padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem',
                        color: uiLibrary === lib ? '#4fc3f7' : '#ccc',
                        background: uiLibrary === lib ? 'rgba(79,195,247,0.1)' : 'transparent',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#3c3c3c'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = uiLibrary === lib ? 'rgba(79,195,247,0.1)' : 'transparent'; }}
                      onClick={() => setUiLibrary(lib)}
                    >
                      {lib === 'none' ? 'None (plain C)' : lib === 'raylib' ? 'Raylib' : 'cimgui (Dear ImGui)'}
                    </div>
                  ))}
                  <div
                    style={{
                      padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem',
                      color: !['none', 'raylib', 'cimgui'].includes(uiLibrary) ? '#4fc3f7' : '#ccc',
                      background: !['none', 'raylib', 'cimgui'].includes(uiLibrary) ? 'rgba(79,195,247,0.1)' : 'transparent',
                      borderTop: '1px solid #444',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#3c3c3c'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = !['none', 'raylib', 'cimgui'].includes(uiLibrary) ? 'rgba(79,195,247,0.1)' : 'transparent'; }}
                    onClick={() => {
                      const url = window.prompt('Enter UI library URL or name:', '');
                      if (url) setUiLibrary(url.trim());
                    }}
                  >
                    Custom URL…
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <nav className="view-switcher">
          {hasUITab && (
            <button className={viewMode === 'UI' ? 'active' : ''} onClick={() => setViewMode('UI')}>
              <Layout size={18} /> UI Design
            </button>
          )}
          <button className={viewMode === 'LOGIC' ? 'active' : ''} onClick={() => setViewMode('LOGIC')}>
            <GitBranch size={18} /> Logic Graph
          </button>
          <button className={viewMode === 'CODE' ? 'active' : ''} onClick={() => setViewMode('CODE')}>
            <Code size={18} /> C Code
          </button>
        </nav>
        <div className="actions">
          {(compileMsg || authError) && (
            <span style={{ fontSize: '0.8rem', color: (compileMsg ?? authError)?.startsWith('✓') ? '#28a745' : '#dc3545' }}>
              {compileMsg ?? authError}
            </span>
          )}
          {githubUser ? (
            <>
              <div className="gh-user">
                <img src={githubUser.avatar_url} alt={githubUser.login} width={24} height={24} style={{ borderRadius: '50%' }} />
                <span>{githubUser.login}</span>
              </div>
              {currentRepoName && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: '#888', cursor: 'pointer' }}>
                  <input type="checkbox" checked={keepRepo} onChange={e => setKeepRepo(e.target.checked)} style={{ accentColor: '#4fc3f7' }} />
                  Keep repo
                </label>
              )}
              <button className="run-btn" onClick={handleCompile} disabled={compiling}>
                {compiling ? <Loader size={18} className="spin" /> : <Play size={18} />}
                {compiling ? 'Pushing...' : 'Compile & Run'}
              </button>
              <button className="icon-btn" title="Disconnect GitHub" onClick={clearGithubAuth}>
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <button className="run-btn" disabled style={{ opacity: 0.5 }}>
                <Play size={18} /> Compile & Run
              </button>
              <button className="gh-connect-btn" onClick={startOAuthFlow}>
                <GitFork size={16} /> Connect GitHub
              </button>
              <button className="gh-connect-btn" style={{ background: '#333' }} onClick={async () => {
                const res = await fetch('/api/github/gh-token');
                if (!res.ok) return setAuthError('gh CLI not authenticated. Run `gh auth login` first.');
                const data = await res.json() as { access_token: string };
                getAuthenticatedUser(data.access_token).then(
                  user => setGithubAuth(data.access_token, user),
                  err => setAuthError(`gh auth failed: ${err.message}`),
                );
              }}>
                <GitFork size={16} /> Use gh CLI
              </button>
            </>
          )}
        </div>
      </header>
      <main className="main-content">
        {viewMode === 'UI' && hasUITab && <UIBuilder />}
        {viewMode === 'LOGIC' && <LogicEditor />}
        {viewMode === 'CODE' && <CodePreview />}
      </main>
    </div>
  );
};

export default App;
