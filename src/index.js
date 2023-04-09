//项目入口文件
import { compileToFunction } from './compile/index.js'
import { initGlobalApi } from './global-api/index.js'
import {initMixin} from './init.js'
import { stateMixin } from './initState.js'
import { lifecycleMixin } from './lifecycle.js'
import { renderMixin } from './vnode/index.js'
import {createEl} from './vnode/patch'//part4 diff时引入
function Vue(options){//通过new Vue调用
  // console.log('---100 -w 的作用 自动更新dist的vue')
  // console.log(options)
  //初始化
  this._init(options)
}
initMixin(Vue)//调用该方法会向Vue对象的原型链上添加_init方法——对状态进行初始化
lifecycleMixin(Vue)//对生命周期进行初始化
renderMixin(Vue)//添加vm._render方法
stateMixin(Vue)//给vm添加$nextTick

//全局方法 vue.mixin Vue.component Vue.extend
initGlobalApi(Vue);//初始化全局方法

//-----part4 diff start-----
// part4.1 不比较子节点内容时的模版 -div
// let vm1 = new Vue(({data:{name:'张三'}}));//创建vue实例对象
// let render1 = compileToFunction(`<div id="a" style="color:red;font-size:80px"></div>`);//将真实dom的字符串形式转成render函数
// let vnode1 = render1.call(vm1);//利用render函数 解析vue实例对象中的数据 生成虚拟dom
// document.body.appendChild(createEl(vnode1))//虚拟dom ->真实dom  将真实dom追加到body中

// //数据更新
// let vm2 = new Vue(({data:{name:'李四'}}));//创建vue实例对象
// let render2 = compileToFunction(`<div id="b" style="color:blue">{{name}}<div>我还有想说的问题呢</div></div>`);//将真实dom的字符串形式转成render函数 ---part4发现compileToFunction有问题 去改动
// let vnode2 = render2.call(vm2);//利用render函数 解析vue实例对象中的数据 生成虚拟dom
// document.body.appendChild(createEl(vnode2))//虚拟dom ->真实dom  将真实dom追加到body中

// // part4.2 比较子节点内容时的模版-ul+li
// let vm1 = new Vue(({data:{name:'张三'}}));//创建vue实例对象
// let render1 = compileToFunction(`
//   <ul>
//     <li key="a" style="background:red">a</li>
//     <li key="b" style="background:green">b</li>
//     <li key="c" style="background:blue">c</li>
//   </ul>
// `);//将真实dom的字符串形式转成render函数
// let vnode1 = render1.call(vm1);//利用render函数 解析vue实例对象中的数据 生成虚拟dom
// document.body.appendChild(createEl(vnode1))//虚拟dom ->真实dom  将真实dom追加到body中

// //数据更新
// let vm2 = new Vue(({data:{name:'李四'}}));//创建vue实例对象
// let render2 = compileToFunction(`
//   <ul>
//     <li key="d" style="background:red">d</li>
//     <li key="e" style="background:green">e</li>
//     <li key="f" style="background:blue">f</li>
//   </ul>
// `);
// let vnode2 = render2.call(vm2);//利用render函数 解析vue实例对象中的数据 生成虚拟dom
// document.body.appendChild(createEl(vnode2))//虚拟dom ->真实dom  将真实dom追加到body中
// // patch比对
// setTimeout(()=>{
//   patch(vnode1,vnode2)
// },1000)

//-----part4 diff end-------
export default Vue

/**
 * new Vue(options) 
 *    ->调用当前vue实例的_init(options)
 *      (前提是在init.js中initMixin方法已定义了Vue.property._init方法
 *       Vue.property._init方法,调用mergeOptions(Vue.options,options),此处的options就是New Vue(options)的参数
 */