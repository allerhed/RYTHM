import { Database } from './database';
import { sqlFormatter, csvFormatter, jsonFormatter } from './formatters';

// Types for export/import data structures
export interface TenantExportData {
  tenant: {
    tenant_id: string;
    name: string;
    branding: any;
    created_at: string;
    updated_at: string;
  };
  users?: Array<{
    user_id: string;
    email: string;
    password_hash: string;
    role: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    about?: string;
    created_at: string;
    updated_at: string;
  }>;
  programs?: Array<{
    program_id: string;
    name: string;
    description?: string;
    duration_weeks: number;
    created_at: string;
    updated_at: string;
    workouts: Array<{
      workout_id: string;
      name: string;
      day_index: number;
      created_at: string;
      updated_at: string;
    }>;
  }>;
  sessions?: Array<{
    session_id: string;
    user_id: string;
    program_id?: string;
    started_at: string;
    completed_at?: string;
    category: string;
    notes?: string;
    training_load?: number;
    perceived_exertion?: number;
    name?: string;
    duration_seconds?: number;
    created_at: string;
    updated_at: string;
    sets: Array<{
      set_id: string;
      exercise_id: string;
      set_index: number;
      reps?: number;
      value_1_type?: string;
      value_1_numeric?: number;
      value_2_type?: string;
      value_2_numeric?: number;
      notes?: string;
      created_at: string;
      updated_at: string;
    }>;
  }>;
  program_assignments?: Array<{
    assignment_id: string;
    program_id: string;
    user_id: string;
    assigned_at: string;
    starts_at: string;
    created_at: string;
    updated_at: string;
  }>;
}

export interface GlobalExportData {
  exercises: Array<{
    exercise_id: string;
    name: string;
    muscle_groups: string[];
    equipment_id?: string;
    exercise_category: string;
    default_value_1_type?: string;
    default_value_2_type?: string;
    description?: string;
    instructions?: string;
    exercise_type: string;
    created_at: string;
    updated_at: string;
  }>;
  exercise_templates: Array<{
    template_id: string;
    name: string;
    muscle_groups: string[];
    equipment_id?: string;
    exercise_category: string;
    exercise_type: string;
    default_value_1_type?: string;
    default_value_2_type?: string;
    description?: string;
    instructions?: string;
    created_at: string;
    updated_at: string;
  }>;
  equipment: Array<{
    equipment_id: string;
    name: string;
    category: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }>;
}

export interface ExportOptions {
  includeUsers?: boolean;
  includeWorkoutData?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  format: 'json' | 'sql' | 'csv';
}

export interface ImportOptions {
  mergeStrategy: 'replace' | 'merge' | 'skip-existing';
  validateReferences?: boolean;
  dryRun?: boolean;
  createBackup?: boolean;
  includeWorkoutData?: boolean;
}

export interface ExportResult {
  success: boolean;
  data?: TenantExportData | GlobalExportData;
  filename?: string;
  size?: number;
  error?: string;
  formattedData?: string | Record<string, string>;
  metadata: {
    exportType: 'tenant' | 'global' | 'full';
    tenantId?: string;
    recordCounts: Record<string, number>;
    exportedAt: Date;
    format: string;
  };
}

export interface ImportResult {
  success: boolean;
  recordsImported: Record<string, number>;
  recordsSkipped: Record<string, number>;
  errors: string[];
  warnings: string[];
  backupCreated?: string;
  rollbackAvailable: boolean;
}

export class DataExporter {
  constructor(private db: Database) {}

  /**
   * Format export data based on requested format
   */
  private formatData(data: TenantExportData | GlobalExportData, format: string): string | Record<string, string> {
    switch (format) {
      case 'sql':
        if ('tenant' in data) {
          return sqlFormatter.formatTenantData(data as TenantExportData);
        } else {
          return sqlFormatter.formatGlobalData(data as GlobalExportData);
        }
      case 'csv':
        if ('tenant' in data) {
          return csvFormatter.formatTenantData(data as TenantExportData);
        } else {
          return csvFormatter.formatGlobalData(data as GlobalExportData);
        }
      case 'json':
      default:
        if ('tenant' in data) {
          return jsonFormatter.formatTenantData(data as TenantExportData);
        } else {
          return jsonFormatter.formatGlobalData(data as GlobalExportData);
        }
    }
  }

