import React, { useState } from 'react';
import { Monitor, Terminal, Library, Plus, Trash2, FolderOpen, GitFork } from 'lucide-react';
import { useStore } from '../store/useStore';
import { startOAuthFlow } from '../github';

const PROJECT_TYPES = [
  { id: 'gui',     icon: <Monitor size={22} />,   label: 'GUI Application', desc: 'Desktop window with Raylib' },
  { id: 'cli',     icon: <Terminal size={22} />,  label: 'CLI Application', desc: 'Command-line tool' },
  { id: 'library', icon: <Library size={22} />,   label: 'C Library',       desc: 'Reusable .h/.c library' },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  gui: <Monitor size={16} />, cli: <Terminal size={16} />,
  library: <Library size={16} />,
};

const ProjectsPage: React.FC = () => {
  const { projects, createProject, openProject, deleteProject, githubUser, authError, setAuthError } = useStore();
  const [name, setName] = useState('my_project');
  const [type, setType] = useState<string | null>(null);

  const handleCreate = () => {
    if (!type || !name.trim()) return;
    createProject(name.trim(), type, 'none');
  };

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div className="projects-logo">C-Builder</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {authError && (
            <span style={{ fontSize: '0.8rem', color: '#dc3545', cursor: 'pointer' }} onClick={() => setAuthError(null)}>
              {authError} ✕
            </span>
          )}
          {!githubUser && (
            <button className="gh-connect-btn" onClick={startOAuthFlow}>
              <GitFork size={15} /> Connect GitHub
            </button>
          )}
          {githubUser && (
            <div className="gh-user">
              <img src={githubUser.avatar_url} width={24} height={24} style={{ borderRadius: '50%' }} />
              <span>{githubUser.login}</span>
            </div>
          )}
        </div>
      </div>

      <div className="projects-body">
        {/* Left: project list */}
        <div className="projects-list-panel">
          <div className="panel-title">Recent Projects</div>
          {projects.length === 0 && (
            <div className="projects-empty">No projects yet. Create one →</div>
          )}
          {projects.slice().sort((a, b) => b.createdAt - a.createdAt).map(p => (
            <div key={p.id} className="project-row">
              <button className="project-row-open" onClick={() => openProject(p.id)}>
                <span className="project-row-icon">{TYPE_ICONS[p.type] ?? <FolderOpen size={16} />}</span>
                <div className="project-row-info">
                  <span className="project-row-name">{p.name}</span>
                  <span className="project-row-meta">{p.type}{p.plugin && p.plugin !== 'none' ? ` · ${p.plugin}` : ''} · {new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
              </button>
              <button className="project-row-delete" title="Delete" onClick={() => deleteProject(p.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Right: new project form */}
        <div className="projects-new-panel">
          <div className="panel-title">New Project</div>
          <div className="project-type-grid">
            {PROJECT_TYPES.map(pt => (
              <button
                key={pt.id}
                className={`project-type-card ${type === pt.id ? 'selected' : ''}`}
                onClick={() => setType(pt.id)}
              >
                <div className="ptc-icon">{pt.icon}</div>
                <div className="ptc-label">{pt.label}</div>
                <div className="ptc-desc">{pt.desc}</div>
              </button>
            ))}
          </div>

          <div className="project-name-row">
            <label>Project name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value.replace(/\s+/g, '_'))}
              spellCheck={false}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <button
            className="welcome-create-btn"
            disabled={!type || !name.trim()}
            onClick={handleCreate}
          >
            <Plus size={16} /> Create Project
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;
