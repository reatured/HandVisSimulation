import { useThree } from '@react-three/fiber'
import { useEffect, useState } from 'react'

/**
 * Custom hook to traverse and collect all 3D objects from the scene
 * Returns a hierarchical structure of all objects for display in hierarchy panel
 */
export function useSceneGraph() {
  const { scene } = useThree()
  const [sceneGraph, setSceneGraph] = useState([])

  useEffect(() => {
    if (!scene) return

    // Function to recursively build scene graph
    const buildSceneGraph = (object, depth = 0) => {
      const node = {
        uuid: object.uuid,
        name: object.name || object.type || 'Unnamed',
        type: object.type,
        object: object,
        depth: depth,
        children: []
      }

      // Recursively process children
      if (object.children && object.children.length > 0) {
        node.children = object.children.map(child => buildSceneGraph(child, depth + 1))
      }

      return node
    }

    // Build the scene graph starting from scene root
    const graph = buildSceneGraph(scene)
    setSceneGraph([graph])

  }, [scene])

  return sceneGraph
}

/**
 * Flatten the hierarchical scene graph into a flat list for easier rendering
 */
export function flattenSceneGraph(nodes, result = []) {
  nodes.forEach(node => {
    result.push(node)
    if (node.children && node.children.length > 0) {
      flattenSceneGraph(node.children, result)
    }
  })
  return result
}
