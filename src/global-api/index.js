import { mergeOptions } from "../utils/index"
/**
 * 
 * @param {*} Vue 
 *  源码中最终 Vue.options = {created:[a,b,c],watch:[a,b]}
 */
export function initGlobalApi(Vue){
   
    Vue.options = {}
    Vue.Mixin = function (mixin){//mixin为Vue.Mixin(的参数=mixin)
        // console.log('---mixin',mixin,this.options)
        //对象的合并
        this.options = mergeOptions(this.options,mixin)//this是当前vue实例,第一次this.options没值
       console.log('---initG',Vue.options);
       console.log('----Vue.$options',Vue);

    }
}