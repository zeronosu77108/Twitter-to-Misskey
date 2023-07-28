// ツイートボタンとツイート内容を入力するテキストエリアのDOM要素を取得する関数
function getDomElements() {
    return {
        tweetButton: document.querySelector('div[data-testid="tweetButtonInline"]'),
        tweetTextarea: document.querySelector('div[aria-labelledby="tweet-box-home-timeline-label"]'),
    };
}

function getTwitterId() {
    // 方法1: AppTabBar_Profile_LinkからTwitter IDを取得
    let profileLinkElement = document.querySelector('a[data-testid="AppTabBar_Profile_Link"]');
    if (profileLinkElement) {
        const href = profileLinkElement.getAttribute('href');
        const id = href.substring(1);  // remove the leading slash
        if (id) {
            return id;
        }
    }

    // 方法2: user-actionsからTwitter IDを取得
    let userActionsElement = document.querySelector('div[data-testid="primaryColumn"] div[data-testid="UserCell"] a');
    if (userActionsElement) {
        const href = userActionsElement.getAttribute('href');
        const id = href.substring(1);  // remove the leading slash
        if (id) {
            return id;
        }
    }

    // どちらの方法でもIDが見つからなかった場合
    return null; // or default value
}


// toggleMisskeyPostをグローバルスコープで定義
let toggleMisskeyPost = localStorage.getItem( getTwitterId() + 'toggleMisskeyPost') === 'true';
let toggleBUtton;

// Misskeyへの投稿を制御するためのトグルボタンを作成する関数
function createToggleButton() {
    toggleButton = document.createElement('button');
    toggleButton.innerText = 'Mi';
    toggleMisskeyPost = localStorage.getItem(getTwitterId() + 'toggleMisskeyPost') === 'true';
    toggleButton.style.backgroundColor = toggleMisskeyPost? 'lightgreen' : 'gray';
    toggleButton.style.borderRadius = '12px'; // Add this line to make the button round
    toggleButton.style.border = 'none';
    toggleButton.style.padding = '10px';
    toggleButton.style.marginRight = '10px';  // 右側に10pxのマージンを追加


    // トグルボタンのクリックイベントハンドラ
    toggleButton.addEventListener('click', () => {
        toggleMisskeyPost = !toggleMisskeyPost;
        console.log("toggle : " + toggleMisskeyPost);
        localStorage.setItem(getTwitterId() + 'toggleMisskeyPost', toggleMisskeyPost);
        toggleButton.style.backgroundColor = toggleMisskeyPost? 'lightgreen' : 'gray';


        // Misskey URL and access token are requested when the button is enabled
        if (toggleMisskeyPost) {
        
            let twitterId = getTwitterId();
            let misskeyUrl = localStorage.getItem(twitterId + 'misskeyUrl');
            let misskeyAccessToken = localStorage.getItem(twitterId + 'misskeyAccessToken');
 
            console.log(misskeyUrl);
            console.log(misskeyAccessToken);
            console.log(!misskeyAccessToken);
            
            
            if (!misskeyUrl || misskeyUrl === "null") {
                misskeyUrl = window.prompt('Misskey URL を入力してください');
                if (misskeyUrl !== null) {
                    // If the URL ends with a '/', remove it
                    if (misskeyUrl.endsWith('/')) {
                        misskeyUrl = misskeyUrl.slice(0, -1);
                    }
                    localStorage.setItem(twitterId + 'misskeyUrl', misskeyUrl);   
                }
            }

            if (!misskeyAccessToken || misskeyAccessToken === "null") {
                misskeyAccessToken = window.prompt('Misskey access token を入力してください');
                if (misskeyAccessToken !== null) {
                    localStorage.setItem(twitterId + 'misskeyAccessToken', misskeyAccessToken);
                    
                }
            }
            
            if (!misskeyUrl || !misskeyAccessToken) {
                toggleMisskeyPost = false;
                localStorage.setItem(getTwitterId() + 'toggleMisskeyPost', toggleMisskeyPost);
                toggleButton.style.backgroundColor = toggleMisskeyPost? 'lightgreen' : 'gray';
            }
        }
    });

    return toggleButton;
}


