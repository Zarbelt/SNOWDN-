import 'dotenv/config'; // Load environment variables
import express from "express";
import cors from "cors";
import helmet from "helmet"; // Import helmet for security headers
import path from "path";
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseservicerole = process.env.SUPABASE_SERVICE;
const supabase = createClient(supabaseUrl, supabaseKey, supabaseservicerole);

// Configure CORS to allow all origins and methods
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow all methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allow specific headers
}));

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-eval'"], // Allow unsafe-eval (use with caution)
                styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles
                imgSrc: ["'self'", 'data:', 'https://*'], // Allow images from self, data URIs, and HTTPS
                fontSrc: ["'self'", 'https://*'], // Allow fonts from self and HTTPS
                connectSrc: ["'self'", 'https://*'], // Allow connections to self and HTTPS
            },
        },
    })
);
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