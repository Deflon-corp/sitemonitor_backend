/**
 * @swagger
 * components:
 *   schemas:
 *     AdminCreateRequest:
 *       type: object
 *       required:
 *         - admin_first_name
 *         - admin_father_name
 *         - admin_last_name
 *         - admin_email
 *         - admin_phone
 *         - admin_password
 *       properties:
 *         admin_first_name:
 *           type: string
 *         admin_father_name:
 *           type: string
 *         admin_last_name:
 *           type: string
 *         admin_email:
 *           type: string
 *           format: email
 *         admin_phone:
 *           type: string
 *           description: "10 digit phone number"
 *           example: "9876543210"
 *         admin_login_id:
 *           type: string
 *           description: "Optional unique login identifier for admin"
 *         admin_password:
 *           type: string
 *           format: password
 *         profile_image:
 *           type: string
 *           format: binary
 *           description: "Optional profile image (jpg, jpeg, png, webp, max 5MB)"
 *         tenant_name:
 *           type: string
 *           description: "Required for new tenant. Unique company name."
 *         tenant_domain:
 *           type: string
 *           description: "Required for new tenant."
 *
 *     TenantResponse:
 *       type: object
 *       properties:
 *         tent_id:
 *           type: integer
 *         tent_name:
 *           type: string
 *         tent_domain:
 *           type: string
 *         tent_status:
 *           type: string
 *           example: "active"
 *         tent_plan:
 *           type: string
 *           example: "basic"
 *         tent_add_date:
 *           type: string
 *           format: date-time
 *         tent_created_at:
 *           type: string
 *           format: date-time
 *
 *     AdminCreateResponseWithTenant:
 *       type: object
 *       properties:
 *         tenant:
 *           $ref: '#/components/schemas/TenantResponse'
 *         admin:
 *           $ref: '#/components/schemas/AdminResponse'
 *
 *     AdminUpdateRequest:
 *       type: object
 *       properties:
 *         admin_first_name:
 *           type: string
 *         admin_father_name:
 *           type: string
 *         admin_last_name:
 *           type: string
 *         admin_email:
 *           type: string
 *           format: email
 *         admin_phone:
 *           type: string
 *         admin_login_id:
 *           type: string
 *         admin_password:
 *           type: string
 *           format: password
 *         profile_image:
 *           type: string
 *           format: binary
 *           description: "Optional profile image (jpg, jpeg, png, webp, max 5MB)"
 *
 *     AdminLoginRequest:
 *       type: object
 *       required:
 *         - login_id
 *         - login_password
 *       properties:
 *         login_id:
 *           type: string
 *           description: "Admin email, phone, or login_id"
 *           example: "admin@example.com"
 *         login_password:
 *           type: string
 *           format: password
 *
 *     AdminResponse:
 *       type: object
 *       properties:
 *         admin_id:
 *           type: integer
 *         admin_first_name:
 *           type: string
 *         admin_father_name:
 *           type: string
 *         admin_last_name:
 *           type: string
 *         admin_email:
 *           type: string
 *         admin_phone:
 *           type: string
 *         admin_login_id:
 *           type: string
 *         admin_role:
 *           type: string
 *           example: "admin"
 *         admin_status:
 *           type: string
 *           example: "active"
 *         admin_tent_id:
 *           type: integer
 *           description: "Present when admin was created with a new tenant"
 *
 *     AdminLoginResponse:
 *       type: object
 *       properties:
 *         access_token:
 *           type: string
 *         refresh_token:
 *           type: string
 *         admin:
 *           $ref: '#/components/schemas/AdminResponse'
 */

/**
 * @swagger
 * /api/admin:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create admin (new tenant + admin, or admin in existing tenant)
 *     description: |
 *       **Two modes:**
 *       1. **Create new tenant + first admin** – Send `tenant_name` and `tenant_domain` in body (no tenant_id header).
 *          Creates DB `tenant_<tenant_name>`, inserts tenant in master DB, then creates admin in that tenant DB.
 *          tenant_name must be unique.
 *       2. **Create admin in existing tenant** – Send `tenant_id` header (e.g. tenant_abccompany) and only admin fields in body.
 *       Both require super admin JWT (Authorization: Bearer <token>).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/AdminCreateRequest'
 *           examples:
 *             newTenantAndAdmin:
 *               summary: Create new tenant and admin
 *               value:
 *                 tenant_name: "abccompany"
 *                 tenant_domain: "company.com"
 *                 admin_first_name: "John"
 *                 admin_father_name: "K"
 *                 admin_last_name: "Doe"
 *                 admin_login_id: "john.doe"
 *                 admin_email: "admin@company.com"
 *                 admin_phone: "9876543210"
 *                 admin_password: "secret123"
 *             existingTenantAdmin:
 *               summary: Create admin in existing tenant
 *               value:
 *                 admin_first_name: "Jane"
 *                 admin_father_name: "M"
 *                 admin_last_name: "Doe"
 *                 admin_login_id: "jane.doe"
 *                 admin_email: "jane@company.com"
 *                 admin_phone: "9876543211"
 *                 admin_password: "secret456"
 *     responses:
 *       201:
 *         description: Admin created (or tenant + admin created)
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
 *                   oneOf:
 *                     - type: object
 *                       description: When creating new tenant + admin
 *                       properties:
 *                         tenant:
 *                           $ref: '#/components/schemas/TenantResponse'
 *                         admin:
 *                           $ref: '#/components/schemas/AdminResponse'
 *                     - type: object
 *                       description: When creating admin in existing tenant
 *                       properties:
 *                         admin_id:
 *                           type: integer
 *                         admin_first_name:
 *                           type: string
 *                         admin_father_name:
 *                           type: string
 *                         admin_last_name:
 *                           type: string
 *                         admin_email:
 *                           type: string
 *                         admin_phone:
 *                           type: string
 *                         admin_login_id:
 *                           type: string
 *       400:
 *         description: Validation error (e.g. missing tenant_name/tenant_domain or admin fields)
 *       409:
 *         description: Tenant name already exists, or email/phone/login_id already exists
 *
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all admins (requires logged-in super admin)
 *     description: |
 *       Retrieves a list of administrators for the tenant specified in the `tenant_id` header.
 *       Requires a valid Super Admin JWT.
 *     security:
 *       - bearerAuth: []
 *         tenant_id: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - name: admin_status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         description: Filter by admin status
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Search by name, email, or phone
 *     responses:
 *       200:
 *         description: Admins retrieved successfully
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
 *                     admins:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AdminResponse'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Super admin access required
 */

/**
 * @swagger
 * /api/admin/{admin_id}:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Update admin
 *     parameters:
 *       - name: admin_id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/AdminUpdateRequest'
 *     responses:
 *       200:
 *         description: Admin updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Admin not found
 *
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete admin (soft delete)
 *     parameters:
 *       - name: admin_id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Admin deleted successfully
 *       404:
 *         description: Admin not found
 */

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Login admin
 *     description: Login admin and receive JWT token.
 *     security:
 *       - tenant_id: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLoginRequest'
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
 *                   $ref: '#/components/schemas/AdminLoginResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /api/admin/refresh:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Refresh admin JWT tokens
 *     description: "Use a valid refresh token to get new access and refresh tokens. Requires tenant_id header and Authorization: Bearer <refresh_token>."
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


