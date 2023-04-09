/**
 * patch方法就是将虚拟dom->真实dom -part4diff算法时 patch方法内容整体重写 原内容放入if(oldVnode.nodeType ===1){中
 * @param {*} oldVnode 原容器
 * @param {*} vnode 虚拟dom
 */
export function patch(oldVnode,vnode){
    //第一次渲染 oldVnode 是一个真实的DOM
    if(oldVnode.nodeType ===1){//nodeType真实dom节点的节点类型->1:元素;2:属性;3:文本;4:注释
        // vnode=>真实dom
        //1)创建新的DOM
        let el = createEl(vnode);
        // console.log('---真实domel',el);
        //2)替换 2.1）获取父节点 2.2）插入新dom 2.3）删除旧元素
        let parentEl = oldVnode.parentNode;// body
        parentEl.insertBefore(el,oldVnode.nextsibling);//在旧节点的下一个兄弟节点 插入新dom
        parentEl.removeChild(oldVnode);//删除旧元素
        return el;//返回新dom
    }else{//两个vnode -diff
        console.log('---diff中比较两个节点',oldVnode,vnode);
        //1. 元素不是一样
        if(oldVnode.tag !== vnode.tag){
          return oldVnode.el.parentNode.replaceChild(createEl(vnode),oldVnode.el);
        }
        //2. 标签一样 text 属性<div>1</div>  <div>2</div> tag:undefined
        if(!oldVnode.tag){//旧节点不是标签 就是普通文本
            console.log('---旧元素不是节点')
            if(oldVnode.text !== vnode.text){//旧节点文本内容和新节点文本内容不相等
              return  oldVnode.el.textContent = vnode.text;
            }
        }
        //2.1 属性 （diff比较属性，前提是标签是一样的）<div id="a">1</div> <div id="b">2</div>
        //方法 1).直接复制
        let el = vnode.el = oldVnode.el;
        updataRpors(vnode,oldVnode.data)//将新节点的属性，通过与旧节点属性比较厚 添加到真实节点中
        //diff 新旧元素的 子元素 （比较两个元素的子元素内容）
        let oldChildren = oldVnode.children||[];
        let newChildren = vnode.children||[];
        //1) 旧元素有子元素 新元素也有
        //2）旧元素有子元素 新元素没有
        //3）旧元素没子元素 新元素有
        if(oldChildren.length>0 && newChildren.length>0){ //1) 旧元素有子元素 新元素也有
            console.log('---新旧元素都有儿子节点')
            //创建方法，用于比较新旧元素 并更新结果到el -为了验证该方法 此时将index.js中两个元素模版内容改成ul+li的结构
            updataChild(oldChildren,newChildren,el)
        }else if(oldChildren.length>0){//2）旧元素有子元素 新元素没有
            el.innerHTML ='';//删除旧元素的子节点
        }else if(newChildren.length>0){//3）旧元素没子元素 新元素有
            for(let i=0;i<newChildren.length;i++){
                let child = newChildren[i];
                //子元素转为真实dom之后 添加到真实dom el中
                el.appendChild(createEl(child))
            }
        }

    }
}
/**
 * 两个包含子元素的节点 比较内容 --p34 0:05:20
 * vue diff算法 做了很多优化  旧<li>1</li>  新 <li>2</li> 
 * dom操作元素 常用的逻辑:
 * 尾部添加 或者 头部添加 或者 倒序和正序的方式
 * vue2中采用双指针的方式遍历
 *  1)创建双指针
 * 比较规则:双指针比对
 */
