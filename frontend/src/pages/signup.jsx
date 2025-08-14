
import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/signup.css"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Signup() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      // First, sign up the user
      await axios.post(`${API_BASE_URL}/auth/signup`, {
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
      });
      // Then, sign in the user automatically
      const response = await axios.post(`${API_BASE_URL}/auth/signin`, {
        email: data.email,
        password: data.password,
      });
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
  alert("Signup successful! You are now logged in.");
  navigate("/welcome");
    } catch (err) {
      if (err.response && err.response.status === 409) {
        alert("A user with this email already exists. Please use a different email or log in.");
      } else {
        alert("Signup failed! " + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <main>
      <form onSubmit={handleSubmit(onSubmit)}>
        <h2>Sign Up</h2>
        <input {...register("first_name", { required: true })} placeholder="First Name" />
        {errors.first_name && <span>First name is required</span>}
        <input {...register("last_name", { required: true })} placeholder="Last Name" />
        {errors.last_name && <span>Last name is required</span>}
        <input {...register("email", { required: true })} placeholder="Email" type="email" />
        {errors.email && <span>Email is required</span>}
        <input {...register("password", { required: true })} placeholder="Password" type="password" />
        {errors.password && <span>Password is required</span>}
        <button type="submit">Sign Up</button>
      </form>
    </main>
  );
}