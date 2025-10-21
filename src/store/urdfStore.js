import { create } from 'zustand'

const useURDFStore = create((set, get) => ({
  // Model information
  urdfModel: null,
  selectedLink: null,

  // Joints data
  joints: [],

  // Transform data
  transform: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 }
  },

  // Links count
  linksCount: 0,

  // Actions
  setUrdfModel: (model) => set({ urdfModel: model }),

  setSelectedLink: (link) => set({ selectedLink: link }),

  updateJointValue: (jointName, value) => set((state) => ({
    joints: state.joints.map(joint =>
      joint.name === jointName
        ? { ...joint, value }
        : joint
    )
  })),

  setJoints: (joints) => set({ joints }),

  setTransform: (transform) => set({ transform }),

  setLinksCount: (count) => set({ linksCount: count }),

  // Load complete model data
  loadModel: (modelData) => set({
    urdfModel: modelData.urdfModel || null,
    joints: modelData.joints || [],
    transform: modelData.transform || {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 }
    },
    linksCount: modelData.linksCount || 0,
    selectedLink: null
  }),

  // Reset store
  reset: () => set({
    urdfModel: null,
    selectedLink: null,
    joints: [],
    transform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 }
    },
    linksCount: 0
  }),

  // Focus on model (trigger external action)
  triggerFocusModel: null,
  setFocusModelCallback: (callback) => set({ triggerFocusModel: callback })
}))

export default useURDFStore
