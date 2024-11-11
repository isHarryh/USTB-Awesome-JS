USTB-OES-JS
==========
USTB Online Exam Script  
北京科技大学线上作业与测验平台辅助脚本合集

<sup> This project only supports Chinese docs. If you are an English user, feel free to contact us. </sup>

## 介绍 <sub>Intro</sub>
本项目包含了针对北京科技大学的各类线上作业与测验平台而开发的浏览器脚本。目前支持的平台如下：

### 锐格平台
脚本文件 `USTB-RG-Helper.js` 是针对北京科技大学程序设计考试平台（简称锐格平台，内网访问 http://ucb.ustb.edu.cn ）的辅助工具，具有如下功能：

1. 新增**显示参考答案**的功能。
2. 新增**强制提交**（包括强制补交）答案的功能。
3. 解决无法**选取和复制**网页中的文本的问题。
4. 优化题目截止时间的显示。
5. 调整少量界面样式。

当锐格平台脚本正常运行时，页面底部会显示相应的提示。

<details>
<summary><b>开发者点评</b></summary>
锐格平台，前端设计非常陈旧，而且提交答案和查看答案等业务逻辑都只有前端检测，根本没有后端检测，漏洞和错误层出不穷。很轻易地，我们就能实现仿造请求等越权操作。
</details>

### 网易慕课
脚本文件 `MOOC-Helper.js` 是针对中国大学 MOOC（简称网易慕课，公网访问 https://www.icourse163.org ）的辅助工具，具有如下功能：

1. 提交至少一次课程测验后即可**在测验详情页面查看参考答案**，无需消耗所有测验次数后再查看。

<details>
<summary><b>开发者点评</b></summary>
网易慕课，充斥着各类诱导消费和广告，里里外外都是资本和垄断的味道。身为大公司，网易在 API 请求中的数据抹除做得非常完善。而我们的脚本利用了 API 请求中的鲜有的冗余字段来将不可查看的答案变得可见。
</details>

## 使用方法 <sub>Usage</sub>
1. **在浏览器中安装脚本管理器插件。**  
   推荐的浏览器是 [Edge 浏览器](https://www.microsoft.com/zh-cn/edge/download) 或 [Chrome 浏览器](https://www.google.cn/chrome/index.html)。推荐的脚本管理器插件是 [TamperMonkey 篡改猴](https://www.tampermonkey.net/)。
2. **在脚本管理器中添加脚本文件。**  
   在本仓库中找到所需的 JS 脚本文件并下载，然后将其导入到脚本管理器（把文件内容复制到篡改猴的脚本编辑器里保存，或者直接导入整个文件）。
3. **打开对应的线上平台即可运行。**  
   如果网页已经打开，则需要刷新才能启动脚本。如果仍无法生效，请检查脚本管理器的权限是否受限。

## 许可证 <sub>Licensing</sub>
本项目基于 **MIT 开源许可证**，详情参见 [License](https://github.com/isHarryh/USTB-OES-JS/blob/main/LICENSE) 页面。
