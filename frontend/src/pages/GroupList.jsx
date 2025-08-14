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
      await axios.delete(`${API_BASE_URL}/users/${userId}`, {
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
import { disconnectSocket } from "../services/socketClient";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../css/grocery.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function GroupList() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", quantity: 1, price: "", status: "NEEDED" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [group, setGroup] = useState(null);
  const navigate = useNavigate();
  const { groupId } = useParams();

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      setError("No user ID found. Please log in.");
      setLoading(false);
      return;
    }
    const accessToken = localStorage.getItem("access_token");
    axios.get(`${API_BASE_URL}/groups/${groupId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(res => setGroup(res.data.data))
      .catch(() => setGroup(null));
    axios.get(`${API_BASE_URL}/groups/${groupId}/list`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => {
        const data = res.data.data;
        if (data && Array.isArray(data.Items)) {
          setItems(data.Items.map(item => ({
            id: item.id,
            name: item.item_name,
            quantity: item.item_quantity,
            price: item.item_price ? Number(item.item_price) : 0,
            status: item.item_status,
            purchased: item.item_status === "PURCHASED"
          })));
        } else {
          setItems([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch group list.");
        setLoading(false);
      });
  }, [groupId]);

  const expectedTotal = items.reduce((total, item) => {
    if (item.status === "NEEDED" || item.status === "OPTIONAL") {
      return total + item.price * item.quantity;
    }
    return total;
  }, 0);

  const handleCheckbox = async (itemId) => {
    if (!itemId) {
      alert("Error: Item ID is undefined. Cannot update status.");
      return;
    }
    const accessToken = localStorage.getItem("access_token");
    const idx = items.findIndex(it => it.id === itemId);
    if (idx === -1) return;
    const item = items[idx];
    const newStatus = item.purchased ? "NEEDED" : "PURCHASED";
    try {
      await axios.put(
        `${API_BASE_URL}/items/${item.id}/status`,
        { item_status: newStatus },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setItems(items => items.map((it, i) =>
        i === idx ? { ...it, purchased: !it.purchased, status: newStatus } : it
      ));
    } catch (err) {
      alert("Failed to update item status: " + (err.response?.data?.message || err.message));
    }
  };

  const handleClear = async () => {
    if (window.confirm("Are you sure you want to clear the entire list?")) {
      const accessToken = localStorage.getItem("access_token");
      try {
        await axios.put(
          `${API_BASE_URL}/groups/${groupId}/list/clear`,
          {},
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        setItems([]);
      } catch (err) {
        alert("Failed to clear list: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleAddItem = () => {
    setShowModal(true);
    setNewItem({ name: "", quantity: 1, price: "", status: "NEEDED" });
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setNewItem(item => ({ ...item, [name]: name === "quantity" || name === "price" ? Number(value) : value }));
  };

  const handleModalSubmit = async () => {
    if (!newItem.name.trim() || newItem.quantity < 1 || newItem.price < 0) {
      alert("Please fill out valid Name, Quantity, and Price.");
      return;
    }
    const accessToken = localStorage.getItem("access_token");
    try {
      await axios.post(
        `${API_BASE_URL}/groups/${groupId}/list/items`,
        {
          item_name: newItem.name,
          item_quantity: newItem.quantity,
          item_price: newItem.price,
          item_status: newItem.status
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      // Optionally, fetch the updated list from backend
      setLoading(true);
      axios.get(`${API_BASE_URL}/groups/${groupId}/list`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
        .then(res => {
          const data = res.data.data;
          if (data && Array.isArray(data.Items)) {
            setItems(data.Items.map(item => ({
              id: item.id,
              name: item.item_name,
              quantity: item.item_quantity,
              price: item.item_price ? Number(item.item_price) : 0,
              status: item.item_status,
              purchased: item.item_status === "PURCHASED"
            })));
          } else {
            setItems([]);
          }
          setLoading(false);
        })
        .catch(() => {
          setError("Failed to fetch group list.");
          setLoading(false);
        });
      setShowModal(false);
    } catch (err) {
      alert("Failed to add item: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <>
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
      <main className="list-container">
        <h1>{group ? group.group_name : "Group List"}</h1>
        {items.length === 0 ? (
          <p style={{ textAlign: "center", margin: "32px 0" }}>No items in this group list yet.</p>
        ) : (
          <table className="item-table">
            <thead>
              <tr>
                <th>Purchased</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className={item.purchased ? "purchased" : ""}>
                  <td><input type="checkbox" checked={item.purchased} onChange={() => handleCheckbox(item.id)} /></td>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="buttons">
          <button className="btn" onClick={handleAddItem}>Add Item</button>
          <button className="btn clear" onClick={handleClear}>Clear List</button>
        </div>
      </main>
      <section className="totals-container">
        <h2>Expected Total</h2>
        <p id="expectedTotal">${expectedTotal.toFixed(2)}</p>
      </section>
      {showModal && (
        <div className="modal" style={{ display: "block" }}>
          <div className="modal-content">
            <h3>Add New Item</h3>
            <input type="text" name="name" value={newItem.name} onChange={handleModalChange} placeholder="Item Name" />
            <input type="number" name="quantity" value={newItem.quantity} onChange={handleModalChange} placeholder="Quantity" min="1" />
            <input type="number" name="price" value={newItem.price} onChange={handleModalChange} placeholder="Price ($)" min="0" step="0.01" />
            <select name="status" value={newItem.status} onChange={handleModalChange}>
              <option value="NEEDED">NEEDED</option>
              <option value="OPTIONAL">OPTIONAL</option>
            </select>
            <div className="modal-buttons">
              <button className="btn" onClick={handleModalSubmit}>Submit</button>
              <button className="btn clear" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GroupList;
