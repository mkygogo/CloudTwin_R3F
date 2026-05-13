import { useEffect, useState } from 'react';
import useTwinStore from '../../store/useTwinStore';
import './OverlayPanel.css';

/**
 * 场景选择器 - 左下角场景列表面板
 */
export default function SceneSelector() {
  const sceneList = useTwinStore((s) => s.sceneList);
  const currentSceneId = useTwinStore((s) => s.currentSceneId);
  const fetchSceneList = useTwinStore((s) => s.fetchSceneList);
  const loadScene = useTwinStore((s) => s.loadScene);
  const scenesLoading = useTwinStore((s) => s.scenesLoading);
  const appMode = useTwinStore((s) => s.appMode);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchSceneList();
  }, []);

  // 自动加载第一个场景
  useEffect(() => {
    if (sceneList.length > 0 && !currentSceneId) {
      const firstWithFile = sceneList.find((s) => s.file);
      if (firstWithFile) loadScene(firstWithFile.id);
    }
  }, [sceneList]);

  return (
    <div className={`panel panel-scenes ${expanded ? 'expanded' : ''}`}>
      <div
        className="scenes-header"
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: 'pointer' }}
      >
        <h3>
          🗺 场景
          {currentSceneId && (
            <span className="current-scene-badge">
              {sceneList.find((s) => s.id === currentSceneId)?.name || currentSceneId}
            </span>
          )}
        </h3>
        <span className="scenes-toggle">{expanded ? '▼' : '▶'}</span>
      </div>

      {expanded && (
        <div className="scenes-list">
          {scenesLoading && <div className="scene-empty">加载中...</div>}
          {!scenesLoading && sceneList.length === 0 && (
            <div className="scene-empty">暂无场景</div>
          )}
          {sceneList.map((scene) => (
            <div
              key={scene.id}
              className={`scene-item ${currentSceneId === scene.id ? 'active' : ''}`}
              onClick={() => loadScene(scene.id)}
            >
              <div className="scene-item-name">{scene.name}</div>
              {scene.description && (
                <div className="scene-item-desc">{scene.description}</div>
              )}
              <div className="scene-item-meta">
                {scene.createdAt}
                {currentSceneId === scene.id && <span className="scene-active-tag">当前</span>}
              </div>
            </div>
          ))}

          {appMode === 'editor' && <SaveSceneButton />}
        </div>
      )}
    </div>
  );
}

function SaveSceneButton() {
  const saveSceneToCloud = useTwinStore((s) => s.saveSceneToCloud);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleSave = async () => {
    if (!name.trim()) return;
    await saveSceneToCloud(name.trim(), desc.trim());
    setShowForm(false);
    setName('');
    setDesc('');
  };

  if (!showForm) {
    return (
      <button className="scene-save-btn" onClick={() => setShowForm(true)}>
        + 保存当前布局为新场景
      </button>
    );
  }

  return (
    <div className="scene-save-form">
      <input
        type="text"
        placeholder="场景名称"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        autoFocus
      />
      <input
        type="text"
        placeholder="描述 (可选)"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
      />
      <div className="scene-save-actions">
        <button onClick={handleSave}>保存</button>
        <button onClick={() => setShowForm(false)}>取消</button>
      </div>
    </div>
  );
}
