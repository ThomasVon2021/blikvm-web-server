import fs from 'fs';

export default function (req, res) {
    try {
        const { other } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
        const data = JSON.parse(fs.readFileSync(other.secretFile, 'utf8'));
        res.json({ id: data.id });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
}