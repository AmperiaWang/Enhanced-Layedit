/**

 @Name：layui.layedit 富文本编辑器
 @Author：贤心
 @License：MIT
    
 */
 
 layui.define(['layer', 'form', 'colorpicker', 'util'], function(exports){
  "use strict";
  
  var $ = layui.$
  ,layer = layui.layer
  ,form = layui.form
  ,colorpicker = layui.colorpicker
  ,util = layui.util
  ,hint = layui.hint()
  ,device = layui.device()
  
  ,MOD_NAME = 'layedit', THIS = 'layui-this', SHOW = 'layui-show', ABLED = 'layui-disabled'
  
  ,Edit = function(){
    var that = this;
    that.index = 0;
    
    //全局配置
    that.config = {
      //默认工具bar
      tool: [
      'html'
      ,'|'
      ,'strong', 'italic', 'underline', 'del'
      ,'|'
      ,'left', 'center', 'right'
      ,'|'
      ,'link', 'unlink', 'face', 'image'
      ]
      ,hideTool: []
      ,height: 280 //默认高
      ,formatBlockOptions: {
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
    };
  };
  
  //全局设置
  Edit.prototype.set = function(options){
    var that = this;
    $.extend(true, that.config, options);
    return that;
  };
  
  //事件监听
  Edit.prototype.on = function(events, callback){
    return layui.onevent(MOD_NAME, events, callback);
  };
  
  //建立编辑器
  Edit.prototype.build = function(id, settings){
    settings = settings || {};
    
    var that = this
    ,config = that.config
    ,ELEM = 'layui-layedit', textArea = $(typeof(id)=='string'?'#'+id:id)
    ,name =  'LAY_layedit_'+ (++that.index)
    ,haveBuild = textArea.next('.'+ELEM);

    if(config.customBtn && settings.customBtn) settings.customBtn = $.extend({}, config.customBtn, settings.customBtn);
    
    var set = $.extend({}, config, settings)
    
    ,tool = function(){
      var node = [], hideTools = {};
      layui.each(set.hideTool, function(_, item){
        hideTools[item] = true;
      });
      layui.each(set.tool, function(_, item){
        if(tools[item] && !hideTools[item]){
          node.push(tools[item]);
        }
        if(set.customBtn[item] && set.customBtn[item].click){
          node.push('<i class="layui-icon"' + (set.customBtn[item].title?' title="'+util.escape(set.customBtn[item].title)+'"':'') + ' layedit-custom-event="' + item + '">' + (util.escape(set.customBtn[item].icon || set.customBtn[item].text) || '&#xe857;') + '</i>');
        }
      });
      return node.join('');
    }()

    ,render = function(item){
      switch(item){
        case 'index':
        return that.index;
        case 'font-size-options':
        var ret = '';
        for(var k in that.config.fontSizeOptions){
          ret += '<option value="' + util.escape(that.config.fontSizeOptions[k]) + '">' + util.escape(that.config.fontSizeOptions[k]) + '</option>';
        }
        return ret;
        case 'formatblock-options':
        for(var k in that.config.formatBlockOptions){
          ret += '<option value="' + util.escape(k) + '">' + util.escape(that.config.formatBlockOptions[k]) + '</option>';
        }
        return ret;
      }
    }
    
    ,editor = $(['<div class="'+ ELEM +'" style="background-color:#ffffff;">'
      ,'<div class="layui-unselect layui-layedit-tool layui-form" lay-filter="layedit-toolbar-' + that.index + '">' + tool.replace(/{{([^}]+)}}/g,function(a,b){return render(b);}) + '</div>'
      ,'<div class="layui-layedit-iframe">'
      ,'<iframe id="'+ name +'" name="'+ name +'" textarea="'+ id +'" frameborder="0"></iframe>'
      ,'</div>'
      ,'</div>'].join(''))
    
    //编辑器不兼容ie8以下
    if(device.ie && device.ie < 8){
      return textArea.removeClass('layui-hide').addClass(SHOW);
    }

    haveBuild[0] && (haveBuild.remove());

    setIframe.call(that, editor, textArea[0], set);
    textArea.addClass('layui-hide').after(editor);

    //重新渲染对应index的select
    form.render('select','layedit-toolbar-' + that.index);

    //绑定字体样式设置操作
    if(that.config.tool.indexOf('formatblock') > -1){
      form.on('select(layedit-formatblock-' + that.index + ')', function(data){
        var iframeWin = getWin(that.index);
        if(!iframeWin[0]) return;
        var iframeDOM = iframeWin[0].document, body = iframeDOM.body;
        iframeDOM.execCommand('formatBlock', false, '<' + util.escape(data.value) + '>');
      });
    }

    //绑定字体大小设置操作
    if(that.config.tool.indexOf('fontsize') > -1){
      form.on('select(layedit-font-size-' + that.index + ')', function(data){
        var iframeWin = getWin(that.index);
        if(!iframeWin[0]) return;
        var iframeDOM = iframeWin[0].document, body = iframeDOM.body;
        iframeDOM.execCommand('styleWithCSS', null, true);
        iframeDOM.execCommand('fontSize', false, 1);
        iframeDOM.execCommand('styleWithCSS', null, false);
        body.querySelectorAll('span').forEach(($span) => {
          if ('x-small' == $span.style.fontSize) {
            $span.style.fontSize = data.value;
          }
        });
      });
    }

    //绑定前景色设置操作
    if(that.config.tool.indexOf('fontcolor') > -1){
      var colorPickerConfig = {
        elem: '#layedit-font-color-' + that.index
        ,color: '#000000'
        ,done: function(color){
          if(!color.length) color = '#000000';
          var iframeWin = getWin(that.index);
          if(!iframeWin[0]) return;
          var iframeDOM = iframeWin[0].document, body = iframeDOM.body;
          iframeDOM.execCommand('styleWithCSS', null, true);
          iframeDOM.execCommand('foreColor', false, color);
          iframeDOM.execCommand('styleWithCSS', null, false);
        }
      };
      if(that.config.fontColorOptions && that.config.fontColorOptions.length){
        colorPickerConfig['predefine'] = true;
        colorPickerConfig['colors'] = that.config.fontColorOptions;
      }
      colorpicker.render(colorPickerConfig);
      $('#layedit-font-color-' + that.index + ' .layui-colorpicker-trigger-i').addClass('layui-hide')
      $('#layedit-font-color-' + that.index + ' .layui-colorpicker-trigger-span').css('height','10%').before('<i class="layui-icon" style="display:block;width:100%;height:90%;line-height:1;margin:0;font-size:22px;">&#xe642;</i>');
    }

    //绑定背景色设置操作
    if(that.config.tool.indexOf('backgroundcolor') > -1){
      var colorPickerConfig = {
        elem: '#layedit-background-color-' + that.index
        ,color: '#ffffff'
        ,done: function(color){
          if(!color.length) color = '#00000000';
          var iframeWin = getWin(that.index);
          if(!iframeWin[0]) return;
          var iframeDOM = iframeWin[0].document, body = iframeDOM.body;
          iframeDOM.execCommand('styleWithCSS', null, true);
          iframeDOM.execCommand('hiliteColor', false, color);
          iframeDOM.execCommand('styleWithCSS', null, false);
        }
      };
      if(that.config.backgroundColorOptions && that.config.backgroundColorOptions.length){
        colorPickerConfig['predefine'] = true;
        colorPickerConfig['colors'] = that.config.backgroundColorOptions;
      }
      colorpicker.render(colorPickerConfig);
      $('#layedit-background-color-' + that.index + ' .layui-colorpicker-trigger-i').addClass('layui-hide')
      $('#layedit-background-color-' + that.index + ' .layui-colorpicker-trigger-span').css('height','10%').before('<i class="layui-icon" style="display:block;width:100%;height:90%;line-height:1;margin:0;font-size:22px;">&#xe66a;</i>');
    }

    return that.index;
  };
  
  //获得编辑器中内容
  Edit.prototype.getContent = function(index){
    var iframeWin = getWin(index);
    if(!iframeWin[0]) return;
    return toLower(iframeWin[0].document.body.innerHTML);
  };
  
  //获得编辑器中纯文本内容
  Edit.prototype.getText = function(index){
    var iframeWin = getWin(index);
    if(!iframeWin[0]) return;
    return $(iframeWin[0].document.body).text();
  };
  /**
   * 设置编辑器内容
   * @param {[type]} index   编辑器索引
   * @param {[type]} content 要设置的内容
   * @param {[type]} flag    是否追加模式
   */
   Edit.prototype.setContent = function(index, content, flag){
    var iframeWin = getWin(index);
    if(!iframeWin[0]) return;
    if(flag){
      $(iframeWin[0].document.body).append(content)
    }else{
      $(iframeWin[0].document.body).html(content)
    };
    layedit.sync(index)
  };
  //于光标所在位置插入文本
  Edit.prototype.insertContent = function (index, content) {
    var iframeWin = getWin(index), tempDiv = $('<div></div>');
    tempDiv.html(content);
    content = tempDiv.text();
    if(!iframeWin[0]) return;
    var range = Range(iframeWin[0].document), container = range.endContainer;
    if(range.endContainer.insertData){
      range.endContainer.insertData(range.endOffset, content);
    }else if(range.endContainer != iframeWin[0].document){
      range.endContainer.innerText = range.endContainer.innerText.slice(0, range.endOffset) + content + range.endContainer.innerText.slice(range.endOffset);
    }else{
      iframeWin[0].document.body.innerText = iframeWin[0].document.body.innerText.slice(0, range.endOffset) + content + iframeWin[0].document.body.innerText.slice(range.endOffset);
      container = iframeWin[0].document.body.childNodes[0];
    }
    var s = iframeWin[0].getSelection();
    s.removeAllRanges();
    s.addRange(setRange(iframeWin[0].document, container, range.endOffset + content.length, container, range.endOffset + content.length));
  };
  //将编辑器内容同步到textarea（一般用于异步提交时）
  Edit.prototype.sync = function(index){
    var iframeWin = getWin(index);
    if(!iframeWin[0]) return;
    var textarea = $('#'+iframeWin[1].attr('textarea'));
    textarea.val(toLower(iframeWin[0].document.body.innerHTML));
  };
  
  //获取编辑器选中内容
  Edit.prototype.getSelection = function(index){
    var iframeWin = getWin(index);
    if(!iframeWin[0]) return;
    var range = Range(iframeWin[0].document);
    return document.selection ? range.text : range.toString();
  };

  //iframe初始化
  var setIframe = function(editor, textArea, set){
    var that = this, iframe = editor.find('iframe');

    iframe.css({
      height: set.height
    }).on('load', function(){
      var conts = iframe.contents()
      ,iframeWin = iframe.prop('contentWindow')
      ,head = conts.find('head')
      ,style = $(['<style>'
        ,'*{margin: 0; padding: 0;}'
        ,'body{padding: 10px; line-height: 20px; overflow-x: hidden; word-wrap: break-word; font: 14px Helvetica Neue,Helvetica,PingFang SC,Microsoft YaHei,Tahoma,Arial,sans-serif; -webkit-box-sizing: border-box !important; -moz-box-sizing: border-box !important; box-sizing: border-box !important;}'
        ,'a{color:#01AAED; text-decoration:none;}a:hover{color:#c00}'
        ,'p{position: relative; margin: 10px 0;}'
        ,'img{display: inline-block; border: none; vertical-align: middle;}'
        ,'pre{margin: 10px 0; padding: 10px; line-height: 20px; border: 1px solid #ddd; border-left-width: 6px; background-color: #F2F2F2; color: #333; font-family: Courier New; font-size: 12px;}'
        ,'blockquote{border-style: solid; border-width: 1px 1px 1px 5px; border-color: #e6e6e6; margin: 5px; padding: 15px; line-height: 22px; border-radius: 0 2px 2px 0;}'
        ,'table{width: 100%; background-color: #fff; color: #666; margin: 10px 0; border-collapse: collapse; border-spacing: 0;}'
        ,'table thead tr{background-color: #f2f2f2; transition: all .3s; -webkit-transition: all .3s;}'
        ,'table th{position: relative; padding: 9px 15px; min-height: 20px; line-height: 20px; font-size: 14px; border-width: 1px; border-style: solid; border-color: #e6e6e6; text-align: left; font-weight: 400;}'
        ,'table tbody tr{transition: all .3s; -webkit-transition: all .3s;}'
        ,'table td{position: relative; padding: 9px 15px; min-height: 20px; line-height: 20px; font-size: 14px; border-width: 1px; border-style: solid; border-color: #e6e6e6;}'
        ,'ul,ol{margin-left: 2rem;}'
        ,(util.escape(set.customCSS) || '')
        ,'</style>'].join(''))
      ,body = conts.find('body');
      
      head.append(style);
      if(set.contentCSS && set.contentCSS.length){
        for(var k in set.contentCSS){
          head.append('<link rel="stylesheet" type="text/css" href="' + set.contentCSS[k] + '">');
        }
      }
      body.attr('contenteditable', 'true').css({
        'min-height': set.height
      }).html(textArea.value?textArea.value:'').bind('input propertychange', function(e) {
        var nodes = body.get(0).childNodes;
        for(var i=0; i<nodes.length; i++){
          var $el = $(nodes[i]);
          if(nodes[i].nodeName.toLowerCase() === '#text'){
            $el.before('<p>'+nodes[i].data.replace(/ /g,'&nbsp;')+'</p>');
            $el.remove();
          }
        }
        toolCheck.call(iframeWin, editor.find('.layui-layedit-tool'), null);
      });
      hotkey.apply(that, [iframeWin, iframe, textArea, set]); //快捷键处理
      toolActive.call(that, iframeWin, editor, set); //触发工具
    });
  }
  
  //获得iframe窗口对象
  ,getWin = function(index){
    var iframe = $('#LAY_layedit_'+ index)
    ,iframeWin = iframe.prop('contentWindow');
    return [iframeWin, iframe];
  }
  
  //IE8下将标签处理成小写
  ,toLower = function(html){
    if(device.ie == 8){
      html = html.replace(/<.+>/g, function(str){
        return str.toLowerCase();
      });
    }
    return html;
  }
  
  //快捷键处理
  ,hotkey = function(iframeWin, iframe, textArea, set){
    var iframeDOM = iframeWin.document, body = $(iframeDOM.body);
    body.on('keydown', function(e){
      var keycode = e.keyCode;
      //处理回车
      if(keycode === 13){
        var range = Range(iframeDOM);
        var container = getContainer(range)
        ,parentNode = container.parentNode;
        
        if(parentNode.tagName.toLowerCase() === 'pre'){
          if(e.shiftKey) return
            layer.msg('请暂时用shift+enter');
          return false;
        }
        if(parentNode.tagName.toLowerCase() !== 'li' && parentNode.tagName.toLowerCase() !== 'ul' && parentNode.tagName.toLowerCase() !== 'ol') iframeDOM.execCommand('formatBlock', false, '<p>');
      }
    });
    
    //给textarea同步内容
    $(textArea).parents('form').on('submit', function(){
      var html = body.html();
      //IE8下将标签处理成小写
      if(device.ie == 8){
        html = html.replace(/<.+>/g, function(str){
          return str.toLowerCase();
        });
      }
      textArea.value = html;
    });
    
    //处理粘贴
    body.on('paste', function(e){
      iframeDOM.execCommand('formatBlock', false, '<p>');
      setTimeout(function(){
        filter.call(iframeWin, body);
        textArea.value = body.html();
      }, 100); 
    });
  }
  
  //标签过滤
  ,filter = function(body){
    var iframeWin = this
    ,iframeDOM = iframeWin.document;
    
    //清除影响版面的css属性
    body.find('*[style]').each(function(){
      var textAlign = this.style.textAlign;
      this.removeAttribute('style');
      $(this).css({
        'text-align': textAlign || ''
      })
    });
    
    //修饰表格
    body.find('table').addClass('layui-table');
    
    //移除不安全的标签
    body.find('script,link').remove();
  }
  
  //Range对象兼容性处理
  ,Range = function(iframeDOM){
    return iframeDOM.selection 
    ? iframeDOM.selection.createRange()
    : (iframeDOM.getSelection().rangeCount ? iframeDOM.getSelection().getRangeAt(0) : iframeDOM.createRange());
  }
  
  //当前Range对象的endContainer兼容性处理
  ,getContainer = function(range){
    return range.endContainer || range.parentElement().childNodes[0]
  }

  //设置一个新的Range
  ,setRange = function(iframeDOM, stCon, stOff, enCon, enOff){
    var r = iframeDOM.createRange();
    r.setStart(stCon, stOff);
    r.setEnd(enCon, enOff);
    return r;
  }
  
  //在选区插入内联元素
  ,insertInline = function(tagName, attr, range){
    var iframeDOM = this.document
    ,elem = document.createElement(tagName)
    for(var key in attr){
      elem.setAttribute(key, attr[key]);
    }
    elem.removeAttribute('text');

    if(iframeDOM.selection){ //IE
      var text = range.text || attr.text;
      if(tagName === 'a' && !text) return;
      if(text){
        elem.innerHTML = text;
      }
      range.pasteHTML($(elem).prop('outerHTML')); 
      range.select();
    } else { //非IE
      var text = range.toString() || attr.text;
      if(tagName === 'a' && !text) return;
      if(text){
        elem.innerHTML = text;
      }
      range.deleteContents();
      range.insertNode(elem);
    }
  }
  
  //工具选中
  ,toolCheck = function(tools, othis){
    var iframeDOM = this.document
    ,CHECK = 'layedit-tool-active'
    ,container = getContainer(Range(iframeDOM))
    ,item = function(type){
      return tools.find('.layedit-tool-'+type)
    }

    if(othis){
      othis[othis.hasClass(CHECK) ? 'removeClass' : 'addClass'](CHECK);
    }
    
    tools.find('>i').removeClass(CHECK);
    item('unlink').addClass(ABLED);
    item('table').show();
    item('table-unit').removeClass(CHECK).hide();

    var isBlockDetected = false;

    if(container.tagName && (container.tagName.toLowerCase() === 'td' || container.tagName.toLowerCase() === 'th')){
      item('table').hide();
      item('table-unit').show().addClass(CHECK);
    }

    $(container).parents().each(function(){
      var tagName = this.tagName.toLowerCase()
      ,textAlign = this.style.textAlign;

      //文字
      if(tagName === 'b' || tagName === 'strong'){
        item('b').addClass(CHECK)
      }
      if(tagName === 'i' || tagName === 'em'){
        item('i').addClass(CHECK)
      }
      if(tagName === 'u'){
        item('u').addClass(CHECK)
      }
      if(tagName === 'strike'){
        item('d').addClass(CHECK)
      }
      if(tagName === 'sup'){
        item('sup').addClass(CHECK)
      }
      if(tagName === 'sub'){
        item('sub').addClass(CHECK)
      }
      
      //对齐
      if(tagName === 'p'){
        if(textAlign === 'center'){
          item('center').addClass(CHECK);
        } else if(textAlign === 'right'){
          item('right').addClass(CHECK);
        } else {
          item('left').addClass(CHECK);
        }
      }
      
      //超链接
      if(tagName === 'a'){
        item('link').addClass(CHECK);
        item('unlink').removeClass(ABLED);
      }

      if(tagName === 'td' || tagName === 'th'){
        item('table').hide();
        item('table-unit').show().addClass(CHECK);
      }

      if(tagName === 'ol'){
        item('ol').addClass(CHECK);
      }
      if(tagName === 'ul'){
        item('ul').addClass(CHECK);
      }

      if(item('formatblock').find('option[value="'+tagName+'"]').length && !isBlockDetected){
        item('formatblock').find('input[type="text"]').val(item('formatblock').find('option[value="'+tagName+'"]').text());
        isBlockDetected = true;
      }
    });

    if(!isBlockDetected){
      item('formatblock').find('input[type="text"]').val('段落');
    }

    $(container).parent().each(function(){
      var fontSize = parseInt($(this).css('font-size'))
      ,fontColor = $(this).css('color')
      ,backgroundColor = $(this).css('background-color');

      item('font-size').find('input[type="text"]').val(fontSize + 'px');
      item('font-color').find('.layui-colorpicker-trigger-span').css('background-color',fontColor);
      item('background-color').find('.layui-colorpicker-trigger-span').css('background-color',backgroundColor);
    });
  }

  //触发工具
  ,toolActive = function(iframeWin, editor, set){
    var iframeDOM = iframeWin.document
    ,body = $(iframeDOM.body)
    ,toolEvent = {
      //显示HTML
      html: function () {
        layer.confirm('<textarea class="layui-textarea" style="height:100%;resize:none;"></textarea>', {
          title: "编辑HTML",
          btn: ["确认", "取消"],
          area: ["90%", "90%"],
          success: function (layero, index) {
            layero.find("textarea").val(body.html()?body.html():'');
          }
        }, function (index, layero) {
          body.html(layero.find("textarea").val());
          layer.close(index);
        }, function (index) {

        });
      },
      //预览页面
      preview: function () {
        layer.open({
          type: 1, 
          title: '预览',
          content: '<iframe id="preview" src="" style="border:none;width:100%;height:100%;"></iframe>',
          area:['90%','90%'],
          success: function (layero, index) {
            var target = layero.find('#preview').get(0).contentWindow, pHead = target.document.head, pBody = target.document.body;
            var renderer = function(text){
              return text;
            };
            if(set.previewCSS && set.previewCSS.length){
              for(var i = 0; i < set.previewCSS.length; i++){
                $(pHead).append('<link rel="stylesheet" type="text/css" href="./layui/css/layui.css"><link rel="stylesheet" type="text/css" href="' + util.escape(set.previewCSS[i]) + '">');
              }
            }
            if(typeof set.previewRenderer === 'function') renderer = set.previewRenderer;
            pBody.innerHTML = renderer(body.html()) || '';
          }
        });
      },
      //查找与替换
      searchreplace: function () {
        var searchText = '', searchNodeList = [], searchNodeLengthList = [], rangeList = [], curIndex = 0,
        preorderTraversal = function(node){
          var list = [];
          if(!node.childNodes || !node.childNodes.length){
            list.push(node);
          }else{
            var cNode = node.childNodes;
            for(var i=0; i<cNode.length; i++){
              list = list.concat(preorderTraversal(cNode[i]));
            }
          }
          return list;
        },
        updateNodeList = function(){
          searchNodeList = preorderTraversal(body.get(0));
          var tempLengthList = [], tempLength = 0;
          if(searchNodeList.length){
            for(var m in searchNodeList){
              tempLength += (searchNodeList[m].data || searchNodeList[m].innerText).length;
              tempLengthList.push(tempLength);
            }
          }
          searchNodeLengthList = tempLengthList;
        },
        updateSearch = function(){
          if(!searchText || !searchText.length) return;
          rangeList = [];
          var tempStr = '', tempOffset = 0;
          for(var i = 0; i < searchNodeList.length; i++){
            var nodeStr = (searchNodeList[i].data || searchNodeList[i].innerText);
            tempStr += nodeStr;
            var nodeLen = nodeStr.length, position = tempStr.indexOf(searchText, tempOffset);
            while(position > -1){
              var start = position, end = position + searchText.length, startNode = searchNodeList[0], endNode = searchNodeList[i], startOffset = start, endOffset = nodeLen + end - searchNodeLengthList[i];
              for(var j = i-1; j >= 0; j--){
                if(searchNodeLengthList[j] <= start){
                  startNode = searchNodeList[j+1];
                  startOffset = start - searchNodeLengthList[j];
                  break;
                }
              }
              rangeList.push(setRange(iframeDOM, startNode, startOffset, endNode, endOffset));
              tempOffset = end + 1;
              position = tempStr.indexOf(searchText, tempOffset);
            }
          }
        },
        showResult = function(index){
          if(!rangeList.length) return;
          var s = iframeWin.getSelection();
          s.removeAllRanges();
          if(index >= rangeList.length) index = rangeList.length - 1;
          if(index < 0) index = 0;
          s.addRange(rangeList[index]);
          var con = getContainer(rangeList[index]), off = rangeList[index].endOffset;
          while(!con.innerText){
            var tempCon = $(con).parent().get(0);
            for(var i = 0; i < tempCon.childNodes.length; i++){
              if(tempCon.childNodes[i] == con) break;
              off += (tempCon.childNodes[i].data || tempCon.childNodes[i].innerText).length;
            }
            con = tempCon;
          }
          var txt = con.innerText, progress = off / (txt.length + 1),
          scroll = con.offsetTop + con.offsetHeight * progress - editor.find('iframe').height() / 2;
          iframeWin.scrollTo(0, scroll);
        },
        replaceText = function(range, replacement){
          if(range.endContainer.insertData){
            range.endContainer.insertData(range.endOffset, replacement);
          }else{
            range.endContainer.innerText = range.endContainer.innerText.slice(0, range.endOffset) + replacement + range.endContainer.innerText.slice(range.endOffset);
          }
          range.deleteContents();
        };
        layer.confirm(['<div class="layui-form">'
          ,'<div class="layui-form-item">'
          ,'<label class="layui-form-label" style="width: 55px;padding-left:0;">查找</label>'
          ,'<div class="layui-input-block" style="margin-left: 70px"><input type="text" name="search" value="" autofocus="true" autocomplete="off" class="layui-input"></div>'
          ,'</div>'
          ,'<div class="layui-form-item">'
          ,'<label class="layui-form-label" style="width: 55px;padding-left:0;">替换为</label>'
          ,'<div class="layui-input-block" style="margin-left: 70px"><input type="text" name="replace" value="" autofocus="true" autocomplete="off" class="layui-input"></div>'
          ,'</div>'
          ,'</div>'].join(''), {
            title: "查找与替换",
            btn: ["查找", "向上查找", "替换", "全部替换", "关闭"],
            success: function(layero, index){
              updateNodeList();
              layero.find("input[name=\"search\"]").on('input propertychange',function(){
                searchText = $(this).val();
                curIndex = -1;
                updateSearch();
              });
            },
            btn3: function(index, layero){
              if(!rangeList.length || curIndex < 0 || curIndex >= rangeList.length) return false;
              replaceText(rangeList[curIndex], layero.find('input[name="replace"]').val());
              var oriLen = rangeList.length;
              updateNodeList();
              updateSearch();
              if(!rangeList.length) return false;
              if(rangeList.length == oriLen) curIndex += rangeList.length - oriLen + 1;
              curIndex = curIndex % rangeList.length;
              showResult(curIndex);
              return false;
            },
            btn4: function(index, layero){
              for(var i = rangeList.length-1; i >= 0; i--){
                replaceText(rangeList[i], layero.find('input[name="replace"]').val());
              }
              updateNodeList();
              updateSearch();
              return false;
            },
            btn5: function(index, layero){
            }
          }, function (index, layero) {
            curIndex++;
            if(curIndex >= rangeList.length) curIndex = 0;
            showResult(curIndex);
          }, function (index) {
            curIndex--;
            if(curIndex < 0) curIndex = rangeList.length - 1;
            showResult(curIndex);
            return false;
          });
      },
      //超链接
      link: function(range){
        var container = getContainer(range)
        ,parentNode = $(container).parent();
        
        link.call(body, {
          href: parentNode.attr('href')
          ,target: parentNode.attr('target')
        }, function(field){
          var parent = parentNode[0];
          if(parent.tagName === 'A'){
            parent.href = field.url;
          } else {
            insertInline.call(iframeWin, 'a', {
              target: field.target
              ,href: field.url
              ,text: field.url
            }, range);
          }
        });
      }
      //清除超链接
      ,unlink: function(range){
        iframeDOM.execCommand('unlink');
      }
      //表情
      ,face: function(range){
        face.call(this, function(img){
          insertInline.call(iframeWin, 'img', {
            src: img.src
            ,alt: img.alt
          }, range);
        });
      }
      //图片
      ,image: function(range){
        var that = this;
        layui.use('upload', function(upload){
          var uploadImage = set.uploadImage || {};
          if(!uploadImage.url || !uploadImage.type) return;
          uploadImage.done = uploadImage.done || function(res){
            if(res.code == 0){
              res.data = res.data || {};
              insertInline.call(iframeWin, 'img', {
                src: res.data.src
                ,alt: res.data.title
              }, range);
            } else {
              layer.msg(res.msg||'上传失败');
            }
          };
          upload.render({
            url: uploadImage.url
            ,method: uploadImage.type
            ,elem: $(that).find('input')[0]
            ,done: uploadImage.done
          });
        });
      }
      //插入附件
      ,file: function (range) {
        var that = this;
        layui.use('upload', function(upload){
          var uploadFile = set.uploadFile || {};
          if(!uploadFile.url || !uploadFile.type) return;
          uploadFile.done = uploadFile.done || function(res){
            if(res.code == 0){
              res.data = res.data || {};
              insertInline.call(iframeWin, 'a', {
                href: res.data.src
                ,text: res.data.title
                ,target: '_blank'
              }, range);
            } else {
              layer.msg(res.msg||'上传失败');
            }
          };
          upload.render({
            url: uploadFile.url
            ,method: uploadFile.type
            ,accept: "file"
            ,acceptMime: "*/*"
            ,elem: $(that).find('input')[0]
            ,done: uploadFile.done
          });
        });
      }
      //插入代码
      ,code: function(range){
        code.call(body, function(pre){
          insertInline.call(iframeWin, 'pre', {
            text: pre.code
            ,'lay-lang': pre.lang
          }, range);
        });
      }
      //插入表格
      ,table: function (range) {
        layer.confirm(['<div class="layui-form">'
          ,'<div class="layui-form-item">'
          ,'<label class="layui-form-label" style="width: 40px;padding-left:0;">行数</label>'
          ,'<div class="layui-input-block" style="margin-left: 55px"><input type="text" name="row" value="" autofocus="true" autocomplete="off" class="layui-input"></div>'
          ,'</div>'
          ,'<div class="layui-form-item">'
          ,'<label class="layui-form-label" style="width: 40px;padding-left:0;">列数</label>'
          ,'<div class="layui-input-block" style="margin-left: 55px"><input type="text" name="col" value="" autofocus="true" autocomplete="off" class="layui-input"></div>'
          ,'</div>'
          ,'</div>'].join(''), {
            title: "插入表格",
            btn: ["确认", "取消"]
          }, function (index, layero) {
            var rowCount = parseInt(layero.find('input[name="row"]').val()), colCount = parseInt(layero.find('input[name="col"]').val());
            if(isNaN(rowCount) || rowCount < 1) rowCount = 1;
            if(isNaN(colCount) || colCount < 1) colCount = 1;
            var html = '<table><tbody>';
            for(var i = 0; i < rowCount; i++){
              html += '<tr>';
              for(var j = 0; j < colCount; j++){
                html += '<td></td>';
              }
              html += '</tr>';
            }
            html += '</tbody></table>'
            iframeDOM.execCommand('insertHTML', false, html);
            layer.close(index);
          }, function (index) {
          });
      }
      ,setTableUnit: function (range) {
        var container = getContainer(range), parents = $(container).parents(), td = null, tr = null, table = null;
        if(container.tagName && (container.tagName.toLowerCase() === 'th' || container.tagName.toLowerCase() === 'td')){
          td = container;
        }
        parents.each(function(){
          if(this.tagName.toLowerCase() === 'th' || this.tagName.toLowerCase() === 'td'){
            td = this;
          }
          if(this.tagName.toLowerCase() === 'tr'){
            tr = this;
          }
          if(this.tagName.toLowerCase() === 'table'){
            table = this;
          }
        });
        var sameRow = [], sameCol = [], rowOrder = 0, colOrder = 0, temp = 0;
        $(tr).children().each(function(){
          sameRow.push(this);
          if(this == td) colOrder = temp;
          temp++;
        });
        temp = 0;
        $(table).find('tr').each(function(){
          sameCol.push($(this).children().get(colOrder));
          if(this == tr) rowOrder = temp;
          temp++;
        });
        layer.confirm(['<div class="layui-form layui-row">'
          ,'<div class="layui-col-xs12 layui-col-md6"><div class="layui-form-item">'
          ,'<label class="layui-form-label" style="width: 40px;padding-left:0;">行高</label>'
          ,'<div class="layui-input-block" style="margin-left: 55px"><input type="text" name="row-height" value="" autofocus="true" autocomplete="off" class="layui-input" placeholder="auto"></div>'
          ,'</div></div>'
          ,'<div class="layui-col-xs12 layui-col-md6"><div class="layui-form-item">'
          ,'<label class="layui-form-label" style="width: 40px;padding-left:0;">列宽</label>'
          ,'<div class="layui-input-block" style="margin-left: 55px"><input type="text" name="col-width" value="" autofocus="true" autocomplete="off" class="layui-input" placeholder="auto"></div>'
          ,'</div></div>'
          ,'</div>'
          ,'<div class="layui-btn-container">'
          ,'<button type="button" class="layui-btn layui-btn-primary" data-operation="add-above">在上方添加行</button>'
          ,'<button type="button" class="layui-btn layui-btn-primary" data-operation="add-beneath">在下方添加行</button>'
          ,'<button type="button" class="layui-btn layui-btn-primary" data-operation="add-left">在左方添加列</button>'
          ,'<button type="button" class="layui-btn layui-btn-primary" data-operation="add-right">在右方添加列</button>'
          ,'<button type="button" class="layui-btn layui-btn-danger" data-operation="remove-row">删除该行</button>'
          ,'<button type="button" class="layui-btn layui-btn-danger" data-operation="remove-col">删除该列</button>'
          ,'</div>'].join(''), {
            title: "设置单元格",
            btn: ["确认", "取消"],
            success: function(layero, index){
              layero.find('input[name="row-height"]').val(td.style.height);
              layero.find('input[name="col-width"]').val(td.style.width);
              layero.find('button').click(function(){
                var operation = $(this).attr('data-operation');
                switch(operation){
                  case 'add-above':
                  var temp = '';
                  for(var i = 0; i < $(tr).children().length; i++){
                    temp += '<td></td>';
                  }
                  $(tr).before('<tr>'+temp+'</tr>');
                  sameCol.push($($(table).find('tr').get(rowOrder)).children().get(colOrder));
                  rowOrder++;
                  break;
                  case 'add-beneath':
                  var temp = '';
                  for(var i = 0; i < $(tr).children().length; i++){
                    temp += '<td></td>';
                  }
                  $(tr).after('<tr>'+temp+'</tr>');
                  sameCol.push($($(table).find('tr').get(rowOrder + 1)).children().get(colOrder));
                  break;
                  case 'add-left':
                  for(var i = 0; i < sameCol.length; i++){
                    $(sameCol[i]).before('<td></td>');
                  }
                  sameRow.push($(td).parent().children().get(colOrder));
                  colOrder++;
                  break;
                  case 'add-right':
                  for(var i = 0; i < sameCol.length; i++){
                    $(sameCol[i]).after('<td></td>');
                  }
                  sameRow.push($(td).parent().children().get(colOrder + 1));
                  break;
                  case 'remove-row':
                  if($(table).find('tr').length <= 1){
                    $(table).remove();
                  }else{
                    $(tr).remove();
                  }
                  layer.close(index);
                  break;
                  case 'remove-col':
                  if($(tr).children().length <= 1){
                    $(table).remove();
                  }else{
                    for(var i = 0; i < sameCol.length; i++){
                      $(sameCol[i]).remove();
                    }
                  }
                  layer.close(index);
                  break;
                }
              });
            }
          }, function (index, layero) {
            var rowHeight = layero.find('input[name="row-height"]').val(), colWidth = layero.find('input[name="col-width"]').val(), i;
            for(i = 0; i < sameRow.length; i++){
              $(sameRow[i]).css('height',rowHeight);
            }
            for(i = 0; i < sameCol.length; i++){
              $(sameCol[i]).css('width',colWidth);
            }
            layer.close(index);
          }, function (index) {
          });
}
      //帮助
      ,help: function(){
        layer.open({
          type: 2
          ,title: '帮助'
          ,area: ['600px', '380px']
          ,shadeClose: true
          ,shade: 0.1
          ,skin: 'layui-layer-msg'
          ,content: ['http://www.layui.com/about/layedit/help.html', 'no']
        });
      }
    }
    ,tools = editor.find('.layui-layedit-tool')
    
    ,click = function(event){
      var othis = $(this)
      ,events = event || othis.attr('layedit-event')
      ,command = othis.attr('lay-command')
      ,customEvent = othis.attr('layedit-custom-event');
      
      if(othis.hasClass(ABLED)) return;

      body.focus();
      
      var range = Range(iframeDOM)
      ,container = range.commonAncestorContainer
      
      if(command){
        iframeDOM.execCommand(command);
        if(/justifyLeft|justifyCenter|justifyRight/.test(command)){
          iframeDOM.execCommand('formatBlock', false, '<p>');
        }
        setTimeout(function(){
          body.focus();
        }, 10);
      } else if(customEvent && set.customBtn[customEvent] && set.customBtn[customEvent].click) {
        set.customBtn[customEvent].click(iframeWin, range);
      } else {
        toolEvent[events] && toolEvent[events].call(this, range);
      }
      toolCheck.call(iframeWin, tools, othis);
    }
    
    ,isClick = /image/

    tools.find('>i').on('mousedown', function(){
      var othis = $(this)
      ,events = othis.attr('layedit-event');
      if(isClick.test(events)) return;
      click.call(this)
    }).on('click', function(){
      var othis = $(this)
      ,events = othis.attr('layedit-event');
      if(!isClick.test(events)) return;
      click.call(this)
    });
    
    //触发内容区域
    body.on('click', function(){
      toolCheck.call(iframeWin, tools);
      layer.close(face.index);
    });
  }
  
  //超链接面板
  ,link = function(options, callback){
    var body = this, index = layer.open({
      type: 1
      ,id: 'LAY_layedit_link'
      ,area: '350px'
      ,shade: 0.05
      ,shadeClose: true
      ,moveType: 1
      ,title: '超链接'
      ,skin: 'layui-layer-msg'
      ,content: ['<ul class="layui-form" style="margin: 15px;">'
      ,'<li class="layui-form-item">'
      ,'<label class="layui-form-label" style="width: 60px;">URL</label>'
      ,'<div class="layui-input-block" style="margin-left: 90px">'
      ,'<input name="url" lay-verify="url" value="'+ (options.href||'') +'" autofocus="true" autocomplete="off" class="layui-input">'
      ,'</div>'
      ,'</li>'
      ,'<li class="layui-form-item">'
      ,'<label class="layui-form-label" style="width: 60px;">打开方式</label>'
      ,'<div class="layui-input-block" style="margin-left: 90px">'
      ,'<input type="radio" name="target" value="_self" class="layui-input" title="当前窗口"'
      + ((options.target==='_self' || !options.target) ? 'checked' : '') +'>'
      ,'<input type="radio" name="target" value="_blank" class="layui-input" title="新窗口" '
      + (options.target==='_blank' ? 'checked' : '') +'>'
      ,'</div>'
      ,'</li>'
      ,'<li class="layui-form-item" style="text-align: center;">'
      ,'<button type="button" lay-submit lay-filter="layedit-link-yes" class="layui-btn"> 确定 </button>'
      ,'<button style="margin-left: 20px;" type="button" class="layui-btn layui-btn-primary"> 取消 </button>'
      ,'</li>'
      ,'</ul>'].join('')
      ,success: function(layero, index){
        var eventFilter = 'submit(layedit-link-yes)';
        form.render('radio');  
        layero.find('.layui-btn-primary').on('click', function(){
          layer.close(index);
          body.focus();
        });
        form.on(eventFilter, function(data){
          layer.close(link.index);
          callback && callback(data.field);
        });
      }
    });
    link.index = index;
  }
  
  //表情面板
  ,face = function(callback){
    //表情库
    var faces = function(){
      var alt = ["[微笑]", "[嘻嘻]", "[哈哈]", "[可爱]", "[可怜]", "[挖鼻]", "[吃惊]", "[害羞]", "[挤眼]", "[闭嘴]", "[鄙视]", "[爱你]", "[泪]", "[偷笑]", "[亲亲]", "[生病]", "[太开心]", "[白眼]", "[右哼哼]", "[左哼哼]", "[嘘]", "[衰]", "[委屈]", "[吐]", "[哈欠]", "[抱抱]", "[怒]", "[疑问]", "[馋嘴]", "[拜拜]", "[思考]", "[汗]", "[困]", "[睡]", "[钱]", "[失望]", "[酷]", "[色]", "[哼]", "[鼓掌]", "[晕]", "[悲伤]", "[抓狂]", "[黑线]", "[阴险]", "[怒骂]", "[互粉]", "[心]", "[伤心]", "[猪头]", "[熊猫]", "[兔子]", "[ok]", "[耶]", "[good]", "[NO]", "[赞]", "[来]", "[弱]", "[草泥马]", "[神马]", "[囧]", "[浮云]", "[给力]", "[围观]", "[威武]", "[奥特曼]", "[礼物]", "[钟]", "[话筒]", "[蜡烛]", "[蛋糕]"], arr = {};
      layui.each(alt, function(index, item){
        arr[item] = layui.cache.dir + 'images/face/'+ index + '.gif';
      });
      return arr;
    }();
    face.hide = face.hide || function(e){
      if($(e.target).attr('layedit-event') !== 'face'){
        layer.close(face.index);
      }
    }
    return face.index = layer.tips(function(){
      var content = [];
      layui.each(faces, function(key, item){
        content.push('<li title="'+ key +'"><img src="'+ item +'" alt="'+ key +'"></li>');
      });
      return '<ul class="layui-clear">' + content.join('') + '</ul>';
    }(), this, {
      tips: 1
      ,time: 0
      ,skin: 'layui-box layui-util-face'
      ,maxWidth: 500
      ,success: function(layero, index){
        layero.css({
          marginTop: -4
          ,marginLeft: -10
        }).find('.layui-clear>li').on('click', function(){
          callback && callback({
            src: faces[this.title]
            ,alt: this.title
          });
          layer.close(index);
        });
        $(document).off('click', face.hide).on('click', face.hide);
      }
    });
  }
  
  //插入代码面板
  ,code = function(callback){
    var body = this, index = layer.open({
      type: 1
      ,id: 'LAY_layedit_code'
      ,area: '550px'
      ,shade: 0.05
      ,shadeClose: true
      ,moveType: 1
      ,title: '插入代码'
      ,skin: 'layui-layer-msg'
      ,content: ['<ul class="layui-form layui-form-pane" style="margin: 15px;">'
      ,'<li class="layui-form-item">'
      ,'<label class="layui-form-label">请选择语言</label>'
      ,'<div class="layui-input-block">'
      ,'<select name="lang">'
      ,'<option value="JavaScript">JavaScript</option>'
      ,'<option value="HTML">HTML</option>'
      ,'<option value="CSS">CSS</option>'
      ,'<option value="Java">Java</option>'
      ,'<option value="PHP">PHP</option>'
      ,'<option value="C#">C#</option>'
      ,'<option value="Python">Python</option>'
      ,'<option value="Ruby">Ruby</option>'
      ,'<option value="Go">Go</option>'
      ,'</select>'
      ,'</div>'
      ,'</li>'
      ,'<li class="layui-form-item layui-form-text">'
      ,'<label class="layui-form-label">代码</label>'
      ,'<div class="layui-input-block">'
      ,'<textarea name="code" lay-verify="required" autofocus="true" class="layui-textarea" style="height: 200px;"></textarea>'
      ,'</div>'
      ,'</li>'
      ,'<li class="layui-form-item" style="text-align: center;">'
      ,'<button type="button" lay-submit lay-filter="layedit-code-yes" class="layui-btn"> 确定 </button>'
      ,'<button style="margin-left: 20px;" type="button" class="layui-btn layui-btn-primary"> 取消 </button>'
      ,'</li>'
      ,'</ul>'].join('')
      ,success: function(layero, index){
        var eventFilter = 'submit(layedit-code-yes)';
        form.render('select');  
        layero.find('.layui-btn-primary').on('click', function(){
          layer.close(index);
          body.focus();
        });
        form.on(eventFilter, function(data){
          layer.close(code.index);
          callback && callback(data.field);
        });
      }
    });
    code.index = index;
  }
  
  //全部工具
  ,tools = {
    html: '<i class="layui-icon layedit-tool-html" title="HTML源代码" layedit-event="html">&#xe64b;</i>'
    ,preview: '<i class="layui-icon layedit-tool-preview" title="预览" layedit-event="preview">&#xe663;</i>'
    ,undo: '<i class="layui-icon layedit-tool-undo" title="撤销" lay-command="undo" style="transform: rotateY(180deg);-ms-transform:rotateY(180deg);-moz-transform:rotateY(180deg);-webkit-transform:rotateY(180deg);-o-transform:rotateY(180deg);">&#xe666;</i>'
    ,redo: '<i class="layui-icon layedit-tool-redo" title="重做" lay-command="redo">&#xe666;</i>'
    ,selectall: '<i class="layui-icon layedit-tool-selectall" title="全选" lay-command="selectAll">&#xe63c;</i>'
    ,searchreplace: '<i class="layui-icon layedit-tool-searchreplace" title="查找与替换" layedit-event="searchreplace">&#xe615;</i>'
    ,strong: '<i class="layui-icon layedit-tool-b" title="加粗" lay-command="Bold" layedit-event="b">&#xe62b;</i>'
    ,italic: '<i class="layui-icon layedit-tool-i" title="斜体" lay-command="italic" layedit-event="i">&#xe644;</i>'
    ,underline: '<i class="layui-icon layedit-tool-u" title="下划线" lay-command="underline" layedit-event="u">&#xe646;</i>'
    ,del: '<i class="layui-icon layedit-tool-d" title="删除线" lay-command="strikeThrough" layedit-event="d">&#xe64f;</i>'
    ,superscript: '<i class="layui-icon layedit-tool-sup" title="上标" lay-command="superscript" layedit-event="sup" style="line-height:2;">x<sup>2</sup></i>'
    ,subscript: '<i class="layui-icon layedit-tool-sub" title="下标" lay-command="subscript" layedit-event="sub" style="line-height:2;">x<sub>2</sub></i>'
    ,hr: '<i class="layui-icon layedit-tool-hr" title="水平分割线" lay-command="insertHorizontalRule" style="line-height:2;">—</i>'
    ,removeformat: '<i class="layui-icon layedit-tool-removeformat" title="清除效果" lay-command="removeformat">&#xe616;</i>'
    
    ,'|': '<span class="layedit-tool-mid"></span>'
    
    ,left: '<i class="layui-icon layedit-tool-left" title="左对齐" lay-command="justifyLeft" layedit-event="left">&#xe649;</i>'
    ,center: '<i class="layui-icon layedit-tool-center" title="居中对齐" lay-command="justifyCenter" layedit-event="center">&#xe647;</i>'
    ,right: '<i class="layui-icon layedit-tool-right" title="右对齐" lay-command="justifyRight" layedit-event="right">&#xe648;</i>'
    ,ol: '<i class="layui-icon layedit-tool-ol" title="有序列表" lay-command="insertOrderedList" layedit-event="ol" style="position:relative;"><div style="position:absolute;top:0;bottom:50%;left:0;right:0;font-size:10px;line-height:1.75;">1.—</div><div style="position:absolute;top:50%;bottom:0;left:0;right:0;font-size:10px;line-height:1.25;">2.—</div></i>'
    ,ul: '<i class="layui-icon layedit-tool-ul" title="无序列表" lay-command="insertUnorderedList" layedit-event="ul" style="position:relative;"><div style="position:absolute;top:0;bottom:50%;left:0;right:0;font-size:10px;line-height:1.75;">· —</div><div style="position:absolute;top:50%;bottom:0;left:0;right:0;font-size:10px;line-height:1.25;">· —</div></i>'
    ,formatblock: '<div class="layedit-tool-formatblock" style="display:inline-block;width:8rem;vertical-align: bottom;font-size:1rem;margin:0 5px;" title="字体格式"><select lay-filter="layedit-formatblock-{{index}}">{{formatblock-options}}</select></div>'
    ,fontsize: '<div class="layedit-tool-font-size" style="display:inline-block;width:8rem;vertical-align: bottom;font-size:1rem;margin:0 5px;" title="字体大小"><select lay-filter="layedit-font-size-{{index}}">{{font-size-options}}</select></div>'
    ,fontcolor: '<div class="layedit-tool-font-color" style="display:inline-block;vertical-align: bottom;margin:0 5px;" title="文字颜色"><div id="layedit-font-color-{{index}}"></div></div>'
    ,backgroundcolor: '<div class="layedit-tool-background-color" style="display:inline-block;vertical-align: bottom;margin:0 5px;" title="背景颜色"><div id="layedit-background-color-{{index}}"></div></div>'
    ,link: '<i class="layui-icon layedit-tool-link" title="插入链接" layedit-event="link">&#xe64c;</i>'
    ,unlink: '<i class="layui-icon layedit-tool-unlink layui-disabled" title="清除链接" lay-command="unlink" layedit-event="unlink">&#xe64d;</i>'
    ,face: '<i class="layui-icon layedit-tool-face" title="插入表情" layedit-event="face">&#xe650;</i>'
    ,table: '<i class="layui-icon layedit-tool-table" title="插入表格" layedit-event="table" style="font-size:24px;">&#xe62d;</i><i class="layui-icon layedit-tool-table-unit" title="设置单元格" layedit-event="setTableUnit" style="font-size:20px;display:none;">&#xe610;</i>'
    ,image: '<i class="layui-icon layedit-tool-image" title="插入图片" layedit-event="image">&#xe64a;<input type="file" name="file"></i>'
    ,file: '<i class="layui-icon layedit-tool-file" title="插入文件" layedit-event="file">&#xe655;<input type="file" name="file" style="position: absolute;font-size: 0;left: 0;top: 0;width: 100%;height: 100%;opacity: .01;filter: Alpha(opacity=1);cursor: pointer;"></i>'
    ,code: '<i class="layui-icon layedit-tool-code" title="插入代码" layedit-event="code">&#xe64e;</i>'
    
    ,help: '<i class="layui-icon layedit-tool-help" title="帮助" layedit-event="help">&#xe607;</i>'
  }
  
  ,edit = new Edit();

  exports(MOD_NAME, edit);
});
