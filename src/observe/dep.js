//dep就是发布者
let id = 0;
class Dep{
    constructor(){
        this.id = id++;
        this.subs = [];//存储依赖列表
    }
    //收集watcher->添加依赖
    depend(){
        //希望watcher 可以存放 dep -双向记忆
        // this.subs.push(Dep.target)//Dep.target就是watcher
        Dep.target.addDep(this);//this 代表当前dep实例
    }
    addSub(watcher){
        this.subs.push(watcher);
    }
    //更新watcher ->通知更新
    notify(){
        this.subs.forEach(watcher=>{
            watcher.update()//执行watcher实例的getter()->_update(_render())//其实就是defineProperty中调用了几次set(修改了几个属性),执行几次更新
        })
    }
}
//添加watcher-->向Dep中添加 
Dep.target = null;
export function pushTarget(watcher){
    Dep.target = watcher;
    // console.log('---Dep.target',Dep.target)
}
//删除watcher
export function popTarget(){
    Dep.target = null;
    // console.log('---popTarget.target',Dep.target)
}
export default Dep;