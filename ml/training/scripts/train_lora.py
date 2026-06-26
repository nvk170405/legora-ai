"""
Legora AI — LoRA/QLoRA Fine-tuning Script.

Fine-tunes a LLaMA-family model on legal documents using parameter-efficient adapters.
Tracks experiments with MLflow.
"""

import argparse
import logging
from pathlib import Path

import mlflow
import torch
import yaml
from datasets import load_from_disk
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
)
from trl import SFTTrainer

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)


def load_config(config_path: str) -> dict:
    with open(config_path) as f:
        return yaml.safe_load(f)


def setup_quantization(config: dict) -> BitsAndBytesConfig | None:
    """Configure 4-bit quantization for QLoRA."""
    quant_config = config.get("model", {}).get("quantization", {})
    if not quant_config.get("enabled", False):
        return None

    compute_dtype = getattr(torch, quant_config.get("compute_dtype", "bfloat16"))
    return BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type=quant_config.get("quant_type", "nf4"),
        bnb_4bit_use_double_quant=quant_config.get("double_quant", True),
        bnb_4bit_compute_dtype=compute_dtype,
    )


def setup_lora(config: dict) -> LoraConfig:
    """Configure LoRA adapter."""
    lora_cfg = config.get("lora", {})
    return LoraConfig(
        r=lora_cfg.get("r", 16),
        lora_alpha=lora_cfg.get("lora_alpha", 32),
        lora_dropout=lora_cfg.get("lora_dropout", 0.05),
        target_modules=lora_cfg.get("target_modules", ["q_proj", "v_proj"]),
        bias=lora_cfg.get("bias", "none"),
        task_type=lora_cfg.get("task_type", "CAUSAL_LM"),
    )


def main():
    parser = argparse.ArgumentParser(description="Fine-tune LLaMA with LoRA/QLoRA")
    parser.add_argument("--config", type=str, default="training/config/lora_config.yaml")
    parser.add_argument("--dataset", type=str, default="data/processed/legal_instruct")
    parser.add_argument("--output", type=str, default="models/legora-legal-lora")
    args = parser.parse_args()

    config = load_config(args.config)
    model_name = config["model"]["name"]
    train_cfg = config.get("training", {})
    mlflow_cfg = config.get("mlflow", {})

    logger.info(f"Model: {model_name}")
    logger.info(f"Dataset: {args.dataset}")

    # ── MLflow Setup ──────────────────────────────────────────
    mlflow.set_tracking_uri(mlflow_cfg.get("tracking_uri", "http://localhost:5000"))
    mlflow.set_experiment(mlflow_cfg.get("experiment_name", "legora-legal-finetuning"))

    with mlflow.start_run(tags=mlflow_cfg.get("tags", {})):
        # Log config
        mlflow.log_params({
            "model_name": model_name,
            "lora_r": config["lora"]["r"],
            "lora_alpha": config["lora"]["lora_alpha"],
            "learning_rate": train_cfg["learning_rate"],
            "num_epochs": train_cfg["num_epochs"],
            "batch_size": train_cfg["per_device_train_batch_size"],
        })

        # ── Load Dataset ──────────────────────────────────────
        logger.info("Loading dataset...")
        dataset = load_from_disk(args.dataset)
        logger.info(f"Train: {len(dataset['train'])}, Val: {len(dataset['validation'])}")

        # ── Load Tokenizer ────────────────────────────────────
        logger.info("Loading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
        tokenizer.pad_token = tokenizer.eos_token
        tokenizer.padding_side = "right"

        # ── Load Model with Quantization ──────────────────────
        logger.info("Loading model with quantization...")
        bnb_config = setup_quantization(config)
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            quantization_config=bnb_config,
            device_map="auto",
            trust_remote_code=True,
        )
        model = prepare_model_for_kbit_training(model)

        # ── Apply LoRA Adapters ───────────────────────────────
        logger.info("Applying LoRA adapters...")
        lora_config = setup_lora(config)
        model = get_peft_model(model, lora_config)
        model.print_trainable_parameters()

        # Log trainable params
        trainable, total = model.get_nb_trainable_parameters()
        mlflow.log_metrics({
            "trainable_params": trainable,
            "total_params": total,
            "trainable_pct": trainable / total * 100,
        })

        # ── Training Arguments ────────────────────────────────
        output_dir = Path(args.output)
        training_args = TrainingArguments(
            output_dir=str(output_dir),
            num_train_epochs=train_cfg.get("num_epochs", 3),
            per_device_train_batch_size=train_cfg.get("per_device_train_batch_size", 4),
            per_device_eval_batch_size=train_cfg.get("per_device_eval_batch_size", 4),
            gradient_accumulation_steps=train_cfg.get("gradient_accumulation_steps", 4),
            learning_rate=train_cfg.get("learning_rate", 2e-4),
            weight_decay=train_cfg.get("weight_decay", 0.01),
            warmup_ratio=train_cfg.get("warmup_ratio", 0.03),
            lr_scheduler_type=train_cfg.get("lr_scheduler_type", "cosine"),
            logging_steps=train_cfg.get("logging_steps", 10),
            eval_strategy="steps",
            eval_steps=train_cfg.get("eval_steps", 100),
            save_steps=train_cfg.get("save_steps", 200),
            save_total_limit=3,
            fp16=train_cfg.get("fp16", False),
            bf16=train_cfg.get("bf16", True),
            gradient_checkpointing=train_cfg.get("gradient_checkpointing", True),
            optim=train_cfg.get("optim", "paged_adamw_32bit"),
            report_to="mlflow",
            run_name="legora-legal-lora",
        )

        # ── Train ─────────────────────────────────────────────
        logger.info("Starting training...")
        trainer = SFTTrainer(
            model=model,
            args=training_args,
            train_dataset=dataset["train"],
            eval_dataset=dataset["validation"],
            processing_class=tokenizer,
            dataset_text_field="text",
            max_seq_length=train_cfg.get("max_seq_length", 2048),
        )

        trainer.train()

        # ── Save ──────────────────────────────────────────────
        logger.info("Saving model and adapter weights...")
        trainer.save_model(str(output_dir / "final"))
        tokenizer.save_pretrained(str(output_dir / "final"))

        # Log model to MLflow
        mlflow.log_artifacts(str(output_dir / "final"), artifact_path="model")

        logger.info(f"✅ Training complete. Model saved to {output_dir / 'final'}")


if __name__ == "__main__":
    main()
