# HomeMaid Multi-User Migration Guide

## Overview

This guide covers the migration from a single-user to a multi-user architecture with proper data isolation.

## What Changed

### Before (Single-User)
- All data was shared across users
- No userId filtering in queries
- No authentication required
- All users saw the same recipes, tasks, expenses, groceries

### After (Multi-User)
- Complete data isolation per user
- All queries filter by userId
- Authentication required for all operations
- Each user has their own private data
- Master task templates shared across users

## Migration Steps

### 1. Clean Up Existing Data

**IMPORTANT**: Delete all existing data in Firestore before deploying the new version.

```bash
# Delete all collections
firebase firestore:delete users --recursive
firebase firestore:delete recipes --recursive
firebase firestore:delete tasks --recursive
firebase firestore:delete dailyTaskTemplates --recursive
firebase firestore:delete expenses --recursive
firebase firestore:delete groceries --recursive
```

### 2. Deploy New Firestore Rules

```bash
cd www
firebase deploy --only firestore:rules
```

The new rules enforce:
- Users can ONLY access their own data
- Master templates are read-only for all users
- All operations require authentication

### 3. Seed Master Task Templates

```bash
cd scripts
npm install
npm run seed:templates
```

This creates 62 master task templates that all users can browse and copy.

### 4. Deploy Application Code

```bash
cd www
vercel --prod
```

## Code Changes Summary

### Firestore Rules (`firestore.rules`)
- Added `masterTaskTemplates` collection (read-only for users)
- Changed all collections to enforce `userId` matching
- Removed legacy data support (no more `|| resource.data.userId == null`)

### Task Queries (`src/lib/tasks.ts`)
- `getTasksForDate()`: Added `where("userId", "==", user.uid)`
- `onTasksForDate()`: Added userId parameter and filter
- `getDailyTaskTemplates()`: Added userId filter
- `getCarryOverTasks()`: Added userId filter

### Recipe Queries (`src/lib/recipes.ts`)
- `getAllRecipes()`: Added `where("userId", "==", user.uid)`
- Added `where` import from firebase/firestore

### Task Page (`src/app/tasks/page.tsx`)
- Updated `onTasksForDate()` call to include `user.uid` parameter

## New Features

### Master Task Templates

Users can now browse a library of 62 pre-defined household tasks:

**Daily Tasks (38)**:
- Morning Routine (5 tasks)
- Laundry (4 tasks)
- Cleaning (8 tasks)
- Kitchen & Meals (7 tasks)
- Organizing (5 tasks)
- Maintenance (5 tasks)
- Evening Routine (4 tasks)

**Weekly Tasks (10)**:
- Deep cleaning tasks scheduled for specific days
- Meal prep, organizing, maintenance

**Bi-weekly Tasks (4)**:
- Deep oven cleaning
- Ceiling fans
- Closet organization
- Baseboards

**Monthly Tasks (10)**:
- Deep cleaning
- Maintenance checks
- Bill payments
- Safety checks

### User Workflow

1. **First Login**: User creates account
2. **Browse Templates**: View master task templates
3. **Copy to My Tasks**: Select templates to add to personal list
4. **Customize**: Enable/disable, reorder, or create custom templates
5. **Daily Use**: Tasks auto-generate based on user's templates

## Database Structure

```
firestore/
├── masterTaskTemplates/          # Shared, read-only
│   └── {templateId}
│       ├── title
│       ├── recurrence (daily/weekly/biweekly/monthly)
│       ├── category
│       ├── dayOfWeek (for weekly/biweekly)
│       ├── dayOfMonth (for monthly)
│       ├── order
│       └── enabled
│
├── users/                        # Per-user data
│   └── {userId}/
│
├── dailyTaskTemplates/           # Per-user templates
│   └── {templateId}
│       ├── userId ← REQUIRED
│       ├── title
│       ├── recurrence
│       └── ...
│
├── tasks/                        # Per-user tasks
│   └── {taskId}
│       ├── userId ← REQUIRED
│       ├── title
│       ├── date
│       └── ...
│
├── recipes/                      # Per-user recipes
│   └── {recipeId}
│       ├── userId ← REQUIRED
│       └── ...
│
├── expenses/                     # Per-user expenses
│   └── {expenseId}
│       ├── userId ← REQUIRED
│       └── ...
│
└── groceries/                    # Per-user groceries
    └── {groceryId}
        ├── userId ← REQUIRED
        └── ...
```

## Testing Checklist

- [ ] Delete all existing Firestore data
- [ ] Deploy new Firestore rules
- [ ] Seed master task templates
- [ ] Deploy application code
- [ ] Create test user A
- [ ] Create test user B
- [ ] User A: Create tasks, recipes, expenses
- [ ] User B: Verify cannot see User A's data
- [ ] Both users: Verify can see master templates
- [ ] User A: Copy master template to personal templates
- [ ] User A: Verify daily tasks auto-generate
- [ ] User B: Create different tasks
- [ ] Verify complete data isolation

## Rollback Plan

If issues occur:

1. Revert Firestore rules:
   ```bash
   git checkout HEAD~1 firestore.rules
   firebase deploy --only firestore:rules
   ```

2. Revert application code:
   ```bash
   git revert HEAD
   vercel --prod
   ```

3. Restore data from backup (if available)

## Support

For issues or questions, check:
- Firestore console for data structure
- Browser console for query errors
- Firebase console for rule violations
