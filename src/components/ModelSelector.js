export default function ModelSelector({ selectedModel, onModelChange, models }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      zIndex: 20,
      borderTop: '2px solid rgba(255, 255, 255, 0.2)'
    }}>
      <label style={{
        color: 'white',
        fontSize: '16px',
        fontWeight: 'bold'
      }}>
        Select Hand Model:
      </label>
      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: '2px solid white',
          borderRadius: '8px',
          cursor: 'pointer',
          minWidth: '250px'
        }}
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
      <div style={{
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '14px',
        fontStyle: 'italic'
      }}>
        Use mouse to rotate and zoom
      </div>
    </div>
  )
}
