from flask import Flask, render_template, request, redirect, url_for, jsonify

app = Flask(__name__)

# 示例历史数据（无需审核）
historical_data = {
    "1292466375": {"type": "超级无敌大帅哥", "note": "非常牛逼,他是本网站的作者"}
}

# 临时存储需要审核的数据
pending_review_data = {}

# 提交数据的API
@app.route('/submit_for_review', methods=['POST'])
def submit_for_review():
    global pending_review_data
    
    # 获取提交的数据
    id = request.form.get('id')
    type_value = request.form.get('type')
    note_value = request.form.get('note')

    if id and type_value and note_value:
        # 将数据添加到审核队列
        pending_review_data[id] = {"type": type_value, "note": note_value}
    
    return redirect(url_for('submit'))

# 渲染提交数据页面
@app.route('/submit', methods=['GET'])
def submit():
    return render_template('submit.html')

# 渲染审核页面的API
@app.route('/review', methods=['GET', 'POST'])
def review():
    global historical_data, pending_review_data
    
    if request.method == 'POST':
        # Check if the delete button was pressed
        delete_key = request.form.get('delete')
        if delete_key:
            # Remove the item from pending_review_data
            pending_review_data.pop(delete_key, None)
            return redirect(url_for('review'))

        # Get the reviewed data
        reviewed_data = request.form.to_dict(flat=False)
        print(reviewed_data)

        for key in pending_review_data.keys():
            type_key = f"{key}_type"
            note_key = f"{key}_note"

            if type_key in reviewed_data and note_key in reviewed_data:
                type_value = reviewed_data[type_key][0]
                note_value = reviewed_data[note_key][0]

                historical_data[key] = {"type": type_value, "note": note_value}

        # Clear pending_review_data after processing
        pending_review_data = {}
        return jsonify({"message": "数据审核并合并成功"})

    # Get pending review data and render the review page
    return render_template('review.html', data=pending_review_data)

# 返回最新的历史数据的API
@app.route('/latest_data', methods=['GET'])
def latest_data():
    return jsonify(historical_data)

if __name__ == '__main__':
    app.run(debug=True)
