# Database Management Scripts

## User Management Scripts

### List All Users
View all users in the database with their roles and status:

```bash
npm run db:list-users
```

This will show:
- Email
- Name
- Role (ADMIN, DISPATCHER, ACCOUNTANT, DRIVER, CUSTOMER)
- Active status
- Company

### Fix Admin User
Restore admin permissions to a user account:

```bash
npm run db:fix-admin <email>
```

Example:
```bash
npm run db:fix-admin admin@example.com
```

This script will:
1. Find the user by email
2. Display current user details
3. Update their role to ADMIN
4. Ensure the account is active

**Important:** After running this script, the user must log out and log back in for changes to take effect.

## Quick Fix for Lost Admin Access

If you've lost admin access:

1. **List all users to find your email:**
   ```bash
   npm run db:list-users
   ```

2. **Fix your admin account:**
   ```bash
   npm run db:fix-admin your-email@example.com
   ```

3. **Log out and log back in** to refresh your session

## Other Available Scripts

- `npm run db:create-admin` - Create a new admin user
- `npm run db:seed` - Seed the database with demo data
- `npm run db:reset` - Reset the database (WARNING: Deletes all data)
- `npm run db:studio` - Open Prisma Studio to view/edit database





