import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../services/api';

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false); // Toggle state
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      let res;
      if (isRegistering) {
        // Call Register API
        res = await registerUser(formData);
      } else {
        // Call Login API
        res = await loginUser({ email: formData.email, password: formData.password });
      }

      // Save token and redirect
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error("Auth Error:", err);
      setError(err.response?.data?.msg || 'Authentication failed. Please check your connection.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          {isRegistering ? "Create Account" : "Welcome Back"}
        </h2>
        <p className="text-center text-gray-500 mb-6">
          {isRegistering ? "Join the AI Interview Platform" : "Sign in to continue"}
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Show Name field ONLY if registering */}
          {isRegistering && (
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition duration-200"
          >
            {isRegistering ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {isRegistering ? "Already have an account?" : "Don't have an account?"}
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-blue-600 font-bold ml-1 hover:underline focus:outline-none"
            >
              {isRegistering ? "Login" : "Register"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;