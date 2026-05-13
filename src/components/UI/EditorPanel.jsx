import { useState, useEffect } from 'react';
import useTwinStore from '../../store/useTwinStore';
import './OverlayPanel.css';

/**
 * 编辑器属性面板 - 选中设备后显示精确位置/旋转/缩放输入
 */
export default function EditorPanel() {
  const appMode = useTwinStore((s) => s.appMode);
  const selectedObject = useTwinStore((s) => s.selectedObject);
  const layoutOverrides = useTwinStore((s) => s.layoutOverrides);
  const updateLayout = useTwinStore((s) => s.updateLayout);

  if (appMode !== 'editor' || !selectedObject) return null;

  const override = layoutOverrides[selectedObject] || {};

  return (
    <div className="panel panel-editor-props">
      <div className="panel-header">
        <h3>属性 - {selectedObject}</h3>
      </div>

      <PropRow
        label="位置 (X, Y, Z)"
        values={override.position || [0, 0, 0]}
        onChange={(vals) => updateLayout(selectedObject, { position: vals })}
      />
      <PropRow
        label="旋转 (X, Y, Z)"
        values={override.rotation || [0, 0, 0]}
        step={0.1}
        onChange={(vals) => updateLayout(selectedObject, { rotation: vals })}
      />
      <PropRowSingle
        label="缩放"
        value={override.scale ?? 1}
        step={0.1}
        onChange={(val) => updateLayout(selectedObject, { scale: val })}
      />

      <div style={{ marginTop: 12, fontSize: 11, color: '#555', lineHeight: 1.5 }}>
        提示: 拖拽3D控制器或在此输入精确值<br />
        W=移动 E=旋转 R=缩放 Esc=取消选择
      </div>
    </div>
  );
}

function PropRow({ label, values, step = 1, onChange }) {
  const [local, setLocal] = useState(values);

  useEffect(() => {
    setLocal(values);
  }, [values[0], values[1], values[2]]);

  const handleChange = (idx, raw) => {
    const next = [...local];
    next[idx] = raw;
    setLocal(next);
  };

  const handleBlur = () => {
    const parsed = local.map((v) => {
      const n = parseFloat(v);
      return isNaN(n) ? 0 : Math.round(n * 100) / 100;
    });
    onChange(parsed);
  };

  const labels = ['X', 'Y', 'Z'];

  return (
    <div className="editor-prop-group">
      <label>{label}</label>
      <div className="editor-prop-inputs">
        {local.map((v, i) => (
          <div key={i} style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 4, top: 4, fontSize: 9, color: '#555' }}>{labels[i]}</span>
            <input
              type="number"
              step={step}
              value={typeof v === 'number' ? v : v}
              onChange={(e) => handleChange(i, e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
              style={{ paddingLeft: 16 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function PropRowSingle({ label, value, step = 1, onChange }) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleBlur = () => {
    const n = parseFloat(local);
    onChange(isNaN(n) ? 1 : Math.round(n * 100) / 100);
  };

  return (
    <div className="editor-prop-group">
      <label>{label}</label>
      <div className="editor-prop-inputs">
        <input
          type="number"
          step={step}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
        />
      </div>
    </div>
  );
}
