/**
 * Script to update admin user email for testing password reset
 * Run this with: npx ts-node update_admin_email.ts
 */

import { database } from './models/database';
import { Q } from '@nozbe/watermelondb';

async function updateAdminEmail() {
  try {
    console.log('Finding admin user...');

    const users = await database.collections
      .get('users')
      .query(Q.where('username', 'admin'))
      .fetch();

    if (users.length === 0) {
      console.error('Admin user not found');
      return;
    }

    const admin = users[0];
    console.log('Current email:', admin.email);

    await database.write(async () => {
      await admin.update((user: any) => {
        user.email = 'priyadarshi2001@yahoo.com'; // Change this to your email
      });
    });

    console.log('✅ Admin email updated to: priyadarshi2001@yahoo.com');
    console.log('You can now test password reset with this email!');
  } catch (error) {
    console.error('Error updating email:', error);
  }
}

updateAdminEmail();
