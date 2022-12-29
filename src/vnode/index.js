
//将render函数变成vnode(虚拟节点)
export function renderMixin(Vue){
    /**
     * 标签解析
     */
    Vue.prototype._c = function(){
        //创建标签
        return createElement(...arguments);
    }
    /**
     * 文本解析
     */
     Vue.prototype._v = function(text){
        return createText(text)
    }
    /**
     * 变量解析 _s(name) -->{{name}}
     */
     Vue.prototype._s = function(val){
        // console.log('---_S',val);
        return val ==null?'':(typeof val ==='object')?JSON.stringify(val):val
    }
    Vue.prototype._render = function(){
        let vm = this;
        let render = vm.$options.render;//获取实例上的render(该render最终是ast语法树转换成的render函数)
        let vnode = render.call(this)//执行render函数,将当前vm实例作为render中的this
        // console.log('---vnode',vnode)
        return vnode;
    }
}
//创建元素的方法
/**
 * 
 * @param {*} tag 
 * @param {*} data 
 * @param  {...any} chiildren 
 */
function createElement(tag,data={},...children){
    return vnode(tag,data,data.key,children)
}
//创建文本
function createText(text){
    return vnode(undefined,undefined,undefined,undefined,text)
}
function vnode(tag,data,key,children,text){
    return {
        tag,data,key,children,text
    }
}
/**
 * vnode节点
 * {
 *  tag,
 * text,
 * chiildren
 * }
 */