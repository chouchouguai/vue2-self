/**
 * 
 * @param {*} oldVnode 原容器
 * @param {*} vnode 虚拟dom
 */
export function patch(oldVnode,vnode){
    // console.log(oldVnode,vnode)
    // vnode=>真实dom
    //1)创建新的DOM
    let el = createEl(vnode);
    // console.log('---真实domel',el);
    //2)替换 2.1）获取父节点 2.2）插入新dom 2.3）删除旧元素
    let parentEl = oldVnode.parentNode;// body
    parentEl.insertBefore(el,oldVnode.nextsibling);//在旧节点的下一个兄弟节点 插入新dom
    parentEl.removeChild(oldVnode);//删除旧元素
    return el;//返回新dom
}
//创建dom
function createEl(vnode){//vnode:{tag,text,data,children}---{tag: 'div', data: {…}, key: undefined, children: Array(2), text: undefined}
    let {tag,children,key,data,text} = vnode;
    if(typeof tag =='string'){//标签
        vnode.el = document.createElement(tag);
        //children->遍历子节点 继续创建dom
        if(children.length>0){
            children.forEach(child => {
                vnode.el.appendChild(createEl(child))
            });
        }
    }else{//文本
        vnode.el = document.createTextNode(text);
    }
    return vnode.el;//此时的el已经是真实dom
}
/**
 * vue 渲染流程：
 * 1） 数据初始化
 * 2） 对模版进行编译
 *     模版内容-> ast语法树->变成render函数
 *     ->render函数执行后得到vnode ->变成真实dom->放到页面
 *    
 */