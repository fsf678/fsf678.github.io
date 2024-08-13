let code_id

function refreshCode() {
    fetch('http://127.0.0.1:5000/code')
        .then(response => response.json())
        .then(data => {
            // 获取 img 元素
            const imgElement = document.getElementById('code');

            if (imgElement) {
                // 设置 img 元素的 src 属性
                imgElement.src = `data:image/png;base64,${data.img}`;

                code_id = data.img_id;
            } else {
                console.error('No element with id "code" found');
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}
refreshCode();