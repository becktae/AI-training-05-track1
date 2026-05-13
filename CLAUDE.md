# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Environment

- **경로**: `/Users/becktae/project/AI-training-05-track1`
- **OS**: macOS (Darwin), shell: zsh
- **Python**: `/opt/homebrew/bin/python3`

## Commands

```bash
python3 main.py          # 메인 실행
python3 print_env.py     # .env 키·값 확인
```

빌드 도구, 패키지 매니저, 테스트 러너는 아직 설정되지 않았다.

## Project Overview

Firecrawl API(`FIRECRAWL_API_KEY`)를 사용하는 Python 스켈레톤. `main.py`가 핵심 구현 진입점(현재 비어 있음). `print_env.py`는 `.env` 파싱 전용 개발 유틸리티(표준 라이브러리만 사용).

## Code Exploration Principles

- 수정 전 반드시 관련 파일을 탐색하고 현재 상태를 파악한다.
- 추측 기반 수정은 금지한다. 불확실하면 먼저 확인한다.

## Code Modification Principles

- 요청 범위를 벗어난 변경은 하지 않는다. 대규모 리팩토링은 명시 요청 시에만 수행한다.
- 변경 이유를 설명할 수 있어야 한다.
- 기존 동작을 깨뜨릴 가능성이 있으면 먼저 리스크를 요약한다.

## Verification Principles

- 수정 후 가능한 검증 명령을 실행한다.
- 검증 명령을 알 수 없으면 임의로 만들지 않고, 확인 가능한 범위만 보고한다.
- 실패 로그가 있으면 원인을 요약하고 다음 수정 방향을 제시한다.

## Workflow

1. 요구사항 분석
2. 관련 파일 탐색
3. 변경 계획 수립
4. 코드 수정
5. 실행/검증
6. 결과 요약

## Result Report Format

작업 완료 후 아래 항목을 요약한다.

- 변경 파일 목록
- 변경 이유
- 실행한 검증 명령 및 결과
