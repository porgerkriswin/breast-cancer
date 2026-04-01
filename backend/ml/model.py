"""
BreastGuard AI — CNN Mammogram Classifier
ResNet-50 fine-tuned on CBIS-DDSM dataset.
Binary classification: Benign vs Malignant.

DISCLAIMER: Research prototype only. Not for clinical diagnosis.
"""

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, Model
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from pathlib import Path

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS_WARMUP = 5
EPOCHS_FINETUNE = 20
NUM_CLASSES = 2  # 0 = Benign, 1 = Malignant


def build_model(freeze_base=True):
    """
    Build ResNet-50 model with custom classification head.
    Args:
        freeze_base: If True, freeze ResNet layers during warmup phase.
    Returns:
        Compiled Keras model
    """
    base_model = ResNet50(
        weights="imagenet",
        include_top=False,
        input_shape=(*IMG_SIZE, 3),
    )
    base_model.trainable = not freeze_base

    inputs = keras.Input(shape=(*IMG_SIZE, 3))
    x = base_model(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.4)(x)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(1, activation="sigmoid")(x)  # Binary output

    model = Model(inputs, outputs)
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-4),
        loss="binary_crossentropy",
        metrics=[
            "accuracy",
            keras.metrics.AUC(name="auc"),
            keras.metrics.Precision(name="precision"),
            keras.metrics.Recall(name="recall"),
        ],
    )
    return model


def get_data_generators(data_dir: str):
    """
    Create train/validation/test data generators with augmentation.
    Expected directory structure:
        data_dir/
            train/
                benign/   *.jpg
                malignant/ *.jpg
            val/
                benign/
                malignant/
            test/
                benign/
                malignant/
    """
    train_datagen = ImageDataGenerator(
        rescale=1.0 / 255,
        rotation_range=20,
        width_shift_range=0.15,
        height_shift_range=0.15,
        horizontal_flip=True,
        vertical_flip=True,
        zoom_range=0.15,
        brightness_range=[0.85, 1.15],
    )
    val_datagen = ImageDataGenerator(rescale=1.0 / 255)

    train_gen = train_datagen.flow_from_directory(
        Path(data_dir) / "train",
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="binary",
        shuffle=True,
    )
    val_gen = val_datagen.flow_from_directory(
        Path(data_dir) / "val",
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="binary",
        shuffle=False,
    )
    test_gen = val_datagen.flow_from_directory(
        Path(data_dir) / "test",
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="binary",
        shuffle=False,
    )
    return train_gen, val_gen, test_gen


def train(data_dir: str, save_path: str = "models/breastguard_cnn.h5"):
    """
    Two-phase training:
    Phase 1 — Warmup: train only the classification head (base frozen)
    Phase 2 — Fine-tune: unfreeze top 30 layers of ResNet-50
    """
    train_gen, val_gen, test_gen = get_data_generators(data_dir)

    callbacks = [
        keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True, monitor="val_auc"),
        keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=3, monitor="val_loss"),
        keras.callbacks.ModelCheckpoint(save_path, save_best_only=True, monitor="val_auc"),
        keras.callbacks.TensorBoard(log_dir="logs/"),
    ]

    print("Phase 1: Warmup — training classification head only...")
    model = build_model(freeze_base=True)
    model.fit(train_gen, validation_data=val_gen, epochs=EPOCHS_WARMUP, callbacks=callbacks)

    print("Phase 2: Fine-tuning — unfreezing top 30 ResNet layers...")
    base = model.layers[1]  # ResNet50 layer
    base.trainable = True
    for layer in base.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-5),
        loss="binary_crossentropy",
        metrics=["accuracy", keras.metrics.AUC(name="auc"),
                 keras.metrics.Precision(name="precision"), keras.metrics.Recall(name="recall")],
    )
    model.fit(train_gen, validation_data=val_gen, epochs=EPOCHS_FINETUNE, callbacks=callbacks)

    print("\nEvaluating on test set...")
    results = model.evaluate(test_gen, verbose=1)
    print(f"Test accuracy: {results[1]:.4f} | AUC: {results[2]:.4f}")
    print(f"Precision: {results[3]:.4f} | Recall: {results[4]:.4f}")

    return model


def predict_single(model, image_path: str, threshold: float = 0.5):
    """
    Run inference on a single mammogram image.
    Returns dict with probability and classification.
    """
    img = keras.preprocessing.image.load_img(image_path, target_size=IMG_SIZE)
    arr = keras.preprocessing.image.img_to_array(img) / 255.0
    arr = np.expand_dims(arr, axis=0)

    prob = float(model.predict(arr, verbose=0)[0][0])
    label = "Malignant" if prob >= threshold else "Benign"
    confidence = prob if label == "Malignant" else 1 - prob

    return {
        "classification": label,
        "probability_malignant": round(prob, 4),
        "confidence": round(confidence, 4),
        "threshold_used": threshold,
        "disclaimer": "This is a research prototype. Do not use for clinical decisions.",
    }


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", type=str, required=True, help="Path to CBIS-DDSM dataset")
    parser.add_argument("--save_path", type=str, default="models/breastguard_cnn.h5")
    args = parser.parse_args()
    train(args.data_dir, args.save_path)
