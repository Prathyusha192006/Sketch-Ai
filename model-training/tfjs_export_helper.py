"""
SketchAI Exporter Helper
Converts trained Keras models into browser-ready TensorFlow.js layers model format
as well as a JSON-compatible weights bundle for instantaneous browser loading.
"""
import os
import json
import numpy as np

def export_model_to_tfjs(model, export_dir, model_name="model"):
    os.makedirs(export_dir, exist_ok=True)
    
    # 1. Collect all trainable weights
    weights_manifest = []
    binary_data = bytearray()
    weights_json_dict = {}

    for layer in model.layers:
        weights = layer.get_weights()
        if not weights:
            continue
        
        # In Keras, typically [kernel, bias]
        weight_names = []
        if len(weights) == 2:
            weight_names = [f"{layer.name}/kernel", f"{layer.name}/bias"]
        elif len(weights) == 1:
            weight_names = [f"{layer.name}/kernel"]
        else:
            weight_names = [f"{layer.name}/w_{i}" for i in range(len(weights))]

        for w_arr, w_name in zip(weights, weight_names):
            w_float32 = w_arr.astype(np.float32)
            # Add to weights manifest
            weights_manifest.append({
                "name": w_name,
                "shape": list(w_float32.shape),
                "dtype": "float32"
            })
            # Append raw bytes
            binary_data.extend(w_float32.tobytes())
            # Also store in weights_json_dict (values as flat float list) for fallback
            weights_json_dict[w_name] = {
                "shape": list(w_float32.shape),
                "values": w_float32.flatten().tolist()
            }

    # Write binary shard
    bin_filename = "group1-shard1of1.bin"
    bin_path = os.path.join(export_dir, bin_filename)
    with open(bin_path, "wb") as f:
        f.write(binary_data)

    # 2. Extract model topology
    model_config = json.loads(model.to_json())

    # Build standard TFJS model.json
    tfjs_model_json = {
        "format": "layers-model",
        "generatedBy": "Keras 3 / TensorFlow 2.x",
        "convertedBy": "SketchAI Exporter",
        "modelTopology": model_config,
        "weightsManifest": [
            {
                "paths": [bin_filename],
                "weights": weights_manifest
            }
        ]
    }

    model_json_path = os.path.join(export_dir, "model.json")
    with open(model_json_path, "w", encoding="utf-8") as f:
        json.dump(tfjs_model_json, f, indent=2)

    # Also write a weights.json for direct zero-latency in-browser instantiation
    weights_json_path = os.path.join(export_dir, "weights_bundle.json")
    with open(weights_json_path, "w", encoding="utf-8") as f:
        json.dump({
            "model_name": model_name,
            "architecture": [
                {
                    "name": l.name,
                    "class": l.__class__.__name__,
                    "config": l.get_config()
                } for l in model.layers
            ],
            "weights": weights_json_dict
        }, f)

    print(f"[Export] Saved TFJS model and weights bundle to {export_dir}")
    print(f"         Binary size: {len(binary_data):,} bytes ({len(binary_data)/1024:.1f} KB)")
