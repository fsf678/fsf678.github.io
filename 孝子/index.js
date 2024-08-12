const searchBody = document.getElementById('search-body');
const searchPart = document.getElementById('search-part');
const mainTitle = document.getElementById('main-title');
const typeSelectButton = document.getElementById('type-select-button');

const searchResult = document.getElementById('search-result');
const searchResultTitle = document.getElementById('search-result-title');
const resultType = document.getElementById('result-type');
const resultNote = document.getElementById('result-note');

const input = document.getElementById('input');
const fab = document.getElementById('fab');
let haveSearch = false;

let ypList = {};

function getJson(url) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, false); // async = false
    xhr.send();
    if (xhr.status === 200) {
        const jsonData = JSON.parse(xhr.responseText);
        return jsonData;
    }
}

ypList = getJson('http://xn--qvrw50dh7j.top/yuanXinList.json');
const articles = getJson('http://xn--qvrw50dh7j.top/yuanArticles.json')['data'];

function people() {
    let result = ypList[input.value];

    if (result == undefined) { //如果找不到
        mdui.alert({
            headline: "(っ °Д °;)っ 竟然找不到",
            description: "您也许可以为我们提供此人信息?",
            confirmText: "OK",
        });
        return;
    }

    if (haveSearch == false) {
        mainTitle.style.display = "none";
        searchBody.classList.add("animate-top");
        haveSearch = true;
        searchResult.style.display = "flex";
    }

    searchResultTitle.innerHTML = `<a href='https://space.bilibili.com/${input.value}'>搜索结果 (UID: ${input.value})</a> <mdui-divider></mdui-divider>`;
    resultType.innerHTML = `它是一个 <em style='font-size: x-large'>${result['type']}</em>`;
    resultNote.innerHTML = marked.parse(result['note']);
}

function levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const dp = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) {
        for (let j = 0; j <= len2; j++) {
            if (i === 0) {
                dp[i][j] = j;
            } else if (j === 0) {
                dp[i][j] = i;
            } else if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
            }
        }
    }

    return dp[len1][len2];
}

// 计算两个句子之间的相似度
function getSimilarity(str1, str2) {
    const maxLength = Math.max(str1.length, str2.length);
    const distance = levenshteinDistance(str1, str2);
    return (1 - distance / maxLength);
}

// 判断 juzi 是否是 mostSimilarSentence 的一部分
function isJuziInPart(mostSimilarSentence, juzi, minPartLength) {
    const partLength = Math.min(mostSimilarSentence.length, juzi.length);
    return mostSimilarSentence.includes(juzi) && partLength >= minPartLength;
}

// 查找与待检查句子相似度最高的句子
function findMostSimilarSentence(articles, juzi) {
    let maxSimilarity = 0;
    let mostSimilarSentence = '';

    articles.forEach(sentence => {
        const similarity = getSimilarity(sentence, juzi);
        if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            mostSimilarSentence = sentence;
        }
    });

    const minPartLength = Math.ceil(juzi.length * 0.5); // 定义部分长度阈值，例如 juzi 长度的 50%
    const isInPart = isJuziInPart(mostSimilarSentence, juzi, minPartLength);
    let resultText = '不知道'

    if (maxSimilarity == 0) {
        resultText = '不重复';
    }
    else if (maxSimilarity <= 0.2) {
        resultText = '少部分重复';
    }
    else if (maxSimilarity <= 0.4) {
        resultText = '部分重复';
    }
    else if (maxSimilarity <= 0.7) {
        resultText = '大部分重复';
    }
    else if (maxSimilarity <= 0.9) {
        resultText = '几乎完全重复';
    }
    else if (maxSimilarity <= 1) {
        resultText = '完全重复';
    }


    return { mostSimilarSentence, maxSimilarity, isInPart, resultText };
}

function dian() {
    if (haveSearch == false) {
        mainTitle.style.display = "none";
        searchBody.classList.add("animate-top");
        haveSearch = true;
        searchResult.style.display = "flex";
    }
    const juzi = input.value;

    const result = findMostSimilarSentence(articles, juzi);

    searchResultTitle.innerHTML = `搜索结果 (${result.resultText})`;
    resultType.innerHTML = `
    <mdui-list>
    <mdui-list-item>
        相似度(${(Math.floor(result.maxSimilarity * 100) / 100).toFixed(2) * 100 + "%"})
        <mdui-icon name="info" slot="icon"></mdui-icon>
        <mdui-circular-progress value="${result.maxSimilarity}" slot="end-icon"></mdui-circular-progress>
    </mdui-list-item>
   <mdui-list-item>
        大部分是否被收录
        <mdui-icon name="bookmarks" slot="icon"></mdui-icon>
        <div slot="end-icon" style='font-size: large'>${result.isInPart ? '是' : '否'}<div>
    </mdui-list-item>
    </mdui-list>`;
    resultNote.innerHTML = `<h3>匹配到最相似的文本</h3>
    ${(result.mostSimilarSentence == '') ? `无。<a href="https://www.bing.com/search?q=${juzi}">在Bing搜索</a>` : result.mostSimilarSentence}`;

    // /alert(`重复率: ${result.maxSimilarity}`);
}

let selectType = 'dian';
function selectOtherType() {
    if (selectType == 'people') {
        typeSelectButton.textContent = '搜典';
        input.placeholder = "键入OP爆的典";
        selectType = 'dian';
    } else {
        typeSelectButton.textContent = '搜人';
        input.placeholder = "键入OP的B站UID";
        selectType = 'people';
    }
}
function search() {
    if (selectType == 'people') {
        people();
    } else {
        dian();
    }
}

fab.addEventListener('click', function () {
    search();
});


function keyup_submit(e) {
    var evt = window.event || e;
    if (evt.keyCode == 13) {
        search();
    }
}

window.addEventListener('load', () => document.querySelector("#input").shadowRoot.querySelector("div > div > input").onkeydown = event => keyup_submit(event));