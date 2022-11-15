/**
 * ps：ast语法树 (abstract syntax tree 抽象语法树)  vnode(虚拟节点)
 * 如：页面结构 <div id="#app">hello {{msg}}<span></span></div>
 * 对应ast为：
 * {
 * tag:'div',
 * attrs:[{id:'app'}],
 * children:[{tag:null,text:'hello'},{tag:'span'}]
 */
function parseHTML(html){

}
/**以下为vue2中区别标签相关的正则 */
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`;//标签名称
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;//<span:xx>
const startTagOpen = new RegExp(`^${qnameCapture}`);//标签开头的正则 捕获的内容是标签名
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);//匹配标签结尾
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; //\s所有空白符，包括换行
const startTagClose = /^\s*(\/?)>/;//匹配标签结束的>
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;
export function compileToFunction(el){
  console.log('---compileToFunction',el)
  let ast = parseHTML(el);
}