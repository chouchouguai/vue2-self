(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('@babel/core/lib/gensync-utils/fs'), require('@vue/compiler-core'), require('@vue/shared')) :
    typeof define === 'function' && define.amd ? define(['@babel/core/lib/gensync-utils/fs', '@vue/compiler-core', '@vue/shared'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

    //对象合并
    const HOOKS = ["beforeCreate", "created", "beforeMount", "mounted", "beforeUpdate", "updated", "beforeDestory", "destoryed"];
    //策略模式 -一般如果判断if情况比较多 可以用该模式
    let starts = {};
    //处理数据
    starts.data = function (parentVal, childVal) {
      return childVal;
    }; //合并data
    starts.computed = function () {}; //合并computed
    starts.watch = function () {}; //合并watch
    starts.methods = function () {}; //合并methods
    //遍历生命周期，依次添加starts[beforeCreate],starts[created]。。等
    HOOKS.forEach(hooks => {
      starts[hooks] = mergeHook;
    });
    function mergeHook(parentVal, childVal) {
      // {created:[a,b,c],watch:[a,b]}
      if (childVal) {
        if (parentVal) {
          return parentVal.concat(childVal);
        } else {
          return [childVal]; //[a]
        }
      } else {
        return parentVal;
      }
    }
    /**
     * 
     * @param {*} parent 
     * @param {*} child  Vue.Mixin(参数),参数就是child
     * @returns 
     */
    function mergeOptions(parent, child) {
      console.log('---mergeOptions', parent, child);
      //Vue.options = {created:[a,b,c],watch:[a,b]}
      const options = {};
      //如果有parent 没有 child
      for (let key in parent) {
        mergeField(key);
      }
      //有child 没有 parent
      for (let key in child) {
        //child就是传过来的mixin 第一次child={created:function a(){}}
        mergeField(key);
      }
      function mergeField(key) {
        //根据key 策略模式
        if (starts[key]) {
          //若存在该方法
          options[key] = starts[key](parent[key], child[key]);
        } else {
          options[key] = child[key];
        }
      }
      // console.log('---optiosns',options)
      return options;
    }

    /**
     * 
     * @param {*} Vue 
     *  源码中最终 Vue.options = {created:[a,b,c],watch:[a,b]}
     */
    function initGlobalApi(Vue) {
      Vue.options = {};
      Vue.Mixin = function (mixin) {
        //mixin为Vue.Mixin(的参数=mixin)
        // console.log('---mixin',mixin,this.options)
        //对象的合并
        this.options = mergeOptions(this.options, mixin); //this是当前vue实例,第一次this.options没值
        console.log('---initG', Vue.options);
        console.log('----Vue.$options', Vue);
      };
    }

    /**
     * <div id="app" >Hello {{msg}} </div>
     * render(){ //_c解析标签,_v解析文本,_s解析插值表达式
     *   return _c('div',{id:app},_v('hello'+_s(msg)),_c())
     * }
     * 本文件的主要任务就是获取render函数的字符串部分
     * 
     */
    const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // 匹配默认 {{}}
    /**
     * 处理属性ast中 {name:'style',value: "color:red;font-size: 20px"
     * return: {style:{color:'red',font-size: '20px'}}
     * */
    function genProps(attrs) {
      let str = '';
      for (let i = 0; i < attrs.length; i++) {
        let attr = attrs[i]; //{name:'style',value: "color:red;font-size: 20px"
        if (attr.name === 'style') {
          //获取是否是行内样式
          let obj = {};
          attr.value.split(';').forEach(item => {
            //["color:'red'"","font-size:'20px'"]
            let [key, value] = item.split(":");
            obj[key] = value; //obj[color]='red',obj['font-size']="20px"
          });

          attr.value = obj;
        }
        str += `${attr.name}:${JSON.stringify(attr.value)},`; //str+='style:"{color:red,font-size:20px}"'
      }

      return `{${str.slice(0, -1)}}`;
    }
    //处理所有子节点们
    /**
     * 
     * @param {*} el 
     * @returns 
     */
    function genChildren(el) {
      let children = el.children; //children:[{type: 3, text: 'Hello {{msg}} '}]
      // console.log('---children', children)
      if (children) {
        return children.map(child => gen(child)).join(','); //_v('hello'),_v
      }
    }
    /**
     * 处理子节点
     * @param {*} node
     */
    function gen(node) {
      if (node.type == 1) {
        //若是元素节点
        return generate(node);
      } else {
        //非元素节点，本处默认就是文本 1)普通文本 2）{{msg}}
        let text = node.text; //获取文本内容 hello {{msg}}
        if (!defaultTagRE.test(text)) {
          //检查文本中是否无插值表达式
          return `_v(${JSON.stringify(text)})`; //解析普通文本用_v()函数
        }
        //有{{}}
        let tokens = []; //存放每一段的代码
        let lastindex = defaultTagRE.lastIndex = 0; //若没有给lastIndex(下次匹配的起始位置)赋值，则defaultTagRE.test只能匹配一个字符串
        let match;
        while (match = defaultTagRE.exec(text)) {
          //match=["{{msg}}"," msg  ",index:7,input:" hello {{ msg }} ",groups:undefined]
          let index = match.index; //当前符合正则的下标位置
          if (index > lastindex) {
            tokens.push(JSON.stringify(text.slice(lastindex, index))); //截取文本中(从0到{{ 的内容)--普通文本" hello "
          }
          // {{msg}}
          tokens.push(`_s(${match[1].trim()})`);
          //lastindex = 当前下标 + 表达式的长度 如 hello {{ msg }},haha
          lastindex = index + match[0].length;
          //
        }

        if (lastindex < text.length) {
          //{{msg}}后面还有 haha ,msg}}最后一个右括号的下标 < text文本的长度
          tokens.push(JSON.stringify(text.slice(lastindex))); //取出 haha
        }

        return `_v(${tokens.join("+")})`;
      }
    }
    function generate(el) {
      //注意属性 {id:app,style:{color:red;font-size:12px}}
      // console.log('---fennerate',el)
      let children = genChildren(el);
      //_c(根节点,参数对象||null,子节点||null,)
      let code = `_c('${el.tag}',${el.attrs.length ? `${genProps(el.attrs)}` : 'undefined'}${children ? `,${children}` : ''})`;
      // console.log('---code',code)
      return code;
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

    /** 以下为vue2中区别标签相关的正则 */
    const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // 标签名称 ---如 div
    const qnameCapture = `((?:${ncname}\\:)?${ncname})`; // 如  <span:xx>
    const startTagOpen = new RegExp(`^<${qnameCapture}`); // 标签开头的正则 捕获的内容是标签名    如 <div

    const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // \s所有空白符，包括换行 id="app"
    const startTagClose = /^\s*(\/?)>/; // 匹配标签结束的 >   ps: startTagOpen + attribute + startTagClose = "<div id="app" >
    const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配标签结尾 </div>
    // 将str -> ast
    // 遍历
    /*
    如： <div id="app"> hello {{msg}} <h1></h1> </div>
    创建一个 ast 对象
    根据标签名和参数 返回一个ast对象 {}
    nodetype的类型
    1:元素节点
    2:属性节点
    3:文本节点
    */

    function createASTElement(tag, attrs) {
      return {
        tag,
        //元素 div span h等
        attrs,
        //属性 id class 等
        children: [],
        //子节点 如div 中包含了span 则span就是自己点
        type: 1,
        //nodetype的类型
        parent: null //该元素的父元素
      };
    }

    let root; //根元素
    let createParent; //当前元素的父元素
    //数据结构 栈:先进后出
    let stack = []; //[div]

    // 开始标签 <div id='app'>
    /**
     * 
     * @param {*} tag 
     * @param {*} attrs 
     * 将开始标签转为ast对象，并入栈 (注:end方法中 会将其出栈)
     */
    function start(tag, attrs) {
      /**传入标签名 和 参数  */
      let element = createASTElement(tag, attrs);
      if (!root) {
        root = element;
      }
      createParent = element;
      stack.push(element);
    }
    // 获取文本 {{msg}}
    function charts(text) {
      //    console.log('文本', text)
      //替换 空格
      text = text.replace(/\s/g, ''); //
      if (text) {
        createParent.children.push({
          type: 3,
          //文本类型
          text //文本内容
        });
      }
    }
    // 结束标签 </div>
    /**
     * 
     * @param {*} tag 
     * 从stack中 取出最后进的元素,以及读取前一个元素 将两个元素的父子关系分别用属性parent 和childern关联起来
     */
    function end(tag) {
      //    console.log('---结束标签end', tag)
      //如此时<div><h></h></div  stack中有两个元素 [div,h]
      let element = stack.pop(); //取出栈中第一个元素 栈后进先出 pop取的就是最后进的那个 h
      createParent = stack[stack.length - 1]; //此时取出的是栈中最后进的前一个 div
      if (createParent) {
        //元素的闭合
        element.parent = createParent.tag; //{tag:h,attrs:null,type:1,parent:'div'} 
        createParent.children.push(element); //{tag:div,attrs:[{id:'app'}],type:1,children:[{tag:h,attrs:null,type:1}]}
      }
    }

    /**
     * 
     * @param {*} html - 本次需要转换的html
     * step1:
     * 该方法是将html字符串 ->初级形态的ast
     * 经过该方法后 开始标签 <div id="app"> --->  {tagName:'div',attrs:[{name:'id',value:'app'}]}
     *            文本    hello {{msg}}   --->  hello {{msg}}
     *            结束标签  </div>         --->  ['</div>', 'div', index: 0, input: '</div>', groups: undefined]
     * return :当前html的ast表示对象 (其中用parent 和 childern表示了节点间的包含关系)
     */
    function parseHTML(html) {
      // html中包含的内容只有3大类型:开始标签  文本  结束标签
      // 如: <div id="app"> hello {{msg}} <h></h> </div> 
      /** 思路 每次解析结束完成部分的html 删除 */
      while (html) {
        // html 为空结束
        // 判断标签
        let textEnd = html.indexOf('<');
        if (textEnd === 0) {
          // html以 < 开头 说明是标签
          // 1.看是否是开始标签，与开始标签的正则startTagOpen 匹配
          const startTagMatch = parseStartTag(); //  开始标签的内容-该方法是单独定义的
          // console.log('----startTagMatch',startTagMatch)
          if (startTagMatch) {
            start(startTagMatch.tagName, startTagMatch.attrs); //---开始标签的处理，根据标签名称和参数,创建root对象，当前节点对象,转为ast对象并入栈
            continue;
          }
          //结束标签 ->若为结束标签</标签名>
          let endTagMatch = html.match(endTag); //从html中匹配结束标记的正则(endTag),得到与正则匹配的文本内容
          //    console.log('---enTagMatch',endTagMatch)
          if (endTagMatch) {
            //若存在结束标签 
            advance(endTagMatch[0].length);
            end(endTagMatch[1]); //到结束标签了 则将当前节点和其父节点关联起来,并放到root对象中去
            continue;
          }
        }
        // 文本
        // 说明html 不是< 开头 如： hello</div> ,这个textEnd就是5
        let text;
        if (textEnd > 0) {
          //  解析文本
          //  获取文本内容 ---方案:// hello</div> 截取< 符号之前的内容(其实就是hello)
          //  console.log('----textEnd',textEnd)
          text = html.slice(0, textEnd);
          //  console.log('---parseHTML',text);
        }

        if (text) {
          advance(text.length);
          charts(text); //将文本内容放入到root对象中
        }
        // break;
      }
      /**
       * 解析开始标签
       * @returns 
       * {
       *  tagName:div
       *  attrs:[
       *    {
       *      name:"id",
       *      value:"app"
       *    }
       * ]
       * }
       */
      function parseStartTag() {
        // 子表达式指:正则表达式中用小括号包起来的表达式
        /** match(正则表达式),若正则表达式没有全局标识/g,
        *   则该match方法只执行一次匹配，
        *   返回[匹配文本,与子表达式匹配的文本们...,index:匹配开始位置,input:进行匹配的字符串本身的引用] 
        *   若无结果 返回null*/
        const start = html.match(startTagOpen);
        // start = ['<div', 'div', index: 0, input: "<div id='#app'>hello {{msg}}<span></span></div>", groups: undefined]
        if (start) {
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
          //console.log('----attribute',html.match(attribute))//[' id="app"', 'id', '=', 'app', undefined, undefined, index: 0, input: ' id="app">\n    Hello {{name}}\n  </div>', groups: undefined]
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
      }

      function advance(n) {
        // 删除以及识别出的html字符串 （如 识别了<div 则删除<div,n为识别出的字符串的长度）
        html = html.substring(n); // 从html的n位置开始截取到最后,返回截取后的内容---删除了识别出的内容
      }
      //  console.log('---root',root)
      return root;
    }

    /**
     * 版本1综合描述：
     * * 如：页面结构 <div id="#app">hello {{msg}}<h1></h1></div>
    * 最终需要获取内容为：
    * {
    * tag:'div',
    * attrs:[{id:'app'}],
    * children:[{tag:null,text:'hello'},{tag:'span'}]
    * 
     * 根据文本内容字符串<div id="#app">hello {{msg}}<h1></h1></div>
     * 分析:该字符串中只有3部分内容: 标签 <div> 
     *                           文本 hello {{msg}}
     *                           标签 <h1> (跟div有父子关系)
     * 解析入口:parseHTML(html)
     * 只要html有内容,则一直循环
       * 1) 若html 是以< 开头,则表示是标签(此时需要考虑 是<div> 还是</div>)-->
       *     1.1)调用parseStartTag方法
           *     1.1.1) 若是<div>(开始标签)
           *        1.1.1.1)找到符合开始标签的正则(startTagOpen) <标签名 属性="值"
           *        1.1.1.2）创建对象match = {tagName:值,attrs:[]},并删除html 中 “<标签名”部分
           *        1.1.1.3）找到不符合标签结尾(不是>),且符合参数正则的部分(其实就是标签参数),遍历创建对象,放入到match的attrs中,并删除字符串中的 attr="值"部分
           *               得到 match={tagName:值,attrs:[{name:参数名,value:参数值}]}
           *        1.1.1.4）若找到标签结尾(">"这个字符串),则直接删除字符串中的“>”部分,并返回 match字段
           *   1.2）若parseStartTag返回了内容(即match有内容),
           *     1.2.1)则根据match的内容,创建ast对象-->start方法     
           *       1.2.1.1） 创建ast对象 
           *            {
                               tag,//元素 div span h等
                               attrs,//属性 id class 等
                               children:[],//子节点 如div 中包含了span 则span就是自己点
                               type:1,//nodetype的类型
                               parent:null//该元素的父元素
                           }
                   1.2.1.2） 若此时还没有root对象，则该ast对象为root对象
                   1.2.1.3） 当前父节点 createParent,也为该ast对象
                   1.2.1.4） 将该对象放入到ast对象栈 stack中
               1.2.2） 继续下一轮循环,回到1)
               1.3) 若parseStartTag没有返回内容,html匹配结束标签正则(</div>这种符合结束标签的字符串)
               1.3.1）若匹配到结束标签
                   1.3.1.1)删除html字符串中“</div>”部分
                   1.3.1.2）将当前节点的ast与父节点关联起来，--调用end()
                   1.3.1.2.1）从stack栈中取出最后一个放入的ast对象(取出栈中就不存在该对象了),element
                   1.3.1.2.2) 获取stack中倒数第二个放入的ast对象createParent,若createParent存在,
                           则element.parent为createParent.tag;
                           createParent.children.push(element)
           2) 若此时的html不是以<开头，则表示是文本部分
           2.1）截取html中普通文本内容text
           2.2) 若text有内容
                   2.2.1）删除html中 字符串部分如“hello {{msg}}”
                   2.2.2) 将文本内容放入root中 charts()
                   2.2.2.1) 替换text中的空字符串
                   2.2.2.2）若替换后内容仍存在,则createParent.children中追加对象
                               {
                                   type:3//普通文本
                                   text:text//文本内容
                               }
       html中再无内容，则返回root对象
     */

    function compileToFunction(el) {
      // 1.将html 变成ast语法树
      let ast = parseHTML(el);
      // console.log('---ast',ast);
      // 2. ast语法树变成render函数
      // 2.1）ast语法树变成 字符串

      let code = generate(ast); //_c _v _s
      // console.log('----ast语法变成的字符串',code);
      // 2.2）字符串变成render函数
      let render = new Function(`with(this){console.log('render',this);return ${code}}`); //code中的this 指向了Vue实例对象，其中msg的值相当于vue实例的msg值
      // console.log('---render',render);
      return render;
    }
    /**
     * 
     * 
     let objs = {a:1,b:2};
    with(objs){//利用with提供作用域
      console.log(a,b)//1,2
    }
     */

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
        // console.log('--value',value,value.length)
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
          // console.log('--get')
          return value;
        },
        set(newValue) {
          // console.log('----set')
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

    /**
     * 
     * @param {*} oldVnode 原容器
     * @param {*} vnode 虚拟dom
     */
    function patch(oldVnode, vnode) {
      // console.log(oldVnode,vnode)
      // vnode=>真实dom
      //1)创建新的DOM
      let el = createEl(vnode);
      // console.log('---真实domel',el);
      //2)替换 2.1）获取父节点 2.2）插入新dom 2.3）删除旧元素
      let parentEl = oldVnode.parentNode; // body
      parentEl.insertBefore(el, oldVnode.nextsibling); //在旧节点的下一个兄弟节点 插入新dom
      parentEl.removeChild(oldVnode); //删除旧元素
      return el; //返回新dom
    }
    //创建dom
    function createEl(vnode) {
      //vnode:{tag,text,data,children}---{tag: 'div', data: {…}, key: undefined, children: Array(2), text: undefined}
      let {
        tag,
        children,
        key,
        data,
        text
      } = vnode;
      if (typeof tag == 'string') {
        //标签
        vnode.el = document.createElement(tag);
        //children->遍历子节点 继续创建dom
        if (children.length > 0) {
          children.forEach(child => {
            vnode.el.appendChild(createEl(child));
          });
        }
      } else {
        //文本
        vnode.el = document.createTextNode(text);
      }
      return vnode.el; //此时的el已经是真实dom
    }
    /**
     * vue 渲染流程：
     * 1） 数据初始化
     * 2） 对模版进行编译
     *     模版内容-> ast语法树->变成render函数
     *     ->render函数执行后得到vnode ->变成真实dom->放到页面
     *    
     */

    /**
     * 
    生命周期文件
     */
    function mounteComponent(vm, el) {
      //源码--页面加载之前 调用beforeMounted
      callHook(vm, "beforeMounted");
      vm._update(vm._render()); //1)vm._render将render函数变成vnode 2)vm._update 将vnode变成真实dom 放到页面上 -本次操作即为页面加载
      callHook(vm, "mounted");
    }
    /**
     * 
     * @param {*} Vue 
     */
    function lifecycleMixin(Vue) {
      Vue.prototype._update = function (vnode) {
        //vnode => 真实的dom
        // console.log('---vnode',vnode)
        let vm = this;
        //参数 1）容器节点 2)vnode
        vm.$el = patch(vm.$el, vnode); //vue中的patch方法就是将虚拟dom->真实dom
      };
    }
    //1)render()函数 ==》vnode ==》真实dom

    //生命周期调用（订阅发布的模式）
    function callHook(vm, hook) {
      console.log('---', hook);
      const handles = vm.$options[hook]; // 如hook为created, 则handles=[a,b,created]
      console.log('---handles', handles);
      if (handles) {
        for (let i = 0; i < handles.length; i++) {
          //性能最好的就是这种原始for
          handles[i].call(this); //改变生命周期中的this指向问题
        }
      }
    }

    //Vue所有初始化的内容
    function initMixin(Vue) {
      //_init方法放到Vue原型链上
      Vue.prototype._init = function (options) {
        // console.log('_initMixin中Vue原型链上的',options);
        let vm = this;
        // vm.$options = options//将参数帮到实例上
        vm.$options = mergeOptions(Vue.options, options); //将Vue上原有的option属性和本次传入的option合并 重新放到实例对象上
        callHook(vm, 'beforeCreated'); //初始化之前
        //初始化状态
        initState(vm);
        callHook(vm, 'created'); //初始化之后
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
        vm.$el = el; //将根节点绑定到vm实例的$el属性上
        // console.log('---el',typeof el);
        let options = vm.$options;
        if (!options.render) {
          //new Vue的时候没有指定render函数
          let template = options.template;
          if (!template && el) {
            //new Vue的时候没有指定模版，且存在根节点
            el = el.outerHTML; //string-[1]
            //获取到el的最终目的是为了变成render函数
            //将el--->ast语法树 ast语法树--->render函数
            let render = compileToFunction(el);
            // console.log('---render',render);
            //1) 将render 函数变成vnode
            //2) 将vnode变成真实DOM 放到页面上
            options.render = render; //将拿到的render函数放到实例对象options的render中
            //---todo 将虚拟的dom变为真实dom
          }
        }
        //挂载组件--调用生命周期文件中的挂载组件方法
        mounteComponent(vm); //vm._update(vm._render)
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

    //将render函数变成vnode(虚拟节点)
    function renderMixin(Vue) {
      /**
       * 标签解析
       */
      Vue.prototype._c = function () {
        //创建标签
        return createElement(...arguments);
      };
      /**
       * 文本解析
       */
      Vue.prototype._v = function (text) {
        return createText(text);
      };
      /**
       * 变量解析 _s(name) -->{{name}}
       */
      Vue.prototype._s = function (val) {
        // console.log('---_S',val);
        return val == null ? '' : typeof val === 'object' ? JSON.stringify(val) : val;
      };
      Vue.prototype._render = function () {
        let vm = this;
        let render = vm.$options.render; //获取实例上的render(该render最终是ast语法树转换成的render函数)
        let vnode = render.call(this); //执行render函数,将当前vm实例作为render中的this
        // console.log('---vnode',vnode)
        return vnode;
      };
    }
    //创建元素的方法
    /**
     * 
     * @param {*} tag 
     * @param {*} data 
     * @param  {...any} chiildren 
     */
    function createElement(tag, data = {}, ...children) {
      return vnode(tag, data, data.key, children);
    }
    //创建文本
    function createText(text) {
      return vnode(undefined, undefined, undefined, undefined, text);
    }
    function vnode(tag, data, key, children, text) {
      return {
        tag,
        data,
        key,
        children,
        text
      };
    }
    /**
     * vnode节点
     * {
     *  tag,
     * text,
     * chiildren
     * }
     */

    //项目入口文件
    function Vue(options) {
      //通过new Vue调用
      // console.log('---100 -w 的作用 自动更新dist的vue')
      // console.log(options)
      //初始化
      this._init(options);
    }
    initMixin(Vue); //调用该方法会向Vue对象的原型链上添加_init方法——对状态进行初始化
    lifecycleMixin(Vue); //对生命周期进行初始化
    renderMixin(Vue); //添加vm._render方法

    //全局方法 vue.mixin Vue.component Vue.extend
    initGlobalApi(Vue); //初始化全局方法

    /**
     * new Vue(options) 
     *    ->调用当前vue实例的_init(options)
     *      (前提是在init.js中initMixin方法已定义了Vue.property._init方法
     *       Vue.property._init方法,调用mergeOptions(Vue.options,options),此处的options就是New Vue(options)的参数
     */

    return Vue;

}));
//# sourceMappingURL=vue.js.map
