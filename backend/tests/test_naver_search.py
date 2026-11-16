"""네이버 지역 검색 프록시 (온보딩 매장 검색 자동완성).

라이브 호출 금지 — httpx.MockTransport 주입. 키 미설정 시 외부 호출 없이 빈 리스트.
"""

from uuid import uuid4

import httpx

from app.config import settings as cfg
from app.services import naver_search
from tests.conftest import auth_headers


def _ok_handler(seen: list[httpx.Request]):
    def handler(req: httpx.Request) -> httpx.Response:
        seen.append(req)
        return httpx.Response(
            200,
            json={
                "items": [
                    {
                        "title": "<b>온도</b> 성수점",
                        "category": "카페,디저트>카페",
                        "address": "서울특별시 성동구 성수동1가 12-3",
                        "roadAddress": "서울특별시 성동구 성수이로 1",
                        "link": "",
                    }
                ]
            },
        )

    return handler


async def test_search_strips_tags_and_sends_ncp_headers(monkeypatch):
    monkeypatch.setattr(cfg, "naver_client_id", "id")
    monkeypatch.setattr(cfg, "naver_client_secret", "secret")
    seen: list[httpx.Request] = []
    monkeypatch.setattr(naver_search, "_transport", httpx.MockTransport(_ok_handler(seen)))

    results = await naver_search.search_places("온도")

    assert results == [
        {
            "name": "온도 성수점",
            "category": "카페,디저트>카페",
            "address": "서울특별시 성동구 성수동1가 12-3",
            "road_address": "서울특별시 성동구 성수이로 1",
            "link": None,
        }
    ]
    assert seen[0].headers["X-NCP-APIGW-API-KEY-ID"] == "id"
    assert seen[0].headers["X-NCP-APIGW-API-KEY"] == "secret"


async def test_search_without_keys_returns_empty_without_call(monkeypatch):
    monkeypatch.setattr(cfg, "naver_client_id", "")
    monkeypatch.setattr(cfg, "naver_client_secret", "")

    def boom(req):  # pragma: no cover - 호출되면 실패
        raise AssertionError("키가 없으면 외부 호출을 하면 안 된다")

    monkeypatch.setattr(naver_search, "_transport", httpx.MockTransport(boom))
    assert await naver_search.search_places("온도") == []


async def test_search_upstream_error_returns_empty(monkeypatch):
    monkeypatch.setattr(cfg, "naver_client_id", "id")
    monkeypatch.setattr(cfg, "naver_client_secret", "secret")
    monkeypatch.setattr(
        naver_search, "_transport", httpx.MockTransport(lambda req: httpx.Response(401))
    )
    assert await naver_search.search_places("온도") == []


async def test_search_endpoint_requires_auth(client, monkeypatch):
    monkeypatch.setattr(cfg, "naver_client_id", "id")
    monkeypatch.setattr(cfg, "naver_client_secret", "secret")
    seen: list[httpx.Request] = []
    monkeypatch.setattr(naver_search, "_transport", httpx.MockTransport(_ok_handler(seen)))

    res = await client.get("/api/v1/naver/search?query=온도")
    assert res.status_code == 401

    res = await client.get("/api/v1/naver/search?query=온도", headers=auth_headers(uuid4()))
    assert res.status_code == 200
    assert res.json()[0]["name"] == "온도 성수점"
