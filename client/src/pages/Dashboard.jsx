import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  LayoutGrid, Folder, LogOut, Search, 
  Zap, Code2, Box, FileCode, 
  ArrowRight, ChevronDown, ChevronUp, Clock, Users 
} from 'lucide-react';

const api = import.meta.env.VITE_API_URL;

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedRoomId, setExpandedRoomId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');

  const [joinRoomId, setJoinRoomId] = useState('');
  const [isJoinMode, setIsJoinMode] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      navigate('/');
      return;
    }
    const parsedUser = JSON.parse(userInfo);
    setUser(parsedUser);

    const fetchRooms = async (userId) => {
      try {
        const { data } = await axios.get(`${api}/api/rooms/user/${userId}`);
        setRooms(data);
        setLoading(false);
      } catch {
        toast.error("Failed to fetch rooms");
        setLoading(false);
      }
    };

    fetchRooms(parsedUser._id);
  }, [navigate]);

  const handleCreateRoom = async () => {
    if (!newRoomName) return toast.error("Please enter a room name");

    try {
      const { data } = await axios.post(`${api}/api/rooms/create`, {
        name: newRoomName,
        userId: user._id
      });
      navigate(`/editor/${data.roomId}`);
      toast.success("Room created!");
    } catch {
      toast.error("Failed to create room");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/');
  };

  const handleJoinRoom = () => {
    if (!joinRoomId) return toast.error("Please enter a Room ID");
    navigate(`/editor/${joinRoomId}`);
  };

  const toggleRoomDetails = (id, e) => {
    e.stopPropagation();
    setExpandedRoomId(expandedRoomId === id ? null : id);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F8F9FB] text-synapse-dark">Loading...</div>;

  return (
    <div className="flex h-screen w-full bg-[#F8F9FB]">

      {/* Sidebar (Desktop) */}
      <div className="hidden md:flex flex-col bg-synapse-dark w-20 lg:w-64 h-full py-8 justify-between flex-shrink-0 transition-all duration-300">
        <div className="px-0 lg:px-8 flex flex-col items-center lg:items-start">
          <div className="flex items-center gap-3 mb-12 text-white">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Zap className="text-white" size={24} fill="currentColor" />
            </div>
            <span className="hidden lg:block font-display font-bold text-xl">Synapse</span>
          </div>

          <nav className="space-y-2 w-full">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-4 px-0 lg:px-4 py-3 rounded-xl justify-center lg:justify-start mx-auto lg:mx-0 transition ${activeTab === 'dashboard' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <LayoutGrid size={20} />
              <span className="hidden lg:block font-medium text-sm">Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveTab('rooms')}
              className={`w-full flex items-center gap-4 px-0 lg:px-4 py-3 rounded-xl justify-center lg:justify-start mx-auto lg:mx-0 transition ${activeTab === 'rooms' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Folder size={20} />
              <span className="hidden lg:block font-medium text-sm">My Rooms</span>
            </button>
          </nav>
        </div>

        <div className="px-0 lg:px-8 flex flex-col items-center lg:items-start">
          <button onClick={handleLogout} className="flex items-center gap-4 text-gray-400 hover:text-red-400 px-0 lg:px-4 py-3 justify-center lg:justify-start transition">
            <LogOut size={20} />
            <span className="hidden lg:block font-medium text-sm">Log Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="flex flex-col md:flex-row items-center justify-between px-6 md:px-10 py-4 md:py-0 h-auto md:h-20 flex-shrink-0 gap-4 md:gap-0">
          <h2 className="text-2xl font-display font-bold text-synapse-dark self-start md:self-auto">
            {activeTab === 'dashboard' ? 'Dashboard' : 'My Rooms'}
          </h2>

          <div className="flex bg-white rounded-full px-6 py-3 shadow-sm w-full md:w-80 items-center gap-3">
            <Search className="text-gray-300" size={18} />
            <input 
              type="text" 
              placeholder="Search rooms..." 
              className="bg-transparent outline-none text-sm w-full font-sans"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">

          {/* VIEW 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                {/* Banner */}
                <div className="bg-synapse-dark rounded-4xl p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[200px]">
                  <div className="relative z-10">
                    <h3 className="font-display font-bold text-2xl mb-2">Jump back into code.</h3>
                    <p className="text-gray-400 text-sm max-w-xs">
                      You have {rooms.length} active projects.
                    </p>
                  </div>
                  <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none">
                    <svg width="200" height="100" viewBox="0 0 200 100">
                      <path d="M0 50 Q 50 10 100 50 T 200 50" stroke="white" fill="none" strokeWidth="4"/>
                    </svg>
                  </div>
                </div>

                {/* Quick Links (Recent - using filtered list) */}
                <div>
                  <div className="flex justify-between items-end mb-4 px-2">
                    <h4 className="font-display font-bold text-lg text-synapse-dark">Recent Rooms</h4>
                    <button onClick={() => setActiveTab('rooms')} className="text-xs text-gray-400 hover:text-synapse-dark">See all</button>
                  </div>
                  {filteredRooms.slice(0, 3).map((room, idx) => (
                    <div 
                      key={room._id} 
                      onClick={() => navigate(`/editor/${room.roomId}`)}
                      className={`rounded-3xl p-5 flex items-center justify-between mb-4 cursor-pointer hover:scale-[1.01] transition-transform ${idx % 2 === 0 ? 'bg-accent-peach' : 'bg-accent-pink'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 bg-white/50 rounded-2xl flex items-center justify-center ${idx % 2 === 0 ? 'text-orange-500' : 'text-pink-500'}`}>
                          {idx % 2 === 0 ? <Box size={20} /> : <FileCode size={20} />}
                        </div>
                        <div>
                          <h5 className="font-bold text-sm text-synapse-dark">{room.name}</h5>
                          <p className="text-xs text-gray-500 mt-1">ID: {room.roomId.substring(0, 8)}...</p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-synapse-dark">
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  ))}
                  {filteredRooms.length === 0 && <p className="text-gray-400 text-sm px-2">No matching rooms found.</p>}
                </div>
              </div>

              {/* Create / Join Widget */}
              <div className="xl:col-span-1">
                <div className="bg-white rounded-4xl p-6 shadow-sm h-full flex flex-col transition-all duration-300">

                  {/* Toggle Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-display font-bold text-synapse-dark">
                      {isJoinMode ? 'Join Room' : 'New Room'}
                    </h4>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button 
                        onClick={() => setIsJoinMode(false)}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!isJoinMode ? 'bg-white shadow-sm text-synapse-dark' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Create
                      </button>
                      <button 
                        onClick={() => setIsJoinMode(true)}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${isJoinMode ? 'bg-white shadow-sm text-synapse-dark' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Join
                      </button>
                    </div>
                  </div>

                  {/* Icon Display */}
                  <div className="bg-gray-50 rounded-3xl p-6 flex flex-col items-center justify-center mb-6 border-2 border-dashed border-gray-200">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-synapse-dark mb-3 transition-colors duration-300 ${isJoinMode ? 'bg-blue-100 text-blue-600' : 'bg-accent-lime text-synapse-dark'}`}>
                      {isJoinMode ? <Search size={32} /> : <Code2 size={32} />}
                    </div>
                    <span className="text-xs font-medium text-gray-400">
                      {isJoinMode ? 'Find existing session' : 'Make a new room'}
                    </span>
                  </div>

                  {/* Dynamic Form Content */}
                  <div className="space-y-4 flex-1">
                    {isJoinMode ? (
                      // JOIN MODE INPUTS
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <input 
                          type="text" 
                          placeholder="Paste Room ID..." 
                          value={joinRoomId}
                          onChange={(e) => setJoinRoomId(e.target.value)}
                          className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-synapse-dark text-synapse-dark font-mono placeholder:font-sans"
                        />
                        <button 
                          onClick={handleJoinRoom}
                          className="w-full bg-synapse-dark text-white font-display font-semibold rounded-2xl py-4 mt-6 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 group"
                        >
                          Join Room
                          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    ) : (
                        // CREATE MODE INPUTS
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <input 
                            type="text" 
                            placeholder="Room Name" 
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-synapse-dark text-synapse-dark"
                          />
                          <button 
                            onClick={handleCreateRoom}
                            className="w-full bg-synapse-dark text-white font-display font-semibold rounded-2xl py-4 mt-6 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform"
                          >
                            Create Room
                          </button>
                        </div>
                      )}
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: DETAILED ROOMS LIST */}
          {activeTab === 'rooms' && (
            <div className="grid grid-cols-1 gap-4">
              {filteredRooms.length === 0 ? (
                <p className="text-gray-400">No rooms found.</p>
              ) : (
                  filteredRooms.map((room) => (
                    <div key={room._id} className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => navigate(`/editor/${room.roomId}`)}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-accent-lime rounded-2xl flex items-center justify-center text-synapse-dark">
                            <Box size={24} />
                          </div>
                          <div>
                            <h3 className="font-display font-bold text-lg text-synapse-dark">{room.name}</h3>
                            <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock size={12} />
                                {formatDate(room.createdAt)}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Users size={12} />
                                <span>1 Active (You)</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => toggleRoomDetails(room._id, e)}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
                          >
                            {expandedRoomId === room._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </button>
                          <button className="bg-synapse-dark text-white px-4 py-2 rounded-xl text-xs font-bold hover:scale-105 transition">
                            Open
                          </button>
                        </div>
                      </div>

                      {/* Dropdown Details */}
                      {expandedRoomId === room._id && (
                        <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                          <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Files</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {room.files.map((file, i) => (
                              <div key={i} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg text-sm text-synapse-dark">
                                <FileCode size={14} className="text-gray-400" />
                                <span className="font-medium">{file.name}</span>
                                <span className="text-xs text-gray-400 ml-auto bg-white px-2 py-0.5 rounded border">{file.language}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
            </div>
          )}

        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-100 flex justify-around py-4 z-50">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-synapse-dark' : 'text-gray-400'}`}>
          <LayoutGrid size={20} />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button onClick={() => setActiveTab('rooms')} className={`flex flex-col items-center gap-1 ${activeTab === 'rooms' ? 'text-synapse-dark' : 'text-gray-400'}`}>
          <Folder size={20} />
          <span className="text-[10px] font-bold">Rooms</span>
        </button>
        <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-red-400 hover:text-red-500">
          <LogOut size={20} />
          <span className="text-[10px] font-bold">Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
