"""
Google Quick, Draw! Doodle Recognition Training & Evaluation Pipeline
Categories (10 classes): Cat, Car, House, Tree, Flower, Star, Apple, Fish, Airplane, Cloud
Trains:
  1. Baseline Artificial Neural Network (ANN)
  2. High-Accuracy Convolutional Neural Network (CNN)
Exports models to TFJS and saves test evaluation metrics, confusion matrices, and curves.
"""

import os
import time
import json
import shutil
import urllib.request
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support
from sklearn.model_selection import train_test_split

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

from tfjs_export_helper import export_model_to_tfjs

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BASE_DIR, "dataset", "quickdraw")
EVAL_DIR = os.path.join(BASE_DIR, "evaluation-results")
EXPORT_DIR = os.path.join(BASE_DIR, "exported-models")
FRONTEND_MODELS_DIR = os.path.join(BASE_DIR, "frontend", "public", "models")

os.makedirs(DATASET_DIR, exist_ok=True)
os.makedirs(EVAL_DIR, exist_ok=True)
os.makedirs(EXPORT_DIR, exist_ok=True)
os.makedirs(FRONTEND_MODELS_DIR, exist_ok=True)

CATEGORIES = [
    "cat", "car", "house", "tree", "flower", 
    "star", "apple", "fish", "airplane", "cloud"
]
SAMPLES_PER_CLASS = 4000

def load_quickdraw_data():
    print("[1/5] Loading QuickDraw dataset for 10 categories:", CATEGORIES)
    x_data = []
    y_data = []
    
    for idx, category in enumerate(CATEGORIES):
        cat_file = os.path.join(DATASET_DIR, f"{category}.npy")
        if not os.path.exists(cat_file):
            url = f"https://storage.googleapis.com/quickdraw_dataset/full/numpy_bitmap/{category}.npy"
            print(f" -> Downloading '{category}' from QuickDraw...")
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Range': 'bytes=0-3920128'})
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = resp.read()
                header_len = int.from_bytes(data[8:10], 'little')
                data_start = 10 + header_len
                raw_samples = data[data_start:]
                num_samples = len(raw_samples) // 784
                arr = np.frombuffer(raw_samples[:num_samples*784], dtype=np.uint8).reshape(num_samples, 784)
                np.save(cat_file, arr)
        
        arr = np.load(cat_file)
        if len(arr) > SAMPLES_PER_CLASS:
            arr = arr[:SAMPLES_PER_CLASS]
        x_data.append(arr)
        y_data.append(np.full(len(arr), idx))
        print(f" -> Loaded {len(arr)} samples for '{category}' (label {idx})")

    X = np.concatenate(x_data, axis=0)
    Y = np.concatenate(y_data, axis=0)
    
    # Normalize to [0, 1] and reshape to (N, 28, 28, 1)
    X = X.astype("float32") / 255.0
    X = X.reshape(-1, 28, 28, 1)
    
    # Stratified 80% train, 20% test split
    x_train, x_test, y_train, y_test = train_test_split(
        X, Y, test_size=0.2, random_state=42, stratify=Y
    )
    return (x_train, y_train), (x_test, y_test)

def build_ann():
    model = keras.Sequential([
        layers.Input(shape=(28, 28, 1)),
        layers.Flatten(),
        layers.Dense(256, activation="relu", name="ann_dense_1"),
        layers.Dropout(0.25, name="ann_dropout_1"),
        layers.Dense(128, activation="relu", name="ann_dense_2"),
        layers.Dropout(0.20, name="ann_dropout_2"),
        layers.Dense(len(CATEGORIES), activation="softmax", name="ann_output")
    ], name="Doodle_ANN_Baseline")
    
    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )
    return model

def build_cnn():
    model = keras.Sequential([
        layers.Input(shape=(28, 28, 1)),
        layers.Conv2D(32, kernel_size=(3, 3), activation="relu", padding="same", name="cnn_conv2d_1"),
        layers.BatchNormalization(name="cnn_bn_1"),
        layers.MaxPooling2D(pool_size=(2, 2), name="cnn_pool_1"),
        layers.Conv2D(64, kernel_size=(3, 3), activation="relu", padding="same", name="cnn_conv2d_2"),
        layers.BatchNormalization(name="cnn_bn_2"),
        layers.MaxPooling2D(pool_size=(2, 2), name="cnn_pool_2"),
        layers.Conv2D(128, kernel_size=(3, 3), activation="relu", padding="same", name="cnn_conv2d_3"),
        layers.MaxPooling2D(pool_size=(2, 2), name="cnn_pool_3"),
        layers.Flatten(name="cnn_flatten"),
        layers.Dense(128, activation="relu", name="cnn_dense_1"),
        layers.Dropout(0.3, name="cnn_dropout"),
        layers.Dense(len(CATEGORIES), activation="softmax", name="cnn_output")
    ], name="Doodle_CNN_Classifier")
    
    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )
    return model

