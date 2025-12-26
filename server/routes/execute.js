const express = require('express');
const router = express.Router();
const axios = require('axios');

const PISTON_API = 'https://emkc.org/api/v2/piston/execute';

const RUNTIMES = {
  javascript: { language: 'javascript', version: '18.15.0' },
  python: { language: 'python', version: '3.10.0' },
  java: { language: 'java', version: '15.0.2' },
  cplusplus: { language: 'c++', version: '10.2.0' }
};

router.post('/', async (req, res) => {
  const { language, code } = req.body;

  const runtime = RUNTIMES[language] || RUNTIMES.javascript;

  const payload = {
    language: runtime.language,
    version: runtime.version,
    files: [
      {
        content: code
      }
    ]
  };

  try {
    const response = await axios.post(PISTON_API, payload);
    res.json(response.data);
  } catch (error) {
    console.error("Execution Error:", error.message);
    res.status(500).json({ message: "Failed to execute code" });
  }
});

module.exports = router;
