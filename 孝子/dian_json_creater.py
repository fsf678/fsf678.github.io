import json
dians = json.loads(input())['data']
while (True):
    dian = input()
    if (dian == 'exit'):
        break;
    dians.append(dian)
dic = {'data':dians}
dic = json.dumps(dic)
print(str(dic))