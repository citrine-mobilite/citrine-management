import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ApiSchemaViewerProps {
  schema: any;
  name?: string;
  required?: boolean;
  depth?: number;
}

export const ApiSchemaViewer: React.FC<ApiSchemaViewerProps> = ({
  schema,
  name,
  required = false,
  depth = 0,
}) => {
  const [expanded, setExpanded] = useState(depth < 2);

  if (!schema || typeof schema !== 'object') {
    return null;
  }

  const hasProperties = Boolean(schema.properties && Object.keys(schema.properties).length > 0);
  const hasArrayItems = Boolean(schema.items && typeof schema.items === 'object');
  const isExpandable = hasProperties || (hasArrayItems && (schema.items.properties || schema.items.items));

  const typeLabel = (() => {
    if (Array.isArray(schema.type)) return schema.type.join(' | ');
    if (schema.type === 'array' && schema.items?.type) {
      return `array<${schema.items.type}>`;
    }
    if (schema.format) return `${schema.type || 'string'} (${schema.format})`;
    return schema.type || (hasProperties ? 'object' : 'any');
  })();

  const requiredSet = new Set<string>(Array.isArray(schema.required) ? schema.required : []);

  return (
    <div className={depth > 0 ? 'pl-4 border-l border-stone-200' : ''}>
      <div className="flex items-start gap-2 py-1.5 text-xs">
        {isExpandable ? (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="mt-0.5 text-stone-400 hover:text-stone-700 cursor-pointer shrink-0"
            aria-label={expanded ? 'Réduire' : 'Déplier'}
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            {name && (
              <span className="font-mono font-semibold text-stone-900">
                {name}
                {required && <span className="text-red-600 ml-0.5">*</span>}
              </span>
            )}
            <span className="font-mono text-[11px] text-[#2A7B76]">{typeLabel}</span>
            {Array.isArray(schema.enum) && schema.enum.length > 0 && (
              <span className="font-mono text-[11px] text-stone-500">
                enum: [{schema.enum.map((v: any) => JSON.stringify(v)).join(', ')}]
              </span>
            )}
            {schema.example !== undefined && typeof schema.example !== 'object' && (
              <span className="font-mono text-[11px] text-stone-400 truncate max-w-xs">
                ex: {JSON.stringify(schema.example)}
              </span>
            )}
          </div>
          {schema.description && (
            <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">{schema.description}</p>
          )}
        </div>
      </div>

      {expanded && hasProperties && (
        <div className="mt-0.5 space-y-0.5">
          {Object.entries<any>(schema.properties).map(([propName, propSchema]) => (
            <ApiSchemaViewer
              key={propName}
              name={propName}
              schema={propSchema}
              required={requiredSet.has(propName)}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {expanded && !hasProperties && hasArrayItems && schema.items.properties && (
        <div className="mt-0.5 space-y-0.5">
          {Object.entries<any>(schema.items.properties).map(([propName, propSchema]) => (
            <ApiSchemaViewer
              key={propName}
              name={propName}
              schema={propSchema}
              required={
                Array.isArray(schema.items.required) && schema.items.required.includes(propName)
              }
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
