import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import schema from './schema';
import ProjectModel from './ProjectModel';
import TaskModel from './TaskModel';
import MaterialModel from './MaterialModel';
import ProgressReportModel from './ProgressReportModel';

const adapter = new SQLiteAdapter({
  schema,
  // Optional: Enable bottom-up migrations from older schema versions
  // migrationsEnabled: true,
});

export const database = new Database({
  adapter,
  modelClasses: [
    ProjectModel,
    TaskModel,
    MaterialModel,
    ProgressReportModel,
  ],
});