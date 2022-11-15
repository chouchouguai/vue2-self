//Vue所有初始化的内容
import { compileToFunction } from "./compile/index";
import { initState } from "./initState";
export function initMixin(Vue){
  //_init方法放到Vue原型链上
  Vue.prototype._init = function(options){
    // console.log('_initMixin中Vue原型链上的',options);
    let vm = this
    vm.$options = options//将参数帮到实例上
    //初始化状态
    initState(vm)
    //渲染模版
    if(vm.$options.el){
      //调用vm实例的$mount方法--此方法需要定义
      vm.$mount(vm.$options.el)
    }
  }
  //创建$mount方法
  Vue.prototype.$mount = function(el){
    // console.log('---el',el)
    let vm = this;
    el = document.querySelector(el);//根据id获取当前绑定的根节点-object
    console.log('---el',typeof el);
    let options = vm.$options;
    if(!options.render){//new Vue的时候没有指定render函数
      let template = options.template;
      if(!template && el){//new Vue的时候没有指定模版，且存在根节点
        el = el.outerHTML; //string-[1]
        //获取到el的最终目的是为了变成render函数
        //将el变成ast语法树
        let ast = compileToFunction(el);
      }

    }
  }
}
/**
 * [1].获取到el之后要做的事情是
 *     1)变成ast语法树
 *     2)生成render()函数
 *     3)render函数变成虚拟dom
 *     4)
 
 * }
 */