  /**
   * Export all data for a specific tenant
   */
  async exportTenant(tenantId: string, options: ExportOptions = { format: 'json' }): Promise<ExportResult> {
    try {
      const metadata = {
        exportType: 'tenant' as const,
        tenantId,
        recordCounts: {} as Record<string, number>,
        exportedAt: new Date(),
        format: options.format
      };

      // Export tenant info
      const tenantResult = await this.db.query(
        'SELECT * FROM tenants WHERE tenant_id = $1',
        [tenantId]
      );

      if (tenantResult.rows.length === 0) {
        return {
          success: false,
          error: 'Tenant not found',
          metadata
        };
      }

      const exportData: TenantExportData = {
        tenant: tenantResult.rows[0]
      };

      metadata.recordCounts.tenants = 1;

      // Export users if requested
      if (options.includeUsers) {
        const usersResult = await this.db.query(
          'SELECT * FROM users WHERE tenant_id = $1 ORDER BY created_at',
          [tenantId]
        );
        exportData.users = usersResult.rows;
        metadata.recordCounts.users = usersResult.rows.length;
      }

      // Export programs
      const programsResult = await this.db.query(`
        SELECT p.*, 
               json_agg(
                 json_build_object(
                   'workout_id', w.workout_id,
                   'name', w.name,
                   'day_index', w.day_index,
                   'created_at', w.created_at,
                   'updated_at', w.updated_at
                 ) ORDER BY w.day_index
               ) as workouts
        FROM programs p
        LEFT JOIN workouts w ON w.program_id = p.program_id
        WHERE p.tenant_id = $1
        GROUP BY p.program_id
        ORDER BY p.created_at
      `, [tenantId]);

      exportData.programs = programsResult.rows.map(row => ({
        ...row,
        workouts: row.workouts || []
      }));
      metadata.recordCounts.programs = programsResult.rows.length;

      // Export workout data if requested
      if (options.includeWorkoutData) {
        let sessionQuery = `
          SELECT s.*,
                 json_agg(
                   json_build_object(
                     'set_id', st.set_id,
                     'exercise_id', st.exercise_id,
                     'set_index', st.set_index,
                     'reps', st.reps,
                     'value_1_type', st.value_1_type,
                     'value_1_numeric', st.value_1_numeric,
                     'value_2_type', st.value_2_type,
                     'value_2_numeric', st.value_2_numeric,
                     'notes', st.notes,
                     'created_at', st.created_at,
                     'updated_at', st.updated_at
                   ) ORDER BY st.set_index
                 ) as sets
          FROM sessions s
          LEFT JOIN sets st ON st.session_id = s.session_id
          WHERE s.tenant_id = $1
        `;

        const queryParams = [tenantId];

        // Add date range filter if specified
        if (options.dateRange) {
          sessionQuery += ' AND s.started_at >= $2 AND s.started_at <= $3';
          queryParams.push(options.dateRange.start.toISOString(), options.dateRange.end.toISOString());
        }

        sessionQuery += ' GROUP BY s.session_id ORDER BY s.started_at DESC';

        const sessionsResult = await this.db.query(sessionQuery, queryParams);
        
        exportData.sessions = sessionsResult.rows.map(row => ({
          ...row,
          sets: row.sets || []
        }));
        metadata.recordCounts.sessions = sessionsResult.rows.length;

        // Export program assignments
        const assignmentsResult = await this.db.query(
          'SELECT * FROM program_assignments WHERE tenant_id = $1 ORDER BY assigned_at',
          [tenantId]
        );
        exportData.program_assignments = assignmentsResult.rows;
        metadata.recordCounts.program_assignments = assignmentsResult.rows.length;
      }

      return {
        success: true,
        data: exportData,
        filename: `tenant-${tenantId}-${new Date().toISOString().split('T')[0]}.${options.format}`,
        metadata,
        formattedData: this.formatData(exportData, options.format)
      };

    } catch (error) {
      console.error('Export error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
        metadata: {
          exportType: 'tenant',
          tenantId,
          recordCounts: {},
          exportedAt: new Date(),
          format: options.format
        }
      };
    }
  }