def benchmark_latency(model, x_test_subset, num_runs=50):
    _ = model.predict(x_test_subset[:5], verbose=0)
    latencies = []
    for i in range(min(num_runs, len(x_test_subset))):
        sample = np.expand_dims(x_test_subset[i], axis=0)
        t0 = time.perf_counter()
        _ = model.predict(sample, verbose=0)
        latencies.append((time.perf_counter() - t0) * 1000.0)
    return float(np.mean(latencies)), float(np.median(latencies)), float(np.std(latencies))

def evaluate_model(model, name, x_test, y_test, history):
    print(f"\n[Evaluating {name}]...")
    y_pred_probs = model.predict(x_test, batch_size=128, verbose=0)
    y_pred = np.argmax(y_pred_probs, axis=1)
    
    acc = float(np.mean(y_pred == y_test))
    precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="weighted")
    macro_precision, macro_recall, macro_f1, _ = precision_recall_fscore_support(y_test, y_pred, average="macro")
    cls_report = classification_report(y_test, y_pred, target_names=CATEGORIES, output_dict=True, digits=4)
    cm = confusion_matrix(y_test, y_pred).tolist()
    mean_lat, med_lat, std_lat = benchmark_latency(model, x_test[:50], num_runs=40)
    
    trainable_params = int(np.sum([np.prod(v.shape) for v in model.trainable_weights]))
    total_params = int(model.count_params())
    
    history_dict = {
        "loss": [float(v) for v in history.history.get("loss", [])],
        "accuracy": [float(v) for v in history.history.get("accuracy", [])],
        "val_loss": [float(v) for v in history.history.get("val_loss", [])],
        "val_accuracy": [float(v) for v in history.history.get("val_accuracy", [])],
    }

    results = {
        "model_name": name,
        "type": "ANN" if "ANN" in name else "CNN",
        "test_accuracy": acc,
        "weighted_precision": float(precision),
        "weighted_recall": float(recall),
        "weighted_f1": float(f1),
        "macro_precision": float(macro_precision),
        "macro_recall": float(macro_recall),
        "macro_f1": float(macro_f1),
        "inference_latency_ms": round(mean_lat, 2),
        "latency_median_ms": round(med_lat, 2),
        "latency_std_ms": round(std_lat, 2),
        "trainable_parameters": trainable_params,
        "total_parameters": total_params,
        "confusion_matrix": cm,
        "per_class_report": cls_report,
        "training_history": history_dict
    }
    
    print(f" -> Accuracy: {acc*100:.2f}% | F1: {f1:.4f} | Latency: {mean_lat:.2f}ms | Params: {total_params:,}")
    return results

def plot_and_save_visualizations(ann_results, cnn_results):
    print("\n[Visualizations] Generating 10-Class Doodle comparison plots...")
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    epochs = range(1, len(ann_results["training_history"]["accuracy"]) + 1)
    
    # Accuracy
    axes[0].plot(epochs, ann_results["training_history"]["accuracy"], "o--", color="#6366f1", label="ANN Train Acc")
    axes[0].plot(epochs, ann_results["training_history"]["val_accuracy"], "o-", color="#818cf8", label="ANN Val Acc")
    axes[0].plot(epochs, cnn_results["training_history"]["accuracy"], "s--", color="#10b981", label="CNN Train Acc")
    axes[0].plot(epochs, cnn_results["training_history"]["val_accuracy"], "s-", color="#34d399", label="CNN Val Acc")
    axes[0].set_title("QuickDraw 10-Class Doodle Accuracy Curves", fontsize=13, fontweight='bold')
    axes[0].set_xlabel("Epoch")
    axes[0].set_ylabel("Accuracy")
    axes[0].grid(True, linestyle="--", alpha=0.5)
    axes[0].legend()

    # Loss
    axes[1].plot(epochs, ann_results["training_history"]["loss"], "o--", color="#f43f5e", label="ANN Train Loss")
    axes[1].plot(epochs, ann_results["training_history"]["val_loss"], "o-", color="#fb7185", label="ANN Val Loss")
    axes[1].plot(epochs, cnn_results["training_history"]["loss"], "s--", color="#f59e0b", label="CNN Train Loss")
    axes[1].plot(epochs, cnn_results["training_history"]["val_loss"], "s-", color="#fbbf24", label="CNN Val Loss")
    axes[1].set_title("QuickDraw 10-Class Doodle Loss Curves", fontsize=13, fontweight='bold')
    axes[1].set_xlabel("Epoch")
    axes[1].set_ylabel("Categorical Crossentropy Loss")
    axes[1].grid(True, linestyle="--", alpha=0.5)
    axes[1].legend()

    plt.tight_layout()
    plt.savefig(os.path.join(EVAL_DIR, "doodle_training_curves.png"), dpi=200)
    plt.close()
    
    # Confusion Matrices
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7))
    cm_ann = np.array(ann_results["confusion_matrix"])
    cm_cnn = np.array(cnn_results["confusion_matrix"])
    
    im1 = ax1.imshow(cm_ann, interpolation='nearest', cmap=plt.cm.Blues)
    ax1.set_title(f"ANN QuickDraw Confusion Matrix ({ann_results['test_accuracy']*100:.2f}%)", fontweight='bold')
    ax1.set_xlabel("Predicted")
    ax1.set_ylabel("True")
    ax1.set_xticks(range(len(CATEGORIES)))
    ax1.set_yticks(range(len(CATEGORIES)))
    ax1.set_xticklabels(CATEGORIES, rotation=45, ha='right')
    ax1.set_yticklabels(CATEGORIES)
    plt.colorbar(im1, ax=ax1, fraction=0.046, pad=0.04)
    
    im2 = ax2.imshow(cm_cnn, interpolation='nearest', cmap=plt.cm.Greens)
    ax2.set_title(f"CNN QuickDraw Confusion Matrix ({cnn_results['test_accuracy']*100:.2f}%)", fontweight='bold')
    ax2.set_xlabel("Predicted")
    ax2.set_ylabel("True")
    ax2.set_xticks(range(len(CATEGORIES)))
    ax2.set_yticks(range(len(CATEGORIES)))
    ax2.set_xticklabels(CATEGORIES, rotation=45, ha='right')
    ax2.set_yticklabels(CATEGORIES)
    plt.colorbar(im2, ax=ax2, fraction=0.046, pad=0.04)

    plt.tight_layout()
    plt.savefig(os.path.join(EVAL_DIR, "doodle_confusion_matrices.png"), dpi=200)
    plt.close()

