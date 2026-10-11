# 🏛️ System Architecture & Engineering Specifications

## 1. Executive Summary
The **Intelligent Sketch Recognition and Learning System (SketchAI)** is a hybrid client-server artificial intelligence architecture where model training, hyperparameter optimization, and empirical evaluation are executed using high-performance Python ML pipelines, while core real-time inference is entirely decoupled and executed client-side inside the user's browser via **TensorFlow.js WebGL shaders**.

---

## 2. Mathematical Preprocessing Pipeline

The human drawing process is stochastic: strokes vary in position, thickness, scale, and velocity. To enable neural networks trained on normalized benchmark sets (MNIST, QuickDraw) to classify wild user drawings with high accuracy, the application applies a five-stage computer vision preprocessing pipeline:

### Stage 1: Active Ink & Bounding Box Detection
Given raw canvas image data $I(x, y)$ of dimension $280 \times 280$, each pixel $(x, y)$ is evaluated for luminance:
$$L(x, y) = \max(R, G, B) \cdot \frac{A}{255}$$
If $L(x, y) > \tau$ (where $\tau = 20$), pixel $(x, y)$ is marked as active ink.
The bounding box $[x_{\min}, y_{\min}, x_{\max}, y_{\max}]$ isolates the drawing. If $\sum L(x, y) < \text{threshold}$, the canvas is flagged as `empty`, avoiding redundant tensor allocations.

### Stage 2: Aspect-Ratio Preserving Scaling
To prevent non-uniform distortion, the maximum bounding box dimension is computed:
$$D_{\max} = \max(x_{\max} - x_{\min}, y_{\max} - y_{\min})$$
A scaling factor $s = \frac{20}{D_{\max}}$ resamples the stroke geometry into a $20 \times 20$ pixel bounding box using bicubic interpolation.

### Stage 3: Center-of-Mass Alignment
Rather than simple bounding-box geometric centering, standard MNIST and QuickDraw datasets are centered by **center-of-mass** $(\bar{x}, \bar{y})$:
$$\bar{x} = \frac{\sum_{x, y} x \cdot I(x, y)}{\sum_{x, y} I(x, y)}, \quad \bar{y} = \frac{\sum_{x, y} y \cdot I(x, y)}{\sum_{x, y} I(x, y)}$$
The drawing is shifted by $(\Delta x, \Delta y) = (14 - \bar{x}, 14 - \bar{y})$ to position its center of mass precisely at $(14, 14)$ inside the $28 \times 28$ grid with a 4-pixel border.

### Stage 4: Min-Max Normalization
Floating point pixel intensities are normalized into $[0.0, 1.0]$:
$$X_{\text{norm}}(i, j) = \frac{I(i, j)}{255.0}$$

### Stage 5: 4D Tensor Construction
Reshaped into a 4D batch tensor for model ingestion:
$$\mathbf{X} \in \mathbb{R}^{1 \times 28 \times 28 \times 1}$$

---

## 3. Deep Learning Architectures

### Model 1: Baseline Artificial Neural Network (ANN)
Designed as a computational baseline to demonstrate the strengths and trade-offs of Multilayer Perceptrons versus Convolutions:
- **Input Layer**: Flatten(shape = [28, 28, 1]) $\rightarrow \mathbf{x} \in \mathbb{R}^{784}$
- **Dense Hidden 1**: 128 units, $\text{ReLU}(\mathbf{W}_1 \mathbf{x} + \mathbf{b}_1)$
- **Dropout Regularization**: $p = 0.20$
- **Dense Hidden 2**: 64 units, $\text{ReLU}(\mathbf{W}_2 \mathbf{h}_1 + \mathbf{b}_2)$
- **Output Softmax**: 10 units (Digits) or 5 units (Doodles)
- **Parameters**: 109,386 trainable weights
- **Loss Function**: Categorical Cross-Entropy

### Model 2: High-Accuracy Convolutional Neural Network (CNN)
Designed to extract localized features invariant to spatial shifts:
- **Conv Block 1**:
  - Conv2D: 32 filters, $3 \times 3$ kernel, stride 1, ReLU
  - MaxPooling2D: $2 \times 2$ pool size, stride 2 (downsamples to $13 \times 13$)
- **Conv Block 2**:
  - Conv2D: 64 filters, $3 \times 3$ kernel, stride 1, ReLU
  - MaxPooling2D: $2 \times 2$ pool size, stride 2 (downsamples to $5 \times 5$)
- **Feature Flattening**: Vector of length $5 \times 5 \times 64 = 1,600$
- **Dense Classification Layer**: 128 units, ReLU
- **Dropout Regularization**: $p = 0.25$
- **Output Softmax**: $\mathbf{y} = \text{Softmax}(\mathbf{W}_c \mathbf{h} + \mathbf{b}_c)$
- **Parameters**: 225,034 trainable weights

---

## 4. Hardware Acceleration & Latency Profiling

When `@tensorflow/tfjs` initializes in the browser:
1. It queries the client graphics card for **WebGL 2.0 / WebGL 1.0** capabilities.
2. If supported, operations are compiled into WebGL Fragment Shaders. The input tensor is mapped to an offscreen GPU texture, and convolution matrix multiplications run as parallel shader computations.
3. If WebGL is unavailable, TFJS gracefully falls back to CPU WebAssembly (WASM).
4. Memory management is strictly monitored using `tf.tidy()` and explicit `tensor.dispose()` calls to prevent WebGL memory leaks during high-frequency drawing events.
