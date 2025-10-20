/**
 * DebugPanel Component
 * Displays euler angles for both hand mesh groups (wrist orientation from camera tracking)
 */
export default function DebugPanel({
  leftHandRotation,
  rightHandRotation,
  onReset
}) {
  // Convert radians to degrees for display
  const toDegrees = (radians) => (radians * 180 / Math.PI).toFixed(1)

  return (
    <div style={{
      position: 'absolute',
      bottom: 10,
      left: 10,
      zIndex: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '13px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      minWidth: '220px'
    }}>
      <div style={{
        fontWeight: 'bold',
        marginBottom: '10px',
        fontSize: '14px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
        paddingBottom: '6px'
      }}>
        Hand Euler Angles
      </div>

      {/* Left Hand */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{
          color: '#fbbf24',
          fontWeight: '600',
          marginBottom: '4px'
        }}>
          LEFT HAND
        </div>
        <div style={{ paddingLeft: '8px', lineHeight: '1.6' }}>
          <div>X: {toDegrees(leftHandRotation.x)}°</div>
          <div>Y: {toDegrees(leftHandRotation.y)}°</div>
          <div>Z: {toDegrees(leftHandRotation.z)}°</div>
        </div>
      </div>

      {/* Right Hand */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{
          color: '#60d5f4',
          fontWeight: '600',
          marginBottom: '4px'
        }}>
          RIGHT HAND
        </div>
        <div style={{ paddingLeft: '8px', lineHeight: '1.6' }}>
          <div>X: {toDegrees(rightHandRotation.x)}°</div>
          <div>Y: {toDegrees(rightHandRotation.y)}°</div>
          <div>Z: {toDegrees(rightHandRotation.z)}°</div>
        </div>
      </div>

      {/* Reset Button - resets wrist rotation when tracking is lost */}
      <button
        onClick={onReset}
        style={{
          width: '100%',
          padding: '8px',
          backgroundColor: 'rgba(239, 68, 68, 0.9)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 1)'}
        onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.9)'}
      >
        Reset Rotation
      </button>
    </div>
  )
}
