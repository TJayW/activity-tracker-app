// routes.tsx
import Home from './src/pages/Home';
import ActivityHistory from './src/pages/ActivityHistory';
import Statistics from './src/pages/Statistics';
import Settings from './src/pages/Settings';
import Geofence from './src/pages/Geofence';

const routes = [
  {
    name: 'Home',
    component: Home,
    options: {},
  },
  {
    name: 'ActivityHistory',
    component: ActivityHistory,
    options: {},
  },
  {
    name: 'Statistics',
    component: Statistics,
    options: {},
  },
  {
    name: 'Geofence',
    component: Geofence,
    options: {},
  },
  {
    name: 'Settings',
    component: Settings,
    options: {},
  },
];

export default routes;
