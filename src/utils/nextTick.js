let callback = []//放回调方法
let pending = false;
function flush(){
    callback.forEach(cb=>cb())
    pending = false;
}
let timerFunc
//处理兼容问题
if(Promise){
    timerFunc = ()=>{
        Promise.resolve().then(flush)//异步处理
    }
}else if(MutationObserver){//h5 的异步方法 可以监听dom的变化 监控完毕之后再异步更新
    let observe = new MutationObserver(flush)
    let textNode = document.createTextNode(1);//创建文本
    observe.observe(textNode,{characterData:true})//观测文本内容
    timerFunc = ()=>{
        textNode.textContent = 2;//当文本内容变成2时 执行flush方法--课堂解说
    }
}else if(setImmediate){//ie
    timerFunc = ()=>{
        setImmediate(flush)
    }
}
/**nextTick :兼容不同浏览器 处理异步 */
export function nextTick(cb){
    // console.log('nextT',cb);
    //队列
    callback.push(cb);
    //promise.then() vue3中
    if(!pending){
        timerFunc()//异步方法 但是要处理兼容问题
        pending =  true;
    }
}
