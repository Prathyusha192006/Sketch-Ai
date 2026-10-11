# 🎓 Accenture & Software Engineering Placement Interview Guide

This guide prepares you to speak confidently about **SketchAI** during technical interviews, HR discussions, and system design rounds at **Accenture, Cognizant, Infosys, TCS, Wipro, and Product MNCs**.

---

## 1. The 60-Second Elevator Pitch
> *"For my major AI/ML project, I engineered the **Intelligent Sketch Recognition and Learning System**. It's a full-stack deep learning web application that recognizes handwritten digits and real-world doodles (like cats, cars, and houses) in real-time. Instead of relying on a high-latency, expensive cloud backend, I trained both ANN and CNN models using Python and TensorFlow, and converted them into TensorFlow.js WebGL shaders to run inference 100% in the user's browser in under 20 milliseconds. I also built a personalized drawing coach, an interactive gamified learning center with points and streaks, an empirical model evaluation dashboard comparing real test metrics, and a full custom dataset training pipeline."*

---

## 2. Top 10 Technical Interview Questions & Exemplary Answers

### Q1: What was the primary motivation behind running inference in the browser with TensorFlow.js rather than deploying a Python Flask/FastAPI backend?
**Answer:**
Three key architectural drivers:
1. **Zero Latency:** Drawing recognition requires immediate feedback (<30ms). A roundtrip HTTP request to a server introduces network hops, DNS lookups, and queuing latency (often 200–500ms). WebGL shaders on the client GPU complete the forward pass in 12–25ms.
2. **Infinite Cloud Scalability at Zero Cost:** Serving deep learning models in the cloud requires GPU instances (like AWS EC2 G4dn) costing thousands of dollars per month as concurrent users grow. By moving inference to edge devices, our cloud compute cost is effectively zero.
3. **Data Privacy:** Users' sketch bitmaps remain in volatile browser memory and are never uploaded or persisted on remote servers.

---

### Q2: Why did you train both an ANN and a CNN, and what do the test results prove?
**Answer:**
We trained both to create an empirical benchmark:
- On MNIST digits, the CNN achieved **99.07% test accuracy** compared to **97.41% for the ANN** (+1.66% gain).
- On QuickDraw doodles, the CNN achieved **95.27% accuracy** versus **91.13% for the ANN** (+4.14% gain).
- **Core Explanation:** An ANN flattens the $28 \times 28$ matrix into a 784-dimensional vector, treating adjacent pixels as independent features. If a stroke shifts by 3 pixels, all weights are altered. The CNN utilizes $3 \times 3$ convolutional filters with weight sharing and max-pooling, creating translation invariance and capturing hierarchical spatial features (edges $\rightarrow$ curves $\rightarrow$ loops).

---

### Q3: What is the biggest challenge when taking drawings from a human user and feeding them into an MNIST-trained model?
**Answer:**
**The Distribution Shift Problem.** MNIST images are clean, 28x28 grayscale images centered by their center-of-mass, normalized to $[0, 1]$, with a dark background and a 4-pixel border.
A wild human drawing can be drawn in any corner of a $280 \times 280$ canvas with arbitrary stroke thickness.
To bridge this gap, I designed a multi-stage preprocessing pipeline:
1. Crop to ink bounding box.
2. Rescale while preserving aspect ratio into a $20 \times 20$ box.
3. Calculate the drawing's center-of-mass $(\bar{x}, \bar{y})$ and translate it to $(14, 14)$ within a $28 \times 28$ image.
4. Normalize pixel floats to $[0.0, 1.0]$.
Without center-of-mass alignment, accuracy on live user drawings drops significantly.

---

### Q4: How did you prevent memory leaks in the browser during continuous drawing?
**Answer:**
TensorFlow.js allocates WebGL textures directly in GPU memory, which JavaScript's garbage collector cannot automatically reclaim. If you create tensors on every `onMouseMove` event without disposing of them, the browser tab will crash with WebGL out-of-memory errors.
I resolved this by:
1. Explicitly calling `tensor.dispose()` on both the input tensor and the model output predictions after reading probabilities.
2. Wrapping intermediate transformations in `tf.tidy()`.
3. Adding a live WebGL tensor memory monitor in the Performance Dashboard using `tf.memory()` to verify that the active tensor count returns to baseline after each inference.

---

### Q5: How does your Drawing Coach identify confusion pairs?
**Answer:**
In practice mode, the system compares the user's intended target against the neural network's top-3 Softmax probability distribution.
When the model predicts a label other than the target (e.g., predicting `1` instead of `7`), the system matches the target-prediction pair against a domain knowledge base. For instance, if a `7` lacks a prominent top bar, it activates features associated with the vertical stroke of `1`. The coach surfaces actionable cues (e.g., *"Emphasize the horizontal top bar"*) without claiming that statistical predictions are guaranteed to improve.

---

## 3. Highlighting Accenture Core Competencies

- **Applied Innovation:** Edge computing / client-side WebGL deep learning architecture.
- **Data-Driven Engineering:** Reporting empirical test metrics rather than arbitrary numbers.
- **Full-Stack Proficiency:** Modern React 19, Tailwind CSS v4, HTML5 Canvas touch handling, Python TensorFlow backend.
- **Scalability & Security:** Privacy-preserving design pattern and zero-cost cloud compute model.
