import {
  IconCar,
  IconCarGarage,
  IconClipboardCheck,
  IconClipboardList,
  IconClipboardPlus,
  IconDashboard,
  IconEye,
  IconFileText,
  IconFolder,
  IconHelp,
  IconHistory,
  IconListDetails,
  IconReceipt,
  IconReceiptDollar,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from '@tabler/icons-react';

export const SIDEBAR_MENU = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: IconDashboard,
    },
    {
      title: 'Sales Enquiry',
      url: '/dashboard/sales-enquiry',
      icon: IconListDetails,
    },
    {
      title: 'Quotations',
      url: '/dashboard/quotations',
      icon: IconFileText,
    },
    {
      title: 'Discount Approvals',
      url: '/dashboard/discount-approvals',
      icon: IconReceiptDollar,
    },
    {
      title: 'Sales Order',
      url: '/dashboard/sales-order',
      icon: IconReceipt,
    },
    {
      title: 'Open Deposits',
      url: '/dashboard/open-deposits',
      icon: IconReceiptDollar,
    },
    {
      title: 'Book Test Drive',
      url: '/dashboard/test-drive',
      icon: IconCar,
    },
    {
      title: 'Dispatch & POD',
      url: '/dashboard/dispatch-pod',
      icon: IconFolder,
    },
    {
      title: 'Vehicle Services',
      url: '#',
      icon: IconCarGarage,
      items: [
        {
          title: 'Initiate Job Card Request',
          url: 'https://pp.neweast.cloud/pdis?uSrId=SAP30&LoTp=43330&co=BI_NEGT_KSA',
          icon: IconClipboardPlus,
          external: true,
        },
        {
          title: 'Inspection',
          url: 'https://pp.neweast.cloud/inspections?uSrId=SAP30&LoTp=43330&co=BI_NEGT_KSA',
          icon: IconClipboardCheck,
          external: true,
        },
        {
          title: 'Job Card Allocation and Close',
          url: 'https://pp.neweast.cloud/pdis',
          icon: IconClipboardList,
          external: true,
          externalApp: 'pdi' as const,
        },
        {
          title: 'Services History',
          url: 'https://pp.neweast.cloud/services-history?uSrId=SAP30&LoTp=43330&co=BI_NEGT_KSA',
          icon: IconHistory,
          external: true,
        },
        {
          title: 'View/Update Job Card',
          url: 'https://pp.neweast.cloud/job-cards?uSrId=SAP30&LoTp=43330&co=BI_NEGT_KSA',
          icon: IconEye,
          external: true,
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: 'Settings',
      url: '/dashboard/settings',
      icon: IconSettings,
    },
    {
      title: 'Get Help',
      url: '#',
      icon: IconHelp,
    },
    {
      title: 'Search',
      url: '#',
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: 'Reports',
      url: '#',
      icon: IconReport,
    },
    {
      name: 'Customer Master',
      url: '/dashboard/customer-master',
      icon: IconUsers,
    },
    {
      name: 'Vehicle Inventory',
      url: '/dashboard/vehicle-inventory',
      icon: IconCar,
    },
  ],
};
