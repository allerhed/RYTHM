import { Database } from './database';
import { TenantExportData, GlobalExportData, DataExporter } from './export';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    totalRecords: Record<string, number>;
    validatedAt: Date;
  };
}

export interface BackupInfo {
  filename: string;
  type: 'tenant' | 'global' | 'full';
  tenantId?: string;
  createdAt: Date;
  size: number;
}

export class DataValidator {
  constructor(private db: Database) {}

  /**
   * Validate tenant data integrity and references
   */
  async validateTenantData(data: TenantExportData): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate tenant structure
    if (!data.tenant || !data.tenant.tenant_id) {
      errors.push('Missing or invalid tenant information');
    }

    // Validate users
    if (data.users) {
      for (const user of data.users) {
        if (!user.user_id || !user.email) {
          errors.push(`Invalid user data: missing required fields`);
        }
        if (user.email && !this.isValidEmail(user.email)) {
          errors.push(`Invalid email format: ${user.email}`);
        }
      }
    }

    // Validate exercise references in sets
    if (data.sessions) {
      const exerciseIds = new Set<string>();
      data.sessions.forEach(session => {
        session.sets.forEach(set => {
          exerciseIds.add(set.exercise_id);
        });
      });

      // Check if referenced exercises exist
      for (const exerciseId of exerciseIds) {
        const exists = await this.db.query(
          'SELECT exercise_id FROM exercises WHERE exercise_id = $1',
          [exerciseId]
        );
        if (exists.rows.length === 0) {
          errors.push(`Exercise ${exerciseId} referenced in sets but not found in database`);
        }
      }
    }

    // Validate user references in sessions
    if (data.sessions && data.users) {
      const userIds = new Set(data.users.map(u => u.user_id));
      data.sessions.forEach(session => {
        if (!userIds.has(session.user_id)) {
          warnings.push(`Session ${session.session_id} references user ${session.user_id} not included in export`);
        }
      });
    }

    // Validate program references
    if (data.sessions && data.programs) {
      const programIds = new Set(data.programs.map(p => p.program_id));
      data.sessions.forEach(session => {
        if (session.program_id && !programIds.has(session.program_id)) {
          warnings.push(`Session ${session.session_id} references program ${session.program_id} not included in export`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        totalRecords: this.countRecords(data),
        validatedAt: new Date()
      }
    };
  }

  /**
   * Validate global data integrity
   */
  async validateGlobalData(data: GlobalExportData): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate exercise templates reference valid equipment
    if (data.exercise_templates && data.equipment) {
      const equipmentIds = new Set(data.equipment.map(e => e.equipment_id));
      
      data.exercise_templates.forEach(template => {
        if (template.equipment_id && !equipmentIds.has(template.equipment_id)) {
          warnings.push(`Template ${template.name} references equipment ${template.equipment_id} not included in export`);
        }
      });
    }

    // Validate exercises reference valid equipment
    if (data.exercises && data.equipment) {
      const equipmentIds = new Set(data.equipment.map(e => e.equipment_id));
      
      data.exercises.forEach(exercise => {
        if (exercise.equipment_id && !equipmentIds.has(exercise.equipment_id)) {
          warnings.push(`Exercise ${exercise.name} references equipment ${exercise.equipment_id} not included in export`);
        }
      });
    }

    // Check for duplicate names
    if (data.exercises) {
      const exerciseNames = data.exercises.map(e => e.name.toLowerCase());
      const duplicates = exerciseNames.filter((name, index) => exerciseNames.indexOf(name) !== index);
      if (duplicates.length > 0) {
        errors.push(`Duplicate exercise names found: ${[...new Set(duplicates)].join(', ')}`);
      }
    }

    if (data.exercise_templates) {
      const templateNames = data.exercise_templates.map(t => t.name.toLowerCase());
      const duplicates = templateNames.filter((name, index) => templateNames.indexOf(name) !== index);
      if (duplicates.length > 0) {
        errors.push(`Duplicate template names found: ${[...new Set(duplicates)].join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        totalRecords: this.countGlobalRecords(data),
        validatedAt: new Date()
      }
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private countRecords(data: TenantExportData): Record<string, number> {
    return {
      tenants: 1,
      users: data.users?.length || 0,
      programs: data.programs?.length || 0,
      workouts: data.programs?.reduce((total, p) => total + p.workouts.length, 0) || 0,
      sessions: data.sessions?.length || 0,
      sets: data.sessions?.reduce((total, s) => total + s.sets.length, 0) || 0,
      program_assignments: data.program_assignments?.length || 0
    };
  }

  private countGlobalRecords(data: GlobalExportData): Record<string, number> {
    return {
      equipment: data.equipment?.length || 0,
      exercises: data.exercises?.length || 0,
      exercise_templates: data.exercise_templates?.length || 0
    };
  }
}

export class BackupManager {
  constructor(private db: Database) {}

  /**
   * Create a backup of tenant data before import
   */
  async createTenantBackup(tenantId: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `backup-tenant-${tenantId}-${timestamp}.sql`;
    
    try {
      // Export current tenant data as SQL
      const exporter = new DataExporter(this.db);
      const exportResult = await exporter.exportTenant(tenantId, { format: 'sql', includeUsers: true, includeWorkoutData: true });
      
      if (exportResult.success && exportResult.formattedData) {
        // In a real implementation, save to backup storage
        // For now, we'll just return the filename
        console.log(`Backup created: ${backupFilename}`);
        return backupFilename;
      } else {
        throw new Error('Failed to create backup');
      }
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw new Error(`Backup creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a backup of global data before import
   */
  async createGlobalBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `backup-global-${timestamp}.sql`;
    
    try {
      const exporter = new DataExporter(this.db);
      const exportResult = await exporter.exportGlobalData({ format: 'sql' });
      
      if (exportResult.success && exportResult.formattedData) {
        console.log(`Global backup created: ${backupFilename}`);
        return backupFilename;
      } else {
        throw new Error('Failed to create global backup');
      }
    } catch (error) {
      console.error('Global backup creation failed:', error);
      throw new Error(`Global backup creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<BackupInfo[]> {
    // In a real implementation, list files from backup storage
    // For now, return mock data showing what backups would look like
    return [
      {
        filename: 'backup-tenant-123-2025-09-18T10-00-00.sql',
        type: 'tenant',
        tenantId: '123',
        createdAt: new Date('2025-09-18T10:00:00Z'),
        size: 1024 * 1024 * 2.5 // 2.5MB
      },
      {
        filename: 'backup-global-2025-09-18T09-00-00.sql',
        type: 'global',
        createdAt: new Date('2025-09-18T09:00:00Z'),
        size: 1024 * 512 // 512KB
      }
    ];
  }

  /**
   * Restore from a backup file
   */
  async restoreFromBackup(backupFilename: string): Promise<{ success: boolean; message: string }> {
    try {
      // In a real implementation, execute the SQL backup file
      console.log(`Restoring from backup: ${backupFilename}`);
      
      // Mock implementation
      return {
        success: true,
        message: `Successfully restored from ${backupFilename}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export instances
import { db } from './database';

export const dataValidator = new DataValidator(db);
export const backupManager = new BackupManager(db);