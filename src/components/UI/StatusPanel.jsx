import React from 'react';
import useTwinStore from '../../store/useTwinStore';
import './OverlayPanel.css';

export default function StatusPanel() {
  const connected = useTwinStore((s) => s.connected);
  const deviceData = useTwinStore((s) => s.deviceData);
  const modelsLoadedCount = useTwinStore((s) => s.modelsLoadedCount);
  const modelsTotalCount = useTwinStore((s) => s.modelsTotalCount);
  const appMode = useTwinStore((s) => s.appMode);

  const deviceCount = Object.keys(deviceData).length;
  const warningCount = Object.values(deviceData).filter(
    (d) => d.status === 'warning' || d.status === 'critical'
  ).length;

  const allLoaded = modelsTotalCount > 0 && modelsLoadedCount >= modelsTotalCount;

  return (
    <div className="panel panel-status">
      <h3>CloudTwin</h3>
      {appMode === 'editor' && (
        <div className="status-row" style={{ color: '#ffab40' }}>
          <span>🔧</span>
          <span>编辑器模式</span>
        </div>
      )}
      <div className="status-row">
        <span>模型:</span>
        <span>{allLoaded ? `✓ 已加载 (${modelsLoadedCount})` : `加载中 ${modelsLoadedCount}/${modelsTotalCount}`}</span>
      </div>
      <div className="status-row">
        <span className={`status-dot ${connected ? 'online' : 'offline'}`} />
        <span>{connected ? '数据已连接' : '数据未连接'}</span>
      </div>
      {deviceCount > 0 && (
        <div className="status-row">
          <span>设备数:</span>
          <span>{deviceCount}</span>
        </div>
      )}
      {warningCount > 0 && (
        <div className="status-row warning">
          <span>告警:</span>
          <span>{warningCount}</span>
        </div>
      )}
    </div>
  );
}
