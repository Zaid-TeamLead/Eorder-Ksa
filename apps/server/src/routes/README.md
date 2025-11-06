# Router Best Practices Guide

## Overview

This guide demonstrates production-ready patterns for handling routes and calling SAP HANA stored procedures.

## File Structure

```
src/
├── routes/
│   ├── auth.routes.ts          # Authentication routes
│   ├── protected.routes.ts     # Protected routes with examples
│   └── health.routes.ts        # Health check routes
├── controllers/
│   └── procedure.controller.ts # Stored procedure controllers
├── utils/
│   ├── async-handler.ts        # Async error handling wrapper
│   └── api-response.ts         # Standardized API responses
└── services/
    └── database.service.ts     # Database service with procedure support
```

## Key Patterns

### 1. Async Error Handling

Always wrap async route handlers with `asyncHandler` to automatically catch errors:

```typescript
import { asyncHandler } from "../utils/async-handler.js";

router.get("/users", authenticate, asyncHandler(async (req, res) => {
  const users = await db.query("SELECT * FROM USERS");
  return sendSuccess(res, users);
}));
```

### 2. Standardized API Responses

Use `sendSuccess` and `sendError` for consistent API responses:

```typescript
import { sendSuccess, sendError } from "../utils/api-response.js";

// Success response
return sendSuccess(res, data, 200);

// Error response
return sendError(res, "User not found", 404, "USER_NOT_FOUND");
```

### 3. Input Validation

Use Zod for input validation:

```typescript
import { z } from "zod";

const schema = z.object({
  userId: z.string().min(1),
  limit: z.number().min(1).max(100).default(10),
});

const { userId, limit } = schema.parse(req.body);
```

## Calling SAP HANA Stored Procedures

### Basic Procedure Call

```typescript
// Call a procedure with parameters
const results = await db.callProcedure(
  "SCHEMA.PROCEDURE_NAME",
  [param1, param2, param3]
);
```

### Single Result Procedure

```typescript
// Call a procedure that returns a single row
const result = await db.callProcedureOne(
  "SCHEMA.GET_USER",
  [userId]
);
```

### Procedure Examples

#### Example 1: Simple Procedure Call

```typescript
// SAP HANA Procedure:
// CREATE PROCEDURE BI_NEGT_KSA.GET_USER_DATA(IN user_id NVARCHAR(50))
// AS BEGIN
//   SELECT * FROM USERS WHERE ID = :user_id;
// END;

router.post("/user", authenticate, asyncHandler(async (req, res) => {
  const { userId } = z.object({ userId: z.string() }).parse(req.body);
  
  const results = await db.callProcedure(
    "BI_NEGT_KSA.GET_USER_DATA",
    [userId]
  );
  
  return sendSuccess(res, results);
}));
```

#### Example 2: Procedure with Multiple Parameters

```typescript
// SAP HANA Procedure:
// CREATE PROCEDURE BI_NEGT_KSA.SEARCH_USERS(
//   IN search_term NVARCHAR(100),
//   IN page_limit INTEGER,
//   IN page_offset INTEGER
// )
// AS BEGIN
//   SELECT * FROM USERS 
//   WHERE NAME LIKE '%' || :search_term || '%'
//   LIMIT :page_limit OFFSET :page_offset;
// END;

router.get("/search", authenticate, asyncHandler(async (req, res) => {
  const schema = z.object({
    searchTerm: z.string().optional(),
    limit: z.number().min(1).max(100).default(10),
    offset: z.number().min(0).default(0),
  });
  
  const params = schema.parse(req.query);
  
  const results = await db.callProcedure("BI_NEGT_KSA.SEARCH_USERS", [
    params.searchTerm || "",
    params.limit,
    params.offset,
  ]);
  
  return sendSuccess(res, results);
}));
```

#### Example 3: Procedure with Output Parameters

```typescript
// For procedures with OUT parameters, you may need to use raw queries
// or handle the result set structure differently

const results = await db.query(
  "CALL SCHEMA.PROCEDURE_WITH_OUTPUT(?, ?)",
  [inputParam]
);
// Results may contain both result sets and output parameters
```

## Best Practices

### 1. Always Use Parameterized Queries

✅ **Good:**
```typescript
await db.query("SELECT * FROM USERS WHERE id = ?", [userId]);
```

❌ **Bad:**
```typescript
await db.query(`SELECT * FROM USERS WHERE id = '${userId}'`);
```

### 2. Handle Errors Properly

```typescript
try {
  const results = await db.callProcedure("SCHEMA.PROCEDURE", [param]);
  return sendSuccess(res, results);
} catch (error: any) {
  logger.error({ error, param }, "Procedure call failed");
  return sendError(res, error.message, 500, "PROCEDURE_ERROR");
}
```

### 3. Validate All Inputs

```typescript
const schema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
  limit: z.number().int().min(1).max(100),
});

const validated = schema.parse(req.body);
```

### 4. Use TypeScript Types

```typescript
interface UserResult {
  id: string;
  name: string;
  email: string;
}

const results = await db.callProcedure<UserResult>(
  "SCHEMA.GET_USERS",
  []
);
```

### 5. Log Important Operations

```typescript
logger.info({ userId, procedure: "GET_USER_DATA" }, "Calling procedure");
const results = await db.callProcedure("SCHEMA.GET_USER_DATA", [userId]);
logger.info({ resultCount: results.length }, "Procedure completed");
```

## Route Organization

### Group Related Routes

```typescript
// routes/users.routes.ts
const router = Router();

router.get("/", authenticate, getUsers);
router.get("/:id", authenticate, getUserById);
router.post("/", authenticate, createUser);
router.put("/:id", authenticate, updateUser);
router.delete("/:id", authenticate, deleteUser);

export default router;
```

### Use Route Prefixes

```typescript
// In app.ts
app.use("/api/users", userRoutes);
app.use("/api/procedures", procedureRoutes);
```

## Security Considerations

1. **Always authenticate protected routes** with `authenticate` middleware
2. **Validate all inputs** before database operations
3. **Use parameterized queries** to prevent SQL injection
4. **Limit query results** to prevent resource exhaustion
5. **Log security-relevant operations** for audit trails

## Testing Routes

```typescript
// Example test structure
describe("GET /api/protected/procedures/user", () => {
  it("should call procedure successfully", async () => {
    const response = await request(app)
      .post("/api/protected/procedures/user")
      .set("Authorization", `Bearer ${token}`)
      .send({ userId: "123" });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

