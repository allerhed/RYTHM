import { TenantExportData, GlobalExportData } from './export';

export class SqlFormatter {
  /**
   * Convert tenant export data to SQL format
   */
  formatTenantData(data: TenantExportData): string {
    const statements: string[] = [];
    
    // Add header comment
    statements.push(`-- RYTHM Tenant Data Export`);
    statements.push(`-- Tenant: ${data.tenant.name} (${data.tenant.tenant_id})`);
    statements.push(`-- Exported: ${new Date().toISOString()}`);
    statements.push(`-- WARNING: This SQL contains sensitive data including password hashes`);
    statements.push('');
    
    // Disable foreign key checks during import
    statements.push('SET session_replication_role = replica;');
    statements.push('');
    
    // Insert tenant
    statements.push('-- Insert tenant');
    statements.push(`INSERT INTO tenants (tenant_id, name, branding, created_at, updated_at) VALUES`);
    statements.push(`  ('${data.tenant.tenant_id}', ${this.escapeSqlString(data.tenant.name)}, '${JSON.stringify(data.tenant.branding)}'::jsonb, '${data.tenant.created_at}', '${data.tenant.updated_at}')`);
    statements.push(`ON CONFLICT (tenant_id) DO UPDATE SET name = EXCLUDED.name, branding = EXCLUDED.branding, updated_at = EXCLUDED.updated_at;`);
    statements.push('');
    
    // Insert users
    if (data.users && data.users.length > 0) {
      statements.push('-- Insert users');
      statements.push(`INSERT INTO users (user_id, tenant_id, email, password_hash, role, first_name, last_name, avatar_url, about, created_at, updated_at) VALUES`);
      
      const userValues = data.users.map(user => 
        `  ('${user.user_id}', '${data.tenant.tenant_id}', ${this.escapeSqlString(user.email)}, ${this.escapeSqlString(user.password_hash)}, '${user.role}', ${this.escapeSqlString(user.first_name)}, ${this.escapeSqlString(user.last_name)}, ${this.escapeSqlString(user.avatar_url)}, ${this.escapeSqlString(user.about)}, '${user.created_at}', '${user.updated_at}')`
      ).join(',\n');
      
      statements.push(userValues + ';');
      statements.push('');
    }
    
    // Insert programs and workouts
    if (data.programs && data.programs.length > 0) {
      statements.push('-- Insert programs');
      statements.push(`INSERT INTO programs (program_id, tenant_id, name, description, duration_weeks, created_at, updated_at) VALUES`);
      
      const programValues = data.programs.map(program => 
        `  ('${program.program_id}', '${data.tenant.tenant_id}', ${this.escapeSqlString(program.name)}, ${this.escapeSqlString(program.description)}, ${program.duration_weeks}, '${program.created_at}', '${program.updated_at}')`
      ).join(',\n');
      
      statements.push(programValues + ';');
      statements.push('');
      
      // Insert workouts
      const allWorkouts = data.programs.flatMap(program => 
        program.workouts.map(workout => ({ ...workout, program_id: program.program_id }))
      );
      
      if (allWorkouts.length > 0) {
        statements.push('-- Insert workouts');
        statements.push(`INSERT INTO workouts (workout_id, program_id, tenant_id, name, day_index, created_at, updated_at) VALUES`);
        
        const workoutValues = allWorkouts.map(workout => 
          `  ('${workout.workout_id}', '${workout.program_id}', '${data.tenant.tenant_id}', ${this.escapeSqlString(workout.name)}, ${workout.day_index}, '${workout.created_at}', '${workout.updated_at}')`
        ).join(',\n');
        
        statements.push(workoutValues + ';');
        statements.push('');
      }
    }
    
    // Insert sessions and sets
    if (data.sessions && data.sessions.length > 0) {
      statements.push('-- Insert sessions');
      statements.push(`INSERT INTO sessions (session_id, tenant_id, user_id, program_id, started_at, completed_at, category, notes, training_load, perceived_exertion, name, duration_seconds, created_at, updated_at) VALUES`);
      
      const sessionValues = data.sessions.map(session => 
        `  ('${session.session_id}', '${data.tenant.tenant_id}', '${session.user_id}', ${session.program_id ? `'${session.program_id}'` : 'NULL'}, '${session.started_at}', ${session.completed_at ? `'${session.completed_at}'` : 'NULL'}, '${session.category}', ${this.escapeSqlString(session.notes)}, ${session.training_load || 'NULL'}, ${session.perceived_exertion || 'NULL'}, ${this.escapeSqlString(session.name)}, ${session.duration_seconds || 'NULL'}, '${session.created_at}', '${session.updated_at}')`
      ).join(',\n');
      
      statements.push(sessionValues + ';');
      statements.push('');
      
      // Insert sets
      const allSets = data.sessions.flatMap(session => 
        session.sets.map(set => ({ ...set, session_id: session.session_id }))
      );
      
      if (allSets.length > 0) {
        statements.push('-- Insert sets');
        statements.push(`INSERT INTO sets (set_id, tenant_id, session_id, exercise_id, set_index, reps, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes, created_at, updated_at) VALUES`);
        
        const setValues = allSets.map(set => 
          `  ('${set.set_id}', '${data.tenant.tenant_id}', '${set.session_id}', '${set.exercise_id}', ${set.set_index}, ${set.reps || 'NULL'}, ${set.value_1_type ? `'${set.value_1_type}'` : 'NULL'}, ${set.value_1_numeric || 'NULL'}, ${set.value_2_type ? `'${set.value_2_type}'` : 'NULL'}, ${set.value_2_numeric || 'NULL'}, ${this.escapeSqlString(set.notes)}, '${set.created_at}', '${set.updated_at}')`
        ).join(',\n');
        
        statements.push(setValues + ';');
        statements.push('');
      }
    }
    
    // Insert program assignments
    if (data.program_assignments && data.program_assignments.length > 0) {
      statements.push('-- Insert program assignments');
      statements.push(`INSERT INTO program_assignments (assignment_id, tenant_id, program_id, user_id, assigned_at, starts_at, created_at, updated_at) VALUES`);
      
      const assignmentValues = data.program_assignments.map(assignment => 
        `  ('${assignment.assignment_id}', '${data.tenant.tenant_id}', '${assignment.program_id}', '${assignment.user_id}', '${assignment.assigned_at}', '${assignment.starts_at}', '${assignment.created_at}', '${assignment.updated_at}')`
      ).join(',\n');
      
      statements.push(assignmentValues + ';');
      statements.push('');
    }
    
    // Re-enable foreign key checks
    statements.push('SET session_replication_role = DEFAULT;');
    statements.push('');
    statements.push('-- Export completed successfully');
    
    return statements.join('\n');
  }

