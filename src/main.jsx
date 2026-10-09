import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "../style.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <BrowserRouter basename="/rujooh">
  <Routes>
    <Route path="/" element={<App />} />
  </Routes>
</BrowserRouter>
);
