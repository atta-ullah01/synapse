import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { 
  Play, Save, Menu, X, FileCode, 
  Plus, Trash2, Users, Terminal, Copy 
} from 'lucide-react';

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';

const api = import.meta.env.VITE_API_URL;
const syncApi = api.replace('http', 'ws') + '/doc'; 

const EditorPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [activeFileName, setActiveFileName] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [outputOpen, setOutputOpen] = useState(false);
  const [output, setOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editorMounted, setEditorMounted] = useState(false);

  const editorRef = useRef(null);
  const providerRef = useRef(null);
  const docRef = useRef(null);
  const bindingRef = useRef(null);

  const activeFile = files.find(f => f.name === activeFileName);

  // Fetch room details
  const fetchRoom = async () => {
    try {
      const { data } = await axios.get(`${api}/api/rooms/${roomId}`);
      setFiles(data.files);
      return data.files;
    } catch {
      toast.error("Failed to load room");
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    fetchRoom().then((fetchedFiles) => {
        if (fetchedFiles && fetchedFiles.length > 0) {
            setActiveFileName(fetchedFiles[0].name);
        }
        setLoading(false);
    });
  }, [roomId, navigate]);

  // Yjs Initialization
  useEffect(() => {
    if (loading) return;

    const doc = new Y.Doc();
    docRef.current = doc;

    const provider = new WebsocketProvider(syncApi, roomId, doc);
    providerRef.current = provider;

    // Awareness configuration
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || { username: 'Guest' };
    
    // Hash username to color
    const stringToColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); }
        let c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    };
    const userColor = stringToColor(userInfo.username);
    
    provider.awareness.setLocalStateField('user', {
      name: userInfo.username,
      color: userColor
    });

    provider.awareness.on('change', () => {
      const states = Array.from(provider.awareness.getStates().entries());
      const users = states.map(([clientId, state]) => ({ clientId, ...state.user })).filter(u => u.name);
      setActiveUsers(users);
    });

    return () => {
      if (providerRef.current) providerRef.current.destroy();
      if (docRef.current) docRef.current.destroy();
    };
  }, [loading, roomId]);

  // Monaco binding & cleanup
  useEffect(() => {
    if (!editorMounted || !editorRef.current || !docRef.current || !providerRef.current || !activeFileName) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    const yText = docRef.current.getText(activeFileName);

    // Prevent duplicates
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    // Clear stale cursors
    const decorations = model.getAllDecorations();
    const ghostDecorations = decorations
      .filter(d => d.options.className?.includes('yRemoteSelection'))
      .map(d => d.id);
    if (ghostDecorations.length > 0) {
        model.deltaDecorations(ghostDecorations, []);
    }

    // Hydrate Yjs from DB if empty
    const onSync = () => {
      if (yText.toString() === '' && activeFile?.content) {
         yText.insert(0, activeFile.content);
      }
    };

    if (providerRef.current.synced) {
        onSync();
    } else {
        providerRef.current.once('synced', onSync);
    }

    const binding = new MonacoBinding(
        yText,
        model,
        new Set([editor]),
        providerRef.current.awareness
    );
    bindingRef.current = binding;

    setIsDirty(false); 

    return () => {
        if (bindingRef.current) {
            bindingRef.current.destroy();
            bindingRef.current = null;
        }
    };

  }, [activeFileName, loading, activeFile, editorMounted]);

  // Inject cursor CSS
  useEffect(() => {
    if (activeUsers.length === 0) return;

    const styleId = 'yjs-cursor-styles';
    let styleTag = document.getElementById(styleId);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    const cssRules = activeUsers.map(u => {
        if (!u.color || !u.name) return '';
        return `
          .yRemoteSelectionHead-${u.clientId} {
            border-left: 2px solid ${u.color} !important;
            border-top: 2px solid ${u.color} !important;
            border-bottom: 2px solid ${u.color} !important;
            height: 100%;
            box-sizing: border-box;
            position: absolute;
          }
          .yRemoteSelectionHead-${u.clientId}::after {
            content: "${u.name}";
            position: absolute;
            top: -22px;
            left: -2px;
            background: ${u.color};
            color: #fff;
            font-size: 10px;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
            pointer-events: none;
            z-index: 50;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          }
          .yRemoteSelection-${u.clientId} {
            background-color: ${u.color}33 !important;
          }
        `;
    }).join('\n');

    styleTag.innerHTML = cssRules;
  }, [activeUsers]);

  const handleEditorChange = (value) => {
    if (!activeFile) return;
    setIsDirty(value !== activeFile.content);
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    setEditorMounted(true);
  };

  const handleSave = async () => {
    if (!activeFile) return;
    try {
      const content = editorRef.current.getValue(); 
      await axios.put(`${api}/api/rooms/${roomId}/save`, {
        fileName: activeFileName,
        content
      });
      setFiles(prev => prev.map(f => f.name === activeFileName ? { ...f, content } : f));
      setIsDirty(false);
      toast.success("File Saved!");
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleCreateFile = async () => {
    const fileName = prompt("Enter file name:");
    if (!fileName) return;
    const extension = fileName.split('.').pop();
    const language = extension === 'py' ? 'python' : (extension === 'java' ? 'java' : 'javascript');

    try {
      const { data } = await axios.post(`${api}/api/rooms/${roomId}/files`, { fileName, language });
      setFiles(data);
      setActiveFileName(fileName);
    } catch (err) { toast.error("Failed to create file"); }
  };

  const handleDeleteFile = async (e, fileName) => {
      e.stopPropagation();
      if (!window.confirm(`Delete ${fileName}?`)) return;
      try {
        const { data } = await axios.delete(`${api}/api/rooms/${roomId}/files/${fileName}`);
        setFiles(data);
        if (activeFileName === fileName) setActiveFileName(data.length > 0 ? data[0].name : '');
        toast.success("File deleted");
      } catch { toast.error("Failed to delete"); }
  };

  const runCode = () => {
    setIsRunning(true);
    setOutputOpen(true);
    setTimeout(() => {
      setOutput([`> Executing ${activeFileName}...`, "Hello Synapse!", "Done."]);
      setIsRunning(false);
    }, 1000);
  };

  if (loading) return <div className="h-screen bg-[#1e1e1e] text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="flex flex-col h-screen w-full bg-[#F8F9FB] md:bg-[#F8F9FB] overflow-hidden">
      
      <div className="md:hidden h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-20">
        <button onClick={() => setSidebarOpen(true)} className="text-gray-700"><Menu size={20} /></button>
        <div className="flex items-center gap-2 font-bold text-sm">
           {activeFileName || 'No File'}
           {isDirty && <div className="w-2 h-2 rounded-full bg-orange-500"/>}
        </div>
        <button onClick={runCode}><Play size={14} className="fill-current text-gray-700" /></button>
      </div>

      <div className="flex-1 flex overflow-hidden md:p-4 gap-4 relative">
        <div className={`absolute md:relative z-30 inset-y-0 left-0 w-64 bg-white md:rounded-3xl shadow-2xl md:shadow-sm transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex flex-col p-6`}>
           <div className="flex justify-between items-center mb-6 md:hidden">
            <h3 className="font-bold">Menu</h3>
            <button onClick={() => setSidebarOpen(false)}><X size={20} /></button>
          </div>

          <div className="flex justify-between mb-4 px-2">
            <h3 className="font-bold text-gray-400 text-xs uppercase">Explorer</h3>
            <div className="flex gap-1">
              <button onClick={() => { navigator.clipboard.writeText(roomId); toast.success("Copied!"); }}><Copy size={14} /></button>
              <button onClick={handleCreateFile}><Plus size={16} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1">
            {files.map(file => (
              <div 
                key={file.name} 
                onClick={() => { setActiveFileName(file.name); setSidebarOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer ${
                  activeFileName === file.name 
                    ? 'bg-green-100 text-green-800 border-l-4 border-green-500' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <FileCode size={16} />
                <span className="truncate text-sm font-medium flex-1">{file.name}</span>
                <button onClick={(e) => handleDeleteFile(e, file.name)} className="hover:text-red-500"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>

           <div className="border-t pt-6 mt-4">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold mb-3"><Users size={12} /> ONLINE ({activeUsers.length})</div>
            <div className="flex -space-x-2">
              {activeUsers.map((u, i) => (
                <div 
                  key={i} 
                  title={u.name} 
                  style={{ backgroundColor: u.color }}
                  className="w-8 h-8 rounded-full border-2 border-white text-white flex items-center justify-center text-xs font-bold"
                >
                  {u.name?.[0]?.toUpperCase() || 'U'}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-[#1e1e1e] w-full md:rounded-3xl shadow-2xl relative overflow-hidden flex flex-col">
          <div className="hidden md:flex h-12 bg-[#252526] border-b border-black items-center justify-between px-6 select-none">
            <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-red-500"/><div className="w-3 h-3 rounded-full bg-yellow-500"/><div className="w-3 h-3 rounded-full bg-green-500"/></div>
            
            <div className="flex items-center gap-2">
               <span className="text-gray-400 text-sm font-mono">{activeFileName}</span>
               {isDirty && (
                 <div className="w-2 h-2 rounded-full bg-white opacity-80" title="Unsaved Changes"/>
               )}
            </div>

            <div className="flex gap-2">
              <button onClick={handleSave} className="text-gray-400 hover:text-white"><Save size={16} /></button>
              <button onClick={runCode} className="bg-lime-400 text-black px-4 py-1.5 rounded-full text-xs font-bold flex gap-2 items-center"><Play size={12}/> RUN</button>
            </div>
          </div>

          <div className="flex-1 relative">
            {activeFile ? (
               <Editor
               height="100%"
               language={activeFile.language === 'nodejs' ? 'javascript' : activeFile.language}
               theme="vs-dark"
               path={activeFile.name} 
               onMount={handleEditorDidMount} 
               onChange={handleEditorChange}
               options={{ 
                 minimap: { enabled: false }, 
                 fontSize: 14, 
                 fontFamily: 'JetBrains Mono',
                 automaticLayout: true 
               }}
             />
            ) : <div className="flex items-center justify-center h-full text-gray-500">Select a file</div>}
          </div>
        </div>

        <div className={`absolute md:relative z-30 inset-x-0 bottom-0 md:w-80 bg-white md:rounded-3xl shadow-xl transition-transform duration-300 flex flex-col ${outputOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'} h-[40vh] md:h-auto`}>
           <div className="md:hidden w-full flex justify-center pt-3 pb-1" onClick={() => setOutputOpen(false)}><div className="w-12 h-1.5 bg-gray-300 rounded-full"/></div>
           <div className="p-6 flex flex-col h-full">
             <div className="flex gap-2 mb-4">
               <button className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full font-bold">Output</button>
               <button onClick={() => setOutput([])} className="ml-auto text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
             </div>
             <div className="flex-1 bg-[#1e1e1e] rounded-xl p-4 font-mono text-xs overflow-y-auto text-gray-300">
               {output.map((line, i) => <div key={i} className="mb-1">{line}</div>)}
               {isRunning && <div className="text-lime-400 animate-pulse">Running...</div>}
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default EditorPage;
