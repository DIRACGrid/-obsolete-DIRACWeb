function createRadioBox( elName, elLabel, elValue, elChecked )
{
 var radioBox = new Ext.form.Radio( {
 anchor : '90%',
 boxLabel: elLabel,
 hiddenName : elName,
 hideLabel : true,
 name : elName,
 selectOnFocus : true,
 triggerAction : 'all',
 value : elValue,
 checked : elChecked
 } );
 radioBox.on({
   'check':function(){
      if(siteMapGreenLight){
        if(radioBox.checked){
          activateLayer_SM(radioBox.value);
        }
      }
    }
 })
 return radioBox;
}
function createRadioBoxPanel( elName, elLabel, elValues )
{
 var panelItems = [];
 for( var i = 0; i < elValues.length; i++ )
 {
 panelItems.push( createRadioBox( elName, elValues[i][1], elValues[i][0], elValues[i][2] ) );
 }

 var radioPanel = new Ext.form.FieldSet( {
 anchor : '90%',
 title : elLabel,
 name : elName + "-autopanel",
 collapsible : true,
 autoHeight : true,
 collapsed : false,
 triggerAction : 'all',
 items : panelItems,
 } );

 return radioPanel;
}
function legend(){
  var panel = new Ext.Panel({
    id:'legendPanel',
    margins:'2 0 2 2',
    cmargins:'2 2 2 2',
    bodyStyle:'padding: 5px',
  })
  return panel
}
function selectPanel(){
  var panel = new Ext.Panel({
    autoScroll:true,
    id:'mapPanel',
    labelAlign:'top',
    split:true,
    region:'west',
    collapsible:true,
    width: 200,
    minWidth: 200,
    margins:'2 0 2 2',
    cmargins:'2 2 2 2',
    bodyStyle:'padding: 5px',
    buttonAlign:'left',
    waitMsgTarget:true,
    title:'DIRAC Map'
  })
  return panel
}
function sideBar(){
  var panel = new Ext.Panel({
    autoScroll:true,
    bbar:[
      {
        cls:"x-btn-text-icon",
        handler:function(){refreshSelect()},
        icon:gURLRoot+'/images/iface/refresh.gif',
        tooltip:'Click to refresh data in the selection boxes',
        text:'Refresh'
      },
      '->',
      {
        handler:function(){showURL()},
        tooltip:'Click to get an full URL for current page',
        text:'URL'
      }
    ],
    id:'sideBar',
    split:true,
    region:'west',
    collapsible:true,
    width: 200,
    minWidth: 200,
    margins:'2 0 2 2',
    cmargins:'2 2 2 2',
    buttonAlign:'left',
    title:'DIRAC SideBar',
    layout:'accordion',
    layoutConfig: {
      titleCollapse:true,
      activeOnTop:false,
      border:true
    }
  })
  return panel
}
function siteControl(siteName){
  if((siteName == null) || (siteName == '')){
    alert('Error: Site name value is missing or empty');
    return
  }
  function submitForm(action){
    if((action == null) || (action == '')){
      alert('Error: action value is missing or empty');
      return
    }else{
      params = 'action=' + action + '&siteName=' + siteName;
    }
    var test = control.getForm().getValues(); 
    if(test.comment.length <= 0){
      alert('Error: Comments field is empty');
      return
    }
    panel.body.mask('Sending data...');
    control.form.submit({
      params:params,
      success:function(form,action){
        panel.body.unmask();
        panel.setActiveTab(info);
      },
      failure:function(form,action){
        panel.body.unmask();
        alert('Error: ' + action.response.statusText);
      }
    });
  }
  var textfield = new Ext.form.TextArea({
    xtype:'textarea',
    id:'comment',
    fieldLabel:'Comments',
    height:'200',
    anchor:'100%'  
  })
  var ban = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      submitForm('ban');
    },
    icon:gURLRoot+'/images/iface/ban.gif',
    minWidth:'70',
    tooltip:'Click to ban the site',
    text:'Ban Site'
  });
  var unban = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      submitForm('unban');
    },
    icon:gURLRoot+'/images/iface/unban.gif',
    minWidth:'70',
    tooltip:'Click to unban the site',
    text:'Allow Site'
  });
  var jobs = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      jump('site',siteName);
    },
    icon:gURLRoot+'/images/iface/jump.gif',
    minWidth:'70',
    tooltip:'Click for transfer to the JobMonitoring page',
    text:'Show Jobs'
  });
  var control = new Ext.form.FormPanel({
    bodyStyle:'padding:15px',
    buttons:[ban,unban,jobs],
    items:[textfield],
    labelAlign:'top',
    method:'POST',
    title:'Controls',
    url:'act'
  });
  control.on('resize',function(){
    var h = control.getInnerHeight() - 50;
    textfield.setHeight(h);
  })

  var infoTable = new Ext.grid.GridPanel({
    store: new Ext.data.SimpleStore({
      baseParams:{siteName:siteName},
      fields: ['Status',{name:'Date',type:'date',dateFormat:'Y-n-j h:i:s'},'Owner','Text'],
      sortInfo:{field:'Date',direction:'DESC'},
      url:'info'
    }),
    columns: [
      {header:'',width:10,sortable:false,dataIndex:'Status',renderer:status,hideable:false},
      {header:'Status',sortable:true,dataIndex:'Status',align:'left'},
      {header:'Date [UTC]',sortable:true,renderer:Ext.util.Format.dateRenderer('Y-m-d H:i'),dataIndex:'Date'},
      {header:'Author',sortable:true,dataIndex:'Owner',align:'left'},
      {header:'Comment',sortable:false,dataIndex:'Text',align:'left'}
    ],
    autoHeight:false,
    autoWidth:true,
    id:'logTable',
    labelAlign:'left',
    loadMask:true,
    margins:'2 2 2 2',
    title:'',
    viewConfig:{forceFit:true}
  });

  var info = new Ext.Panel({
    autoScroll:true,
    margins:'2 0 2 2',
    cmargins:'2 2 2 2',
    items:[infoTable],
    title:'Information',
    layout:'fit'
  })
  info.on('activate',function(){
    infoTable.store.load();
  });
  var day = new Ext.Panel({
    autoLoad:{
      url:'action',
      params:'siteName=' + siteName + '&timeSpan=month&type=jobsBySite',
      text:"Loading...",
      callback:function(panel,success,response){
        if(success){
          var html = '';
          var jsonData = Ext.util.JSON.decode(response.responseText);
          if(jsonData.error){
            html = '<h1>' + jsonData.error + '</h1>';
          }else if(jsonData.result){
            var addres = location.protocol + '//' +  location.hostname + gURLRoot + '/';
            var fullsize = jsonData.result;
            fullsize = addres + 'systems/accountingPlots/getPlotImg?file=' + fullsize;
            html = html + '<img src="';
            html = html + fullsize + '" />';
          }else{
            html = '<h1>Unable to decode server response</h1>';
          }
          panel.update(html);
          if(day.body.dom.firstChild){
            day.body.dom.firstChild.width = day.getInnerWidth() - 10;
            day.body.dom.firstChild.height = day.getInnerHeight() - 10;
          }
        }
      }
    },
    autoScroll:true,
    bodyStyle:'padding: 5px',
    layout:'fit',
    html:'Loading',
    title:'Jobs by Site'
  })
  var week = new Ext.Panel({
    autoLoad:{
      url:'action',
      params:'siteName=' + siteName + '&timeSpan=month&type=jobCPUbySite',
      text:"Loading...",
      callback:function(panel,success,response){
        if(success){
          var html = '';
          var jsonData = Ext.util.JSON.decode(response.responseText);
          if(jsonData.error){
            html = '<h1>' + jsonData.error + '</h1>';
          }else if(jsonData.result){
            var addres = location.protocol + '//' +  location.hostname + gURLRoot + '/';
            var fullsize = jsonData.result;
            fullsize = addres + 'systems/accountingPlots/getPlotImg?file=' + fullsize;
            html = html + '<img src="';
            html = html + fullsize + '" />';
          }else{
            html = '<h1>Unable to decode server response</h1>';
          }
          panel.update(html);
          if(week.body.dom.firstChild){
            week.body.dom.firstChild.width = week.getInnerWidth() - 10;
            week.body.dom.firstChild.height = week.getInnerHeight() - 10;
          }
        }
      }
    },
    autoScroll:true,
    bodyStyle:'padding: 5px',
    layout:'fit',
    html:'Loading',
    title:'Job CPU efficiency'
  })
  var month = new Ext.Panel({
    autoLoad:{
      url:'action',
      params:'siteName=' + siteName + '&timeSpan=month&type=CPUUsedBySite',
      text:"Loading...",
      callback:function(panel,success,response){
        if(success){
          var html = '';
          var jsonData = Ext.util.JSON.decode(response.responseText);
          if(jsonData.error){
            html = '<h1>' + jsonData.error + '</h1>';
          }else if(jsonData.result){
            var addres = location.protocol + '//' +  location.hostname + gURLRoot + '/';
            var fullsize = jsonData.result;
            fullsize = addres + 'systems/accountingPlots/getPlotImg?file=' + fullsize;
            html = html + '<img src="';
            html = html + fullsize + '" />';
          }else{
            html = '<h1>Unable to decode server response</h1>';
          }
          panel.update(html);
          if(month.body.dom.firstChild){
            month.body.dom.firstChild.width = month.getInnerWidth() - 10;
            month.body.dom.firstChild.height = month.getInnerHeight() - 10;
          }
        }
      }
    },
    autoScroll:true,
    bodyStyle:'padding: 5px',
    layout:'fit',
    html:'Loading',
    title:'CPU used'
  })
  day.on('resize',function(){
    if(day.body.dom.firstChild){
      day.body.dom.firstChild.width = day.getInnerWidth() - 10;
      day.body.dom.firstChild.height = day.getInnerHeight() - 10;
    }
  })
  week.on('resize',function(){
    if(week.body.dom.firstChild){
      week.body.dom.firstChild.width = week.getInnerWidth() - 10;
      week.body.dom.firstChild.height = week.getInnerHeight() - 10;
    }
  })
  month.on('resize',function(){
    if(month.body.dom.firstChild){
      month.body.dom.firstChild.width = month.getInnerWidth() - 10;
      month.body.dom.firstChild.height = month.getInnerHeight() - 10;
    }
  })
  var panel = new Ext.TabPanel({
    activeTab:0,
    enableTabScroll:true,
    items:[control,info,day,week,month],
    region:'center'
  });
  var window = new Ext.Window({
    iconCls:'icon-grid',
    closable:true,
    autoScroll:true,
    width:600,
    height:350,
    border:true,
    collapsible:true,
    constrain:true,
    constrainHeader:true,
    maximizable:true,
    layout:'fit',
   plain:true,
    shim:false,
    title:siteName,
    items:[panel]
  })
  window.show();
  return window
}
function jump(type,id,submited){
  if(submited == 0){
    alert('Nothing to display');
    return
  }else{
    var url = document.location.protocol + '//' + document.location.hostname + gURLRoot + '/jobs/JobMonitor/display';
    var post_req = '<form id="redirform" action="' + url + '" method="POST" >';
    post_req = post_req + '<input type="hidden" name="' + type + '" value="' + id + '">';
    post_req = post_req + '</form>';
    document.body.innerHTML = document.body.innerHTML + post_req;
    var form = document.getElementById('redirform');
    form.submit();
  }
}
function AJAXerror(response){
  if(response){
    var jsonData = Ext.util.JSON.decode(response.responseText);
  }else{
    alert('Wrong response:',response);
    alert('Error: Server response have wrong data structure');
    return
  }
  if(jsonData){
    if(jsonData['success'] == 'false'){
      alert('Error: ' + jsonData['error']);
      return
    }else{
      alert('data:',jsonData.toSource());
      alert('Error: Server response have wrong data structure');
      return
    }
  }else{
    alert('No json data found');
    alert('Error: Server response have wrong data structure');
    return
  }
}
function status(value){
  if(value == 'Active'){
    return '<img src="'+gURLRoot+'/images/monitoring/done.gif">';
  }else if(value == 'Banned'){
    return '<img src="'+gURLRoot+'/images/monitoring/failed.gif">';
  }else{
    return '<img src="'+gURLRoot+'/images/monitoring/unknown.gif">';
  }
}
