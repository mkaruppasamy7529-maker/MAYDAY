import json
import logging
import httpx
from config.settings import settings
from prompts.system import SYSTEM_PROMPT

logger = logging.getLogger(__name__)


async def _call_ollama_nonstream(messages: list[dict]) -> str:
    headers = {"Content-Type": "application/json"}
    payload = {"model": settings.ollama_model, "messages": messages, "stream": False}
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(f"{settings.ollama_url}/api/chat", json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        return data.get("message", {}).get("content", "")


async def _call_ollama_stream(messages: list[dict]):
    headers = {"Content-Type": "application/json"}
    payload = {"model": settings.ollama_model, "messages": messages, "stream": True}
    async with httpx.AsyncClient(timeout=300.0) as client:
        async with client.stream("POST", f"{settings.ollama_url}/api/chat", json=payload, headers=headers) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line.strip():
                    continue
                try:
                    data = json.loads(line)
                    content = data.get("message", {}).get("content", "")
                    if content:
                        yield content
                    if data.get("done"):
                        break
                except json.JSONDecodeError:
                    continue


async def _call_openai_nonstream(messages: list[dict]) -> str:
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {settings.openai_api_key}"}
    payload = {"model": settings.openai_model, "messages": messages}
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        return data.get("choices", [{}])[0].get("message", {}).get("content", "")


async def _call_openai_stream(messages: list[dict]):
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {settings.openai_api_key}"}
    payload = {"model": settings.openai_model, "messages": messages, "stream": True}
    async with httpx.AsyncClient(timeout=300.0) as client:
        async with client.stream("POST", "https://api.openai.com/v1/chat/completions", json=payload, headers=headers) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line.strip() or not line.startswith("data: "):
                    continue
                if line.strip() == "data: [DONE]":
                    break
                try:
                    data = json.loads(line[6:])
                    delta = data.get("choices", [{}])[0].get("delta", {})
                    content = delta.get("content", "")
                    if content:
                        yield content
                except json.JSONDecodeError:
                    continue


async def generate_response(messages: list[dict]) -> str:
    full_messages = [{"role": "system", "content": SYSTEM_PROMPT}, *messages]
    provider = settings.ai_provider

    if provider == "openai" and settings.openai_api_key:
        try:
            result = await _call_openai_nonstream(full_messages)
            if result:
                return result
        except Exception as e:
            logger.error(f"OpenAI request failed, falling back to Ollama: {e}")

    try:
        return await _call_ollama_nonstream(full_messages)
    except httpx.RequestError as e:
        logger.error(f"Ollama request failed: {e}")
        raise


async def generate_response_stream(messages: list[dict]):
    full_messages = [{"role": "system", "content": SYSTEM_PROMPT}, *messages]
    provider = settings.ai_provider

    if provider == "openai" and settings.openai_api_key:
        try:
            async for chunk in _call_openai_stream(full_messages):
                yield chunk
            return
        except Exception as e:
            logger.error(f"OpenAI stream failed, falling back to Ollama: {e}")

    try:
        async for chunk in _call_ollama_stream(full_messages):
            yield chunk
    except httpx.RequestError as e:
        logger.error(f"Ollama stream failed: {e}")
        yield f"\n\nError: Cannot reach the AI backend. Please ensure the service is running."


async def generate_title(messages: list[dict]) -> str:
    from prompts.system import get_title_system_prompt

    title_messages = [
        {"role": "system", "content": get_title_system_prompt()},
        *messages,
    ]

    provider = settings.ai_provider
    title = ""

    if provider == "openai" and settings.openai_api_key:
        try:
            result = await _call_openai_nonstream(title_messages)
            title = (result or "").strip().strip('"').strip("'")
        except Exception as e:
            logger.warning(f"OpenAI title generation failed: {e}")

    if not title:
        try:
            result = await _call_ollama_nonstream(title_messages)
            title = (result or "").strip().strip('"').strip("'")
        except Exception as e:
            logger.warning(f"Ollama title generation failed: {e}")
            return ""

    return title if title and len(title.split()) >= 2 else ""
