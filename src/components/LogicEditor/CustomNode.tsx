import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';

export type CustomNodeData = {
  label: string;
  type?: 'event' | 'function' | 'variable';
  inputs?: { id: string; type: 'exec' | 'data'; label: string; dataType?: string }[];
  outputs?: { id: string; type: 'exec' | 'data'; label: string; dataType?: string }[];
};

const CustomNode = ({ data, selected }: NodeProps<Node<CustomNodeData>>) => {
  return (
    <div className={`node-base ${data.type || 'function'}${selected ? ' selected' : ''}`}>
      <div className="node-header">
        {data.label}
      </div>
      <div className="node-body">
        <div className="node-inputs">
          {data.inputs?.map((input) => (
            <div key={input.id} className="pin-row input">
              <Handle
                type="target"
                position={Position.Left}
                id={input.id}
                className={`pin ${input.type} ${input.dataType || ''}`}
              />
              <span className="pin-label">{input.label}</span>
            </div>
          ))}
        </div>
        <div className="node-outputs">
          {data.outputs?.map((output) => (
            <div key={output.id} className="pin-row output">
              <span className="pin-label">{output.label}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={output.id}
                className={`pin ${output.type} ${output.dataType || ''}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(CustomNode);