// トグルボタンを設定する関数
function setupToggleButton() {
    const { tweetButton, tweetTextarea } = getDomElements();
    if (tweetButton) {
        const toggleButton = createToggleButton();

        // ツイートボタンの前にトグルボタンを追加
        tweetButton.parentNode.insertBefore(toggleButton, tweetButton);

        // 「ツイートする」ボタンのクリックイベントハンドラ
        tweetButton.addEventListener('click', () => {
            console.log("ツイートするボタンが押された1");
            // トグルボタンが有効ならMisskeyにも投稿
            console.log(toggleMisskeyPost);
            if (toggleMisskeyPost) {
                console.log("投稿する");
                const tweetContentEditableDiv = document.querySelector('div[data-testid="tweetTextarea_0"]');
                const tweetText = tweetContentEditableDiv.innerText;

                let twitterId = getTwitterId();
                const misskeyUrl = localStorage.getItem(twitterId + 'misskeyUrl');
                const misskeyAccessToken = localStorage.getItem(twitterId + 'misskeyAccessToken');
                const visibility = localStorage.getItem(twitterId + 'visibility');

//                console.log(twitterId);
//                console.log(misskeyUrl);
//                console.log(misskeyAccessToken);

                // バックグラウンドスクリプトにメッセージを送信
                chrome.runtime.sendMessage(
                    {
                        action: 'postToMisskey',
                        url: misskeyUrl,
                        accessToken: misskeyAccessToken,
                        text: tweetText,
                        visibility: visibility
                    },
                    function(response) {
                        if (response.ok) {
                            createFlashMessage(response.message, 'success');
                        } else {
                            createFlashMessage(response.message, 'error');
                        }
                    }
                );
            }
        });

    }
}

function createFlashMessage(message, type) {
    // Create a flash message div
    const flashMessageDiv = document.createElement('div');

    // Create close button and attach event to remove the parent div when clicked
    const closeButton = document.createElement('button');
    closeButton.innerText = 'X';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '0';
    closeButton.style.right = '0';
    closeButton.style.border = 'none';
    closeButton.style.background = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', () => {
        document.body.removeChild(flashMessageDiv);
    });

    // Append the message text and the close button to the flash message div
    flashMessageDiv.appendChild(closeButton);
    flashMessageDiv.appendChild(document.createTextNode(message));

    // Customize the style of the div depending on the message type
    flashMessageDiv.style.position = 'fixed';
    flashMessageDiv.style.top = '20px';
    flashMessageDiv.style.right = '20px';
    flashMessageDiv.style.padding = '10px';
    flashMessageDiv.style.backgroundColor = type === 'success' ? 'lightgreen' : 'salmon';
    flashMessageDiv.style.color = 'white';
    flashMessageDiv.style.zIndex = 9999;
    flashMessageDiv.style.borderRadius = '10px';

    // Add the flash message div to the document body
    document.body.appendChild(flashMessageDiv);

    // Automatically remove the flash message after 30 seconds
    setTimeout(() => {
        if (document.body.contains(flashMessageDiv)) {
            document.body.removeChild(flashMessageDiv);
        }
    }, 30000);
}




// 公開範囲を制御するプルダウンメニューを作成する関数
function createVisibilityDropdown() {
    const select = document.createElement('select');
    const options = ['public', 'home', 'followers', 'RESET']; // 選択肢を作成します

    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.innerText = option;
        select.appendChild(opt);
    });

    // 初期値をローカルストレージから読み込みます
    let twitterId = getTwitterId();
    const savedVisibility = localStorage.getItem(twitterId + 'visibility');
    if (savedVisibility) {
        select.value = savedVisibility;
    } else {
        select.value = 'public';
        localStorage.setItem(twitterId + 'visibility', 'public');
    }

    // 選択が変更されたときのイベントハンドラ
    select.addEventListener('change', (event) => {
        let twitterId = getTwitterId();

        if (event.target.value === 'RESET') {
            // Resetが選ばれた場合の処理
            const confirmReset = window.confirm('Misskeyの設定をリセットしますか?');
            if (confirmReset) {
                localStorage.removeItem(twitterId + 'misskeyUrl');
                localStorage.removeItem(twitterId + 'misskeyAccessToken');
                localStorage.removeItem(twitterId + 'visibility');
                
                localStorage.setItem(getTwitterId() + 'toggleMisskeyPost', false);
                
                
                select.value = 'public';  // プルダウンをpublicに戻す
                localStorage.setItem(twitterId + 'visibility', 'public');
                toggleButton.style.backgroundColor = toggleMisskeyPost? 'lightgreen' : 'gray';
                
            } else {
                // ユーザーがリセットをキャンセルした場合、以前の設定値をプルダウンにセットします
                select.value = localStorage.getItem(twitterId + 'visibility') || 'public';
            }
        } else {
            // 通常のvisibility選択時の処理
            localStorage.setItem(twitterId + 'visibility', event.target.value);
        }
        
    });

    return select;
}

// プルダウンメニューを設定する関数
function setupVisibilityDropdown() {
    const { tweetButton, tweetTextarea } = getDomElements();
    if (tweetButton) {
        const visibilityDropdown = createVisibilityDropdown();
        tweetButton.parentNode.insertBefore(visibilityDropdown, tweetButton);
    }
}


// ページの読み込みが完了したらボタンを設定する
window.addEventListener('load', () => {
    setupToggleButton();
    setupVisibilityDropdown();
});

// DOMの変更を監視するMutationObserverを作成
const observer = new MutationObserver(() => {
    const { tweetButton } = getDomElements();
    if (tweetButton && !tweetButton.previousSibling) {
        setupToggleButton();
        setupVisibilityDropdown();  // プルダウンメニューを作成
    }
});

// ツイートボタンの親ノードの変更を監視開始
observer.observe(document.body, { childList: true, subtree: true });
