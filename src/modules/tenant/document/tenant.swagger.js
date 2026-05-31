/**
 * @swagger
 * components:
 *   schemas:
 *     TenantResponse:
 *       type: object
 *       properties:
 *         tent_id:
 *           type: integer
 *         tent_name:
 *           type: string
 *         tent_domain:
 *           type: string
 *         tent_expiry_date:
 *           type: string
 *           format: date-time
 *         tent_status:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         tent_plan:
 *           type: string
 *         tent_add_date:
 *           type: string
 *           format: date-time
 *         tent_created_at:
 *           type: string
 *           format: date-time
 *         tent_updated_at:
 *           type: string
 *           format: date-time
 *         tent_deleted_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         tent_is_deleted:
 *           type: boolean
 *
 *     TenantUpdateRequest:
 *       type: object
 *       properties:
 *         tent_name:
 *           type: string
 *           trim: true
 *           lowercase: true
 *         tent_domain:
 *           type: string
 *         tent_expiry_date:
 *           type: string
 *           format: date-time
 *         tent_status:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         tent_plan:
 *           type: string
 */

/**
 * @swagger
 * /api/tenant:
 *   get:
 *     tags:
 *       - Tenant (Super Admin)
 *     summary: Get all tenants
 *     description: "Returns all tenants. Requires super admin JWT and header tenant_id=super. Use query include_deleted=true to include soft-deleted tenants."
 *     security:
 *       - bearerAuth: []
 *       - tenant_id: []
 *     parameters:
 *       - name: include_deleted
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: "Set to true to include soft-deleted tenants"
 *     responses:
 *       200:
 *         description: Tenants fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TenantResponse'
 *                 total:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Super admin access required
 */

/**
 * @swagger
 * /api/tenant/{tent_id}:
 *   put:
 *     tags:
 *       - Tenant (Super Admin)
 *     summary: Update tenant
 *     description: "Update a tenant by tent_id. Requires super admin JWT and header tenant_id=super."
 *     security:
 *       - bearerAuth: []
 *       - tenant_id: []
 *     parameters:
 *       - name: tent_id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TenantUpdateRequest'
 *     responses:
 *       200:
 *         description: Tenant updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/TenantResponse'
 *       400:
 *         description: Validation error or no fields to update
 *       404:
 *         description: Tenant not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Super admin access required
 *
 *   delete:
 *     tags:
 *       - Tenant (Super Admin)
 *     summary: Delete tenant (soft delete)
 *     description: "Soft delete a tenant by tent_id. Requires super admin JWT and header tenant_id=super."
 *     security:
 *       - bearerAuth: []
 *       - tenant_id: []
 *     parameters:
 *       - name: tent_id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tenant deleted successfully
 *       404:
 *         description: Tenant not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Super admin access required
 */
