import { useRef, useEffect, useState } from 'react'
import { Hands } from '@mediapipe/hands'
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils'
import { landmarksToJointRotations } from '../utils/handKinematics'
import { MotionFilter } from '../utils/motionFilter'
import { CalibrationManager } from '../utils/coordinateMapping'

export default function HandTrackingCamera({ onHandResults, onJointRotations, calibrationManager }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const onHandResultsRef = useRef(onHandResults)
  const onJointRotationsRef = useRef(onJointRotations)

  // Initialize motion filter (persistent across renders)
  const motionFilterRef = useRef(new MotionFilter({
    alpha: 0.3, // Smoothing strength (lower = smoother but more lag)
    maxVelocity: 5.0, // Max radians per second
    enableSmoothing: true,
    enableVelocityLimiting: true,
    enableConstraints: true
  }))

  // Keep the refs updated without triggering re-initialization
  useEffect(() => {
    onHandResultsRef.current = onHandResults
  }, [onHandResults])

  useEffect(() => {
    onJointRotationsRef.current = onJointRotations
  }, [onJointRotations])

  useEffect(() => {
    let hands = null
    let animationId = null
    let canvasSizeSet = false

    // Initialize MediaPipe Hands
    const initializeHandTracking = () => {
      hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        }
      })

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      })

      hands.onResults(onResults)
    }

    // Handle hand detection results
    const onResults = (results) => {
      const canvas = canvasRef.current
      const video = videoRef.current

      if (!canvas || !video) return

      const ctx = canvas.getContext('2d')

      // Set canvas size to match video (only once)
      if (!canvasSizeSet && video.videoWidth > 0) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvasSizeSet = true
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw hand landmarks and connections
      if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
          // Draw connections between landmarks
          drawConnectors(ctx, landmarks, Hands.HAND_CONNECTIONS, {
            color: '#00FF00',
            lineWidth: 2
          })

          // Draw landmark points
          drawLandmarks(ctx, landmarks, {
            color: '#FF0000',
            lineWidth: 1,
            radius: 3
          })
        }
      }

      // Pass results to parent component if callback provided
      if (onHandResultsRef.current) {
        onHandResultsRef.current(results)
      }

      // Process landmarks to joint rotations
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        // Get first detected hand
        const landmarks = results.multiHandLandmarks[0]
        const handedness = results.multiHandedness?.[0]?.label || 'Right'

        // Convert landmarks to joint rotations
        let rotations = landmarksToJointRotations(landmarks, handedness)

        // Apply motion filtering
        rotations = motionFilterRef.current.filter(rotations, Date.now())

        // Apply calibration if available
        if (calibrationManager) {
          rotations = calibrationManager.applyCalibration(rotations)
        }

        // Send rotations to parent component
        if (onJointRotationsRef.current) {
          onJointRotationsRef.current(rotations)
        }
      }
    }

    // Process video frames
    const detectHands = async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        await hands.send({ image: videoRef.current })
      }
      animationId = requestAnimationFrame(detectHands)
    }

    // Access the user's camera
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream

          // Wait for video to load before starting hand detection
          videoRef.current.onloadedmetadata = () => {
            initializeHandTracking()
            detectHands()
          }
        }
      } catch (err) {
        console.error("Error accessing camera:", err)
      }
    }

    startCamera()

    // Cleanup function to stop camera and hand detection when component unmounts
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      if (hands) {
        hands.close()
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks()
        tracks.forEach(track => track.stop())
      }
    }
  }, []) // Empty dependency array - only initialize once

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      left: 20,
      width: '320px',
      height: '240px',
      border: '2px solid white',
      borderRadius: '8px',
      overflow: 'hidden',
      zIndex: 10
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          transform: 'scaleX(-1)'
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transform: 'scaleX(-1)'
        }}
      />
    </div>
  )
}
