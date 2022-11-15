//配置rollup打包项
import bable from 'rollup-plugin-babel'
import serve from 'rollup-plugin-serve'

export default{
  input:'./src/index.js',//打包入口文件
  output:{//打包出口
    file:'dist/vue.js',//打包出口文件
    format:'umd',//一种打包方式 会在window上Vue -> new Vue
    name:'Vue',//全局变量名非常     4
    sourcemap:true//映射
  },
  plugins:[
    bable({
      exclude:'node_modules/**',//排除的文件目录
    }),
    serve({
      port:3000,//开启服务的端口号
      contentBase:'',//‘’字符串代表当前目录
      openPage:'/index.html'//访问3000端口时打开该文件
    }),//开启的服务
    
  ]
}