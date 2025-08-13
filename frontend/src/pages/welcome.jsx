import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/grocery.css";

export default function Welcome() {
  const navigate = useNavigate();
  return (
    <>
      <nav className="top-nav">
        <div className="nav-links">
          <a href="#" onClick={() => navigate("/grocerylist")}>My List</a>
          <a href="#" onClick={() => navigate("/groups")}>View Groups</a>
          <a href="#" className="signout" onClick={() => {
            localStorage.removeItem("user_id");
            localStorage.removeItem("access_token");
            navigate("/");
          }}>Sign Out</a>
        </div>
        <div style={{ position: "absolute", right: 24, top: 16 }}>
          <a href="/learnmore" className="btn" style={{ background: "var(--mint-green)", color: "var(--deep-plum)", fontWeight: "bold" }}>Learn More</a>
        </div>
      </nav>
      <main className="list-container" style={{ marginTop: 120, textAlign: "center" }}>
        <h1>Welcome!</h1>
        <p>Use the navigation above to manage your grocery lists and groups.</p>
      </main>
    </>
  );
}
