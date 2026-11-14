#!/usr/bin/env python3
"""Build-time text embedding generation using pinned all-MiniLM-L6-v2.

This script runs at build/refresh time only. The backend runtime loads only
data/embeddings.npy and does not import Torch, Transformers, or onnxruntime.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.request
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT_PATH = ROOT / "data" / "psi_snapshot.json"
EMBEDDINGS_PATH = ROOT / "data" / "embeddings.npy"
MANIFEST_PATH = ROOT / "data" / "embeddings_manifest.json"

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
MODEL_REVISION = "c224e78d5e4b10e9976450a52084712171457f30"
MODEL_LICENSE = "Apache-2.0"
DIMENSION = 384

HF_BASE_URL = f"https://huggingface.co/{MODEL_NAME}/resolve/main"
CACHE_DIR = Path("/tmp/minilm_cache")


def ensure_model_files() -> tuple[Path, Path]:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    tok_path = CACHE_DIR / "tokenizer.json"
    onnx_path = CACHE_DIR / "model.onnx"

    if not tok_path.exists():
        print(f"Fetching tokenizer from {HF_BASE_URL}/tokenizer.json ...")
        urllib.request.urlretrieve(f"{HF_BASE_URL}/tokenizer.json", tok_path)

    if not onnx_path.exists():
        print(f"Fetching ONNX model from {HF_BASE_URL}/onnx/model.onnx ...")
        urllib.request.urlretrieve(f"{HF_BASE_URL}/onnx/model.onnx", onnx_path)

    return tok_path, onnx_path


def compute_embeddings(texts: list[str]) -> np.ndarray:
    try:
        from tokenizers import Tokenizer
        import onnxruntime as ort
    except ImportError as exc:
        raise RuntimeError(
            f"Build tool requires tokenizers and onnxruntime: {exc}. "
            "Install in build environment or run with system python."
        ) from exc

    tok_path, onnx_path = ensure_model_files()

    tokenizer = Tokenizer.from_file(str(tok_path))
    tokenizer.enable_padding(length=256)
    tokenizer.enable_truncation(max_length=256)

    session = ort.InferenceSession(str(onnx_path), providers=["CPUExecutionProvider"])

    all_embeddings: list[np.ndarray] = []
    # Batch size 8
    for i in range(0, len(texts), 8):
        batch_texts = texts[i : i + 8]
        encodings = [tokenizer.encode(t) for t in batch_texts]

        input_ids = np.array([e.ids for e in encodings], dtype=np.int64)
        attention_mask = np.array([e.attention_mask for e in encodings], dtype=np.int64)
        token_type_ids = np.array([e.type_ids for e in encodings], dtype=np.int64)

        inputs = {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
            "token_type_ids": token_type_ids,
        }

        outputs = session.run(None, inputs)
        token_embeddings = outputs[0]  # [B, seq_len, 384]

        # Mean pooling with attention mask
        mask = np.expand_dims(attention_mask, -1)
        sum_embeddings = np.sum(token_embeddings * mask, axis=1)
        sum_mask = np.clip(mask.sum(axis=1), a_min=1e-9, a_max=None)
        embeddings = sum_embeddings / sum_mask

        # L2 normalize
        norms = np.linalg.norm(embeddings, ord=2, axis=1, keepdims=True)
        embeddings = embeddings / norms
        all_embeddings.append(embeddings)

    return np.vstack(all_embeddings).astype(np.float32)


def main() -> None:
    snapshot_data = json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))
    records = snapshot_data.get("records", [])
    records.sort(key=lambda r: r["psi_id"])

    psi_ids: list[str] = []
    texts: list[str] = []

    for r in records:
        psi_id = r["psi_id"]
        psi_ids.append(psi_id)
        title = r["title"]
        obj = r.get("objectives_text", "")
        appr = r.get("approach_text", "")
        find = r.get("key_findings_text") or ""
        text = f"{title}. {obj} {appr} {find}".strip()
        texts.append(text)

    print(f"Generating embeddings for {len(texts)} canonical records...")
    embeddings = compute_embeddings(texts)
    assert embeddings.shape == (24, DIMENSION), f"Unexpected shape {embeddings.shape}"

    # Verify normalization
    row_norms = np.linalg.norm(embeddings, axis=1)
    np.testing.assert_allclose(row_norms, 1.0, rtol=1e-5)

    np.save(EMBEDDINGS_PATH, embeddings)
    print(f"Saved {EMBEDDINGS_PATH} with shape {embeddings.shape}")

    manifest = {
        "model_name": MODEL_NAME,
        "model_revision": MODEL_REVISION,
        "license": MODEL_LICENSE,
        "dimension": DIMENSION,
        "row_order": psi_ids,
        "generator_command": "python scripts/build_embeddings.py",
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Saved {MANIFEST_PATH}")


if __name__ == "__main__":
    main()
