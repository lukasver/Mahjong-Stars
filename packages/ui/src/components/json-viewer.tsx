'use client';

import { cn } from '@mjs/ui/lib/utils';
import { Braces, Check, ChevronDown, FileText } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;

type JsonObject = {
  [key: string]: JsonValue;
};

type JsonArray = JsonValue[];

interface JsonViewerProps {
  // Accept Prisma JsonValue type and other JSON-compatible types
  data: unknown;
  title?: string;
  defaultExpanded?: boolean;
  /**
   * When true, renders only the JSON nodes without the wrapper container.
   * Useful when you want to wrap the component yourself.
   */
  noWrapper?: boolean;
}

interface JsonNodeProps {
  nodeKey: string
  value: any
  level: number
  isTopLevel?: boolean
  variant: 'light' | 'dark'
}

const getValueType = (value: any): string => {
  if (value === null) return "null"
  if (Array.isArray(value)) return "array"
  if (typeof value === "object") return "object"
  if (typeof value === "boolean") return "boolean"
  if (typeof value === "number") return "number"
  if (typeof value === "string") return "string"
  return "unknown"
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "object":
    case "array":
      return <Braces className="w-4 h-4 flex-shrink-0" />
    case "boolean":
      return <Check className="w-4 h-4 flex-shrink-0" />
    default:
      return <FileText className="w-4 h-4 flex-shrink-0" />
  }
}

const formatValue = (value: any, type: string): string => {
  if (value === null) return "null"
  if (type === "boolean") return String(value)
  if (type === "array") return `Array(${value.length})`
  if (type === "object") return "Object"
  return String(value)
}

const colorScheme = {
  light: {
    background: "bg-white",
    border: "border-gray-200",
    text: "text-gray-900",
    textMuted: "text-gray-600",
    textSecondary: "text-gray-700",
    hoverRow: "hover:bg-gray-50",
    hoverButton: "hover:bg-gray-100",
    headerBackground: "bg-gray-100",
    headerHover: "hover:bg-gray-200",
    icon: "text-gray-500",
    borderLeft: "border-gray-300",
    empty: "text-gray-500",
  },
  dark: {
    background: "bg-slate-900",
    border: "border-slate-700",
    text: "text-slate-100",
    textMuted: "text-slate-400",
    textSecondary: "text-slate-300",
    hoverRow: "hover:bg-slate-800/50",
    hoverButton: "hover:bg-slate-700/50",
    headerBackground: "bg-slate-800",
    headerHover: "hover:bg-slate-700",
    icon: "text-slate-400",
    borderLeft: "border-slate-700",
    empty: "text-slate-500",
  },
}

const JsonNode = ({ nodeKey, value, level, isTopLevel = false, variant }: JsonNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(isTopLevel ?? false)
  const type = getValueType(value)
  const isExpandable = type === "object" || type === "array"
  const entries = isExpandable ? Object.entries(value) : []
  const colors = colorScheme[variant]

  return (
    <div>
      {/* Main row */}
      <div className={cn("flex items-center gap-3 py-2 px-3 transition-colors", colors.hoverRow)}>
        {isExpandable && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn("p-0 rounded transition-colors", colors.hoverButton)}
          >
            <ChevronDown
              className={cn("w-4 h-4 flex-shrink-0 transition-transform", {
                "rotate-0": isExpanded,
                "-rotate-90": !isExpanded,
              })}
            />
          </button>
        )}
        {!isExpandable && <div className="w-4 flex-shrink-0" />}

        {/* Icon */}
        <div className={cn("flex-shrink-0", colors.icon)}>{getTypeIcon(type)}</div>

        {/* Key */}
        <div className={cn("font-mono font-semibold min-w-fit", colors.textSecondary)}>${nodeKey}</div>

        {/* Value */}
        {!isExpandable ? (
          <div className={cn("font-mono text-sm truncate", colors.textMuted)}>{formatValue(value, type)}</div>
        ) : (
          <div className={cn("text-sm", colors.textMuted)}>{type === "array" ? `[${entries.length}]` : `{}`}</div>
        )}
      </div>

      {/* Nested entries */}
      {isExpandable && isExpanded && (
        <div className={cn("pl-6 border-l", colors.borderLeft)}>
          {entries.map(([key, val]) => (
            <JsonNode key={key} nodeKey={key} value={val} level={level + 1} variant={variant} />
          ))}
          {entries.length === 0 && <div className={cn("py-2 px-3 text-sm italic", colors.empty)}>Empty {type}</div>}
        </div>
      )}
    </div>
  )
}

export const JsonViewer = ({ data, title, defaultExpanded = false, noWrapper = false }: JsonViewerProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const { theme } = useTheme();
  const variant = theme === 'dark' ? 'dark' : 'light';
  const colors = colorScheme[variant]
  // Normalize data to an object for Object.entries
  // If data is a primitive, null, or undefined, wrap it in an object
  const normalizedData =
    data === null ||
      data === undefined ||
      typeof data === 'string' ||
      typeof data === 'number' ||
      typeof data === 'boolean' ||
      Array.isArray(data)
      ? { value: data }
      : data || {};

  const nodesContent = (
    <div className={cn("space-y-1 font-mono text-sm", !noWrapper && "p-4")}>
      {Object.entries(normalizedData).map(([key, value]) => (
        <JsonNode key={key} nodeKey={key} value={value} level={0} isTopLevel={true} variant={variant} />
      ))}
    </div>
  );

  if (noWrapper) {
    return nodesContent;
  }

  return (
    <div className={cn("rounded-lg overflow-hidden border", colors.background, colors.text, colors.border)}>
      {title && (
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex items-center gap-3 p-4 cursor-pointer transition-colors border-b",
            colors.headerBackground,
            colors.headerHover,
            colors.border,
          )}
        >
          <ChevronDown
            className={cn("w-5 h-5 transition-transform", {
              "rotate-0": isExpanded,
              "-rotate-90": !isExpanded,
            })}
          />
          <span className="font-semibold text-lg">{title}</span>
        </div>
      )}

      {isExpanded && nodesContent}
    </div>
  )
}
