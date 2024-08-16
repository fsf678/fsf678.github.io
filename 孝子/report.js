let code_id
const codeInput = document.getElementById('code-input');
const uid = document.getElementById('uid');
const type = document.getElementById('type');
const note = document.getElementById('note');
const apiUrl = "http://127.0.0.1:8080"

function refreshCode() {
    fetch(apiUrl + '/code')
        .then(response => response.json())
        .then(data => {
            // 获取 img 元素
            const imgElement = document.getElementById('code');

            if (imgElement) {
                // 设置 img 元素的 src 属性
                // imgElement.src = 'data:image/svg+xml;base64,' + btoa(data.img); For SVG
                imgElement.src = 'data:image/png;base64,' + data.img;

                code_id = data.img_id;
            } else {
                console.error('No element with id "code" found');
            }
        })
        .catch(error => {
            console.log(error);
            return 'error';
        });
}
refreshCode();

function sendData(data) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', apiUrl + '/report?data=' + data, true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) { // 请求完成
            if (xhr.status === 200) { // 成功返回
                if (xhr.responseText == "error") {
                    mdui.alert({
                        headline: "(っ °Д °;)っ错误",
                        description: "验证码可能填错了！(或访问频率过高)",
                        confirmText: "OK",
                    });
                }
                else if (xhr.responseText == "ok") {
                    mdui.alert({
                        headline: "ヾ(≧▽≦*)o成功",
                        description: "举报信息已提交,感谢您的贡献!",
                        confirmText: "OK",
                    });
                    uid.value = "";
                    type.value = "";
                    note.value = "";
                }
            } else {
                mdui.alert({
                    headline: "(っ °Д °;)っ错误",
                    description: "网络有点小故障(或访问频率过高)",
                    confirmText: "OK",
                });
            }
        }
    };

    xhr.onerror = function () {
        console.error('Network error occurred');
    };

    xhr.send();
}

function checkCode(str) {
    // 检查字符串是否包含中文字符的正则表达式
    const hasChinese = /[\u4e00-\u9fa5]/.test(str);

    // 检查字符串的长度是否等于4
    const isLengthFour = str.length === 4;

    // 如果包含中文字符或者长度不等于4，则返回 true
    if (hasChinese || !isLengthFour) {
        return true;
    } else {
        return false;
    }
}

function getEncode64(str) {
    // 对字符串进行编码
    var encode = encodeURI(str);
    // 对编码的字符串转化base64
    var base64 = btoa(encode);
    return base64;
}

function submit() {
    if (checkCode(codeInput.value)) {
        mdui.alert({
            headline: "(っ °Д °;)っ错误",
            description: "验证码的格式不正确",
            confirmText: "OK",
        });
        return;
    }
    let data = {};
    data = { "code": codeInput.value, "code_id": code_id, "data_type": "people", "id": uid.value, "type": type.value, "note": note.value };
    let jsonString = JSON.stringify(data);
    alert(jsonString)
    sendData(encodeURIComponent(jsonString));
    refreshCode();
    codeInput.value = "";

}