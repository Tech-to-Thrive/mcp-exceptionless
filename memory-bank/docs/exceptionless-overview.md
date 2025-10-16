# Exceptionless Platform & API Overview

**Analysis Date**: 2025-10-16
**API Version**: v2
**OpenAPI Spec**: 3.0.4
**License**: Apache 2.0

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [API Architecture](#api-architecture)
3. [Authentication](#authentication)
4. [API Categories](#api-categories)
   - [Auth API](#auth-api)
   - [Event API](#event-api)
   - [Stack API](#stack-api)
   - [Organization API](#organization-api)
   - [Project API](#project-api)
   - [Token API](#token-api)
   - [User API](#user-api)
   - [WebHook API](#webhook-api)
5. [Data Models](#data-models)
6. [Advanced Features](#advanced-features)
7. [API Design Patterns](#api-design-patterns)
8. [Complete Endpoint Reference](#complete-endpoint-reference)

---

## Platform Overview

### What is Exceptionless?

**Exceptionless** is an open-source, real-time error and event tracking platform designed primarily for .NET applications. The name "exceptionless" means "to be without exception" - helping applications become free of exceptions.

### Key Features

- **Real-time error reporting** for ASP.NET, Web API, WebForms, WPF, Console, and MVC applications
- **Intelligent error grouping** using signature-based stacking
- **Event organization** into actionable data
- **Dashboard** with statistics and trends
- **Error notifications** including critical and regression alerts
- **Detailed error reports** with full stack traces
- **Custom event data** support
- **Unlimited users** per organization
- **Regression monitoring** (mark as fixed, detect regressions)
- **Real-time event view**
- **Offline support** and occasionally connected scenarios
- **Fast setup** (< 5 minutes)

### Supported Platforms

- ASP.NET / ASP.NET Core
- Web API
- WebForms
- WPF
- Console applications
- MVC applications
- Self-hosted or SaaS

### Links

- **Website**: https://exceptionless.com/
- **API Documentation**: https://api.exceptionless.io/docs/index.html
- **GitHub**: https://github.com/exceptionless/Exceptionless
- **Terms of Service**: https://exceptionless.com/terms/
- **API Base URL**: https://api.exceptionless.io/api/v2

---

## API Architecture

### Technical Details

- **Protocol**: REST over HTTPS
- **API Version**: v2
- **OpenAPI Specification**: 3.0.4
- **Base URL**: `https://api.exceptionless.io/api/v2`
- **Response Formats**:
  - `application/json`
  - `application/problem+json`
- **Request Formats**:
  - `application/json`
  - `text/plain`
  - Compressed (gzip, deflate)

### Total API Surface

- **88 Endpoints** across 8 categories
- **40 Data Schemas** (models)
- **3 Authentication Methods**

---

## Authentication

### Supported Methods

Exceptionless API supports three authentication methods:

#### 1. Bearer Token (Recommended)
```http
Authorization: Bearer {api_key}
```

#### 2. API Key Query Parameter
```http
GET /api/v2/events?access_token={api_key}
```

#### 3. Basic HTTP Authentication
```http
Authorization: Basic {base64_encoded_credentials}
```

### Authentication Flow

1. **Login**: POST to `/api/v2/auth/login` with email/password
2. **Response**: Receives `TokenResult` with access token
3. **Usage**: Include token in subsequent requests
4. **Token Types**:
   - **User tokens**: Scoped to user's roles
   - **Project tokens**: Scoped to specific project
   - **Organization tokens**: Scoped to organization

### Token Properties

- **Scopes**: Array of permission scopes
- **Expiration**: Optional expiry date (UTC)
- **Revocation**: Can be disabled or suspended
- **Notes**: Optional description field

---

## API Categories

### Auth API

Handles user authentication, authorization, and account management.

**Endpoints** (12):
- POST `/api/v2/auth/login` - Email/password login
- GET `/api/v2/auth/logout` - Logout and invalidate token
- POST `/api/v2/auth/signup` - Create new account
- POST `/api/v2/auth/github` - OAuth with GitHub
- POST `/api/v2/auth/google` - OAuth with Google
- POST `/api/v2/auth/facebook` - OAuth with Facebook
- POST `/api/v2/auth/live` - OAuth with Microsoft
- POST `/api/v2/auth/unlink/{providerName}` - Remove OAuth provider
- POST `/api/v2/auth/change-password` - Change password
- GET `/api/v2/auth/forgot-password/{email}` - Initiate password reset
- POST `/api/v2/auth/reset-password` - Complete password reset
- POST `/api/v2/auth/cancel-reset-password/{token}` - Cancel reset

**Key Models**:
- `Login` - Email + password
- `Signup` - Registration details
- `TokenResult` - Auth token response
- `ExternalAuthInfo` - OAuth details (clientId, code, redirectUri)

---

### Event API

Core feature for submitting and retrieving events (errors, logs, usage tracking).

**Endpoints** (24):

#### Submission
- POST `/api/v2/events` - Submit event (JSON/text/compressed)
- POST `/api/v2/projects/{projectId}/events` - Submit to specific project
- GET `/api/v2/events/submit` - Submit via query string
- GET `/api/v2/events/submit/{type}` - Submit typed event via GET
- GET `/api/v2/projects/{projectId}/events/submit` - Submit to project via GET
- GET `/api/v2/projects/{projectId}/events/submit/{type}` - Typed submission

#### Retrieval
- GET `/api/v2/events` - List all events
- GET `/api/v2/events/{id}` - Get single event
- GET `/api/v2/events/by-ref/{referenceId}` - Get by reference ID
- GET `/api/v2/organizations/{organizationId}/events` - List by organization
- GET `/api/v2/projects/{projectId}/events` - List by project
- GET `/api/v2/stacks/{stackId}/events` - List by stack
- GET `/api/v2/projects/{projectId}/events/by-ref/{referenceId}` - Get by ref (project)

#### Analytics
- GET `/api/v2/events/count` - Count events
- GET `/api/v2/organizations/{organizationId}/events/count` - Count by org
- GET `/api/v2/projects/{projectId}/events/count` - Count by project

#### Sessions
- GET `/api/v2/events/sessions` - List all sessions
- GET `/api/v2/events/sessions/{sessionId}` - Get session events
- GET `/api/v2/organizations/{organizationId}/events/sessions` - Sessions by org
- GET `/api/v2/projects/{projectId}/events/sessions` - Sessions by project
- GET `/api/v2/projects/{projectId}/events/sessions/{sessionId}` - Project session
- GET `/api/v2/events/session/heartbeat` - Submit session heartbeat

#### Management
- POST `/api/v2/events/by-ref/{referenceId}/user-description` - Add user description
- POST `/api/v2/projects/{projectId}/events/by-ref/{referenceId}/user-description` - Add description (project)
- DELETE `/api/v2/events/{ids}` - Bulk delete events

**Query Parameters** (Common):
- `filter` (string) - Advanced filter query
- `sort` (string) - Sort order (e.g., `-date`)
- `time` (string) - Time range filter
- `offset` (string) - Timezone offset in minutes
- `mode` (string) - Response mode: `full` or `summary`
- `page` (integer) - Page number (≥1)
- `limit` (integer) - Results per page (1-100, default 10)
- `before` (string) - Cursor for pagination
- `after` (string) - Cursor for pagination

**Event Types**:
- `error` - Exception/error tracking
- `log` - Log messages
- `usage` - Feature usage tracking
- Custom types supported

**Submission Formats**:
- JSON objects (single or array)
- Plain text (single or multi-line)
- Compressed (gzip/deflate)
- Query string parameters (GET)

**Multi-line Support**: Text submissions are automatically split by `\n` into separate log events.

---

### Stack API

Manages intelligent error grouping and workflow states.

**Endpoints** (15):

#### Retrieval
- GET `/api/v2/stacks` - List all stacks
- GET `/api/v2/stacks/{id}` - Get single stack
- GET `/api/v2/organizations/{organizationId}/stacks` - List by organization
- GET `/api/v2/projects/{projectId}/stacks` - List by project

#### Status Management
- POST `/api/v2/stacks/{ids}/mark-fixed` - Mark as fixed (with optional version)
- POST `/api/v2/stacks/{ids}/mark-snoozed` - Snooze until date
- POST `/api/v2/stacks/{ids}/mark-critical` - Mark as critical
- DELETE `/api/v2/stacks/{ids}/mark-critical` - Unmark critical
- POST `/api/v2/stacks/{ids}/change-status` - General status change

#### Reference Management
- POST `/api/v2/stacks/{id}/add-link` - Add external reference
- POST `/api/v2/stacks/{id}/remove-link` - Remove external reference
- POST `/api/v2/stacks/{id}/promote` - Promote to external service

#### Deletion
- DELETE `/api/v2/stacks/{ids}` - Bulk delete stacks

**Stack Statuses**:
- `open` - Active error
- `fixed` - Resolved error
- `regressed` - Fixed error that recurred
- `snoozed` - Temporarily hidden
- `ignored` - Permanently hidden
- `discarded` - Filtered out

**Bulk Operations**: Most stack operations accept comma-delimited IDs for batch processing.

---

### Organization API

Manages multi-tenant organizations with billing and subscription.

**Endpoints** (17):

#### CRUD
- GET `/api/v2/organizations` - List organizations
- GET `/api/v2/organizations/{id}` - Get single organization
- POST `/api/v2/organizations` - Create organization
- PATCH `/api/v2/organizations/{id}` - Partial update
- PUT `/api/v2/organizations/{id}` - Full update
- DELETE `/api/v2/organizations/{ids}` - Bulk delete

#### Billing
- GET `/api/v2/organizations/{id}/invoices` - List invoices
- GET `/api/v2/organizations/invoice/{id}` - Get specific invoice
- GET `/api/v2/organizations/{id}/plans` - Get available plans
- POST `/api/v2/organizations/{id}/change-plan` - Upgrade/downgrade plan

#### User Management
- POST `/api/v2/organizations/{id}/users/{email}` - Add user to org
- DELETE `/api/v2/organizations/{id}/users/{email}` - Remove user

#### Custom Data
- POST `/api/v2/organizations/{id}/data/{key}` - Add custom data
- DELETE `/api/v2/organizations/{id}/data/{key}` - Remove custom data

#### Validation
- GET `/api/v2/organizations/check-name` - Check name uniqueness

**Billing Features**:
- Multiple plan tiers
- Event quotas (monthly limits + bonus events)
- Retention policies
- User/project limits
- Premium features flag
- Suspension handling
- Invoice history

---

### Project API

Manages projects within organizations.

**Endpoints** (23):

#### CRUD
- GET `/api/v2/projects` - List all projects
- GET `/api/v2/projects/{id}` - Get single project
- GET `/api/v2/organizations/{organizationId}/projects` - List by organization
- POST `/api/v2/projects` - Create project
- PATCH `/api/v2/projects/{id}` - Partial update
- PUT `/api/v2/projects/{id}` - Full update
- DELETE `/api/v2/projects/{ids}` - Bulk delete

#### Configuration
- GET `/api/v2/projects/config` - Get all project configs
- GET `/api/v2/projects/{id}/config` - Get project config
- POST `/api/v2/projects/{id}/config` - Add config value
- DELETE `/api/v2/projects/{id}/config` - Remove config value

#### Data Management
- GET `/api/v2/projects/{id}/reset-data` - Clear project data
- POST `/api/v2/projects/{id}/data` - Add custom data
- DELETE `/api/v2/projects/{id}/data` - Remove custom data

#### Notifications
- GET `/api/v2/users/{userId}/projects/{id}/notifications` - Get notification settings
- PUT `/api/v2/users/{userId}/projects/{id}/notifications` - Update settings (PUT)
- POST `/api/v2/users/{userId}/projects/{id}/notifications` - Update settings (POST)
- DELETE `/api/v2/users/{userId}/projects/{id}/notifications` - Remove settings
- PUT `/api/v2/projects/{id}/{integration}/notifications` - Integration notifications (PUT)
- POST `/api/v2/projects/{id}/{integration}/notifications` - Integration notifications (POST)

#### UI Customization
- PUT `/api/v2/projects/{id}/promotedtabs` - Promote tab
- POST `/api/v2/projects/{id}/promotedtabs` - Promote tab (POST)
- DELETE `/api/v2/projects/{id}/promotedtabs` - Demote tab

#### Validation
- GET `/api/v2/projects/check-name` - Check name uniqueness
- GET `/api/v2/organizations/{organizationId}/projects/check-name` - Check name (org scoped)

**Project Features**:
- Custom configuration key-value store
- Bot data filtering
- Promoted tabs for UI customization
- Usage tracking (hourly and aggregate)
- Slack integration support
- Premium features flag

---

### Token API

Manages API tokens for authentication and authorization.

**Endpoints** (11):

#### Organization Tokens
- GET `/api/v2/organizations/{organizationId}/tokens` - List org tokens
- POST `/api/v2/organizations/{organizationId}/tokens` - Create org token

#### Project Tokens
- GET `/api/v2/projects/{projectId}/tokens` - List project tokens
- POST `/api/v2/projects/{projectId}/tokens` - Create project token
- GET `/api/v2/projects/{projectId}/tokens/default` - Get default project token

#### Token Management
- GET `/api/v2/tokens/{id}` - Get single token
- POST `/api/v2/tokens` - Create token
- PATCH `/api/v2/tokens/{id}` - Partial update
- PUT `/api/v2/tokens/{id}` - Full update
- DELETE `/api/v2/tokens/{ids}` - Bulk delete

**Token Scoping**:
- **Organization-scoped**: Access all projects in org
- **Project-scoped**: Access single project only
- **User tokens**: Associated with user account
- **System tokens**: Not associated with user

---

### User API

Manages user accounts and profiles.

**Endpoints** (11):

#### Current User
- GET `/api/v2/users/me` - Get current user
- DELETE `/api/v2/users/me` - Delete current user

#### User Management
- GET `/api/v2/users/{id}` - Get user by ID
- PATCH `/api/v2/users/{id}` - Partial update
- PUT `/api/v2/users/{id}` - Full update
- DELETE `/api/v2/users/{ids}` - Bulk delete
- GET `/api/v2/organizations/{organizationId}/users` - List org users

#### Email Management
- POST `/api/v2/users/{id}/email-address/{email}` - Update email
- GET `/api/v2/users/verify-email-address/{token}` - Verify email
- GET `/api/v2/users/{id}/resend-verification-email` - Resend verification

**User Features**:
- Multi-organization membership
- Role-based access control (RBAC)
- Email verification workflow
- Notification preferences
- OAuth account linking
- Invite system

---

### WebHook API

Manages webhook integrations for event notifications.

**Endpoints** (5):

- GET `/api/v2/projects/{projectId}/webhooks` - List project webhooks
- GET `/api/v2/webhooks/{id}` - Get single webhook
- POST `/api/v2/webhooks` - Create webhook
- DELETE `/api/v2/webhooks/{ids}` - Bulk delete

**WebHook Features**:
- Project-scoped
- Selective event type subscriptions
- Enable/disable toggle
- Versioned webhooks
- URL validation

---

## Data Models

### Core Models

#### PersistentEvent

The central event object for tracking errors, logs, and usage.

```typescript
{
  id: string
  organization_id: string
  project_id: string
  stack_id: string
  is_first_occurrence: boolean
  created_utc: datetime
  idx: object                    // Indexable fields

  // Event Details
  type: string                    // error, log, usage, custom
  source: string                  // Origin (machine, feature name)
  date: datetime                  // Event timestamp
  message: string
  tags: string[]                  // For categorization

  // Metadata
  geo: string                     // Geolocation
  value: double                   // Numeric metric
  count: integer                  // Count metric
  data: object                    // Flexible custom data
  reference_id: string            // External correlation ID
}
```

**Extended Data Conventions**:
- `@user` - User identity (id, name, email)
- `@simple_error` - Simple error (message, type, stack_trace)
- `@error` - Full error details
- `@environment` - Environment info (OS, runtime)
- `@request` - HTTP request details
- Custom properties as needed

#### Stack

Groups similar errors by signature for intelligent management.

```typescript
{
  id: string
  organization_id: string
  project_id: string
  type: string

  // Status
  status: StackStatus             // open, fixed, regressed, snoozed, ignored, discarded
  snooze_until_utc: datetime?

  // Grouping
  signature_hash: string          // Unique identifier for grouping
  signature_info: object          // Metadata about signature
  duplicate_signature: string     // For merging stacks

  // Fix Tracking
  fixed_in_version: string?
  date_fixed: datetime?

  // Occurrence Stats
  total_occurrences: integer
  first_occurrence: datetime
  last_occurrence: datetime

  // Metadata
  title: string
  description: string
  occurrences_are_critical: boolean
  references: string[]            // External links (JIRA, GitHub)
  tags: string[]

  // Audit
  created_utc: datetime
  updated_utc: datetime
  is_deleted: boolean
  allow_notifications: boolean    // Read-only
}
```

**StackStatus Enum**:
- `open` - Active, unresolved
- `fixed` - Resolved
- `regressed` - Was fixed, now recurring
- `snoozed` - Temporarily hidden until date
- `ignored` - Permanently hidden
- `discarded` - Filtered/excluded

#### ViewOrganization

Organization with billing and subscription details.

```typescript
{
  id: string
  name: string
  created_utc: datetime

  // Billing
  plan_id: string
  plan_name: string
  plan_description: string
  billing_status: BillingStatus   // Trialing, Active, PastDue, Canceled, Unpaid
  billing_price: double
  billing_change_date: datetime?
  billing_changed_by_user_id: string?
  card_last4: string?
  subscribe_date: datetime?

  // Quotas
  max_events_per_month: integer
  bonus_events_per_month: integer
  bonus_expiration: datetime?
  retention_days: integer
  max_users: integer
  max_projects: integer

  // Features
  has_premium_features: boolean

  // Suspension
  is_suspended: boolean
  suspension_code: string?
  suspension_notes: string?
  suspension_date: datetime?

  // Stats
  project_count: integer
  stack_count: integer
  event_count: integer
}
```

**BillingStatus Enum**:
- `0` = Trialing
- `1` = Active
- `2` = PastDue
- `3` = Canceled
- `4` = Unpaid

#### ViewProject

Project configuration and statistics.

```typescript
{
  id: string
  organization_id: string
  organization_name: string
  name: string
  created_utc: datetime

  // Configuration
  delete_bot_data_enabled: boolean
  data: object                    // Custom key-value data
  promoted_tabs: string[]         // UI customization
  is_configured: boolean?

  // Features
  has_premium_features: boolean
  has_slack_integration: boolean

  // Stats
  stack_count: integer
  event_count: integer
  usage_hours: UsageHourInfo[]    // Hourly usage breakdown
  usage: UsageInfo[]              // Aggregate usage
}
```

#### ViewToken

API token for authentication.

```typescript
{
  id: string
  organization_id: string
  project_id: string?             // Optional: can be org-scoped
  user_id: string?                // Optional: can be system token
  default_project_id: string?

  // Authorization
  scopes: string[]                // Permission scopes

  // Lifecycle
  expires_utc: datetime?
  is_disabled: boolean
  is_suspended: boolean

  // Metadata
  notes: string
  created_utc: datetime
  updated_utc: datetime
}
```

#### ViewUser

User account with organizations and roles.

```typescript
{
  id: string
  organization_ids: string[]      // Multi-org membership
  full_name: string
  email_address: string

  // Settings
  email_notifications_enabled: boolean
  is_email_address_verified: boolean

  // Status
  is_active: boolean
  is_invite: boolean              // Pending invitation

  // Authorization
  roles: string[]                 // RBAC roles
}
```

### Supporting Models

#### BillingPlan
```typescript
{
  id: string
  name: string
  description: string
  price: double
  max_projects: integer
  max_users: integer
  retention_days: integer
  max_events_per_month: integer
  has_premium_features: boolean
  is_hidden: boolean              // Legacy/special plans
}
```

#### UsageInfo
```typescript
{
  date: datetime
  limit: integer                  // Quota
  total: integer                  // Submitted
  blocked: integer                // Over quota
  discarded: integer              // Filtered out
  too_big: integer                // Size exceeded
}
```

#### NotificationSettings
```typescript
{
  send_daily_summary: boolean
  report_new_errors: boolean
  report_critical_errors: boolean
  report_event_regressions: boolean
  report_new_events: boolean
  report_critical_events: boolean
}
```

#### CountResult
```typescript
{
  total: integer
  aggregations: object            // Key-value aggregations
  data: object                    // Additional metadata
}
```

#### ClientConfiguration
```typescript
{
  version: integer
  settings: object                // Key-value settings pushed to clients
}
```

#### WebHook
```typescript
{
  id: string
  organization_id: string
  project_id: string
  url: string                     // Callback endpoint
  event_types: string[]           // Selective subscriptions
  is_enabled: boolean
  version: string
  created_utc: datetime
}
```

---

## Advanced Features

### Query and Filtering

#### Filter Syntax

Exceptionless supports a powerful filter syntax for querying events and stacks.

**Operators**:
- `:` - Equals
- `:>` - Greater than
- `:<` - Less than
- `:>=` - Greater than or equal
- `:<=` - Less than or equal
- `AND` - Logical AND
- `OR` - Logical OR
- `()` - Grouping

**Examples**:
```
type:error
type:log AND tag:production
date:>now-7d
status:(open OR regressed)
is_first_occurrence:true
(type:error OR type:log) AND tag:api
```

**Date Ranges**:
- `now` - Current time
- `now-7d` - 7 days ago
- `now-1h` - 1 hour ago
- `now-30m` - 30 minutes ago

#### Sorting

- Format: `field` (ascending) or `-field` (descending)
- Example: `-date` (most recent first)
- Example: `total_occurrences` (least occurrences first)

#### Pagination

**Two strategies**:

1. **Page-based**:
   - `page=1&limit=10`
   - Simple, predictable

2. **Cursor-based**:
   - `before=cursor_value` or `after=cursor_value`
   - More efficient for large datasets
   - Prevents duplicates during concurrent writes

**Limits**:
- Minimum: 1 result per page
- Maximum: 100 results per page
- Default: 10 results per page

#### Response Modes

- `full` - Complete object with all fields
- `summary` - Lightweight object with key fields only

### Session Tracking

**Sessions** group events by user activity sessions.

**Heartbeat Mechanism**:
- Submit periodic heartbeats to keep session alive
- Endpoint: `GET /api/v2/events/session/heartbeat?id={sessionId}`
- Parameters:
  - `id` - Session ID or user ID
  - `close` - Set to `true` to close session

**Use Cases**:
- Track user journey through application
- Correlate errors within user sessions
- Analyze session duration and activity

### Compression Support

Event submissions support compression for bandwidth efficiency:

- **gzip** - Standard gzip compression
- **deflate** - Deflate compression
- Header: `Content-Encoding: gzip` or `Content-Encoding: deflate`

### Aggregations

The count endpoints support aggregations for analytics:

```
GET /api/v2/events/count?filter=type:error&aggregations=date:1h,type
```

Returns:
```json
{
  "total": 1234,
  "aggregations": {
    "date": {
      "2025-10-16T10:00:00Z": 45,
      "2025-10-16T11:00:00Z": 67
    },
    "type": {
      "error": 890,
      "log": 344
    }
  }
}
```

### Usage Quota Tracking

Organizations track usage against quotas:

- **limit** - Monthly event quota
- **total** - Events submitted
- **blocked** - Rejected (over quota)
- **discarded** - Filtered (bots, rules)
- **too_big** - Rejected (size limit)

---

## API Design Patterns

### Consistent Patterns

1. **CRUD Operations**:
   - GET - Retrieve (list or single)
   - POST - Create
   - PUT/PATCH - Update
   - DELETE - Remove

2. **Bulk Operations**:
   - Comma-delimited IDs in path
   - Example: `/api/v2/stacks/id1,id2,id3/mark-fixed`

3. **Hierarchical Queries**:
   - Organization → Project → Stack → Event
   - Endpoints available at each level

4. **Pagination Metadata**:
   - Typically in response headers
   - May include `X-Total-Count`, `Link` headers

5. **Timestamp Format**:
   - ISO 8601 with timezone
   - Example: `2025-10-16T10:30:00.000Z`

### Status Codes

**Success**:
- `200 OK` - Successful retrieval
- `202 Accepted` - Async operation accepted
- `204 No Content` - Successful delete

**Client Errors**:
- `400 Bad Request` - Invalid input/filter
- `401 Unauthorized` - Invalid/missing auth
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error

**Server Errors**:
- `426 Upgrade Required` - Organization suspended
- `500 Internal Server Error` - Server error

### Idempotency

- POST operations generally not idempotent
- PUT operations idempotent
- DELETE operations idempotent
- Event submission generates unique IDs

### Extensibility

All major objects support custom data:
- Organizations: `/organizations/{id}/data/{key}`
- Projects: `/projects/{id}/data`
- Events: `data` field in submission
- Stacks: `tags[]` and `references[]`

---

## Complete Endpoint Reference

### Auth Endpoints (12)
```
POST   /api/v2/auth/login
GET    /api/v2/auth/logout
POST   /api/v2/auth/signup
POST   /api/v2/auth/github
POST   /api/v2/auth/google
POST   /api/v2/auth/facebook
POST   /api/v2/auth/live
POST   /api/v2/auth/unlink/{providerName}
POST   /api/v2/auth/change-password
GET    /api/v2/auth/forgot-password/{email}
POST   /api/v2/auth/reset-password
POST   /api/v2/auth/cancel-reset-password/{token}
```

### Event Endpoints (24)
```
POST   /api/v2/events
GET    /api/v2/events
GET    /api/v2/events/{id}
DELETE /api/v2/events/{ids}
GET    /api/v2/events/count
GET    /api/v2/events/by-ref/{referenceId}
POST   /api/v2/events/by-ref/{referenceId}/user-description
GET    /api/v2/events/submit
GET    /api/v2/events/submit/{type}
GET    /api/v2/events/sessions
GET    /api/v2/events/sessions/{sessionId}
GET    /api/v2/events/session/heartbeat
GET    /api/v2/organizations/{organizationId}/events
GET    /api/v2/organizations/{organizationId}/events/count
GET    /api/v2/organizations/{organizationId}/events/sessions
POST   /api/v2/projects/{projectId}/events
GET    /api/v2/projects/{projectId}/events
GET    /api/v2/projects/{projectId}/events/count
GET    /api/v2/projects/{projectId}/events/by-ref/{referenceId}
POST   /api/v2/projects/{projectId}/events/by-ref/{referenceId}/user-description
GET    /api/v2/projects/{projectId}/events/submit
GET    /api/v2/projects/{projectId}/events/submit/{type}
GET    /api/v2/projects/{projectId}/events/sessions
GET    /api/v2/projects/{projectId}/events/sessions/{sessionId}
```

### Stack Endpoints (15)
```
GET    /api/v2/stacks
GET    /api/v2/stacks/{id}
DELETE /api/v2/stacks/{ids}
POST   /api/v2/stacks/{ids}/mark-fixed
POST   /api/v2/stacks/{ids}/mark-snoozed
POST   /api/v2/stacks/{ids}/mark-critical
DELETE /api/v2/stacks/{ids}/mark-critical
POST   /api/v2/stacks/{ids}/change-status
POST   /api/v2/stacks/{id}/add-link
POST   /api/v2/stacks/{id}/remove-link
POST   /api/v2/stacks/{id}/promote
GET    /api/v2/stacks/{stackId}/events
GET    /api/v2/organizations/{organizationId}/stacks
GET    /api/v2/projects/{projectId}/stacks
```

### Organization Endpoints (17)
```
GET    /api/v2/organizations
GET    /api/v2/organizations/{id}
POST   /api/v2/organizations
PATCH  /api/v2/organizations/{id}
PUT    /api/v2/organizations/{id}
DELETE /api/v2/organizations/{ids}
GET    /api/v2/organizations/invoice/{id}
GET    /api/v2/organizations/{id}/invoices
GET    /api/v2/organizations/{id}/plans
POST   /api/v2/organizations/{id}/change-plan
POST   /api/v2/organizations/{id}/users/{email}
DELETE /api/v2/organizations/{id}/users/{email}
POST   /api/v2/organizations/{id}/data/{key}
DELETE /api/v2/organizations/{id}/data/{key}
GET    /api/v2/organizations/check-name
```

### Project Endpoints (23)
```
GET    /api/v2/projects
GET    /api/v2/projects/{id}
POST   /api/v2/projects
PATCH  /api/v2/projects/{id}
PUT    /api/v2/projects/{id}
DELETE /api/v2/projects/{ids}
GET    /api/v2/projects/config
GET    /api/v2/projects/{id}/config
POST   /api/v2/projects/{id}/config
DELETE /api/v2/projects/{id}/config
GET    /api/v2/projects/{id}/reset-data
GET    /api/v2/users/{userId}/projects/{id}/notifications
PUT    /api/v2/users/{userId}/projects/{id}/notifications
POST   /api/v2/users/{userId}/projects/{id}/notifications
DELETE /api/v2/users/{userId}/projects/{id}/notifications
PUT    /api/v2/projects/{id}/{integration}/notifications
POST   /api/v2/projects/{id}/{integration}/notifications
PUT    /api/v2/projects/{id}/promotedtabs
POST   /api/v2/projects/{id}/promotedtabs
DELETE /api/v2/projects/{id}/promotedtabs
GET    /api/v2/projects/check-name
GET    /api/v2/organizations/{organizationId}/projects/check-name
POST   /api/v2/projects/{id}/data
DELETE /api/v2/projects/{id}/data
```

### Token Endpoints (11)
```
GET    /api/v2/tokens/{id}
POST   /api/v2/tokens
PATCH  /api/v2/tokens/{id}
PUT    /api/v2/tokens/{id}
DELETE /api/v2/tokens/{ids}
GET    /api/v2/organizations/{organizationId}/tokens
POST   /api/v2/organizations/{organizationId}/tokens
GET    /api/v2/projects/{projectId}/tokens
POST   /api/v2/projects/{projectId}/tokens
GET    /api/v2/projects/{projectId}/tokens/default
```

### User Endpoints (11)
```
GET    /api/v2/users/me
DELETE /api/v2/users/me
GET    /api/v2/users/{id}
PATCH  /api/v2/users/{id}
PUT    /api/v2/users/{id}
DELETE /api/v2/users/{ids}
GET    /api/v2/organizations/{organizationId}/users
POST   /api/v2/users/{id}/email-address/{email}
GET    /api/v2/users/verify-email-address/{token}
GET    /api/v2/users/{id}/resend-verification-email
```

### WebHook Endpoints (4)
```
GET    /api/v2/projects/{projectId}/webhooks
GET    /api/v2/webhooks/{id}
POST   /api/v2/webhooks
DELETE /api/v2/webhooks/{ids}
```

---

## Summary

**Total API Surface**:
- 88 REST endpoints
- 40 data models
- 3 authentication methods
- 8 functional categories

**Key Strengths**:
- Comprehensive event tracking
- Intelligent error grouping
- Flexible filtering and querying
- Multi-tenant with billing
- Extensible data models
- RESTful design patterns
- Open source with SaaS option

**Best For**:
- .NET application monitoring
- Real-time error tracking
- Production error management
- Development team collaboration
- Usage analytics
- Session tracking

---

**Last Updated**: 2025-10-16
**API Documentation**: https://api.exceptionless.io/docs/index.html
**Swagger Spec**: https://api.exceptionless.io/docs/v2/swagger.json
