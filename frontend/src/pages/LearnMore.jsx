import React from "react";
import "../css/learnmore.css";
import { useNavigate } from "react-router-dom";

export default function LearnMore() {
  const navigate = useNavigate();
  return (
    <div className="learn-more">
      <div className="top-bar">
        <button className="btn" onClick={() => navigate("/signup")}>Get Started 🚀</button>
      </div>
      <h1>Why Choose Our App? 🌟</h1>
      <p>🛒 <strong>Organize Your Shopping</strong> — Keep all your grocery, home, or wish lists neatly in one place.</p>
      <p>👨‍👩‍👧‍👦 <strong>Share with Family & Friends</strong> — Create shared lists so everyone’s on the same page (literally).</p>
      <p>💰 <strong>Track Prices & Quantities</strong> — Always know your total before you buy.</p>
      <p>⏱️ <strong>Save Time</strong> — No more last-minute store runs or forgotten items.</p>
      <p>📱 <strong>Accessible Anywhere</strong> — Works on your phone, tablet, and computer.</p>
      <div className="contributors">
        <h2>Project Contributors 🤝</h2>
        <ul>
          <li>👤 Latese Thompson <a href="https://www.linkedin.com/in/latese-thompson-508a1a273/" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
          <li>👤 Brenae Brooks <a href="https://www.linkedin.com/in/brenae-b-9b7652294/" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
          <li>👤 MD Zawad Tanzim <a href="https://www.linkedin.com/in/zawadtanzim/" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
          <li>👤 Ryan Thomas <a href="https://www.linkedin.com/in/ryan-thomas-19a419197/" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
        </ul>
      </div>
    </div>
  );
}
