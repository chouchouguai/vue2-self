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
part3:
1. 实现watch -其实watch的核心就是watcher
    - 安装vue2   npm i vue@2.6.14 -演示 watch用法 -4中基本使用
    - 在自己vue 的初始化中进行格式化 
    - watch的最终使用方式是$watch
      ----此方法中创建Watcher,可以获取到第一次数据get() 以及 数据改变是 执行watcher.js的run()
      run函数主要,再执行get（）huoqu 
    - watch的完善