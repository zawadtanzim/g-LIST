import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";
import "../css/login.css"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/signin`, {
        email: data.email,
        password: data.password,
      });
      // Save user_id to localStorage
      if (response.data && response.data.data && response.data.data.user && response.data.data.user.id) {
        localStorage.setItem("user_id", response.data.data.user.id);
        if (response.data.data.user.user_code) {
          localStorage.setItem("user_code", response.data.data.user.user_code);
        }
      }
      if (response.data && response.data.data && response.data.data.tokens && response.data.data.tokens.access_token) {
        localStorage.setItem("access_token", response.data.data.tokens.access_token);
      }
  // Notify other components (like UserCodeFooter) to update
  window.dispatchEvent(new Event("user-auth-changed"));
  alert("Login successful!");
  navigate("/welcome");
    } catch (err) {
      alert("Login failed: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <main>
      <form onSubmit={handleSubmit(onSubmit)}>
        <h2>Login</h2>
        <input {...register("email", { required: true })} placeholder="Email" type="email" />
        {errors.email && <span>Email is required</span>}
        <input {...register("password", { required: true })} placeholder="Password" type="password" />
        {errors.password && <span>Password is required</span>}
        <button type="submit">Login</button>
      </form>
    </main>
  );
}