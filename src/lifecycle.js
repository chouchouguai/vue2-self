import watcher from "./observe/watcher";
import { patch } from "./vnode/patch";

/**
 * 
生命周期文件
 */
export function mounteComponent(vm,el){
    //源码--页面加载之前 调用beforeMounted
    callHook(vm,"beforeMounted");
    //part1中手动调用了更新页面方法-vm._update(vm._render())
    //vm._update(vm._render())//1)vm._render将render函数变成vnode 2)vm._update 将vnode变成真实dom 放到页面上 -本次操作即为页面加载
    //part2中 通过observe/watcher
    let updateComponent = ()=>{
        vm._update(vm._render())
    }
    //new watcher时调用了构造器，而构造器中默认调用了get(),get()又调用了传入的updateComponent -part2:这个watcher是用于渲染的 目前没有任何功能
    new watcher(vm,updateComponent,()=>{
        callHook(vm,'updated')//生命周期 updated的发布
    },true)
    callHook(vm,"mounted");

}
/**
 * 
 * @param {*} Vue 
 */
export function lifecycleMixin(Vue){
    Vue.prototype._update = function(vnode){//vnode => 真实的dom
        // console.log('---vnode',vnode)
        let vm = this;
        //参数 1）容器节点 2)vnode
        vm.$el = patch(vm.$el,vnode);//vue中的patch方法就是将虚拟dom->真实dom
    } 
}
//1)render()函数 ==》vnode ==》真实dom

//生命周期调用（订阅发布的模式）
export function callHook(vm,hook){
    // console.log('---',hook);
    const handles = vm.$options[hook]// 如hook为created, 则handles=[a,b,created]
    // console.log('---handles',handles);
    if(handles){
        for(let i=0;i<handles.length;i++){//性能最好的就是这种原始for
            handles[i].call(this);//改变生命周期中的this指向问题
        }
    }
}