  /**
   * Export global data (exercises, equipment, templates)
   */
  async exportGlobalData(options: ExportOptions = { format: 'json' }): Promise<ExportResult> {
    try {
      const metadata = {
        exportType: 'global' as const,
        recordCounts: {} as Record<string, number>,
        exportedAt: new Date(),
        format: options.format
      };

      // Export equipment
      const equipmentResult = await this.db.query(
        'SELECT * FROM equipment ORDER BY name'
      );

      // Export exercises
      const exercisesResult = await this.db.query(
        'SELECT * FROM exercises ORDER BY name'
      );

      // Export exercise templates
      const templatesResult = await this.db.query(
        'SELECT * FROM exercise_templates ORDER BY name'
      );

      const exportData: GlobalExportData = {
        equipment: equipmentResult.rows,
        exercises: exercisesResult.rows,
        exercise_templates: templatesResult.rows
      };

      metadata.recordCounts = {
        equipment: equipmentResult.rows.length,
        exercises: exercisesResult.rows.length,
        exercise_templates: templatesResult.rows.length
      };

      return {
        success: true,
        data: exportData,
        filename: `global-data-${new Date().toISOString().split('T')[0]}.${options.format}`,
        metadata,
        formattedData: this.formatData(exportData, options.format)
      };

    } catch (error) {
      console.error('Global export error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Global export failed',
        metadata: {
          exportType: 'global',
          recordCounts: {},
          exportedAt: new Date(),
          format: options.format
        }
      };
    }
  }

  /**
   * Export all system data
   */
  async exportAll(options: ExportOptions = { format: 'json' }): Promise<ExportResult> {
    try {
      const metadata = {
        exportType: 'full' as const,
        recordCounts: {} as Record<string, number>,
        exportedAt: new Date(),
        format: options.format
      };

      // Get all tenants except admin tenant
      const tenantsResult = await this.db.query(
        'SELECT tenant_id FROM tenants WHERE tenant_id != $1',
        ['00000000-0000-0000-0000-000000000000']
      );

      const globalData = await this.exportGlobalData(options);
      const tenantExports: Record<string, TenantExportData> = {};

      for (const tenant of tenantsResult.rows) {
        const tenantExport = await this.exportTenant(tenant.tenant_id, options);
        if (tenantExport.success && tenantExport.data) {
          tenantExports[tenant.tenant_id] = tenantExport.data as TenantExportData;
        }
      }

      const fullExportData = {
        global: globalData.data,
        tenants: tenantExports,
        metadata: {
          exportedAt: new Date(),
          totalTenants: tenantsResult.rows.length,
          format: options.format
        }
      };

      return {
        success: true,
        data: fullExportData as any,
        filename: `full-system-${new Date().toISOString().split('T')[0]}.${options.format}`,
        metadata
      };

    } catch (error) {
      console.error('Full export error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Full export failed',
        metadata: {
          exportType: 'full',
          recordCounts: {},
          exportedAt: new Date(),
          format: options.format
        }
      };
    }
  }
}

export class DataImporter {
  constructor(private db: Database) {}

