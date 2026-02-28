/**
 * @api-separable
 * @endpoint GET /api/department-requirements
 * @service departmentRequirementService.findAll, .getPrimaryRequirements, .getSecondaryRequirements
 * @migration-notes Express 변환 시: app.get('/api/department-requirements', ...)
 */

import { NextRequest, NextResponse } from 'next/server';
import { departmentRequirementService } from '@/services/departmentRequirement.service';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const college = searchParams.get('college');
    const departmentName = searchParams.get('departmentName');
    const majorType = searchParams.get('majorType') as 'single' | 'double' | 'minor' | null;
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : undefined;

    // Specific department + majorType -> auto-fill data
    if (college && departmentName && majorType) {
      if (majorType === 'single') {
        const primary = await departmentRequirementService.getPrimaryRequirements(college, departmentName, year);
        if (!primary) {
          return NextResponse.json({ success: false, error: '학과를 찾을 수 없습니다.' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: primary });
      }

      // double/minor: returns SECONDARY department requirements
      const secondary = await departmentRequirementService.getSecondaryRequirements(
        college, departmentName, majorType, year
      );
      if (!secondary) {
        return NextResponse.json({ success: false, error: '학과를 찾을 수 없습니다.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: secondary });
    }

    // Specific department -> full document
    if (college && departmentName) {
      const doc = await departmentRequirementService.findByDepartmentName(college, departmentName, year);
      if (!doc) {
        return NextResponse.json({ success: false, error: '학과를 찾을 수 없습니다.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: doc });
    }

    // List all (optionally filter by college and year)
    const departments = await departmentRequirementService.findAll(
      college || year ? { college: college || undefined, year } : undefined
    );
    return NextResponse.json({ success: true, data: departments });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
