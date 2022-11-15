import { observer } from "./observe/index"

/**初始化数据的文件？ */
export function initState(vm){
  let opts = vm.$options
  // console.log('--opts',opts)
  //判断
  if(opts.props){
    initProps()
  }
  if(opts.data){
    initData(vm)
  }
  if(opts.watch){
    initWatch()
  }
  if(opts.computed){
    initComputed()
  }
  if(opts.methods){
    initMethods()
  }
}
function initProps(){
}
function initWatch(){
}
function initComputed(){
}
function initMethods(){
}
//vue2 对data初始化
/**
 * data对象情况区分：--为了解决作用域问题
 * 1）根实例是对象 {}
 * 2) 组件是函数 (){} --是为了保证组件的独立性和可复用性
 */
function initData(vm){
  // console.log('---对data进行初始化',vm);
  let data = vm.$options.data;
  //获取data数据
  data = vm._data = typeof data =='function'?data.call(vm):data;//1. 注意this 2.为了方便获取 将原option中data的值直接绑定到vm._data中
  //对数据进行劫持
  //将data上的所有属性代理到vm实例上
  for(let key in data){
    //自定义函数proxy 
    proxy(vm,'_data',key)
  }
  observer(data)// 注意 此时拿到的data可能是以下情况 (1）对象  (2) 数组  {a:{n:1},list:[1,2,3],arr:[{n:1,m:2}]}    
}
//用于将代理 vm._data属性中的内容 全都直接放到vm中,key依然为原data中的key=> vm._data={a:1,b:2} 代理处理后为:vm.a=1 vm.b=2
function proxy(vm,source,key){
  Object.defineProperty(vm,key,{//定义vm中的key属性,vm.key时返回 vm._data.key的值
    get(){
      return vm[source][key]
    },
    set(newValue){//vm.key=newValue时 相当于调用vm._data.key = newValue
      vm[source][key] = newValue;
    }
  })
}
