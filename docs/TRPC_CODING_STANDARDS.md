# tRPC Coding Standards

## Critical: Proper Indentation for tRPC Endpoints

### ⚠️ Known Gotcha: Indentation Issues

**Problem**: Incorrect indentation of `.input()`, `.query()`, or `.mutation()` method chains can cause tRPC to fail silently or not register endpoints properly.

**Symptom**: 
- 400 Bad Request errors
- Zod validation errors saying fields are "undefined" 
- Endpoint appears to be registered but doesn't receive input correctly

### ✅ Correct Pattern

```typescript
export const myRouter = router({
  myEndpoint: adminProcedure
    .input(z.object({          // <- 4 spaces indent (2 for procedure + 2 for chaining)
      field: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Implementation
      return { success: true };
    }),

  anotherEndpoint: protectedProcedure
    .input(z.object({          // <- Same pattern
      id: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      // Implementation
    }),
});
```

### ❌ Incorrect Patterns

```typescript
// WRONG: No indentation on .input()
export const myRouter = router({
  myEndpoint: adminProcedure
.input(z.object({              // <- BAD: No spaces before .input()
    field: z.string(),
  }))
.mutation(async ({ input }) => {
    return { success: true };
  }),
});

// WRONG: Inconsistent indentation
export const myRouter = router({
  myEndpoint: adminProcedure
      .input(z.object({        // <- BAD: Too many spaces (should be 4, not 6)
      field: z.string(),
    }))
    .mutation(async ({ input }) => {
      return { success: true };
    }),
});
```

## Standard Indentation Rules

1. **Router definition**: 2 spaces
2. **Method chaining**: Add 2 more spaces per level
3. **Function body**: 2 spaces from function declaration

### Example with Full Indentation

```typescript
export const adminRouter = router({
  // Level 0: Router definition (2 spaces base)
  getDashboardStats: adminProcedure    // 2 spaces
    .query(async () => {               // 4 spaces (2 base + 2 for chain)
      // Level 1: Function body
      const stats = await fetchStats(); // 6 spaces (4 + 2 for body)
      return stats;
    }),

  deleteItem: adminProcedure           // 2 spaces
    .input(z.object({                  // 4 spaces
      id: z.string().uuid(),           // 6 spaces (inside object)
    }))
    .mutation(async ({ input }) => {   // 4 spaces
      await db.delete(input.id);       // 6 spaces
      return { success: true };
    }),
});
```

## Linting Configuration

Add to your `.eslintrc.json`:

```json
{
  "rules": {
    "indent": ["error", 2, {
      "MemberExpression": 1,
      "CallExpression": {"arguments": 1}
    }],
    "@typescript-eslint/indent": ["error", 2, {
      "MemberExpression": 1,
      "CallExpression": {"arguments": 1}
    }]
  }
}
```

## Pre-commit Hook

Consider adding Prettier with these settings in `.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

## Testing Your Endpoints

After creating a new tRPC endpoint, always test:

1. **Syntax check**: Run `npm run build` or `tsc --noEmit`
2. **Endpoint registration**: Check server logs for route registration
3. **Input parsing**: Test with curl or client to verify input is received
4. **Type safety**: Ensure TypeScript intellisense works for the endpoint

## Common Issues Checklist

- [ ] All `.input()`, `.query()`, `.mutation()` properly indented
- [ ] Consistent spacing throughout the file
- [ ] ESLint passes without warnings
- [ ] Endpoint shows up in tRPC router type definitions
- [ ] Client receives proper types for input/output
- [ ] Zod validation errors include field names (not "undefined")

## Real-World Example: The Bug That Was Fixed

**Before (broken)**:
```typescript
deleteExerciseTemplate: adminProcedure
.input(z.object({                      // <- No indentation!
  template_id: z.string(),
}))
.mutation(async ({ input }) => {
  // input.template_id was undefined!
```

**After (fixed)**:
```typescript
deleteExerciseTemplate: adminProcedure
  .input(z.object({                    // <- Proper indentation
    template_id: z.string(),
  }))
  .mutation(async ({ input }) => {
    // input.template_id works correctly
```

**Impact**: The missing indentation caused tRPC to not properly register the endpoint, resulting in input parameters being undefined despite correct client requests.

## IDE Setup

### VS Code

1. Install extensions:
   - ESLint
   - Prettier - Code formatter
   
2. Add to `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### IntelliJ/WebStorm

1. Enable ESLint: `Settings > Languages & Frameworks > JavaScript > Code Quality Tools > ESLint`
2. Enable Prettier: `Settings > Languages & Frameworks > JavaScript > Prettier`
3. Set "On save" action to format code

## Additional Resources

- [tRPC Documentation](https://trpc.io/docs)
- [TypeScript Handbook - Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
- [ESLint Rules - Indent](https://eslint.org/docs/rules/indent)

---

**Last Updated**: October 14, 2025  
**Version**: 1.0.0