  /**
   * Convert global export data to SQL format
   */
  formatGlobalData(data: GlobalExportData): string {
    const statements: string[] = [];
    
    statements.push(`-- RYTHM Global Data Export`);
    statements.push(`-- Exported: ${new Date().toISOString()}`);
    statements.push('');
    
    // Insert equipment
    if (data.equipment.length > 0) {
      statements.push('-- Insert equipment');
      statements.push(`INSERT INTO equipment (equipment_id, name, category, description, is_active, created_at, updated_at) VALUES`);
      
      const equipmentValues = data.equipment.map(equipment => 
        `  ('${equipment.equipment_id}', ${this.escapeSqlString(equipment.name)}, '${equipment.category}', ${this.escapeSqlString(equipment.description)}, ${equipment.is_active}, '${equipment.created_at}', '${equipment.updated_at}')`
      ).join(',\n');
      
      statements.push(equipmentValues + ' ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category, description = EXCLUDED.description, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;');
      statements.push('');
    }
    
    // Insert exercises
    if (data.exercises.length > 0) {
      statements.push('-- Insert exercises');
      statements.push(`INSERT INTO exercises (exercise_id, name, muscle_groups, equipment_id, exercise_category, default_value_1_type, default_value_2_type, description, instructions, exercise_type, created_at, updated_at) VALUES`);
      
      const exerciseValues = data.exercises.map(exercise => 
        `  ('${exercise.exercise_id}', ${this.escapeSqlString(exercise.name)}, ARRAY[${exercise.muscle_groups.map(mg => `'${mg}'`).join(',')}], ${exercise.equipment_id ? `'${exercise.equipment_id}'` : 'NULL'}, '${exercise.exercise_category}', ${exercise.default_value_1_type ? `'${exercise.default_value_1_type}'` : 'NULL'}, ${exercise.default_value_2_type ? `'${exercise.default_value_2_type}'` : 'NULL'}, ${this.escapeSqlString(exercise.description)}, ${this.escapeSqlString(exercise.instructions)}, '${exercise.exercise_type}', '${exercise.created_at}', '${exercise.updated_at}')`
      ).join(',\n');
      
      statements.push(exerciseValues + ' ON CONFLICT (name) DO UPDATE SET muscle_groups = EXCLUDED.muscle_groups, equipment_id = EXCLUDED.equipment_id, exercise_category = EXCLUDED.exercise_category, default_value_1_type = EXCLUDED.default_value_1_type, default_value_2_type = EXCLUDED.default_value_2_type, description = EXCLUDED.description, instructions = EXCLUDED.instructions, exercise_type = EXCLUDED.exercise_type, updated_at = EXCLUDED.updated_at;');
      statements.push('');
    }
    
    // Insert exercise templates
    if (data.exercise_templates.length > 0) {
      statements.push('-- Insert exercise templates');
      statements.push(`INSERT INTO exercise_templates (template_id, name, muscle_groups, equipment_id, exercise_category, exercise_type, default_value_1_type, default_value_2_type, description, instructions, created_at, updated_at) VALUES`);
      
      const templateValues = data.exercise_templates.map(template => 
        `  ('${template.template_id}', ${this.escapeSqlString(template.name)}, ARRAY[${template.muscle_groups.map(mg => `'${mg}'`).join(',')}], ${template.equipment_id ? `'${template.equipment_id}'` : 'NULL'}, '${template.exercise_category}', '${template.exercise_type}', ${template.default_value_1_type ? `'${template.default_value_1_type}'` : 'NULL'}, ${template.default_value_2_type ? `'${template.default_value_2_type}'` : 'NULL'}, ${this.escapeSqlString(template.description)}, ${this.escapeSqlString(template.instructions)}, '${template.created_at}', '${template.updated_at}')`
      ).join(',\n');
      
      statements.push(templateValues + ' ON CONFLICT (template_id) DO UPDATE SET name = EXCLUDED.name, muscle_groups = EXCLUDED.muscle_groups, equipment_id = EXCLUDED.equipment_id, exercise_category = EXCLUDED.exercise_category, exercise_type = EXCLUDED.exercise_type, default_value_1_type = EXCLUDED.default_value_1_type, default_value_2_type = EXCLUDED.default_value_2_type, description = EXCLUDED.description, instructions = EXCLUDED.instructions, updated_at = EXCLUDED.updated_at;');
      statements.push('');
    }
    
    statements.push('-- Global data export completed successfully');
    
    return statements.join('\n');
  }

