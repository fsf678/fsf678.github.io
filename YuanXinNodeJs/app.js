const express = require('express');
const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const svgCaptcha = require('svg-captcha');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 配置 EJS 作为视图引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 15 // limit each IP to 15 requests per windowMs
});
app.use(limiter);

const password = 'sRj2KXK9MHeLWcNR9J542P0ybP6KPyy9';
const DATA_FILE = 'yuanXinList.json';

function loadData() {
    if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    }
    console.log('没用保存的JSON');
    return { "1292466375": { "type": "超级无敌大帅哥", "note": "非常牛逼,他是本网站的作者" } };
}

let mxz_data = loadData();

function saveData() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(mxz_data, null, 4), 'utf-8');
}

let mxz_pending_review_data = {};
let codes_answers = {};

function summonCode() {
    const captcha = svgCaptcha.create({
        size: 4,
        noise: 2,
        color: true,
        background: '#cc9966'
    });
    const imgId = uuid.v4();
    codes_answers[imgId] = captcha.text;

    return { imgSvg: captcha.data, imgId };
}

app.get('/code', (req, res) => {
    const { imgSvg, imgId } = summonCode();
    res.json({ img: imgSvg, img_id: imgId });
});

const jsForMxzListLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 240
});

app.get('/jsForMxzList', jsForMxzListLimiter, (req, res) => {
    const js_code = `let ypList = ${JSON.stringify(mxz_data)};`;
    res.send(js_code);
});

const reviewLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 240
});

app.all(`/${password}/review`, reviewLimiter, (req, res) => {
    if (req.method === 'POST') {
        const deleteKey = req.body.delete;
        if (deleteKey) {
            delete mxz_pending_review_data[deleteKey];
            return res.redirect(`/${password}/review`);
        }

        const reviewed_data = req.body;
        for (let key in mxz_pending_review_data) {
            const typeKey = `${key}_type`;
            const noteKey = `${key}_note`;

            if (typeKey in reviewed_data && noteKey in reviewed_data) {
                const typeValue = reviewed_data[typeKey];
                const noteValue = reviewed_data[noteKey];

                mxz_data[key] = { type: typeValue, note: noteValue };
            }
        }

        mxz_pending_review_data = {};
        saveData();
        res.json({ message: '数据审核并合并成功' });
    } else {
        res.render('review', { data: mxz_pending_review_data, password: password });
    }
});

app.get('/latest_data', (req, res) => {
    res.json(mxz_data);
});

app.get('/report', (req, res) => {
    try {
        const data = JSON.parse(req.query.data);
        console.log(data.code);
        console.log(codes_answers[data.code_id])

        if (data.code === codes_answers[data.code_id]) {
            if (data.data_type === 'people') {
                mxz_pending_review_data[data.id] = { type: data.type, note: data.note };
                delete codes_answers[data.code_id];
            } else if (data.data_type === 'dian') {
                delete codes_answers[data.code_id];
                return res.send('还没做');
            }
            res.send('ok');
        } else {
            res.send('error');
        }
    } catch (err) {
        console.log(err);
        res.send('error');
    }
});

app.listen(8080, '0.0.0.0', () => {
    console.log('Server running on http://0.0.0.0:8080');
});
