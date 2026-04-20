import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Inventario from "./pages/Inventario";
import Dashboard from "./pages/Dashboard";
import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventario" element={<Inventario />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;