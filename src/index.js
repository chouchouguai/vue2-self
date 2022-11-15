//项目入口文件
import {initMixin} from './init.js'
function Vue(options){
  // console.log('---100 -w 的作用 自动更新dist的vue')
  // console.log(options)
  //初始化
  this._init(options)
}
initMixin(Vue)//调用该方法会向Vue对象的原型链上添加_init方法
export default Vue