import httpx
from typing import Optional, Any
from modules.data_engine.utils.retry import async_retry
from modules.data_engine.utils.logger import logger


class HttpClient:
    def __init__(self, base_url: str = "", timeout: float = 30.0):
        self.base_url = base_url
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None

    async def get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=self.timeout,
                headers={
                    "User-Agent": "BIST-Elite-AI/1.0",
                    "Accept": "application/json",
                },
            )
        return self._client

    @async_retry(max_retries=3, delay=1.0)
    async def get(
        self,
        url: str,
        params: Optional[dict] = None,
        headers: Optional[dict] = None,
    ) -> dict:
        client = await self.get_client()
        response = await client.get(url, params=params, headers=headers)
        response.raise_for_status()
        return response.json()

    @async_retry(max_retries=3, delay=1.0)
    async def post(
        self,
        url: str,
        json: Optional[dict] = None,
        data: Optional[dict] = None,
    ) -> dict:
        client = await self.get_client()
        response = await client.post(url, json=json, data=data)
        response.raise_for_status()
        return response.json()

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()


def create_http_client(base_url: str = "", timeout: float = 30.0) -> HttpClient:
    return HttpClient(base_url=base_url, timeout=timeout)
