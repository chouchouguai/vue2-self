(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, _typeof(obj);
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  /**
   * ps：ast语法树 (abstract syntax tree 抽象语法树)  vnode(虚拟节点)
   * 如：页面结构 <div id="#app">hello {{msg}}<span></span></div>
   * 对应ast为：
   * {
   * tag:'div',
   * attrs:[{id:'app'}],
   * children:[{tag:null,text:'hello'},{tag:'span'}]
   */
  function compileToFunction(el) {
    console.log('---compileToFunction', el);
  }

  /**重写数组中的方法
   * 类名.prototype ->指向原型对象,该对象中包含了所有实例共享的属性和方法
   * 对象.__proto__ ->指向该对象所属类的prototype 两个完全相等
   */

  //1.获取原数组中的方法
  var oldArrayProtoMethods = Array.prototype;
  //2.继承 ->通过指定原型对象 创建新对象ArrayMethods  ;ArrayMethods.__proto__ 指向oldArrayProtoMethods
  var ArrayMethods = Object.create(oldArrayProtoMethods);
  //3.列出所有需要劫持的方法
  var methods = ['push', 'pop', 'unshift', 'shift', 'pop'];
  methods.forEach(function (item) {
    ArrayMethods[item] = function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      // console.log('---劫持了数组方法item',this,args)//此时的args是个数组[],会将传入的内容放入该数组中s
      var result = oldArrayProtoMethods[item].apply(this, args);
      //1.此时要考虑数组追加数据的情况  如原arr = [1,2]
      //因为追加的数据可能是1)普通3==>[1,2,3]    2）对象 {a:1} ==>[1,2,{a:1}]
      //2.考虑追加的方式 push unshift splice
      var inserted; //追加的内容
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
      var obj = this.__ob__;
      if (inserted) {
        obj.observerArray(inserted); //因为args是数组 所以推荐使用observerArray
      }

      return result;
    };
  });

  //对外暴漏劫持对象方法
  function observer(data) {
    // console.log('---observer', data);
    if (_typeof(data) != 'object' || data == null) {
      return data; //若data不是对象 或者为null 则不需要劫持
    }
    //1.对象 通过一个类进行劫持
    return new Observer(data);
  }
  var Observer = /*#__PURE__*/function () {
    //vue2 通过defineProperty 缺点:只能对对象中的一个属性进行劫持
    function Observer(value) {
      _classCallCheck(this, Observer);
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
    _createClass(Observer, [{
      key: "walk",
      value: function walk(data) {
        var keys = Object.keys(data); //{a:{n:1},list:[1,2,3],arr:[{n:1,m:2}]} ->[a,list,arr]
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          var value = data[key];
          defineReactive(data, key, value); //对data中的属性取值和赋值时的操作和处理
        }
      }
      //遍历数组对象 进行劫持
    }, {
      key: "observerArray",
      value: function observerArray(value) {
        //value=[{a:1},{b:2}]
        console.log('--value', value, value.length);
        for (var i = 0; i < value.length; i++) {
          observer(value[i]); //单独劫持数组中的每个对象
        }
      }
    }]);
    return Observer;
  }(); //对对象中的属性进行拦截和处理
  function defineReactive(data, key, value) {
    observer(value); //对value进行递归 深度代理-> 最初的data可能是{a:{b:1}} 若value值依然是对象 则继续重复劫持该对象--直到值为普通数据
    Object.defineProperty(data, key, {
      get: function get() {
        //外部调用data.key时触发get方法
        console.log('--get');
        return value;
      },
      set: function set(newValue) {
        console.log('----set');
        if (newValue === value) return; //两次内容一样 不做处理
        observer(newValue); //修改的value也要代理（如 a:{b:1}===> a:{c:1}）,值{c:1}也需要被代理
        value = newValue; //否则将新值赋值给旧值
      }
    });
  }

  /**初始化数据的文件？ */
  function initState(vm) {
    var opts = vm.$options;
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
    var data = vm.$options.data;
    //获取data数据
    data = vm._data = typeof data == 'function' ? data.call(vm) : data; //1. 注意this 2.为了方便获取 将原option中data的值直接绑定到vm._data中
    //对数据进行劫持
    //将data上的所有属性代理到vm实例上
    for (var key in data) {
      //自定义函数proxy 
      proxy(vm, '_data', key);
    }
    observer(data); // 注意 此时拿到的data可能是以下情况 (1）对象  (2) 数组  {a:{n:1},list:[1,2,3],arr:[{n:1,m:2}]}    
  }
  //用于将代理 vm._data属性中的内容 全都直接放到vm中,key依然为原data中的key=> vm._data={a:1,b:2} 代理处理后为:vm.a=1 vm.b=2
  function proxy(vm, source, key) {
    Object.defineProperty(vm, key, {
      //定义vm中的key属性,vm.key时返回 vm._data.key的值
      get: function get() {
        return vm[source][key];
      },
      set: function set(newValue) {
        //vm.key=newValue时 相当于调用vm._data.key = newValue
        vm[source][key] = newValue;
      }
    });
  }

  function initMixin(Vue) {
    //_init方法放到Vue原型链上
    Vue.prototype._init = function (options) {
      // console.log('_initMixin中Vue原型链上的',options);
      var vm = this;
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
      var vm = this;
      el = document.querySelector(el); //根据id获取当前绑定的根节点-object
      console.log('---el', _typeof(el));
      var options = vm.$options;
      if (!options.render) {
        //new Vue的时候没有指定render函数
        var template = options.template;
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
