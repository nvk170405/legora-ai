"""
Legora AI — Model Evaluation Script.

Evaluates the fine-tuned model on test splits for all tasks.
Logs metrics to MLflow.
"""

import argparse
import json
import logging
from pathlib import Path

import mlflow
import torch
import yaml
from datasets import load_from_disk
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)


def load_config(config_path: str) -> dict:
    with open(config_path) as f:
        return yaml.safe_load(f)


def generate_response(model, tokenizer, prompt: str, max_new_tokens: int = 512) -> str:
    """Generate a response from the model."""
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=2048)
    inputs = {k: v.to(model.device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=0.1,
            do_sample=True,
            top_p=0.9,
        )

    response = tokenizer.decode(outputs[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True)
    return response.strip()


def compute_rouge_scores(predictions: list[str], references: list[str]) -> dict:
    """Compute ROUGE scores for summarization evaluation."""
    try:
        from rouge_score import rouge_scorer
        scorer = rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)

        scores = {"rouge1": [], "rouge2": [], "rougeL": []}
        for pred, ref in zip(predictions, references):
            result = scorer.score(ref, pred)
            for key in scores:
                scores[key].append(result[key].fmeasure)

        return {k: sum(v) / len(v) if v else 0.0 for k, v in scores.items()}
    except ImportError:
        logger.warning("rouge_score not installed, skipping ROUGE evaluation")
        return {}


def compute_exact_match(predictions: list[str], references: list[str]) -> float:
    """Compute exact match score for Q&A evaluation."""
    if not predictions:
        return 0.0
    matches = sum(
        1 for p, r in zip(predictions, references)
        if p.strip().lower() == r.strip().lower()
    )
    return matches / len(predictions)


def main():
    parser = argparse.ArgumentParser(description="Evaluate fine-tuned model")
    parser.add_argument("--config", type=str, default="training/config/lora_config.yaml")
    parser.add_argument("--model-path", type=str, default="models/legora-legal-lora/final")
    parser.add_argument("--dataset", type=str, default="data/processed/legal_instruct")
    parser.add_argument("--max-samples", type=int, default=100)
    parser.add_argument("--output", type=str, default="evaluation/results.json")
    args = parser.parse_args()

    config = load_config(args.config)
    model_name = config["model"]["name"]
    mlflow_cfg = config.get("mlflow", {})

    # ── Setup MLflow ──────────────────────────────────────────
    mlflow.set_tracking_uri(mlflow_cfg.get("tracking_uri", "http://localhost:5000"))
    mlflow.set_experiment(mlflow_cfg.get("experiment_name", "legora-legal-finetuning"))

    with mlflow.start_run(run_name="evaluation"):
        # ── Load Model ────────────────────────────────────────
        logger.info(f"Loading base model: {model_name}")
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16,
        )
        base_model = AutoModelForCausalLM.from_pretrained(
            model_name,
            quantization_config=bnb_config,
            device_map="auto",
        )

        logger.info(f"Loading LoRA adapter: {args.model_path}")
        model = PeftModel.from_pretrained(base_model, args.model_path)
        model.eval()

        tokenizer = AutoTokenizer.from_pretrained(args.model_path)

        # ── Load Test Data ────────────────────────────────────
        logger.info(f"Loading test dataset: {args.dataset}")
        dataset = load_from_disk(args.dataset)
        test_data = dataset["test"]

        if args.max_samples and len(test_data) > args.max_samples:
            test_data = test_data.select(range(args.max_samples))

        logger.info(f"Evaluating on {len(test_data)} samples")

        # ── Evaluate by Task ──────────────────────────────────
        results = {}
        task_predictions = {}

        for sample in test_data:
            task = sample["task"]
            if task not in task_predictions:
                task_predictions[task] = {"predictions": [], "references": []}

            # Generate prediction
            prompt = sample["text"].split("[/INST]")[0] + "[/INST] "
            prediction = generate_response(model, tokenizer, prompt)
            reference = sample["response"]

            task_predictions[task]["predictions"].append(prediction)
            task_predictions[task]["references"].append(reference)

        # Compute metrics per task
        for task, data in task_predictions.items():
            logger.info(f"Computing metrics for task: {task} ({len(data['predictions'])} samples)")

            task_results = {"sample_count": len(data["predictions"])}

            if task == "summarization":
                rouge_scores = compute_rouge_scores(data["predictions"], data["references"])
                task_results.update(rouge_scores)

            elif task == "legal_qa":
                em = compute_exact_match(data["predictions"], data["references"])
                task_results["exact_match"] = em

            results[task] = task_results
            logger.info(f"  {task}: {task_results}")

        # ── Log to MLflow ─────────────────────────────────────
        for task, metrics in results.items():
            for metric_name, value in metrics.items():
                if isinstance(value, (int, float)):
                    mlflow.log_metric(f"{task}/{metric_name}", value)

        # ── Save Results ──────────────────────────────────────
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w") as f:
            json.dump(results, f, indent=2)

        mlflow.log_artifact(str(output_path))
        logger.info(f"✅ Evaluation complete. Results saved to {output_path}")


if __name__ == "__main__":
    main()
