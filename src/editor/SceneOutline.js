import { Select, Outlines } from '@react-three/drei'
import { useEffect } from 'react'

/**
 * SceneOutline Component
 * Wraps the scene content and adds outline effect to selected objects
 */
export function SceneOutline({ children, selectedObject, onSelect }) {
  return (
    <Select
      multiple={false}
      box={false}
      onChange={(selected) => {
        // When user clicks on an object in the 3D scene
        if (selected.length > 0) {
          onSelect?.(selected[0])
        } else {
          onSelect?.(null)
        }
      }}
    >
      {children}
    </Select>
  )
}

/**
 * SelectableObject Component
 * Wraps individual objects to make them selectable with outline
 */
export function SelectableObject({ children, object, isSelected }) {
  return (
    <group>
      {children}
      {isSelected && <Outlines thickness={0.05} color="blue" />}
    </group>
  )
}
