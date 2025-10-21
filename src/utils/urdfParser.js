/**
 * URDF Parser Utility
 * Dynamically extracts joint configuration from loaded URDF robot models
 */

/**
 * Parse URDF robot object to extract joint configuration
 * @param {Object} robot - Loaded URDF robot object
 * @returns {Object} - Joint configuration with DoF and limits
 */
export function parseJointConfig(robot) {
  console.log('🔍 [urdfParser] Starting URDF parsing...');
  console.log('🔍 [urdfParser] Robot object:', robot);

  if (!robot || !robot.joints) {
    console.error('❌ [urdfParser] Invalid robot object - no joints found');
    return {};
  }

  const config = {};
  const jointNames = Object.keys(robot.joints);
  console.log(`🔍 [urdfParser] Found ${jointNames.length} joints:`, jointNames);

  Object.entries(robot.joints).forEach(([jointName, joint]) => {
    console.log(`\n📌 [urdfParser] Processing joint: ${jointName}`);
    console.log('   Type:', joint.jointType);
    console.log('   Axis:', joint.axis);
    console.log('   Limit:', joint.limit);
    console.log('   Mimic:', joint.mimicJoint);

    // Extract joint type, axis, and limits
    config[jointName] = {
      name: jointName,
      type: joint.jointType, // 'revolute', 'continuous', 'prismatic', etc.
      axis: joint.axis ? [joint.axis.x, joint.axis.y, joint.axis.z] : null,
      limits: {
        lower: joint.limit?.lower ?? -Infinity,
        upper: joint.limit?.upper ?? Infinity,
        effort: joint.limit?.effort ?? Infinity,
        velocity: joint.limit?.velocity ?? Infinity
      },
      mimic: joint.mimicJoint ? {
        joint: joint.mimicJoint,
        multiplier: joint.multiplier ?? 1.0,
        offset: joint.offset ?? 0.0
      } : null
    };

    console.log('   ✅ Parsed config:', config[jointName]);
  });

  console.log('\n✅ [urdfParser] Parsing complete. Total joints parsed:', Object.keys(config).length);
  console.log('📦 [urdfParser] Full config:', config);

  return config;
}

/**
 * Determine rotation axis from URDF axis vector
 * @param {Array} axisVector - [x, y, z]
 * @returns {string} - 'pitch', 'yaw', or 'roll'
 */
export function getAxisName(axisVector) {
  console.log('🎯 [getAxisName] Input vector:', axisVector);

  if (!axisVector) {
    console.log('   ⚠️  No axis vector, defaulting to pitch');
    return 'pitch'; // default
  }

  const [x, y, z] = axisVector.map(Math.abs);
  console.log('   Absolute values: x:', x, 'y:', y, 'z:', z);

  // Determine primary axis (largest component)
  if (x > y && x > z) {
    console.log('   ➡️  X-axis dominant → ROLL');
    return 'roll';   // X-axis
  }
  if (y > x && y > z) {
    console.log('   ➡️  Y-axis dominant → PITCH');
    return 'pitch';  // Y-axis
  }
  if (z > x && z > y) {
    console.log('   ➡️  Z-axis dominant → YAW');
    return 'yaw';    // Z-axis
  }

  console.log('   ⚠️  No dominant axis, defaulting to pitch');
  return 'pitch'; // fallback
}

/**
 * Group related joints by semantic meaning (e.g., thumb CMC multi-DoF)
 * @param {Object} jointConfig - Parsed joint configuration
 * @returns {Object} - Semantic joint groups
 */
export function createSemanticMapping(jointConfig) {
  console.log('\n🔗 [createSemanticMapping] Starting semantic mapping...');
  console.log('🔗 [createSemanticMapping] Input config:', jointConfig);

  const semanticMap = {};

  // Pattern matching for common joint naming conventions
  Object.entries(jointConfig).forEach(([jointName, config]) => {
    console.log(`\n🔍 [createSemanticMapping] Processing: ${jointName}`);

    // Example: thumb_cmc_yaw, thumb_cmc_pitch, thumb_cmc_roll
    const match = jointName.match(/^(\w+)_(\w+)_(\w+)$/);

    if (match) {
      const [_, finger, segment, axis] = match;
      const semanticKey = `${finger}_${segment}`;

      console.log(`   ✅ Multi-DoF pattern matched!`);
      console.log(`      Finger: ${finger}, Segment: ${segment}, Axis: ${axis}`);
      console.log(`      Semantic key: ${semanticKey}`);

      if (!semanticMap[semanticKey]) {
        semanticMap[semanticKey] = {
          uiName: semanticKey,
          urdfJoints: {},
          axes: [],
          limits: {}
        };
        console.log(`      Created new semantic group: ${semanticKey}`);
      }

      semanticMap[semanticKey].urdfJoints[axis] = jointName;
      semanticMap[semanticKey].axes.push(axis);
      semanticMap[semanticKey].limits[axis] = [config.limits.lower, config.limits.upper];

      console.log(`      Added to group:`, semanticMap[semanticKey]);
    } else {
      // Single-DoF joint (e.g., "index_pip", "FFJ2")
      console.log(`   ℹ️  Single-DoF joint (no pattern match)`);

      const axisName = getAxisName(config.axis);

      semanticMap[jointName] = {
        uiName: jointName,
        urdfJoints: { [axisName]: jointName },
        axes: [axisName],
        limits: { [axisName]: [config.limits.lower, config.limits.upper] },
        mimic: config.mimic
      };

      console.log(`      Created single-DoF mapping:`, semanticMap[jointName]);
    }
  });

  console.log('\n✅ [createSemanticMapping] Mapping complete!');
  console.log('📦 [createSemanticMapping] Semantic map:', semanticMap);
  console.log(`📊 [createSemanticMapping] Total semantic groups: ${Object.keys(semanticMap).length}`);

  return semanticMap;
}
