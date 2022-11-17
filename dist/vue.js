(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  /**
   * ps：ast语法树 (abstract syntax tree 抽象语法树)  vnode(虚拟节点)
   * 如：页面结构 <div id="#app">hello {{msg}}<span></span></div>
   * 对应ast为：
   * {
   * tag:'div',
   * attrs:[{id:'app'}],
   * children:[{tag:null,text:'hello'},{tag:'span'}]
   */
  /** 以下为vue2中区别标签相关的正则 */
  const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // 标签名称 ---如 div
  const qnameCapture = `((?:${ncname}\\:)?${ncname})`; // 如  <span:xx>
  const startTagOpen = new RegExp(`^<${qnameCapture}`); // 标签开头的正则 捕获的内容是标签名    如 <div

  const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // \s所有空白符，包括换行 id="app"
  const startTagClose = /^\s*(\/?)>/; // 匹配标签结束的 >   ps: startTagOpen + attribute + startTagClose = "<div id="app" >

  /**
   * 
   * @param {*} html - 本次需要转换的html
   */
  function parseHTML(html) {
    // html中包含的内容只有3大类型:开始标签  文本  结束标签
    /** 思路 每次解析结束完成部分的html 删除 */
    while (html) {
      // html 为空结束
      // 判断标签
      let textEnd = html.indexOf('<');
      if (textEnd === 0) {
        // html以 < 开头 说明是标签
        // 1.看是否是开始标签，与开始标签的正则startTagOpen 匹配
        const startTagMatch = parseStartTag(); //  开始标签的内容-该方法需要定义
        console.log('----startTagMatch', startTagMatch);
        continue;
      }
      // 文本
      // 说明html 不是< 开头 如： hello</div> ,这个textEnd就是5
      if (textEnd > 0) {
        //  解析文本
        //  获取文本内容 ---方案:// hello</div> 截取< 符号之前的内容(其实就是hello)
        //  console.log('----textEnd',textEnd)
        let text = html.slice(0, textEnd);
        console.log('----text', text);
      }
      break;
    }
    function parseStartTag() {
      // 子表达式指:正则表达式中用小括号包起来的表达式
      /** match(正则表达式),若正则表达式没有全局标识/g,
      *   则该match方法只执行一次匹配，
      *   返回[匹配文本,与子表达式匹配的文本们...,index:匹配开始位置,input:进行匹配的字符串本身的引用] 
      *   若无结果 返回null*/
      const start = html.match(startTagOpen);
      // start = ['<div', 'div', index: 0, input: "<div id='#app'>hello {{msg}}<span></span></div>", groups: undefined]
      // 创建ast 语法树-初级形态
      let match = {
        tagName: start[1],
        attrs: []
      };
      advance(start[0].length); // 向前推进一步 (删除开始标签)
      // 获取属性 -注意 属性可能有多个 需要遍历
      let attr;
      /*
        注意 刚才删除了开始标签 但是开始标签还有个 >  
        比如第一次删除了开始标签<div  剩余 id='#app'> hello {{msg}} <span></span></div>
      */
      let end;
      /* 
        循环剩下的html -若剩余的html 不是单纯的> (html.match(startTagClose) 为true则表示仅为>) 
        并且有属性(html.match(attribute)为true表示有属性内容)
      */
      // console.log('---->',html.match(startTagClose))
      // console.log('----attribute',html.match(attribute))
      while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
        // 将属性追加到match的attrs中 [{name:'id',value:'app'}]
        match.attrs.push({
          name: attr[1],
          value: attr[3] || atrr[4] || atrr[5]
        });
        advance(attr[0].length);
      }
      if (end) {
        advance(end[0].length);
        return match; // <div id='app'> 解析完成 返回开始节点对应的ast初级形态语法树
      }
    }

    function advance(n) {
      // 删除以及识别出的html字符串 （如 识别了<div 则删除<div,n为识别出的字符串的长度）
      html = html.substring(n); // 从html的n位置开始截取到最后,返回截取后的内容---删除了识别出的内容
      console.log('---advance', html);
    }
  }
  function compileToFunction(el) {
    console.log('---compileToFunction', el);
    parseHTML(el);
  }

  /**重写数组中的方法
   * 类名.prototype ->指向原型对象,该对象中包含了所有实例共享的属性和方法
   * 对象.__proto__ ->指向该对象所属类的prototype 两个完全相等
   */

  //1.获取原数组中的方法
  let oldArrayProtoMethods = Array.prototype;
  //2.继承 ->通过指定原型对象 创建新对象ArrayMethods  ;ArrayMethods.__proto__ 指向oldArrayProtoMethods
  let ArrayMethods = Object.create(oldArrayProtoMethods);
  //3.列出所有需要劫持的方法
  let methods = ['push', 'pop', 'unshift', 'shift', 'pop'];
  methods.forEach(item => {
    ArrayMethods[item] = function (...args) {
      // console.log('---劫持了数组方法item',this,args)//此时的args是个数组[],会将传入的内容放入该数组中s
      let result = oldArrayProtoMethods[item].apply(this, args);
      //1.此时要考虑数组追加数据的情况  如原arr = [1,2]
      //因为追加的数据可能是1)普通3==>[1,2,3]    2）对象 {a:1} ==>[1,2,{a:1}]
      //2.考虑追加的方式 push unshift splice
      let inserted; //追加的内容
      switch (item) {
        case 'push':
        case 'unshift':
          inserted = args;
          break;
        case 'splice':
          inserted = args.splice(2); // arr.splice(开始位置,删除长度,追加内容)
          break;
      }
      /*对追加的内容进行劫持observer(inserted)
        但是因为observer方法在./index.js中,此处无法获取(别在此处引入index.js,因为index.js引入了当前文件，会造成互相引用)
        可以考虑将observer方法绑定在当前实例对象的某个属性上 这样当前对象可以直接使用
        先在此处打印下this--》看看this指向谁 -通过打印得知,this指向当前数组对象 list
      */
      // console.log('---this',this)
      let obj = this.__ob__;
      if (inserted) {
        obj.observerArray(inserted); //因为args是数组 所以推荐使用observerArray
      }

      return result;
    };
  });

  /**需要劫持的类型分两种
   * 1) 对象: 利用Object.defineProperty 
   *    -缺点:只能对对象中的一个属性进行劫持
   *    -遍历:{a:1,b:2,c:3}   
   *    -递归:{a:{b:1}} get set
   * 2) 数组:方法函数劫持,重写数组方法 push unshift pop splice
   *    
   * **/
  //对外暴漏劫持对象方法
  function observer(data) {
    // console.log('---observer', data);
    if (typeof data != 'object' || data == null) {
      return data; //若data不是对象 或者为null 则不需要劫持
    }
    //1.对象 通过一个类进行劫持
    return new Observer(data);
  }
  class Observer {
    //vue2 通过defineProperty 缺点:只能对对象中的一个属性进行劫持
    constructor(value) {
      //构造器
      if (Array.isArray(value)) {
        //数组对象劫持方法
        value.__proto__ = ArrayMethods;
        //如果是数组对象 [{a:1},{b:2}]
        this.observerArray(value);
      } else {
        this.walk(value); //遍历非数组对象
      }
      /**给value上新增一个属性__obj__,值为Observer当前实例对象,
       * 这样在劫持的data中都会有一个不可枚举的属性__obj__,可枚举性决定了这个属性能否被for…in查找遍历到
       * 该属性直接指向当前observer实例对象（则可以直接使用observer实例上的方法）
       * **/
      Object.defineProperty(value, "__ob__", {
        enumerable: false,
        value: this
      });
    }
    //遍历非数组对象 进行劫持
    walk(data) {
      let keys = Object.keys(data); //{a:{n:1},list:[1,2,3],arr:[{n:1,m:2}]} ->[a,list,arr]
      for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let value = data[key];
        defineReactive(data, key, value); //对data中的属性取值和赋值时的操作和处理
      }
    }
    //遍历数组对象 进行劫持
    observerArray(value) {
      //value=[{a:1},{b:2}]
      console.log('--value', value, value.length);
      for (let i = 0; i < value.length; i++) {
        observer(value[i]); //单独劫持数组中的每个对象
      }
    }
  }
  //对对象中的属性进行拦截和处理
  function defineReactive(data, key, value) {
    observer(value); //对value进行递归 深度代理-> 最初的data可能是{a:{b:1}} 若value值依然是对象 则继续重复劫持该对象--直到值为普通数据
    Object.defineProperty(data, key, {
      get() {
        //外部调用data.key时触发get方法
        console.log('--get');
        return value;
      },
      set(newValue) {
        console.log('----set');
        if (newValue === value) return; //两次内容一样 不做处理
        observer(newValue); //修改的value也要代理（如 a:{b:1}===> a:{c:1}）,值{c:1}也需要被代理
        value = newValue; //否则将新值赋值给旧值
      }
    });
  }

  /**初始化数据的文件？ */
  function initState(vm) {
    let opts = vm.$options;
    // console.log('--opts',opts)
    //判断
    if (opts.props) ;
    if (opts.data) {
      initData(vm);
    }
    if (opts.watch) ;
    if (opts.computed) ;
    if (opts.methods) ;
  }
  //vue2 对data初始化
  /**
   * data对象情况区分：--为了解决作用域问题
   * 1）根实例是对象 {}
   * 2) 组件是函数 (){} --是为了保证组件的独立性和可复用性
   */
  function initData(vm) {
    // console.log('---对data进行初始化',vm);
    let data = vm.$options.data;
    //获取data数据
    data = vm._data = typeof data == 'function' ? data.call(vm) : data; //1. 注意this 2.为了方便获取 将原option中data的值直接绑定到vm._data中
    //对数据进行劫持
    //将data上的所有属性代理到vm实例上
    for (let key in data) {
      //自定义函数proxy 
      proxy(vm, '_data', key);
    }
    observer(data); // 注意 此时拿到的data可能是以下情况 (1）对象  (2) 数组  {a:{n:1},list:[1,2,3],arr:[{n:1,m:2}]}    
  }
  //用于将代理 vm._data属性中的内容 全都直接放到vm中,key依然为原data中的key=> vm._data={a:1,b:2} 代理处理后为:vm.a=1 vm.b=2
  function proxy(vm, source, key) {
    Object.defineProperty(vm, key, {
      //定义vm中的key属性,vm.key时返回 vm._data.key的值
      get() {
        return vm[source][key];
      },
      set(newValue) {
        //vm.key=newValue时 相当于调用vm._data.key = newValue
        vm[source][key] = newValue;
      }
    });
  }

  //Vue所有初始化的内容
  function initMixin(Vue) {
    //_init方法放到Vue原型链上
    Vue.prototype._init = function (options) {
      // console.log('_initMixin中Vue原型链上的',options);
      let vm = this;
      vm.$options = options; //将参数帮到实例上
      //初始化状态
      initState(vm);
      //渲染模版
      if (vm.$options.el) {
        //调用vm实例的$mount方法--此方法需要定义
        vm.$mount(vm.$options.el);
      }
    };
    //创建$mount方法
    Vue.prototype.$mount = function (el) {
      // console.log('---el',el)
      let vm = this;
      el = document.querySelector(el); //根据id获取当前绑定的根节点-object
      console.log('---el', typeof el);
      let options = vm.$options;
      if (!options.render) {
        //new Vue的时候没有指定render函数
        let template = options.template;
        if (!template && el) {
          //new Vue的时候没有指定模版，且存在根节点
          el = el.outerHTML; //string-[1]
          //获取到el的最终目的是为了变成render函数
          //将el变成ast语法树
          compileToFunction(el);
        }
      }
    };
  }
  /**
   * [1].获取到el之后要做的事情是
   *     1)变成ast语法树
   *     2)生成render()函数
   *     3)render函数变成虚拟dom
   *     4)
   
   * }
   */

  //项目入口文件
  function Vue(options) {
    // console.log('---100 -w 的作用 自动更新dist的vue')
    // console.log(options)
    //初始化
    this._init(options);
  }
  initMixin(Vue); //调用该方法会向Vue对象的原型链上添加_init方法

  return Vue;

}));
//# sourceMappingURL=vue.js.map
