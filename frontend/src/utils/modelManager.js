import * as tf from '@tensorflow/tfjs';

// Cache for loaded TF models
const modelCache = new Map();

// Model configuration
export const MODEL_CONFIGS = {
  'mnist-ann': {
    id: 'mnist-ann',
    name: 'MNIST Baseline ANN',
    type: 'ANN',
    mode: 'digit',
    classes: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    path: '/models/mnist-ann/model.json',
    weightsBundlePath: '/models/mnist-ann/weights_bundle.json',
    sizeKb: 427,
    params: 109386,
    accuracy: '97.41%',
    description: 'Dense Multilayer Perceptron (784 -> 128 -> 64 -> 10) baseline for handwritten digits.'
  },
  'mnist-cnn': {
    id: 'mnist-cnn',
    name: 'MNIST High-Accuracy CNN',
    type: 'CNN',
    mode: 'digit',
    classes: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    path: '/models/mnist-cnn/model.json',
    weightsBundlePath: '/models/mnist-cnn/weights_bundle.json',
    sizeKb: 879,
    params: 225034,
    accuracy: '99.07%',
    description: 'Convolutional Network (Conv2D -> MaxPool -> Conv2D -> MaxPool -> Dense) for spatial feature extraction.'
  },
  'doodle-ann': {
    id: 'doodle-ann',
    name: 'QuickDraw 10-Class Baseline ANN',
    type: 'ANN',
    mode: 'doodle',
    classes: ['cat', 'car', 'house', 'tree', 'flower', 'star', 'apple', 'fish', 'airplane', 'cloud'],
    path: '/models/doodle-ann/model.json',
    weightsBundlePath: '/models/doodle-ann/weights_bundle.json',
    sizeKb: 918,
    params: 236042,
    accuracy: '88.21%',
    description: '10-Class Dense Multilayer Perceptron baseline trained on QuickDraw doodles.'
  },
  'doodle-cnn': {
    id: 'doodle-cnn',
    name: 'QuickDraw 10-Class High-Accuracy CNN',
    type: 'CNN',
    mode: 'doodle',
    classes: ['cat', 'car', 'house', 'tree', 'flower', 'star', 'apple', 'fish', 'airplane', 'cloud'],
    path: '/models/doodle-cnn/model.json',
    weightsBundlePath: '/models/doodle-cnn/weights_bundle.json',
    sizeKb: 945,
    params: 241930,
    accuracy: '93.97%',
    description: 'Deep Convolutional Network for 10 categories: Cat, Car, House, Tree, Flower, Star, Apple, Fish, Airplane, Cloud.'
  }
};

/**
 * Reconstruct model directly in tfjs using weights bundle if loadLayersModel fails
 */
async function buildAndLoadFromWeightsBundle(config) {
  const resp = await fetch(config.weightsBundlePath);
  if (!resp.ok) {
    throw new Error(`Failed to load weights bundle from ${config.weightsBundlePath}`);
  }
  const bundle = await resp.json();
  const numClasses = config.classes.length;

  let model;
  if (config.type === 'CNN') {
    if (config.mode === 'doodle') {
      // 3 Conv blocks with BatchNorm
      model = tf.sequential({
        layers: [
          tf.layers.conv2d({ inputShape: [28, 28, 1], kernelSize: 3, filters: 32, activation: 'relu', padding: 'same', name: 'cnn_conv2d_1' }),
          tf.layers.batchNormalization({ name: 'cnn_bn_1' }),
          tf.layers.maxPooling2d({ poolSize: [2, 2], name: 'cnn_pool_1' }),
          tf.layers.conv2d({ kernelSize: 3, filters: 64, activation: 'relu', padding: 'same', name: 'cnn_conv2d_2' }),
          tf.layers.batchNormalization({ name: 'cnn_bn_2' }),
          tf.layers.maxPooling2d({ poolSize: [2, 2], name: 'cnn_pool_2' }),
          tf.layers.conv2d({ kernelSize: 3, filters: 128, activation: 'relu', padding: 'same', name: 'cnn_conv2d_3' }),
          tf.layers.maxPooling2d({ poolSize: [2, 2], name: 'cnn_pool_3' }),
          tf.layers.flatten({ name: 'cnn_flatten' }),
          tf.layers.dense({ units: 128, activation: 'relu', name: 'cnn_dense_1' }),
          tf.layers.dropout({ rate: 0.3, name: 'cnn_dropout' }),
          tf.layers.dense({ units: numClasses, activation: 'softmax', name: 'cnn_output' })
        ]
      });
    } else {
      model = tf.sequential({
        layers: [
          tf.layers.conv2d({ inputShape: [28, 28, 1], kernelSize: 3, filters: 32, activation: 'relu', padding: 'valid', name: 'cnn_conv2d_1' }),
          tf.layers.maxPooling2d({ poolSize: [2, 2], name: 'cnn_pool_1' }),
          tf.layers.conv2d({ kernelSize: 3, filters: 64, activation: 'relu', padding: 'valid', name: 'cnn_conv2d_2' }),
          tf.layers.maxPooling2d({ poolSize: [2, 2], name: 'cnn_pool_2' }),
          tf.layers.flatten({ name: 'cnn_flatten' }),
          tf.layers.dense({ units: 128, activation: 'relu', name: 'cnn_dense_1' }),
          tf.layers.dropout({ rate: 0.25, name: 'cnn_dropout' }),
          tf.layers.dense({ units: numClasses, activation: 'softmax', name: 'cnn_output' })
        ]
      });
    }
  } else {
    if (config.mode === 'doodle') {
      model = tf.sequential({
        layers: [
          tf.layers.flatten({ inputShape: [28, 28, 1], name: 'ann_flatten' }),
          tf.layers.dense({ units: 256, activation: 'relu', name: 'ann_dense_1' }),
          tf.layers.dropout({ rate: 0.25, name: 'ann_dropout_1' }),
          tf.layers.dense({ units: 128, activation: 'relu', name: 'ann_dense_2' }),
          tf.layers.dropout({ rate: 0.20, name: 'ann_dropout_2' }),
          tf.layers.dense({ units: numClasses, activation: 'softmax', name: 'ann_output' })
        ]
      });
    } else {
      model = tf.sequential({
        layers: [
          tf.layers.flatten({ inputShape: [28, 28, 1], name: 'ann_flatten' }),
          tf.layers.dense({ units: 128, activation: 'relu', name: 'ann_dense_1' }),
          tf.layers.dropout({ rate: 0.2, name: 'ann_dropout_1' }),
          tf.layers.dense({ units: 64, activation: 'relu', name: 'ann_dense_2' }),
          tf.layers.dense({ units: numClasses, activation: 'softmax', name: 'ann_output' })
        ]
      });
    }
  }

  // Set weights layer by layer
  const weightsDict = bundle.weights || {};
  for (const layer of model.layers) {
    const trainableWeights = layer.getWeights();
    if (!trainableWeights || trainableWeights.length === 0) continue;

    // Search weightsDict for keys matching layer name
    const layerKernelKey = Object.keys(weightsDict).find(k => k.startsWith(layer.name) && k.includes('kernel'));
    const layerBiasKey = Object.keys(weightsDict).find(k => k.startsWith(layer.name) && k.includes('bias'));

    const tensors = [];
    if (layerKernelKey && weightsDict[layerKernelKey]) {
      const kw = weightsDict[layerKernelKey];
      tensors.push(tf.tensor(kw.values, kw.shape, 'float32'));
    }
    if (layerBiasKey && weightsDict[layerBiasKey]) {
      const bw = weightsDict[layerBiasKey];
      tensors.push(tf.tensor(bw.values, bw.shape, 'float32'));
    }

    if (tensors.length === trainableWeights.length) {
      layer.setWeights(tensors);
    }
  }

  return model;
}

