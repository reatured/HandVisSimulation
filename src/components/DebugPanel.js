import { useEffect, useRef } from 'react'

// MediaPipe Hand Landmark names
const LANDMARK_NAMES = [
  'WRIST',
  'THUMB_CMC', 'THUMB_MCP', 'THUMB_IP', 'THUMB_TIP',
  'INDEX_FINGER_MCP', 'INDEX_FINGER_PIP', 'INDEX_FINGER_DIP', 'INDEX_FINGER_TIP',
  'MIDDLE_FINGER_MCP', 'MIDDLE_FINGER_PIP', 'MIDDLE_FINGER_DIP', 'MIDDLE_FINGER_TIP',
  'RING_FINGER_MCP', 'RING_FINGER_PIP', 'RING_FINGER_DIP', 'RING_FINGER_TIP',
  'PINKY_MCP', 'PINKY_PIP', 'PINKY_DIP', 'PINKY_TIP'
]

// Individual hand debug window component
function HandDebugWindow({ handIndex, landmarks, handedness, leftOffset }) {
  const scrollRef = useRef(null)

  // Auto-scroll to bottom when data updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [landmarks])

  const handLabel = handedness?.label || 'Unknown'
  const handScore = handedness?.score || 0
  const hasData = landmarks && landmarks.length > 0

  return (
    <div style={{
      position: 'absolute',
      left: leftOffset,
      bottom: 20,
      width: '350px',
      maxHeight: '80vh',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      border: '2px solid #00ff00',
      borderRadius: '8px',
      color: '#00ff00',
      fontFamily: 'monospace',
      fontSize: '11px',
      zIndex: 100,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #00ff00',
        backgroundColor: 'rgba(0, 255, 0, 0.1)',
        fontWeight: 'bold',
        fontSize: '12px'
      }}>
        Hand {handIndex + 1}: {handLabel} {hasData && `(${(handScore * 100).toFixed(1)}%)`}
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 12px'
        }}
      >
        {!hasData ? (
          <div style={{ color: '#ffaa00', fontStyle: 'italic' }}>
            No hand detected
          </div>
        ) : (
          <>
            {/* Landmarks */}
            {landmarks.map((landmark, idx) => (
              <div key={idx} style={{
                marginBottom: '4px',
                paddingLeft: '8px',
                lineHeight: '1.4'
              }}>
                <div style={{ color: '#ffff00' }}>
                  [{idx}] {LANDMARK_NAMES[idx]}
                </div>
                <div style={{ paddingLeft: '12px', color: '#00ff00' }}>
                  x: {landmark.x.toFixed(4)} |
                  y: {landmark.y.toFixed(4)} |
                  z: {landmark.z.toFixed(4)}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer with stats */}
      {hasData && (
        <div style={{
          padding: '6px 12px',
          borderTop: '1px solid #00ff00',
          backgroundColor: 'rgba(0, 255, 0, 0.1)',
          fontSize: '10px',
          color: '#00ff00'
        }}>
          Landmarks: {landmarks.length} | Position data only (no rotation)
        </div>
      )}
    </div>
  )
}

export default function DebugPanel({ handTrackingData }) {
  const hasData = handTrackingData && handTrackingData.multiHandLandmarks && handTrackingData.multiHandLandmarks.length > 0

  // Get hand data for each hand (max 2 hands)
  const hand1 = hasData ? handTrackingData.multiHandLandmarks[0] : null
  const hand2 = hasData && handTrackingData.multiHandLandmarks.length > 1 ? handTrackingData.multiHandLandmarks[1] : null

  const hand1edness = hasData ? handTrackingData.multiHandedness?.[0] : null
  const hand2edness = hasData && handTrackingData.multiHandLandmarks.length > 1 ? handTrackingData.multiHandedness?.[1] : null

  return (
    <>
      {/* Hand 1 Panel - Always visible on the left */}
      <HandDebugWindow
        handIndex={0}
        landmarks={hand1}
        handedness={hand1edness}
        leftOffset={20}
      />

      {/* Hand 2 Panel - Only visible when second hand detected, positioned to the right of Hand 1 */}
      {hand2 && (
        <HandDebugWindow
          handIndex={1}
          landmarks={hand2}
          handedness={hand2edness}
          leftOffset={390}
        />
      )}
    </>
  )
}
