import React from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import "../css/login.css"

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      await axios.post("http://localhost:8080/api/v1/auth/signin", {
        email: data.email,
        password: data.password,
      });
      alert("Login successful!");
    } catch (err) {
      alert("Login failed: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h2>Login</h2>
      <input {...register("email", { required: true })} placeholder="Email" type="email" />
      {errors.email && <span>Email is required</span>}
      <input {...register("password", { required: true })} placeholder="Password" type="password" />
      {errors.password && <span>Password is required</span>}
      <button type="submit">Login</button>
    </form>
  );
}