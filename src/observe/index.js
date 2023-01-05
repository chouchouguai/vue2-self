/**需要劫持的类型分两种
 * 1) 对象: 利用Object.defineProperty 
 *    -缺点:只能对对象中的一个属性进行劫持
 *    -遍历:{a:1,b:2,c:3}   
 *    -递归:{a:{b:1}} get set
 * 2) 数组:方法函数劫持,重写数组方法 push unshift pop splice
 *    
 * **/
import {ArrayMethods} from './arr'
import Dep from './dep'
//对外暴漏劫持对象方法
export function observer(data) {
  // console.log('---observer', data);
  if (typeof data != 'object' || data == null) {
    return data; //若data不是对象 或者为null 则不需要劫持
  }
  //1.对象 通过一个类进行劫持
  return new Observer(data)
}
class Observer {
  //vue2 通过defineProperty 缺点:只能对对象中的一个属性进行劫持
  constructor(value) { //构造器
     /**给value上新增一个属性__obj__,值为Observer当前实例对象,
     * 这样在劫持的data中都会有一个不可枚举的属性__obj__,可枚举性决定了这个属性能否被for…in查找遍历到
     * 该属性直接指向当前observer实例对象（则可以直接使用observer实例上的方法）
     * **/
      Object.defineProperty(value,"__ob__",{
        enumerable:false,//不能枚举
        value:this
      })
      //给所有对象类型增加一个dep []
      this.dep = new Dep();//给observer实例对象添加dep -注意 1){} 2[] 不是给里面的属性添加dep

    if(Array.isArray(value)){//数组对象劫持方法
      value.__proto__ = ArrayMethods;
      //如果是数组对象 [{a:1},{b:2}]
      this.observerArray(value)
    }else{
      this.walk(value) //遍历非数组对象
    }
  }
  //遍历非数组对象 进行劫持
  walk(data) {
    let keys = Object.keys(data) //{a:{n:1},list:[1,2,3],arr:[{n:1,m:2}]} ->[a,list,arr]
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      let value = data[key];
      defineReactive(data, key, value); //对data中的属性取值和赋值时的操作和处理
    }
  }
  //遍历数组对象 进行劫持
  observerArray(value){//value=[{a:1},{b:2}]
    // console.log('--value',value,value.length)
    for(let i=0;i<value.length;i++){
      observer(value[i]);//单独劫持数组中的每个对象
    }
  }
}
//对对象中的属性进行拦截和处理
function defineReactive(data, key, value) {
  let childDep = observer(value); //对value进行递归 深度代理-> 最初的data可能是{a:{b:1}} 若value值依然是对象 则继续重复劫持该对象--直到值为普通数据
  // console.log('-childDep1',childDep)
  let dep = new Dep();//给每一个属性添加一个dep
  Object.defineProperty(data, key, {
    get() { //外部调用data.key时触发get方法  -此时需要收集依赖
      if(Dep.target){//此时target如果有 则是一个watcher,Dep.target是调用了new Watcher()时，构造器调用Watcher的get()添加的,get方法中,先给Dep.target赋值，再调用更新和渲染方法,再将Dep.target=null
        dep.depend();// 往dep的存储依赖列表subs中存入watcher  --原data中 watcher放dep & dep放watcher 如:data={arr:[1,2,3]}, 对arr对象添加dep(dep中有watcher,watcher中有dep)
        if(childDep.dep){//childDep.dep是调用 new Observer()时,构造器添加的(new Dep),dep刚new出来，dep只有id 和空数组subs
          childDep.dep.depend()//数组收集 -当前属性的dep 中添加watcher 如:data={arr:[1,2,3]}, 1 2 3 添加dep(dep中有watcher(通过subs),watcher中有dep(通过deps和depsId))
        }
        // console.log('-childDep',value,childDep)
      }
      // console.log('--get')
      // console.log('get Dep',dep);
      return value;
    },
    set(newValue) {
      // console.log('----set')
      if (newValue === value) return; //两次内容一样 不做处理
      observer(newValue)//修改的value也要代理（如 a:{b:1}===> a:{c:1}）,值{c:1}也需要被代理
      value = newValue; //否则将新值赋值给旧值
      dep.notify();//如果修改数据 则调用dep的更新方法，该方法会将subs中的每一个watcher进行更新（调用watcher.update,而update就是调用了watcher的getter,getter= new Watcher()时传入的updateComponent函数=vm._update(vm._render())）
    }
  })
}
