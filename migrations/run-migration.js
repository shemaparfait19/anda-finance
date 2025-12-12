/**
 * Migration Script: Change number_of_shares from INTEGER to DECIMAL
 * 
 * Run this script to update your existing database:
 * node migrations/run-migration.js
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function runMigration() {
  console.log('🔄 Starting migration: Change number_of_shares to DECIMAL...\n');

  try {
    // Check if column exists and its current type
    console.log('1️⃣ Checking current column type...');
    const columnInfo = await sql`
      SELECT column_name, data_type, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_name = 'members' AND column_name = 'number_of_shares'
    `;

    if (columnInfo.length === 0) {
      console.log('⚠️  Column number_of_shares does not exist. Adding it...');
      await sql`
        ALTER TABLE members 
        ADD COLUMN number_of_shares NUMERIC(10, 2)
      `;
      console.log('✅ Column added successfully!\n');
    } else {
      const currentType = columnInfo[0].data_type;
      console.log(`   Current type: ${currentType}\n`);

      if (currentType === 'integer' || currentType === 'bigint') {
        console.log('2️⃣ Altering column type to NUMERIC(10, 2)...');
        await sql`
          ALTER TABLE members 
          ALTER COLUMN number_of_shares TYPE NUMERIC(10, 2)
        `;
        console.log('✅ Column type changed successfully!\n');
      } else if (currentType === 'numeric') {
        console.log('✅ Column is already NUMERIC. No change needed.\n');
      } else {
        console.log(`⚠️  Unexpected type: ${currentType}. Please check manually.\n`);
      }
    }

    // Verify the change
    console.log('3️⃣ Verifying the change...');
    const verifyInfo = await sql`
      SELECT column_name, data_type, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_name = 'members' AND column_name = 'number_of_shares'
    `;

    if (verifyInfo.length > 0) {
      const col = verifyInfo[0];
      console.log(`   Column: ${col.column_name}`);
      console.log(`   Type: ${col.data_type}`);
      console.log(`   Precision: ${col.numeric_precision}`);
      console.log(`   Scale: ${col.numeric_scale}\n`);

      if (col.data_type === 'numeric' && col.numeric_scale === 2) {
        console.log('✅ Migration completed successfully!');
        console.log('   You can now use decimal shares (e.g., 2.13, 9.6)\n');
      } else {
        console.log('⚠️  Migration may not have completed correctly. Please verify manually.\n');
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
