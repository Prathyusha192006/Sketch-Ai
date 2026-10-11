"""
MNIST Digit Recognition Training & Evaluation Pipeline
Trains:
  1. Baseline Artificial Neural Network (ANN)
  2. High-Accuracy Convolutional Neural Network (CNN)
Calculates real test metrics (Accuracy, Precision, Recall, F1, Latency, Size),
generates confusion matrices and loss curves, and exports to TFJS for browser inference.
"""

import os
import time
import json
import shutil
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

from tfjs_export_helper import export_model_to_tfjs

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EVAL_DIR = os.path.join(BASE_DIR, "evaluation-results")
EXPORT_DIR = os.path.join(BASE_DIR, "exported-models")
FRONTEND_MODELS_DIR = os.path.join(BASE_DIR, "frontend", "public", "models")

os.makedirs(EVAL_DIR, exist_ok=True)
os.makedirs(EXPORT_DIR, exist_ok=True)
os.makedirs(FRONTEND_MODELS_DIR, exist_ok=True)

def load_data():
    print("[1/5] Loading MNIST dataset...")
    (x_train, y_train), (x_test, y_test) = keras.datasets.mnist.load_data()
    # Normalize to [0, 1]
    x_train = x_train.astype("float32") / 255.0
    x_test = x_test.astype("float32") / 255.0
    return (x_train, y_train), (x_test, y_test)

def build_ann():
    model = keras.Sequential([
        layers.Input(shape=(28, 28, 1)),
        layers.Flatten(),
        layers.Dense(128, activation="relu", name="ann_dense_1"),
        layers.Dropout(0.2, name="ann_dropout_1"),
        layers.Dense(64, activation="relu", name="ann_dense_2"),
        layers.Dense(10, activation="softmax", name="ann_output")
    ], name="MNIST_ANN_Baseline")
    
    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )
    return model

def build_cnn():
    model = keras.Sequential([
        layers.Input(shape=(28, 28, 1)),
        layers.Conv2D(32, kernel_size=(3, 3), activation="relu", name="cnn_conv2d_1"),
        layers.MaxPooling2D(pool_size=(2, 2), name="cnn_pool_1"),
        layers.Conv2D(64, kernel_size=(3, 3), activation="relu", name="cnn_conv2d_2"),
        layers.MaxPooling2D(pool_size=(2, 2), name="cnn_pool_2"),
        layers.Flatten(name="cnn_flatten"),
        layers.Dense(128, activation="relu", name="cnn_dense_1"),
        layers.Dropout(0.25, name="cnn_dropout"),
        layers.Dense(10, activation="softmax", name="cnn_output")
    ], name="MNIST_CNN_Classifier")
    
    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )
    return model

def benchmark_latency(model, x_test_subset, num_runs=100):
    # Warmup
    _ = model.predict(x_test_subset[:5], verbose=0)
    
    latencies = []
    for i in range(min(num_runs, len(x_test_subset))):
        sample = np.expand_dims(x_test_subset[i], axis=0)
        t0 = time.perf_counter()
        _ = model.predict(sample, verbose=0)
        latencies.append((time.perf_counter() - t0) * 1000.0) # in ms
        
    return float(np.mean(latencies)), float(np.median(latencies)), float(np.std(latencies))

