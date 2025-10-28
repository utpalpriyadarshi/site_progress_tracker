import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import schema from './schema';
import migrations from './migrations';
import SiteModel from './SiteModel';
import CategoryModel from './CategoryModel';
import ItemModel from './ItemModel';
import ProjectModel from './ProjectModel';
import MaterialModel from './MaterialModel';
import ProgressLogModel from './ProgressLogModel';
import HindranceModel from './HindranceModel';
import DailyReportModel from './DailyReportModel';
import SiteInspectionModel from './SiteInspectionModel';
import RoleModel from './RoleModel';
import UserModel from './UserModel';
import SessionModel from './SessionModel';
import ScheduleRevisionModel from './ScheduleRevisionModel';
import TemplateModuleModel from './TemplateModuleModel';
import InterfacePointModel from './InterfacePointModel';

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'ConstructionSiteDB',
});

export const database = new Database({
  adapter,
  modelClasses: [
    SiteModel,
    CategoryModel,
    ItemModel,
    ProjectModel,
    MaterialModel,
    ProgressLogModel,
    HindranceModel,
    DailyReportModel,
    SiteInspectionModel,
    RoleModel,
    UserModel,
    SessionModel,
    ScheduleRevisionModel,
    TemplateModuleModel,
    InterfacePointModel,
  ],
});