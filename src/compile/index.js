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
// 开始标签 <div id='app'>
function  start(){}
// 文本 {{msg}}
function charts(){}
// 结束标签 </div>
function end(){}


/**
 * 
 * @param {*} html - 本次需要转换的html
 */
function parseHTML(html){// html中包含的内容只有3大类型:开始标签  文本  结束标签
  /** 思路 每次解析结束完成部分的html 删除 */
  while(html){// html 为空结束
    // 判断标签
    let textEnd = html.indexOf('<');
    if(textEnd ===0){// html以 < 开头 说明是标签
      // 1.看是否是开始标签，与开始标签的正则startTagOpen 匹配
      const startTagMatch = parseStartTag();//  开始标签的内容-该方法需要定义
      console.log('----startTagMatch',startTagMatch)
      continue
    }
    // 文本
    // 说明html 不是< 开头 如： hello</div> ,这个textEnd就是5
    if(textEnd > 0){
      //  解析文本
      //  获取文本内容 ---方案:// hello</div> 截取< 符号之前的内容(其实就是hello)
      //  console.log('----textEnd',textEnd)
      let text = html.slice(0,textEnd);
      console.log('----text',text);
    }
    break;
  }

  function parseStartTag(){
    // 子表达式指:正则表达式中用小括号包起来的表达式
    /** match(正则表达式),若正则表达式没有全局标识/g,
    *   则该match方法只执行一次匹配，
    *   返回[匹配文本,与子表达式匹配的文本们...,index:匹配开始位置,input:进行匹配的字符串本身的引用] 
    *   若无结果 返回null*/
    const start = html.match(startTagOpen);
    // start = ['<div', 'div', index: 0, input: "<div id='#app'>hello {{msg}}<span></span></div>", groups: undefined]
    // 创建ast 语法树-初级形态
    let match = {
      tagName : start[1],
      attrs:[]
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
    // console.log('----attribute',html.match(attribute))
    while(!(end = html.match(startTagClose)) && (attr = html.match(attribute))){
      // 将属性追加到match的attrs中 [{name:'id',value:'app'}]
      match.attrs.push({
        name:attr[1],
        value:attr[3] ||atrr[4] ||atrr[5] 
      })
      advance(attr[0].length)
    }
    if(end){
      advance(end[0].length)
      return match;// <div id='app'> 解析完成 返回开始节点对应的ast初级形态语法树
    }
  }
  function advance(n){
    // 删除以及识别出的html字符串 （如 识别了<div 则删除<div,n为识别出的字符串的长度）
    html = html.substring(n)// 从html的n位置开始截取到最后,返回截取后的内容---删除了识别出的内容
    console.log('---advance',html)
  }
}

export function compileToFunction(el){
  console.log('---compileToFunction',el)
  let ast = parseHTML(el);
}