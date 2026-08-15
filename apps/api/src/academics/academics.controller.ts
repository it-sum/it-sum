import { Controller, Get } from "@nestjs/common";
import {
  AcademicStructureResponseSchema,
  type AcademicStructureResponse,
} from "@it-sum/shared";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { AuthUser } from "../auth/auth.types.js";
import { SupabaseService } from "../common/supabase.service.js";

@Controller("academics")
export class AcademicsController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get("structure")
  async structure(@CurrentUser() user: AuthUser): Promise<AcademicStructureResponse> {
    const client = this.supabase.requireClient();
    const [departments, batches, semesters, courses] = await Promise.all([
      client.from("departments").select("id, university_id, name_ar, name_en, slug, created_at, updated_at").eq("university_id", user.universityId).order("slug"),
      client.from("batches").select("id, university_id, department_id, name, sort_order, created_at, updated_at").eq("university_id", user.universityId).order("sort_order"),
      client.from("semesters").select("id, university_id, batch_id, name, number, created_at, updated_at").eq("university_id", user.universityId).order("number"),
      client.from("courses").select("id, university_id, semester_id, code, name_ar, name_en, slug, created_at, updated_at").eq("university_id", user.universityId).order("slug"),
    ]);

    for (const result of [departments, batches, semesters, courses]) {
      if (result.error) throw result.error;
    }

    return AcademicStructureResponseSchema.parse({
      departments: (departments.data ?? []).map((row) => ({
        id: row.id,
        universityId: row.university_id,
        nameAr: row.name_ar,
        nameEn: row.name_en,
        slug: row.slug,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      batches: (batches.data ?? []).map((row) => ({
        id: row.id,
        universityId: row.university_id,
        departmentId: row.department_id,
        name: row.name,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      semesters: (semesters.data ?? []).map((row) => ({
        id: row.id,
        universityId: row.university_id,
        batchId: row.batch_id,
        name: row.name,
        number: row.number,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      courses: (courses.data ?? []).map((row) => ({
        id: row.id,
        universityId: row.university_id,
        semesterId: row.semester_id,
        code: row.code,
        nameAr: row.name_ar,
        nameEn: row.name_en,
        slug: row.slug,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  }
}
