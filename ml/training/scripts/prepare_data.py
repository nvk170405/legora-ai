"""
Legora AI — Data Preparation Script.

Prepares legal document datasets for instruction-tuning format.
Supports CUAD and custom labeled datasets.
"""

import argparse
import json
import logging
import random
from pathlib import Path

import yaml
from datasets import Dataset, DatasetDict

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)


# ── Instruction templates for different tasks ────────────────────────
TEMPLATES = {
    "summarization": {
        "system": "You are a legal contract analysis assistant. Summarize the following contract section concisely.",
        "user": "Summarize this contract section:\n\n{context}",
        "format": "summary",
    },
    "clause_extraction": {
        "system": "You are a legal contract analysis assistant. Extract and categorize the key clauses from the following contract section.",
        "user": "Extract the key clauses from this contract text:\n\n{context}",
        "format": "clauses",
    },
    "risk_classification": {
        "system": "You are a legal contract analysis assistant specializing in risk assessment. Classify the risk level of the following clause.",
        "user": "Assess the risk level (low, medium, high) of this clause and explain your reasoning:\n\n{context}",
        "format": "risk",
    },
    "legal_qa": {
        "system": "You are a legal contract analysis assistant. Answer the question based solely on the provided contract context.",
        "user": "Context:\n{context}\n\nQuestion: {question}",
        "format": "answer",
    },
}


def load_config(config_path: str) -> dict:
    """Load training configuration from YAML."""
    with open(config_path) as f:
        return yaml.safe_load(f)


def create_instruction_sample(
    task: str,
    context: str,
    response: str,
    question: str | None = None,
) -> dict:
    """Create a single instruction-tuning sample."""
    template = TEMPLATES[task]
    user_prompt = template["user"].format(context=context, question=question or "")

    return {
        "task": task,
        "system_prompt": template["system"],
        "user_prompt": user_prompt,
        "response": response,
        "text": f"<s>[INST] <<SYS>>\n{template['system']}\n<</SYS>>\n\n{user_prompt} [/INST] {response} </s>",
    }


def prepare_cuad_dataset(data_path: str) -> list[dict]:
    """
    Prepare the CUAD (Contract Understanding Atticus Dataset) for training.
    Expected format: JSON with contract text and labeled clauses.
    """
    samples = []
    data_file = Path(data_path)

    if not data_file.exists():
        logger.warning(f"CUAD data file not found at {data_path}")
        logger.info("Please download CUAD from: https://www.atticusprojectai.org/cuad")
        return samples

    with open(data_file) as f:
        data = json.load(f)

    for entry in data.get("data", []):
        context = entry.get("context", "")
        if not context or len(context) < 100:
            continue

        # Create summarization samples
        if len(context) > 200:
            samples.append(create_instruction_sample(
                task="summarization",
                context=context[:4000],
                response=f"This section contains contractual language regarding the key terms and conditions outlined in the agreement.",
            ))

        # Create clause extraction samples from QA pairs
        for qa in entry.get("qas", []):
            question = qa.get("question", "")
            answers = qa.get("answers", {})
            answer_texts = answers.get("text", [])

            if answer_texts:
                answer = answer_texts[0]
                samples.append(create_instruction_sample(
                    task="legal_qa",
                    context=context[:3000],
                    response=answer,
                    question=question,
                ))

    return samples


def prepare_custom_dataset(data_path: str) -> list[dict]:
    """
    Prepare a custom labeled dataset.
    Expected format: JSONL with fields: text, clause_type, risk_level, summary
    """
    samples = []
    data_file = Path(data_path)

    if not data_file.exists():
        logger.warning(f"Custom data file not found at {data_path}")
        return samples

    with open(data_file) as f:
        for line in f:
            entry = json.loads(line.strip())

            text = entry.get("text", "")
            if not text:
                continue

            # Summarization
            if entry.get("summary"):
                samples.append(create_instruction_sample(
                    task="summarization",
                    context=text,
                    response=entry["summary"],
                ))

            # Risk classification
            if entry.get("risk_level"):
                risk_response = f"Risk Level: {entry['risk_level']}\nReasoning: {entry.get('risk_reasoning', 'Based on the clause language and terms.')}"
                samples.append(create_instruction_sample(
                    task="risk_classification",
                    context=text,
                    response=risk_response,
                ))

            # Clause extraction
            if entry.get("clause_type"):
                clause_response = f"Clause Type: {entry['clause_type']}\nContent: {text}"
                samples.append(create_instruction_sample(
                    task="clause_extraction",
                    context=text,
                    response=clause_response,
                ))

    return samples


def deduplicate(samples: list[dict]) -> list[dict]:
    """Remove near-duplicate samples based on user_prompt hash."""
    seen = set()
    unique = []
    for s in samples:
        key = hash(s["user_prompt"][:200])
        if key not in seen:
            seen.add(key)
            unique.append(s)
    return unique


def split_dataset(
    samples: list[dict],
    train_ratio: float = 0.8,
    val_ratio: float = 0.1,
    seed: int = 42,
) -> DatasetDict:
    """Split samples into train/val/test sets."""
    random.seed(seed)
    random.shuffle(samples)

    n = len(samples)
    train_end = int(n * train_ratio)
    val_end = int(n * (train_ratio + val_ratio))

    train_data = samples[:train_end]
    val_data = samples[train_end:val_end]
    test_data = samples[val_end:]

    logger.info(f"Split: train={len(train_data)}, val={len(val_data)}, test={len(test_data)}")

    return DatasetDict({
        "train": Dataset.from_list(train_data),
        "validation": Dataset.from_list(val_data),
        "test": Dataset.from_list(test_data),
    })


def main():
    parser = argparse.ArgumentParser(description="Prepare legal document dataset for fine-tuning")
    parser.add_argument("--config", type=str, default="training/config/lora_config.yaml")
    parser.add_argument("--cuad-path", type=str, default="data/raw/cuad.json")
    parser.add_argument("--custom-path", type=str, default="data/raw/custom_legal.jsonl")
    parser.add_argument("--output", type=str, default="data/processed/legal_instruct")
    args = parser.parse_args()

    config = load_config(args.config)
    data_config = config.get("data", {})

    # Collect samples from all sources
    all_samples = []

    cuad_samples = prepare_cuad_dataset(args.cuad_path)
    logger.info(f"CUAD samples: {len(cuad_samples)}")
    all_samples.extend(cuad_samples)

    custom_samples = prepare_custom_dataset(args.custom_path)
    logger.info(f"Custom samples: {len(custom_samples)}")
    all_samples.extend(custom_samples)

    # Deduplicate
    all_samples = deduplicate(all_samples)
    logger.info(f"Total unique samples: {len(all_samples)}")

    # Limit if configured
    max_samples = data_config.get("max_samples")
    if max_samples and len(all_samples) > max_samples:
        random.shuffle(all_samples)
        all_samples = all_samples[:max_samples]
        logger.info(f"Limited to {max_samples} samples")

    # Split and save
    dataset = split_dataset(
        all_samples,
        train_ratio=data_config.get("train_split", 0.8),
        val_ratio=data_config.get("val_split", 0.1),
        seed=data_config.get("seed", 42),
    )

    output_path = Path(args.output)
    output_path.mkdir(parents=True, exist_ok=True)
    dataset.save_to_disk(str(output_path))
    logger.info(f"Dataset saved to {output_path}")

    # Print task distribution
    task_counts = {}
    for s in all_samples:
        task_counts[s["task"]] = task_counts.get(s["task"], 0) + 1
    logger.info(f"Task distribution: {task_counts}")


if __name__ == "__main__":
    main()