  private escapeSqlString(value: string | null | undefined): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    return `'${value.replace(/'/g, "''")}'`;
  }
}

export class CsvFormatter {
  /**
   * Convert tenant export data to CSV format (multiple files)
   */
  formatTenantData(data: TenantExportData): Record<string, string> {
    const csvFiles: Record<string, string> = {};
    
    // Tenant CSV
    csvFiles['tenant.csv'] = this.arrayToCsv([data.tenant], [
      'tenant_id', 'name', 'branding', 'created_at', 'updated_at'
    ]);
    
    // Users CSV
    if (data.users && data.users.length > 0) {
      csvFiles['users.csv'] = this.arrayToCsv(data.users, [
        'user_id', 'email', 'password_hash', 'role', 'first_name', 'last_name',
        'avatar_url', 'about', 'created_at', 'updated_at'
      ]);
    }
    
    // Programs CSV
    if (data.programs && data.programs.length > 0) {
      csvFiles['programs.csv'] = this.arrayToCsv(data.programs, [
        'program_id', 'name', 'description', 'duration_weeks', 'created_at', 'updated_at'
      ]);
      
      // Workouts CSV
      const allWorkouts = data.programs.flatMap(program => 
        program.workouts.map(workout => ({ ...workout, program_id: program.program_id }))
      );
      
      if (allWorkouts.length > 0) {
        csvFiles['workouts.csv'] = this.arrayToCsv(allWorkouts, [
          'workout_id', 'program_id', 'name', 'day_index', 'created_at', 'updated_at'
        ]);
      }
    }
    
    // Sessions CSV
    if (data.sessions && data.sessions.length > 0) {
      csvFiles['sessions.csv'] = this.arrayToCsv(data.sessions, [
        'session_id', 'user_id', 'program_id', 'started_at', 'completed_at',
        'category', 'notes', 'training_load', 'perceived_exertion', 'name',
        'duration_seconds', 'created_at', 'updated_at'
      ]);
      
      // Sets CSV
      const allSets = data.sessions.flatMap(session => 
        session.sets.map(set => ({ ...set, session_id: session.session_id }))
      );
      
      if (allSets.length > 0) {
        csvFiles['sets.csv'] = this.arrayToCsv(allSets, [
          'set_id', 'session_id', 'exercise_id', 'set_index', 'reps',
          'value_1_type', 'value_1_numeric', 'value_2_type', 'value_2_numeric',
          'notes', 'created_at', 'updated_at'
        ]);
      }
    }
    
    // Program assignments CSV
    if (data.program_assignments && data.program_assignments.length > 0) {
      csvFiles['program_assignments.csv'] = this.arrayToCsv(data.program_assignments, [
        'assignment_id', 'program_id', 'user_id', 'assigned_at', 'starts_at', 'created_at', 'updated_at'
      ]);
    }
    
    return csvFiles;
  }

