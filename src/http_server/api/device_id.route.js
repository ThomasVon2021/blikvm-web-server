import fs from 'fs';

/**
 * Handles the API request for retrieving the device ID.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
function apiFunc (req, res) {
    try {
        const { other } = JSON.parse(fs.readFileSync('config/app.json', 'utf8'));
        const data = JSON.parse(fs.readFileSync(other.secretFile, 'utf8'));
        res.json({ id: data.id });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export default apiFunc;