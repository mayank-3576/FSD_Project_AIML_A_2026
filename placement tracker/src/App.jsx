import { useState } from "react";
import "./App.css";

function App() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("Applied");

  const [applications, setApplications] = useState([]);

  function addApplication() {
    if (company === "" || role === "") return;

    const newApplication = {
      company,
      role,
      status,
    };

    setApplications([...applications, newApplication]);

    setCompany("");
    setRole("");
  }

  return (
    <div className="container">
      <h1>Placement Tracker</h1>

      <div className="form">
        <input
          placeholder="Company Name"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />

        <input
          placeholder="Job Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option>Applied</option>
          <option>Interview</option>
          <option>Selected</option>
          <option>Rejected</option>
        </select>

        <button onClick={addApplication}>
          Add Application
        </button>
      </div>

      <h2>My Applications</h2>

      <table>
        <thead>
          <tr>
            <th>Company</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {applications.map((app, index) => (
            <tr key={index}>
              <td>{app.company}</td>
              <td>{app.role}</td>
              <td>{app.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;