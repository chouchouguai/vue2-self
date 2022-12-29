/**
 * <div id="app" >Hello {{msg}} </div>
 * render(){ //_c解析标签,_v解析文本,_s解析插值表达式
 *   return _c('div',{id:app},_v('hello'+_s(msg)),_c())
 * }
 * 本文件的主要任务就是获取render函数的字符串部分
 * 
 */
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;// 匹配默认 {{}}
/**
 * 处理属性ast中 {name:'style',value: "color:red;font-size: 20px"
 * return: {style:{color:'red',font-size: '20px'}}
 * */
function genProps(attrs) {
    let str = '';
    for (let i = 0; i < attrs.length; i++) {
        let attr = attrs[i];//{name:'style',value: "color:red;font-size: 20px"
        if (attr.name === 'style') {//获取是否是行内样式
            let obj = {};
            attr.value.split(';').forEach(item => {//["color:'red'"","font-size:'20px'"]
                let [key, value] = item.split(":");
                obj[key] = value;//obj[color]='red',obj['font-size']="20px"
            });
            attr.value = obj;
        }
        str += `${attr.name}:${JSON.stringify(attr.value)},`;//str+='style:"{color:red,font-size:20px}"'
    }
    return `{${str.slice(0, -1)}}`
}
//处理所有子节点们
/**
 * 
 * @param {*} el 
 * @returns 
 */
function genChildren(el) {
    let children = el.children;//children:[{type: 3, text: 'Hello {{msg}} '}]
    // console.log('---children', children)
    if (children) {
        return children.map(child => gen(child)).join(',')//_v('hello'),_v
    }
}
/**
 * 处理子节点
 * @param {*} node
 */
function gen(node) {
    if (node.type == 1) {//若是元素节点
        return generate(node)
    } else {//非元素节点，本处默认就是文本 1)普通文本 2）{{msg}}
        let text = node.text;//获取文本内容 hello {{msg}}
        if (!defaultTagRE.test(text)) {//检查文本中是否无插值表达式
            return `_v(${JSON.stringify(text)})`;//解析普通文本用_v()函数
        }
        //有{{}}
        let tokens = [];//存放每一段的代码
        let lastindex = defaultTagRE.lastIndex = 0;//若没有给lastIndex(下次匹配的起始位置)赋值，则defaultTagRE.test只能匹配一个字符串
        let match
        while (match = defaultTagRE.exec(text)) {//match=["{{msg}}"," msg  ",index:7,input:" hello {{ msg }} ",groups:undefined]
            let index = match.index;//当前符合正则的下标位置
            if (index > lastindex) {
                tokens.push(JSON.stringify(text.slice(lastindex, index)));//截取文本中(从0到{{ 的内容)--普通文本" hello "
            }
            // {{msg}}
            tokens.push(`_s(${match[1].trim()})`)
            //lastindex = 当前下标 + 表达式的长度 如 hello {{ msg }},haha
            lastindex = index + match[0].length;
            //
        }
        if (lastindex < text.length) {//{{msg}}后面还有 haha ,msg}}最后一个右括号的下标 < text文本的长度
            tokens.push(JSON.stringify(text.slice(lastindex)))//取出 haha
        }
        return `_v(${tokens.join("+")})`
    }
}

export function generate(el) {
    //注意属性 {id:app,style:{color:red;font-size:12px}}
    // console.log('---fennerate',el)
    let children = genChildren(el);
    //_c(根节点,参数对象||null,子节点||null,)
    let code = `_c('${el.tag}',${el.attrs.length ? `${genProps(el.attrs)}` : 'undefined'}${children ? `,${children}` : ''})`;
    // console.log('---code',code)
    return code;
}