  /**
   * Convert global export data to CSV format
   */
  formatGlobalData(data: GlobalExportData): Record<string, string> {
    const csvFiles: Record<string, string> = {};
    
    // Equipment CSV
    if (data.equipment.length > 0) {
      csvFiles['equipment.csv'] = this.arrayToCsv(data.equipment, [
        'equipment_id', 'name', 'category', 'description', 'is_active', 'created_at', 'updated_at'
      ]);
    }
    
    // Exercises CSV
    if (data.exercises.length > 0) {
      csvFiles['exercises.csv'] = this.arrayToCsv(
        data.exercises.map(ex => ({
          ...ex,
          muscle_groups: ex.muscle_groups.join(';') // Convert array to semicolon-separated string
        })), 
        [
          'exercise_id', 'name', 'muscle_groups', 'equipment_id', 'exercise_category',
          'default_value_1_type', 'default_value_2_type', 'description', 'instructions',
          'exercise_type', 'created_at', 'updated_at'
        ]
      );
    }
    
    // Exercise templates CSV
    if (data.exercise_templates.length > 0) {
      csvFiles['exercise_templates.csv'] = this.arrayToCsv(
        data.exercise_templates.map(template => ({
          ...template,
          muscle_groups: template.muscle_groups.join(';') // Convert array to semicolon-separated string
        })), 
        [
          'template_id', 'name', 'muscle_groups', 'equipment_id', 'exercise_category',
          'exercise_type', 'default_value_1_type', 'default_value_2_type', 'description',
          'instructions', 'created_at', 'updated_at'
        ]
      );
    }
    
    return csvFiles;
  }

  private arrayToCsv(data: any[], columns: string[]): string {
    const header = columns.join(',');
    const rows = data.map(row => 
      columns.map(col => {
        const value = row[col];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') {
          // Escape quotes and wrap in quotes if contains comma or quotes
          const escaped = value.replace(/"/g, '""');
          return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') 
            ? `"${escaped}"` 
            : escaped;
        }
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return String(value);
      }).join(',')
    );
    
    return [header, ...rows].join('\n');
  }
}

export class JsonFormatter {
  /**
   * Format tenant data as pretty JSON
   */
  formatTenantData(data: TenantExportData): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Format global data as pretty JSON
   */
  formatGlobalData(data: GlobalExportData): string {
    return JSON.stringify(data, null, 2);
  }
}

// Export formatter instances
export const sqlFormatter = new SqlFormatter();
export const csvFormatter = new CsvFormatter();
export const jsonFormatter = new JsonFormatter();