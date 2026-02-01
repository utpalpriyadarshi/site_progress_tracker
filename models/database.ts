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
import PasswordHistoryModel from './PasswordHistoryModel';
import ScheduleRevisionModel from './ScheduleRevisionModel';
import TemplateModuleModel from './TemplateModuleModel';
import InterfacePointModel from './InterfacePointModel';
import SyncQueueModel from './SyncQueueModel';
import TeamModel from './TeamModel';
import TeamMemberModel from './TeamMemberModel';
import ResourceRequestModel from './ResourceRequestModel';
import BomModel from './BomModel';
import BomItemModel from './BomItemModel';
import DoorsPackageModel from './DoorsPackageModel';
import DoorsRequirementModel from './DoorsRequirementModel';
import VendorModel from './VendorModel';
import RfqModel from './RfqModel';
import RfqVendorQuoteModel from './RfqVendorQuoteModel';
import MilestoneModel from './MilestoneModel';
import MilestoneProgressModel from './MilestoneProgressModel';
import PurchaseOrderModel from './PurchaseOrderModel';
import BudgetModel from './BudgetModel';
import CostModel from './CostModel';
import InvoiceModel from './InvoiceModel';
import KeyDateModel from './KeyDateModel';
import KeyDateSiteModel from './KeyDateSiteModel';
import DesignDocumentCategoryModel from './DesignDocumentCategoryModel';
import DesignDocumentModel from './DesignDocumentModel';

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
    PasswordHistoryModel,
    ScheduleRevisionModel,
    TemplateModuleModel,
    InterfacePointModel,
    SyncQueueModel,
    TeamModel,
    TeamMemberModel,
    ResourceRequestModel,
    BomModel,
    BomItemModel,
    DoorsPackageModel,
    DoorsRequirementModel,
    VendorModel,
    RfqModel,
    RfqVendorQuoteModel,
    MilestoneModel,
    MilestoneProgressModel,
    PurchaseOrderModel,
    BudgetModel,
    CostModel,
    InvoiceModel,
    KeyDateModel,
    KeyDateSiteModel,
    DesignDocumentCategoryModel,
    DesignDocumentModel,
  ],
});