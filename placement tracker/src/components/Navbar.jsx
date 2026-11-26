function Navbar({ role, setRole, onMenuToggle }) {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      {/* Left side: Menu button and title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden px-2 py-1 border rounded text-gray-600"
        >
          ☰
        </button>

        <h1 className="text-xl font-bold text-blue-600">
          Placement Tracker
        </h1>
      </div>

      {/* Right side: Role dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Role:</span>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
        >
          <option value="Student">Student</option>
          <option value="TPO">TPO</option>
          <option value="Faculty">Faculty</option>
          <option value="Admin">Admin</option>
        </select>
      </div>
    </nav>
  );
}

export default Navbar;
