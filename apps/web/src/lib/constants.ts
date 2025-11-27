import {
  IconCar,
  IconChartBar,
  IconDashboard,
  IconFolder,
  IconHelp,
  IconListDetails,
  IconReceipt,
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
      title: 'Sales Order',
      url: '/dashboard/sales-order',
      icon: IconReceipt,
    },
    {
      title: ' Book Test Drive',
      url: '/dashboard/test-drive',
      icon: IconCar,
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
