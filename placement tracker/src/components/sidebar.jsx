import { NavLink } from "react-router-dom";

function Sidebar({ role, isOpen, onClose }) {
  const menuLinks = {
    Student: [
      { name: "Dashboard", path: "/" },
      { name: "Eligible Drives", path: "/drives" },
      { name: "My Applications", path: "/applications" },
      { name: "Profile & Resume", path: "/profile" },
    ],
    TPO: [
      { name: "Dashboard", path: "/" },
      { name: "Companies", path: "/companies" },
      { name: "Placement Drives", path: "/drives" },
      { name: "Applications", path: "/applications" },
      { name: "Analytics", path: "/analytics" },
    ],
    Faculty: [
      { name: "Dashboard", path: "/" },
      { name: "Students", path: "/students" },
      { name: "Training Scores", path: "/assessments" },
      { name: "Analytics", path: "/analytics" },
    ],
    Admin: [
      { name: "Dashboard", path: "/" },
      { name: "Users & Roles", path: "/users" },
      { name: "Departments", path: "/departments" },
      { name: "Companies", path: "/companies" },
      { name: "Analytics", path: "/analytics" },
    ],
  };

  const links = menuLinks[role] || menuLinks.Student;

  return (
    <aside
      className={`${
        isOpen ? "block" : "hidden"
      } lg:block w-60 bg-white border-r border-gray-200 p-4`}
    >
      {/* Mobile view ke liye close button */}
      <div className="flex items-center justify-between mb-4 lg:hidden">
        <span className="font-bold text-gray-800">Menu</span>
        <button
          onClick={onClose}
          className="px-2 py-1 text-sm text-gray-600 border rounded"
        >
          ✕
        </button>
      </div>

      <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
        {role} Menu
      </p>

      <nav className="flex flex-col gap-1">
        {links.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            onClick={onClose}
            className={({ isActive }) =>
              `px-3 py-2 rounded text-sm font-medium ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
