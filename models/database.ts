import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import schema from './schema';
import SiteModel from './SiteModel';
import CategoryModel from './CategoryModel';
import ItemModel from './ItemModel';
import ProjectModel from './ProjectModel';
import TaskModel from './TaskModel';
import MaterialModel from './MaterialModel';
import ProgressReportModel from './ProgressReportModel';
import ProgressLogModel from './ProgressLogModel';
import HindranceModel from './HindranceModel';

const adapter = new SQLiteAdapter({
  schema,
  // Optional: Enable bottom-up migrations from older schema versions
  // migrationsEnabled: true,
});

export const database = new Database({
  adapter,
  modelClasses: [
    SiteModel,
    CategoryModel,
    ItemModel,
    ProjectModel,
    TaskModel,
    MaterialModel,
    ProgressReportModel,
    ProgressLogModel,
    HindranceModel,
  ],
});