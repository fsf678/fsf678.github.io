from flask import *
from captcha.image import ImageCaptcha
import string
import random
import uuid
import base64
import io
import json
import os
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(__name__)
# 初始化 Limiter
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["15 per minute"]
)

# 管理密码
password = 'sRj2KXK9MHeLWcNR9J542P0ybP6KPyy9'

# 配置文件路径
DATA_FILE = 'yuanXinList.json'

def load_data():
    """从文件中加载数据"""
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r', encoding='utf-8') as file:
            return json.load(file)
    print('没用保存的JSON')
    return {"1292466375": {"type": "超级无敌大帅哥", "note": "非常牛逼,他是本网站的作者"}}

# 初始化数据
mxz_data = load_data()

def save_data():
    """将数据保存到文件"""
    global mxz_data
    with open(DATA_FILE, 'w', encoding='utf-8') as file:
        # 保存mxz_data的json字符串
        json.dump(mxz_data, file, ensure_ascii=False, indent=4)


# 临时存储需要审核的数据
mxz_pending_review_data = {}

# 储存验证码
codes_answers = {}

# 验证码
def summon_code():
    global codes_answers
    characters = string.digits + string.ascii_uppercase
    width, height, n_len, n_class = 170, 80, 4, len(characters)
    generator = ImageCaptcha(width=width, height=height)
    random_str = ''.join([random.choice(characters) for _ in range(n_len)])
    img = generator.generate_image(random_str)
    img_id = str(uuid.uuid4())
    
    # Convert image to bytes
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_bytes = buffered.getvalue()
    
    # Encode image bytes to base64
    img_base64 = base64.b64encode(img_bytes).decode('utf-8')
    
    codes_answers[img_id] = random_str
    
    return img_base64, img_id

# 获取验证码
@app.route('/code', methods=['GET'])
def code():
    result = summon_code()
    img_base64 = result[0]
    img_id = result[1]
    
    return (jsonify( {"img":img_base64,"img_id":img_id } ))

@limiter.limit("240 per minute")
@app.route('/jsForMxzList', methods=['GET'])
def jsForMxzList():
    global mxz_data
    js_code = """
    let ypList = {data};
    """.format(data=json.dumps(mxz_data))
    
    return js_code

# 渲染审核页面的API
@app.route('/'+password+'/review', methods=['GET', 'POST'])
@limiter.limit("240 per minute")
def review():
    global mxz_data, mxz_pending_review_data, password
    
    if request.method == 'POST':
        # Check if the delete button was pressed
        delete_key = request.form.get('delete')
        if delete_key:
            # Remove the item from pending_review_data
            mxz_pending_review_data.pop(delete_key, None)
            return redirect(url_for('review'))

        # Get the reviewed data
        reviewed_data = request.form.to_dict(flat=False)
        print(reviewed_data)

        for key in mxz_pending_review_data.keys():
            type_key = f"{key}_type"
            note_key = f"{key}_note"

            if type_key in reviewed_data and note_key in reviewed_data:
                type_value = reviewed_data[type_key][0]
                note_value = reviewed_data[note_key][0]

                mxz_data[key] = {"type": type_value, "note": note_value}

        # Clear pending_review_data after processing
        mxz_pending_review_data = {}
        save_data()
        return jsonify({"message": "数据审核并合并成功"})

    # Get pending review data and render the review page
    return render_template('review.html', data=mxz_pending_review_data,password=password)

# 返回最新的历史数据的API
@app.route('/latest_data', methods=['GET'])
def latest_data():
    return jsonify(mxz_data)

@app.route('/report', methods=['GET'])
def report():
    global codes_answers
    # 从 GET 请求中获取 Base64 编码的字符串
    
    try:
        data = request.args.get('data')
        print(data)
        
        # 解码 Base64 字符串
        # decoded_bytes = base64.b64decode(base64_string)
        # decoded_string = decoded_bytes.decode('utf-8')
        
        # 将解码后的字符串转换为 Python 字典
        data = json.loads(data)
        
        print(data['code'])
        print(codes_answers[data['code_id']])
        
        if data['code'] == codes_answers[data['code_id']]:
            if data['data_type'] == 'people':
                print('已添加')
                mxz_pending_review_data[data['id']] = {'type':data['type'],'note':data['note']}
                codes_answers.pop(data['code_id']) #释放内存
                
            elif data['data_type'] == "dian":
                codes_answers.pop(data['code_id']) #释放内存
                return '还没做'
            
            return 'ok'
        else:
            return 'error'
    except:
        return 'error'

if __name__ == '__main__':
    app.run(host="0.0.0.0",port="8080")