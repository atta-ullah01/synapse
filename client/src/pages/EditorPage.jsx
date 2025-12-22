import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  Play, Save, Menu, X, FileCode, 
  Plus, Trash2, Users, Terminal
} from 'lucide-react';

const EditorPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [outputOpen, setOutputOpen] = useState(false);

  const [output, setOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io("http://localhost:5000");
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit("join-room", roomId);

    const handleCodeUpdate = ({ fileName, code }) => {
      setFiles(prev => prev.map(f => 
        f.name === fileName ? { ...f, content: code } : f
      ));
    };

    socket.on("code-update", handleCodeUpdate);

    return () => {
      socket.off("code-update", handleCodeUpdate);
    };
  }, [socket, roomId]);


  // 1. Fetch Room Data
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/rooms/${roomId}`);
        setRoom(data);
        setFiles(data.files);
        if (data.files.length > 0) setActiveFile(data.files[0]);
        setLoading(false);
      } catch {
        toast.error("Failed to load room");
        navigate('/dashboard');
      }
    };
    fetchRoom();
  }, [roomId, navigate]);

  // 2. Handle Editor Content Change
  const handleEditorChange = (value) => {
    if (!activeFile) return;
    setUnsavedChanges(true);
    setFiles(prev => prev.map(f => f.name === activeFile.name ? { ...f, content: value } : f));

    if (socket) {
      socket.emit("code-change", { 
        roomId, 
        fileName: activeFile.name,
        code: value 
      });
    }
  };

  // 3. API: Save File
  const handleSave = async () => {
    if (!activeFile) return;
    try {
      await axios.put(`http://localhost:5000/api/rooms/${roomId}/save`, {
        fileName: activeFile.name,
        content: files.find(f => f.name === activeFile.name).content
      });
      setUnsavedChanges(false);
      toast.success("Saved!");
    } catch {
      toast.error("Failed to save");
    }
  };

  // Keyboard Shortcut (Ctrl + S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, files]);

  // 4. API: Create File
  const handleCreateFile = async () => {
    const fileName = prompt("Enter file name (e.g., utils.js):");
    if (!fileName) return;

    // Simple extension detection for language
    const extension = fileName.split('.').pop();
    let language = 'javascript';
    if (extension === 'py') language = 'python';
    if (extension === 'java') language = 'java';
    if (extension === 'cpp') language = 'cpp';

    try {
      const { data: updatedFiles } = await axios.post(`http://localhost:5000/api/rooms/${roomId}/files`, {
        fileName,
        language
      });
      setFiles(updatedFiles);
      const newFile = updatedFiles.find(f => f.name === fileName);
      setActiveFile(newFile);
      toast.success("File created");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create file");
    }
  };

  // 5. API: Delete File
  const handleDeleteFile = async (e, fileName) => {
    e.stopPropagation(); // Stop click from selecting the file
    if (!window.confirm(`Delete ${fileName}?`)) return;

    try {
      const { data: updatedFiles } = await axios.delete(`http://localhost:5000/api/rooms/${roomId}/files/${fileName}`);
      setFiles(updatedFiles);
      if (activeFile?.name === fileName) {
        setActiveFile(updatedFiles.length > 0 ? updatedFiles[0] : null);
      }
      toast.success("File deleted");
    } catch (error) {
      toast.error("Failed to delete file");
    }
  };

  // Dummy Run (Placeholder)
  const runCode = () => {
    setIsRunning(true);
    setOutputOpen(true);
    setTimeout(() => {
      setOutput([`> Executing ${activeFile?.name}...`, "Hello World!", "Done."]);
      setIsRunning(false);
    }, 1000);
  };

  if (loading) return <div className="h-screen bg-synapse-dark text-white flex items-center justify-center">Loading Synapse...</div>;

  return (
    <div className="flex flex-col h-screen w-full bg-[#F8F9FB] md:bg-[#F8F9FB] overflow-hidden">

      {/* Mobile Header */}
      <div className="md:hidden h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-20 flex-shrink-0">
        <button onClick={() => setSidebarOpen(true)} className="text-synapse-dark">
          <Menu size={20} />
        </button>
        <span className="font-display font-bold text-sm truncate max-w-[150px]">
          {activeFile?.name || 'No File'}
          {unsavedChanges && <span className="text-accent-lime ml-1">*</span>}
        </span>
        <button onClick={runCode} className="w-8 h-8 bg-accent-lime rounded-full flex items-center justify-center text-synapse-dark shadow-sm">
          {isRunning ? <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full"/> : <Play size={14} className="fill-current ml-0.5" />}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden md:p-4 gap-4 relative">

        {/* Sidebar (Files) */}
        <div className={`
absolute md:relative z-30 inset-y-0 left-0 w-64 bg-white md:rounded-4xl shadow-2xl md:shadow-sm transform transition-transform duration-300 ease-in-out
${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
flex flex-col p-6
`}>
          <div className="flex justify-between items-center mb-6 md:hidden">
            <h3 className="font-display font-bold text-lg">Menu</h3>
            <button onClick={() => setSidebarOpen(false)}><X size={20} /></button>
          </div>

          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-display font-bold text-gray-400 text-xs uppercase">Explorer</h3>
            <button onClick={handleCreateFile} className="text-synapse-dark hover:bg-gray-100 p-1 rounded">
              <Plus size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1">
            {files.map((file) => (
              <div 
                key={file.name}
                onClick={() => { setActiveFile(file); setSidebarOpen(false); }}
                className={`
flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all group
${activeFile?.name === file.name ? 'bg-accent-lime text-synapse-dark' : 'text-gray-500 hover:bg-gray-50'}
`}
              >
                <FileCode size={16} />
                <span className="font-medium text-sm flex-1 truncate">{file.name}</span>
                <button 
                  onClick={(e) => handleDeleteFile(e, file.name)}
                  className={`opacity-0 group-hover:opacity-100 hover:text-red-500 p-1 ${activeFile?.name === file.name ? 'opacity-100' : ''}`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t pt-6 mt-4">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold mb-3">
              <Users size={12} />
              <span>ONLINE (1)</span>
            </div>
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-synapse-dark border-2 border-white text-white flex items-center justify-center text-xs font-bold">You</div>
            </div>
          </div>
        </div>

        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Editor Area */}
        <div className="flex-1 bg-[#1e1e1e] w-full md:rounded-4xl shadow-2xl relative overflow-hidden flex flex-col">
          <div className="hidden md:flex h-12 bg-[#252526] border-b border-black items-center justify-between px-6 select-none flex-shrink-0">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-gray-400 text-sm font-mono flex items-center gap-2">
              {activeFile?.name}
              {unsavedChanges && <div className="w-2 h-2 rounded-full bg-accent-lime"></div>}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={handleSave} className="text-gray-400 hover:text-white transition" title="Save (Ctrl+S)">
                <Save size={16} />
              </button>
              <button onClick={runCode} className="bg-accent-lime text-synapse-dark px-4 py-1.5 rounded-full text-xs font-bold gap-2 flex items-center hover:brightness-110 transition">
                {isRunning ? "..." : <><Play size={12} className="fill-current" /> RUN</>}
              </button>
            </div>
          </div>

          <div className="flex-1 relative">
            {activeFile ? (
              <Editor
                height="100%"
                language={activeFile.language === 'nodejs' ? 'javascript' : activeFile.language}
                theme="vs-dark"
                value={activeFile.content}
                onChange={handleEditorChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono, monospace',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 16 }
                }}
              />
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500">Select a file</div>
              )}
          </div>

          <button onClick={() => setOutputOpen(!outputOpen)} className="md:hidden absolute bottom-4 right-4 bg-synapse-dark text-white p-3 rounded-full shadow-lg z-10">
            <Terminal size={20} />
          </button>
        </div>

        {/* Output Panel */}
        <div className={`
absolute md:relative z-30 inset-x-0 bottom-0 md:inset-auto md:w-80 
bg-white md:bg-white md:rounded-4xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-sm 
transform transition-transform duration-300 ease-in-out flex flex-col
${outputOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
h-[40vh] md:h-auto rounded-t-3xl md:rounded-3xl
`}>
          <div className="md:hidden w-full flex justify-center pt-3 pb-1" onClick={() => setOutputOpen(false)}>
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>
          <div className="p-6 flex flex-col h-full">
            <div className="flex gap-2 mb-4">
              <button className="bg-synapse-dark text-white text-xs px-3 py-1.5 rounded-full font-bold">Output</button>
              <button onClick={() => setOutput([])} className="ml-auto text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
            <div className="flex-1 bg-synapse-dark rounded-3xl p-4 font-mono text-xs overflow-y-auto dark-scroll text-gray-300">
              {output.map((line, i) => <div key={i} className="mb-1">{line}</div>)}
              {isRunning && <div className="text-accent-lime animate-pulse">Running...</div>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EditorPage;
