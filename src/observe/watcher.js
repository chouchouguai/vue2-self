//1)通过这个watcher类 实现更新 --订阅者
//new watcher(vm,updateComponent,()=>{},true)

import { popTarget, pushTarget } from "./dep";

//因为每个组件 都有一个watcher ,为了区分 则需要一个唯一标识 id
let id = 0;
class watcher{
    constructor(vm,updateComponent,cb,options){
        console.log('---watcher 构造器执行',id);
        //1)
        this.vm = vm;
        this.exprOrfn = updateComponent;
        this.cb= cb;
        this.options = options;
        this.id = id++;
        this.deps = [];//watcher 存放dep
        this.depsId = new Set();//存放depId
        //2)判断
        if(typeof updateComponent === 'function'){
            this.getter = updateComponent;//用来更新视图
        }
        //更新视图
        this.get()
    }
    //watcher放dep & dep放watcher
    addDep(dep){
        //1.去重
        let id = dep.id;
        if(!this.depsId.has(id)){
            this.deps.push(dep);
            this.depsId.add(id);
            //dep中放watcher
            dep.addSub(this);
        }
    }
    //初次渲染-获取对象的值
    get(){
        //添加watcher
        pushTarget(this);//this就是一个watcher实例 初次渲染(第一次调用vm._update(vm._render())之前，添加watcher
        /**
         * 渲染页面 调用传入的updateComponent 即为：vm._update(vm._render()),其中_s(msg),会调用vm.msg 即调用observe/index.js defineReactive中的get()方法,此时若data中有多个属性被调用，
         * 则都执行get方法之后才会执行后面的popTarget -->将Dep.target置为null
         * */
        this.getter();
        
        //初次渲染（第一次调用vm._update(vm._render())）之后 删除watcher
        popTarget();
    }
    //更新-对象的更新
    update(){
        this.getter();
    }
}
export default watcher

/**
 * 收集依赖
 * vue 
 * dep:就是data:{name,msg}中有多少个属性,则dep中有多少个 ，dep和data中的属性是一一对应的
 * watcher:就是data中的属性，在视图上用了几个,dep的subs中就有几个watcher  -（第一个版本中 同时修改两个属性，msg,name subs中的两个watcher是同一个 subs=[watcher0,watcher0]）
 * dep与watcher的关系： 1对多 dep.name = [w1,w2] (后面考虑computed 其实是多对多)
 */