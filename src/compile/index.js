import { generate } from "./generate";
import { parseHTML } from "./parseAst";

export function compileToFunction(el) {
  // 1.将html 变成ast语法树
  let ast = parseHTML(el);
  // console.log('---ast',ast);
  // 2. ast语法树变成render函数
  // 2.1）ast语法树变成 字符串
  
  let code = generate(ast);//_c _v _s
  // console.log('----ast语法变成的字符串',code);
  // 2.2）字符串变成render函数
  let render = new Function(`with(this){console.log('render',this);return ${code}}`);//code中的this 指向了Vue实例对象，其中msg的值相当于vue实例的msg值
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
