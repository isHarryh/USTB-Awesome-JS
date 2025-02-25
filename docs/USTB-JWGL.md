USTB-Awesome-JS 附加文档
# UTSB JWGL 逆向工程解析

此文档记载了针对北京科技大学本科生教务管理系统的运作原理的逆向解析。随着系统的升级，这些内容可能不再有效。

## API 解析

API 根路径：`https://jwgl.ustb.edu.cn`

图例：❔表示可选字段，❗表示必需字段。

### 个人中心

#### GET `/framework/xsdPerson.jsp`

- 功能：获取我的课表、学业进展、我的课程。
- 响应：HTML。

#### GET `/framework/xsdPerson_tzxx.jsp`

- 功能：获取通知、公告、待办消息。
- 响应：HTML。

### 选课中心

#### GET `/xsxk/xsxkzx_index`

- 功能：获取选课轮次列表。
- 响应：HTML。
- 响应结构：选课轮次使用表格存储，ID 放在超链接的 `onclick` 属性内，举例：
  ```html
  <tr>
    <td>2</td>
    <td>2024-2025-1</td>
    <td>2024-2025学年第一学期选课</td>
    <td>
      <a
        href="javascript:void(0);"
        onclick="jrxk('332C3B8FF1F048238**************E');">
        进入选课
      </a>
    </td>
  </tr>
  ```

#### GET `/xsxk/xsxkzx_zy`

- 功能：获取指定选课轮次的所有课程类型的 URL。
- 请求参数：
  - ❔`glyxk` 默认 `1`。
  - ❗`jx0502zbid` **选课轮次 ID。**
  - ❔`isgld` 默认 `null`。
- 响应：HTML。
- 响应结构：课程类型使用无序列表存储，每个课程类型都有对应的查询 URL，举例：
  ```html
  <li>
      <a
        href="/xsxk/getfanxkkc?type=zybxk&xsid=&kcfalx=zx&opener=zybxk&dqjx0502zbid=332C3B8FF1F048238**************E"
        target="mainFrame">
        必修课
      </a>
  </li>
  ```

#### GET `/xsxk/getfanxkkc`

- 功能：（专业必修课和专业选修课）获取指定选课轮次和指定课程类型的课程列表。
- 请求参数：
  - ❔`type` `zybxk` 或 `zyxxk`（缺省则默认前者）。
  - ❔`xsid` 默认缺省。
  - ❔`kcfalx` 默认 `zx`。
  - ❔`opener` 与 `type` 的值一致。
  - ❗`dqjx0502zbid` **选课轮次 ID。**
- 响应：HTML。
- 响应结构：课程使用表格存储，举例：
  ```html
  <tr
    onclick="qhkc(this,'1110***2','0','1','体育II');"
    class="dqxkxqclass kkclass">
    <td>5</td><!--序号-->
    <td>2024-2025-2</td><!--学期-->
    <td>1110***2</td><!--课程 ID-->
    <td title="体育II">体育II</td><!--名称-->
    <td>通识课程</td><!--性质-->
    <td>32</td><!--学时-->
    <td>1</td><!--学分-->
    <td></td><!--成绩（百分制）-->
    <td></td><!--方向-->
    <td>未选</td><!--状态（已选/未选）-->
  </tr>
  ```

#### GET `/xsxk/getgxkkc.do`

- 功能：（素质拓展课）获取指定选课轮次和指定课程类型的课程列表。
- 请求参数：
  - ❔`type` 默认 `gxk`。
  - ❔`xsid` 默认缺省。
  - ❔`kcfalx` 默认 `zx`。
  - ❔`opener` 与 `type` 的值一致。
  - ❗`dqjx0502zbid` **选课轮次 ID。**
- 响应：HTML。
- 响应结构：课程使用表格存储，与上一个 API 的响应结构类似。

#### GET `/xsxk/getkzyxkkc.do`

- 功能：（跨专业选课）获取指定选课轮次和指定课程类型的课程列表。
- 请求参数：
  - ❔`type` 默认 `kzyxk`。
  - ❔`xsid` 默认缺省。
  - ❔`kcfalx` 默认 `zx`。
  - ❔`opener` 与 `type` 的值一致。
  - ❗`dqjx0502zbid` **选课轮次 ID。**
- 响应：HTML。
- 响应结构：课程使用表格存储，与上一个 API 的响应结构类似。

#### GET `/xsxk/getkcxxlist.do`

- 功能：获取指定选课轮次的指定课程的可选讲台列表。
- 请求参数：
  - ❔`xsid` 默认缺省。
  - ❗`dqjx0502zbid` **选课轮次 ID。**
  - ❔`type` 与课程类型一致，例如 `zybxk`。
  - ❔`kcfalx` 默认 `zx`。
  - ❗`jx02id` **课程 ID。**
  - ❔`opener` 与 `type` 的值一致。
  - ❔`zxfxct` 默认 `0`。
  - ❔`sfzybxk` 默认 `1`。
  - ❔`istyk` `0` 或 `1`（缺省则默认前者），控制是否是体育课。
