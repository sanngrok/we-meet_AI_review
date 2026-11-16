"""네이버 지역 검색 프록시 — 온보딩 매장 검색 자동완성.

Client Secret 을 프론트에 노출하지 않기 위해 백엔드에서 대신 호출한다.
(BACKEND.md, CLAUDE.md 규칙 10 — 시크릿은 .env로만)
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.deps import get_current_user
from app.schemas.naver import NaverPlaceResult
from app.services.naver_search import search_places

router = APIRouter(tags=["naver"])


@router.get("/naver/search", response_model=list[NaverPlaceResult])
async def search_naver_places(
    query: str = Query(min_length=1),
    user: UUID = Depends(get_current_user),
) -> list[dict]:
    return await search_places(query)
