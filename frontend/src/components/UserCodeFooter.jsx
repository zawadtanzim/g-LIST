import React, { useEffect, useState } from "react";
import "./UserCodeFooter.css";

export default function UserCodeFooter() {
  const [userCode, setUserCode] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const check = () => {
      const code = localStorage.getItem("user_code");
      const userId = localStorage.getItem("user_id");
      const token = localStorage.getItem("access_token");
      setUserCode(code || "");
      setLoggedIn(!!(userId && token));
    };
    check();
    window.addEventListener("storage", check);
    window.addEventListener("user-auth-changed", check);
    return () => {
      window.removeEventListener("storage", check);
      window.removeEventListener("user-auth-changed", check);
    };
  }, []);

  if (!userCode || !loggedIn) return null;
  return (
    <div className="user-code-footer">
      User code: <span>{userCode}</span>
    </div>
  );
}
