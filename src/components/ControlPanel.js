import { memo } from 'react'

// Joint Button Component - defined outside to prevent recreation on every render
const JointButton = memo(({ jointName, label, isAvailable, selectedJoint, onSelectedJointChange }) => {
  const isSelected = selectedJoint === jointName
  const isDisabled = !isAvailable

  return (
    <button
      onClick={() => {
        if (!isDisabled) {
          onSelectedJointChange(jointName)
        }
      }}
      disabled={isDisabled}
      style={{
        padding: '8px 4px',
        fontSize: '11px',
        backgroundColor: isSelected
          ? 'rgba(100, 150, 255, 0.9)'
          : isDisabled
          ? 'rgba(80, 80, 80, 0.3)'
          : 'rgba(255, 255, 255, 0.15)',
        color: isDisabled ? 'rgba(255, 255, 255, 0.3)' : 'white',
        border: isSelected ? '2px solid rgba(150, 200, 255, 1)' : '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '4px',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        fontWeight: isSelected ? 'bold' : 'normal',
        textTransform: 'uppercase',
        opacity: isDisabled ? 0.5 : 1,
        pointerEvents: isDisabled ? 'none' : 'auto'
      }}
    >
      {label}
    </button>
  )
})

JointButton.displayName = 'JointButton'

// Define which joints are available for each model
const MODEL_JOINT_AVAILABILITY = {
  ability_hand: {
    wrist: true,
    thumb_mcp: true,
    thumb_pip: true,
    thumb_dip: false,
    thumb_tip: false,
    index_mcp: true,
    index_pip: true,
    index_dip: false,
    index_tip: false,
    middle_mcp: true,
    middle_pip: true,
    middle_dip: false,
    middle_tip: false,
    ring_mcp: true,
    ring_pip: true,
    ring_dip: false,
    ring_tip: false,
    pinky_mcp: true,
    pinky_pip: true,
    pinky_dip: false,
    pinky_tip: false,
  },
  // Default: all joints disabled for unimplemented models
  default: {
    wrist: false,
    thumb_mcp: false, thumb_pip: false, thumb_dip: false, thumb_tip: false,
    index_mcp: false, index_pip: false, index_dip: false, index_tip: false,
    middle_mcp: false, middle_pip: false, middle_dip: false, middle_tip: false,
    ring_mcp: false, ring_pip: false, ring_dip: false, ring_tip: false,
    pinky_mcp: false, pinky_pip: false, pinky_dip: false, pinky_tip: false,
  }
}

export default function ControlPanel({
  jointRotations,
  selectedJoint,
  onSelectedJointChange,
  onJointRotationChange,
  selectedModel,
  onModelChange,
  models
}) {
  // Get model path to determine joint availability
  const currentModelData = models.find(m => m.id === selectedModel)
  const modelPath = currentModelData?.path || 'default'
  const jointAvailability = MODEL_JOINT_AVAILABILITY[modelPath] || MODEL_JOINT_AVAILABILITY.default

  const currentRotation = jointRotations[selectedJoint] || 0

  const fingers = [
    { name: 'thumb', label: 'Thumb' },
    { name: 'index', label: 'Index' },
    { name: 'middle', label: 'Middle' },
    { name: 'ring', label: 'Ring' },
    { name: 'pinky', label: 'Pinky' }
  ]
  // Reversed order: fingertip (TIP) at top, base (MCP) at bottom
  const segments = ['tip', 'dip', 'pip', 'mcp']

  return (
    <div style={{
      position: 'absolute',
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      padding: '20px',
      minWidth: '380px',
      maxWidth: '450px',
      zIndex: 20,
      borderLeft: '2px solid rgba(255, 255, 255, 0.2)',
      borderTop: '2px solid rgba(255, 255, 255, 0.2)',
      borderTopLeftRadius: '12px',
      maxHeight: '90vh',
      overflowY: 'auto'
    }}>
      <div style={{
        color: 'white',
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '20px'
      }}>
        Hand Controls
      </div>

      {/* Model Selector */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          color: 'white',
          fontSize: '14px',
          display: 'block',
          marginBottom: '8px',
          fontWeight: '500'
        }}>
          Select Hand Model
        </label>
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '14px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>

      {/* Joint Selector */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          color: 'white',
          fontSize: '14px',
          display: 'block',
          marginBottom: '12px',
          fontWeight: '500'
        }}>
          Select Joint to Control
        </label>

        {/* 5 Fingers Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '6px',
          marginBottom: '10px'
        }}>
          {fingers.map(finger => (
            <div key={finger.name} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              {/* Finger Label */}
              <div style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '10px',
                textAlign: 'center',
                marginBottom: '2px',
                fontWeight: '500'
              }}>
                {finger.label}
              </div>

              {/* 4 Joint Buttons per finger */}
              {segments.map(segment => {
                const jointName = `${finger.name}_${segment}`
                return (
                  <JointButton
                    key={jointName}
                    jointName={jointName}
                    label={segment}
                    isAvailable={jointAvailability[jointName]}
                    selectedJoint={selectedJoint}
                    onSelectedJointChange={onSelectedJointChange}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* Wrist Button */}
        <button
          onClick={() => {
            if (jointAvailability.wrist) {
              onSelectedJointChange('wrist')
            }
          }}
          disabled={!jointAvailability.wrist}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            backgroundColor: selectedJoint === 'wrist'
              ? 'rgba(100, 150, 255, 0.9)'
              : jointAvailability.wrist
              ? 'rgba(255, 255, 255, 0.15)'
              : 'rgba(80, 80, 80, 0.3)',
            color: !jointAvailability.wrist ? 'rgba(255, 255, 255, 0.3)' : 'white',
            border: selectedJoint === 'wrist' ? '2px solid rgba(150, 200, 255, 1)' : '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '6px',
            cursor: jointAvailability.wrist ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            fontWeight: selectedJoint === 'wrist' ? 'bold' : '500',
            textTransform: 'uppercase',
            opacity: !jointAvailability.wrist ? 0.5 : 1,
            pointerEvents: !jointAvailability.wrist ? 'none' : 'auto'
          }}
        >
          Wrist
        </button>
      </div>

      {/* Rotation Slider */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{
          color: 'white',
          fontSize: '14px',
          display: 'block',
          marginBottom: '8px',
          fontWeight: '500'
        }}>
          {selectedJoint.replace('_', ' ').toUpperCase()} Rotation: {currentRotation.toFixed(2)} rad
        </label>
        <input
          type="range"
          min="-1.5"
          max="1.5"
          step="0.01"
          value={currentRotation}
          onChange={(e) => onJointRotationChange(parseFloat(e.target.value))}
          disabled={!jointAvailability[selectedJoint]}
          style={{
            width: '100%',
            cursor: jointAvailability[selectedJoint] ? 'pointer' : 'not-allowed',
            opacity: jointAvailability[selectedJoint] ? 1 : 0.5
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '12px',
          marginTop: '4px'
        }}>
          <span>-1.5</span>
          <span>0</span>
          <span>1.5</span>
        </div>
      </div>

      {/* Helper text */}
      <div style={{
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: '12px',
        fontStyle: 'italic',
        marginTop: '15px',
        paddingTop: '15px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        Use mouse to rotate and zoom the 3D view
      </div>
    </div>
  )
}
