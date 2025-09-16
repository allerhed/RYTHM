import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { 
  CreateWorkoutTemplateRequest, 
  UpdateWorkoutTemplateRequest, 
  WorkoutTemplateFilters,
  TemplateScope
} from '@rythm/shared';
import { v4 as uuidv4 } from 'uuid';

export const workoutTemplatesRouter = router({
  // List workout templates with hierarchical access (user > tenant > system)
  list: protectedProcedure
    .input(WorkoutTemplateFilters)
    .query(async ({ input, ctx }) => {
      const { scope, search, category, limit, offset } = input;

      let query = `
        SELECT 
          wt.template_id,
          wt.tenant_id,
          wt.user_id,
          wt.name,
          wt.description,
          wt.scope,
          wt.exercises,
          wt.is_active,
          wt.created_at,
          wt.updated_at,
          u.first_name as created_by_name,
          u.last_name as created_by_lastname
        FROM workout_templates wt
        LEFT JOIN users u ON wt.created_by = u.user_id
        WHERE wt.is_active = true
        AND wt.tenant_id = $1
        AND (
          -- User's own templates
          (wt.scope = 'user' AND wt.user_id = $2)
          OR
          -- Tenant templates for user's tenant
          (wt.scope = 'tenant')
          OR
          -- System templates (visible to all)
          (wt.scope = 'system')
        )
      `;

      const params = [ctx.user.tenantId, ctx.user.userId];
      let paramIndex = 3;

      // Filter by scope if specified
      if (scope) {
        query += ` AND wt.scope = $${paramIndex}`;
        params.push(scope);
        paramIndex++;
      }

      // Filter by search term
      if (search) {
        query += ` AND (wt.name ILIKE $${paramIndex} OR wt.description ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Filter by category (search in exercises JSONB)
      if (category) {
        query += ` AND EXISTS (
          SELECT 1 FROM jsonb_array_elements(wt.exercises) AS exercise
          WHERE exercise->>'category' = $${paramIndex}
        )`;
        params.push(category);
        paramIndex++;
      }

      // Order by scope priority (user first, then tenant, then system) and name
      query += ` 
        ORDER BY 
          CASE wt.scope 
            WHEN 'user' THEN 1 
            WHEN 'tenant' THEN 2 
            WHEN 'system' THEN 3 
          END,
          wt.name ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit.toString(), offset.toString());

      const result = await ctx.db.query(query, params);
      return result.rows;
    }),

  // Count total templates for pagination
  count: protectedProcedure
    .input(WorkoutTemplateFilters.omit({ limit: true, offset: true }))
    .query(async ({ input, ctx }) => {
      const { scope, search, category } = input;

      let query = `
        SELECT COUNT(*) as total
        FROM workout_templates wt
        WHERE wt.is_active = true
        AND wt.tenant_id = $1
        AND (
          (wt.scope = 'user' AND wt.user_id = $2)
          OR (wt.scope = 'tenant')
          OR (wt.scope = 'system')
        )
      `;

      const params = [ctx.user.tenantId, ctx.user.userId];
      let paramIndex = 3;

      if (scope) {
        query += ` AND wt.scope = $${paramIndex}`;
        params.push(scope);
        paramIndex++;
      }

      if (search) {
        query += ` AND (wt.name ILIKE $${paramIndex} OR wt.description ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (category) {
        query += ` AND EXISTS (
          SELECT 1 FROM jsonb_array_elements(wt.exercises) AS exercise
          WHERE exercise->>'category' = $${paramIndex}
        )`;
        params.push(category);
        paramIndex++;
      }

      const result = await ctx.db.query(query, params);
      return parseInt(result.rows[0].total);
    }),

  // Get template by ID
  getById: protectedProcedure
    .input(z.object({ templateId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { templateId } = input;

      const result = await ctx.db.query(
        `SELECT 
          wt.*,
          u.first_name as created_by_name,
          u.last_name as created_by_lastname
        FROM workout_templates wt
        LEFT JOIN users u ON wt.created_by = u.user_id
        WHERE wt.template_id = $1 
        AND wt.is_active = true
        AND wt.tenant_id = $2
        AND (
          (wt.scope = 'user' AND wt.user_id = $3)
          OR (wt.scope = 'tenant')
          OR (wt.scope = 'system')
        )`,
        [templateId, ctx.user.tenantId, ctx.user.userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Template not found or access denied');
      }

      return result.rows[0];
    }),

  // Create new workout template (user scope only for regular users)
  create: protectedProcedure
    .input(CreateWorkoutTemplateRequest)
    .mutation(async ({ input, ctx }) => {
      const templateId = uuidv4();
      const { name, description, scope, exercises } = input;

      // Regular users can only create user-scoped templates
      const actualScope = ['tenant_admin', 'org_admin'].includes(ctx.user.role) ? scope : 'user';
      
      // Validate permissions for non-user scopes
      if (actualScope === 'tenant' && !['tenant_admin', 'org_admin'].includes(ctx.user.role)) {
        throw new Error('Insufficient permissions to create tenant templates');
      }
      if (actualScope === 'system' && ctx.user.role !== 'org_admin') {
        throw new Error('Insufficient permissions to create system templates');
      }

      // For user templates, set user_id. For tenant/system templates, user_id is NULL
      // For admin users (who might not exist in users table), set user_id to NULL even for user templates
      const userId = actualScope === 'user' && !ctx.user.role.includes('admin') ? ctx.user.userId : null;

      // For admin users (who might not exist in users table), set created_by to NULL
      // Regular users should have their userId in created_by
      const createdBy = ctx.user.role.includes('admin') ? null : ctx.user.userId;

      const result = await ctx.db.query(
        `INSERT INTO workout_templates (
          template_id, tenant_id, user_id, name, description, scope, exercises, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING template_id, name, scope, created_at`,
        [
          templateId,
          ctx.user.tenantId,
          userId,
          name,
          description || null,
          actualScope,
          JSON.stringify(exercises),
          createdBy
        ]
      );

      return result.rows[0];
    }),

  // Update workout template (only user's own templates)
  update: protectedProcedure
    .input(UpdateWorkoutTemplateRequest)
    .mutation(async ({ input, ctx }) => {
      const { template_id, name, description, exercises } = input;
      const scope = (input as any).scope; // Type will be fixed after package rebuild

      // Check if template exists and user has permission to edit
      const checkResult = await ctx.db.query(
        `SELECT scope, user_id, tenant_id FROM workout_templates 
        WHERE template_id = $1 AND is_active = true`,
        [template_id]
      );

      if (checkResult.rows.length === 0) {
        throw new Error('Template not found');
      }

      const template = checkResult.rows[0];

      // Permission check
      const canEdit = 
        // User can edit their own templates
        (template.scope === 'user' && template.user_id === ctx.user.userId) ||
        // Tenant admins can edit tenant templates in their tenant
        (template.scope === 'tenant' && template.tenant_id === ctx.user.tenantId && ['tenant_admin', 'org_admin'].includes(ctx.user.role)) ||
        // Org admins can edit system templates
        (template.scope === 'system' && ctx.user.role === 'org_admin') ||
        // Admin users can edit any template they have access to (admin users have null user_id in templates)
        (['tenant_admin', 'org_admin', 'admin', 'super_admin', 'system_admin'].includes(ctx.user.role) && 
         (template.user_id === null || template.scope !== 'user' || ctx.user.tenantId === template.tenant_id));

      if (!canEdit) {
        throw new Error('Insufficient permissions to edit this template');
      }

      // Build update query dynamically
      const updates = [];
      const params = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        params.push(name);
        paramIndex++;
      }

      if (description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        params.push(description);
        paramIndex++;
      }

      if (scope !== undefined) {
        // Validate scope change permissions
        if (scope !== template.scope) {
          const canChangeScope = ['tenant_admin', 'org_admin', 'admin', 'super_admin', 'system_admin'].includes(ctx.user.role);
          if (!canChangeScope) {
            throw new Error('Insufficient permissions to change template scope');
          }
        }
        updates.push(`scope = $${paramIndex}`);
        params.push(scope);
        paramIndex++;
      }

      if (exercises !== undefined) {
        updates.push(`exercises = $${paramIndex}`);
        params.push(JSON.stringify(exercises));
        paramIndex++;
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      params.push(template_id);

      const result = await ctx.db.query(
        `UPDATE workout_templates SET ${updates.join(', ')} 
        WHERE template_id = $${paramIndex}
        RETURNING template_id, name, scope, updated_at`,
        params
      );

      return result.rows[0];
    }),

  // Delete workout template (soft delete - only user's own templates)
  delete: protectedProcedure
    .input(z.object({ templateId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { templateId } = input;

      const result = await ctx.db.query(
        `UPDATE workout_templates 
        SET is_active = false
        WHERE template_id = $1 
        AND scope = 'user' 
        AND user_id = $2 
        AND tenant_id = $3
        RETURNING template_id`,
        [templateId, ctx.user.userId, ctx.user.tenantId]
      );

      if (result.rows.length === 0) {
        throw new Error('Template not found or access denied');
      }

      return { success: true };
    }),

  // Get templates for dropdown/selection (simplified response)
  getForSelection: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      limit: z.number().int().positive().max(50).default(20)
    }))
    .query(async ({ input, ctx }) => {
      const { search, limit } = input;

      let query = `
        SELECT 
          template_id,
          name,
          scope,
          description,
          jsonb_array_length(exercises) as exercise_count
        FROM workout_templates
        WHERE is_active = true
        AND tenant_id = $1
        AND (
          (scope = 'user' AND user_id = $2)
          OR (scope = 'tenant')
          OR (scope = 'system')
        )
      `;

      const params = [ctx.user.tenantId, ctx.user.userId];
      let paramIndex = 3;

      if (search) {
        query += ` AND name ILIKE $${paramIndex}`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      query += ` 
        ORDER BY 
          CASE scope 
            WHEN 'user' THEN 1 
            WHEN 'tenant' THEN 2 
            WHEN 'system' THEN 3 
          END,
          name ASC
        LIMIT $${paramIndex}
      `;
      params.push(limit.toString());

      const result = await ctx.db.query(query, params);
      return result.rows;
    }),
});