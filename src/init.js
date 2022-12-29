//Vue所有初始化的内容
import { compileToFunction } from "./compile/index";
import { initState } from "./initState";
import { callHook, mounteComponent } from "./lifecycle";
import { mergeOptions } from "./utils/index";
export function initMixin(Vue){
  //_init方法放到Vue原型链上
  Vue.prototype._init = function(options){
    // console.log('_initMixin中Vue原型链上的',options);
    let vm = this
    // vm.$options = options//将参数帮到实例上
    vm.$options = mergeOptions(Vue.options,options);//将Vue上原有的option属性和本次传入的option合并 重新放到实例对象上
    callHook(vm,'beforeCreated');//初始化之前
    //初始化状态
    initState(vm);
    callHook(vm,'created');//初始化之后
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
    vm.$el = el;//将根节点绑定到vm实例的$el属性上
    // console.log('---el',typeof el);
    let options = vm.$options;
    if(!options.render){//new Vue的时候没有指定render函数
      let template = options.template;
      if(!template && el){//new Vue的时候没有指定模版，且存在根节点
        el = el.outerHTML; //string-[1]
        //获取到el的最终目的是为了变成render函数
        //将el--->ast语法树 ast语法树--->render函数
        let render = compileToFunction(el);
        // console.log('---render',render);
        //1) 将render 函数变成vnode
        //2) 将vnode变成真实DOM 放到页面上
        options.render = render;//将拿到的render函数放到实例对象options的render中
        //---todo 将虚拟的dom变为真实dom

      }

    }
    //挂载组件--调用生命周期文件中的挂载组件方法
    mounteComponent(vm,el)//vm._update(vm._render)
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
