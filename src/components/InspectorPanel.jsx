import React, { useState, memo } from 'react'
import { RotateCw, Move, Box, Focus, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { Card } from './ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import { ScrollArea } from './ui/scroll-area'
import { Slider } from './ui/slider'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { cn } from '../lib/utils'
import ModelSelectorModal from './ModelSelectorModal'

// Joint Button Component
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
      className={cn(
        "px-1 py-1.5 text-[9px] font-normal uppercase rounded transition-all",
        isSelected && "font-bold border-2",
        isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
        !isDisabled && !isSelected && "border",
        isSelected
          ? "bg-panel-primary text-panel-primary-foreground border-panel-primary"
          : isDisabled
          ? "bg-panel-muted/30 text-panel-muted-foreground border-muted"
          : "bg-secondary/20 text-panel-foreground border-border hover:bg-secondary/40"
      )}
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
    thumb_mcp: true, thumb_pip: true, thumb_dip: false, thumb_tip: false,
    index_mcp: true, index_pip: true, index_dip: false, index_tip: false,
    middle_mcp: true, middle_pip: true, middle_dip: false, middle_tip: false,
    ring_mcp: true, ring_pip: true, ring_dip: false, ring_tip: false,
    pinky_mcp: true, pinky_pip: true, pinky_dip: false, pinky_tip: false,
  },
  default: {
    wrist: false,
    thumb_mcp: false, thumb_pip: false, thumb_dip: false, thumb_tip: false,
    index_mcp: false, index_pip: false, index_dip: false, index_tip: false,
    middle_mcp: false, middle_pip: false, middle_dip: false, middle_tip: false,
    ring_mcp: false, ring_pip: false, ring_dip: false, ring_tip: false,
    pinky_mcp: false, pinky_pip: false, pinky_dip: false, pinky_tip: false,
  }
}

