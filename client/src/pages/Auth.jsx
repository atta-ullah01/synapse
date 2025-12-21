import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isLogin ? '/login' : '/signup';
        const payload = isLogin ? { email, password } : { username, email, password };

        try {
            const { data } = await axios.post(`http://localhost:5000/api/auth${endpoint}`, payload);
            localStorage.setItem('userInfo', JSON.stringify(data));
            toast.success(`Welcome, ${data.username}!`);
            navigate('/dashboard'); 
        } catch (error) {
            toast.error(error.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <div className="min-h-screen w-full bg-synapse-dark flex flex-col justify-end md:justify-center items-center p-0 md:p-4 relative overflow-hidden">
            
            {/* Background Blob Effect */}
            <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-accent-peach blur-[100px] opacity-20 pointer-events-none"></div>

            <div className="bg-white w-full md:max-w-[450px] rounded-t-[40px] md:rounded-[40px] p-8 md:p-12 shadow-2xl relative flex flex-col justify-center z-10">
                
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-synapse-dark rounded-lg flex items-center justify-center text-white">
                            <Zap size={18} fill="currentColor" />
                        </div>
                        <span className="font-display font-bold text-xl tracking-tight text-synapse-dark">Synapse</span>
                    </div>
                    <h1 className="font-display font-bold text-3xl text-synapse-dark">
                        {isLogin ? "Welcome Back" : "Join Synapse"}
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        {isLogin ? "Enter your details to collaborate." : "Create an account to start coding."}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <input 
                                type="text" 
                                placeholder="Username" 
                                value={username} 
                                onChange={e => setUsername(e.target.value)}
                                className="w-full bg-gray-50 rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-synapse-dark outline-none transition-all placeholder-gray-300"
                            />
                        </div>
                    )}
                    <div>
                        <input 
                            type="email" 
                            placeholder="Email Address" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-gray-50 rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-synapse-dark outline-none transition-all placeholder-gray-300"
                        />
                    </div>
                    <div>
                        <input 
                            type="password" 
                            placeholder="Password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-gray-50 rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-synapse-dark outline-none transition-all placeholder-gray-300"
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-synapse-dark text-white font-display font-semibold rounded-2xl py-4 shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        {isLogin ? "Connect" : "Create Account"}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-400">
                        {isLogin ? "Don't have an account?" : "Already have an account?"} 
                        <span 
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-synapse-dark font-bold cursor-pointer ml-1 hover:underline"
                        >
                            {isLogin ? "Create one" : "Log in"}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
