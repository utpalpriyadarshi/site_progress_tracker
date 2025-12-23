# Category Names Migration Guide

## Overview

This migration updates category names in existing databases to reflect the new naming convention:

| Old Name | New Name | New Description |
|----------|----------|----------------|
| **Finishing** | **Handing Over** | Final handover and closeout tasks |
| **Framing** | **Punch List** | Final inspection and defect rectification |

## New Category Order

After migration, categories will appear in this logical construction sequence:

1. **Foundation Work** - Foundation construction tasks
2. **Civil Works** - Foundation, excavation, concrete works
3. **MEP (Mechanical, Electrical, Plumbing)** - HVAC, electrical systems, plumbing
4. **Architectural Finishes** - Flooring, wall finishes, ceiling, painting
5. **Installation** - Installation and assembly tasks
6. **Testing** - Testing and quality assurance
7. **Commissioning** - Commissioning and handover tasks
8. **Punch List** - Final inspection and defect rectification *(formerly "Framing")*
9. **Handing Over** - Final handover and closeout tasks *(formerly "Finishing")*

---

## When to Run This Migration

**Run this migration ONLY IF:**
- ✅ You have an existing database with data
- ✅ You have categories named "Finishing" or "Framing"
- ✅ You want to update category names without losing data

**DO NOT run this migration if:**
- ❌ You're setting up a new database (new installations automatically use the new names)
- ❌ You've already run this migration before
- ❌ You don't have any existing categories

---

## How to Run the Migration

### Option 1: Add to App Startup (Recommended for Production)

Add this code to your app's initialization (e.g., in `App.tsx` or `index.tsx`):

```typescript
import { migrateCategoryNames } from './scripts/migrateCategoryNames';

// Run once on app startup
useEffect(() => {
  const runMigration = async () => {
    try {
      await migrateCategoryNames();
      console.log('✅ Category migration completed');
    } catch (error) {
      console.error('❌ Category migration failed:', error);
    }
  };

  runMigration();
}, []); // Empty dependency array = run once
```

### Option 2: Run Manually in Development

1. Open your React Native development console
2. Import the migration script:
   ```javascript
   import { migrateCategoryNames } from './scripts/migrateCategoryNames';
   ```
3. Run the migration:
   ```javascript
   await migrateCategoryNames();
   ```

### Option 3: Create a Migration Button (Safest for Testing)

Add a temporary button to your settings or developer screen:

```typescript
import { migrateCategoryNames } from './scripts/migrateCategoryNames';

const MigrationButton = () => {
  const [migrating, setMigrating] = useState(false);

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      await migrateCategoryNames();
      Alert.alert('Success', 'Categories migrated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Migration failed. Check console for details.');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <Button
      mode="contained"
      onPress={handleMigrate}
      loading={migrating}
      disabled={migrating}
    >
      Migrate Category Names
    </Button>
  );
};
```

---

## Verifying the Migration

After running the migration, verify it was successful:

```typescript
import { verifyCategoryMigration } from './scripts/migrateCategoryNames';

await verifyCategoryMigration();
```

This will:
- ✅ List all categories in your database
- ✅ Check if old names ("Finishing", "Framing") still exist
- ✅ Confirm successful migration

**Expected Console Output:**
```
🔍 Verifying categories...

Found 9 categories:

1. Foundation Work
   Description: Foundation construction tasks
   ID: abc123...

2. Civil Works
   Description: Foundation, excavation, concrete works
   ID: def456...

...

8. Punch List
   Description: Final inspection and defect rectification
   ID: xyz789...

9. Handing Over
   Description: Final handover and closeout tasks
   ID: uvw012...

✅ All categories have been migrated successfully!
```

---

## Rollback (If Needed)

If you need to revert to the old category names:

```typescript
import { rollbackCategoryMigration } from './scripts/migrateCategoryNames';

await rollbackCategoryMigration();
```

⚠️ **Warning:** Only use rollback if you need to restore the old names. This will undo the migration.

---

## Migration Safety

This migration is **safe** and **non-destructive**:

- ✅ **Only updates category names** - does not affect items or other data
- ✅ **Preserves all relationships** - items linked to categories remain linked
- ✅ **No data loss** - only renames existing categories
- ✅ **Idempotent** - safe to run multiple times (skips already-migrated categories)
- ✅ **Reversible** - can be rolled back if needed

---

## Troubleshooting

### Migration reports "Category not found"

This is normal! It means:
- You don't have categories with the old names ("Finishing" or "Framing")
- Your database was created after the category names were updated
- The migration has already been run

**Solution:** No action needed. Your categories are already using the new names.

### Migration fails with an error

**Possible causes:**
1. Database connection issue
2. Insufficient permissions
3. Database corruption

**Solution:**
1. Check console logs for detailed error message
2. Verify database is initialized properly
3. Try restarting the app
4. Contact support if issue persists

### Old category names still appear after migration

**Possible causes:**
1. Migration didn't run successfully
2. Cache not cleared
3. Multiple database instances

**Solution:**
1. Run `verifyCategoryMigration()` to check actual database state
2. Restart the app to clear cache
3. Check console logs for migration completion message

---

## Post-Migration Steps

After successful migration:

1. ✅ **Verify** - Run `verifyCategoryMigration()` to confirm
2. ✅ **Test** - Check that items still display correctly in the UI
3. ✅ **Remove migration code** - Once confirmed working, you can remove the migration call from app startup
4. ✅ **Update documentation** - If you have custom docs, update category references

---

## Support

If you encounter any issues with the migration:

1. Check the console logs for detailed error messages
2. Run `verifyCategoryMigration()` to see current database state
3. Review this guide for troubleshooting steps
4. Contact the development team with:
   - Error message from console
   - Number of categories affected
   - App version and device information

---

## Technical Details

**Migration Script:** `scripts/migrateCategoryNames.ts`

**What it does:**
1. Queries database for categories with old names
2. Updates each matching category with new name and description
3. Logs progress and results
4. Provides verification and rollback functions

**Database Impact:**
- **Tables affected:** `categories` (only the `name` and `description` columns)
- **Tables NOT affected:** `items`, `sites`, `progress_logs`, etc.
- **Relationships preserved:** All foreign key relationships remain intact

**Performance:**
- Fast migration (< 1 second for typical databases)
- No downtime required
- Can run while app is in use (though restart recommended)

---

## FAQ

**Q: Do I need to run this migration on every device?**
A: Yes, if each device has its own local database. If using sync, run it once and sync will propagate changes.

**Q: Will this affect items linked to these categories?**
A: No, items remain linked to the same category ID. Only the category name changes.

**Q: Can I customize the new category names?**
A: Yes, edit the `CATEGORY_UPDATES` array in `migrateCategoryNames.ts` before running.

**Q: What if I have custom categories with these names?**
A: The migration only updates categories that exactly match "Finishing" or "Framing". Custom categories are unaffected.

**Q: How do I know if the migration succeeded?**
A: Check the console logs. You should see "✅ Migration completed successfully!" with update counts.

---

## Version History

- **v1.0** (2025-12-23) - Initial migration script
  - Renames "Finishing" → "Handing Over"
  - Renames "Framing" → "Punch List"
  - Reorders categories to logical construction sequence
