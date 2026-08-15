import { Injectable, NotFoundException } from '@nestjs/common';
import { departmentSchema, departmentTreeSchema, type Department, type DepartmentTree } from '@it-sum/shared';
import { type SupabaseService } from '../../common/supabase/supabase.service';

function bilingualDescription(value: unknown) {
  if (value && typeof value === 'object') return value;
  return { ar: null, en: null };
}

@Injectable()
export class AcademicsService {
  constructor(private readonly supabase: SupabaseService) {}

  async listDepartments(universityId: string): Promise<Department[]> {
    const { data, error } = await this.supabase.admin
      .from('departments')
      .select('id,university_id,slug,name,description,icon_name,sort_order,is_active')
      .eq('university_id', universityId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) throw new Error(`Failed to load departments: ${error.message}`);

    return (data ?? []).map((row) => departmentSchema.parse({
      id: row.id,
      universityId: row.university_id,
      slug: row.slug,
      name: row.name,
      description: bilingualDescription(row.description),
      iconName: row.icon_name,
      sortOrder: row.sort_order,
      isActive: row.is_active,
    }));
  }

  async getDepartmentTree(departmentId: string, universityId: string): Promise<DepartmentTree> {
    const { data: department, error: departmentError } = await this.supabase.admin
      .from('departments')
      .select('id,university_id,slug,name,description,icon_name,sort_order,is_active')
      .eq('id', departmentId)
      .eq('university_id', universityId)
      .eq('is_active', true)
      .maybeSingle();
    if (departmentError || !department) throw new NotFoundException('Department not found');

    const { data: batches, error: batchError } = await this.supabase.admin
      .from('batches')
      .select('id,department_id,level,name,drive_folder_id,is_active')
      .eq('department_id', departmentId)
      .eq('is_active', true)
      .order('level', { ascending: true });
    if (batchError) throw new Error(`Failed to load batches: ${batchError.message}`);

    const batchTree = await Promise.all((batches ?? []).map(async (batch) => {
      const { data: semesters, error: semesterError } = await this.supabase.admin
        .from('semesters')
        .select('id,batch_id,term,name,drive_folder_id,is_active')
        .eq('batch_id', batch.id)
        .eq('is_active', true)
        .order('term', { ascending: true });
      if (semesterError) throw new Error(`Failed to load semesters: ${semesterError.message}`);

      const semesterTree = await Promise.all((semesters ?? []).map(async (semester) => {
        const { data: courses, error: courseError } = await this.supabase.admin
          .from('courses')
          .select('id,semester_id,slug,code,name,description,instructor_name,credit_hours,cover_image_url,drive_folder_id,sort_order,is_active')
          .eq('semester_id', semester.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        if (courseError) throw new Error(`Failed to load courses: ${courseError.message}`);
        return {
          id: semester.id,
          batchId: semester.batch_id,
          term: semester.term,
          name: semester.name,
          driveFolderId: semester.drive_folder_id,
          isActive: semester.is_active,
          courses: (courses ?? []).map((course) => ({
            id: course.id,
            semesterId: course.semester_id,
            slug: course.slug,
            code: course.code,
            name: course.name,
            description: bilingualDescription(course.description),
            instructorName: course.instructor_name,
            creditHours: course.credit_hours,
            coverImageUrl: course.cover_image_url,
            driveFolderId: course.drive_folder_id,
            sortOrder: course.sort_order,
            isActive: course.is_active,
          })),
        };
      }));

      return {
        id: batch.id,
        departmentId: batch.department_id,
        level: batch.level,
        name: batch.name,
        driveFolderId: batch.drive_folder_id,
        isActive: batch.is_active,
        semesters: semesterTree,
      };
    }));

    return departmentTreeSchema.parse({
      id: department.id,
      universityId: department.university_id,
      slug: department.slug,
      name: department.name,
      description: bilingualDescription(department.description),
      iconName: department.icon_name,
      sortOrder: department.sort_order,
      isActive: department.is_active,
      batches: batchTree,
    });
  }
}
