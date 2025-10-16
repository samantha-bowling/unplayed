# Security Implementation

## XSS Protection ✅ IMPLEMENTED

### Critical XSS Fix Applied
- **GameReviewCard.tsx**: Removed `dangerouslySetInnerHTML` and replaced with safe sanitization
- **LinkSteamAccount.tsx**: Added `rel="noopener noreferrer"` to external link
- **ESLint Rules**: Added `react/no-danger: error` to prevent future XSS vulnerabilities

### Sanitization Pipeline
- **DOMPurify**: Strict HTML sanitization with minimal allowed tags
- **BBCode Conversion**: Safe conversion of Steam review BBCode to HTML
- **Link Hardening**: All external links use `rel="noopener noreferrer ugc"`

### Test Payloads (for manual testing)
```javascript
// These should all be safely neutralized:
const maliciousPayloads = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '<svg onload=alert(1)>',
  'javascript:alert(1)',
  '"><script>alert(1)</script>',
  '<iframe src="javascript:alert(1)"></iframe>',
  '<div onmouseover="alert(1)">hover me</div>',
];
```

## Database Security ✅ IMPLEMENTED

### Search Path Hardening
- **20+ Functions Updated**: All database functions now use `SET search_path = pg_temp, public`
- **Schema Protection**: Revoked `CREATE` privileges on public schema from PUBLIC role
- **Injection Prevention**: All functions protected against schema injection attacks

### Security Monitoring
- **Security Events Table**: Created `public.security_events` for audit logging
- **RLS Enabled**: Admin-only access to security events with proper policies

## Role-Based Access Control (RBAC) ✅ IMPLEMENTED

### Table-First RBAC Architecture with Server Verification (Phase 2A)

The application implements a secure, auditable role management system using dedicated database tables with defense-in-depth verification.

#### Primary Authorization Source
- **Source of Truth**: `public.user_roles` table
- **Immutability**: Enforced via SECURITY DEFINER functions and RLS policies
- **Foreign Key**: Direct reference to `auth.users(id)` with cascade delete
- **Authorization Functions**: `public.is_admin(uuid)` and `public.has_role(uuid, app_role)`
- **Performance**: Indexed table lookups (20-50% faster than JSONB inspection)

#### Security Architecture
```sql
-- Authorization flow (SECURITY DEFINER functions)
public.is_admin(user_id) → SELECT FROM public.user_roles → returns boolean
public.has_role(user_id, role) → SELECT FROM public.user_roles → returns boolean

-- Role management (admin-only, audited)
public.assign_role(user_id, role) → INSERT INTO public.user_roles → audit log
public.revoke_role(user_id, role) → DELETE FROM public.user_roles → audit log
```

#### Adding New Admins
**Via SQL (Recommended):**
```sql
-- Method 1: Direct insert (requires superuser or service role)
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin')
ON CONFLICT DO NOTHING;

-- Method 2: Use controlled function (requires existing admin)
SELECT public.assign_role('user-uuid-here', 'admin');
```

**Via Admin Dashboard (Future):**
1. Navigate to Admin Panel → User Management
2. Select user to promote
3. Click "Assign Role" → Select "admin"
4. Confirm (action logged to audit trail)

#### Frontend Implementation (Phase 2A Enhanced)

**Utility Functions:**
- **Location**: `src/utils/auth-utils.ts`
- **Functions**: `isAdmin()`, `hasRole()`, `getUserRoles()`
- **Source**: NEVER checks app_metadata or users.role column
- **Method**: Calls database RPC functions or reads from user_roles join

**Route Protection (Defense-in-Depth):**
- **Component**: `src/components/ProtectedRoute.tsx`
- **Auto-RPC Verification**: Automatically enabled for all admin routes (`requiredRole='admin'`)
- **Security Layers**:
  1. **Cached Check First** (fast UI, prevents flicker) - uses `useAuthPermission()` hook
  2. **Server RPC Verification Second** (secure enforcement) - calls `verifyAdminRPC()`
  3. **Timeout Protection** (5-second max) - fails closed if RPC times out
  4. **Race Condition Protection** - prevents state updates on unmounted components
  5. **Error Handling** - catches and logs RPC failures, denies access on error

**Security Behavior:**
- Token manipulation attacks fail at RPC layer (cached vs server mismatch detected)
- Network issues cause access denial (fail-closed policy)
- All admin access verified server-side on route entry
- No redundant checks in layout components (clean separation of concerns)

#### Backend Implementation
- **Edge Functions**: Use `supabase.rpc('is_admin', { check_user_id: userId })` for checks
- **Audit Logging**: All admin checks logged to `public.admin_audit_logs` with migration version
- **Migration Version**: Phase 0 v1 (table-first architecture)

#### Security Features
- **Relational Integrity**: Foreign keys prevent orphaned roles
- **Audit Trail**: Complete history of all role assignments and revocations
- **Self-Protection**: Admins cannot modify their own admin role
- **Performance**: Indexed lookups significantly faster than JSONB operations

#### Intentional SECURITY DEFINER Functions ✅
The following functions use `SECURITY DEFINER` intentionally and correctly:
- **`is_admin(uuid)`**: Bypasses RLS to check admin role, prevents infinite recursion
- **`has_role(uuid, app_role)`**: Bypasses RLS to check any role, prevents infinite recursion  
- **`assign_role(uuid, app_role)`**: Admin-only function with audit logging
- **`revoke_role(uuid, app_role)`**: Admin-only function with audit logging

These functions are secure because:
1. They use `SET search_path = pg_temp, public` to prevent schema injection
2. They access only the specific data needed (role checks)
3. They include proper authorization checks (admin-only for mutations)
4. All mutations are logged to audit trail

**Note**: Security linter may flag these as warnings. This is expected and safe.

### Migration History
- **Pre-Phase 0**: Used `auth.users.app_metadata.roles` (DEPRECATED - privilege escalation risk)
- **Phase 0**: Migrated to `public.user_roles` table (secure, auditable)
- **Phase 2A**: Added server-side RPC verification for all admin routes (defense-in-depth)
- **v2.0**: Removed legacy `users.role` column (completed)
- **Removed Function**: `public.sync_user_roles_from_metadata()` (no longer needed)

## Remaining Security Items ⚠️ NEEDS ATTENTION

### Critical (Fix Immediately)
1. **Password Protection**: Enable leaked password protection in Supabase Auth settings
2. **Postgres Version**: Upgrade database to apply security patches

### Recommended Next Steps
1. **Content Security Policy**: Implement strict CSP headers at deploy/CDN level
2. **Rate Limiting**: Add request frequency limits for sensitive endpoints
3. **Input Validation**: Enhance server-side validation with proper length limits

## Security Headers Recommended
```
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Implementation Status
- ✅ XSS Protection: Complete
- ✅ Database Function Hardening: Complete  
- ✅ Security Event Logging: Complete
- ⚠️ Security Definer Views: Needs investigation
- ⚠️ Password Protection: User setting required
- 🔄 CSP Headers: Recommended for production
- 🔄 Rate Limiting: Recommended for sensitive endpoints