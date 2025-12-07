export type RootStackParamList = {
  Auth: undefined;
  Admin: undefined;
  Supervisor: undefined;
  Manager: undefined;
  Planning: undefined;
  Logistics: undefined;
  DesignEngineer: undefined;
  CommercialManager: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  RoleSelection: {
    userId: string;
    username: string;
  };
};

export type PlanningStackParamList = {
  WBSManagement: undefined;
  ItemCreation: {
    siteId: string;
    parentWbsCode?: string;
  };
  ItemEdit: {
    itemId: string;
  };
};