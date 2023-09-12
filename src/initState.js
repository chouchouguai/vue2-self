
import { nextTick } from "./utils/nextTick"
import { observer } from "./observe/index"
import Watcher from "./observe/watcher"

/**初始化数据的文件 */
export function initState(vm){
  let opts = vm.$options
  // console.log('--opts',opts)
  if(opts.data){//注意一定要先初始化data 再初始化watch
    initData(vm)
  }
  if(opts.watch){
    initWatch(vm)
  }
  //判断
  if(opts.props){
    initProps(vm)
  }

  if(opts.computed){
    initComputed(vm)
  }
  if(opts.methods){
    initMethods(vm)
  }
}
function initProps(vm){
}
//part3:实现watch的第一步 -填充该方法
function initWatch(vm){
   //1. 获取watch
   let watch = vm.$options.watch;
   console.log('----initWatch',watch)
   //2. 遍历 --因为watch的写法 属性: 后面可以跟 1)函数   2）数组   3）对象    4）字符串
   for(let key in watch){
    //2.1 获取 属性对应的值 判断
    let handler = watch[key];//handler 可能是1)函数   2）数组   3）对象    4）字符串
    if(Array.isArray(handler)){//数组 (数组每一项都是方法)
      handler.forEach(item=>{
        createWatcher(vm,key,item)
      })
    }else{//3）对象    4）字符串  1)函数
    //3. 创建一个函数来处理
      createWatcher(vm,key,handler)
    }
   }
}

/**
 * 格式化处理 -处理好handler函数实际内容 再通过vm.$watch方法执行
 * @param {*} vm 
 * @param {*} exprOrfn //vm.$watch(()=>{return 'a'})//返回值“a”就是watch上的属性 也就是说 第二个参数 可能是属性名称，也可能是一个表达式（该表达式会返回属性名）
 * @param {*} handler 
 * @param {*} options  如：user=false
 */
function createWatcher(vm,exprOrfn,handler,options={}){
  //接initWatch
  //3.1 处理handler
  if(typeof handler ==='object'){ //{handler:function(){},deep:true}
    options = handler//用户的配置项目 {handler:function(){},deep:true}
    handler = handler.handler;
  }
  if(typeof handler ==='string'){//'aa' 是实例上的方法
    handler = vm[handler];//将实例上的方法作为handler  方法的代理和data一样
  }
  //其他是函数
  //watch 最终处理 通过$watch 这个方法 -该方法需要手动添加 (stateMixin()函数中)
  return vm.$watch(vm,exprOrfn,handler,options)

}
//part5 computed第一步 继续编写该方法
function initComputed(vm){
  let computed = vm.$options.computed;
  console.log('--initComputed',computed)
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
  observer(data)// 数据劫持！！！！  dep,watcher都在劫持的时候处理 注意 此时拿到的data可能是以下情况 (1）对象  (2) 数组  {a:{n:1},list:[1,2,3],arr:[{n:1,m:2}]}    
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





export function stateMixin(vm){
  //队列处理 1)是vue自己的nextTick()   2)用户自己函数cb
  vm.prototype.$nextTick = function (cb){
    nextTick(cb);//此时的nextTick就是utils/nextTick暴漏的方法
  },
  /**
   * 
   * @param {*} exprOrfn 属性
   * @param {*} handler 处理函数
   * @param {*} options 其他配置项
   */
  vm.prototype.$watch = function(vm,exprOrfn,handler,options={}){
    console.log(exprOrfn,handler,options)
    //实现watch 方法  利用new watcher -渲染的时候走渲染的watcher  $watch走watch的watcher-利用user false
    //watch 的核心就是watcher -完善watch的第一步
    let watcher =  new Watcher(
      vm,exprOrfn,handler,
      {...options,user:true}//注意最后的options合并 添加了user:true,代表此时watch是用户添加的属性，该合并在完善watch时再添加
      );
    console.log('----watcher',watcher)
    if(options.immediate){
      handler.call(vm)//如果有immediate 则立即执行handler函数
    }
  }
}
