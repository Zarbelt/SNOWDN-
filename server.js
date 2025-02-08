import 'dotenv/config'; // Load environment variables
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

const supabaseUrl = 'https://btotqnvpdropstzpnapb.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

app.use(cors({
  origin: 'https://swap.snowdn.org',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Set Content Security Policy
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://swap.snowdn.org/; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://btotqnvpdropstzpnapb.supabase.co; frame-src 'self';"
  );
  next();
});

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/log-transaction', async (req, res) => {
    const { action, currency, amount, timestamp } = req.body;

    const { data, error } = await supabase
        .from('transactions')
        .insert([{ action, currency, amount, timestamp }]);

    if (error) {
        console.error('Failed to insert transaction into Supabase', error);
        return res.status(500).send('Failed to log transaction');
    }

    res.send('Transaction logged successfully');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});