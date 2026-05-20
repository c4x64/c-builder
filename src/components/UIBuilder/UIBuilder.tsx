import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import type { WidgetType } from '../../store/useStore';
import { MousePointer2, Type, Square, Sliders, Trash2 } from 'lucide-react';

const GRID = 10;
const snap = (v: number) => Math.round(v / GRID) * GRID;
const strProp = (v: unknown, fallback = '') => typeof v === 'string' ? v : fallback;
const numProp = (v: unknown, fallback = 0) => typeof v === 'number' ? v : fallback;

const WIDGET_ICONS: Record<WidgetType, React.ReactNode> = {
  Button: <MousePointer2 size={12} />,
  Label: <Type size={12} />,
  TextField: <Square size={12} />,
  Slider: <Sliders size={12} />,
};

const DRAG_THRESHOLD = 4;

const UIBuilder: React.FC = () => {
  const { widgets, addWidget, selectedWidgetId, selectWidget, updateWidget, moveWidget, deleteWidget } = useStore();
  const dragState = useRef<{
    id: string; startX: number; startY: number; offX: number; offY: number; active: boolean;
  } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Delete selected widget on Delete/Backspace key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedWidgetId) {
        // Don't delete when typing in an input
        if ((e.target as HTMLElement).tagName === 'INPUT') return;
        deleteWidget(selectedWidgetId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedWidgetId, deleteWidget]);

  const handleDragStartToolbox = (e: React.DragEvent, type: WidgetType) => {
    e.dataTransfer.setData('widgetType', type);
  };

  const handleDropCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('widgetType') as WidgetType;
    if (type && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = snap(e.clientX - rect.left);
      const y = snap(e.clientY - rect.top);
      addWidget(type, x, y);
    }
  };

  const handleDragOverCanvas = (e: React.DragEvent) => e.preventDefault();

  const onMouseDownWidget = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    selectWidget(id);
    const widget = widgets.find(w => w.id === id);
    if (widget) {
      dragState.current = {
        id,
        startX: e.clientX,
        startY: e.clientY,
        offX: e.clientX - widget.x,
        offY: e.clientY - widget.y,
        active: false,
      };
    }
  };

  const onMouseMoveCanvas = (e: React.MouseEvent) => {
    const ds = dragState.current;
    if (!ds) return;
    if (!ds.active) {
      const dx = e.clientX - ds.startX;
      const dy = e.clientY - ds.startY;
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      ds.active = true;
      setDraggingId(ds.id);
    }
    moveWidget(ds.id, snap(e.clientX - ds.offX), snap(e.clientY - ds.offY));
  };

  const onMouseUpCanvas = () => {
    dragState.current = null;
    setDraggingId(null);
  };

  // Only deselect when clicking the canvas background directly (not after a drag)
  const onCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) selectWidget(null);
  };

  const selectedWidget = widgets.find(w => w.id === selectedWidgetId);

  return (
    <div className="builder-layout">
      <aside className="sidebar">
        <h3>Toolbox</h3>
        {(['Button', 'Label', 'TextField', 'Slider'] as WidgetType[]).map(type => (
          <div key={type} className="widget-item" draggable onDragStart={(e) => handleDragStartToolbox(e, type)}>
            {WIDGET_ICONS[type]} {type}
          </div>
        ))}
      </aside>

      <section className="canvas-area">
        <div
          ref={canvasRef}
          className="ui-canvas"
          onDrop={handleDropCanvas}
          onDragOver={handleDragOverCanvas}
          onMouseMove={onMouseMoveCanvas}
          onMouseUp={onMouseUpCanvas}
          onMouseLeave={onMouseUpCanvas}
          onClick={onCanvasClick}
        >
          {widgets.map((widget) => (
            <div
              key={widget.id}
              title={`${widget.type}: ${widget.name}`}
              style={{
                position: 'absolute',
                left: widget.x,
                top: widget.y,
                width: widget.properties.width as number || 100,
                height: widget.properties.height as number || 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: widget.type === 'Slider' ? 'stretch' : 'center',
                gap: 4,
                border: widget.id === selectedWidgetId ? '2px solid #00ff00' : '1px solid #555',
                backgroundColor: widget.type === 'Button' ? widget.properties.color as string : widget.type === 'Slider' ? 'transparent' : '#333',
                color: 'white',
                borderRadius: widget.type === 'Slider' ? 0 : '2px',
                cursor: draggingId === widget.id ? 'grabbing' : 'pointer',
                userSelect: 'none',
                fontSize: '12px',
                boxShadow: widget.id === selectedWidgetId ? '0 0 10px rgba(0,255,0,0.3)' : 'none',
                padding: widget.type === 'Slider' ? '0 4px' : 0,
              }}
              onMouseDown={(e) => onMouseDownWidget(e, widget.id)}
            >
              {widget.type === 'Slider' ? (
                <input
                  type="range"
                  min={widget.properties.min as number ?? 0}
                  max={widget.properties.max as number ?? 100}
                  defaultValue={50}
                  style={{ width: '100%', pointerEvents: 'none' }}
                  tabIndex={-1}
                />
              ) : (
                <>{WIDGET_ICONS[widget.type]}{widget.properties.text as string || widget.name}</>
              )}
            </div>
          ))}
        </div>
      </section>

      <aside className="sidebar sidebar-right">
        <h3>Properties</h3>
        {selectedWidget ? (
          <div style={{ padding: '16px' }}>
            <div className="prop-field">
              <label>Type</label>
              <div style={{ color: '#aaa', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                {WIDGET_ICONS[selectedWidget.type]} {selectedWidget.type}
              </div>
            </div>
            <div className="prop-field">
              <label>Name (ID)</label>
              <input
                type="text"
                value={selectedWidget.name}
                onChange={(e) => updateWidget(selectedWidget.id, { name: e.target.value })}
              />
            </div>
            <div className="prop-field">
              <label>Text Content</label>
              <input
                type="text"
                value={strProp(selectedWidget.properties.text)}
                onChange={(e) => updateWidget(selectedWidget.id, {
                  properties: { ...selectedWidget.properties, text: e.target.value }
                })}
              />
            </div>
            <div className="prop-field">
              <label>X</label>
              <input
                type="number"
                value={selectedWidget.x}
                onChange={(e) => updateWidget(selectedWidget.id, { x: snap(parseInt(e.target.value) || 0) })}
              />
            </div>
            <div className="prop-field">
              <label>Y</label>
              <input
                type="number"
                value={selectedWidget.y}
                onChange={(e) => updateWidget(selectedWidget.id, { y: snap(parseInt(e.target.value) || 0) })}
              />
            </div>
            <div className="prop-field">
              <label>Width</label>
              <input
                type="number"
                value={numProp(selectedWidget.properties.width)}
                onChange={(e) => updateWidget(selectedWidget.id, {
                  properties: { ...selectedWidget.properties, width: parseInt(e.target.value) }
                })}
              />
            </div>
            <div className="prop-field">
              <label>Height</label>
              <input
                type="number"
                value={numProp(selectedWidget.properties.height)}
                onChange={(e) => updateWidget(selectedWidget.id, {
                  properties: { ...selectedWidget.properties, height: parseInt(e.target.value) }
                })}
              />
            </div>
            {selectedWidget.type === 'Button' && (
              <div className="prop-field">
                <label>Button Color</label>
                <input
                  type="color"
                  value={strProp(selectedWidget.properties.color, '#007bff')}
                  onChange={(e) => updateWidget(selectedWidget.id, {
                    properties: { ...selectedWidget.properties, color: e.target.value }
                  })}
                />
              </div>
            )}
            {selectedWidget.type === 'Slider' && (
              <>
                <div className="prop-field">
                  <label>Min Value</label>
                  <input
                    type="number"
                    value={numProp(selectedWidget.properties.min)}
                    onChange={(e) => updateWidget(selectedWidget.id, {
                      properties: { ...selectedWidget.properties, min: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div className="prop-field">
                  <label>Max Value</label>
                  <input
                    type="number"
                    value={numProp(selectedWidget.properties.max, 100)}
                    onChange={(e) => updateWidget(selectedWidget.id, {
                      properties: { ...selectedWidget.properties, max: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </>
            )}
            <button
              onClick={() => deleteWidget(selectedWidget.id)}
              style={{
                marginTop: 12,
                width: '100%',
                background: '#8b0000',
                color: 'white',
                border: 'none',
                padding: '8px',
                borderRadius: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Trash2 size={14} /> Delete Widget
            </button>
          </div>
        ) : (
          <div style={{ padding: '20px', color: '#666', textAlign: 'center' }}>
            Click a widget to select<br />
            <span style={{ fontSize: '0.75rem', marginTop: 8, display: 'block' }}>
              Del key to delete selected
            </span>
          </div>
        )}
      </aside>
    </div>
  );
};

export default UIBuilder;
