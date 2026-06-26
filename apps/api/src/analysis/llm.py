"""
Legora AI — LLM Provider Abstraction.

Pluggable LLM backend supporting OpenAI, Groq (Llama), and future local models.
"""

import logging
from abc import ABC, abstractmethod

from openai import AsyncOpenAI

from src.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class LLMProvider(ABC):
    """Abstract base for LLM providers."""

    @abstractmethod
    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.1,
        max_tokens: int = 2000,
    ) -> str:
        """Generate a response from the LLM."""
        ...

    @abstractmethod
    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.0,
        max_tokens: int = 4000,
    ) -> str:
        """Generate a structured (JSON) response from the LLM."""
        ...


class OpenAIProvider(LLMProvider):
    """OpenAI API provider (GPT-4o, GPT-4o-mini, etc.)."""

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.1,
        max_tokens: int = 2000,
    ) -> str:
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""

    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.0,
        max_tokens: int = 4000,
    ) -> str:
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"},
        )
        return response.choices[0].message.content or "{}"


class GroqProvider(LLMProvider):
    """Groq API provider for fast Llama inference."""

    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1",
        )
        self.model = settings.groq_model

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.1,
        max_tokens: int = 2000,
    ) -> str:
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""

    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.0,
        max_tokens: int = 4000,
    ) -> str:
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"},
        )
        return response.choices[0].message.content or "{}"


# ── Factory ──────────────────────────────────────────────────────────

_llm_instance: LLMProvider | None = None


def get_llm() -> LLMProvider:
    """Get or create the configured LLM provider (singleton)."""
    global _llm_instance
    if _llm_instance is None:
        provider_map = {
            "openai": OpenAIProvider,
            "groq": GroqProvider,
        }
        provider_cls = provider_map.get(settings.llm_provider)
        if not provider_cls:
            raise ValueError(f"Unknown LLM provider: {settings.llm_provider}")
        _llm_instance = provider_cls()
        logger.info(f"Initialized LLM provider: {settings.llm_provider}")
    return _llm_instance
