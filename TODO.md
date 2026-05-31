# Admin Bulk User Creation Task

## Plan Overview
Add bulk user creation endpoint for admins: POST /api/users/bulk-create (JSON array of users).
- No user limit
- No profile images for bulk (JSON only, keep simple)
- Full validation per user, atomic insertMany for valid ones
- Proper Swagger docs
- Protected by existing adminMiddleware

Status: **In Progress** ⏳

## Steps (1/5)

### 1. ✅ **Plan Approved** - No limits, no images, extend user routes.

### 2. ✅ **Add bulk service function** 
   - File: `src/modules/user/services/user.service.js`
   - Add `bulk_create_users_service`
   - Logic: validate array, check uniques, hash pwds, insertMany

### 3. ✅ **Add bulk controller** 
   - File: `src/modules/user/controller/user.controller.js`
   - Add `bulkCreateUsers`

### 4. **Add bulk route** 
   - File: `src/modules/user/routes/user.routes.js`
   - POST `/bulk-create` w/ adminMiddleware

### 5. **Update Swagger docs** 
   - File: `src/modules/user/document/user.swagger.js`
   - Add `/api/users/bulk-create` path + schemas

### 6. **Test & Complete**
   - Verify endpoint + docs
   - attempt_completion

**Next: Step 2 - Update user.service.js**

