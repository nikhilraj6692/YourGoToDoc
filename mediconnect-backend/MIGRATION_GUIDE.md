# MongoDB Migration Guide

This guide explains how to use the versioned MongoDB migration system in MediConnect.

## Overview

The `CustomFlywayService` manages MongoDB database migrations using versioned scripts. Each migration script has a version number and is executed only once, ensuring idempotent database updates.

## How It Works

1. **Version Tracking**: The system tracks the current database version in the `flyway_config` collection
2. **Script Discovery**: Available migration scripts are defined in `CustomFlywayService.MIGRATION_SCRIPTS`
3. **Version Comparison**: Only scripts with higher versions than the current database version are executed
4. **Sequential Execution**: Scripts are executed in version order (V1.1 → V1.2 → V1.3, etc.)

## Current Migration Scripts

| Version | Script File | Description |
|---------|-------------|-------------|
| V1.1 | `mongo-init-v1.1.js` | Initial database setup (collections, indexes, sample data) |
| V1.2 | `mongo-init-v1.2.js` | Added new collections (prescriptions, medical_records, etc.) |

## Creating a New Migration

### Step 1: Create the Migration Script

Create a new JavaScript file in `src/main/resources/` with the naming convention:
```
mongo-init-vX.Y.js
```

Where:
- `X` = Major version number
- `Y` = Minor version number

### Step 2: Write the Migration Script

Your script should:

1. **Include version information** in comments
2. **Be idempotent** - safe to run multiple times
3. **Use existence checks** before creating collections/indexes
4. **Handle errors gracefully**

Example structure:
```javascript
// MongoDB migration script for MediConnect - Version X.Y
// This script [description of changes]

db = db.getSiblingDB('mediconnect');

print('Starting MediConnect database migration - Version X.Y...');

// Your migration logic here
// Always check if something exists before creating it

print('MediConnect X.Y migration completed successfully!');
print('Version: X.Y');
print('Timestamp: ' + new Date());
```

### Step 3: Add to CustomFlywayService

Update the `MIGRATION_SCRIPTS` list in `CustomFlywayService.java`:

```java
private static final List<MigrationScript> MIGRATION_SCRIPTS = List.of(
    new MigrationScript("mongo-init-v1.1.js", "V1.1"),
    new MigrationScript("mongo-init-v1.2.js", "V1.2"),
    new MigrationScript("mongo-init-v1.3.js", "V1.3")  // Add your new script here
);
```

### Step 4: Test the Migration

1. **Local Testing**: Run the application locally to test the migration
2. **Check Logs**: Verify the migration executes successfully
3. **Verify Changes**: Check that the expected database changes are applied

## Migration Best Practices

### 1. **Always Use Existence Checks**
```javascript
// Good - checks if collection exists
if (!db.getCollectionNames().includes('new_collection')) {
    db.createCollection('new_collection');
}

// Good - checks if index exists
if (!db.users.getIndexes().some(idx => idx.name === 'new_index_1')) {
    db.users.createIndex({ "newField": 1 });
}
```

### 2. **Handle Data Safely**
```javascript
// Good - check if data exists before inserting
var existingData = db.collection.findOne({ "uniqueField": "value" });
if (!existingData) {
    db.collection.insertOne({ "uniqueField": "value", "data": "..." });
}
```

### 3. **Use Descriptive Comments**
```javascript
// =============================================================================
// NEW FEATURE: User Preferences
// =============================================================================
print('Adding user preferences collection...');
```

### 4. **Version Numbers**
- Use semantic versioning: `V1.1`, `V1.2`, `V2.0`
- Never reuse version numbers
- Always increment from the highest existing version

## Common Migration Patterns

### Adding a New Collection
```javascript
if (!db.getCollectionNames().includes('new_collection')) {
    db.createCollection('new_collection');
    print('Created collection: new_collection');
}
```

### Adding Indexes
```javascript
if (!db.collection.getIndexes().some(idx => idx.name === 'index_name_1')) {
    db.collection.createIndex({ "field": 1 }, { unique: true });
    print('Created index: index_name_1');
}
```

### Adding Sample Data
```javascript
var sampleData = db.collection.findOne({ "uniqueField": "value" });
if (!sampleData) {
    db.collection.insertOne({
        "uniqueField": "value",
        "data": "sample data",
        "createdAt": new Date()
    });
    print('Created sample data');
}
```

### Schema Updates
```javascript
// Add new field to existing documents
db.collection.updateMany(
    { "newField": { $exists: false } },
    { "$set": { "newField": "defaultValue" } }
);
```

## Troubleshooting

### Migration Not Running
1. **Check Version**: Ensure your script version is higher than current DB version
2. **Check File**: Verify the script file exists in `src/main/resources/`
3. **Check Logs**: Look for migration-related log messages

### Migration Failing
1. **Check Syntax**: Ensure JavaScript syntax is correct
2. **Check Permissions**: Verify MongoDB user has necessary permissions
3. **Check Dependencies**: Ensure any required collections exist

### Rollback Strategy
Currently, the system doesn't support automatic rollbacks. For manual rollback:
1. **Backup Data**: Always backup before running migrations
2. **Manual Reversion**: Create a rollback script if needed
3. **Version Reset**: Manually update the `flyway_config` collection

## Monitoring Migrations

### Check Current Version
```javascript
// In MongoDB shell
db.flyway_config.find().sort({lastExecutedAt: -1}).limit(1)
```

### Check Migration History
```javascript
// In MongoDB shell
db.flyway_config.find().sort({lastExecutedAt: -1})
```

### View Applied Changes
```javascript
// Check collections
db.getCollectionNames()

// Check indexes
db.collection_name.getIndexes()
```

## Security Considerations

1. **Script Validation**: Always review migration scripts before deployment
2. **Data Backup**: Backup production data before running migrations
3. **Testing**: Test migrations in staging environment first
4. **Permissions**: Use appropriate MongoDB user permissions

## Future Enhancements

Potential improvements to consider:
- **Rollback Support**: Automatic rollback capabilities
- **Migration Validation**: Pre-flight checks for migration scripts
- **Parallel Migrations**: Support for non-conflicting parallel migrations
- **Migration Testing**: Automated testing framework for migrations 