const InspectorPanel = ({
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
  calibrationStatus,
  showGimbals,
  onShowGimbalsChange,
  enableCameraPosition,
  onEnableCameraPositionChange,
  swapHandControls,
  onSwapHandControlsChange,
  showAxes,
  onShowAxesChange,
  leftHandZRotation,
  rightHandZRotation,
  onLeftHandRotateZ,
  onRightHandRotateZ,
  showDebugLabels,
  onShowDebugLabelsChange,
  disableWristRotation,
  onDisableWristRotationChange,
  mirrorMode,
  onMirrorModeChange,
  onApplyMetalMaterial
}) => {
  // Collapsible section states (all open by default)
  const [controlsOpen, setControlsOpen] = useState(true)
  const [jointsOpen, setJointsOpen] = useState(true)
  const [displayOpen, setDisplayOpen] = useState(true)

  // State for modal visibility
  const [isLeftModalOpen, setIsLeftModalOpen] = useState(false)
  const [isRightModalOpen, setIsRightModalOpen] = useState(false)

  // Get model path for the currently selected hand to determine joint availability
  const currentModelId = selectedHand === 'left' ? selectedLeftModel : selectedRightModel
  const currentModelData = models.find(m => m.id === currentModelId)
  const modelPath = currentModelData?.path || 'default'
  const jointAvailability = MODEL_JOINT_AVAILABILITY[modelPath] || MODEL_JOINT_AVAILABILITY.default

  // Get current rotation for the selected hand and joint
  const currentHandRotations = jointRotations[selectedHand] || {}
  const joints = currentHandRotations.joints || currentHandRotations
  const currentRotation = joints[selectedJoint] || 0
  const isManualMode = controlMode === 'manual'
  const isCameraMode = controlMode === 'camera'

  const fingers = [
    { name: 'thumb', label: 'Thumb' },
    { name: 'index', label: 'Index' },
    { name: 'middle', label: 'Middle' },
    { name: 'ring', label: 'Ring' },
    { name: 'pinky', label: 'Pinky' }
  ]
  const segments = ['tip', 'dip', 'pip', 'mcp']

  return (
    <div className="fixed right-0 bottom-0 top-0 w-80 bg-panel border-l border-panel-border flex flex-col z-20">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-panel-border shrink-0">
        <h2 className="text-base font-semibold text-panel-foreground">Hand Controls</h2>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {/* Controls Section */}
          <Collapsible open={controlsOpen} onOpenChange={setControlsOpen}>
            <Card className="bg-panel-muted/50 border-panel-border hover:border-panel-border/60 transition-colors">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-2 cursor-pointer">
                  <div className="flex items-center gap-1.5">
                    <Move className="w-4 h-4 text-panel-muted-foreground" />
                    <span className="text-sm font-medium text-panel-foreground">Controls</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-panel-muted-foreground transition-transform",
                      controlsOpen && "transform rotate-180"
                    )}
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-2 pb-2 space-y-2">
                  {/* Control Mode Toggle */}
                  <div>
                    <label className="text-xs font-medium text-panel-foreground block mb-1">
                      Control Mode
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button
                        variant={isManualMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => onControlModeChange('manual')}
                        className="text-xs uppercase"
                      >
                        Manual
                      </Button>
                      <Button
                        variant={isCameraMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => onControlModeChange('camera')}
                        className="text-xs uppercase"
                      >
                        Camera
                      </Button>
                    </div>
                  </div>

                  {/* Calibration - Camera mode only */}
                  {isCameraMode && (
                    <div className="p-2 bg-primary/10 border border-primary/30 rounded">
                      <div className="text-[11px] font-medium text-panel-foreground mb-1.5">
                        Calibration
                      </div>
                      <div className="text-[10px] text-panel-muted-foreground mb-1 leading-tight">
                        Hold hand relaxed, open position and click calibrate.
                      </div>
                      <div className="flex gap-2 items-center">
                        <Button
                          onClick={onCalibrate}
                          size="sm"
                          className="flex-1 text-[11px] h-7"
                        >
                          Calibrate
                        </Button>
                        <div className="text-[10px] font-medium">
                          {calibrationStatus?.isCalibrated ? '✓' : '⚠'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Model Selector */}
                  <div>
                    <label className="text-xs font-medium text-panel-foreground block mb-1">
                      Hand Models
                    </label>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] text-panel-muted-foreground block mb-1">
                          Left
                        </label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsLeftModalOpen(true)}
                          className="w-full justify-between text-xs h-8"
                        >
                          <span className="truncate">
                            {models.find(m => m.id === selectedLeftModel)?.name || 'Select'}
                          </span>
                          <span>▼</span>
                        </Button>
                      </div>
                      <div>
                        <label className="text-[10px] text-panel-muted-foreground block mb-1">
                          Right
                        </label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsRightModalOpen(true)}
                          className="w-full justify-between text-xs h-8"
                        >
                          <span className="truncate">
                            {models.find(m => m.id === selectedRightModel)?.name || 'Select'}
                          </span>
                          <span>▼</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Apply Metal Material */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onApplyMetalMaterial}
                    className="w-full text-xs gap-1.5"
                  >
                    <span>🔩</span>
                    Apply Metal Material
                  </Button>

                  {/* Z-Axis Rotation */}
                  <div>
                    <label className="text-xs font-medium text-panel-foreground block mb-1">
                      Z-Axis Rotation
                    </label>
                    <div className="space-y-2">
                      <div>
                        <div className="text-[10px] text-panel-muted-foreground mb-1">
                          Left: {(leftHandZRotation * 180 / Math.PI).toFixed(0)}°
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onLeftHandRotateZ(-1)}
                            className="text-[10px] h-7"
                          >
                            ← -90°
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onLeftHandRotateZ(1)}
                            className="text-[10px] h-7"
                          >
                            +90° →
                          </Button>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-panel-muted-foreground mb-1">
                          Right: {(rightHandZRotation * 180 / Math.PI).toFixed(0)}°
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRightHandRotateZ(-1)}
                            className="text-[10px] h-7"
                          >
                            ← -90°
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRightHandRotateZ(1)}
                            className="text-[10px] h-7"
                          >
                            +90° →
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Joints Section - Manual mode only */}
          {isManualMode && (
            <Collapsible open={jointsOpen} onOpenChange={setJointsOpen}>
              <Card className="bg-panel-muted/50 border-panel-border hover:border-panel-border/60 transition-colors">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-2 cursor-pointer">
                    <div className="flex items-center gap-1.5">
                      <RotateCw className="w-4 h-4 text-panel-muted-foreground" />
                      <span className="text-sm font-medium text-panel-foreground">Joints</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-panel-muted-foreground transition-transform",
                        jointsOpen && "transform rotate-180"
                      )}
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-2 pb-2 space-y-2">
                    {/* Hand Selector */}
                    <div>
                      <label className="text-xs font-medium text-panel-foreground block mb-1">
                        Control Hand
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <Button
                          variant={selectedHand === 'left' ? "default" : "outline"}
                          size="sm"
                          onClick={() => onSelectedHandChange('left')}
                          className="text-xs uppercase"
                        >
                          Left
                        </Button>
                        <Button
                          variant={selectedHand === 'right' ? "default" : "outline"}
                          size="sm"
                          onClick={() => onSelectedHandChange('right')}
                          className="text-xs uppercase"
                        >
                          Right
                        </Button>
                      </div>
                    </div>

                    {/* Joint Selector Grid */}
                    <div>
                      <label className="text-xs font-medium text-panel-foreground block mb-1">
                        Select Joint
                      </label>
                      <div className="grid grid-cols-5 gap-1">
                        {fingers.map(finger => (
                          <div key={finger.name} className="flex flex-col gap-1">
                            <div className="text-[8px] text-center text-panel-muted-foreground mb-0.5">
                              {finger.label}
                            </div>
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
                      <Button
                        variant={selectedJoint === 'wrist' ? "default" : "outline"}
                        size="sm"
                        disabled={!jointAvailability.wrist}
                        onClick={() => {
                          if (jointAvailability.wrist) {
                            onSelectedJointChange('wrist')
                          }
                        }}
                        className="w-full mt-2 text-xs uppercase"
                      >
                        Wrist
                      </Button>
                    </div>

                    {/* Rotation Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-panel-foreground">
                          {selectedJoint.replace('_', ' ').toUpperCase()}
                        </label>
                        <span className="text-xs text-panel-muted-foreground">
                          {currentRotation.toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        value={[currentRotation]}
                        onValueChange={(values) => onJointRotationChange(values[0])}
                        min={-1.5}
                        max={1.5}
                        step={0.01}
                        disabled={!jointAvailability[selectedJoint]}
                        className="w-full"
                      />
                      <div className="flex justify-between text-[9px] text-panel-muted-foreground mt-1">
                        <span>-1.5</span>
                        <span>0</span>
                        <span>1.5</span>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Display Settings Section */}
          <Collapsible open={displayOpen} onOpenChange={setDisplayOpen}>
            <Card className="bg-panel-muted/50 border-panel-border hover:border-panel-border/60 transition-colors">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-2 cursor-pointer">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-panel-muted-foreground" />
                    <span className="text-sm font-medium text-panel-foreground">Display</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-panel-muted-foreground transition-transform",
                      displayOpen && "transform rotate-180"
                    )}
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-2 pb-2 space-y-2">
                  <Button
                    variant={showGimbals ? "default" : "secondary"}
                    size="sm"
                    onClick={() => onShowGimbalsChange(!showGimbals)}
                    className="w-full text-xs justify-start"
                  >
                    {showGimbals ? '✓' : '✗'} Gimbals
                  </Button>
                  <Button
                    variant={showAxes ? "default" : "secondary"}
                    size="sm"
                    onClick={() => onShowAxesChange(!showAxes)}
                    className="w-full text-xs justify-start"
                  >
                    {showAxes ? '✓' : '✗'} Axes
                  </Button>
                  <Button
                    variant={showDebugLabels ? "default" : "secondary"}
                    size="sm"
                    onClick={() => onShowDebugLabelsChange(!showDebugLabels)}
                    className="w-full text-xs justify-start"
                  >
                    {showDebugLabels ? '✓' : '✗'} Labels
                  </Button>
                  {isCameraMode && (
                    <>
                      <Button
                        variant={enableCameraPosition ? "default" : "secondary"}
                        size="sm"
                        onClick={() => onEnableCameraPositionChange(!enableCameraPosition)}
                        className="w-full text-xs justify-start"
                      >
                        {enableCameraPosition ? '✓' : '✗'} Position
                      </Button>
                      <Button
                        variant={disableWristRotation ? "secondary" : "default"}
                        size="sm"
                        onClick={() => onDisableWristRotationChange(!disableWristRotation)}
                        className="w-full text-xs justify-start"
                      >
                        {disableWristRotation ? '✗' : '✓'} Wrist
                      </Button>
                    </>
                  )}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Info */}
          {isCameraMode && (
            <div className="p-2 bg-primary/10 border border-primary/30 rounded">
              <p className="text-[10px] text-panel-muted-foreground leading-relaxed">
                Camera tracking active
              </p>
            </div>
          )}

          <div className="text-[9px] text-panel-muted-foreground italic pt-2 border-t border-panel-border">
            Mouse: rotate/zoom 3D view
          </div>
        </div>
      </ScrollArea>

      {/* Model Selector Modals */}
      <ModelSelectorModal
        isOpen={isLeftModalOpen}
        onClose={() => setIsLeftModalOpen(false)}
        onSelectModel={onLeftModelChange}
        models={models.filter(m => m.side === 'left' || m.side === null)}
        currentModel={selectedLeftModel}
        title="Select Left Hand Model"
      />
      <ModelSelectorModal
        isOpen={isRightModalOpen}
        onClose={() => setIsRightModalOpen(false)}
        onSelectModel={onRightModelChange}
        models={models.filter(m => m.side === 'right' || m.side === null)}
        currentModel={selectedRightModel}
        title="Select Right Hand Model"
      />
    </div>
  )
}

export default InspectorPanel
