import React from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import "../css/signup.css"

export default function Signup() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
  await axios.post("http://localhost:8080/api/v1/auth/signup", {
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
      });
      alert("Signup successful!");
    } catch (err) {
      alert("Signup failed!");
    }
  };

  return (
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
  );
}