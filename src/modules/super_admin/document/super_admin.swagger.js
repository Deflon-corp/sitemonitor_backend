/**
 * @swagger
 * components:
 *   schemas:
 *     SuperAdminCreateRequest:
 *       type: object
 *       required:
 *         - sa_first_name
 *         - sa_father_name
 *         - sa_last_name
 *         - sa_email
 *         - sa_phone
 *         - sa_password
 *       properties:
 *         sa_first_name:
 *           type: string
 *         sa_father_name:
 *           type: string
 *         sa_last_name:
 *           type: string
 *         sa_email:
 *           type: string
 *           format: email
 *         sa_phone:
 *           type: string
 *           description: "10 digit phone number"
 *           example: "9876543210"
 *         sa_login_id:
 *           type: string
 *           description: "Optional unique login identifier for super admin"
 *         sa_password:
 *           type: string
 *           format: password
 *
 *     SuperAdminUpdateRequest:
 *       type: object
 *       properties:
 *         sa_first_name:
 *           type: string
 *         sa_father_name:
 *           type: string
 *         sa_last_name:
 *           type: string
 *         sa_email:
 *           type: string
 *           format: email
 *         sa_phone:
 *           type: string
 *         sa_login_id:
 *           type: string
 *         sa_password:
 *           type: string
 *           format: password
 *
 *     SuperAdminResponse:
 *       type: object
 *       properties:
 *         sa_id:
 *           type: integer
 *         sa_first_name:
 *           type: string
 *         sa_father_name:
 *           type: string
 *         sa_last_name:
 *           type: string
 *         sa_email:
 *           type: string
 *         sa_phone:
 *           type: string
 *         sa_login_id:
 *           type: string
 *
 *     SuperAdminLoginRequest:
 *       type: object
 *       required:
 *         - login_id
 *         - login_password
 *       properties:
 *         login_id:
 *           type: string
 *           description: "Super admin email, phone, or login_id"
 *           example: "superadmin@example.com"
 *         login_password:
 *           type: string
 *           format: password
 *
 *     SuperAdminLoginResponse:
 *       type: object
 *       properties:
 *         access_token:
 *           type: string
 *         refresh_token:
 *           type: string
 *         super_admin:
 *           $ref: '#/components/schemas/SuperAdminResponse'
 */

/**
 * @swagger
 * /api/super_admin:
 *   post:
 *     tags:
 *       - Super Admin
 *     summary: Create a new super admin
 *     description: "Bootstrap endpoint to create the first super admin in master DB. No JWT token required, but requires header tenant_id=super."
 *     security:
 *       - tenant_id: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SuperAdminCreateRequest'
 *     responses:
 *       201:
 *         description: Super admin created successfully
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
 *                   $ref: '#/components/schemas/SuperAdminResponse'
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email or phone already exists
 */

/**
 * @swagger
 * /api/super_admin/{sa_id}:
 *   put:
 *     tags:
 *       - Super Admin
 *     summary: Update super admin
 *     security:
 *       - bearerAuth: []
 *         tenant_id: []
 *     parameters:
 *       - name: sa_id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SuperAdminUpdateRequest'
 *     responses:
 *       200:
 *         description: Super admin updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Super admin not found
 *
 *   delete:
 *     tags:
 *       - Super Admin
 *     summary: Delete super admin (soft delete)
 *     security:
 *       - bearerAuth: []
 *         tenant_id: []
 *     parameters:
 *       - name: sa_id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Super admin deleted successfully
 *       404:
 *         description: Super admin not found
 */

/**
 * @swagger
 * /api/super_admin/login:
 *   post:
 *     tags:
 *       - Super Admin
 *     summary: Login super admin
 *     description: "Login super admin and receive JWT token. Requires header tenant_id=super."
 *     security:
 *       - tenant_id: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SuperAdminLoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   $ref: '#/components/schemas/SuperAdminLoginResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /api/super_admin/refresh:
 *   post:
 *     tags:
 *       - Super Admin
 *     summary: Refresh super admin JWT tokens
 *     description: "Use a valid refresh token to get new access and refresh tokens. Requires header tenant_id=super and Authorization: Bearer <refresh_token>."
 *     security:
 *       - bearerAuth: []
 *         tenant_id: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
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
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                     refresh_token:
 *                       type: string
 *       400:
 *         description: Provided token is not a refresh token
 *       401:
 *         description: Invalid or expired refresh token
 */


