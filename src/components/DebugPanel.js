import { useState, useEffect } from 'react'

/**
 * DebugPanel Component
 * Displays euler angles and joint rotations for selected hand (wrist orientation from camera tracking)
 */
export default function DebugPanel({
  leftHandRotation,
  rightHandRotation,
  jointRotations,
  onReset,
  onClose
}) {
  // State for selected hand
  const [selectedHand, setSelectedHand] = useState('left')

  // Convert radians to degrees for display
  const toDegrees = (radians) => (radians * 180 / Math.PI).toFixed(1)

  // Format rotation value (1 decimal place)
  const formatRad = (value) => (value || 0).toFixed(1)

  // Get current hand data
  const currentHandRotation = selectedHand === 'left' ? leftHandRotation : rightHandRotation

  // Handle both formats:
  // 1. Camera mode: { left: { joints: {...}, wristOrientation: {...} }, right: {...} }
  // 2. Manual mode: { left: { wrist: {...}, thumb_mcp: {...}, ... }, right: {...} }
  const handData = jointRotations?.[selectedHand] || {}
  const currentJointRotations = handData.joints || handData

  // Debug logging when joint rotations change
  useEffect(() => {
    console.log('DebugPanel - jointRotations updated:', jointRotations)
    console.log('DebugPanel - selectedHand:', selectedHand)
    console.log('DebugPanel - handData:', handData)
    console.log('DebugPanel - currentJointRotations:', currentJointRotations)
    if (currentJointRotations.thumb_mcp) {
      console.log('DebugPanel - Sample thumb_mcp:', currentJointRotations.thumb_mcp)
    }
  }, [jointRotations, selectedHand])

  // Finger names and segments
  const fingers = ['thumb', 'index', 'middle', 'ring', 'pinky']
  const segments = ['mcp', 'pip', 'dip', 'tip']

  return (
    <div style={{
      position: 'absolute',
      bottom: 10,
      left: 10,
      zIndex: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      color: 'white',
      padding: '6px 8px',
      borderRadius: '6px',
      fontFamily: 'monospace',
      fontSize: '10px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      minWidth: '600px',
      maxHeight: '90vh',
      overflowY: 'auto'
    }}>
      {/* Hand Selection Toggle and Close Button */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '6px',
        alignItems: 'center'
      }}>
        <button
          onClick={() => setSelectedHand('left')}
          style={{
            flex: 1,
            padding: '4px 8px',
            fontSize: '10px',
            backgroundColor: selectedHand === 'left'
              ? 'rgba(251, 191, 36, 0.9)'
              : 'rgba(255, 255, 255, 0.15)',
            color: 'white',
            border: selectedHand === 'left'
              ? '2px solid rgba(251, 191, 36, 1)'
              : '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '3px',
            cursor: 'pointer',
            fontWeight: selectedHand === 'left' ? 'bold' : 'normal',
            fontFamily: 'monospace'
          }}
        >
          LEFT
        </button>
        <button
          onClick={() => setSelectedHand('right')}
          style={{
            flex: 1,
            padding: '4px 8px',
            fontSize: '10px',
            backgroundColor: selectedHand === 'right'
              ? 'rgba(96, 213, 244, 0.9)'
              : 'rgba(255, 255, 255, 0.15)',
            color: 'white',
            border: selectedHand === 'right'
              ? '2px solid rgba(96, 213, 244, 1)'
              : '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '3px',
            cursor: 'pointer',
            fontWeight: selectedHand === 'right' ? 'bold' : 'normal',
            fontFamily: 'monospace'
          }}
        >
          RIGHT
        </button>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            color: 'white',
            border: '1px solid rgba(255, 100, 100, 0.5)',
            borderRadius: '3px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontFamily: 'monospace'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 1)'
            e.currentTarget.style.borderColor = 'rgba(255, 100, 100, 0.8)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.8)'
            e.currentTarget.style.borderColor = 'rgba(255, 100, 100, 0.5)'
          }}
        >
          ✕
        </button>
      </div>

      {/* Joint Rotations Grid */}
      <div style={{
        fontWeight: 'bold',
        marginBottom: '4px',
        fontSize: '11px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
        paddingBottom: '2px'
      }}>
        Joint Rotations (rad)
      </div>

      {/* Grid Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '9px'
        }}>
          <thead>
            <tr>
              <th style={{
                padding: '2px',
                textAlign: 'left',
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '8px'
              }}></th>
              {fingers.map(finger => (
                <th key={finger} style={{
                  padding: '2px',
                  textAlign: 'center',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: 'bold',
                  fontSize: '9px',
                  textTransform: 'uppercase'
                }}>
                  {finger}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {segments.map(segment => {
              const segmentUpper = segment.toUpperCase()
              return (
                <tr key={segment}>
                  <td style={{
                    padding: '2px',
                    fontWeight: 'bold',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '8px',
                    borderRight: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    {segmentUpper}
                  </td>
                  {fingers.map(finger => {
                    const jointName = `${finger}_${segment}`
                    const jointValue = currentJointRotations[jointName]

                    // Handle both formats:
                    // Camera mode: number (just pitch/curl angle)
                    // Manual mode: object with {pitch, yaw, roll}
                    let jointData
                    if (typeof jointValue === 'number') {
                      // Camera mode: single number is the pitch/curl
                      jointData = { pitch: jointValue, yaw: 0, roll: 0 }
                    } else if (typeof jointValue === 'object' && jointValue !== null) {
                      // Manual mode: already has pitch, yaw, roll
                      jointData = jointValue
                    } else {
                      // Fallback
                      jointData = { pitch: 0, yaw: 0, roll: 0 }
                    }

                    return (
                      <td key={jointName} style={{
                        padding: '2px',
                        textAlign: 'center',
                        borderLeft: finger !== 'thumb' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                        lineHeight: '1.3'
                      }}>
                        <div style={{ color: '#ff6b6b' }}>P:{formatRad(jointData.pitch)}</div>
                        <div style={{ color: '#4ecdc4' }}>Y:{formatRad(jointData.yaw)}</div>
                        <div style={{ color: '#ffe66d' }}>R:{formatRad(jointData.roll)}</div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Wrist Orientation */}
      <div style={{
        marginTop: '6px',
        paddingTop: '4px',
        borderTop: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          fontWeight: 'bold',
          marginBottom: '2px',
          fontSize: '9px',
          color: 'rgba(255, 255, 255, 0.9)'
        }}>
          WRIST ORIENTATION
        </div>
        <div style={{ paddingLeft: '4px', lineHeight: '1.3', fontSize: '9px' }}>
          {(() => {
            // Wrist orientation is stored separately in camera mode (as Euler angles)
            const wristOrientation = currentHandRotation || { x: 0, y: 0, z: 0 }

            // Show wrist orientation (Euler angles) - this is what actually updates in camera mode
            return (
              <>
                <span style={{ color: '#ff6b6b' }}>X:{formatRad(wristOrientation.x)}</span>
                {' '}
                <span style={{ color: '#4ecdc4' }}>Y:{formatRad(wristOrientation.y)}</span>
                {' '}
                <span style={{ color: '#ffe66d' }}>Z:{formatRad(wristOrientation.z)}</span>
              </>
            )
          })()}
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={onReset}
        style={{
          width: '100%',
          padding: '4px',
          backgroundColor: 'rgba(239, 68, 68, 0.9)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '3px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '10px',
          fontFamily: 'monospace',
          marginTop: '6px'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 1)'}
        onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.9)'}
      >
        Reset Rotation
      </button>
    </div>
  )
}
