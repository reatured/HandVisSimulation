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
  selectedHand,
  onSelectedHandChange,
  selectedLeftModel,
  selectedRightModel,
  onLeftModelChange,
  onRightModelChange,
  models,
  controlMode,
  onControlModeChange,
  onCalibrate,
  calibrationStatus
}) {
  // Get model path for the currently selected hand to determine joint availability
  const currentModelId = selectedHand === 'left' ? selectedLeftModel : selectedRightModel
  const currentModelData = models.find(m => m.id === currentModelId)
  const modelPath = currentModelData?.path || 'default'
  const jointAvailability = MODEL_JOINT_AVAILABILITY[modelPath] || MODEL_JOINT_AVAILABILITY.default

  // Get current rotation for the selected hand and joint
  const currentHandRotations = jointRotations[selectedHand] || {}
  const currentRotation = currentHandRotations[selectedJoint] || 0
  const isManualMode = controlMode === 'manual'
  const isCameraMode = controlMode === 'camera'

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

      {/* Control Mode Toggle */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          color: 'white',
          fontSize: '14px',
          display: 'block',
          marginBottom: '8px',
          fontWeight: '500'
        }}>
          Control Mode
        </label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px'
        }}>
          <button
            onClick={() => onControlModeChange('manual')}
            style={{
              padding: '12px',
              fontSize: '14px',
              backgroundColor: isManualMode
                ? 'rgba(100, 200, 100, 0.9)'
                : 'rgba(255, 255, 255, 0.15)',
              color: 'white',
              border: isManualMode ? '2px solid rgba(150, 255, 150, 1)' : '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: isManualMode ? 'bold' : '500',
              textTransform: 'uppercase'
            }}
          >
            Manual
          </button>
          <button
            onClick={() => onControlModeChange('camera')}
            style={{
              padding: '12px',
              fontSize: '14px',
              backgroundColor: isCameraMode
                ? 'rgba(100, 150, 255, 0.9)'
                : 'rgba(255, 255, 255, 0.15)',
              color: 'white',
              border: isCameraMode ? '2px solid rgba(150, 200, 255, 1)' : '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: isCameraMode ? 'bold' : '500',
              textTransform: 'uppercase'
            }}
          >
            Camera
          </button>
        </div>
      </div>

      {/* Calibration Section - Only visible in camera mode */}
      {isCameraMode && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: 'rgba(100, 150, 255, 0.1)',
          border: '1px solid rgba(100, 150, 255, 0.3)',
          borderRadius: '8px'
        }}>
          <div style={{
            color: 'white',
            fontSize: '13px',
            marginBottom: '10px',
            fontWeight: '500'
          }}>
            Calibration
          </div>
          <div style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '12px',
            marginBottom: '10px',
            lineHeight: '1.4'
          }}>
            Hold your hand in a relaxed, open position and click calibrate.
          </div>
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}>
            <button
              onClick={onCalibrate}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '13px',
                backgroundColor: 'rgba(100, 200, 100, 0.8)',
                color: 'white',
                border: '1px solid rgba(150, 255, 150, 0.5)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                textTransform: 'uppercase',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(100, 200, 100, 1)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(100, 200, 100, 0.8)'
              }}
            >
              Calibrate Now
            </button>
            <div style={{
              fontSize: '11px',
              color: calibrationStatus?.isCalibrated
                ? 'rgba(100, 255, 100, 0.9)'
                : 'rgba(255, 200, 100, 0.9)',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}>
              {calibrationStatus?.isCalibrated ? '✓ Calibrated' : '⚠ Not calibrated'}
            </div>
          </div>
        </div>
      )}

      {/* Model Selector - Dual Hands */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          color: 'white',
          fontSize: '14px',
          display: 'block',
          marginBottom: '8px',
          fontWeight: '500'
        }}>
          Select Hand Models
        </label>

        {/* Left Hand Model */}
        <div style={{ marginBottom: '10px' }}>
          <label style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '12px',
            display: 'block',
            marginBottom: '4px'
          }}>
            Left Hand
          </label>
          <select
            value={selectedLeftModel}
            onChange={(e) => onLeftModelChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '13px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {models.filter(m => m.side === 'left' || m.side === null).map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right Hand Model */}
        <div>
          <label style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '12px',
            display: 'block',
            marginBottom: '4px'
          }}>
            Right Hand
          </label>
          <select
            value={selectedRightModel}
            onChange={(e) => onRightModelChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '13px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {models.filter(m => m.side === 'right' || m.side === null).map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Joint Selector - Only in manual mode */}
      {isManualMode && (
        <div style={{ marginBottom: '20px' }}>
          {/* Hand Selector (Left/Right) */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{
              color: 'white',
              fontSize: '14px',
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500'
            }}>
              Control Which Hand
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px'
            }}>
              <button
                onClick={() => onSelectedHandChange('left')}
                style={{
                  padding: '10px',
                  fontSize: '13px',
                  backgroundColor: selectedHand === 'left'
                    ? 'rgba(255, 150, 100, 0.9)'
                    : 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  border: selectedHand === 'left' ? '2px solid rgba(255, 200, 150, 1)' : '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontWeight: selectedHand === 'left' ? 'bold' : '500',
                  textTransform: 'uppercase'
                }}
              >
                Left Hand
              </button>
              <button
                onClick={() => onSelectedHandChange('right')}
                style={{
                  padding: '10px',
                  fontSize: '13px',
                  backgroundColor: selectedHand === 'right'
                    ? 'rgba(100, 150, 255, 0.9)'
                    : 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  border: selectedHand === 'right' ? '2px solid rgba(150, 200, 255, 1)' : '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontWeight: selectedHand === 'right' ? 'bold' : '500',
                  textTransform: 'uppercase'
                }}
              >
                Right Hand
              </button>
            </div>
          </div>

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
      )}

      {/* Rotation Slider - Only in manual mode */}
      {isManualMode && (
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
      )}

      {/* Camera mode info */}
      {isCameraMode && (
        <div style={{
          padding: '15px',
          backgroundColor: 'rgba(100, 150, 255, 0.1)',
          border: '1px solid rgba(100, 150, 255, 0.3)',
          borderRadius: '8px',
          marginBottom: '10px'
        }}>
          <div style={{
            color: 'white',
            fontSize: '13px',
            marginBottom: '8px',
            fontWeight: '500'
          }}>
            Camera Tracking Active
          </div>
          <div style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '12px',
            lineHeight: '1.4'
          }}>
            Move your hand in front of the camera. The hand model will follow your movements in real-time.
          </div>
        </div>
      )}

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
