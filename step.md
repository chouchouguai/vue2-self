1.劫持普通对象 {} -get set
2.劫持普通数组
3.劫持对象数组
4.数组的修改（push unshift splice）
4.实例对象获取data (vm.msg) -数据代理
  --原先为了方便获取,已经将原option中data的值直接绑定到vm._data中
  --本次实现将vm._data中的数据直接放到vm中
5.模版编译 ->页面直接用{{msg}}
  5.1 str--->ast compileToFunction
    1)parseHTML ---将制定的html内容转换成ast对象
  5.2 ast -> render
6. render->虚拟dom
7. vue渲染流程 + 合并生命周期 （created data）及调用
正则说明：
part2:
1. 创建Watcher实例 实现更新 对象的收集依赖 dep watcher  数组的收集依赖
2. 队列处理
3. 实现nextTick() -优化节流更新部分
4. 实现生命周期 -update
5. 实现watch