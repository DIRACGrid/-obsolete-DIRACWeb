function generateURL(data,title,subtitle){
  var setup = gPageDescription.selectedSetup;
  var group = gPageDescription.userData.group;
  if((title != null) || (title != '')){
    data = data + '&title=' + title;
  }
  if(subtitle == undefined){
    subtitle = ''; // Hack. For some reason subtitle != undefined doesn't work with OR
  }
  if((subtitle != null) || (subtitle != '')){
    subtitle = subtitle.replace(/;/g,'[semicomma]');
    data = data + '&subtitle=' + subtitle;
  }
  var html = location.protocol + '//' + location.host + '/DIRAC/' + setup + '/' + group + '/jobs/Common/getImage?' + data + '&plotType=pieGraph';
  return html
}
function smartSize(mode){
  var width = 300;
  var height = 220;
  var gsize = gMainLayout.getSize();
  if(gsize){
    if(gsize.width){
      if((gsize.width > 300)&&(gsize.width < 820)){
        width = (gsize.width/1) - 20;
      }else if((gsize.width > 820)&&(gsize.width < 1280)){
        width = 814;
      }else if(gsize.width > 1280){
        width = (2*(gsize.width/1))/3;
      }
    }
    if(gsize.height){
      if((gsize.height > 220)&&(gsize.height < 680)){
        height = (gsize.height/1) - 20;
      }else if((gsize.height > 680)&&(gsize.height < 1040)){
        height = 658;
      }else if(gsize.height > 1040){
        height = (2*(gsize.height/1))/3;
      }
    }
  }
  width = Math.round(width);
  height = Math.round(height);
  var size = {'width':width,'height':height};
  if(mode){
    if(mode=='width'){
      size = width;
    }else if(mode=='height'){
      size = height;
    }
  }
  return size
}
function picObject(id){
  var obj = {}
  obj[ id+'_title' ] = '';
  obj[ id+'_subtitle' ] = '';
  obj[ id+'_width' ] = 800;
  obj[ id+'_height' ] = 600;
  obj[ id+'_legend' ] = 'True';
  obj[ id+'_legend_position' ] = 'bottom';
  obj[ id+'_legend_width' ] = 780;
  obj[ id+'_legend_height' ] = 120;
  obj[ id+'_legend_padding' ] = 20;
  obj[ id+'_limit_labels' ] = 15;
  obj[ id+'_legend_max_rows' ] = 99;
  obj[ id+'_legend_max_columns' ] = 4;
  obj[ id+'_title_size' ] = 15;
  obj[ id+'_subtitle_size' ] = 10;
  obj[ id+'_plot_title_size' ] = 12;
  obj[ id+'_text_size' ] = 8;
  obj[ id+'_title_padding' ] = 10;
  obj[ id+'_subtitle_padding' ] = 5;
  obj[ id+'_text_padding' ] = 5;
  obj[ id+'_figure_padding' ] = 12;
  obj[ id+'_plot_padding' ] = 1;
  return obj
}
function genericText(name,fieldLabel,value){
  var emptyText = value;
  if(name == 'title'){
    emptyText = 'Title:';
  }
  if(name == 'subtitle'){
    emptyText = 'Subitle:';
  }
  var textField = new Ext.form.TextField({
    anchor:'-10'
    ,allowBlank:true
    ,emptyText:emptyText
    ,enableKeyEvents:true
    ,fieldLabel:fieldLabel
    ,mode:'local'
    ,name:name
    ,selectOnFocus:true
    ,value:value
  });
  textField.ref = 'xxx'; 
  return textField;
}
function genericCombo(name,fieldLabel,value,data){
  var store = new Ext.data.SimpleStore({
    fields:['number']
    ,data:data
  });
  var combo = new Ext.form.ComboBox({
    anchor:'-10'
    ,allowBlank:false
    ,displayField:'number'
    ,editable:false
    ,fieldLabel:fieldLabel
//    ,id:name
    ,mode:'local'
    ,name:name
    ,selectOnFocus:true
    ,store:store
    ,triggerAction:'all'
    ,typeAhead:true
    ,value:value
  });
  return combo
}
function drawPlot(data,title){
  var pre = Ext.id();
  var obj = picObject(pre);
  if(title){
    obj[pre+'_title'] = title;
  }
  var size = smartSize();
  var htmlWidth = size.width - 14;
  var htmlHeight = size.height - 58;
  var html = generateURL(data,title);
  html = html + '&width=' + htmlWidth + '&height=' + htmlHeight;
  html = '<img src="' + html + '">';
  var bbar = [{
    emptyText:'Title:'
    ,id:pre+'_title_cmp'
    ,name:'title'
    ,value:obj[pre+'_title']
    ,xtype:'textfield'
    ,width:'120'
  },'->',{
    emptyText:'Subtitle:'
    ,id:pre+'_subtitle_cmp'
    ,name:'subtitle'
    ,value:obj[pre+'_subtitle']
    ,xtype:'textfield'
    ,width:'120'
  },'->',{
    cls:"x-btn-icon"
    ,handler:function(){
      var width = window.getInnerWidth();
      var height = window.getInnerHeight();
      var title = Ext.getCmp(pre+'_title_cmp').getRawValue();
      var subtitle = Ext.getCmp(pre+'_subtitle_cmp').getRawValue();
      obj[pre+'_title'] = title;
      obj[pre+'_subtitle'] = subtitle;
      obj[pre+'_width'] = width;
      obj[pre+'_height'] = height;
      var html = generateURL(data,title,subtitle);
      html = html + '&width=' + width + '&height=' + height;
      html = '<img src="' + html + '">';
      window.body.update(html);
    }
    ,id:pre+'_regen'
    ,icon:gURLRoot+'/images/iface/reschedule.gif'
    ,minWidth:'20'
    ,tooltip:'Click to regenerate the plot using data in textboxes'
  },{
    cls:"x-btn-icon"
    ,handler:function(){
      var title = Ext.getCmp(pre+'_title_cmp').getRawValue();
      var subtitle = Ext.getCmp(pre+'_subtitle_cmp').getRawValue();
      obj[pre+'_title'] = title;
      obj[pre+'_subtitle'] = subtitle;
      obj[pre+'_width'] = window.getInnerWidth();
      obj[pre+'_height'] = window.getInnerHeight();
      showChange(pre,data,obj)
    }
    ,id:pre+'_tune'
    ,icon:gURLRoot+'/images/iface/gear.gif'
    ,tooltip:'Click for fine tuning of a plot'
  }];
  var window = new Ext.Window({
    border:true
    ,bbar:bbar
    ,closable:true
    ,collapsible:true
    ,constrain:true
    ,constrainHeader:true
    ,html:html
    ,iconCls:'icon-grid'
    ,id:pre+'_DISPLAY'
    ,maximizable:true
    ,minHeight:220
    ,minWidth:300
    ,plain:true
    ,shim:false
    ,title:title
  });
  window.on(('render','resize'),function(){
    var innerW = window.getInnerWidth();
    var innerH = window.getInnerHeight();
    var bbar = window.getBottomToolbar();
    if(bbar){
      var size = bbar.getSize();
      width = (size.width - 60)/2;
      Ext.getCmp(pre+'_title_cmp').setWidth(width);
      Ext.getCmp(pre+'_subtitle_cmp').setWidth(width);
    }
    if(window.body.dom.firstChild){
      window.body.dom.firstChild.width = innerW;
      window.body.dom.firstChild.height = innerH;
    }
  });
  window.on('close',function(){
    delete obj;
  });
  window.show();
  window.setSize(size);
}
function showChange(id,data,obj){
  var img_id = id + '_DISPLAY';
  var widthText = genericText('width','Plot Width',obj[id+'_width']);
  var heightText = genericText('height','Plot Height',obj[id+'_height']);
  var general = new Ext.form.FieldSet({
    autoHeight:true
    ,bodyStyle:'padding: 5px'
    ,collapsible:false
    ,defaultType:'textfield'
    ,items:[
      genericText('title','Title',obj[id+'_title'])
      ,genericText('subtitle','Subtitle',obj[id+'_subtitle'])
      ,widthText
      ,heightText
    ]
    ,labelWidth:65
    ,monitorResize:true
    ,title:'General Settings'
  });
  var leg = new Ext.form.FieldSet({
    autoHeight:true
    ,bodyStyle:'padding: 5px'
    ,collapsible:true
    ,defaultType:'textfield'
    ,items:[
      genericCombo('legend','Legend enabled',obj[id+'_legend'],[['True'],['False']])
      ,genericCombo('legend_position','Legend position',obj[id+'_legend_position'],[['bottom'],['left'],['right']])
      ,genericText('legend_width','Legend width',obj[id+'_legend_width'])
      ,genericText('legend_height','Legend height',obj[id+'_legend_height'])
      ,genericText('legend_padding','Legend padding',obj[id+'_legend_padding'])
      ,genericText('limit_labels','Number of labels',obj[id+'_limit_labels'])
      ,genericText('legend_max_rows','Number of rows',obj[id+'_legend_max_rows'])
      ,genericText('legend_max_columns','Number of columns',obj[id+'_legend_max_columns'])
    ]
    ,labelWidth:110
    ,monitorResize:true
    ,title:'Legend Size & Position',
  });
  var font_size = new Ext.form.FieldSet({
    autoHeight:true
    ,bodyStyle:'padding: 5px'
    ,collapsible:true
    ,defaultType:'textfield'
    ,items:[
      genericText('title_size','Title size',obj[id+'_title_size'])
      ,genericText('subtitle_size','Subtitle size',obj[id+'_subtitle_size'])
      ,genericText('plot_title_size','Plot title size',obj[id+'_plot_title_size'])
      ,genericText('text_size','Text size',obj[id+'_text_size'])
//      ,genericText('font','','Lucida Grande')
//      ,genericText('font_family','','sans-serif')
    ]
    ,labelWidth:80
    ,monitorResize:true
    ,title:'Font size'
  });
  var text_padding = new Ext.form.FieldSet({
    autoHeight:true
    ,bodyStyle:'padding: 5px'
    ,collapsible:true
    ,defaultType:'textfield'
    ,items:[
      genericText('title_padding','Title padding',obj[id+'_title_padding'])
      ,genericText('subtitle_padding','Subtitle padding',obj[id+'_subtitle_padding'])
      ,genericText('text_padding','Text padding',obj[id+'_text_padding'])
      ,genericText('figure_padding','Figure padding',obj[id+'_figure_padding'])
      ,genericText('plot_padding','Plot padding',obj[id+'_plot_padding'])
    ]
    ,monitorResize:true
    ,title:'Text padding'
  });
  var misc = new Ext.form.FieldSet({
    autoHeight:true
    ,bodyStyle:'padding: 5px'
    ,collapsible:true
    ,defaultType:'textfield'
    ,items:[
      genericCombo('graph_time_stamp','Time stamp','True',[['True'],['False']]) // Dropdown true-false
      ,genericText('plot_grid','Gird','1:1') // Dropdown?
      ,genericCombo('frame','Show frame','On',[['On'],['Off']]) // Dropdown on-off
      ,genericText('dpi','DPI','',100)
      ,genericCombo('square_axis','Axis','True',[['True'],['False']]) // Dropdown true-false
    ]
    ,monitorResize:true
    ,title:'Misc'
  });
  var button = new Ext.Button({
    cls:'x-btn-text-icon'
    ,handler:function(){
      var query = '';
      var length = win.items.getCount();
      for(var i=0; i<length; i++){
        var k = win.getComponent(i);
        var tmpLength = k.items.getCount();
        for(var j=0; j<length; j++){
          var c = k.getComponent(j);
          if(c){
            var value = c.getValue();
            if(c.getRawValue() != c.emptyText){
              query = query + '&' + c.name + '=' + value;
            }
          }
        }
      }
      win.close();
      var tmpWin = Ext.getCmp(img_id);
      var tmpWidth = widthText.getRawValue();
      var tmpHeight = heightText.getRawValue();
      tmpWidth = tmpWidth/1;
      tmpHeight = tmpHeight/1;
      tmpWidth = tmpWidth+14;
      tmpHeight = tmpHeight+58;
      var size = gMainLayout.getSize();
      if(size){
        if((size.width) && (tmpWidth > size.width)){
          tmpWidth = size.width - 10;
        }
        if((size.height) && (tmpHeight > size.height)){
          tmpHeight = size.height - 10;
        }
      }
      var html = generateURL(data);
      html = html + query;
      if((tmpWidth)||(tmpHeight)){
        html = html + '&width=' + tmpWidth + '&height=' + tmpHeight;
      }
      html = '<img src="' + html + '">';
      tmpWin.setSize(tmpWidth,tmpHeight);
      tmpWin.body.update(html);
    }
    ,icon:gURLRoot+'/images/iface/reschedule.gif'
    ,text:'Regenerate'
    ,tooltip:'Click to regenerate the plot using data in textboxes'
  });
  var win = new Ext.Window({
    autoScroll:true
    ,bodyStyle:'padding: 5px'
    ,buttonAlign:'center'
    ,buttons:[button]
    ,collapsible:true
    ,constrain:true
    ,constrainHeader:true
    ,items:[general,leg,font_size,text_padding]
    ,maximizable:true
    ,minHeight:240
    ,minWidth:320
    ,modal:true
    ,monitorResize:true
    ,title:'Advanced options'
  });
  win.on('resize',function(){
    win.doLayout();
  });
  win.show();
  win.setSize(500,500);
}
