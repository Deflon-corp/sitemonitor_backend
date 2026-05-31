/**
 * @swagger
 * components:
 *   schemas:
 *     UserDomain:
 *       type: object
 *       properties:
 *         dm_id:
 *           type: string
 *           example: "domain_1"
 *         visible:
 *           type: boolean
 *           example: true
 *         send_report:
 *           type: boolean
 *           example: false
 *
 *     User:
 *       type: object
 *       properties:
 *         user_id:
 *           type: integer
 *           example: 1
 *           readOnly: true
 *         user_first_name:
 *           type: string
 *           example: John
 *         user_last_name:
 *           type: string
 *           example: Doe
 *         user_phone:
 *           type: string
 *           example: "1234567890"
 *         user_email:
 *           type: string
 *           format: email
 *           example: john.doe@example.com
 *         user_login_id:
 *           type: string
 *           example: johndoe
 *         user_language:
 *           type: string
 *           example: "en"
 *         user_is_account_admin:
 *           type: boolean
 *           example: false
 *         user_enable_export_notification:
 *           type: boolean
 *           example: false
 *         user_send_welcome_mail:
 *           type: boolean
 *           example: true
 *         user_status:
 *           type: string
 *           enum: [active, inactive, suspended, locked, expired]
 *           example: active
 *         user_all_modules_access:
 *           type: boolean
 *           example: true
 *         user_visible_policies:
 *           type: boolean
 *           example: true
 *         user_visible_qa:
 *           type: boolean
 *           example: true
 *         user_visible_accessibility:
 *           type: boolean
 *           example: true
 *         user_visible_seo:
 *           type: boolean
 *           example: true
 *         user_visible_heartbeat:
 *           type: boolean
 *           example: true
 *         user_visible_inventory:
 *           type: boolean
 *           example: true
 *         user_visible_statistics:
 *           type: boolean
 *           example: true
 *         user_visible_prioritized_content:
 *           type: boolean
 *           example: true
 *         user_visible_performance:
 *           type: boolean
 *           example: true
 *         user_domains:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserDomain'
 
 *         user_created_at:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *         user_updated_at:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *       required:
 *         - user_id
 *         - user_first_name
 *         - user_email
 *         - user_phone
 *         - user_status
 *
 *     UserCreate:
 *       type: object
 *       required:
 *         - user_first_name
 *         - user_phone
 *         - user_email
 *         - user_password
 *       properties:
 *         user_first_name:
 *           type: string
 *         user_last_name:
 *           type: string
 *         user_phone:
 *           type: string
 *         user_email:
 *           type: string
 *           format: email
 *         user_password:
 *           type: string
 *           format: password
 *           minLength: 8
 *         user_language:
 *           type: string
 *           default: "en"
 *         user_is_account_admin:
 *           type: boolean
 *           default: false
 *         user_enable_export_notification:
 *           type: boolean
 *           default: false
 *         user_send_welcome_mail:
 *           type: boolean
 *           default: true
 *         user_status:
 *           type: string
 *           enum: [active, inactive, suspended, locked, expired]
 *           default: active
 *         user_login_id:
 *           type: string
 *         user_all_modules_access:
 *           type: boolean
 *           default: true
 *         user_visible_policies:
 *           type: boolean
 *           default: true
 *         user_visible_qa:
 *           type: boolean
 *           default: true
 *         user_visible_accessibility:
 *           type: boolean
 *           default: true
 *         user_visible_seo:
 *           type: boolean
 *           default: true
 *         user_visible_heartbeat:
 *           type: boolean
 *           default: true
 *         user_visible_inventory:
 *           type: boolean
 *           default: true
 *         user_visible_statistics:
 *           type: boolean
 *           default: true
 *         user_visible_prioritized_content:
 *           type: boolean
 *           default: true
 *         user_visible_performance:
 *           type: boolean
 *           default: true
 *         user_domains:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserDomain'
 *
 *     UserUpdate:
 *       type: object
 *       properties:
 *         user_first_name:
 *           type: string
 *         user_last_name:
 *           type: string
 *         user_phone:
 *           type: string
 *         user_email:
 *           type: string
 *           format: email
 *         user_password:
 *           type: string
 *           format: password
 *         user_login_id:
 *           type: string
 *         user_language:
 *           type: string
 *         user_status:
 *           type: string
 *           enum: [active, inactive, suspended, locked, expired]
 *         user_is_account_admin:
 *           type: boolean
 *         user_enable_export_notification:
 *           type: boolean
 *         user_send_welcome_mail:
 *           type: boolean
 *         user_all_modules_access:
 *           type: boolean
 *         user_visible_policies:
 *           type: boolean
 *         user_visible_qa:
 *           type: boolean
 *         user_visible_accessibility:
 *           type: boolean
 *         user_visible_seo:
 *           type: boolean
 *         user_visible_heartbeat:
 *           type: boolean
 *         user_visible_inventory:
 *           type: boolean
 *         user_visible_statistics:
 *           type: boolean
 *         user_visible_prioritized_content:
 *           type: boolean
 *         user_visible_performance:
 *           type: boolean
 *         user_domains:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserDomain'
 *
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         total:
 *           type: integer
 *           example: 100
 *         pages:
 *           type: integer
 *           example: 10
 *
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *       example:
 *         success: true
 *         message: "Success"
 *         data: {}
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *     tenant_id:
 *       type: apiKey
 *       in: header
 *       name: tenant_id
 *
 * security:
 *   - bearerAuth: []
 *   - tenant_id: []
 *
 * tags:
 *   - name: Users
 *     description: User management APIs
 *
 * /api/users:
 *   get:
 *     summary: Get user list with pagination and filters
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: user_status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended, locked, expired]
 *       - in: query
 *         name: user_is_account_admin
 *         schema:
 *           type: boolean
 *         description: Filter by account admin status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name/email
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *
 *   post:
 *     summary: Create new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserCreate'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: integer
 *                     user_first_name:
 *                       type: string
 *                     user_email:
 *                       type: string
 *                     user_phone:
 *                       type: string
 *                     user_is_account_admin:
 *                       type: boolean
 *                     user_status:
 *                       type: string
 *       400:
 *         description: Validation error (e.g. passwords don't match)
 *       409:
 *         description: Duplicate email/phone/login
 *
 * /api/users/login:
 *   post:
 *     summary: User login
 *     tags: [Users]
 *     security:
 *       - tenant_id: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login_id
 *               - login_password
 *             properties:
 *               login_id:
 *                 type: string
 *                 description: Login ID, Email, or Phone No
 *                 example: john.doe@example.com
 *               login_password:
 *                 type: string
 *                 description: Password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                     refresh_token:
 *                       type: string
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *
 * /api/users/{user_id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdate'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: User not found
 *
 *   delete:
 *     summary: Soft delete user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User soft deleted successfully
 */

