// Vercel Serverless Function to safely expose environment variables to client-side JS
export default function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('Content-Type', 'application/javascript');
    
    const config = {
        SHEET_ID: process.env.SHEET_ID || "",
        APPS_SCRIPT_URL: process.env.APPS_SCRIPT_URL || ""
    };

    res.status(200).send(`window.ENV = ${JSON.stringify(config)};`);
}
