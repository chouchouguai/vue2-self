//对象合并
export const HOOKS = [
    "beforeCreate",
    "created",
    "beforeMount",
    "mounted",
    "beforeUpdate",
    "updated",
    "beforeDestory",
    "destoryed"
];
//策略模式 -一般如果判断if情况比较多 可以用该模式
let starts = {};
//处理数据
starts.data = function(parentVal,childVal){
    return childVal;
}//合并data
starts.computed = function(){}//合并computed
starts.watch = function(){}//合并watch
starts.methods = function(){}//合并methods
//遍历生命周期，依次添加starts[beforeCreate],starts[created]。。等
HOOKS.forEach(hooks=>{
    starts[hooks] = mergeHook
})
function mergeHook(parentVal,childVal){
    // {created:[a,b,c],watch:[a,b]}
    if(childVal){
        if(parentVal){
            return parentVal.concat(childVal)
        }else{
            return [childVal]//[a]
        }
    }else{
        return parentVal
    }
}
/**
 * 
 * @param {*} parent 
 * @param {*} child  Vue.Mixin(参数),参数就是child
 * @returns 
 */
export function mergeOptions(parent,child){
    console.log('---mergeOptions',parent,child)
    //Vue.options = {created:[a,b,c],watch:[a,b]}
    const options = {};
    //如果有parent 没有 child
    for(let key in parent){
        mergeField(key)
    }
    //有child 没有 parent
    for(let key in child){//child就是传过来的mixin 第一次child={created:function a(){}}
        mergeField(key)
    }
    function mergeField(key){
        //根据key 策略模式
        if(starts[key]){//若存在该方法
            options[key] = starts[key](parent[key],child[key])
        }else{
            options[key] = child[key]
        }
    }
    // console.log('---optiosns',options)
    return options;
}