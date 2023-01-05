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
 const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`// 标签名称 ---如 div
 const qnameCapture = `((?:${ncname}\\:)?${ncname})`;// 如  <span:xx>
 const startTagOpen = new RegExp(`^<${qnameCapture}`);// 标签开头的正则 捕获的内容是标签名    如 <div
 
 const attribute =
   /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // \s所有空白符，包括换行 id="app"
 const startTagClose = /^\s*(\/?)>/;// 匹配标签结束的 >   ps: startTagOpen + attribute + startTagClose = "<div id="app" >
 
 const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;// 匹配默认 {{}}
 const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);// 匹配标签结尾 </div>
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
 
 function createASTElement(tag,attrs){
   return {
     tag,//元素 div span h等
     attrs,//属性 id class 等
     children:[],//子节点 如div 中包含了span 则span就是自己点
     type:1,//nodetype的类型
     parent:null//该元素的父元素
   }
 }
 let root;//根元素
 let createParent ;//当前元素的父元素
 //数据结构 栈:先进后出
 let stack = [];//[div]
 
 
 // 开始标签 <div id='app'>
 /**
  * 
  * @param {*} tag 
  * @param {*} attrs 
  * 将开始标签转为ast对象，并入栈 (注:end方法中 会将其出栈)
  */
 function start(tag, attrs) {/**传入标签名 和 参数  */
   let element = createASTElement(tag,attrs);
   if(!root){
     root = element;
   }
   createParent = element;
   stack.push(element);
 }
 // 获取文本 {{msg}}
 function charts(text) {
//    console.log('文本', text)
   //替换 空格
   text = text.replace(/\s/g,'');//
   if(text){
     createParent.children.push({
       type:3,//文本类型
       text//文本内容
     })
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
   let element = stack.pop();//取出栈中第一个元素 栈后进先出 pop取的就是最后进的那个 h
   createParent = stack[stack.length-1];//此时取出的是栈中最后进的前一个 div
   if(createParent){//元素的闭合
     element.parent = createParent.tag;//{tag:h,attrs:null,type:1,parent:'div'} 
     createParent.children.push(element);//{tag:div,attrs:[{id:'app'}],type:1,children:[{tag:h,attrs:null,type:1}]}
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
 export function parseHTML(html) {// html中包含的内容只有3大类型:开始标签  文本  结束标签
   // 如: <div id="app"> hello {{msg}} <h></h> </div> 
   /** 思路 每次解析结束完成部分的html 删除 */
   while (html) {// html 为空结束
     // 判断标签
     let textEnd = html.indexOf('<');
     if (textEnd === 0) {// html以 < 开头 说明是标签
       // 1.看是否是开始标签，与开始标签的正则startTagOpen 匹配
       const startTagMatch = parseStartTag();//  开始标签的内容-该方法是单独定义的
       // console.log('----startTagMatch',startTagMatch)
       if (startTagMatch) {
         start(startTagMatch.tagName, startTagMatch.attrs)//---开始标签的处理，根据标签名称和参数,创建root对象，当前节点对象,转为ast对象并入栈
         continue;
       }
       //结束标签 ->若为结束标签</标签名>
       let endTagMatch = html.match(endTag)//从html中匹配结束标记的正则(endTag),得到与正则匹配的文本内容
    //    console.log('---enTagMatch',endTagMatch)
       if (endTagMatch) {//若存在结束标签 
         advance(endTagMatch[0].length)
         end(endTagMatch[1])//到结束标签了 则将当前节点和其父节点关联起来,并放到root对象中去
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
       advance(text.length)
       charts(text)//将文本内容放入到root对象中
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
       }
       advance(start[0].length)// 向前推进一步 (删除开始标签)
       // 获取属性 -注意 属性可能有多个 需要遍历
       let attr
       /*
         注意 刚才删除了开始标签 但是开始标签还有个 >  
         比如第一次删除了开始标签<div  剩余 id='#app'> hello {{msg}} <span></span></div>
       */
       let end
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
         })
         advance(attr[0].length)
       }
       if (end) {
         advance(end[0].length)
         return match;// <div id='app'> 解析完成 返回开始节点对应的ast初级形态语法树
       }
     }
   }
   function advance(n) {
     // 删除以及识别出的html字符串 （如 识别了<div 则删除<div,n为识别出的字符串的长度）
     html = html.substring(n)// 从html的n位置开始截取到最后,返回截取后的内容---删除了识别出的内容
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