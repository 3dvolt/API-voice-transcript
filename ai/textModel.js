const response = await fetch('https://api.aimlapi.com/chat/completions', {
    method: 'POST',
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        "model": "text",
        "messages": [
            "text"
        ]
    }),
});
const data = await response.json();