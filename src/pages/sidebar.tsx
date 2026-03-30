import { NavLink } from 'react-router-dom';
import { HomeIcon, BeakerIcon, DocumentTextIcon } from '@heroicons/react/24/outline'; // install: npm install @heroicons/react

const navigation = [
  { name: 'Dashboard', to: '/', icon: HomeIcon },
  { name: 'Soil Analysis', to: '/analysis', icon: BeakerIcon, end: false },
  { name: 'Reports', to: '/reports', icon: DocumentTextIcon },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 text-xl font-bold border-b border-gray-700">GeoTech</div>
      <nav className="flex-1 mt-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-sm ${
                isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`
            }
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}