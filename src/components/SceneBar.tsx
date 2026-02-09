interface SceneBarProps {
  scenes: { id: string; name: string }[];
  currentIndex: number;
  transitioning: boolean;
  onGoToScene: (index: number) => void;
  onAddScene: () => void;
  onDeleteScene: (index: number) => void;
  onDuplicateScene: () => void;
}

export function SceneBar({
  scenes,
  currentIndex,
  transitioning,
  onGoToScene,
  onAddScene,
  onDeleteScene,
  onDuplicateScene,
}: SceneBarProps) {
  return (
    <div className={`page-sidebar ${transitioning ? "transitioning" : ""}`}>
      <div className="page-sidebar-header">
        <span className="page-sidebar-title">Pages</span>
        <span className="page-count">{scenes.length}</span>
      </div>

      <div className="page-list">
        {scenes.map((scene, i) => (
          <button
            key={scene.id}
            className={`page-thumb ${i === currentIndex ? "active" : ""}`}
            onClick={() => onGoToScene(i)}
            title={scene.name}
          >
            <span className="page-number">{i + 1}</span>
          </button>
        ))}

        <button
          className="page-thumb page-add"
          onClick={onAddScene}
          title="New page (Ctrl+M)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      <div className="page-sidebar-actions">
        <button
          className="page-action-btn"
          onClick={onDuplicateScene}
          title="Duplicate current page"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        </button>
        {scenes.length > 1 && (
          <button
            className="page-action-btn page-delete"
            onClick={() => onDeleteScene(currentIndex)}
            title="Delete current page"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
