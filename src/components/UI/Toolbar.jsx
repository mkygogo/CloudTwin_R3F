import React, { useRef } from 'react';
import useTwinStore from '../../store/useTwinStore';
import { startMockData, stopMockData } from '../../utils/mockData';
import './OverlayPanel.css';

const TRANSFORM_MODES = [
  { key: 'translate', label: '移动 (W)' },
  { key: 'rotate',    label: '旋转 (E)' },
  { key: 'scale',     label: '缩放 (R)' },
];

export default function Toolbar() {
  const appMode = useTwinStore((s) => s.appMode);
  const setAppMode = useTwinStore((s) => s.setAppMode);
  const transformMode = useTwinStore((s) => s.transformMode);
  const setTransformMode = useTwinStore((s) => s.setTransformMode);
  const connected = useTwinStore((s) => s.connected);
  const exportLayout = useTwinStore((s) => s.exportLayout);
  const importLayout = useTwinStore((s) => s.importLayout);
  const selectedObject = useTwinStore((s) => s.selectedObject);
  const fileInputRef = useRef();

  const isEditor = appMode === 'editor';

  // 快捷键
  React.useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'w' || e.key === 'W') setTransformMode('translate');
      if (e.key === 'e' || e.key === 'E') setTransformMode('rotate');
      if (e.key === 'r' || e.key === 'R') setTransformMode('scale');
      if (e.key === 'Escape') useTwinStore.getState().setSelectedObject(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        importLayout(data);
      } catch {
        alert('布局文件格式错误');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="panel panel-toolbar">
      {/* 模式切换 */}
      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${!isEditor ? 'active' : ''}`}
          onClick={() => setAppMode('viewer')}
        >
          👁 查看
        </button>
        <button
          className={`toolbar-btn ${isEditor ? 'active editor-active' : ''}`}
          onClick={() => setAppMode('editor')}
        >
          🔧 编辑
        </button>
      </div>

      {/* 编辑器工具 */}
      {isEditor && (
        <>
          <div className="toolbar-divider" />
          <div className="toolbar-group">
            {TRANSFORM_MODES.map((m) => (
              <button
                key={m.key}
                className={`toolbar-btn ${transformMode === m.key ? 'active' : ''}`}
                onClick={() => setTransformMode(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="toolbar-divider" />
          <div className="toolbar-group">
            <button className="toolbar-btn" onClick={exportLayout}>
              📥 导出布局
            </button>
            <button className="toolbar-btn" onClick={() => fileInputRef.current?.click()}>
              📤 导入布局
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </div>
          {selectedObject && (
            <>
              <div className="toolbar-divider" />
              <div className="toolbar-group">
                <span className="toolbar-label" style={{ color: '#00d4ff' }}>
                  选中: {selectedObject}
                </span>
              </div>
            </>
          )}
        </>
      )}

      {/* 查看模式工具 */}
      {!isEditor && (
        <>
          <div className="toolbar-divider" />
          <div className="toolbar-group">
            <button
              className="toolbar-btn mock-btn"
              onClick={() => (connected ? stopMockData() : startMockData())}
            >
              {connected ? '⏹ 停止模拟' : '▶ 模拟数据'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