  /**
   * Import tenant data with validation and conflict resolution
   */
  async importTenant(data: TenantExportData, options: ImportOptions): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      recordsImported: {},
      recordsSkipped: {},
      errors: [],
      warnings: [],
      rollbackAvailable: false
    };

    try {
      // Start transaction for rollback capability
      await this.db.transaction(async (client) => {
        // Create backup if requested
        if (options.createBackup) {
          const backupFilename = `backup-${data.tenant.tenant_id}-${Date.now()}.sql`;
          result.backupCreated = backupFilename;
          // Backup implementation would go here
        }

        // Validate references if requested
        if (options.validateReferences) {
          await this.validateTenantData(data, client);
        }

        // Import tenant
        if (options.mergeStrategy === 'replace') {
          // Delete existing tenant data first
          await client.query('DELETE FROM tenants WHERE tenant_id = $1', [data.tenant.tenant_id]);
        }

        // Check if tenant exists
        const existingTenant = await client.query(
          'SELECT tenant_id FROM tenants WHERE tenant_id = $1',
          [data.tenant.tenant_id]
        );

        if (existingTenant.rows.length === 0 || options.mergeStrategy === 'replace') {
          await client.query(`
            INSERT INTO tenants (tenant_id, name, branding, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (tenant_id) DO UPDATE SET
              name = EXCLUDED.name,
              branding = EXCLUDED.branding,
              updated_at = EXCLUDED.updated_at
          `, [
            data.tenant.tenant_id,
            data.tenant.name,
            data.tenant.branding,
            data.tenant.created_at,
            data.tenant.updated_at
          ]);
          result.recordsImported.tenants = 1;
        } else {
          result.recordsSkipped.tenants = 1;
        }

        // Import users
        if (data.users) {
          let importedUsers = 0;
          let skippedUsers = 0;

          for (const user of data.users) {
            try {
              if (options.mergeStrategy === 'skip-existing') {
                const exists = await client.query(
                  'SELECT user_id FROM users WHERE email = $1 AND tenant_id = $2',
                  [user.email, data.tenant.tenant_id]
                );
                if (exists.rows.length > 0) {
                  skippedUsers++;
                  continue;
                }
              }

              await client.query(`
                INSERT INTO users (
                  user_id, tenant_id, email, password_hash, role, 
                  first_name, last_name, avatar_url, about, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (tenant_id, email) DO UPDATE SET
                  password_hash = EXCLUDED.password_hash,
                  role = EXCLUDED.role,
                  first_name = EXCLUDED.first_name,
                  last_name = EXCLUDED.last_name,
                  avatar_url = EXCLUDED.avatar_url,
                  about = EXCLUDED.about,
                  updated_at = EXCLUDED.updated_at
              `, [
                user.user_id, data.tenant.tenant_id, user.email, user.password_hash, user.role,
                user.first_name, user.last_name, user.avatar_url, user.about,
                user.created_at, user.updated_at
              ]);
              importedUsers++;
            } catch (error) {
              result.errors.push(`Failed to import user ${user.email}: ${error}`);
            }
          }

          result.recordsImported.users = importedUsers;
          result.recordsSkipped.users = skippedUsers;
        }

        // Import programs and workouts
        if (data.programs) {
          let importedPrograms = 0;
          let importedWorkouts = 0;

          for (const program of data.programs) {
            try {
              await client.query(`
                INSERT INTO programs (
                  program_id, tenant_id, name, description, duration_weeks, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (program_id) DO UPDATE SET
                  name = EXCLUDED.name,
                  description = EXCLUDED.description,
                  duration_weeks = EXCLUDED.duration_weeks,
                  updated_at = EXCLUDED.updated_at
              `, [
                program.program_id, data.tenant.tenant_id, program.name, 
                program.description, program.duration_weeks, program.created_at, program.updated_at
              ]);
              importedPrograms++;

              // Import workouts for this program
              for (const workout of program.workouts) {
                await client.query(`
                  INSERT INTO workouts (
                    workout_id, program_id, tenant_id, name, day_index, created_at, updated_at
                  )
                  VALUES ($1, $2, $3, $4, $5, $6, $7)
                  ON CONFLICT (workout_id) DO UPDATE SET
                    name = EXCLUDED.name,
                    day_index = EXCLUDED.day_index,
                    updated_at = EXCLUDED.updated_at
                `, [
                  workout.workout_id, program.program_id, data.tenant.tenant_id,
                  workout.name, workout.day_index, workout.created_at, workout.updated_at
                ]);
                importedWorkouts++;
              }
            } catch (error) {
              result.errors.push(`Failed to import program ${program.name}: ${error}`);
            }
          }

          result.recordsImported.programs = importedPrograms;
          result.recordsImported.workouts = importedWorkouts;
        }

        // Import sessions and sets
        if (data.sessions && options.includeWorkoutData) {
          let importedSessions = 0;
          let importedSets = 0;

          for (const session of data.sessions) {
            try {
              await client.query(`
                INSERT INTO sessions (
                  session_id, tenant_id, user_id, program_id, started_at, completed_at,
                  category, notes, training_load, perceived_exertion, name, duration_seconds,
                  created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                ON CONFLICT (session_id) DO UPDATE SET
                  completed_at = EXCLUDED.completed_at,
                  notes = EXCLUDED.notes,
                  training_load = EXCLUDED.training_load,
                  perceived_exertion = EXCLUDED.perceived_exertion,
                  name = EXCLUDED.name,
                  duration_seconds = EXCLUDED.duration_seconds,
                  updated_at = EXCLUDED.updated_at
              `, [
                session.session_id, data.tenant.tenant_id, session.user_id, session.program_id,
                session.started_at, session.completed_at, session.category, session.notes,
                session.training_load, session.perceived_exertion, session.name,
                session.duration_seconds, session.created_at, session.updated_at
              ]);
              importedSessions++;

              // Import sets for this session
              for (const set of session.sets) {
                await client.query(`
                  INSERT INTO sets (
                    set_id, tenant_id, session_id, exercise_id, set_index, reps,
                    value_1_type, value_1_numeric, value_2_type, value_2_numeric,
                    notes, created_at, updated_at
                  )
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                  ON CONFLICT (set_id) DO UPDATE SET
                    reps = EXCLUDED.reps,
                    value_1_type = EXCLUDED.value_1_type,
                    value_1_numeric = EXCLUDED.value_1_numeric,
                    value_2_type = EXCLUDED.value_2_type,
                    value_2_numeric = EXCLUDED.value_2_numeric,
                    notes = EXCLUDED.notes,
                    updated_at = EXCLUDED.updated_at
                `, [
                  set.set_id, data.tenant.tenant_id, session.session_id, set.exercise_id,
                  set.set_index, set.reps, set.value_1_type, set.value_1_numeric,
                  set.value_2_type, set.value_2_numeric, set.notes, set.created_at, set.updated_at
                ]);
                importedSets++;
              }
            } catch (error) {
              result.errors.push(`Failed to import session ${session.session_id}: ${error}`);
            }
          }

          result.recordsImported.sessions = importedSessions;
          result.recordsImported.sets = importedSets;
        }

        // Import program assignments
        if (data.program_assignments) {
          let importedAssignments = 0;

          for (const assignment of data.program_assignments) {
            try {
              await client.query(`
                INSERT INTO program_assignments (
                  assignment_id, tenant_id, program_id, user_id, assigned_at, starts_at, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (tenant_id, program_id, user_id) DO UPDATE SET
                  assigned_at = EXCLUDED.assigned_at,
                  starts_at = EXCLUDED.starts_at,
                  updated_at = EXCLUDED.updated_at
              `, [
                assignment.assignment_id, data.tenant.tenant_id, assignment.program_id,
                assignment.user_id, assignment.assigned_at, assignment.starts_at,
                assignment.created_at, assignment.updated_at
              ]);
              importedAssignments++;
            } catch (error) {
              result.errors.push(`Failed to import assignment ${assignment.assignment_id}: ${error}`);
            }
          }

          result.recordsImported.program_assignments = importedAssignments;
        }

        result.success = true;
        result.rollbackAvailable = true;
      });

    } catch (error) {
      console.error('Import error:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Import failed');
    }

    return result;
  }

  /**
   * Import global data (exercises, equipment, templates)
   */
  async importGlobalData(data: GlobalExportData, options: ImportOptions): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      recordsImported: {},
      recordsSkipped: {},
      errors: [],
      warnings: [],
      rollbackAvailable: false
    };

    try {
      await this.db.transaction(async (client) => {
        // Import equipment
        let importedEquipment = 0;
        for (const equipment of data.equipment) {
          try {
            if (options.mergeStrategy === 'skip-existing') {
              const exists = await client.query('SELECT equipment_id FROM equipment WHERE name = $1', [equipment.name]);
              if (exists.rows.length > 0) {
                result.recordsSkipped.equipment = (result.recordsSkipped.equipment || 0) + 1;
                continue;
              }
            }

            await client.query(`
              INSERT INTO equipment (equipment_id, name, category, description, is_active, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              ON CONFLICT (name) DO UPDATE SET
                category = EXCLUDED.category,
                description = EXCLUDED.description,
                is_active = EXCLUDED.is_active,
                updated_at = EXCLUDED.updated_at
            `, [
              equipment.equipment_id, equipment.name, equipment.category,
              equipment.description, equipment.is_active, equipment.created_at, equipment.updated_at
            ]);
            importedEquipment++;
          } catch (error) {
            result.errors.push(`Failed to import equipment ${equipment.name}: ${error}`);
          }
        }
        result.recordsImported.equipment = importedEquipment;

        // Import exercises
        let importedExercises = 0;
        for (const exercise of data.exercises) {
          try {
            if (options.mergeStrategy === 'skip-existing') {
              const exists = await client.query('SELECT exercise_id FROM exercises WHERE name = $1', [exercise.name]);
              if (exists.rows.length > 0) {
                result.recordsSkipped.exercises = (result.recordsSkipped.exercises || 0) + 1;
                continue;
              }
            }

            await client.query(`
              INSERT INTO exercises (
                exercise_id, name, muscle_groups, equipment_id, exercise_category,
                default_value_1_type, default_value_2_type, description, instructions,
                exercise_type, created_at, updated_at
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
              ON CONFLICT (name) DO UPDATE SET
                muscle_groups = EXCLUDED.muscle_groups,
                equipment_id = EXCLUDED.equipment_id,
                exercise_category = EXCLUDED.exercise_category,
                default_value_1_type = EXCLUDED.default_value_1_type,
                default_value_2_type = EXCLUDED.default_value_2_type,
                description = EXCLUDED.description,
                instructions = EXCLUDED.instructions,
                exercise_type = EXCLUDED.exercise_type,
                updated_at = EXCLUDED.updated_at
            `, [
              exercise.exercise_id, exercise.name, exercise.muscle_groups, exercise.equipment_id,
              exercise.exercise_category, exercise.default_value_1_type, exercise.default_value_2_type,
              exercise.description, exercise.instructions, exercise.exercise_type,
              exercise.created_at, exercise.updated_at
            ]);
            importedExercises++;
          } catch (error) {
            result.errors.push(`Failed to import exercise ${exercise.name}: ${error}`);
          }
        }
        result.recordsImported.exercises = importedExercises;

        // Import exercise templates
        let importedTemplates = 0;
        for (const template of data.exercise_templates) {
          try {
            if (options.mergeStrategy === 'skip-existing') {
              const exists = await client.query('SELECT template_id FROM exercise_templates WHERE name = $1', [template.name]);
              if (exists.rows.length > 0) {
                result.recordsSkipped.exercise_templates = (result.recordsSkipped.exercise_templates || 0) + 1;
                continue;
              }
            }

            await client.query(`
              INSERT INTO exercise_templates (
                template_id, name, muscle_groups, equipment_id, exercise_category,
                exercise_type, default_value_1_type, default_value_2_type,
                description, instructions, created_at, updated_at
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
              ON CONFLICT (template_id) DO UPDATE SET
                name = EXCLUDED.name,
                muscle_groups = EXCLUDED.muscle_groups,
                equipment_id = EXCLUDED.equipment_id,
                exercise_category = EXCLUDED.exercise_category,
                exercise_type = EXCLUDED.exercise_type,
                default_value_1_type = EXCLUDED.default_value_1_type,
                default_value_2_type = EXCLUDED.default_value_2_type,
                description = EXCLUDED.description,
                instructions = EXCLUDED.instructions,
                updated_at = EXCLUDED.updated_at
            `, [
              template.template_id, template.name, template.muscle_groups, template.equipment_id,
              template.exercise_category, template.exercise_type, template.default_value_1_type,
              template.default_value_2_type, template.description, template.instructions,
              template.created_at, template.updated_at
            ]);
            importedTemplates++;
          } catch (error) {
            result.errors.push(`Failed to import template ${template.name}: ${error}`);
          }
        }
        result.recordsImported.exercise_templates = importedTemplates;

        result.success = true;
        result.rollbackAvailable = true;
      });

    } catch (error) {
      console.error('Global import error:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Global import failed');
    }

    return result;
  }

  /**
   * Validate tenant data references and integrity
   */
  private async validateTenantData(data: TenantExportData, client: any): Promise<void> {
    const errors: string[] = [];

    // Validate exercise references in sets
    if (data.sessions) {
      const exerciseIds = new Set<string>();
      data.sessions.forEach(session => {
        session.sets.forEach(set => {
          exerciseIds.add(set.exercise_id);
        });
      });

      for (const exerciseId of exerciseIds) {
        const exists = await client.query('SELECT exercise_id FROM exercises WHERE exercise_id = $1', [exerciseId]);
        if (exists.rows.length === 0) {
          errors.push(`Exercise ${exerciseId} referenced in sets but not found in global exercises`);
        }
      }
    }

    // Validate user references
    if (data.sessions && data.users) {
      const userIds = new Set(data.users.map(u => u.user_id));
      data.sessions.forEach(session => {
        if (!userIds.has(session.user_id)) {
          errors.push(`Session ${session.session_id} references unknown user ${session.user_id}`);
        }
      });
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }
}

// Export singleton instances
import { db } from './database';

export const dataExporter = new DataExporter(db);
export const dataImporter = new DataImporter(db);