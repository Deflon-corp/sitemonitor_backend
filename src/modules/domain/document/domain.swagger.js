/**
 * @swagger
 * components:
 *   schemas:
 *     DomainCreateRequest:
 *       type: object
 *       required:
 *         - dm_title
 *         - dm_url
 *       properties:
 *         dm_title:
 *           type: string
 *           description: Name/Title of the domain
 *         dm_url:
 *           type: string
 *           description: Domain URL
 *         dm_crawl_auto:
 *           type: boolean
 *           default: false
 *         dm_connections_per_min:
 *           type: string
 *           enum: [normal, slow, faster, very-fast, superfast]
 *           default: normal
 *         dm_max_scanned_pages:
 *           type: number
 *           default: 0
 *         dm_scan_subdomains:
 *           type: boolean
 *           default: true
 *         dm_spelling_ignore_caps:
 *           type: boolean
 *         dm_case_sensitive_urls:
 *           type: boolean
 *         dm_render_pages_execute_js:
 *           type: boolean
 *         dm_mark_403_as_broken:
 *           type: boolean
 *         dm_ignore_canonical_urls:
 *           type: boolean
 *         dm_use_language_attribute:
 *           type: boolean
 *         dm_custom_urls:
 *           type: array
 *           items:
 *             type: string
 *         dm_path_constraints:
 *           type: array
 *           items:
 *             type: string
 *         dm_exclude_patterns:
 *           type: array
 *           items:
 *             type: string
 *         dm_ignored_spellings:
 *           type: array
 *           items:
 *             type: string
 *         dm_terms_conditions:
 *           type: array
 *           items:
 *             type: string
 *         dm_internal_urls:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               status:
 *                 type: string
 *         dm_accessibility:
 *           type: string
 *           enum: [none, wcag2a, wcag2aa, wcag2aaa]
 *         dm_source_code_excludes:
 *           type: string
 *         dm_readability:
 *           type: string
 *           enum: [none, basic, standard, advanced]
 *         dm_scan_frequency:
 *           type: number
 *           default: 1
 *         dm_frequency_type:
 *           type: string
 *           enum: [day, week, month, quarter]
 *           default: day
 *
 *     DomainUpdateRequest:
 *       type: object
 *       properties:
 *         dm_title:
 *           type: string
 *         dm_url:
 *           type: string
 *         dm_crawl_auto:
 *           type: boolean
 *         dm_connections_per_min:
 *           type: string
 *           enum: [normal, slow, faster, very-fast, superfast]
 *         dm_max_scanned_pages:
 *           type: number
 *         dm_scan_subdomains:
 *           type: boolean
 *         dm_spelling_ignore_caps:
 *           type: boolean
 *         dm_case_sensitive_urls:
 *           type: boolean
 *         dm_render_pages_execute_js:
 *           type: boolean
 *         dm_mark_403_as_broken:
 *           type: boolean
 *         dm_ignore_canonical_urls:
 *           type: boolean
 *         dm_use_language_attribute:
 *           type: boolean
 *         dm_path_constraints:
 *           type: array
 *           items:
 *             type: string
 *         dm_custom_urls:
 *           type: array
 *           items:
 *             type: string
 *         dm_exclude_patterns:
 *           type: array
 *           items:
 *             type: string
 *         dm_ignored_spellings:
 *           type: array
 *           items:
 *             type: string
 *         dm_terms_conditions:
 *           type: array
 *           items:
 *             type: string
 *         dm_internal_urls:
 *           type: array
 *           items:
 *             type: object
 *         dm_accessibility:
 *           type: string
 *           enum: [none, wcag2a, wcag2aa, wcag2aaa]
 *         dm_scan_frequency:
 *           type: number
 *         dm_frequency_type:
 *           type: string
 *           enum: [day, week, month, quarter]
 *         dm_status:
 *           type: string
 *           enum: [active, inactive, suspended]
 *
 *     DomainResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         dm_id:
 *           type: integer
 *         dm_user_id:
 *           type: string
 *         dm_title:
 *           type: string
 *         dm_url:
 *           type: string
 *         dm_scan_frequency:
 *           type: number
 *         dm_frequency_type:
 *           type: string
 *         dm_status:
 *           type: string
 *         dm_ignored_spellings:
 *           type: array
 *           items:
 *             type: string
 *         dm_terms_conditions:
 *           type: array
 *           items:
 *             type: string
 *         dm_is_deleted:
 *           type: boolean
 *         dm_created_at:
 *           type: string
 *           format: date-time
 *         dm_created_by:
 *           type: string
 *         dm_updated_at:
 *           type: string
 *           format: date-time
 *         dm_updated_by:
 *           type: string
 */

/**
 * @swagger
 * /api/domains:
 *   post:
 *     tags:
 *       - Domains
 *     summary: Create a new domain
 *     security:
 *       - bearerAuth: []
 *       - tenant_id: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DomainCreateRequest'
 *     responses:
 *       201:
 *         description: Domain created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Domain link already exists
 *
 *   get:
 *     tags:
 *       - Domains
 *     summary: Get list of domains
 *     security:
 *       - bearerAuth: []
 *       - tenant_id: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *       - name: dm_status
 *         in: query
 *         schema:
 *           type: string
 *       - name: dm_user_id
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of domains with pagination
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
 *                     domains:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DomainResponse'
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
 *
 * /api/domains/{id}:
 *   get:
 *     tags:
 *       - Domains
 *     summary: Get domain by ID
 *     security:
 *       - bearerAuth: []
 *       - tenant_id: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Domain retrieved successfully
 *       404:
 *         description: Domain not found
 *
 *   put:
 *     tags:
 *       - Domains
 *     summary: Update domain
 *     security:
 *       - bearerAuth: []
 *       - tenant_id: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DomainUpdateRequest'
 *     responses:
 *       200:
 *         description: Domain updated successfully
 *       404:
 *         description: Domain not found
 *
 *   delete:
 *     tags:
 *       - Domains
 *     summary: Delete domain (soft delete)
 *     security:
 *       - bearerAuth: []
 *       - tenant_id: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Domain deleted successfully
 *       404:
 *         description: Domain not found
 */