- 响应：HTML。
- 响应结构：讲台信息使用表格存储，举例：
  ```html
  <tr>
    <td>3</td><!--序号-->
    <td>
      <div
        id="div_20242025******6">
        <a
          href="javascript:xsxkOper('20242025******6','1110***2','','体育II','2025-02-20 15:00:00');">
          选课
        </a>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <a
          href="#"
          onclick="openWindow('/xsxk/cxkcxx?jx0404id=20242025******6',650,600);">
          详情
        </a>
      </div>
    </td><!--操作-->
    <td title="1110***2">1110***2</td><!--课程 ID-->
    <td title="体育II">
      <a
        href="javascript:JsMod('/xskb/xskb_list.do?jx0404id=20242025******6',1100,730);">
        体育II
      </a>
    </td><!--名称-->
    <td>2025-02-20 15:00:00</td><!--开始选课时间-->
    <td>乒乓球</td><!--分组名-->
    <td title="********班">********班</td><!--行政班-->
    <td>***</td><!--教师名-->
    <td>1-16周 周三第5,6节</td><!--上课时间-->
    <td></td><!--上课地点-->
    <td>1067</td><!--课序号-->
    <td>28</td><!--最大人数-->
    <td>28</td><!--余量-->
    <td>20</td><!--男生余量（仅限体育课）-->
    <td>8</td><!--女生余量（仅限体育课）-->
    <td>2025-02-21 20:00:00</td><!--退选 DDL-->
    <td class="bxkjzrqclass">2025-02-21 20:00:00</td><!--补选 DDL-->
    <td>通识课程</td><!--性质-->
    <td></td><!--素拓类别-->
    <td>普通课</td><!--标签-->
    <td
      title="20242025******6">
      20242025******6
    </td><!--讲台 ID-->
    <td>2024-2025-2</td><!--学期-->
    <td>1</td><!--学分-->
  </tr>
  ```

#### GET `/xsxk/xsxkoper`

- 功能：针对指定选课轮次的指定课程的指定讲台，执行选课操作。
- 请求参数：
  - ❗`jx0404id` **讲台 ID。**
  - ❗`dqjx0502zbid` **选课轮次 ID。**
  - ❗`yjx02id` **课程 ID。**
  - ❔`xdlx` 默认 `1`。
  - ❗`jx02id` **课程 ID。**
  - ❔`type` 与课程类型一致，例如 `zybxk`。
  - ❔`kcfalx` 默认 `zx`。
  - ❔`xsid` 默认缺省。
  - ❔`opener` 与 `type` 的值一致。
  - ❔`sfzybxk` 默认 `1`。
  - ❔`qzxkkz` 默认 `0`。
  - ❔`glyxk` 默认缺省，控制是否是管理员选课。
- 响应：JSON。
- 响应结构：
  - ❔`success` 布尔值，是否选课成功。
  - ❔`wtlx` 默认 `xz`。
  - ❔`ctxkkz` 默认 `0`。
  - ❔`message` 具体消息。
  - ❔`flag1` 整数（仅登录失效时）。
  - ❔`msgContent` 字符串（仅登录失效时）。

> **⚠️注意：** 截至 2025 年 2 月，不管是否选课成功，`success` 都是 `false`，这是一个服务器的 bug。

> **提示：** 如果是重新选课（目前未遇到这种情况），根据前端代码，`type` 应该改为 `cxxk`，但是 `opener` 的值不变。

> **提示：** 所有可能的 `message` 值如下：
> 1. `选课成功！`
> 2. `选课失败：当前教学班已选择！`
> 3. `选课失败：当前课程已经选中其它课堂！`
> 4. `该课堂选课人数已满，不能选课！`
> 5. `目前未开放选课时间，具体请查看学校选课通知！`

#### GET `/xsxk/xkkczxxstk`

- 功能：针对指定选课轮次的指定课程的指定讲台，执行退课操作。
- 请求参数：
  - ❔`xsid` 默认缺省。
  - ❗`dqjx0502zbid` **选课轮次 ID。**
  - ❗`jx0404id` **讲台 ID。**
  - ❔`tkyy` 默认缺省，退课原因。
- 响应：JSON。
- 响应结构：
  - ❔`success` 布尔值，是否退课成功。
  - ❔`message` 具体消息。
  - ❔`flag1` 整数（仅登录失效时）。
  - ❔`msgContent` 字符串（仅登录失效时）。

## 前端代码解析

整个教务系统采用 `iframe` 元素来载入各种功能模块。 

### 选课中心

选课操作的 JS 代码位于 `/xsxk/getkcxxlist.do` 返回的 HTML 的 `script` 元素中。

> 他这个代码写的实在是太差了。虽然没有使用代码混淆技术，但它还是凭借糟糕的代码质量极大地降低了代码的可读性：大量使用汉语拼音命名法、不规范的代码风格、在后端向 JS 脚本里注入参数值…… ~~你就说能不能跑吧。~~

#### 选课操作的代码逻辑

1. 检查“选课开始时间”是否晚于“当前客户端时间”，如果成立，那么弹出“选课时间未到”对话框并取消选课。
2. 弹出“是否确认选择”对话框，如果用户没有确认，那么取消选课。
3. 经过一系列~~乱七八糟~~高深莫测的操作，构造出选课请求。
4. 发送选课请求，如果选课成功，那么刷新页面状态，否则告知用户错误详情。

#### 抢课思路

- 当客户端的时间被人为修改后，可以绕过针对选课开始时间的检查。利用这一点，就可以在选课开始前发送选课请求。
- 显然，后端也有一次时间检查。如果在非选课时间段发送了选课请求，就会给出一个失败的响应。
  ```json
  {
    "success": false,
    "wtlx": "xz",
    "message": "目前未开放选课时间，具体请查看学校选课通知！"
  }
  ```
- 如果在选课开始前的十几秒内，一直**向服务器高频率地发送选课请求**，虽然在服务器时间早于选课开始时间时，一直返回的是失败的响应，但是一旦服务器时间越过了选课开始时间，就能确保选课请求被第一时间送到服务器。
- 使用这种方法进行抢课，不仅可以节省大量前端的操作时间（例如对话框确认），还可以最大限度地消除服务器和客户端的时间误差，并且节约网络请求的初始连接时间（主要是 SSL 握手时间）。