def main():
    (x_train, y_train), (x_test, y_test) = load_quickdraw_data()
    print(f"Total Doodle Train: {x_train.shape[0]} samples, Test: {x_test.shape[0]} samples")
    
    # Train ANN
    print("\n[2/5] Training 10-Class Doodle Baseline ANN...")
    ann_model = build_ann()
    ann_history = ann_model.fit(
        x_train, y_train,
        validation_split=0.1,
        epochs=6,
        batch_size=64,
        verbose=1
    )
    ann_eval = evaluate_model(ann_model, "Doodle ANN Baseline", x_test, y_test, ann_history)
    
    # Train CNN
    print("\n[3/5] Training 10-Class Doodle CNN Classifier...")
    cnn_model = build_cnn()
    cnn_history = cnn_model.fit(
        x_train, y_train,
        validation_split=0.1,
        epochs=6,
        batch_size=64,
        verbose=1
    )
    cnn_eval = evaluate_model(cnn_model, "Doodle CNN Classifier", x_test, y_test, cnn_history)
    
    plot_and_save_visualizations(ann_eval, cnn_eval)
    
    combined_eval = {
        "task": "QuickDraw 10-Class Doodle Recognition",
        "num_classes": len(CATEGORIES),
        "class_labels": CATEGORIES,
        "test_dataset_size": len(y_test),
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "models": {
            "ann": ann_eval,
            "cnn": cnn_eval
        }
    }
    
    eval_json_path = os.path.join(EVAL_DIR, "doodle_evaluation.json")
    with open(eval_json_path, "w", encoding="utf-8") as f:
        json.dump(combined_eval, f, indent=2)
    print(f"\n[4/5] 10-Class Doodle Evaluation saved to {eval_json_path}")
    
    frontend_data_dir = os.path.join(BASE_DIR, "frontend", "src", "data")
    os.makedirs(frontend_data_dir, exist_ok=True)
    with open(os.path.join(frontend_data_dir, "doodle_evaluation.json"), "w", encoding="utf-8") as f:
        json.dump(combined_eval, f, indent=2)
        
    print("\n[5/5] Exporting 10-Class Doodle models to TFJS format...")
    ann_export_dir = os.path.join(EXPORT_DIR, "doodle-ann")
    export_model_to_tfjs(ann_model, ann_export_dir, "doodle_ann")
    
    cnn_export_dir = os.path.join(EXPORT_DIR, "doodle-cnn")
    export_model_to_tfjs(cnn_model, cnn_export_dir, "doodle_cnn")
    
    # Copy to frontend
    shutil.copytree(ann_export_dir, os.path.join(FRONTEND_MODELS_DIR, "doodle-ann"), dirs_exist_ok=True)
    shutil.copytree(cnn_export_dir, os.path.join(FRONTEND_MODELS_DIR, "doodle-cnn"), dirs_exist_ok=True)
    
    # Add batch_input_shape to exported model.json
    for path in [os.path.join(FRONTEND_MODELS_DIR, "doodle-ann", "model.json"),
                 os.path.join(FRONTEND_MODELS_DIR, "doodle-cnn", "model.json"),
                 os.path.join(EXPORT_DIR, "doodle-ann", "model.json"),
                 os.path.join(EXPORT_DIR, "doodle-cnn", "model.json")]:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                d = json.load(f)
            for layer in d.get('modelTopology', {}).get('config', {}).get('layers', []):
                cfg = layer.get('config', {})
                if 'batch_shape' in cfg:
                    cfg['batch_input_shape'] = cfg['batch_shape']
                    cfg['input_shape'] = cfg['batch_shape'][1:]
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(d, f, indent=2)
    
    print("\n[SUCCESS] 10-Class Doodle models (including Star, Apple, Fish, Airplane, Cloud) trained, evaluated, and exported successfully!")

if __name__ == "__main__":
    main()
