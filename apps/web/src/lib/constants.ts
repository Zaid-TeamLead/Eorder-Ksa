import {
  IconCar,
  IconChartBar,
  IconDashboard,
  IconFileText,
  IconFolder,
  IconHelp,
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
      title: ' Book Test Drive',
      url: '/dashboard/test-drive',
      icon: IconCar,
    },
    {
      title: 'Dispatch & POD',
      url: '/dashboard/dispatch-pod',
      icon: IconFolder,
    },
    {
      title: 'PDI',
      url: 'https://pp.neweast.cloud/pdis',
      icon: IconChartBar,
      external: true,
      externalApp: 'pdi' as const,
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
