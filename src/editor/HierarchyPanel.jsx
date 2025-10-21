import React, { useState } from 'react'
import { ChevronRight, ChevronDown, Box, Cylinder, Globe } from 'lucide-react'
import { ScrollArea } from '../components/ui/scroll-area'
import { cn } from '../lib/utils'

/**
 * Get icon for object type
 */
const getObjectIcon = (type) => {
  switch (type) {
    case 'Mesh':
      return <Box className="w-3 h-3" />
    case 'Group':
      return <Globe className="w-3 h-3" />
    case 'AxesHelper':
    case 'GridHelper':
      return <Cylinder className="w-3 h-3" />
    default:
      return <Box className="w-3 h-3" />
  }
}

/**
 * TreeNode Component - Recursive tree item
 */
const TreeNode = ({ node, selectedObject, onSelectObject, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2) // Auto-expand first 2 levels
  const hasChildren = node.children && node.children.length > 0
  const isSelected = selectedObject?.uuid === node.uuid

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-panel-muted/50 transition-colors text-[11px]",
          isSelected && "bg-primary/20 border-l-2 border-primary"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => onSelectObject(node.object)}
      >
        {/* Expand/Collapse Icon */}
        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
              className="hover:bg-panel-muted/80 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-panel-muted-foreground" />
              ) : (
                <ChevronRight className="w-3 h-3 text-panel-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="w-3 h-3" />
          )}
        </div>

        {/* Object Icon */}
        <div className="flex-shrink-0 text-panel-muted-foreground">
          {getObjectIcon(node.type)}
        </div>

        {/* Object Name */}
        <div className="flex-1 truncate">
          <span className={cn(
            "text-panel-foreground",
            isSelected && "font-semibold"
          )}>
            {node.name}
          </span>
          <span className="text-panel-muted-foreground ml-1 text-[9px]">
            ({node.type})
          </span>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.uuid}
              node={child}
              selectedObject={selectedObject}
              onSelectObject={onSelectObject}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * HierarchyPanel Component
 * Displays scene hierarchy as a tree view
 */
export default function HierarchyPanel({ sceneGraph, selectedObject, onSelectObject }) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-panel-border">
        <h3 className="text-xs font-semibold text-panel-foreground">Scene Hierarchy</h3>
        <p className="text-[9px] text-panel-muted-foreground mt-0.5">
          Click to select and outline objects
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-1">
          {sceneGraph && sceneGraph.length > 0 ? (
            sceneGraph.map((node) => (
              <TreeNode
                key={node.uuid}
                node={node}
                selectedObject={selectedObject}
                onSelectObject={onSelectObject}
                level={0}
              />
            ))
          ) : (
            <div className="px-3 py-4 text-center text-[10px] text-panel-muted-foreground">
              No objects in scene
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
