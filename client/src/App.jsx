import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import EditorPage from './pages/EditorPage';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth/>} />
          <Route path="/dashboard" element={<Dashboard/>} />
          <Route path="/editor/:roomId" element={<EditorPage/>} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
