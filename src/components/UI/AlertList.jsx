import React from 'react';
import useTwinStore from '../../store/useTwinStore';
import './OverlayPanel.css';

/**
 * 告警通知列表
 */
export default function AlertList() {
  const alerts = useTwinStore((s) => s.alerts);
  const dismissAlert = useTwinStore((s) => s.dismissAlert);

  if (alerts.length === 0) return null;

  return (
    <div className="panel panel-alerts">
      <h3>告警 ({alerts.length})</h3>
      <div className="alert-list">
        {alerts.slice(0, 8).map((alert) => (
          <div key={alert.id} className={`alert-item alert-${alert.level}`}>
            <div className="alert-msg">{alert.message}</div>
            <div className="alert-meta">
              <span>{alert.ts?.slice(11, 19)}</span>
              <button onClick={() => dismissAlert(alert.id)}>忽略</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
