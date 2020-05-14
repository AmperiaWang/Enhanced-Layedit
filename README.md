# Enhanced-Layedit

Layui曾经推出过一个模块叫layedit，即layui自己的富文本编辑器，但其似乎停止更新了。

所以我这边试着看看能不能加些新功能上去。

实力所限，代码不可能尽善尽美。如果出现了bug或者是使用上的问题，请及时向我反馈。

每一版的layedit都是向下兼容的，layedit最初版本的使用方法可以参考[说明文档](https://www.layui.com/doc/modules/layedit.html)。

**使用方法：拿新的layedit.js替换掉原来的layedit.js即可。**

[示例页面](https://amperiawang.github.io/enhlayedit/)

## 2020年5月13日更新

1. 新增上标（`superscript`）、下标（`subscript`）、水平分割线（`hr`）工具，可以在`tools`里设置，设置方法参考说明文档中“自定义工具Bar”部分。

2. 可以使用 `insertContent(index, content)` 函数在光标最后所在的位置后追加内容。示例如下：

```
layui.use('layedit', function(){
    var layedit = layui.layedit;

	var index = layedit.build('demo'); //建立编辑器

	layedit.insertContent(index, '追加的内容'); //追加内容
});
```

注意：追加的内容只能是文本，HTML会被转义。

3. 新增文字样式选择（`formatblock`）、字体大小（`fontsize`）、字体颜色（`fontcolor`）、背景颜色（`backgroundcolor`）工具。

工具的开启/关闭可以在`tools`里设置，设置方法参考说明文档中“自定义工具Bar”部分。值得注意的是，这四种工具的默认参数都可以自定义。

其中文字样式选择（`formatblock`）工具可以通过在`set()`方法中传入`formatBlockOptions`属性来自定义。默认配置如下：

```
formatBlockOptions: {
	'h1':'标题1'
	,'h2':'标题2'
	,'h3':'标题3'
	,'h4':'标题4'
	,'h5':'标题5'
	,'h6':'标题6'
	,'p':'段落'
	,'div':'div区块'
	,'blockquote':'引用'
}
```

键名为需要转成的区块，键值则为其对应显示在工具栏的文字。

字体大小（fontsize）工具可以通过在`set()`方法中传入`fontSizeOptions`属性来自定义。默认配置如下：

```
fontSizeOptions: ['12px','14px','16px','20px','24px','28px','30px','36px','44px','52px','60px','66px']
```

其中可以作为单位的有`px`、`pt`、`em`、`rem`等等，但建议使用`px`作为单位。

字体颜色和背景颜色工具可以通过在`set()`方法中分别传入`fontColorOptions`和`backgroundColorOptions`属性来自定义。默认配置均为:

```
['#FF5722','#FFB800','#5FB878','#009688','#01AAED','#1E9FFF','#2F4056','#393D49']
```

即layui的标准颜色。关于自定义颜色的规范，您可以参考[layui颜色选择器文档](https://www.layui.com/doc/modules/colorpicker.html)来设置。

示例如下：

```
layui.use('layedit', function(){
	var layedit = layui.layedit;

	layedit.set({
		tool: ['html', '|', 'strong', 'italic', 'underline', 'del', '|' ,'left', 'center', 'right', 'formatblock', 'fontsize', 'fontcolor', 'backgroundcolor', '|', 'link', 'unlink', 'face', 'image']
		，formatBlockOptions: {
			'h1':'标题1'
			,'h2':'标题2'
			,'h3':'标题3'
			,'h4':'标题4'
			,'h5':'标题5'
			,'h6':'标题6'
			,'p':'段落'
			,'div':'div区块'
			,'blockquote':'引用'
		}
		,fontSizeOptions: ['12px','14px','16px','20px','24px','28px','30px','36px','44px','52px','60px','66px']
		,fontColorOptions: ['#FF5722','#FFB800','#5FB878','#009688','#01AAED','#1E9FFF','#2F4056','#393D49']
		,backgroundColorOptions: ['#FF5722','#FFB800','#5FB878','#009688','#01AAED','#1E9FFF','#2F4056','#393D49']
	});

	var index = layedit.build('demo'); //建立编辑器
});
```

4. 新增上传附件（`file`）工具，同时支持自定义图片和附件上传的回调函数（`done()`函数）。

示例如下：

```
layui.use('layedit', function(){
	var layedit = layui.layedit;

	layedit.set({
		uploadImage: {
			url: '', //接口URL
			type: '', //默认为POST
			done: function(res){
				//处理后台返回的信息（JSON格式）
			}
		},
		uploadFile: {
			url: '', //接口URL
			type: '', //默认为POST
			done: function(res){
				//处理后台返回的信息（JSON格式）
			}
		}
	});

	var index = layedit.build('demo'); //建立编辑器
});
```

5. 将编辑HTML放入新窗口中进行。

## 2020年5月14日更新

1. 修复文件上传不正常的bug。

2. 新增撤销（`undo`），重做（`redo`），查找与替换（`searchreplace`），移除效果（`removeformat`），插入表格（`table`）工具。均可在`tool`参数中设置。

其中，“查找与替换”工具允许您查找编辑器中的文本并用新的文本来替换它，目前暂不支持正则表达式和不区分大小写搜索。

“插入表格”工具则允许您在编辑器中插入表格。在插入表格后，您可对特定单元格进行修改，包括但不限于自定义行高、列宽、添加/删除行或列等。

3. 允许您自定义编辑器中内容的CSS。您可以在`set()`函数中使用`contentCSS`参数传入CSS文件的链接（参数为包含各CSS文件链接的列表），也可以使用`customCSS`参数自行写入CSS（参数为CSS字符串）。

示例如下：

```
layui.use('layedit', function(){
	var layedit = layui.layedit;

	layedit.set({
		contentCSS: ['./layui/css/layui.css'], //CSS文件链接
		customCSS: 'html{margin:8px;}' //自定义CSS字符串
	});

	var index = layedit.build('demo'); //建立编辑器
});
```