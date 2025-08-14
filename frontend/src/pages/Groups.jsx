
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Groups.css";

const mockGroups = [
  { name: "Family Shopping List" },
  { name: "Roommates Essentials" },
  { name: "Birthday Party Plan" },
];

const mockSentInvitations = [
  { group: "Family Shopping List", message: "Join us for family shopping!" },
];

const mockReceivedInvitations = [
  { group: "Birthday Party Plan", message: "Join our party planning group!", from: "Ryan Thomas" },
];

export default function Groups() {
  const navigate = useNavigate();
  // Modal state
  const [modal, setModal] = useState(""); // "create" | "join" | "invitations" | "respond" | ""
  const [respondType, setRespondType] = useState(""); // "sent" | "received"
  const [respondData, setRespondData] = useState({});

  // Form state
  const [createUserCode, setCreateUserCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [joinGroupCode, setJoinGroupCode] = useState("");
  const [joinMessage, setJoinMessage] = useState("");

  // Invitation lists (mocked for now)
  const [sentInvitations, setSentInvitations] = useState(mockSentInvitations);
  const [receivedInvitations, setReceivedInvitations] = useState(mockReceivedInvitations);

  // Validation patterns
  const codePattern = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/;
  const userPattern = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{7,}$/;

  // Modal open/close helpers
  const openModal = (name) => setModal(name);
  const closeModal = () => setModal("");

  // Create group handler
  const handleCreateGroup = () => {
    if (!userPattern.test(createUserCode.trim())) {
      alert("User code must be at least 7 characters, contain at least one uppercase letter and one number, and no special characters.");
      return;
    }
    if (!groupName.trim()) {
      alert("Please enter a group name.");
      return;
    }
    alert("Group created and invitation sent!");
    setCreateUserCode("");
    setGroupName("");
    setCreateMessage("");
    closeModal();
  };

  // Join group handler
  const handleJoinGroup = () => {
    if (!codePattern.test(joinGroupCode.trim())) {
      alert("Group code must be at least 6 characters, contain at least one uppercase letter and one number, and no special characters.");
      return;
    }
    alert("Join request sent!");
    setJoinGroupCode("");
    setJoinMessage("");
    closeModal();
  };

  // Sent invitation click
  const handleSentInvitationClick = (inv) => {
    setRespondType("sent");
    setRespondData(inv);
    openModal("respond");
  };

  // Received invitation click
  const handleReceivedInvitationClick = (inv) => {
    setRespondType("received");
    setRespondData(inv);
    openModal("respond");
  };

  // Respond modal actions
  const handleAccept = () => {
    alert("Invitation accepted!");
    closeModal();
  };
  const handleDeclineOrCancel = () => {
    if (respondType === "sent") {
      setSentInvitations((prev) => prev.filter((i) => i !== respondData));
    } else {
      alert("Invitation declined!");
    }
    closeModal();
  };

  return (
    <div className="groups-page">
      {/* Top Navigation Bar */}
      <nav className="top-nav">
        <div className="nav-links">
          <a href="/welcome" onClick={e => { e.preventDefault(); navigate("/welcome"); }}>My List</a>
          <a href="/groups" onClick={e => { e.preventDefault(); navigate("/groups"); }}>View Groups</a>
          <a href="#" className="signout" onClick={e => {
            e.preventDefault();
            localStorage.removeItem("user_id");
            localStorage.removeItem("access_token");
            navigate("/");
          }}>Sign Out</a>
        </div>
      </nav>

      {/* Top Controls */}
      <div className="groups-top-bar">
        <button className="btn" onClick={() => openModal("create")}>➕ Create Group</button>
        <button className="btn" onClick={() => openModal("join")}>🔗 Join Group</button>
        <button className="btn" onClick={() => openModal("invitations")}>📩 Invitations</button>
      </div>

      {/* Groups Container */}
      <h1>Your Groups</h1>
      <div className="groups-container">
        {mockGroups.map((g, idx) => (
          <div className="group-card" key={idx}>
            <h2>{g.name}</h2>
          </div>
        ))}
      </div>

      {/* Create Group Modal */}
      {modal === "create" && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <span className="close" onClick={closeModal}>&times;</span>
            <h2>Create Group</h2>
            <label>User Code</label>
            <input type="text" value={createUserCode} onChange={e => setCreateUserCode(e.target.value)} placeholder="Enter your user code" />
            <label>Group Name</label>
            <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Enter group name" />
            <label>Message (optional)</label>
            <textarea value={createMessage} onChange={e => setCreateMessage(e.target.value)} placeholder="Add a message..." />
            <button className="btn" onClick={handleCreateGroup}>Send Invitation</button>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {modal === "join" && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <span className="close" onClick={closeModal}>&times;</span>
            <h2>Join Group</h2>
            <label>Group Code</label>
            <input type="text" value={joinGroupCode} onChange={e => setJoinGroupCode(e.target.value)} placeholder="Enter group code" />
            <label>Message (optional)</label>
            <textarea value={joinMessage} onChange={e => setJoinMessage(e.target.value)} placeholder="Add a message..." />
            <button className="btn" onClick={handleJoinGroup}>Send Invitation</button>
          </div>
        </div>
      )}

      {/* Invitations Modal */}
      {modal === "invitations" && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <span className="close" onClick={closeModal}>&times;</span>
            <h2>Invitations</h2>
            <div className="invitation-list">
              <h3>Sent</h3>
              <ul id="sentInvitations">
                {sentInvitations.length === 0 && <li>No sent invitations.</li>}
                {sentInvitations.map((inv, idx) => (
                  <li className="invitation-item" key={idx} onClick={() => handleSentInvitationClick(inv)}>
                    {inv.group} - "{inv.message}"
                  </li>
                ))}
              </ul>
              <h3>Received</h3>
              <ul id="receivedInvitations">
                {receivedInvitations.length === 0 && <li>No received invitations.</li>}
                {receivedInvitations.map((inv, idx) => (
                  <li className="invitation-item" key={idx} onClick={() => handleReceivedInvitationClick(inv)}>
                    From: {inv.from} - "{inv.message}"
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Accept/Decline Modal */}
      {modal === "respond" && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <span className="close" onClick={closeModal}>&times;</span>
            <h2 id="invitationTitle">{respondData.group || "Invitation"}</h2>
            <p id="invitationMessage">{respondData.message}</p>
            <div className="response-buttons">
              {respondType === "received" && (
                <>
                  <button className="btn" onClick={handleAccept}>Accept ✅</button>
                  <button className="btn" onClick={handleDeclineOrCancel}>Decline ❌</button>
                </>
              )}
              {respondType === "sent" && (
                <button className="btn" onClick={handleDeclineOrCancel}>Cancel ❌</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
