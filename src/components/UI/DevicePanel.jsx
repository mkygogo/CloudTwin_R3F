import useTwinStore from '../../store/useTwinStore';
import './OverlayPanel.css';

/**
 * 右侧设备详情面板 - 选中设备后显示详细数据
 */
export default function DevicePanel() {
  const selectedObject = useTwinStore((s) => s.selectedObject);
  const deviceData = useTwinStore((s) => s.deviceData);
  const setSelectedObject = useTwinStore((s) => s.setSelectedObject);

  if (!selectedObject) return null;

  const data = deviceData[selectedObject];

  return (
    <div className="panel panel-device">
      <div className="panel-header">
        <h3>{selectedObject}</h3>
        <button className="panel-close" onClick={() => setSelectedObject(null)}>
          ✕
        </button>
      </div>
      {data ? (
        <div className="device-data-grid">
          {Object.entries(data)
            .filter(([k]) => !k.startsWith('_'))
            .map(([key, val]) => (
              <div key={key} className="device-data-item">
                <label>{key}</label>
                <span className={key === 'status' && val !== 'normal' ? 'text-warning' : ''}>
                  {typeof val === 'number' ? val.toFixed(2) : String(val)}
                </span>
              </div>
            ))}
        </div>
      ) : (
        <p className="no-data">暂无绑定数据</p>
      )}
    </div>
  );
}