def evaluate_model(model, name, x_test, y_test, history):
    print(f"\n[Evaluating {name}]...")
    y_pred_probs = model.predict(x_test, batch_size=128, verbose=0)
    y_pred = np.argmax(y_pred_probs, axis=1)
    
    # Accuracy
    acc = float(np.mean(y_pred == y_test))
    
    # Precision, Recall, F1
    precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="weighted")
    macro_precision, macro_recall, macro_f1, _ = precision_recall_fscore_support(y_test, y_pred, average="macro")
    
    # Per-class report
    cls_report = classification_report(y_test, y_pred, output_dict=True, digits=4)
    
    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred).tolist()
    
    # Latency benchmark
    mean_lat, med_lat, std_lat = benchmark_latency(model, x_test[:100], num_runs=50)
    
    # Parameters
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
    print("\n[Visualizations] Generating comparison plots...")
    
    # 1. Training Curves Plot
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    epochs = range(1, len(ann_results["training_history"]["accuracy"]) + 1)
    
    # Accuracy
    axes[0].plot(epochs, ann_results["training_history"]["accuracy"], "o--", color="#6366f1", label="ANN Train Acc")
    axes[0].plot(epochs, ann_results["training_history"]["val_accuracy"], "o-", color="#818cf8", label="ANN Val Acc")
    axes[0].plot(epochs, cnn_results["training_history"]["accuracy"], "s--", color="#10b981", label="CNN Train Acc")
    axes[0].plot(epochs, cnn_results["training_history"]["val_accuracy"], "s-", color="#34d399", label="CNN Val Acc")
    axes[0].set_title("Training & Validation Accuracy", fontsize=13, fontweight='bold')
    axes[0].set_xlabel("Epoch")
    axes[0].set_ylabel("Accuracy")
    axes[0].grid(True, linestyle="--", alpha=0.5)
    axes[0].legend()

    # Loss
    axes[1].plot(epochs, ann_results["training_history"]["loss"], "o--", color="#f43f5e", label="ANN Train Loss")
    axes[1].plot(epochs, ann_results["training_history"]["val_loss"], "o-", color="#fb7185", label="ANN Val Loss")
    axes[1].plot(epochs, cnn_results["training_history"]["loss"], "s--", color="#f59e0b", label="CNN Train Loss")
    axes[1].plot(epochs, cnn_results["training_history"]["val_loss"], "s-", color="#fbbf24", label="CNN Val Loss")
    axes[1].set_title("Training & Validation Loss", fontsize=13, fontweight='bold')
    axes[1].set_xlabel("Epoch")
    axes[1].set_ylabel("Categorical Crossentropy Loss")
    axes[1].grid(True, linestyle="--", alpha=0.5)
    axes[1].legend()

    plt.tight_layout()
    curves_path = os.path.join(EVAL_DIR, "mnist_training_curves.png")
    plt.savefig(curves_path, dpi=200)
    plt.close()
    
    # 2. Confusion Matrices Plot
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
    
    cm_ann = np.array(ann_results["confusion_matrix"])
    cm_cnn = np.array(cnn_results["confusion_matrix"])
    
    im1 = ax1.imshow(cm_ann, interpolation='nearest', cmap=plt.cm.Blues)
    ax1.set_title(f"ANN Confusion Matrix (Acc: {ann_results['test_accuracy']*100:.2f}%)", fontweight='bold')
    ax1.set_xlabel("Predicted Label")
    ax1.set_ylabel("True Label")
    ax1.set_xticks(range(10))
    ax1.set_yticks(range(10))
    plt.colorbar(im1, ax=ax1, fraction=0.046, pad=0.04)
    
    im2 = ax2.imshow(cm_cnn, interpolation='nearest', cmap=plt.cm.Greens)
    ax2.set_title(f"CNN Confusion Matrix (Acc: {cnn_results['test_accuracy']*100:.2f}%)", fontweight='bold')
    ax2.set_xlabel("Predicted Label")
    ax2.set_ylabel("True Label")
    ax2.set_xticks(range(10))
    ax2.set_yticks(range(10))
    plt.colorbar(im2, ax=ax2, fraction=0.046, pad=0.04)

    plt.tight_layout()
    cm_path = os.path.join(EVAL_DIR, "mnist_confusion_matrices.png")
    plt.savefig(cm_path, dpi=200)
    plt.close()
    
    print(f" -> Plots saved to {EVAL_DIR}")

def main():
    (x_train, y_train), (x_test, y_test) = load_data()
    # Add channel dimension
    x_train = np.expand_dims(x_train, axis=-1)
    x_test = np.expand_dims(x_test, axis=-1)
    
    print(f"Train samples: {x_train.shape[0]}, Test samples: {x_test.shape[0]}")
    
    # Train ANN
    print("\n[2/5] Training Baseline ANN Model...")
    ann_model = build_ann()
    ann_history = ann_model.fit(
        x_train, y_train,
        validation_split=0.1,
        epochs=5,
        batch_size=64,
        verbose=1
    )
    ann_eval = evaluate_model(ann_model, "ANN Baseline", x_test, y_test, ann_history)
    
    # Train CNN
    print("\n[3/5] Training CNN Classifier...")
    cnn_model = build_cnn()
    cnn_history = cnn_model.fit(
        x_train, y_train,
        validation_split=0.1,
        epochs=5,
        batch_size=64,
        verbose=1
    )
    cnn_eval = evaluate_model(cnn_model, "CNN Classifier", x_test, y_test, cnn_history)
    
    # Visualizations
    plot_and_save_visualizations(ann_eval, cnn_eval)
    
    # Save Evaluation JSON
    combined_eval = {
        "task": "MNIST Handwritten Digit Recognition",
        "num_classes": 10,
        "class_labels": [str(i) for i in range(10)],
        "test_dataset_size": len(y_test),
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "models": {
            "ann": ann_eval,
            "cnn": cnn_eval
        }
    }
    
    eval_json_path = os.path.join(EVAL_DIR, "mnist_evaluation.json")
    with open(eval_json_path, "w", encoding="utf-8") as f:
        json.dump(combined_eval, f, indent=2)
    print(f"\n[4/5] Evaluation metrics saved to {eval_json_path}")
    
    # Also save evaluation copy in frontend/src/data/ for direct dashboard import
    frontend_data_dir = os.path.join(BASE_DIR, "frontend", "src", "data")
    os.makedirs(frontend_data_dir, exist_ok=True)
    with open(os.path.join(frontend_data_dir, "mnist_evaluation.json"), "w", encoding="utf-8") as f:
        json.dump(combined_eval, f, indent=2)
    
    # Export to TFJS
    print("\n[5/5] Exporting models to TFJS format...")
    # 1. Export ANN
    ann_export_dir = os.path.join(EXPORT_DIR, "mnist-ann")
    export_model_to_tfjs(ann_model, ann_export_dir, "mnist_ann")
    
    # 2. Export CNN
    cnn_export_dir = os.path.join(EXPORT_DIR, "mnist-cnn")
    export_model_to_tfjs(cnn_model, cnn_export_dir, "mnist_cnn")
    
    # Copy exported models into frontend/public/models/
    shutil.copytree(ann_export_dir, os.path.join(FRONTEND_MODELS_DIR, "mnist-ann"), dirs_exist_ok=True)
    shutil.copytree(cnn_export_dir, os.path.join(FRONTEND_MODELS_DIR, "mnist-cnn"), dirs_exist_ok=True)
    
    print("\n[SUCCESS] MNIST Digit models trained, evaluated, and exported successfully!")

if __name__ == "__main__":
    main()
