import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/signup";
import Login from "./pages/login";
import Home from "./pages/home";
import GroceryList from "./pages/GroceryList";


import LearnMore from "./pages/LearnMore";
import Groups from "./pages/Groups";
import GroupList from "./pages/GroupList";
import UserCodeFooter from "./components/UserCodeFooter";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/welcome" element={<GroceryList />} />
          <Route path="/learnmore" element={<LearnMore />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:groupId" element={<GroupList />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
      <UserCodeFooter />
    </>
  );
}

export default App;
