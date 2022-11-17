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

正则说明：
