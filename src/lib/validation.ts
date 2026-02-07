/**
 * Validation Utilities
 * @api-separable
 * @migration-notes 분리 시 백엔드로 이동
 */

import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

/**
 * ObjectId 유효성 검증
 * @param id - 검증할 문자열
 * @returns 유효한 ObjectId 여부
 */
export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;
}

/**
 * 유효하지 않은 ObjectId일 때 에러 응답 반환
 * @param label - 에러 메시지에 표시할 레이블 (기본값: 'ID')
 * @returns NextResponse with 400 status
 */
export function invalidIdResponse(label: string = 'ID'): NextResponse {
  return NextResponse.json(
    { success: false, error: `유효하지 않은 ${label}입니다.` },
    { status: 400 }
  );
}

/**
 * 정규식 특수문자 이스케이프 (ReDoS 방어)
 * @param str - 이스케이프할 문자열
 * @returns 이스케이프된 문자열
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
