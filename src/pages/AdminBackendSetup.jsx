import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Server, Code, CheckCircle, Copy, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminBackendSetup() {
  const [backendUrl, setBackendUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const settings = await base44.entities.AppSettings.filter({ 
        setting_key: 'message_backend_url' 
      }, null, 1);
      
      if (settings[0]) {
        setBackendUrl(settings[0].value_string || '');
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const existing = await base44.entities.AppSettings.filter({ 
        setting_key: 'message_backend_url' 
      }, null, 1);

      if (existing[0]) {
        await base44.entities.AppSettings.update(existing[0].id, {
          value_string: backendUrl
        });
      } else {
        await base44.entities.AppSettings.create({
          setting_key: 'message_backend_url',
          value_string: backendUrl,
          category: 'system',
          description_en: 'External backend URL for secure message creation',
          description_fr: 'URL du backend externe pour création sécurisée de messages'
        });
      }

      alert('✅ Configuration sauvegardée');
    } catch (error) {
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const testBackend = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch(`${backendUrl}/api/health`, {
        method: 'GET'
      });

      if (response.ok) {
        setTestResult({ success: true, message: 'Backend accessible' });
      } else {
        setTestResult({ success: false, message: `HTTP ${response.status}` });
      }
    } catch (error) {
      setTestResult({ success: false, message: error.message });
    } finally {
      setTesting(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert('✅ Code copié');
  };

  // Backend implementation examples
  const nodeJsCode = `// Node.js + Express backend
// Install: npm install express cors dotenv
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Base44 admin credentials (from environment)
const BASE44_ADMIN_EMAIL = process.env.BASE44_ADMIN_EMAIL;
const BASE44_ADMIN_PASSWORD = process.env.BASE44_ADMIN_PASSWORD;
const BASE44_API_URL = 'https://api.base44.com'; // Replace with actual Base44 API

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Send message endpoint
app.post('/api/send-message', async (req, res) => {
  try {
    const { conversationId, body } = req.body;
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    const userEmail = req.headers['x-user-email'];

    // 1. Verify user token with Base44
    const user = await verifyBase44Token(authToken, userEmail);
    if (!user) {
      return res.status(403).json({ error: 'Invalid authentication' });
    }

    // 2. Load conversation as admin
    const conversation = await loadConversationAsAdmin(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // 3. Check participant
    const isParticipant = 
      conversation.user_a_id === user.email || 
      conversation.user_b_id === user.email;
    
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    // 4. Check blocks
    const isBlocked = await checkBlockStatus(
      user.email, 
      user.email === conversation.user_a_id 
        ? conversation.user_b_id 
        : conversation.user_a_id
    );
    
    if (isBlocked) {
      return res.status(403).json({ error: 'User blocked' });
    }

    // 5. Rate limit (10 messages/minute)
    const rateLimitOk = await checkRateLimit(user.email);
    if (!rateLimitOk) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    // 6. Create message as admin
    const message = await createMessageAsAdmin({
      conversation_id: conversationId,
      participant_a_id: conversation.user_a_id,
      participant_b_id: conversation.user_b_id,
      from_user_id: user.email,
      to_user_id: user.email === conversation.user_a_id 
        ? conversation.user_b_id 
        : conversation.user_a_id,
      body
    });

    res.json({ success: true, message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function verifyBase44Token(token, email) {
  // Call Base44 API to verify token
  // Return user object or null
  // TODO: Implement based on Base44's auth verification endpoint
  return { email };
}

async function loadConversationAsAdmin(conversationId) {
  // Call Base44 API as admin to load conversation
  // TODO: Use admin credentials to authenticate
  return null;
}

async function checkBlockStatus(userId, otherUserId) {
  // Check Block entity
  return false;
}

async function checkRateLimit(userId) {
  // Check rate limit (store in Redis or memory)
  return true;
}

async function createMessageAsAdmin(messageData) {
  // Call Base44 API as admin to create message
  // TODO: Authenticate with admin credentials
  return messageData;
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(\`Backend running on port \${PORT}\`);
});`;

  const pythonCode = `# Python + Flask backend
# Install: pip install flask flask-cors python-dotenv requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

BASE44_ADMIN_EMAIL = os.getenv('BASE44_ADMIN_EMAIL')
BASE44_ADMIN_PASSWORD = os.getenv('BASE44_ADMIN_PASSWORD')
BASE44_API_URL = 'https://api.base44.com'  # Replace with actual

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

@app.route('/api/send-message', methods=['POST'])
def send_message():
    try:
        data = request.json
        conversation_id = data.get('conversationId')
        body = data.get('body')
        
        auth_token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_email = request.headers.get('X-User-Email')
        
        # 1. Verify user
        user = verify_base44_token(auth_token, user_email)
        if not user:
            return jsonify({'error': 'Invalid authentication'}), 403
        
        # 2. Load conversation as admin
        conversation = load_conversation_as_admin(conversation_id)
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
        
        # 3. Check participant
        is_participant = (
            conversation['user_a_id'] == user['email'] or 
            conversation['user_b_id'] == user['email']
        )
        if not is_participant:
            return jsonify({'error': 'Not a participant'}), 403
        
        # 4. Create message as admin
        message = create_message_as_admin({
            'conversation_id': conversation_id,
            'participant_a_id': conversation['user_a_id'],
            'participant_b_id': conversation['user_b_id'],
            'from_user_id': user['email'],
            'to_user_id': (
                conversation['user_b_id'] 
                if user['email'] == conversation['user_a_id'] 
                else conversation['user_a_id']
            ),
            'body': body
        })
        
        return jsonify({'success': True, 'message': message})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def verify_base44_token(token, email):
    # TODO: Implement Base44 token verification
    return {'email': email}

def load_conversation_as_admin(conversation_id):
    # TODO: Call Base44 API with admin credentials
    return None

def create_message_as_admin(message_data):
    # TODO: Call Base44 API with admin credentials
    return message_data

if __name__ == '__main__':
    app.run(port=3001)`;

  const cloudflareCode = `// Cloudflare Worker
// Deploy: wrangler publish
export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Email'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/api/health') {
      return new Response(
        JSON.stringify({ status: 'ok' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send message
    if (url.pathname === '/api/send-message' && request.method === 'POST') {
      try {
        const data = await request.json();
        const authToken = request.headers.get('Authorization')?.replace('Bearer ', '');
        const userEmail = request.headers.get('X-User-Email');

        // TODO: Implement Base44 verification + message creation
        // Use env.BASE44_ADMIN_EMAIL and env.BASE44_ADMIN_PASSWORD

        return new Response(
          JSON.stringify({ success: true, message: {} }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  }
};`;

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Server className="w-8 h-8 text-violet-500" />
              <h1 className="text-3xl font-bold">Backend Setup - Secure Messaging</h1>
            </div>
            <p className="text-slate-400">
              Configuration du backend externe pour création sécurisée de messages (Message.create = admin-only)
            </p>
          </div>

          {/* Critical info */}
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-red-300 mb-2">⚠️ REQUIS POUR LE CHAT</h3>
                <p className="text-slate-300 text-sm mb-3">
                  Message.create est en admin-only pour empêcher les attaques par injection. 
                  Un backend externe est OBLIGATOIRE pour que les users puissent envoyer des messages.
                </p>
                <p className="text-amber-200 text-sm font-semibold">
                  Sans backend configuré, le chat est désactivé.
                </p>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Backend URL</label>
                <Input
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  placeholder="https://your-backend.com"
                  className="bg-slate-900 border-slate-700"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Exemple: https://messaging-backend.yourcompany.com
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={saveConfig} disabled={saving} className="bg-green-600 hover:bg-green-700">
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
                <Button onClick={testBackend} disabled={testing || !backendUrl} variant="outline">
                  {testing ? 'Test...' : 'Tester connexion'}
                </Button>
              </div>
              {testResult && (
                <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-900/20 border border-green-500/30' : 'bg-red-900/20 border border-red-500/30'}`}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    )}
                    <span className={testResult.success ? 'text-green-300' : 'text-red-300'}>
                      {testResult.message}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Implementation examples */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Code className="w-5 h-5" />
              Exemples d'implémentation backend
            </h2>

            <Tabs defaultValue="nodejs">
              <TabsList className="mb-4">
                <TabsTrigger value="nodejs">Node.js</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="cloudflare">Cloudflare Worker</TabsTrigger>
              </TabsList>

              <TabsContent value="nodejs">
                <div className="relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyCode(nodeJsCode)}
                    className="absolute top-2 right-2 z-10"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-xs text-slate-300">
                    {nodeJsCode}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="python">
                <div className="relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyCode(pythonCode)}
                    className="absolute top-2 right-2 z-10"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-xs text-slate-300">
                    {pythonCode}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="cloudflare">
                <div className="relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyCode(cloudflareCode)}
                    className="absolute top-2 right-2 z-10"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-xs text-slate-300">
                    {cloudflareCode}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Documentation */}
          <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
            <h3 className="font-semibold text-blue-300 mb-3">📚 Documentation complète</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <p><strong>Endpoints requis:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>GET /api/health → {"{ status: 'ok' }"}</li>
                <li>POST /api/send-message → Crée message avec vérification participant</li>
              </ul>
              <p className="mt-3"><strong>Sécurité:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Vérifier token Base44 de l'utilisateur</li>
                <li>Vérifier que user est participant de la conversation</li>
                <li>Vérifier blocage entre utilisateurs</li>
                <li>Rate limit: 10 messages/minute/user</li>
                <li>Créer message avec credentials admin Base44</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}