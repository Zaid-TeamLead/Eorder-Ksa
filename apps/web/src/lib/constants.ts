import {
  IconCar,
  IconChartBar,
  IconDashboard,
  IconFolder,
  IconHelp,
  IconListDetails,
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
      title: ' Book Test Drive',
      url: '/dashboard/test-drive',
      icon: IconCar,
    },
  ],
  navSecondary: [
    {
      title: 'Settings',
      url: '#',
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
      url: '#',
      icon: IconUsers,
    },
    {
      name: 'Vehicle Inventory',
      url: '#',
      icon: IconCar,
    },
  ],
};
