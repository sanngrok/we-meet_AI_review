"""네이버 지역 검색(NAVER API HUB) 클라이언트 — 온보딩 매장 검색 자동완성용.

NCP(네이버 클라우드 플랫폼) 콘솔에서 발급하는 NAVER API HUB 키를 사용한다. 예전 developers.naver.com
Open API(X-Naver-Client-Id, openapi.naver.com)와는 엔드포인트·인증 헤더가 다르므로 혼동 금지.
크롤링과 무관하며 리뷰 데이터는 제공하지 않는다 — 상호명/주소/카테고리 조회로
온보딩 입력을 보조하는 용도.
NAVER_CLIENT_ID/SECRET 미설정 시 빈 리스트를 반환한다(선택 기능).
"""

import logging
import re

import httpx

from app.config import settings

logger = logging.getLogger("services.naver_search")

SEARCH_URL = "https://naverapihub.apigw.ntruss.com/search/v1/local"

# 테스트에서 httpx.MockTransport 를 주입한다(라이브 호출 금지).
_transport: httpx.AsyncBaseTransport | None = None

_TAG_RE = re.compile(r"</?b>")


def _strip_tags(text: str) -> str:
    return _TAG_RE.sub("", text)


async def search_places(query: str, display: int = 5) -> list[dict]:
    """상호명으로 검색. [{name, category, address, road_address, link}] 반환."""
    if not settings.naver_client_id or not settings.naver_client_secret:
        return []

    async with httpx.AsyncClient(transport=_transport, timeout=5.0) as client:
        resp = await client.get(
            SEARCH_URL,
            params={"query": query, "display": min(display, 5)},
            headers={
                "X-NCP-APIGW-API-KEY-ID": settings.naver_client_id,
                "X-NCP-APIGW-API-KEY": settings.naver_client_secret,
            },
        )

    if resp.status_code != 200:
        logger.warning("네이버 지역 검색 실패: %s", resp.status_code)
        return []

    items = resp.json().get("items", [])
    return [
        {
            "name": _strip_tags(item["title"]),
            "category": item.get("category"),
            "address": item.get("address"),
            "road_address": item.get("roadAddress"),
            "link": item.get("link") or None,
        }
        for item in items
    ]
