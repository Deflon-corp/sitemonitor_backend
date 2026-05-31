/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication APIs (Login and Refresh Token for both Users and Admins)
 *
 * /api/auth/login:
 *   post:
 *     summary: User & Admin login
 *     tags: [Auth]
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
 *               - password
 *             properties:
 *               login_id:
 *                 type: string
 *                 description: Login ID, Email, or Mobile/Phone No
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 description: Password
 *                 example: password123
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
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                     refresh_token:
 *                       type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *       400:
 *         description: Missing or invalid credentials
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: User is inactive or suspended
 *       500:
 *         description: Internal server error
 *
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh Access Token
 *     tags: [Auth]
 *     security:
 *       - tenant_id: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: Valid refresh token
 *     responses:
 *       200:
 *         description: Refresh token successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *       400:
 *         description: Missing refresh token
 *       401:
 *         description: Invalid or expired refresh token or User not found/inactive
 *       500:
 *         description: Internal server error
 *
 * /api/auth/send-otp:
 *   post:
 *     summary: Send OTP to email
 *     tags: [Auth]
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
 *             properties:
 *               login_id:
 *                 type: string
 *                 description: Email, mobile number, or username
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error or email failure
 *
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and Login
 *     tags: [Auth]
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
 *               - otp
 *             properties:
 *               login_id:
 *                 type: string
 *                 description: Email, mobile number, or username
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 description: 6-digit numeric OTP
 *                 example: "123456"
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
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                     refresh_token:
 *                       type: string
 *                     user:
 *                       type: object
 *       401:
 *         description: Invalid or expired OTP
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