function updataChild(oldChildren,newChildren,parent){
    //1.创建旧元素头指针、尾指针
    let oldStartIndex = 0;//旧的开头索引
    let oldStartVnode = oldChildren[oldStartIndex];//旧的开头元素
    let oldEndIndex = oldChildren.length -1;//旧的结尾索引
    let oldEndVnode = oldChildren[oldEndIndex];//旧的结尾元素

    //1.创建新元素头指针、尾指针
    let newStartIndex = 0;//新的开头索引
    let newStartVnode = newChildren[newStartIndex];//新的开头元素
    let newEndIndex = newChildren.length -1;//新的结尾索引
    let newEndVnode = newChildren[newEndIndex];//新的结尾元素

    //创建旧元素的映射表 -p35 19:15
    function makeIndexByKey(child){
        let map ={};
        child.forEach((item,index)=>{
            if(item.key){
                map[item.key] = index;
            }
        })
        return map;
    }
    let map = makeIndexByKey(oldChildren);//todo


    //当旧元素头指针<=尾指针 且 新元素头指针<=尾指针:新元素的头部和旧元素的头部做比较
    while(oldStartIndex <= oldEndIndex && newStartIndex<= newEndIndex){
        //比对子元素
        //头部比较:注意头部这个元素是否是同一个元素
        if(isSameVnode(oldStartVnode,newStartVnode)){//若果新旧元素的头部是同一元素
            console.log('---新旧元素的头部是同一个元素')
            //递归比较
            patch(oldStartVnode,newStartVnode)//则patch比较元素的内容 将差异的部分添加进去
            //头部指针后移
            oldStartVnode = oldChildren[++oldStartIndex]
            newStartVnode = newChildren[++newStartIndex]
        }else if(isSameVnode(oldEndVnode,newEndVnode)){
            patch(oldEndVnode,newEndVnode);
            oldEndVnode = oldChildren[--oldEndIndex]
            newEndVnode = newChildren[--newEndIndex]
        }else if(isSameVnode(oldStartVnode,newEndVnode)){//旧元素头 和新元素尾 交叉比较
            patch(oldStartVnode,newEndVnode);
            oldStartVnode = oldChildren[++oldStartIndex];
            newEndVnode = newChildren[--newEndIndex];
        }else if(isSameVnode(oldEndVnode,newStartVnode)){//旧元素尾 和新元素头 交叉比较
            patch(oldEndVnode,newStartVnode);
            oldEndVnode = oldChildren[--oldEndIndex];
            newStartVnode = newChildren[++newStartIndex];
        }
        //面试题:为什么要添加key -答案在此处
        else{/*新旧元素的儿子之间没有任何关系，
            使用暴力对比-用新元素跟旧元素中的每一个做比较
            1）如果新元素在旧元素中不存在,则将新元素转成真实dom 插入在旧元素的真实dom前面
            2）如果新元素在旧元素中存在，则将旧元素转成真实dom,移到该旧元素的前面，然后比较新旧元素(patch)，这样就可以把新元素不一样的地方更新上去了
            新元素指针位移
            */
            //1.创建旧元素的映射表
            //2.从旧元素映射表中查找新的元素是否存在
            let mapIndex = map[newStartVnode.key];
            if(mapIndex==undefined){//新元素在旧元素中不存在
                //将该元素转成真实dom，添加到旧元素的真实dom前面
                parent.insertBefore(createEl(newStartVnode),oldStartVnode.el)
            }else{//新元素在旧元素中存在
                //1.获取到旧元素（需要移动的元素）
                let moveVnode = oldChildren[mapIndex];
                oldChildren[mapIndex] =null;//防止数组塌陷 移走的位置用null补位
                parent.insertBefore(moveVnode.el,oldStartVnode.el);//将需要移动的旧元素的真实dom 插入到当前指针对应元素的真实dom前面
                //问题:插入的元素可以还有子节点 -patch比较
                patch(moveVnode,newStartVnode)
            }
            //新元素指针位移
            newStartVode = newChildren[++newStartIndex]
        }
    }
    // 添加多余的儿子 ---理论上来说 到这个位置 新元素的头指针应该=新元素的尾指针 旧元素的头指针应该=旧元素的尾指针
    // 如果上面两个条件谁不满足 就说明 还有元素没有比较到 是多出来的
    if(newStartIndex<=newEndIndex){//新元素的头指针 <= 尾指针 -有新的元素是多出来的，则将新元素添加到parent(旧元素的真实dom)中
        for(let i= newStartIndex;i<newEndIndex;i++){
            parent.appendChild(createEl(newChildren[i]))
        }
    }
    /*此时 旧元素中包含了旧元素 以及patch新元素之后的旧元素，需要将多余的旧元素删除
    如 旧元素 a,b,c
       新元素 a,d,f,c
       按照上面的比较处理之后就是 patch之后的a,null,d,b,f,patch之后的c,null
       此时需要把null都删除
    */
    if(oldStartIndex<=oldEndIndex){//新元素的头指针 <= 尾指针 -有新的元素是多出来的，则将新元素添加到parent(旧元素的真实dom)中
        for(let i= oldStartIndex;i<oldEndIndex;i++){
           //注意null
           let child = oldChildren[i];
           if(child!=null){
            parent.removeChild(child.el);//从当前真实dom中删除该旧dom
           }
        }
    }

}
//判断是否是同一个元素 -元素类型和key都相等
function isSameVnode(oldContext,newContext){
    return (oldContext.tag === newContext.tag) && (oldContext.key === newContext.key)
}
/*
将节点的属性 添加到真实节点中 -如 模版为<div id="a" style="color:red">张三</div>
* vnode:虚拟节点 
{
  tag:'div',
  key:undefined,
  text:文本内容,
  el:真实节点,
  data:{
    id:'a',
    style:{
       color:'red'
    }
  }//节点的属性对象
  children:{
    tag:undefined,
    key:undefined,
    text:'张三',
    el:真实节点,
    data:{id:'a'}//节点的属性对象
    children:undefined
  }

}
*/
function updataRpors(vnode,oldProps={}){//第一次
    console.log('----updataRpors',vnode)
    let newProps = vnode.data || {};//获取当前新节点的属性
    let el = vnode.el;//获取当前新节点的真实节点
    //比较处理新旧节点属性的不同-start
    //1.某个属性 老的有该属性，新的没有
    for(let key in oldProps){
        if(!newProps[key]){
            //删除真实节点中的该属性
            el.removeAttribute(key);
        }
    }
    //2.样式的处理
    //2.1 旧虚拟节点的样式 style:{color:red}  新的虚拟 style:{background:red}
    let newStyle = newProps.style||{};
    let oldStyle = oldProps.style||{};
    for(let key in oldStyle){
        if(!newStyle[key]){//旧虚拟节点有该样式 新虚拟节点么有
            el.style = ''//删除了新节点上真实节点的样式- 如果有多个不担心全删了，因为下面的3会将新节点的style又放回到了新节点真实节点上
        }
    }
    // console.log('--el',el)
    //比较处理新旧节点属性的不同-end
    //3.新虚拟dom中有属性，而旧虚拟dom无属性
    for(let key in newProps){
        if(key==="style"){//样式属性
            for(let styleName in newProps.style){
               el.style[styleName] = newProps.style[styleName] //真实节点添加属性的方法 el.style['height']='14px'
            }
        }else if(key ==="class"){//样式类属性
            el.className = newProps.class;//真实节点添加样式类的方法
        }else{//其他属性
            el.setAttribute(key,newProps[key]);
        }
    }
}
//创建真实dom
export function createEl(vnode){//vnode:{tag,text,data,children}---{tag: 'div', data: {…}, key: undefined, children: Array(2), text: undefined}
    let {tag,children,key,data,text} = vnode;
    if(typeof tag =='string'){//标签
        vnode.el = document.createElement(tag);
        // updataRpors(vnode)//添加标签的属性
        //children->遍历子节点 继续创建dom
        if(children.length>0){
            children.forEach(child => {
                vnode.el.appendChild(createEl(child))
            });
        }
    }else{//文本
        vnode.el = document.createTextNode(text);
    }
    return vnode.el;//此时的el已经是真实dom
}
/**
 * vue 渲染流程：
 * 1） 数据初始化
 * 2） 对模版进行编译
 *     模版内容-> ast语法树->变成render函数
 *     ->render函数执行后得到vnode ->变成真实dom->放到页面
 *    
 */