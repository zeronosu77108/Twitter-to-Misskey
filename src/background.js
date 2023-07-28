// Twitterのページからメッセージを受け取ったときの処理
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'postToMisskey') {
        console.log("post Missey");

        fetch(`${request.url}/api/notes/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                i: request.accessToken,
                visibility: request.visibility,
                text: request.text,
            }),
        })
        .then((response) => {
            if (!response.ok) {
                console.error('Misskey post failed:', response);
                return response.text().then((text) => {
                    sendResponse({
                        ok: false,
                        message: text || "An error occurred."
                    });
                });
            } else {
                sendResponse({
                    ok: true,
                    message: "Misskeyに投稿しました。"
                });
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            sendResponse({
                ok: false,
                message: error.message
            });
        });

        // メッセージチャネルを開いたままにするために true を返します
        return true;
    }
});
