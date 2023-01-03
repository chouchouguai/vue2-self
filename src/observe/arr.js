/**重写数组中的方法
 * 类名.prototype ->指向原型对象,该对象中包含了所有实例共享的属性和方法
 * 对象.__proto__ ->指向该对象所属类的prototype 两个完全相等
 */



//1.获取原数组中的方法
let oldArrayProtoMethods = Array.prototype;
//2.继承 ->通过指定原型对象 创建新对象ArrayMethods  ;ArrayMethods.__proto__ 指向oldArrayProtoMethods
export let ArrayMethods = Object.create(oldArrayProtoMethods);
//3.列出所有需要劫持的方法
let methods = [
  'push',
  'pop',
  'unshift',
  'shift',
  'pop'
];
methods.forEach(item=>{
  ArrayMethods[item] = function(...args){
    // console.log('---劫持了数组方法item',this,args)//此时的args是个数组[],会将传入的内容放入该数组中s
    let result = oldArrayProtoMethods[item].apply(this,args);
    //1.此时要考虑数组追加数据的情况  如原arr = [1,2]
    //因为追加的数据可能是1)普通3==>[1,2,3]    2）对象 {a:1} ==>[1,2,{a:1}]
    //2.考虑追加的方式 push unshift splice
    let inserted;//追加的内容
    switch(item){
      case 'push':
      case 'unshift':
        inserted = args;
        break;
      case 'splice':
        inserted = args.splice(2);// arr.splice(开始位置,删除长度,追加内容)
        break;
    }
    /*对追加的内容进行劫持observer(inserted)
      但是因为observer方法在./index.js中,此处无法获取(别在此处引入index.js,因为index.js引入了当前文件，会造成互相引用)
      可以考虑将observer方法绑定在当前实例对象的某个属性上 这样当前对象可以直接使用
      先在此处打印下this--》看看this指向谁 -通过打印得知,this指向当前数组对象 list
    */
    // console.log('---this',this)
    let obj = this.__ob__;
    if(inserted){
      obj.observerArray(inserted)//因为args是数组 所以推荐使用observerArray
    }
    obj.dep.notify();
    return result;
    
  }
})