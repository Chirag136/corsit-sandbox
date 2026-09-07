import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 1. AI Wiring Check Proxy
app.post('/api/ai/check-wiring', async (req, res) => {
  const { circuit } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // If no server key configured, return fallback instruction
    return res.json({
      fallback: true,
      message: 'No server-side ANTHROPIC_API_KEY set. Falling back to client deterministic engine.',
    });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system:
          'You are a robotics teaching assistant. Given this circuit JSON, identify wiring errors and explain each in plain English. Return JSON with format { "errors": [ { "componentId": string, "issue": string, "explanation": string, "suggestedFix": string } ] }',
        messages: [{ role: 'user', content: JSON.stringify(circuit) }],
      }),
    });

    const data = await response.json();
    const content = data.content?.[0]?.text;
    res.json(JSON.parse(content || '{}'));
  } catch (err) {
    console.error('AI Proxy Error:', err);
    res.status(500).json({ error: 'Failed to process AI check' });
  }
});

// 2. AI Circuit Explainer Proxy
app.post('/api/ai/explain', async (req, res) => {
  const { circuit } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.json({
      fallback: true,
      message: 'No server-side ANTHROPIC_API_KEY set.',
    });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system:
          'You are a robotics teaching assistant. Given this circuit JSON, summarize what it does, its architecture, and the signal flow. Return JSON with format: { "summary": string, "architecture": string, "signalFlow": string[] }',
        messages: [{ role: 'user', content: JSON.stringify(circuit) }],
      }),
    });

    const data = await response.json();
    const content = data.content?.[0]?.text;
    res.json(JSON.parse(content || '{}'));
  } catch (err) {
    console.error('AI Proxy Error:', err);
    res.status(500).json({ error: 'Failed to explain circuit' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CorSIT Sandbox AI Proxy' });
});

app.listen(PORT, () => {
  console.log(`CorSIT AI Proxy running on http://localhost:${PORT}`);
});
