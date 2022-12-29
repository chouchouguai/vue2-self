//项目入口文件
import { initGlobalApi } from './global-api/index.js'
import {initMixin} from './init.js'
import { lifecycleMixin } from './lifecycle.js'
import { renderMixin } from './vnode/index.js'
function Vue(options){//通过new Vue调用
  // console.log('---100 -w 的作用 自动更新dist的vue')
  // console.log(options)
  //初始化
  this._init(options)
}
initMixin(Vue)//调用该方法会向Vue对象的原型链上添加_init方法——对状态进行初始化
lifecycleMixin(Vue)//对生命周期进行初始化
renderMixin(Vue)//添加vm._render方法

//全局方法 vue.mixin Vue.component Vue.extend
initGlobalApi(Vue);//初始化全局方法
export default Vue

/**
 * new Vue(options) 
 *    ->调用当前vue实例的_init(options)
 *      (前提是在init.js中initMixin方法已定义了Vue.property._init方法
 *       Vue.property._init方法,调用mergeOptions(Vue.options,options),此处的options就是New Vue(options)的参数
 */