/**
 * Load a model by ID with telemetry
 */
export async function loadModel(modelId) {
  if (modelCache.has(modelId)) {
    return {
      model: modelCache.get(modelId),
      loadTimeMs: 0,
      fromCache: true
    };
  }

  const config = MODEL_CONFIGS[modelId];
  if (!config) {
    throw new Error(`Model '${modelId}' is not configured.`);
  }

  const startTime = performance.now();
  let model;

  try {
    // 1. Try standard TFJS Layers Model loading
    model = await tf.loadLayersModel(config.path);
  } catch (err) {
    console.warn(`[TFJS] Direct loadLayersModel failed for ${modelId} (${err.message}). Falling back to weights bundle reconstruction...`);
    // 2. Fallback to direct architectural reconstruction
    model = await buildAndLoadFromWeightsBundle(config);
  }

  // Warmup run with zeros tensor
  const dummyInput = tf.zeros([1, 28, 28, 1]);
  const warmupOut = model.predict(dummyInput);
  warmupOut.dispose();
  dummyInput.dispose();

  const loadTimeMs = performance.now() - startTime;
  modelCache.set(modelId, model);

  return {
    model,
    loadTimeMs: Math.round(loadTimeMs),
    fromCache: false
  };
}

/**
 * Run inference on a 28x28 normalized float array
 */
export async function predictSketch(modelId, float32Array) {
  const config = MODEL_CONFIGS[modelId];
  if (!config) {
    throw new Error(`Model '${modelId}' not recognized.`);
  }

  const { model } = await loadModel(modelId);

  const t0 = performance.now();
  // Shape tensor [1, 28, 28, 1]
  const inputTensor = tf.tensor4d(float32Array, [1, 28, 28, 1], 'float32');
  
  const outputTensor = model.predict(inputTensor);
  const probabilities = await outputTensor.data();
  
  // Clean up tensors from WebGL memory
  inputTensor.dispose();
  outputTensor.dispose();
  const latencyMs = Math.round((performance.now() - t0) * 10) / 10;

  // Convert to formatted prediction objects
  const classes = config.classes;
  const results = Array.from(probabilities).map((prob, idx) => ({
    label: classes[idx],
    confidence: Math.max(0, Math.min(1, prob)),
    percentage: Math.round(prob * 1000) / 10
  }));

  // Sort descending
  results.sort((a, b) => b.confidence - a.confidence);

  return {
    modelId,
    modelName: config.name,
    modelType: config.type,
    mode: config.mode,
    topPrediction: results[0],
    top3: results.slice(0, 3),
    allPredictions: results,
    latencyMs
  };
}

/**
 * Run dual model inference (ANN vs CNN) on the exact same drawing
 */
export async function predictDualComparison(mode, float32Array) {
  const annId = mode === 'digit' ? 'mnist-ann' : 'doodle-ann';
  const cnnId = mode === 'digit' ? 'mnist-cnn' : 'doodle-cnn';

  const [annResult, cnnResult] = await Promise.all([
    predictSketch(annId, float32Array),
    predictSketch(cnnId, float32Array)
  ]);

  return {
    ann: annResult,
    cnn: cnnResult,
    agreement: annResult.topPrediction.label === cnnResult.topPrediction.label
  };
}
