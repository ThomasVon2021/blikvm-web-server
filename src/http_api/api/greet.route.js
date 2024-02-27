
function apiFunc (req, res) {
    try {
        res.json({ msg:'hello world' });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export default apiFunc;