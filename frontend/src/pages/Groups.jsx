  // Delete account handler
  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    const userId = localStorage.getItem("user_id");
    const accessToken = localStorage.getItem("access_token");
    if (!userId || !accessToken) {
      alert("Not logged in.");
      return;
    }
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      alert("Account deleted. Goodbye!");
      localStorage.removeItem("user_id");
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_code");
      disconnectSocket();
      window.dispatchEvent(new Event("user-auth-changed"));
      navigate("/");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete account.");
    }
  };
import axios from "axios";
import { getSocket, disconnectSocket } from "../services/socketClient";
import "./Groups.css";

function Groups() {
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

  // Real group data
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [groupsError, setGroupsError] = useState("");

  // Invitation lists (real data)
  const [sentInvitations, setSentInvitations] = useState([]);
  const [receivedInvitations, setReceivedInvitations] = useState([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [invitationsError, setInvitationsError] = useState("");

  // Helper to fetch groups
  const fetchGroups = () => {
    const userId = localStorage.getItem("user_id");
    const accessToken = localStorage.getItem("access_token");
    if (!userId || !accessToken) {
      navigate("/");
      return;
    }
    setLoadingGroups(true);
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/users/${userId}/groups`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => {
        setGroups(res.data.data || []);
        setLoadingGroups(false);
      })
      .catch(err => {
        setGroupsError("Failed to load groups.");
        setLoadingGroups(false);
      });
  };

  // Helper to fetch invitations
  const fetchInvitations = () => {
    const userId = localStorage.getItem("user_id");
    const accessToken = localStorage.getItem("access_token");
    if (!userId || !accessToken) {
      setInvitationsError("Not logged in.");
      setLoadingInvitations(false);
      return;
    }
    setLoadingInvitations(true);
    Promise.all([
      axios.get(`${import.meta.env.VITE_API_BASE_URL}/users/${userId}/invitations/sent`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
      axios.get(`${import.meta.env.VITE_API_BASE_URL}/users/${userId}/invitations/received`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
    ])
      .then(([sentRes, receivedRes]) => {
        setSentInvitations(sentRes.data.data || []);
        setReceivedInvitations(receivedRes.data.data || []);
        setLoadingInvitations(false);
      })
      .catch(err => {
        setInvitationsError("Failed to load invitations.");
        setLoadingInvitations(false);
      });
  };

  // Real-time event listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Group events: refresh groups on any group change
    const refreshGroups = () => fetchGroups();
    socket.on("group_item_added", refreshGroups);
    socket.on("group_item_updated", refreshGroups);
    socket.on("group_item_deleted", refreshGroups);
    socket.on("group_list_cleared", refreshGroups);

    // Invitation events: refresh invitations on any invitation change
    const refreshInvitations = () => fetchInvitations();
    socket.on("invitation_received", refreshInvitations);
    socket.on("invitation_accepted", () => { refreshInvitations(); refreshGroups(); });
    socket.on("invitation_declined", refreshInvitations);
    socket.on("invitation_canceled", refreshInvitations);

    return () => {
      socket.off("group_item_added", refreshGroups);
      socket.off("group_item_updated", refreshGroups);
      socket.off("group_item_deleted", refreshGroups);
      socket.off("group_list_cleared", refreshGroups);
      socket.off("invitation_received", refreshInvitations);
      socket.off("invitation_accepted");
      socket.off("invitation_declined", refreshInvitations);
      socket.off("invitation_canceled", refreshInvitations);
    };
  }, []);

  // Fetch groups and invitations on load
  useEffect(() => {
    fetchGroups();
    fetchInvitations();
    // eslint-disable-next-line
  }, []);

  // No validation patterns
  // const codePattern = ...
  // const userPattern = ...

  // Modal open/close helpers
  const openModal = (name) => setModal(name);
  const closeModal = () => setModal("");

  // Create group handler
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert("Please enter a group name.");
      return;
    }
    const userId = localStorage.getItem("user_id");
    const accessToken = localStorage.getItem("access_token");
    if (!userId || !accessToken) {
      alert("Not logged in.");
      return;
    }
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/invitations/start-group`,
        {
          to_user_code: createUserCode.trim(),
          group_name: groupName.trim(),
          message: createMessage.trim()
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      alert("Group created and invitation sent!");
      setCreateUserCode("");
      setGroupName("");
      setCreateMessage("");
      closeModal();
      fetchGroups();
      fetchInvitations();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to create group or send invitation.");
    }
  };

  // Join group handler
  const handleJoinGroup = async () => {
    if (!joinGroupCode.trim()) {
      alert("Please enter a group code.");
      return;
    }
    const userId = localStorage.getItem("user_id");
    const accessToken = localStorage.getItem("access_token");
    if (!userId || !accessToken) {
      alert("Not logged in.");
      return;
    }
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/invitations/join-request`,
        {
          to_group_code: joinGroupCode.trim(),
          message: joinMessage.trim()
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      alert("Join request sent!");
      setJoinGroupCode("");
      setJoinMessage("");
      closeModal();
      fetchInvitations();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to send join request.");
    }
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
  const handleAccept = async () => {
    if (!respondData?.id) {
      alert("No invitation selected.");
      return;
    }
    const userId = localStorage.getItem("user_id");
    const accessToken = localStorage.getItem("access_token");
    if (!userId || !accessToken) {
      alert("Not logged in.");
      return;
    }
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/invitations/${respondData.id}/accept`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      alert("Invitation accepted!");
      closeModal();
      fetchGroups();
      fetchInvitations();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to accept invitation.");
    }
  };
  const handleDeclineOrCancel = async () => {
    if (!respondData?.id) {
      alert("No invitation selected.");
      return;
    }
    const userId = localStorage.getItem("user_id");
    const accessToken = localStorage.getItem("access_token");
    if (!userId || !accessToken) {
      alert("Not logged in.");
      return;
    }
    try {
      if (respondType === "sent") {
        // Cancel sent invitation (delete or cancel endpoint if exists, fallback to decline)
        await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/invitations/${respondData.id}/decline`,
          {},
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        alert("Invitation canceled!");
      } else {
        // Decline received invitation
        await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/invitations/${respondData.id}/decline`,
          {},
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        alert("Invitation declined!");
      }
      closeModal();
      fetchGroups();
      fetchInvitations();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update invitation.");
    }
  };

    // Place the top bar as the first child inside .groups-page, before nav, to match the working example
    return (
      <div className="groups-page">
        <div className="groups-top-bar">
          <button className="btn" onClick={() => openModal("create")}>➕ Create Group</button>
          <button className="btn" onClick={() => openModal("join")}>🔗 Join Group</button>
          <button className="btn" onClick={() => openModal("invitations")}>📩 Invitations</button>
        </div>
        {/* Top Navigation Bar */}
        <nav className="top-nav">
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center' }}>
            <a href="#" style={{ marginRight: 16, color: 'red', fontWeight: 600 }} onClick={e => { e.preventDefault(); handleDeleteAccount(); }}>Delete Account</a>
            <a href="/welcome" onClick={e => { e.preventDefault(); navigate("/welcome"); }}>My List</a>
            <a href="/groups" onClick={e => { e.preventDefault(); navigate("/groups"); }}>View Groups</a>
            <a href="#" className="signout" onClick={e => {
              e.preventDefault();
              localStorage.removeItem("user_id");
              localStorage.removeItem("access_token");
              localStorage.removeItem("user_code");
              disconnectSocket();
              window.dispatchEvent(new Event("user-auth-changed"));
              navigate("/");
            }}>Sign Out</a>
          </div>
        </nav>

        {/* Groups Container */}
        <h1>Your Groups</h1>
        <div className="groups-container">
          {loadingGroups ? (
            <p>Loading groups...</p>
          ) : groupsError ? (
            <p style={{ color: "red" }}>{groupsError}</p>
          ) : groups.length === 0 ? (
            <p style={{ textAlign: "center" }}>Join or create a group, so that everyone is on the same page with their loved ones.</p>
          ) : (
            groups.map((g, idx) => (
              <div
                className="group-card"
                key={g.id || idx}
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/groups/${g.id}`)}
              >
                <h2>{g.group_name || g.name}</h2>
                <p style={{ fontSize: '0.95em', color: '#555' }}>Group Code: <b>{g.group_code}</b></p>
              </div>
            ))
          )}
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
              {loadingInvitations && <div>Loading invitations...</div>}
              {invitationsError && <div style={{ color: 'red' }}>{invitationsError}</div>}
              <div className="invitation-list">
                <h3>Sent</h3>
                <ul id="sentInvitations">
                  {sentInvitations.length === 0 && <li>No sent invitations.</li>}
                  {sentInvitations.map((inv, idx) => {
                    // Try to get recipient's full name
                    const toName = inv.ToUser
                      ? `${inv.ToUser.first_name || ''} ${inv.ToUser.last_name || ''}`.trim()
                      : inv.toName || inv.to || "?";
                    // Try to get group name
                    const groupName = inv.Group?.group_name || inv.groupName || inv.group || "?";
                    return (
                      <li className="invitation-item" key={inv.id || idx} onClick={() => handleSentInvitationClick(inv)}>
                        {groupName !== '?' ? `${groupName}` : ''}{inv.message ? ` - "${inv.message}"` : ''} {toName !== '?' ? `| To: ${toName}` : ''}
                      </li>
                    );
                  })}
                </ul>
                <h3>Received</h3>
                <ul id="receivedInvitations">
                  {receivedInvitations.length === 0 && <li>No received invitations.</li>}
                  {receivedInvitations.map((inv, idx) => {
                    // Try to get sender's full name
                    const fromName = inv.FromUser
                      ? `${inv.FromUser.first_name || ''} ${inv.FromUser.last_name || ''}`.trim()
                      : inv.fromName || inv.from || "?";
                    // Try to get group name
                    const groupName = inv.Group?.group_name || inv.groupName || inv.group || "?";
                    return (
                      <li className="invitation-item" key={inv.id || idx} onClick={() => handleReceivedInvitationClick(inv)}>
                        From: {fromName} {inv.message ? `- "${inv.message}"` : ''} {groupName !== '?' ? `| Group: ${groupName}` : ''}
                      </li>
                    );
                  })}
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
              <h2 id="invitationTitle">{respondData.groupName || respondData.group || "Invitation"}</h2>
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

export default Groups;
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
