import { useState, useEffect } from 'react'
import { landmarksToRotations3D } from '../utils/positionToRotation'

/**
 * DebugPanel Component
 * Displays 3-axis rotation data (pitch, yaw, roll) converted from hand landmark positions
 */
export default function DebugPanel({
  onReset,
  onClose,
  handTrackingData // Raw landmark position data from MediaPipe
}) {
  // State for selected hand
  const [selectedHand, setSelectedHand] = useState('left')

  // State to persist last valid rotation data
  const [lastValidRotations, setLastValidRotations] = useState(null)

  // Convert radians to degrees and format (1 decimal place)
  const formatDeg = (radians) => ((radians || 0) * 180 / Math.PI).toFixed(1)

  // Convert position data to 3-axis rotations using the new converter
  const convertedRotations3D = (() => {
    if (!handTrackingData || !handTrackingData.multiHandLandmarks) {
      return null
    }

    // Find the landmarks for the selected hand
    let selectedLandmarks = null
    let selectedHandedness = null

    handTrackingData.multiHandLandmarks.forEach((landmarks, index) => {
      const handedness = handTrackingData.multiHandedness?.[index]?.label || 'Right'
      const isLeft = handedness === 'Left'
      const isRight = handedness === 'Right'

      if ((selectedHand === 'left' && isLeft) || (selectedHand === 'right' && isRight)) {
        selectedLandmarks = landmarks
        selectedHandedness = handedness
      }
    })

    if (!selectedLandmarks) {
      return null
    }

    // Convert landmarks to 3-axis rotations
    return landmarksToRotations3D(selectedLandmarks, selectedHandedness)
  })()

  // Update last valid rotations when new valid data is available
  useEffect(() => {
    if (convertedRotations3D) {
      setLastValidRotations(convertedRotations3D)
    }
  }, [convertedRotations3D])

  // Finger names and segments
  const fingers = ['thumb', 'index', 'middle', 'ring', 'pinky']
  const segments = ['tip', 'dip', 'pip', 'mcp']

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

      {/* 3-Axis Rotation Data - Main Display */}
      {/* Joint Rotations Grid */}
      <div style={{
        fontWeight: 'bold',
        marginBottom: '4px',
        fontSize: '11px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
        paddingBottom: '2px'
      }}>
        Joint Rotations (deg) - 3-Axis Data
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
                        const jointData = lastValidRotations?.[jointName] || { pitch: 0, yaw: 0, roll: 0 }

                        return (
                          <td key={jointName} style={{
                            padding: '2px',
                            textAlign: 'center',
                            borderLeft: finger !== 'thumb' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                            lineHeight: '1.3'
                          }}>
                            <div style={{ color: '#ff6b6b' }}>P:{formatDeg(jointData.pitch)}</div>
                            <div style={{ color: '#4ecdc4' }}>Y:{formatDeg(jointData.yaw)}</div>
                            <div style={{ color: '#ffe66d' }}>R:{formatDeg(jointData.roll)}</div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Wrist Data */}
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
              WRIST
            </div>
            <div style={{ paddingLeft: '4px', lineHeight: '1.3', fontSize: '9px' }}>
              {(() => {
                const wristData = lastValidRotations?.wrist || { pitch: 0, yaw: 0, roll: 0 }
                return (
                  <>
                    <span style={{ color: '#ff6b6b' }}>P:{formatDeg(wristData.pitch)}</span>
                    {' '}
                    <span style={{ color: '#4ecdc4' }}>Y:{formatDeg(wristData.yaw)}</span>
                    {' '}
                    <span style={{ color: '#ffe66d' }}>R:{formatDeg(wristData.roll)}</span>
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
