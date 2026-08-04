"""네이버 지역 검색 응답 DTO (온보딩 자동완성)."""

from pydantic import BaseModel


class NaverPlaceResult(BaseModel):
    name: str
    category: str | None
    address: str | None
    road_address: str | None
    link: str | None  # 네이버 플레이스 URL — 비어있을 수 있음(검색 API 한계)
